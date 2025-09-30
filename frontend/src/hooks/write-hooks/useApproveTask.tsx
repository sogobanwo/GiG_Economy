import { getAddress } from "viem";
import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import abi from "../../abis/abi.json";

const useApproveTask = () => {  
  const { writeContractAsync } = useWriteContract();

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set"
    );
  }

  return useCallback(
    async (
      task_id: number,
      submission_id: number,
    ) => {
      try {
        // Validate inputs
        if ( !task_id || !submission_id) {
          throw new Error("All parameters are required");
        }

        // Ensure the contract address is valid
        const address = getAddress(contractAddress);

        // Call the contract
        const result = await writeContractAsync({
          abi,
          address,
          functionName: "approveSubmission",
          args: [task_id, submission_id],
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

export default useApproveTask;
