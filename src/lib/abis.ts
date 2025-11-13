export const DIDsAbi = [
  { "type": "function", "name": "createDID", "stateMutability": "nonpayable", "inputs": [
      {"name":"user","type":"address"}, {"name":"didHash","type":"bytes32"}
    ], "outputs": [] },
  { "type": "function", "name": "resolveDID", "stateMutability": "view", "inputs": [
      {"name":"user","type":"address"}
    ], "outputs": [{"name":"","type":"bytes32"}] },
  { "type": "function", "name": "updateDID", "stateMutability": "nonpayable", "inputs": [
      {"name":"user","type":"address"}, {"name":"newDidHash","type":"bytes32"}
    ], "outputs": [] },
  { "type": "function", "name": "getDIDDocument", "stateMutability": "view", "inputs": [
      {"name":"user","type":"address"}
    ], "outputs": [{"name":"","type":"string"}] }
] as const;

export const CredentialRegistryAbi = [
  {"type":"function","name":"issueCredential","stateMutability":"nonpayable","inputs":[
    {"name":"holder","type":"address"}, {"name":"credentialType","type":"string"}, {"name":"ipfsHash","type":"bytes32"}, {"name":"signature","type":"bytes"}
  ],"outputs":[{"name":"","type":"bytes32"}]},
  {"type":"function","name":"verifyCredential","stateMutability":"view","inputs":[{"name":"credentialId","type":"bytes32"}],"outputs":[{"name":"","type":"bool"}]},
  {"type":"function","name":"revokeCredential","stateMutability":"nonpayable","inputs":[{"name":"credentialId","type":"bytes32"}],"outputs":[]},
  {"type":"function","name":"getCredentialStatus","stateMutability":"view","inputs":[{"name":"credentialId","type":"bytes32"}],"outputs":[{"name":"","type":"bool"}]}
] as const;
