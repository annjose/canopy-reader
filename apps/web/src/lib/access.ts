import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// Cloudflare Access configuration
const TEAM_DOMAIN = "annjose.cloudflareaccess.com";
const AUDIENCE =
  "41dc08c0040bfada856b698efcb4516f42bb85ff43247239d2bb5f198f89c3a5";
const ISSUER = `https://${TEAM_DOMAIN}`;

const JWKS = createRemoteJWKSet(
  new URL(`https://${TEAM_DOMAIN}/cdn-cgi/access/certs`),
);

export type AccessUser = {
  email: string;
  payload: JWTPayload;
};

const ALLOWED_EMAILS = new Set([
  "ann.jose@gmail.com",
  "georgeck@gmail.com",
]);

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Enforces Cloudflare Access for API routes.
 *
 * - In production/non-localhost: requires Cf-Access-Jwt-Assertion
 * - In localhost dev: bypasses Access so local development works.
 */
export async function requireAccess(
  request: NextRequest,
): Promise<AccessUser | NextResponse> {
  const hostname = request.nextUrl.hostname;
  if (isLocalhost(hostname)) {
    return { email: "local@localhost", payload: {} };
  }

  const token =
    request.headers.get("Cf-Access-Jwt-Assertion") ??
    request.headers.get("cf-access-jwt-assertion");

  if (!token) return unauthorized();

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const email =
      (payload.email as string | undefined) ||
      (payload["https://cloudflareaccess.com/email"] as string | undefined);

    if (!email) return unauthorized();

    if (!ALLOWED_EMAILS.has(email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return { email, payload };
  } catch {
    return unauthorized();
  }
}
