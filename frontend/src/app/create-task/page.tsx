"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { FileText, Award } from "lucide-react";
import { useState } from "react";
import NotConnected from "@/components/not-connected";
import { useAppKitAccount } from "@reown/appkit/react";
import useCreateTask from "@/hooks/write-hooks/useCreateTask";
import { parseEther } from "viem";
import { toast } from "sonner";

export default function CreateTaskPage() {
  const { isConnected } = useAppKitAccount();

  const createTask = useCreateTask();
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    publicHash: "",
    expectedResult: "",
    difficulty: "",
    reward: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

   

    // Create task
    const response = await createTask(
      formState.title,
      formState.description,
      parseEther(formState.reward),
      "1",
      Number(formState.difficulty)
    );

    if (response) {
      toast.success("Task created");
      setFormState({
        title: "",
        description: "",
        publicHash: "",
        expectedResult: "",
        difficulty: "",
        reward: "",
      });
    }
  };

  if (!isConnected) {
    return <NotConnected pageName={"Create Tasks"} />;
  }

  return (
    <div className="relative container mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
          Create a New
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {" "}
            Task
          </span>
        </h1>

        <Card className="bg-black/60 backdrop-blur-md border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Task Details</CardTitle>
            <CardDescription className="text-gray-400">
              Fill out the form below to create a new task for the community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Task Title
                </Label>
                <Input
                  id="title"
                  placeholder="E.g., Summarize AI Ethics Paper"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  value={formState.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Task Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what needs to be done in detail..."
                  className="bg-white/5 border-white/10 text-white min-h-[120px] placeholder:text-gray-500"
                  value={formState.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedResult" className="text-white">
                    Expected Result
                  </Label>
                  <div className="relative">
                    <Input
                      id="ExpectedResult"
                      type="text"
                      className="bg-white/5 border-white/10 text-white"
                      value={formState.expectedResult}
                      onChange={(e) =>
                        handleChange("expectedResult", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-white">
                    Difficulty
                  </Label>
                  <Select
                    onValueChange={(value) => handleChange("difficulty", value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select difficulty" className="text-gray-500" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      <SelectItem value="0">Easy</SelectItem>
                      <SelectItem value="1">Medium</SelectItem>
                      <SelectItem value="2">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward" className="text-white">
                    Reward Amount (ETH)
                  </Label>
                  <div className="relative">
                    <Input
                      id="reward"
                      type="number"
                      placeholder="0.0005"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      value={formState.reward}
                      onChange={(e) => handleChange("reward", e.target.value)}
                    />
                    <Award className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicHash" className="text-white">
                  Task Public Hash
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="publicHash"
                    placeholder="0x123..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    value={formState.publicHash}
                    disabled
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-white/10 text-white"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4 border-t border-white/10 pt-4">
            <Button
              variant="ghost"
              className="text-white hover:text-purple-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Create Task
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
