import { useReadContract } from "wagmi";
import { Address, getAddress } from "viem";
import abi from "../../abis/abi.json";

const useGetAgentReputationTier = (address: Address) => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const result = useReadContract({
    abi: abi,
    address: getAddress(contractAddress ? contractAddress : ""),
    functionName: "reputationTier",
    account: address,
  });

  return result;
};

export default useGetAgentReputationTier;
