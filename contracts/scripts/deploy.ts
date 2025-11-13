import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const DIDs = await ethers.getContractFactory("DIDs");
  const dids = await DIDs.deploy();
  await dids.waitForDeployment();
  console.log("DIDs:", await dids.getAddress());

  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const cred = await CredentialRegistry.deploy();
  await cred.waitForDeployment();
  console.log("CredentialRegistry:", await cred.getAddress());

  const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
  const rev = await RevocationRegistry.deploy();
  await rev.waitForDeployment();
  console.log("RevocationRegistry:", await rev.getAddress());

  const ConsentNFT = await ethers.getContractFactory("ConsentNFT");
  const consent = await ConsentNFT.deploy();
  await consent.waitForDeployment();
  console.log("ConsentNFT:", await consent.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
