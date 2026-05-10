import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Flag, Tag, Sparkles } from 'lucide-react';
import type { Priority } from '../types';

interface GoalFormProps {
  onClose: () => void;
  onSubmit: (goal: any) => void;
}

export function GoalForm({ onClose, onSubmit }: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium' as Priority,
    category: 'Personal',
  });

  const categories = ['Work', 'Health', 'Finance', 'Education', 'Personal', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-xl glass p-8 rounded-3xl relative z-10 border border-white/10"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Deploy New <span className="neon-text">Mission</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full ring-1 ring-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Mission Title
            </label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Master Quantum Computing"
              className="w-full glass px-4 py-3 rounded-xl focus:ring-1 focus:ring-neon-blue outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Objectives & Intel
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the secondary objectives..."
              className="w-full glass px-4 py-3 rounded-xl focus:ring-1 focus:ring-neon-blue outline-none min-h-[100px] resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Expiration Date
              </label>
              <input
                required
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full glass px-4 py-3 rounded-xl focus:ring-1 focus:ring-neon-blue outline-none [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2">
                <Tag className="w-3 h-3" /> Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full glass px-4 py-3 rounded-xl focus:ring-1 focus:ring-neon-blue outline-none appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2">
              <Flag className="w-3 h-3" /> Threat Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`py-2 rounded-lg text-xs font-bold uppercase transition-all border ${
                    formData.priority === p
                      ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                      : 'border-white/5 hover:bg-white/5 text-gray-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Initialize Mission
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
