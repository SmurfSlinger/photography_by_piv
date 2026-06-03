import { timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "admin_session";

const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

/** Server-only admin credential (ADMIN_ACCESS_TOKEN preferred, else ADMIN_PASSWORD). */
export function getConfiguredAdminCredential(): string | null {
  const token = process.env.ADMIN_ACCESS_TOKEN?.trim();
  if (token) return token;
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (password) return password;
  return null;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(getConfiguredAdminCredential() && getSessionSecret());
}

function safeEqualProvided(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyAdminCredential(provided: string): boolean {
  const expected = getConfiguredAdminCredential();
  if (!expected || !provided.trim()) return false;
  return safeEqualProvided(provided.trim(), expected);
}

type AdminSessionPayload = {
  admin: true;
};

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  return new SignJWT({ admin: true } satisfies AdminSessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifyAdminSessionToken(
  token: string
): Promise<boolean> {
  const secret = getSessionSecret();
  if (!secret) return false;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isAdminAuthConfigured()) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}
