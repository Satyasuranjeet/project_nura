import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { Goal } from '../types';

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchGoals();
  }, [userId, fetchGoals]);

  const addGoal = async (goal: Partial<Goal>) => {
    const created = await api.createGoal(goal);
    setGoals((prev) => [created, ...prev]);
    return created;
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    const updated = await api.updateGoal(goalId, updates);
    setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    return updated;
  };

  const deleteGoal = async (goalId: string) => {
    await api.deleteGoal(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal, refetch: fetchGoals };
}

