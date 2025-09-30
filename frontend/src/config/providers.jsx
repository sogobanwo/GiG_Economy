import { ethers } from "ethers";

export const readOnlyProvider = new ethers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_RPC_URL
);
