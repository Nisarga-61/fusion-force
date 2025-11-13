// Simple in-memory store for MVP stubs. Replace with MongoDB later.
export type User = { userId: string; email: string; passwordHash: string; did?: string };
export type ZKPChallenge = { challengeId: string; userId: string; question: string; correctAnswerHash: string; misguideAnswers: string[]; createdAt: number; expiryTime: number };
export type VerificationRequest = { requestId: string; verifierId: string; holderId: string; requiredClaims: string[]; status: "requested" | "presented" | "validated"; createdAt: number; completedAt?: number };
export type Credential = { credentialId: string; userId: string; type: string; issuer: string; ipfsHash?: string; status: "issued" | "revoked" };

export const db = {
  users: new Map<string, User>(),
  zkp: new Map<string, ZKPChallenge>(),
  verifications: new Map<string, VerificationRequest>(),
  credentials: new Map<string, Credential>(),
  revocations: new Set<string>(),
};
