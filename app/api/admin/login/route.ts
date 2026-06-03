import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminCredential,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Admin access is not configured on this server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password =
    body &&
    typeof body === "object" &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!verifyAdminCredential(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const sessionToken = await createAdminSessionToken();
  if (!sessionToken) {
    return NextResponse.json(
      { error: "Unable to create admin session." },
      { status: 503 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    sessionToken,
    adminSessionCookieOptions()
  );
  return response;
}
