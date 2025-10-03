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
import { formatEther } from "viem";
import { useMemo } from "react";
import NotConnected from "@/components/not-connected";
import { useAppKitAccount } from "@reown/appkit/react";
import useGetAllSubmissions from "@/hooks/read-hooks/useGetAllSubmissions";
import Link from "next/link";
import { useState } from "react";
import useGetAllTasks from "@/hooks/read-hooks/useGetAllTask";

export default function AvailableTasksPage() {
  const { loading, data: tasks } = useGetAllTasks();
  const { loading: subsLoading, data: submissions } = useGetAllSubmissions();
  const { address, isConnected } = useAppKitAccount();

  const submissionById = useMemo(() => {
    const map = new Map<string, any>();
    (submissions || []).forEach((s: any) => {
      if (s?.dbId) map.set(String(s.dbId), s);
    });
    return map;
  }, [submissions]);
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [sort, setSort] = useState<"newest" | "reward-high">("newest");

  const visibleTasks = useMemo(() => {
    let list = Array.isArray(tasks) ? tasks : [];
    // filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t: any) => String(t?.name ?? "").toLowerCase().includes(q));
    }
    // filter by status
    if (status === "open") list = list.filter((t: any) => Number(t?.status ?? 0) === 0);
    if (status === "closed") list = list.filter((t: any) => Number(t?.status ?? 0) !== 0);
    // sort
    if (sort === "newest") {
      list = [...list].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "reward-high") {
      list = [...list].sort((a: any, b: any) => Number(b?.bounty ?? BigInt(0)) - Number(a?.bounty ?? BigInt(0)));
    }
    return list;
  }, [tasks, search, status, sort]);

  if (!isConnected) {
    return <NotConnected pageName={"Available Tasks"} />;
  }

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-40">
                  <SelectValue placeholder="Status" className="placeholder:text-gray-500" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(val) => setSort(val as any)}>
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
          {loading ? (
            <div className="text-gray-400">Loading tasks...</div>
          ) : Array.isArray(visibleTasks) && visibleTasks.length > 0 ? (
            visibleTasks.map((task: any, index: number) => (
              <motion.div
                key={task.dbId ?? task.taskId ?? index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-black/60 backdrop-blur-md border border-white/10 h-full flex flex-col hover:border-purple-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-xl">
                        {task?.name ?? `Task ${index + 1}`}
                      </CardTitle>
                      <Badge className="bg-white/10 text-white">
                        {task?.status === 0 ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex items-center text-gray-400 mb-2">
                      <span className="text-sm">Creator:</span>
                      <span className="ml-2 text-sm text-purple-300">
                        {task?.creator
                          ? `${task.creator.slice(0, 6)}...${task.creator.slice(-4)}`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Award className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {typeof task?.bounty === "bigint" ? formatEther(task.bounty) : "0"} ETH
                      </span>
                    </div>
                    {task?.approvedSubmissionId && (
                      <div className="mt-3">
                        {(() => {
                          const approved = submissionById.get(String(task.approvedSubmissionId));
                          const approvedForSomeoneElse = Boolean(
                            approved?.submitter && address && approved.submitter.toLowerCase() !== address.toLowerCase()
                          );
                          return approvedForSomeoneElse ? (
                            <Badge className="bg-yellow-500/20 text-yellow-300">Approved for someone else</Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-300">Approved (you)</Badge>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t border-white/10 pt-4">
                    <Link href={`/tasks/${task.dbId}`} className="w-full">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        View & Submit
                      </Button>
                    </Link>
                  </CardFooter>
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
