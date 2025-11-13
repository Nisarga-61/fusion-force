// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CredentialRegistry {
    struct Credential {
        address issuer;
        address holder;
        string credentialType;
        bytes32 ipfsHash; // CID hash placeholder (bytes32 for simplicity)
        bool revoked;
        bool exists;
    }

    mapping(bytes32 => Credential) private credentials; // credentialId => credential

    event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, address indexed holder, string credentialType, bytes32 ipfsHash);
    event CredentialRevoked(bytes32 indexed credentialId);

    function issueCredential(address holder, string calldata credentialType, bytes32 ipfsHash, bytes calldata /*signature*/ ) external returns (bytes32) {
        require(holder != address(0), "invalid holder");
        bytes32 credentialId = keccak256(abi.encode(msg.sender, holder, credentialType, ipfsHash, block.timestamp));
        require(!credentials[credentialId].exists, "exists");
        credentials[credentialId] = Credential({
            issuer: msg.sender,
            holder: holder,
            credentialType: credentialType,
            ipfsHash: ipfsHash,
            revoked: false,
            exists: true
        });
        emit CredentialIssued(credentialId, msg.sender, holder, credentialType, ipfsHash);
        return credentialId;
    }

    function revokeCredential(bytes32 credentialId) external {
        Credential storage c = credentials[credentialId];
        require(c.exists, "not found");
        require(c.issuer == msg.sender, "only issuer");
        c.revoked = true;
        emit CredentialRevoked(credentialId);
    }

    function verifyCredential(bytes32 credentialId) external view returns (bool) {
        Credential storage c = credentials[credentialId];
        return c.exists && !c.revoked;
    }

    function getCredentialStatus(bytes32 credentialId) external view returns (bool) {
        Credential storage c = credentials[credentialId];
        return c.exists && !c.revoked;
    }
}
