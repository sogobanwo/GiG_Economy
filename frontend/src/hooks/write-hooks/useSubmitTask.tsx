import { encodeAbiParameters, getAddress } from "viem";
import { useCallback } from "react";
import { useWriteContract } from "wagmi";
import abi from "../../abis/abi.json";

const useSubmitTask = () => {
  const { writeContractAsync } = useWriteContract(); 

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set");
  }

  return useCallback(
    async (taskId: number, proof: any, publicHash: string) => {
      try {
        if (taskId === undefined || !proof || !publicHash) {
          throw new Error("All parameters are required");
        }

        // Parse the proof if it's a string
        let parsedProof = proof;
        if (typeof proof === 'string') {
          try {
            parsedProof = JSON.parse(proof);
          } catch (e: any) {
            throw new Error("Failed to parse proof JSON: " + e.message);
          }
        }

        console.log("Parsed proof:", parsedProof);

        // Ensure the parsed proof has the correct structure
        if (!parsedProof.a || !parsedProof.b || !parsedProof.c) {
          throw new Error("Proof is missing required properties (a, b, or c)");
        }

        const encodedProof = encodeAbiParameters(
          [
            { name: "a", type: "uint256[2]" },
            { name: "b", type: "uint256[2][2]" },
            { name: "c", type: "uint256[2]" },
          ],
          [parsedProof.a, parsedProof.b, parsedProof.c]
        );

        console.log("Encoded proof:", encodedProof);
        
        const address = getAddress(contractAddress);

        const result = await writeContractAsync({
          abi,
          address,
          functionName: "submitWork",
          args: [taskId, encodedProof, publicHash],
        });

        return result;
      } catch (err) {
        console.error("Error submitting task:", err);
        throw err instanceof Error ? err : new Error("Failed to submit task");
      }
    },
    [writeContractAsync, contractAddress]
  );
};

export default useSubmitTask;