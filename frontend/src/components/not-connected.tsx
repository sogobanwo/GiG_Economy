import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAppKit } from "@reown/appkit/react";
import { FloatingPaper } from "./floating-paper";
import { RoboAnimation } from "./robo-animation";

type Props = {
  pageName: String;
};

const NotConnected = (props: Props) => {
  const { open } = useAppKit();
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
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Connect Your Wallet to{" "}
              {props.pageName === "Create Tasks" ? "" : "view your"}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {" "}
                {props.pageName}
              </span>
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 0.5,
                delay: 0.4,
              },
            }}
            whileHover={{
              scale: 1.1,
              transition: {
                duration: 0.2,
              },
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white md:text-2xl md:p-8 rounded-2xl"
              onClick={() => open({ view: "Connect" })}
            >
              Click me to Connect
            </Button>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-96 h-96">
        <RoboAnimation />
      </div>
    </div>
  );
};

export default NotConnected;
