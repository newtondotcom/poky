import { z } from "zod";

export const UserPokesUpdateSchema = z.object({
  userId: z.string().min(1),
});

export type UserPokesUpdate = z.infer<typeof UserPokesUpdateSchema>;

export const userPokesSubject = (userId: string) => `user.pokes.${userId}`;
