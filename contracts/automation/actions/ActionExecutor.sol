pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Registry.sol";
import "../../interfaces/DSProxyInterface.sol";

contract ActionExecutor {

    Registry public constant registry = Registry(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    // Called by FL executor
    function executeOperation(
        address _tokenAddr,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params)
    external {

        (bytes[] memory actions, address proxy) = abi.decode(_params, (bytes[], address));

         for (uint i = 0; i < actions.length; ++i) {
            (bytes32 id, bytes memory data) = abi.decode(actions[i], (bytes32, bytes));

            address actionAddr = registry.getAddr(id);

            DSProxyInterface(proxy).execute{value: address(this).balance}(actionAddr,
                abi.encodeWithSignature(
                "executeAction(bytes)",
                data
            ));
        }
    }
}
