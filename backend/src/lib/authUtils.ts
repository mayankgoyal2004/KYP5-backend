import { ApiError } from "../utils/ApiError.js";

/**
 * Validate password complexity (simple version - no DB settings dependency)
 */
export function validatePasswordComplexity(password: string): void {
  if (password.length < 6) {
    throw ApiError.badRequest("Password must be at least 6 characters long.");
  }

  if (!/[A-Z]/.test(password)) {
    throw ApiError.badRequest(
      "Password must contain at least one uppercase letter.",
    );
  }

  if (!/[0-9]/.test(password)) {
    throw ApiError.badRequest("Password must contain at least one number.");
  }
}
