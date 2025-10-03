import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetTaskById = (task_id: number) => {
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
              functionName: "getTask",
              args: [Number(task_id)],
            });
          } catch (e) {
            console.warn("Failed to read task from contract", e);
          }
        }

        // Fetch DB tasks and find corresponding record by contractTaskId
        const dbRes = await fetch('/api/tasks');
        const { tasks } = dbRes.ok ? await dbRes.json() : { tasks: [] };
        const dbTask = (tasks || []).find((t: any) => Number(t.contractTaskId) === Number(task_id)) ?? null;

        if (!onChain && !dbTask) {
          throw new Error('Task not found on-chain or in DB');
        }

        const mappedFromDb = dbTask ? {
          dbId: dbTask._id,
          taskId: dbTask.contractTaskId ?? Number(task_id),
          name: dbTask.name,
          creator: dbTask.creator,
          bounty: dbTask.bounty ? BigInt(dbTask.bounty) : BigInt(0),
          status: dbTask.status ?? 0,
          contractTaskId: dbTask.contractTaskId ?? Number(task_id),
          approvedSubmissionId: dbTask.approvedSubmissionId ?? null,
          createdAt: dbTask.createdAt,
          updatedAt: dbTask.updatedAt,
        } : null;

        if (onChain) {
          const [name, creator, bounty, status] = onChain as [string, `0x${string}`, bigint, number];
          const merged = {
            ...(mappedFromDb ?? {
              dbId: null,
              taskId: Number(task_id),
              name,
              creator,
              bounty,
              status,
              contractTaskId: Number(task_id),
              approvedSubmissionId: null,
              createdAt: null,
              updatedAt: null,
            }),
            name: name ?? mappedFromDb?.name,
            creator: creator ?? mappedFromDb?.creator,
            bounty: typeof bounty === 'bigint' ? bounty : (mappedFromDb?.bounty ?? BigInt(0)),
            status: typeof status === 'number' ? status : (mappedFromDb?.status ?? 0),
          };
          setState({ loading: false, data: merged });
          return;
        }

        // Fallback to DB-only mapping
        setState({ loading: false, data: mappedFromDb });
      } catch (e: any) {
        setState({ loading: false, data: null, error: e?.message ?? 'Failed to get task' });
      }
    })();
  }, [task_id]);

  return state;
};

export default useGetTaskById;
