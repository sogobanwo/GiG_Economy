import { useReadContract } from "wagmi";
import { Address, getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetCompletedTaskByAgent = (address: Address) => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const result = useReadContract({
    abi: abi,
    address: getAddress(contractAddress ? contractAddress : ""),
    functionName: "getCompletedTasksByAgent",
    account: address
  });

  return result;
};

export default useGetCompletedTaskByAgent;
