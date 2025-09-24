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
import { motion } from "framer-motion";
import { FileText, Award, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useGetAllTask from "@/hooks/read-hooks/useGetAllTask";
import { formatEther } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import useSubmitTask from "@/hooks/write-hooks/useSubmitTask";
import { toast } from "sonner";

export default function AvailableTasksPage() {
  const { data: tasks, isLoading, isError, error } = useGetAllTask();
  const submitTask = useSubmitTask();
  const [formState, setFormState] = useState({
    taskId: "",
    publicHash: "",
    answer: "",
    proof: null,
  });

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
   

      // Submit task
      const response = await submitTask(
        Number(formState.taskId),
        "1",
        formState.publicHash
      );

      if (response) {
        toast.success("Task submitted and verified successfully");
        setFormState({
          taskId: "",
          publicHash: "",
          answer: "",
          proof: null,
        });
      } else {
        toast.error("Error verifying answer");
      }
    } catch (err) {
      console.error("Error submitting task:", err);
      toast.error("Failed to submit task");
    }
  };

  const handleDialogOpen = (task: any) => {
    setFormState((prev) => ({
      ...prev,
      taskId: task.taskId.toString(),
      publicHash: task.publicHash,
    }));
  };

  return (
    <div className="relative z-10 container mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
          Available
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {" "}
            Tasks
          </span>
        </h1>

        {/* Filters */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                className="bg-white/5 border-white/10 text-white pl-10 placeholder:text-gray-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-40">
                  <SelectValue placeholder="Difficulty" className="placeholder:text-gray-500" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="0">Easy</SelectItem>
                  <SelectItem value="1">Medium</SelectItem>
                  <SelectItem value="2">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-40">
                  <SelectValue placeholder="Sort By" className="placeholder:text-gray-500"/>
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="reward-high">Highest Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Task Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(tasks) && tasks.length > 0 ? (
            tasks.map((task: any, index: number) => (
              <motion.div
                key={task.taskId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-black/60 backdrop-blur-md border border-white/10 h-full flex flex-col hover:border-purple-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-xl">
                        {task.title}
                      </CardTitle>
                      <Badge
                        className={`
                  ${
                    task.difficulty === 0
                      ? "bg-green-500/20 text-green-400"
                      : task.difficulty === 1
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }
                `}
                      >
                        {task.difficulty === 0
                          ? "Easy"
                          : task.difficulty === 1
                          ? "Medium"
                          : "Hard"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-400 mb-4">{task.description}</p>
                    <div className="flex items-center text-gray-500 mb-2">
                      <FileText className="h-4 w-4 mr-2" />
                      <a
                        href={task.publicHash}
                        className="text-purple-400 hover:text-purple-300 text-sm truncate"
                      >
                        {task.publicHash}
                      </a>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Award className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {formatEther(task.reward)} ETH
                      </span>
                    </div>
                  </CardContent>
                  <Dialog>
                    <CardFooter className="border-t border-white/10 pt-4">
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleDialogOpen(task)}
                        >
                          Submit Response to Task
                        </Button>
                      </DialogTrigger>
                    </CardFooter>
                    <DialogContent className="sm:max-w-[425px] bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Submit Your response
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                          Type in your answer in the answer input box and click
                          on the submit button.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-white">Task Id</Label>
                          <Input
                            id="id"
                            placeholder="Task ID"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            value={formState.taskId}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Your Response</Label>
                          <Input
                            id="answer"
                            placeholder="Enter your answer"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            value={formState.answer}
                            onChange={(e) =>
                              handleChange("answer", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Task Public Hash</Label>
                          <Input
                            id="publicHash"
                            placeholder="Public Hash"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            value={formState.publicHash}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Generated proof</Label>
                          <Input
                            id="proof"
                            placeholder="Proof"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            value={
                              formState.proof === null ? "" : formState.proof
                            }
                            disabled
                          />
                        </div>
                        <Button
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Submit Response
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </Card>
              </motion.div>
            ))
          ) : (
            <p className="text-white">No tasks available.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
