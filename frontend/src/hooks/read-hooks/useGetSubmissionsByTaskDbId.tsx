import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const normalizeId = (val: any) => {
  if (val == null) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return (val.$oid ?? val._id ?? val.toString?.()) ?? null;
  }
  try {
    return val.toString?.() ?? String(val);
  } catch {
    return null;
  }
};

const useGetSubmissionsByTaskDbId = (taskDbId: string | any | null | undefined) => {
  const [state, setState] = useState<{ loading: boolean; data: any[]; error?: string }>({
    loading: true,
    data: [],
  });

  useEffect(() => {
    (async () => {
      if (!taskDbId) {
        setState({ loading: false, data: [], error: 'Missing task DB id' });
        return;
      }

      try {
        const res = await fetch('/api/submissions');
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Failed to fetch submissions' }));
          throw new Error(body.error ?? 'Failed to fetch submissions');
        }
        const { submissions } = await res.json();
        const targetId = normalizeId(taskDbId);
        const filtered = (submissions || []).filter((s: any) => normalizeId(s.taskId) === targetId);
        const mapped = filtered.map((s: any) => ({
          dbId: s._id,
          taskDbId: s.taskId,
          submitter: s.submitter,
          content: s.content,
          contractSubId: s.contractSubId ?? null,
          approved: Boolean(s.approved ?? false),
          createdAt: s.createdAt,
        }));
        // Optionally enrich from on-chain when possible
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const taskRes = await fetch(`/api/tasks/${targetId}`);
        const { task } = taskRes.ok ? await taskRes.json() : { task: null };
        if (contractAddress && task?.contractTaskId != null) {
          const addr = getAddress(contractAddress);
          const enriched = await Promise.all(
            mapped.map(async (sub: any) => {
              if (sub.contractSubId == null) return sub;
              try {
                const onChain: any = await readContract(config, {
                  abi,
                  address: addr,
                  functionName: 'getSubmission',
                  args: [Number(task.contractTaskId), Number(sub.contractSubId)],
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
        console.error('Error fetching submissions by task from API:', e);
        setState({ loading: false, data: [], error: e?.message ?? 'Failed to fetch submissions' });
      }
    })();
  }, [taskDbId]);

  return state;
};

export default useGetSubmissionsByTaskDbId;