import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetAllTasks = () => {
  const [data, setData] = useState<{ loading: boolean; data: any[] }>({ loading: true, data: [] });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) {
          throw new Error('Failed to fetch tasks from API');
        }
        const { tasks } = await res.json();
        const mapped = (tasks || []).map((t: any, i: number) => ({
          taskId: t.contractTaskId ?? i,
          dbId: t._id,
          name: t.name ?? `Task ${i}`,
          creator: t.creator ?? "0x0000000000000000000000000000000000000000",
          bounty: t.bounty ? BigInt(t.bounty) : BigInt(0),
          status: t.status ?? 0,
          contractTaskId: t.contractTaskId ?? null,
          approvedSubmissionId: t.approvedSubmissionId ?? null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }));
        // Optionally enrich with on-chain data when contractTaskId is present
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (contractAddress) {
          const addressOfContract = getAddress(contractAddress);
          const enriched = await Promise.all(
            mapped.map(async (item: any) => {
              if (item.contractTaskId == null) return item;
              try {
                const onChain: any = await readContract(config, {
                  abi,
                  address: addressOfContract,
                  functionName: "getTask",
                  args: [Number(item.contractTaskId)],
                });
                const [name, creator, bounty, status] = onChain as [string, `0x${string}`, bigint, number];
                return {
                  ...item,
                  name: name ?? item.name,
                  creator: creator ?? item.creator,
                  bounty: typeof bounty === 'bigint' ? bounty : item.bounty,
                  status: typeof status === 'number' ? status : item.status,
                };
              } catch (e) {
                console.warn('Failed to read task on-chain', e);
                return item;
              }
            })
          );
          setData({ loading: false, data: enriched });
        } else {
          setData({ loading: false, data: mapped });
        }
      } catch (error) {
        console.error('Error fetching tasks from API:', error);
        setData({ loading: false, data: [] });
      }
    })();
  }, []);
  return data;
};

export default useGetAllTasks;
