import { getAddress } from "viem";
import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import abi from "../../abis/abi.json";

const useApproveTask = () => {
  const { writeContractAsync } = useWriteContract();

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set");
  }

  return useCallback(
    async (
      taskContractId: number,
      submissionDbId: string,
      submissionContractId?: number
    ) => {
      try {
        if (taskContractId === undefined || !submissionDbId) {
          throw new Error("Missing required parameters: taskContractId, submissionDbId");
        }

        const addressOfContract = getAddress(contractAddress);

        let backendSubmission: any = null;
        let backendTask: any = null;
        {
          const subRes = await fetch(`/api/submissions/${submissionDbId}`);
          if (!subRes.ok) {
            const body = await subRes.json().catch(() => ({ error: "Failed to fetch submission" }));
            throw new Error(body.error ?? "Failed to fetch submission");
          }
          const { submission } = await subRes.json();
          backendSubmission = submission;

          const taskRes = await fetch(`/api/tasks/${submission.taskId}`);
          backendTask = taskRes.ok ? (await taskRes.json()).task : null;
        }

        let subIndex: number | null = submissionContractId ?? null;
        const onChainTaskId = Number(taskContractId + 3); 
        if (subIndex == null) {
          try {
            const count = (await readContract(config, {
              abi,
              address: addressOfContract,
              functionName: "getTaskSubmissionCount",
              args: [Number(onChainTaskId)],
            })) as number;

            for (let i = 0; i < Number(count); i++) {
              const onChain = (await readContract(config, {
                abi,
                address: addressOfContract,
                functionName: "getSubmission",
                args: [Number(onChainTaskId), Number(i)],
              })) as [string, string];
              const [onChainSubmitter, onChainContent] = onChain;
              const matchesSubmitter = backendSubmission?.submitter && String(backendSubmission.submitter).toLowerCase() === String(onChainSubmitter).toLowerCase();
              const matchesContent = backendSubmission?.content && String(backendSubmission.content) === String(onChainContent);
              if (matchesSubmitter || matchesContent) {
                subIndex = i;
                break;
              }
            }
          } catch (e) {
            console.warn("Failed to derive submission index", e);
          }
        }

        if (subIndex == null) {
          throw new Error("Unable to determine on-chain submission index for approval");
        }

        // 1) Approve on-chain
        const onChain = await writeContractAsync({
          abi,
          address: addressOfContract,
          functionName: "approveSubmission",
          args: [Number(onChainTaskId), Number(subIndex)],
        });

        // 2) Mark approved in backend (also closes the task)
        const apiRes = await fetch(`/api/submissions/${submissionDbId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        });
        if (!apiRes.ok) {
          const errBody = await apiRes.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errBody.error ?? "Failed to mark submission approved in backend");
        }
        const { submission } = await apiRes.json();

        return { onChain, submission };
      } catch (err) {
        console.error("Error approving submission:", err);
        throw err instanceof Error ? err : new Error("Failed to approve submission");
      }
    },
    [writeContractAsync, contractAddress]
  );
};

export default useApproveTask;
