"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function WalletConnector({ onConnected }: { onConnected?: (account: string) => void }) {
  const [account, setAccount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const connect = async () => {
    setError("");
    try {
      if (!(window as any).ethereum) {
        setError("MetaMask not found. Please install it.");
        return;
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const acc = accounts[0];
      setAccount(acc);
      onConnected?.(acc);
    } catch (e: any) {
      setError(e?.message || "Failed to connect wallet");
    }
  };

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    const handler = (accounts: string[]) => {
      if (accounts?.[0]) setAccount(accounts[0]);
    };
    eth.on?.("accountsChanged", handler);
    return () => eth.removeListener?.("accountsChanged", handler);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {account ? (
        <span className="text-sm text-zinc-600">{account.slice(0, 6)}...{account.slice(-4)}</span>
      ) : (
        <button onClick={connect} className="rounded-md bg-black px-3 py-2 text-white hover:bg-zinc-800">
          Connect Wallet
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
