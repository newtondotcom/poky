import { createContextKey } from "@connectrpc/connect";
import { UserSchema, type User } from "./proto/poky/v1/pokes_service_pb";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { create } from "@bufbuild/protobuf";

const userMessage = create(UserSchema, {
  id: "d",
  name: "d",
  username: "d",
  image: "",
  createdAt: timestampFromDate(new Date()),
});

export const kUser = createContextKey<User>(userMessage, {
  description: "Current user", // Description useful for debugging
});
