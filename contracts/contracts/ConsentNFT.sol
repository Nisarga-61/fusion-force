// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConsentNFT is ERC721, Ownable {
    struct ConsentTerms {
        bytes32 credentialId;
        uint256 expiryTime;
        string[] allowedClaims;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => ConsentTerms) private _terms;

    constructor() ERC721("Adaptive Consent", "ACONSENT") Ownable(msg.sender) {}

    function mintConsentToken(
        address holder,
        bytes32 credentialId,
        uint256 expiryTime,
        string[] memory allowedClaims
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(holder, tokenId);
        _terms[tokenId] = ConsentTerms({
            credentialId: credentialId,
            expiryTime: expiryTime,
            allowedClaims: allowedClaims
        });
    }

    function transferConsent(address recipient, uint256 tokenId) external {
        safeTransferFrom(msg.sender, recipient, tokenId);
    }

    function revokeConsent(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "not allowed");
        _burn(tokenId);
        delete _terms[tokenId];
    }

    function getConsentTerms(uint256 tokenId) external view returns (ConsentTerms memory) {
        require(_exists(tokenId), "invalid tokenId");
        return _terms[tokenId];
    }
}
