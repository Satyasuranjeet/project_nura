import { useState, useEffect } from 'react';
import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  Trash2,
  Calendar,
  AlertTriangle,
  Zap,
  Plus,
  Edit2,
  Check,
  Timer,
  Activity,
} from 'lucide-react';
import type { Goal, Task } from '../types';
import * as api from '../lib/api';
import { generateSubtasks } from '../lib/api';

interface GoalDetailProps {
  goal: Goal;
  onBack: () => void;
  onUpdate: (updates: Partial<Goal>) => void;
}

export function GoalDetail({ goal, onBack, onUpdate }: GoalDetailProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiMotivation, setAiMotivation] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('30');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingMinutes, setEditingMinutes] = useState('0');

  const now = new Date();
  const deadline = new Date(goal.deadline);
  const totalAvailableMinutes = Math.max(
    0,
    Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60)),
  );
  const totalPlannedMinutes = tasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const isOverBudget = totalPlannedMinutes > totalAvailableMinutes;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.getTasks(goal.id);
        if (cancelled) return;
        setTasks(data);
        if (data.length > 0) {
          const completed = data.filter((t) => t.completed).length;
          const progress = Math.round((completed / data.length) * 100);
          if (progress !== goal.progress) onUpdate({ progress });
        }
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [goal.id]);

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const aiData = await generateSubtasks(goal.title, goal.description || '');
      setAiMotivation(aiData.motivation);
      const created = await api.batchCreateTasks(
        goal.id,
        aiData.subtasks.map((st) => ({ title: st.title, estimatedMinutes: st.estimatedMinutes })),
      );
      setTasks((prev) => [...prev, ...created]);
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const updated = await api.updateTask(goal.id, task.id, { completed: !task.completed });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    // Recalculate progress
    const newTasks = tasks.map((t) => (t.id === task.id ? updated : t));
    const completed = newTasks.filter((t) => t.completed).length;
    const progress = Math.round((completed / newTasks.length) * 100);
    if (progress !== goal.progress) onUpdate({ progress });
  };

  const deleteTask = async (taskId: string) => {
    await api.deleteTask(goal.id, taskId);
    const newTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(newTasks);
    if (newTasks.length > 0) {
      const completed = newTasks.filter((t) => t.completed).length;
      const progress = Math.round((completed / newTasks.length) * 100);
      if (progress !== goal.progress) onUpdate({ progress });
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const mins = parseInt(newTaskMinutes) || 0;
    try {
      const created = await api.createTask(goal.id, {
        title: newTaskTitle.trim(),
        completed: false,
        estimatedMinutes: mins,
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle('');
      setNewTaskMinutes('30');
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingMinutes((task.estimatedMinutes || 0).toString());
  };

  const saveEdit = async (taskId: string) => {
    if (!editingTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    const mins = parseInt(editingMinutes) || 0;
    try {
      const updated = await api.updateTask(goal.id, taskId, {
        title: editingTitle.trim(),
        estimatedMinutes: mins,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Missions
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <header className="glass p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase tracking-widest font-black border border-white/10">
                    {goal.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black border ${
                      goal.priority === 'critical'
                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                        : 'bg-neon-blue/10 border-neon-blue/20 text-neon-blue'
                    }`}
                  >
                    {goal.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Due {new Date(goal.deadline).toLocaleDateString()}
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">{goal.title}</h1>
              <p className="text-gray-400 leading-relaxed max-w-2xl">{goal.description}</p>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
                    Completion Protocol
                  </span>
                  <span className="text-2xl font-black neon-text">{goal.progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className="h-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-[0_0_15px_rgba(0,243,255,0.5)]"
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Actionable Tasks
                {tasks.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    ({tasks.filter((t) => t.completed).length}/{tasks.length})
                  </span>
                )}
              </h2>
              {tasks.length === 0 && !loadingTasks && (
                <button
                  onClick={handleGenerateTasks}
                  disabled={generating}
                  className="flex items-center gap-2 text-sm font-bold neon-text hover:underline disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate with AI
                </button>
              )}
            </div>

            {/* Time Budget Tracker */}
            <div
              className={`p-4 rounded-2xl glass border ${
                isOverBudget ? 'border-red-500/30 bg-red-500/5' : 'border-neon-blue/10'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Timer className={`w-4 h-4 ${isOverBudget ? 'text-red-500' : 'text-neon-blue'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Neural Time Budget
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-neon-blue'}`}
                >
                  {totalPlannedMinutes} / {totalAvailableMinutes} mins
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, (totalPlannedMinutes / Math.max(1, totalAvailableMinutes)) * 100)}%`,
                  }}
                  className={`h-full ${
                    isOverBudget
                      ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : 'bg-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.5)]'
                  }`}
                />
              </div>
              {isOverBudget && (
                <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Warning: Planned objectives exceed temporal remaining window.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <form onSubmit={handleAddTask} className="flex gap-2 group">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Plus className="w-4 h-4 text-neon-blue/40 group-focus-within:text-neon-blue transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Initialize objective..."
                    className="w-full glass pl-11 pr-4 py-3 rounded-2xl text-sm focus:ring-1 focus:ring-neon-blue outline-none border-dashed border-white/10 hover:border-white/20 transition-all placeholder:text-gray-600"
                  />
                </div>
                <div className="relative w-24">
                  <input
                    type="number"
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(e.target.value)}
                    placeholder="Min"
                    className="w-full glass px-3 py-3 rounded-2xl text-sm text-center focus:ring-1 focus:ring-neon-blue outline-none border-dashed border-white/10"
                  />
                  <span className="absolute -top-2 right-2 text-[8px] uppercase tracking-tighter text-gray-500 font-bold bg-gray-900 px-1">
                    Minutes
                  </span>
                </div>
                <button
                  type="submit"
                  className="glass px-4 rounded-2xl hover:bg-neon-blue hover:text-black transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>

              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass p-4 rounded-2xl flex items-center justify-between group border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex-1 flex items-center gap-4">
                    <button
                      onClick={() => toggleTask(task)}
                      className={`transition-colors shrink-0 ${
                        task.completed ? 'text-neon-blue' : 'text-gray-600 hover:text-neon-blue/50'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="bg-white/5 border border-neon-blue/30 rounded-lg px-2 py-1 text-sm flex-1 outline-none focus:ring-1 focus:ring-neon-blue"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              value={editingMinutes}
                              onChange={(e) => setEditingMinutes(e.target.value)}
                              className="bg-white/5 border border-neon-blue/30 rounded-lg px-2 py-1 text-sm w-20 outline-none focus:ring-1 focus:ring-neon-blue text-center"
                            />
                            <button
                              onClick={() => saveEdit(task.id)}
                              className="p-1 text-neon-blue"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => !task.completed && startEditing(task)}
                          className="cursor-pointer group/title relative"
                        >
                          <h4
                            className={`font-medium text-sm transition-all truncate pr-6 ${
                              task.completed
                                ? 'text-gray-500 line-through'
                                : 'text-gray-200 hover:text-white'
                            }`}
                          >
                            {task.title}
                          </h4>
                          {!task.completed && (
                            <Edit2 className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/title:opacity-40 transition-opacity" />
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <Activity
                              className={`w-3 h-3 ${
                                task.completed ? 'text-gray-700' : 'text-neon-purple/60'
                              }`}
                            />
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                              Est. {task.estimatedMinutes || 0}m
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {loadingTasks && (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-blue/20" />
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-neon-blue/20 bg-neon-blue/5">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-neon-blue" />
              Strategic Insight
            </h3>
            <div className="text-sm text-gray-300 leading-relaxed italic">
              {aiMotivation ||
                (tasks.length > 0
                  ? 'AI systems analyzed. Subtasks deployed. Focus on the first objective to build momentum.'
                  : 'No strategic data yet. Use AI analysis to break down complex missions into actionable maneuvers.')}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Risk Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <p className="text-xs text-gray-400 underline underline-offset-4 decoration-orange-500/20">
                  Deadline is approaching in{' '}
                  {Math.ceil(
                    (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  )}{' '}
                  solar cycles.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-1.5 shrink-0" />
                <p className="text-xs text-gray-400">
                  Mission complexity is rated HIGH. Consistency is paramount.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
