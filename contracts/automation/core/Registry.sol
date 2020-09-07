pragma solidity ^0.6.0;

import "../../auth/AdminAuth.sol";

contract Registry is AdminAuth {

    struct Entry {
        address contractAddr;
        uint changePeriod;
        bool inChange;
    }

    mapping (bytes32 => Entry) public entries;

    function getAddr(bytes32 _id) public view returns (address) {
        return entries[_id].contractAddr;
    }

    function addNewContract(bytes32 _id, address _contractAddr, uint _changePeriod) public onlyOwner {
        // check if exists already

        // add to mapping

        // logs
    }

    function startChange(bytes32 _id, address _contractAddr, uint _changePeriod) public onlyOwner {
        // check if exists already

        // indicate that a change is on the way
        // can't lower _changePeriod

        // logs
    }

    function approveChange(bytes32 _id, address _contractAddr, uint _changePeriod) public onlyOwner {
        // check if exists already
        // check if change is ready

        // modify mapping

        // logs
    }
}
