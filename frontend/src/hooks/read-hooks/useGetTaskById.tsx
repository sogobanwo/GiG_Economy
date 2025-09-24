import { useReadContract } from "wagmi";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetTaskById = (taskId: number) => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const result = useReadContract({
    abi: abi,
    address: getAddress(contractAddress ? contractAddress : ""),
    functionName: "getTask",
    args: [taskId]
  });

  return result;
};

export default useGetTaskById;
