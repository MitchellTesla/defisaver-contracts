pragma solidity ^0.6.0;

import "../../auth/AdminAuth.sol";
import "../../loggers/DefisaverLogger.sol";

contract Registry is AdminAuth {

    DefisaverLogger public constant logger = DefisaverLogger(0x5c55B921f590a89C1Ebe84dF170E655a82b62126);

    struct Entry {
        address contractAddr;
        uint changePeriod;
        uint changeStartTime;
        bool inChange;
        bool exists;
    }

    mapping (bytes32 => Entry) public entries;

    function getAddr(bytes32 _id) public view returns (address) {
        return entries[_id].contractAddr;
    }

    function addNewContract(bytes32 _id, address _contractAddr, uint _changePeriod) public onlyOwner {
        require(!entries[_id].exists, "Entry id already exists");

        entries[_id] = Entry({
            contractAddr: _contractAddr,
            changePeriod: _changePeriod,
            changeStartTime: 0,
            inChange: false,
            exists: true
        });

        logger.Log(address(this), msg.sender, "AddNewContract", abi.encode(_id, _contractAddr, _changePeriod));
    }

    function startChange(bytes32 _id, address _newContractAddr) public onlyOwner {
        require(entries[_id].exists, "Entry id doesn't exists");

        entries[_id].changeStartTime = now;
        entries[_id].inChange = true;

        logger.Log(address(this), msg.sender, "StartChange", abi.encode(_id, _newContractAddr));
    }

    function approveChange(bytes32 _id) public onlyOwner {
        require(entries[_id].exists, "Entry id doesn't exists");
        require(entries[_id].inChange, "Entry not in change process");
        require(entries[_id].changeStartTime + entries[_id].changePeriod > now, "Change not ready yet");

        // modify mapping

        // logs
    }

    function cancelChange(bytes32 _id) public onlyOwner {

    }

}
