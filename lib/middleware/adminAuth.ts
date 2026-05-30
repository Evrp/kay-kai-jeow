import { NextRequest } from "next/server";

/**
 * Checks the Authorization header of the request for Bearer Token
 * matching the configured ADMIN_SECRET_TOKEN env variable.
 */
export function verifyAdminAuth(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET_TOKEN;
  
  if (!adminSecret) {
    console.error("ADMIN_SECRET_TOKEN environment variable is not defined");
    return false;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return token === adminSecret;
  }

  // Also check query parameter for convenience in some dashboard requests or file links
  const { searchParams } = new URL(req.url);
  const queryToken = searchParams.get("token");
  if (queryToken) {
    return queryToken === adminSecret;
  }

  // Also check standard custom header if needed
  const xAdminToken = req.headers.get("x-admin-token");
  if (xAdminToken) {
    return xAdminToken === adminSecret;
  }

  return false;
}
