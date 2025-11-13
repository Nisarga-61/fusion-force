// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DIDs {
    struct DIDRecord {
        bytes32 didHash;
        string document; // optional JSON string
    }

    mapping(address => DIDRecord) private records;

    event DIDCreated(address indexed user, bytes32 didHash);
    event DIDUpdated(address indexed user, bytes32 newDidHash);
    event DIDResolved(address indexed user, bytes32 didHash);

    function createDID(address user, bytes32 didHash) external {
        require(user != address(0), "invalid user");
        require(records[user].didHash == bytes32(0), "DID exists");
        records[user].didHash = didHash;
        emit DIDCreated(user, didHash);
    }

    function updateDID(address user, bytes32 newDidHash) external {
        require(user != address(0), "invalid user");
        require(records[user].didHash != bytes32(0), "DID not found");
        records[user].didHash = newDidHash;
        emit DIDUpdated(user, newDidHash);
    }

    function setDIDDocument(address user, string calldata document_) external {
        require(records[user].didHash != bytes32(0), "DID not found");
        records[user].document = document_;
    }

    function resolveDID(address user) external view returns (bytes32) {
        bytes32 h = records[user].didHash;
        require(h != bytes32(0), "DID not found");
        return h;
    }

    function getDIDDocument(address user) external view returns (string memory) {
        return records[user].document;
    }
}
