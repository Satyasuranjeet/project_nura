import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Cell,
} from 'recharts';
import {
  Zap,
  Target,
  Activity,
  TrendingUp,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import type { Goal, UserProfile } from '../types';

interface AdvancedAnalyticsProps {
  goals: Goal[];
  profile: UserProfile | null;
}

export function AdvancedAnalytics({ goals, profile }: AdvancedAnalyticsProps) {
  const categories = ['Work', 'Health', 'Finance', 'Education', 'Personal', 'Other'];
  const categoryData = categories.map((cat) => ({
    subject: cat,
    A: goals.filter((g) => g.category === cat).length,
    fullMark: Math.max(...categories.map((c) => goals.filter((g) => g.category === c).length), 5),
  }));

  const completionRate =
    goals.length > 0
      ? Math.round(
          (goals.filter((g) => g.status === 'completed').length / goals.length) * 100,
        )
      : 0;

  const weeklyVelocity = [
    { day: 'Mon', tasks: 4, efficiency: 85 },
    { day: 'Tue', tasks: 7, efficiency: 92 },
    { day: 'Wed', tasks: 5, efficiency: 78 },
    { day: 'Thu', tasks: 12, efficiency: 95 },
    { day: 'Fri', tasks: 8, efficiency: 88 },
    { day: 'Sat', tasks: 3, efficiency: 60 },
    { day: 'Sun', tasks: 2, efficiency: 45 },
  ];

  return (
    <div className="space-y-8 pb-10">
      <header className="relative py-10 px-8 glass rounded-[3rem] overflow-hidden border-neon-blue/20 bg-neon-blue/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-blue/20 blur-[120px] -mr-48 -mt-48 animate-pulse" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-blue text-black rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-neon-blue">
                Neural Synthesis Online
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-none">
              COGNITIVE <br />
              <span className="neon-text">INSIGHTS</span>
            </h1>
            <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
              Real-time synchronization with your behavioral patterns. System is processing goal
              efficiency and predictive success vectors.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="glass p-6 rounded-3xl border-white/5 flex flex-col items-center text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                Focus Score
              </p>
              <div className="text-3xl font-black neon-text">88%</div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-neon-blue w-[88%]" />
              </div>
            </div>
            <div className="glass p-6 rounded-3xl border-white/5 flex flex-col items-center text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
                Success Prob.
              </p>
              <div className="text-3xl font-black text-neon-purple">94%</div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-neon-purple w-[94%]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Radar: Balance Analysis */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-[2.5rem] flex flex-col h-[450px]"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon-blue" />
              Neural Balance
            </h3>
            <Fingerprint className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar
                  name="Missions"
                  dataKey="A"
                  stroke="#00f3ff"
                  fill="#00f3ff"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 text-center uppercase tracking-widest">
            Distribution across cognitive disciplines
          </p>
        </motion.div>

        {/* Bar Chart: Weekly Velocity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass p-8 rounded-[2.5rem] flex flex-col h-[450px]"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-purple" />
              Execution Velocity
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neon-blue" /> Tasks
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neon-purple" /> Efficiency
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVelocity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{
                    backgroundColor: '#101118',
                    border: '1px solid #ffffff10',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="tasks" radius={[10, 10, 0, 0]}>
                  {weeklyVelocity.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? '#00f3ff' : '#ffffff10'} />
                  ))}
                </Bar>
                <Bar dataKey="efficiency" fill="#bc13fe30" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-3xl space-y-4 border-l-4 border-neon-blue">
          <div className="flex items-center justify-between">
            <Target className="w-5 h-5 text-neon-blue" />
            <span className="text-xs font-bold text-gray-500">Global Completion</span>
          </div>
          <div>
            <h4 className="text-3xl font-black">{completionRate}%</h4>
            <p className="text-[10px] text-gray-500 uppercase font-black">Accuracy Rating</p>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-4 border-l-4 border-neon-purple">
          <div className="flex items-center justify-between">
            <Zap className="w-5 h-5 text-neon-purple" />
            <span className="text-xs font-bold text-gray-500">Neural XP Gain</span>
          </div>
          <div>
            <h4 className="text-3xl font-black">+{profile?.xp || 0}</h4>
            <p className="text-[10px] text-gray-500 uppercase font-black">Energy Output</p>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-4 border-l-4 border-neon-pink">
          <div className="flex items-center justify-between">
            <Activity className="w-5 h-5 text-neon-pink" />
            <span className="text-xs font-bold text-gray-500">Temporal Window</span>
          </div>
          <div>
            <h4 className="text-3xl font-black">{goals.length}</h4>
            <p className="text-[10px] text-gray-500 uppercase font-black">Total Missions</p>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-xs font-bold text-gray-500">Streak</span>
          </div>
          <div>
            <h4 className="text-3xl font-black">{profile?.streak || 0}</h4>
            <p className="text-[10px] text-gray-500 uppercase font-black">Day Streak</p>
          </div>
        </div>
      </div>
    </div>
  );
}
