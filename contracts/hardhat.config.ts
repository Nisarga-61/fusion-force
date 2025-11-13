import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const PRIVATE_KEY = process.env.CONTRACT_PRIVATE_KEY || "";
const RPC_URL_MUMBAI = process.env.RPC_URL_MUMBAI || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    mumbai: PRIVATE_KEY && RPC_URL_MUMBAI ? {
      url: RPC_URL_MUMBAI,
      accounts: [PRIVATE_KEY],
    } : undefined as any,
  },
};

export default config;