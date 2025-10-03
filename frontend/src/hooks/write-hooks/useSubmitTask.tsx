import { getAddress } from "viem";
import { useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import abi from "../../abis/abi.json";

const useSubmitTask = () => {
  const { writeContractAsync } = useWriteContract(); 
  const { address } = useAccount();

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set");
  }

  return useCallback(
    async (task_id: number, content: string, taskDbId?: string) => {
      try {
        if (task_id === undefined || !content) {
          throw new Error("All parameters are required");
        }
        if (!address) {
          throw new Error("Wallet not connected: missing submitter address");
        }
        
        const addressOfContract = getAddress(contractAddress);

          const result = await writeContractAsync({
          abi,
          address: addressOfContract,
          functionName: "submitTask",
          // i added 3 so the task_id from the backend matches the taskid on the contract
          args: [task_id+3, content],
        });

        if (taskDbId) {
          const apiRes = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: taskDbId, submitter: address, content }),
          });
          if (!apiRes.ok) {
            const errBody = await apiRes.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errBody.error ?? "Failed to persist submission to backend");
          }
          await apiRes.json();
        }

        return { onChain: result };
      } catch (err) {
        console.error("Error submitting task:", err);
        throw err instanceof Error ? err : new Error("Failed to submit task");
      }
    },
    [writeContractAsync, contractAddress, address]
  );
};

export default useSubmitTask;