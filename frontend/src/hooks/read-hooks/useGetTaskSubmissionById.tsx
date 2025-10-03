import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";


const useGetTaskSubmissionById = (task_id: number, submission_id: number) => {
  const [state, setState] = useState<{ loading: boolean; data: any | null; error?: string }>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        let onChain: any = null;

        if (contractAddress) {
          try {
            const addr = getAddress(contractAddress);
            onChain = await readContract(config, {
              abi,
              address: addr,
              functionName: 'getTaskSubmission',
              args: [Number(task_id), Number(submission_id)],
            });
          } catch (e) {
            console.warn('Failed to read submission from contract', e);
          }
        }

        const tasksRes = await fetch('/api/tasks');
        const { tasks } = tasksRes.ok ? await tasksRes.json() : { tasks: [] };
        const dbTask = (tasks || []).find((t: any) => Number(t.contractTaskId) === Number(task_id)) ?? null;

        let dbSubmission: any = null;
        if (dbTask) {
          const subsRes = await fetch('/api/submissions');
          const { submissions } = subsRes.ok ? await subsRes.json() : { submissions: [] };
          dbSubmission = (submissions || []).find((s: any) => String(s.taskId) === String(dbTask._id) && Number(s.contractSubId) === Number(submission_id)) ?? null;
        }

        if (!onChain && !dbSubmission) {
          throw new Error('Submission not found on-chain or in DB');
        }

        const mappedFromDb = dbSubmission ? {
          dbId: dbSubmission._id,
          taskDbId: dbSubmission.taskId,
          submitter: dbSubmission.submitter,
          content: dbSubmission.content,
          contractSubId: dbSubmission.contractSubId ?? Number(submission_id),
          approved: Boolean(dbSubmission.approved ?? false),
          createdAt: dbSubmission.createdAt,
        } : null;

        if (onChain) {
          const [onChainSubmitter, onChainContent] = onChain as [`0x${string}`, string];
          const merged = {
            ...(mappedFromDb ?? {
              dbId: null,
              taskDbId: dbTask?._id ?? null,
              submitter: onChainSubmitter,
              content: onChainContent,
              contractSubId: Number(submission_id),
              approved: false,
              createdAt: null,
            }),
            submitter: onChainSubmitter ?? mappedFromDb?.submitter,
            content: onChainContent ?? mappedFromDb?.content,
          };
          setState({ loading: false, data: merged });
          return;
        }

        setState({ loading: false, data: mappedFromDb });
      } catch (e: any) {
        setState({ loading: false, data: null, error: e?.message ?? 'Failed to get submission' });
      }
    })();
  }, [task_id, submission_id]);

  return state;
};

export default useGetTaskSubmissionById;
