import { getAddress } from "viem";
import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import abi from "../../abis/mockerc20.json";

const useApproveToken = () => {  
  const { writeContractAsync } = useWriteContract();

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  const tokenAddress = process.env.NEXT_PUBLIC_MOCK_TOKEN;

  if (!contractAddress) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set"
    );
  }

    if (!tokenAddress) {
    throw new Error(
      "NEXT_PUBLIC_MOCK_TOKEN environment variable is not set"
    );
  }

  return useCallback(
    async (
      amount: BigInt,
    ) => {
      try {
        // Ensure the contract address is valid
        const address = getAddress(tokenAddress);

        // Call the contract
        const result = await writeContractAsync({
          abi,
          address,
          functionName: "approve",
          args: [contractAddress, amount],
        });
        
        console.log(result);
        return result;
      } catch (err) {
        console.error("Error creating task:", err);
        throw err instanceof Error ? err : new Error("Failed to create task");
      }
    },
    [writeContractAsync, contractAddress]
  );
};

export default useApproveToken;
