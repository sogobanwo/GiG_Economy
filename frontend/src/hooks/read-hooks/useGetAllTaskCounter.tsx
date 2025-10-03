import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

// Merged: gets count from API and optionally from contract
const useGetAllTaskCounter = () => {
  const [state, setState] = useState<{ loading: boolean; data: { apiCount: number; contractCount?: number } | null; error?: string }>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Failed to fetch tasks' }));
          throw new Error(body.error ?? 'Failed to fetch tasks');
        }
        const { tasks } = await res.json();
        const apiCount = Array.isArray(tasks) ? tasks.length : 0;

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (contractAddress) {
          try {
            const addr = getAddress(contractAddress);
            const contractCount = await readContract(config, {
              abi,
              address: addr,
              functionName: 'getTaskCount',
            }) as number;
            setState({ loading: false, data: { apiCount, contractCount } });
            return;
          } catch (e) {
            console.warn('Failed to read task count from contract', e);
          }
        }
        setState({ loading: false, data: { apiCount } });
      } catch (e: any) {
        setState({ loading: false, data: null, error: e?.message ?? 'Failed to get task count' });
      }
    })();
  }, []);

  return state;
};

export default useGetAllTaskCounter;