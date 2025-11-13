import { ethers } from "ethers";

export const getBrowserProvider = () => {
  if (typeof window === "undefined") return undefined;
  const eth = (window as any).ethereum;
  if (!eth) return undefined;
  return new ethers.BrowserProvider(eth);
};

export const getSigner = async () => {
  const provider = getBrowserProvider();
  if (!provider) throw new Error("No provider");
  return await provider.getSigner();
};
