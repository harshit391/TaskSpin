"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHabits, createHabit, updateHabit, deleteHabit, checkinHabit, undoCheckin, getLocalDate } from "@/lib/api";
import { Habit, GoalMode, MilestoneInfo } from "@/types/habit";
import { showToast } from "@/hooks/useToast";

const HABITS_KEY = ["habits"];

export function useHabits() {
  const queryClient = useQueryClient();

  const query = useQuery<Habit[]>({
    queryKey: HABITS_KEY,
    queryFn: fetchHabits,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; goalMode: GoalMode; goalTarget?: number }) => createHabit(data),
    onSuccess: () => {
      showToast("Habit created", "success");
    },
    onError: () => {
      showToast("Failed to create habit", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; archived?: boolean } }) => updateHabit(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });
      const previous = queryClient.getQueryData<Habit[]>(HABITS_KEY);
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (old) =>
        old?.map((h) => (h.id === id ? { ...h, ...data } : h))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(HABITS_KEY, context.previous);
      showToast("Failed to update habit", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });
      const previous = queryClient.getQueryData<Habit[]>(HABITS_KEY);
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (old) => old?.filter((h) => h.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(HABITS_KEY, context.previous);
      showToast("Failed to delete habit", "error");
    },
    onSuccess: () => {
      showToast("Habit deleted", "info");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => checkinHabit(id, date),
    onMutate: async ({ id, date }) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });
      const previous = queryClient.getQueryData<Habit[]>(HABITS_KEY);
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (old) =>
        old?.map((h) => {
          if (h.id !== id) return h;
          return {
            ...h,
            totalCheckins: h.totalCheckins + 1,
            checkins: [{ id: `temp-${Date.now()}`, habitId: id, date, createdAt: new Date().toISOString() }, ...h.checkins],
          };
        })
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(HABITS_KEY, context.previous);
      showToast("Failed to check in", "error");
    },
    onSuccess: (data) => {
      const milestone = (data as Habit & { milestone?: MilestoneInfo }).milestone;
      if (milestone?.isCompleted) {
        showToast("Habit complete! Goal reached!", "success");
      } else if (milestone?.hit) {
        showToast(`${milestone.milestone}-day milestone!`, "success");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });

  const undoMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => undoCheckin(id, date),
    onMutate: async ({ id, date }) => {
      await queryClient.cancelQueries({ queryKey: HABITS_KEY });
      const previous = queryClient.getQueryData<Habit[]>(HABITS_KEY);
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (old) =>
        old?.map((h) => {
          if (h.id !== id) return h;
          return {
            ...h,
            currentStreak: Math.max(0, h.currentStreak - 1),
            totalCheckins: Math.max(0, h.totalCheckins - 1),
            checkins: h.checkins.filter((c) => c.date !== date),
          };
        })
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(HABITS_KEY, context.previous);
      showToast("Failed to undo", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });

  return {
    habits: query.data ?? [],
    isLoading: query.isLoading,
    isMutating: createMutation.isPending || checkinMutation.isPending || undoMutation.isPending || deleteMutation.isPending || updateMutation.isPending,
    addHabit: (data: { name: string; goalMode: GoalMode; goalTarget?: number }) => createMutation.mutate(data),
    editHabit: (id: string, data: { name?: string; archived?: boolean }) => updateMutation.mutate({ id, data }),
    removeHabit: (id: string) => deleteMutation.mutate(id),
    checkin: (id: string, date?: string) => checkinMutation.mutate({ id, date: date ?? getLocalDate() }),
    undoCheckin: (id: string, date?: string) => undoMutation.mutate({ id, date: date ?? getLocalDate() }),
  };
}

