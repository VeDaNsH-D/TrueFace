// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrueFaceID {
    string public name = "TrueFace Verified Identity";
    string public symbol = "TFID";
    address public owner;

    // Mapping to store verified addresses
    mapping(address => bool) public isVerified;
    mapping(address => string) public proofHash; // IPFS hash of the verification selfie

    event IdentityVerified(address indexed user, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    // Only our backend (the owner) can call this after AI checks pass
    function mintIdentity(address _user, string memory _proofHash) external {
        require(msg.sender == owner, "Only TrueFace Admin can verify");
        require(!isVerified[_user], "User already verified");

        isVerified[_user] = true;
        proofHash[_user] = _proofHash;

        emit IdentityVerified(_user, block.timestamp);
    }

    function checkStatus(address _user) external view returns (bool) {
        return isVerified[_user];
    }
}
