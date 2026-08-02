"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFollowUpChain, addFollowUp } from "@/lib/api";
import { Task } from "@/types/task";
import { showToast } from "@/hooks/useToast";

const FOLLOW_UPS_KEY = (taskId: string) => ["follow-ups", taskId];
const TASKS_KEY = ["tasks"];

export function useFollowUps(taskId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<Task[]>({
    queryKey: FOLLOW_UPS_KEY(taskId!),
    queryFn: () => fetchFollowUpChain(taskId!),
    enabled: !!taskId,
  });

  const addMutation = useMutation({
    mutationFn: ({ title, insertAfterId, projectId }: { title: string; insertAfterId?: string; projectId?: string | null }) =>
      addFollowUp(taskId!, title, insertAfterId, projectId),
    onSuccess: (updatedChain) => {
      queryClient.setQueryData(FOLLOW_UPS_KEY(taskId!), updatedChain);
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      showToast("Follow-up added", "success");
    },
    onError: () => {
      showToast("Failed to add follow-up", "error");
    },
  });

  return {
    chain: query.data ?? [],
    isLoading: query.isLoading,
    addFollowUp: (title: string, insertAfterId?: string, projectId?: string | null) =>
      addMutation.mutate({ title, insertAfterId, projectId }),
    isAdding: addMutation.isPending,
  };
}
