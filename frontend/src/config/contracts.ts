import { ethers } from "ethers";
import abi from "@/abis/abi.json"

export const getGigContract = (providerOrSigner: any) =>
    new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        abi,
        providerOrSigner
    );

 