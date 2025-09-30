import { useReadContract } from "wagmi";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetTaskSubmissionCounter = () => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const result = useReadContract({
    abi: abi,
    address: getAddress(contractAddress ? contractAddress : ""),
    functionName: "getTaskSubmissionCounter",
  });

  return result;
};

export default useGetTaskSubmissionCounter;