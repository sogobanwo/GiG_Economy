import { ethers } from "ethers";
import { getAddress } from "viem";
import multicallAbi from "../../abis/multicall.json";
import abi from "../../abis/abi.json";
import { readOnlyProvider } from "@/config/providers";
import { useEffect, useState } from "react";
import { getGigContract } from "@/config/contracts";

const useGetAllTasks = () => {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
  const multicallAddress = process.env
    .NEXT_PUBLIC_MULTICALL_CONTRACT_ADDRESS as string;

  const [data, setData] = useState({ loading: true, data: [] });

  useEffect(() => {
    (async () => {
      const contract = getGigContract(readOnlyProvider);

      const taskCounter = await contract.getAllTasksCounter();

      const numberOfCalls = taskCounter;

      const itf = new ethers.Interface(abi);

      let calls = [];

      for (let i = 0; i < Number(numberOfCalls); i++) {
        calls.push({
          target: getAddress(contractAddress),
          callData: itf.encodeFunctionData("getTask", [i]),
        });
      }

      const multicall = new ethers.Contract(
        multicallAddress,
        multicallAbi,
        readOnlyProvider
      );

      const callResults = await multicall.tryAggregate.staticCall(false, calls);

      const validResponsesIndex = [];

      const validResponses = callResults.filter((x: boolean[], i: any) => {
        if (x[0] === true) {
          validResponsesIndex.push(i);
          return true;
        }
        return false;
      });

      console.log(validResponses);

      const decodedResponses = validResponses.map((x: ethers.BytesLike[]) =>
        itf.decodeFunctionResult("getTask", x[1])
      );

      console.log(decodedResponses);

      let prop: any = [];

      for (let i = 0; i < decodedResponses.length; i++) {
        const obj = decodedResponses[i][0];
        prop.push({
          obj,
        });
      }

      setData({ loading: false, data: prop });
    })();
  }, []);
  return data;
};

export default useGetAllTasks;
