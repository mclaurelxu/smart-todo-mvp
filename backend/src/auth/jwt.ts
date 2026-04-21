import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export function signAuthToken(payload: AuthTokenPayload, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string, secret: string): AuthTokenPayload {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded !== "object" || !decoded || typeof decoded.sub !== "string" || typeof decoded.email !== "string") {
    throw new Error("Invalid token payload.");
  }
  return { sub: decoded.sub, email: decoded.email };
}

