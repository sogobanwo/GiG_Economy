"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Award } from "lucide-react";
import { useState } from "react";
import NotConnected from "@/components/not-connected";
import { useAppKitAccount } from "@reown/appkit/react";
import useCreateTask from "@/hooks/write-hooks/useCreateTask";
import { parseEther } from "viem";
import { toast } from "sonner";
import useGetAllTasks from "@/hooks/read-hooks/useGetAllTask";
import useGetTaskById from "@/hooks/read-hooks/useGetTaskById";

export default function CreateTaskPage() {
  const { isConnected } = useAppKitAccount();
  const task = useGetTaskById(1)
  console.log(task.data)

  const allTask = useGetAllTasks()
  console.log(allTask)

  const createTask = useCreateTask();
  const [formState, setFormState] = useState({
    description: "",
    bounty: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create task
    const response = await createTask(
      formState.description,
      parseEther(formState.bounty)
    );

    if (response) {
      toast.success("Task created");
      setFormState({
        description: "",
        bounty: "",
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

              <div className="space-y-2">
                <Label htmlFor="reward" className="text-white">
                  Reward Amount (ETH)
                </Label>
                <div className="relative">
                  <Input
                    id="bounty"
                    type="number"
                    placeholder="0.0005"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    value={formState.bounty}
                    onChange={(e) => handleChange("bounty", e.target.value)}
                  />
                  <Award className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
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
