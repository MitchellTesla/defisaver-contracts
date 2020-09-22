pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../core/Registry.sol";
import "../../interfaces/DSProxyInterface.sol";

contract ActionExecutor {

    Registry public constant registry = Registry(0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb);

    // Called by FL executor
    function executeOperation(
        address _tokenAddr,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params)
    external {

        (bytes[] memory actions, address proxy) = abi.decode(_params, (bytes[], address));

        bytes32[] memory responses = new bytes32[](actions.length);

         for (uint i = 0; i < actions.length; ++i) {
            (bytes32 id, bytes memory data) = abi.decode(actions[i], (bytes32, bytes));

            address actionAddr = registry.getAddr(id);

            responses[i] = DSProxyInterface(proxy).execute{value: address(this).balance}(actionAddr,
                abi.encodeWithSignature(
                "executeAction(bytes,bytes32[])",
                data,
                responses
            ));
        }


        // TODO: return FL if there is any
    }
}
