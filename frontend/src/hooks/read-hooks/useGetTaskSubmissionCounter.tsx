import { useEffect, useState } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/config";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

// Merged: gets submission count from API and optionally from contract
const useGetTaskSubmissionCounter = () => {
  const [state, setState] = useState<{ loading: boolean; data: { apiCount: number; contractCount?: number } | null; error?: string }>({
    loading: true,
    data: null,
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
        const apiCount = Array.isArray(submissions) ? submissions.length : 0;

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (contractAddress) {
          try {
            const addr = getAddress(contractAddress);
            const contractCount = await readContract(config, {
              abi,
              address: addr,
              functionName: 'getTaskSubmissionCounter',
            }) as number;
            setState({ loading: false, data: { apiCount, contractCount } });
            return;
          } catch (e) {
            console.warn('Failed to read submission count from contract', e);
          }
        }
        setState({ loading: false, data: { apiCount } });
      } catch (e: any) {
        setState({ loading: false, data: null, error: e?.message ?? 'Failed to get submission count' });
      }
    })();
  }, []);

  return state;
};

export default useGetTaskSubmissionCounter;