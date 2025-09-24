import { getAddress } from "viem";
import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import abi from "../../abis/abi.json";

const useCreateTask = () => {
  const { writeContractAsync } = useWriteContract();

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set"
    );
  }

  return useCallback(
    async (
      title: string,
      description: string,
      reward: bigint,
      publicHash: string,
      difficulty: number
    ) => {
      try {
        // Validate inputs
        if (!title || !description || !publicHash || difficulty === undefined) {
          throw new Error("All parameters are required");
        }

        // Ensure the contract address is valid
        const address = getAddress(contractAddress);

        // Call the contract
        const result = await writeContractAsync({
          abi,
          address,
          functionName: "createTask",
          args: [title, reward, description, publicHash, difficulty],
          value: reward,
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

export default useCreateTask;
