import jwt from "jsonwebtoken";

const ACCESS_TTL = "30m";
const REFRESH_TTL = "7d";

const getSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET missing");
  return s;
};

export function signAccess(payload: Record<string, any>) {
  return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TTL, algorithm: "HS256" });
}

export function signRefresh(payload: Record<string, any>) {
  return jwt.sign(payload, getSecret(), { expiresIn: REFRESH_TTL, algorithm: "HS256" });
}

export function verifyToken<T = any>(token: string) {
  return jwt.verify(token, getSecret()) as T;
}
