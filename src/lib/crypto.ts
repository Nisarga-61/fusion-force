import crypto from "crypto";

const keyFromEnv = () => {
  const b64 = process.env.BIOMETRIC_KEY;
  if (!b64) throw new Error("BIOMETRIC_KEY missing");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("BIOMETRIC_KEY must be 32 bytes (base64)");
  return key;
};

export function encryptTemplate(plain: Buffer) {
  const key = keyFromEnv();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString("base64"), tag: tag.toString("base64"), data: enc.toString("base64") };
}

export function decryptTemplate(ivB64: string, tagB64: string, dataB64: string) {
  const key = keyFromEnv();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec;
}
