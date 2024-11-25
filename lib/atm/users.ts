import { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabase } from "../supabase";
import { UserNotFoundError } from "./errors";
import { SupabaseUserMetadata, User } from "./types";

export async function getUserById(userId: string): Promise<User> {
  const { error, data } = await getSupabase().auth.admin.getUserById(userId);

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new UserNotFoundError(`User '${userId}' not found`);
  }

  return transformSupabaseUserToUser(data.user);
}

export async function updateUserById(
  userId: string,
  {
    email,
    ...userMetadata
  }: Partial<Omit<User, "id" | "updatedAt" | "createdAt">>
): Promise<void> {
  await getSupabase().auth.admin.updateUserById(userId, {
    email: email,
    user_metadata: userMetadata satisfies Partial<SupabaseUserMetadata>,
  });
}

export function transformSupabaseUserToUser(supabaseUser: SupabaseUser): User {
  const metadata = SupabaseUserMetadata.parse(supabaseUser.user_metadata);

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    ...metadata,
  };
}
