"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Award,
  Star,
  Trophy,
  Zap,
  BookOpen,
  Download,
  Coffee,
} from "lucide-react";
import { useState } from "react";
import NotConnected from "@/components/not-connected";
import { useAppKitAccount } from "@reown/appkit/react";

const rewards = [
  {
    id: 1,
    title: "Premium  Paper Access",
    description: "Get 1 month of premium access to top journals and papers.",
    points: 500,
    icon: BookOpen,
  },
  {
    id: 2,
    title: "AI Assistant Credits",
    description:
      "50 credits for our AI assistant to help with your own papers.",
    points: 750,
    icon: Zap,
  },
  {
    id: 3,
    title: "Conference Ticket Discount",
    description: "25% discount on tickets to selected AI and ML conferences.",
    points: 1000,
    icon: Trophy,
  },
  {
    id: 4,
    title: "Dataset Access",
    description: "Access to premium curated datasets for your projects.",
    points: 1200,
    icon: Download,
  },
  {
    id: 5,
    title: "Coffee Gift Card",
    description: "A $25 gift card to keep you caffeinated during your.",
    points: 400,
    icon: Coffee,
  },
  {
    id: 6,
    title: "Expert Review of Your Paper",
    description: "Get your paper reviewed by an expert in your field.",
    points: 2000,
    icon: Star,
  },
];

export default function RewardsPage() {
  const [userPoints, setUserPoints] = useState(875);
  const nextLevel = 1000;
  const currentLevel = 2;
  const { address, isConnected } = useAppKitAccount();

  if (!isConnected) {
    return <NotConnected pageName={"Rewards"} />;
  }

  return (
    <div className="relative z-10 container mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {" "}
            Rewards
          </span>
        </h1>

        {/* User stats card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto mb-10"
        >
          <Card className="bg-black/60 backdrop-blur-md border border-white/10">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <Badge className="absolute -top-2 -right-2 bg-purple-600 text-white">
                      Lvl {currentLevel}
                    </Badge>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-white"> Champion</h2>
                    <p className="text-gray-400">Keep up the great work!</p>
                  </div>
                </div>
                <div className="flex items-center bg-white/5 px-4 py-2 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white font-bold text-xl">
                    {userPoints} points
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Level Progress</span>
                  <span className="text-white">
                    {userPoints}/{nextLevel}
                  </span>
                </div>
                <Progress
                  value={(userPoints / nextLevel) * 100}
                  className="h-2 bg-white/10"
                />
                <p className="text-gray-400 text-sm text-right">
                  {nextLevel - userPoints} points until Level {currentLevel + 1}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Available Rewards
        </h2>

        {/* Rewards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward, index) => {
            const canRedeem = userPoints >= reward.points;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`bg-black/60 backdrop-blur-md border h-full flex flex-col ${
                    canRedeem
                      ? "border-purple-500/50"
                      : "border-white/10 opacity-80"
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-xl">
                        {reward.title}
                      </CardTitle>
                      <div className="flex items-center bg-white/5 px-2 py-1 rounded">
                        <Award className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-white text-sm">
                          {reward.points}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <reward.icon className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-center">
                      {reward.description}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t border-white/10 pt-4">
                    <Button
                      className={`w-full ${
                        canRedeem
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-gray-800 text-gray-400 cursor-not-allowed"
                      }`}
                      disabled={!canRedeem}
                    >
                      {canRedeem ? "Redeem Reward" : "Not Enough Points"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
