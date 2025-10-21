import { db } from "@/db";
import { user } from "@/db/schema";
import { generateUserAnonymizedData } from "@/lib/anonymization";
import type { Interceptor } from "@connectrpc/connect";
import { Code, ConnectError } from "@connectrpc/connect";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { kUserId } from "./context";
import logger from "@/lib/logger";

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------
const JWKS_URI = "https://myr-project.eu/application/o/newton/jwks/";
const USER_INFO_URI = "https://myr-project.eu/application/o/userinfo/";
const AUDIENCE = "t9xFI53nHMTMRduUB1Kt2fUpV1IcFOfNXUZHjpmZ";

// Simple in-memory cache (can be swapped with Redis)
const tokenCache = new Map<string, { userId: string; exp: number }>();

const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

// -----------------------------------------------------------------------------
// TOKEN VERIFICATION
// -----------------------------------------------------------------------------
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: AUDIENCE,
      issuer: "https://myr-project.eu/application/o/newton/",
    });
    return payload;
  } catch (error) {
    logger.error(error);
  }
}

// -----------------------------------------------------------------------------
// USER CREATION (NON-BLOCKING)
// -----------------------------------------------------------------------------

// Non-blocking user creation function
async function createUserInBackgroundIfNeeded(oauthToken: any, userId: string) {
  try {
    // First check if user already exists
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existing) {
      logger.info(`User already exists: ${userId}`);
      return;
    }
    
    // check values hasnt changed

    // Fetch user info from OAuth provider
    const userInfo = await fetchUserInfo(oauthToken);
    logger.info(`User info: ${JSON.stringify(userInfo)}`);

    const anonymized = generateUserAnonymizedData(userId);

    const newUser = {
      id: userId,
      name: userInfo.name || "",
      username: userInfo.preferred_username || userInfo.nickname || "",
      picture: userInfo.picture || null,
      email: userInfo.email,
      emailVerified: userInfo.email_verified,
      usernameAnonymized: anonymized.usernameAnonymized,
      pictureAnonymized: anonymized.pictureAnonymized,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(user).values(newUser);
    logger.info(`User created in background: ${userId}`);
  } catch (error) {
    logger.error(`Failed to create user in background: ${userId}`, error);
  }
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
  const authHeader = req.header.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")){
    logger.error("Missing or invalid Authorization header");
    throw new ConnectError(
      "Missing or invalid Authorization header",
      Code.Unauthenticated,
    );
  };

  const token = authHeader.slice("Bearer ".length);

  // 🔍 Check cache
  const cached = tokenCache.get(token);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp > now) {
    // still valid
    req.contextValues.set(kUserId, cached.userId);
    return next(req);
  }

  // 🔐 Verify token
  let payload;
  try {
    payload = await verifyToken(token);
  } catch (err) {
    logger.error("Token verification failed:", err);
    throw new ConnectError("Invalid or expired token", Code.Unauthenticated);
  }

  // 🧾 Get user ID from payload and ensure user exists in background
  const userId = payload?.sub;
  if (!userId) {
    throw new ConnectError("Invalid token: missing user ID", Code.Unauthenticated);
  }

  // Ensure user exists in database (non-blocking)
  createUserInBackgroundIfNeeded(token,userId);
  
  logger.info("user ID added to context")

  // 🧠 Cache it until the JWT expires
  tokenCache.set(token, {
    userId: userId,
    exp: payload?.exp || now + 3600, // fallback: 1 hour
  });

  // Add user ID to context
  req.contextValues.set(kUserId, userId);

  return next(req);
};
