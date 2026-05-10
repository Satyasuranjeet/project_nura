import { motion } from 'motion/react';
import type { Goal, Priority } from '../types';
import {
  Calendar,
  MoreVertical,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Target,
} from 'lucide-react';

interface GoalListProps {
  goals: Goal[];
  onAdd: () => void;
  onView: (id: string) => void;
}

export function GoalList({ goals, onAdd, onView }: GoalListProps) {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium':
        return 'text-neon-blue bg-neon-blue/10 border-neon-blue/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">
          Active <span className="neon-text">Missions</span>
        </h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter missions..."
              className="glass pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue w-64"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-neon-blue text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)]"
          >
            <Plus className="w-5 h-5" />
            Deploy Mission
          </motion.button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((goal, idx) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -5 }}
            onClick={() => onView(goal.id)}
            className="glass p-6 rounded-3xl cursor-pointer group relative overflow-hidden"
          >
            {/* Priority Badge */}
            <div
              className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black border ${getPriorityColor(goal.priority)}`}
            >
              {goal.priority}
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                {goal.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <Target className="w-6 h-6 text-neon-blue" />
                )}
              </div>
              <div className="pr-16">
                <h3 className="font-bold text-lg leading-tight group-hover:neon-text transition-colors">
                  {goal.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{goal.category}</p>
              </div>
            </div>

            <p className="text-sm text-gray-400 line-clamp-2 mb-6 h-10">
              {goal.description || 'No description provided for this mission.'}
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
                <span className="font-bold neon-text">{goal.progress}%</span>
              </div>

              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  className="h-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-[var(--color-dark-surface)] bg-gray-800"
                  />
                ))}
                <div className="w-6 h-6 rounded-full border border-[var(--color-dark-surface)] bg-white/10 flex items-center justify-center text-[10px]">
                  +2
                </div>
              </div>
              <button className="p-2 text-gray-500 hover:text-white transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {goals.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 py-20 flex flex-col items-center justify-center glass rounded-3xl border-dashed border-white/10">
            <AlertCircle className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No active missions detected</h3>
            <p className="text-gray-500 mt-2">Initialize your first goal to begin tracking.</p>
            <button
              onClick={onAdd}
              className="mt-6 text-neon-blue font-bold flex items-center gap-2 hover:underline"
            >
              <Plus className="w-4 h-4" />
              Start New Mission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
