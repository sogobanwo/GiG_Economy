import { useReadContract } from "wagmi";
import { getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetAllTaskCounter = () => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is not set");
  }

  const result = useReadContract({
    abi,
    address: getAddress(contractAddress),
    functionName: "getAllTasksCounter",
  });

  return result;
};

export default useGetAllTaskCounter;