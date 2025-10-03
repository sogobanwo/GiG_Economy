import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetAllSubmissions = () => {
  const [state, setState] = useState<{ loading: boolean; data: any[]; error?: string }>({
    loading: true,
    data: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/submissions');
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Failed to fetch submissions' }));
          throw new Error(body.error ?? 'Failed to fetch submissions');
        }
        const { submissions } = await res.json();
        const mapped = (submissions || []).map((s: any) => ({
          dbId: s._id,
          taskDbId: s.taskId,
          submitter: s.submitter,
          content: s.content,
          contractSubId: s.contractSubId ?? null,
          approved: Boolean(s.approved ?? false),
          createdAt: s.createdAt,
        }));

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (contractAddress) {
          const addr = getAddress(contractAddress);

          const tasksRes = await fetch('/api/tasks');
          const { tasks } = tasksRes.ok ? await tasksRes.json() : { tasks: [] };
          const taskContractByDbId: Record<string, number> = {};
          (tasks || []).forEach((t: any) => {
            if (t?._id && t?.contractTaskId != null) {
              taskContractByDbId[String(t._id)] = Number(t.contractTaskId);
            }
          });

          const enriched = await Promise.all(
            mapped.map(async (sub: any) => {
              const taskContractId = taskContractByDbId[String(sub.taskDbId)];
              if (taskContractId == null || sub.contractSubId == null) return sub;
              try {
                const onChain: any = await readContract(config, {
                  abi,
                  address: addr,
                  functionName: 'getSubmission',
                  args: [Number(taskContractId), Number(sub.contractSubId)],
                });
                const [onChainSubmitter, onChainContent] = onChain as [`0x${string}`, string];
                return {
                  ...sub,
                  submitter: onChainSubmitter ?? sub.submitter,
                  content: onChainContent ?? sub.content,
                };
              } catch (e) {
                console.warn('Failed to read submission on-chain', e);
                return sub;
              }
            })
          );
          setState({ loading: false, data: enriched });
        } else {
          setState({ loading: false, data: mapped });
        }
      } catch (e: any) {
        console.error('Error fetching submissions from API:', e);
        setState({ loading: false, data: [], error: e?.message ?? 'Failed to fetch submissions' });
      }
    })();
  }, []);

  return state;
};

export default useGetAllSubmissions;