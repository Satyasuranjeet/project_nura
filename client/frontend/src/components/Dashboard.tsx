import { motion } from 'motion/react';
import type { Goal, UserProfile } from '../types';
import {
  Flame,
  Zap,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardProps {
  profile: UserProfile | null;
  goals: Goal[];
}

export function Dashboard({ profile, goals }: DashboardProps) {
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const avgProgress =
    goals.length > 0
      ? (goals.reduce((acc, g) => acc + g.progress, 0) / goals.length).toFixed(0)
      : 0;

  const pieData = [
    { name: 'Completed', value: completedGoals, color: '#00f3ff' },
    { name: 'Active', value: activeGoals, color: '#bc13fe' },
  ];

  const trendData = [
    { name: 'Mon', progress: 20 },
    { name: 'Tue', progress: 35 },
    { name: 'Wed', progress: 30 },
    { name: 'Thu', progress: 55 },
    { name: 'Fri', progress: 65 },
    { name: 'Sat', progress: 80 },
    { name: 'Sun', progress: 95 },
  ];

  const stats = [
    { label: 'Neuro XP', value: profile?.xp || 0, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Day Streak', value: profile?.streak || 0, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Active Goals', value: activeGoals, icon: Target, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
    { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            System <span className="neon-text">Overview</span>
          </h2>
          <p className="text-gray-400 mt-1">
            Welcome back, {profile?.displayName?.split(' ')[0] || 'User'}. AI systems are nominal.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">User Level</p>
            <p className="text-xl font-bold neon-text">Lvl {profile?.level || 1}</p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-neon-blue/50 p-1">
            <div className="w-full h-full rounded-full bg-neon-blue/20 flex items-center justify-center font-bold">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-5 rounded-2xl relative overflow-hidden group hover:ring-1 hover:ring-[var(--color-neon-blue)] transition-all"
          >
            <div className={`p-2 w-fit rounded-lg ${stat.bg} ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</p>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-4 h-4 text-white/40" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-2 glass p-6 rounded-3xl h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-blue" />
              Progress Analytics
            </h3>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue">
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151720',
                    border: '1px solid #ffffff10',
                    borderRadius: '12px',
                  }}
                  itemStyle={{ color: '#00f3ff' }}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#00f3ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProgress)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="glass p-6 rounded-3xl h-[400px] flex flex-col">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-neon-purple" />
            Goal Breakdown
          </h3>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold">{goals.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-tighter">Total</p>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
