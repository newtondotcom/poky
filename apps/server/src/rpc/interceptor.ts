import { db } from "@/db";
import { user } from "@/db/schema";
import { generateUserAnonymizedData } from "@/lib/anonymization";
import type { Interceptor } from "@connectrpc/connect";
import { Code, ConnectError } from "@connectrpc/connect";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { kUser } from "./context";
import { UserSchema, type User } from "./proto/poky/v1/pokes_service_pb";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { create } from "@bufbuild/protobuf";

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------
const JWKS_URI = "https://myr-project.eu/application/o/newton/jwks/";
const USER_INFO_URI = "https://myr-project.eu/application/o/userinfo/";
const AUDIENCE = "t9xFI53nHMTMRduUB1Kt2fUpV1IcFOfNXUZHjpmZ";

// Simple in-memory cache (can be swapped with Redis)
const tokenCache = new Map<string, { user: User; exp: number }>();

const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

// -----------------------------------------------------------------------------
// TOKEN VERIFICATION
// -----------------------------------------------------------------------------
async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    audience: AUDIENCE,
    issuer: "https://myr-project.eu/application/o/newton/",
  });
  return payload;
}

// -----------------------------------------------------------------------------
// USER FETCHING / CREATION
// -----------------------------------------------------------------------------
async function getOrCreateUser(userInfo: any) {
  const userId = userInfo.sub;

  const existing = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const anonymized = generateUserAnonymizedData(userId);

  const newUser = {
    id: userId,
    name: userInfo.fullName || "",
    username: userInfo.uid || userInfo.nickname || "",
    image: userInfo.pictureURL || null,
    email: userInfo.email,
    emailVerified: userInfo.email_verified,
    usernameAnonymized: anonymized.usernameAnonymized,
    pictureAnonymized: anonymized.pictureAnonymized,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(user).values(newUser);
  return newUser;
}

// -----------------------------------------------------------------------------
// USER INFO ENDPOINT
// -----------------------------------------------------------------------------
async function fetchUserInfo(accessToken: string) {
  const response = await fetch(USER_INFO_URI, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch user info: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
}

// -----------------------------------------------------------------------------
// INTERCEPTOR
// -----------------------------------------------------------------------------
export const authInterceptor: Interceptor = (next) => async (req) => {
  const authHeader = req.header.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new ConnectError(
      "Missing or invalid Authorization header",
      Code.Unauthenticated,
    );

  const token = authHeader.slice("Bearer ".length);

  // 🔍 Check cache
  const cached = tokenCache.get(token);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp > now) {
    // still valid
    req.contextValues.set(kUser, cached.user);
    return next(req);
  }

  // 🔐 Verify token
  let payload;
  try {
    payload = await verifyToken(token);
  } catch (err) {
    throw new ConnectError("Invalid or expired token", Code.Unauthenticated);
  }

  // 🧾 Fetch user info if needed
  const userInfo = await fetchUserInfo(token);
  const dbUser = await getOrCreateUser(userInfo);
  const userMessage = create(UserSchema, {
    id: dbUser?.id,
    name: dbUser?.name,
    username: dbUser?.username,
    image: dbUser?.image,
    createdAt: timestampFromDate(dbUser?.createdAt || new Date()),
  });

  // 🧠 Cache it until the JWT expires
  tokenCache.set(token, {
    user: userMessage,
    exp: payload.exp || now + 3600, // fallback: 1 hour
  });

  // Add user to context
  req.contextValues.set(kUser, userMessage);

  return next(req);
};
