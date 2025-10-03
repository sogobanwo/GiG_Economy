import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetTaskByDbId = (dbId: string | null | undefined) => {
  const [state, setState] = useState<{ loading: boolean; data: any | null; error?: string }>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    (async () => {
      if (!dbId) {
        setState({ loading: false, data: null, error: "Missing task DB id" });
        return;
      }
      try {
        const res = await fetch(`/api/tasks/${dbId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Failed to fetch task" }));
          throw new Error(body.error ?? "Failed to fetch task");
        }
        const { task } = await res.json();
        const mapped = {
          dbId: task._id,
          taskId: task.contractTaskId ?? null,
          name: task.name,
          creator: task.creator,
          bounty: task.bounty ? BigInt(task.bounty) : BigInt(0),
          status: task.status ?? 0,
          contractTaskId: task.contractTaskId ?? null,
          approvedSubmissionId: task.approvedSubmissionId ?? null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
        // Optionally enrich with on-chain data when contractTaskId is present
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (contractAddress && mapped.contractTaskId != null) {
          try {
            const addressOfContract = getAddress(contractAddress);
            const onChain: any = await readContract(config, {
              abi,
              address: addressOfContract,
              functionName: "getTask",
              args: [Number(mapped.contractTaskId)],
            });
            const [name, creator, bounty, status] = onChain as [string, `0x${string}`, bigint, number];
            setState({
              loading: false,
              data: {
                ...mapped,
                name: name ?? mapped.name,
                creator: creator ?? mapped.creator,
                bounty: typeof bounty === 'bigint' ? bounty : mapped.bounty,
                status: typeof status === 'number' ? status : mapped.status,
              },
            });
          } catch (e) {
            console.warn('Failed to read task on-chain', e);
            setState({ loading: false, data: mapped });
          }
        } else {
          setState({ loading: false, data: mapped });
        }
      } catch (e: any) {
        setState({ loading: false, data: null, error: e?.message ?? "Failed to fetch task" });
      }
    })();
  }, [dbId]);

  return state;
};

export default useGetTaskByDbId;