"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NotConnected from "@/components/not-connected";
import { useAppKitAccount } from "@reown/appkit/react";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import useSubmitTask from "@/hooks/write-hooks/useSubmitTask";
import useApproveTask from "@/hooks/write-hooks/useApproveTask";
import useGetSubmissionsByTaskDbId from "@/hooks/read-hooks/useGetSubmissionsByTaskDbId";
import useGetAllTasks from "@/hooks/read-hooks/useGetAllTask";
import useGetAllSubmissions from "@/hooks/read-hooks/useGetAllSubmissions";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";
  const { address, isConnected } = useAppKitAccount();
  const submitTask = useSubmitTask();
  const approveTask = useApproveTask();
  const {data: tasks } = useGetAllTasks();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<any | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { loading: subsLoading, data: submissions } = useGetSubmissionsByTaskDbId(id);
  console.log(submissions)
  const indexFromParams = useMemo(() => {
    if (!Array.isArray(tasks)) return null;
    const match = (tasks as any[]).find((t: any) => String(t.dbId) === String(id));
    if (!match) return null;
    return match.contractTaskId != null ? Number(match.contractTaskId) : Number(match.taskId);
  }, [tasks, id]);
  const taskIndex = tasks.length - Number(indexFromParams) - 1;

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/tasks/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Failed to get task" }));
          throw new Error(body.error ?? "Failed to get task");
        }
        const { task } = await res.json();
        setTask(task);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load task");
        toast.error(e?.message ?? "Failed to load task");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const approvedSubmission = useMemo(() => {
    if (!task?.approvedSubmissionId || !Array.isArray(submissions)) return null;
    const found = (submissions as any[]).find(
      (s: any) => String(s.dbId) === String(task.approvedSubmissionId)
    );
    return found ?? null;
  }, [task, submissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!content.trim()) {
      setError("Please enter your response content.");
      toast.error("Please enter your response content.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await submitTask(Number(taskIndex), content, String(task?.dbId ?? id));
      setContent("");
      toast.success("Submission sent");
      router.push("/available-task");
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit task");
      toast.error(e?.message ?? "Failed to submit task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (submission: any, indexInArray?: number) => {
    if (!task) return;
    try {
      setApprovingId(String(submission.dbId));
      setError(null);

      const providedSubIndex =
        indexInArray !== undefined
          ? Number(indexInArray)
          : submission?.contractSubId != null
          ? Number(submission.contractSubId)
          : undefined;
          const submission_id = submissions.length - 1 - providedSubIndex!
      await approveTask(taskIndex, String(submission.dbId), submission_id );

      setTask((prev: any) => ({ ...(prev ?? {}), status: 1, approvedSubmissionId: submission.dbId }));
      toast.success("Submission approved; task closed");
    } catch (e: any) {
      setError(e?.message ?? "Failed to approve submission");
      toast.error(e?.message ?? "Failed to approve submission");
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-6 py-16 text-gray-300">Loading task...</div>;
  }
  if (!isConnected) {
    return <NotConnected pageName={"View Task"} />;
  }
  if (error) {
    return <div className="container mx-auto px-6 py-16 text-red-400">{error}</div>;
  }
  if (!task) {
    return <div className="container mx-auto px-6 py-16 text-gray-300">Task not found</div>;
  }

  const isOpen = Number(task?.status ?? 0) === 0;
  const isCreator = Boolean(address && task?.creator && String(address).toLowerCase() === String(task.creator).toLowerCase());

  return (
    <div className="container mx-auto px-6 py-16">
      <Card className="bg-black/60 backdrop-blur-md border border-white/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-white text-2xl">{task?.name ?? "Task"}</CardTitle>
            <Badge className="bg-white/10 text-white">{isOpen ? "Open" : "Closed"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400 mb-4">
            <span className="mr-2">Creator:</span>
            <span className="text-purple-300">
              {task?.creator ? `${task.creator.slice(0, 6)}...${task.creator.slice(-4)}` : "N/A"}
            </span>
          </div>
          <div className="text-gray-400">
            <span className="mr-2">Reward:</span>
            <span className="text-purple-300">
              {task?.bounty ? formatEther(BigInt(task.bounty)) : "0"} ETH
            </span>
          </div>

          {approvedSubmission ? (
            <div className="mt-4">
              <Badge className="bg-green-500/20 text-green-300">Approved Submission Exists</Badge>
            </div>
          ) : null}

          {isCreator ? (
            <div className="mt-6">
              <h2 className="text-white text-lg mb-3">Submissions</h2>
              {subsLoading ? (
                <div className="text-gray-400">Loading submissions...</div>
              ) : Array.isArray(submissions) && submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((s: any, idx: number) => (
                    <Card key={s.dbId} className="bg-white/5 border-white/10">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="text-gray-300">
                            <div className="text-sm">
                              Submitter: <span className="text-purple-300">{s.submitter ? `${s.submitter.slice(0,6)}...${s.submitter.slice(-4)}` : 'N/A'}</span>
                            </div>
                            <div className="text-sm mt-2">Content: <span className="text-gray-200">{s.content}</span></div>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.approved ? (
                              <Badge className="bg-green-500/20 text-green-300">Approved</Badge>
                            ) : (
                              <Badge className="bg-white/10 text-white">Pending</Badge>
                            )}
                            {isOpen && !s.approved ? (
                              <Button
                                variant="secondary"
                                className="bg-purple-600/60 hover:bg-purple-700 text-white"
                                disabled={Boolean(approvingId)}
                                onClick={() => handleApprove(s, idx)}
                              >
                                {approvingId === String(s.dbId) ? "Approving..." : "Approve"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400">No submissions yet.</div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                placeholder="Enter your response content"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!isOpen || submitting}
              />
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={!isOpen || submitting || !isConnected}>
                {submitting ? "Submitting..." : "Submit Response"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}