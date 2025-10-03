import { getAddress } from "viem";
import { useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import abi from "../../abis/abi.json";

const useCreateTask = () => {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

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
      description: string,
      bounty: bigint,
    ) => {
      try {
        // Validate inputs
        if (!description || !bounty) {
          throw new Error("All parameters are required");
        }

        if (!address) {
          throw new Error("Wallet not connected: missing creator address");
        }

        // Ensure the contract address is valid
        const addressOfContract = getAddress(contractAddress);

        // 1) Persist to backend first
        const apiRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: description, bounty: bounty.toString(), creator: address }),
        });

        if (!apiRes.ok) {
          const errBody = await apiRes.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errBody.error ?? "Failed to persist task to backend");
        }

        const { task } = await apiRes.json();

        // 2) Call the contract
        const result = await writeContractAsync({
          abi,
          address: addressOfContract,
          functionName: "createTask",
          args: [description, bounty],
        });

        return { onChain: result, task };
      } catch (err) {
        console.error("Error creating task:", err);
        throw err instanceof Error ? err : new Error("Failed to create task");
      }
    },
    [writeContractAsync, contractAddress, tokenAddress, address]
  );
};

export default useCreateTask;
