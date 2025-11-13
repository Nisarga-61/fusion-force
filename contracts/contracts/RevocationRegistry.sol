// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RevocationRegistry {
    mapping(bytes32 => bool) private revoked;

    event CredentialRevoked(bytes32 indexed credentialHash);

    function revokeCredential(bytes32 credentialHash) external {
        revoked[credentialHash] = true;
        emit CredentialRevoked(credentialHash);
    }

    function isRevoked(bytes32 credentialHash) external view returns (bool) {
        return revoked[credentialHash];
    }
}
