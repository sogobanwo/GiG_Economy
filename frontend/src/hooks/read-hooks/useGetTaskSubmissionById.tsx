import { useReadContract } from "wagmi";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetTaskSubmissionById = (task_id: number, submission_id: number) => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const result = useReadContract({
    abi: abi,
    address: getAddress(contractAddress ? contractAddress : ""),
    functionName: "getTaskSubmission",
    args: [task_id, submission_id]
  });

  return result;
};

export default useGetTaskSubmissionById;
