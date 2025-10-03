import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetSubmissionByDbId = (dbId: string | null | undefined) => {
  const [state, setState] = useState<{ loading: boolean; data: any | null; error?: string }>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    (async () => {
      if (!dbId) {
        setState({ loading: false, data: null, error: 'Missing submission DB id' });
        return;
      }
      try {
        const res = await fetch(`/api/submissions/${dbId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Failed to fetch submission' }));
          throw new Error(body.error ?? 'Failed to fetch submission');
        }
        const { submission } = await res.json();
        const mapped = {
          dbId: submission._id,
          taskDbId: submission.taskId,
          submitter: submission.submitter,
          content: submission.content,
          contractSubId: submission.contractSubId ?? null,
          approved: Boolean(submission.approved ?? false),
          createdAt: submission.createdAt,
        };
        // Optionally enrich from on-chain when task and sub contract ids exist
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (contractAddress && mapped.contractSubId != null) {
          try {
            const taskRes = await fetch(`/api/tasks/${mapped.taskDbId}`);
            const { task } = taskRes.ok ? await taskRes.json() : { task: null };
            if (task?.contractTaskId != null) {
              const addr = getAddress(contractAddress);
              const onChain: any = await readContract(config, {
                abi,
                address: addr,
                functionName: 'getSubmission',
                args: [Number(task.contractTaskId), Number(mapped.contractSubId)],
              });
              const [onChainSubmitter, onChainContent] = onChain as [`0x${string}`, string];
              setState({
                loading: false,
                data: {
                  ...mapped,
                  submitter: onChainSubmitter ?? mapped.submitter,
                  content: onChainContent ?? mapped.content,
                },
              });
              return;
            }
          } catch (e) {
            console.warn('Failed to read submission on-chain', e);
          }
        }
        setState({ loading: false, data: mapped });
      } catch (e: any) {
        setState({ loading: false, data: null, error: e?.message ?? 'Failed to fetch submission' });
      }
    })();
  }, [dbId]);

  return state;
};

export default useGetSubmissionByDbId;