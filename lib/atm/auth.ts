import { cookies, headers } from "next/headers";
import { Session } from "./types";
import { transformSupabaseUserToUser } from "./users";
import { getSupabase } from "../supabase";
import { User as SupabaseUser, isAuthApiError } from "@supabase/supabase-js";
import { SessionNotFoundError } from "./errors";

type TokenStore = "cookie" | "authorization-header";

export async function findSession(store?: TokenStore): Promise<Session | null> {
  const token = await getRequestSessionToken(store);

  if (!token) {
    return null;
  }

  const { error, data } = await getSupabase().auth.getUser(token);

  if (error) {
    if (isAuthApiError(error) && error.status === 403) {
      return null;
    }

    throw error;
  }

  if (data.user) {
    return await createSessionFromSupabaseUser(token, data.user);
  }

  return null;
}

async function getRequestSessionToken(
  store: TokenStore = "cookie"
): Promise<string | null> {
  if (store === "cookie") {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value || null;
  } else {
    const headersStore = await headers();
    const authorizationHeader = headersStore.get("authorization");
    const result = authorizationHeader?.match(/^bearer\s*(.+)$/i);

    return result?.[1] || null;
  }
}

export async function getSession(store?: TokenStore): Promise<Session> {
  const session = await findSession(store);

  if (!session) {
    throw new SessionNotFoundError(`Session not found`);
  }

  return session;
}

export async function findOrCreateAnonymousCookieSession(): Promise<Session> {
  const session = await findSession();

  if (!session) {
    const { data, error } = await getSupabase().auth.signInAnonymously();

    if (error) {
      throw error;
    }

    if (!data.session?.access_token || !data.user) {
      throw new Error(`Could not sign in anonymously`);
    }

    const cookieStore = await cookies();
    cookieStore.set("token", data.session.access_token);

    return createSessionFromSupabaseUser(data.session.access_token, data.user);
  } else {
    return session;
  }
}

export async function getApiSession(): Promise<Session> {
  return await getSession("authorization-header");
}

export async function findApiSession(): Promise<Session> {
  return await getSession("authorization-header");
}

export async function destroySession(store?: TokenStore): Promise<void> {
  if (store !== "cookie") {
    throw new Error(`Cannot destroy session not in cookie store `);
  }

  const session = await getSession("cookie");

  await getSupabase().auth.admin.signOut(session.id);

  const cookieStore = await cookies();
  cookieStore.delete("token");
}

async function createSessionFromSupabaseUser(
  id: string,
  supabaseUser: SupabaseUser
): Promise<Session> {
  return {
    id,
    user: transformSupabaseUserToUser(supabaseUser),
  };
}
