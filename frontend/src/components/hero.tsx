"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import { RoboAnimation } from "@/components/robo-animation";
import { FloatingPaper } from "./floating-paper";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";

export default function Hero() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const router = useRouter();

  return (
    <div className="relative min-h-[calc(100vh-76px)] flex items-center">
      {/* Floating papers background */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingPaper count={6} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Secure Solution for Decentralized
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {" "}
                Task Management
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
          >
            Leverage our decentralized platform to streamline task creation,
            assignment, and verification – powered by the Arbitrum Blockchain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isConnected ? (
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                onClick={() => router.push("/create-task")}
              >
                <FileText className="mr-2 h-5 w-5" />
                Create Task
              </Button>
            ) : (
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                onClick={() => open({ view: "Connect" })}
              >
                Get Started
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Animated robot */}
      <div className="absolute bottom-0 right-0 w-96 h-96">
        <RoboAnimation />
      </div>
    </div>
  );
}
