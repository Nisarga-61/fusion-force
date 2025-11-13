import { create } from "zustand";

export type DID = { id: string; document?: any };
export type StoredCredential = { id: string; type: string; issuer: string; issueDate: string; status: "valid" | "revoked" | "pending" };

type State = {
  account?: string;
  did?: DID;
  credentials: StoredCredential[];
  setAccount: (a?: string) => void;
  setDID: (d?: DID) => void;
  addCredential: (c: StoredCredential) => void;
};

export const useAppStore = create<State>((set) => ({
  account: undefined,
  did: undefined,
  credentials: [],
  setAccount: (a) => set({ account: a }),
  setDID: (d) => set({ did: d }),
  addCredential: (c) => set((s) => ({ credentials: [c, ...s.credentials] })),
}));
