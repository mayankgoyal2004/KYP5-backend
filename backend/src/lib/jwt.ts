import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "./env.js";

export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

/**
 * Generate Access Token (short-lived)
 */
export function generateAccessToken(
  payload: AccessTokenPayload,
  expiresIn?: string | number,
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (expiresIn || env.JWT_EXPIRES_IN) as SignOptions["expiresIn"],
  });
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}
