import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
};
