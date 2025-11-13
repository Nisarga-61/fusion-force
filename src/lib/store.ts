// Simple in-memory store for MVP stubs. Replace with MongoDB later.
export type User = { userId: string; username: string; email?: string; passwordHash: string; did?: string; biometric?: { iv: string; tag: string; data: string } };
export type ZKPChallenge = { challengeId: string; userId: string; question: string; correctAnswerHash: string; misguideAnswers: string[]; createdAt: number; expiryTime: number };
export type VerificationRequest = { requestId: string; verifierId: string; holderId: string; requiredClaims: string[]; status: "requested" | "presented" | "validated"; createdAt: number; completedAt?: number };
export type Credential = { credentialId: string; userId: string; type: string; issuer: string; ipfsHash?: string; status: "issued" | "revoked" };

export type BioAttempt = { fails: number; lockedUntil?: number };

export const db = {
  users: new Map<string, User>(),
  zkp: new Map<string, ZKPChallenge>(),
  verifications: new Map<string, VerificationRequest>(),
  credentials: new Map<string, Credential>(),
  revocations: new Set<string>(),
  bioAttempts: new Map<string, BioAttempt>(),
};
