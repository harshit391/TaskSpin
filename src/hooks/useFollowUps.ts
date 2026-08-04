"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFollowUpChain, addFollowUp, reorderFollowUpChain, moveToChain } from "@/lib/api";
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

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderFollowUpChain(taskId!, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: FOLLOW_UPS_KEY(taskId!) });
      const previous = queryClient.getQueryData<Task[]>(FOLLOW_UPS_KEY(taskId!));
      if (previous) {
        const idToTask = new Map(previous.map((t) => [t.id, t]));
        const optimistic = orderedIds.map((id) => idToTask.get(id)).filter(Boolean) as Task[];
        queryClient.setQueryData(FOLLOW_UPS_KEY(taskId!), optimistic);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FOLLOW_UPS_KEY(taskId!), context.previous);
      }
      showToast("Failed to reorder", "error");
    },
    onSuccess: (updatedChain) => {
      queryClient.setQueryData(FOLLOW_UPS_KEY(taskId!), updatedChain);
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ movingTaskId, insertAfterId }: { movingTaskId: string; insertAfterId?: string }) =>
      moveToChain(taskId!, movingTaskId, insertAfterId),
    onSuccess: (updatedChain) => {
      queryClient.setQueryData(FOLLOW_UPS_KEY(taskId!), updatedChain);
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "follow-ups" });
      showToast("Task moved to chain", "success");
    },
    onError: () => {
      showToast("Failed to move task", "error");
    },
  });

  return {
    chain: query.data ?? [],
    isLoading: query.isLoading,
    addFollowUp: (title: string, insertAfterId?: string, projectId?: string | null) =>
      addMutation.mutate({ title, insertAfterId, projectId }),
    isAdding: addMutation.isPending,
    reorderChain: (orderedIds: string[]) => reorderMutation.mutate(orderedIds),
    isReordering: reorderMutation.isPending,
    moveToChain: (movingTaskId: string, insertAfterId?: string) =>
      moveMutation.mutate({ movingTaskId, insertAfterId }),
    isMoving: moveMutation.isPending,
  };
}
