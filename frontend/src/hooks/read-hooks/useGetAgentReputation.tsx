import { useReadContract } from "wagmi";
import { Address, getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetAgentReputation = (address: Address) => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const result = useReadContract({
    abi: abi,
    address: getAddress(contractAddress ? contractAddress : ""),
    functionName: "getAgentReputation",
    account: address,
  });

  return result;
};

export default useGetAgentReputation;
