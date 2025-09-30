import { getAddress } from "viem";
import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import abi from "../../abis/abi.json";

const useSubmitTask = () => {
  const { writeContractAsync } = useWriteContract(); 

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set");
  }

  return useCallback(
    async (task_id: number, content: string) => {
      try {
        if (task_id === undefined || !content) {
          throw new Error("All parameters are required");
        }
        
        const address = getAddress(contractAddress);

        const result = await writeContractAsync({
          abi,
          address,
          functionName: "submitTask",
          args: [task_id, content],
        });

        return result;
      } catch (err) {
        console.error("Error submitting task:", err);
        throw err instanceof Error ? err : new Error("Failed to submit task");
      }
    },
    [writeContractAsync, contractAddress]
  );
};

export default useSubmitTask;