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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  FileText, 
  Calendar, 
  Award, 
  CheckCircle, 
  Search,
  TrendingUp,
  Clock,
  Target,
  Eye,
  ExternalLink,
  Loader2
} from "lucide-react";
import { useState } from "react";
import NotConnected from "@/components/not-connected";
import { useAppKitAccount } from "@reown/appkit/react";
import useGetCompletedTaskByAgent from "@/hooks/read-hooks/useGetCompletedTaskByAgent";
import { formatEther } from "viem";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CompletedTasksPage() {
  const [activeTab, setActiveTab] = useState("completed");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { address, isConnected } = useAppKitAccount();

  // Fetch completed tasks data
  const { 
    data: completedTasks, 
    isLoading, 
    isError, 
    error 
  } = useGetCompletedTaskByAgent(address as `0x${string}`);

  if (!isConnected) {
    return <NotConnected pageName={"Completed Tasks"} />;
  }

  // Filter and sort tasks
  const filteredTasks = Array.isArray(completedTasks) 
    ? completedTasks.filter((task: any) =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ).sort((a: any, b: any) => {
        if (sortBy === "newest") {
          return new Date(b.completedDate || 0).getTime() - new Date(a.completedDate || 0).getTime();
        } else if (sortBy === "reward-high") {
          return Number(b.reward || 0) - Number(a.reward || 0);
        }
        return 0;
      })
    : [];

  // Calculate statistics
  const totalTasks = filteredTasks.length;
  const totalEarnings = filteredTasks.reduce((sum: number, task: any) => 
    sum + Number(formatEther(task.reward || 0)), 0
  );
  const averageReward = totalTasks > 0 ? totalEarnings / totalTasks : 0;

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 0: return "bg-green-500/20 text-green-400";
      case 1: return "bg-yellow-500/20 text-yellow-400";
      case 2: return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getDifficultyText = (difficulty: number) => {
    switch (difficulty) {
      case 0: return "Easy";
      case 1: return "Medium";
      case 2: return "Hard";
      default: return "Unknown";
    }
  };

  return (
    <div className="relative z-10 container mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
          Your
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {" "}
            Completed Tasks
          </span>
        </h1>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-black/60 backdrop-blur-md border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Completed</p>
                    <p className="text-2xl font-bold text-white">{totalTasks}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-black/60 backdrop-blur-md border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Earnings</p>
                    <p className="text-2xl font-bold text-white">{totalEarnings.toFixed(4)} ETH</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-black/60 backdrop-blur-md border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Average Reward</p>
                    <p className="text-2xl font-bold text-white">{averageReward.toFixed(4)} ETH</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search completed tasks..."
                className="bg-white/5 border-white/10 text-white pl-10 placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="reward-high">Highest Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <span className="ml-2 text-white">Loading your completed tasks...</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error loading completed tasks</p>
            <p className="text-gray-400 text-sm">{error?.message}</p>
          </div>
        )}

        {/* Tasks Grid */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  {searchQuery ? "No tasks match your search" : "You haven't completed any tasks yet"}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Start by browsing available tasks"}
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <a href="/available-task">Browse Available Tasks</a>
                </Button>
              </div>
            ) : (
              filteredTasks.map((task: any, index: number) => (
                <motion.div
                  key={task.taskId || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-black/60 backdrop-blur-md border border-white/10 h-full flex flex-col hover:border-purple-500/50 transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-white text-xl group-hover:text-purple-300 transition-colors">
                          {task.title || `Task #${task.taskId}`}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          <Badge className={getDifficultyColor(task.difficulty)}>
                            {getDifficultyText(task.difficulty)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-gray-400 mb-4 line-clamp-3">
                        {task.description || "No description available"}
                      </p>
                      
                      <div className="space-y-3">
                        {task.publicHash && (
                          <div className="flex items-center text-gray-500">
                            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                            <a
                              href={task.publicHash}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 text-sm truncate flex items-center"
                            >
                              View Task Details
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        
                        {task.completedDate && (
                          <div className="flex items-center text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                              Completed: {new Date(task.completedDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-gray-500">
                          <Award className="h-4 w-4 mr-2 text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-400">
                            {formatEther(task.reward || 0)} ETH earned
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-white/10 pt-4 space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 border-white/10 text-white hover:bg-white/5"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-black/90 backdrop-blur-md border border-white/10">
                          <DialogHeader>
                            <DialogTitle className="text-white text-xl">
                              {selectedTask?.title || `Task #${selectedTask?.taskId}`}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Task completion details and submission information
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedTask && (
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-white font-medium mb-2">Description</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                  {selectedTask.description || "No description available"}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-white font-medium mb-2">Reward Earned</h4>
                                  <p className="text-yellow-400 font-bold">
                                    {formatEther(selectedTask.reward || 0)} ETH
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-white font-medium mb-2">Difficulty</h4>
                                  <Badge className={getDifficultyColor(selectedTask.difficulty)}>
                                    {getDifficultyText(selectedTask.difficulty)}
                                  </Badge>
                                </div>
                              </div>
                              
                              {selectedTask.publicHash && (
                                <div>
                                  <h4 className="text-white font-medium mb-2">Task Reference</h4>
                                  <a
                                    href={selectedTask.publicHash}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center"
                                  >
                                    {selectedTask.publicHash}
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </a>
                                </div>
                              )}
                              
                              {selectedTask.completedDate && (
                                <div>
                                  <h4 className="text-white font-medium mb-2">Completion Date</h4>
                                  <p className="text-gray-300 text-sm">
                                    {new Date(selectedTask.completedDate).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {task.publicHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          asChild
                        >
                          <a
                            href={task.publicHash}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
