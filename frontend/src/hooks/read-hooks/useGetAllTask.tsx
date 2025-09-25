import { useReadContract } from "wagmi";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetAllTask = () => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set");
  }

  const result = useReadContract({
    abi,
    address: getAddress(contractAddress),
    functionName: "getTasks",
  });

  return result;
};

export default useGetAllTask;