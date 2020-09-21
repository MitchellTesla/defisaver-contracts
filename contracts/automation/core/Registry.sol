pragma solidity ^0.6.0;

import "../../auth/AdminAuth.sol";
import "../../loggers/DefisaverLogger.sol";

contract Registry is AdminAuth {

    DefisaverLogger public constant logger = DefisaverLogger(0x5c55B921f590a89C1Ebe84dF170E655a82b62126);

    struct Entry {
        address contractAddr;
        uint waitPeriod;
        uint changeStartTime;
        bool inChange;
        bool exists;
    }

    mapping (bytes32 => Entry) public entries;
    mapping (bytes32 => address) public pendingAddresses;

    function getAddr(bytes32 _id) public view returns (address) {
        return entries[_id].contractAddr;
    }

    function addNewContract(bytes32 _id, address _contractAddr, uint _waitPeriod) public onlyOwner {
        require(!entries[_id].exists, "Entry id already exists");

        entries[_id] = Entry({
            contractAddr: _contractAddr,
            waitPeriod: _waitPeriod,
            changeStartTime: 0,
            inChange: false,
            exists: true
        });

        logger.Log(address(this), msg.sender, "AddNewContract", abi.encode(_id, _contractAddr, _waitPeriod));
    }

    function startContractChange(bytes32 _id, address _newContractAddr) public onlyOwner {
        require(entries[_id].exists, "Entry id doesn't exists");

        entries[_id].changeStartTime = now;
        entries[_id].inChange = true;

        pendingAddresses[_id] = _newContractAddr;

        logger.Log(address(this), msg.sender, "StartChange", abi.encode(_id, _newContractAddr));
    }

    function approveContractChange(bytes32 _id) public onlyOwner {
        require(entries[_id].exists, "Entry id doesn't exists");
        require(entries[_id].inChange, "Entry not in change process");
        require((entries[_id].changeStartTime + entries[_id].waitPeriod) > now, "Change not ready yet");
        require(pendingAddresses[_id] != address(0), "New addr is not empty");

        entries[_id].contractAddr = pendingAddresses[_id];
        entries[_id].inChange = false;
        entries[_id].changeStartTime = 0;

        pendingAddresses[_id] = address(0);

        logger.Log(address(this), msg.sender, "ApproveChange", abi.encode(_id, entries[_id].contractAddr));
    }

    function cancelContractChange(bytes32 _id) public onlyOwner {
        require(entries[_id].exists, "Entry id doesn't exists");
        require(entries[_id].inChange, "Entry is not change process");


        pendingAddresses[_id] = address(0);
        entries[_id].inChange = false;
        entries[_id].changeStartTime = 0;

        logger.Log(address(this), msg.sender, "CancelChange", abi.encode(_id));
    }

    function changeWaitPeriod(bytes32 _id, uint _newWaitPeriod) public onlyOwner {
        require(entries[_id].exists, "Entry id doesn't exists");
        require(_newWaitPeriod > entries[_id].waitPeriod, "Entry id doesn't exists");

        entries[_id].waitPeriod = _newWaitPeriod;

        logger.Log(address(this), msg.sender, "ChangeWaitPeriod", abi.encode(_id, _newWaitPeriod));
    }

}
