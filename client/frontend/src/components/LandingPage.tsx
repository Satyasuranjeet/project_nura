import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Shield, Sparkles, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, displayName: string) => Promise<void>;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        await onRegister(email, password, displayName);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark-surface)] overflow-x-hidden flex flex-col">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 px-8 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Target className="w-8 h-8 text-neon-blue" />
          <h1 className="text-2xl font-bold tracking-tighter neon-text">NeuroGoals</h1>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left — hero copy */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-fit px-4 py-1.5 glass rounded-full flex items-center gap-2 border border-neon-blue/20"
          >
            <Sparkles className="w-4 h-4 text-neon-blue" />
            <span className="text-[10px] uppercase font-black tracking-widest text-neon-blue">
              AI-Powered Productivity V4.0
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl lg:text-8xl font-black tracking-tight leading-[0.9]"
          >
            AUGMENT <br />
            <span className="neon-text">YOUR WILL</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-lg leading-relaxed"
          >
            The next generation of goal tracking. Harness deep-learning AI to deconstruct
            complexity, track kinetic progress, and maintain unshakeable consistency.
          </motion.p>

          <div className="pt-4 grid grid-cols-3 gap-8">
            <div>
              <p className="text-3xl font-black neon-text">AI</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Strategic Assistant
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-neon-purple">3D</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Visual Analytics
              </p>
            </div>
            <div>
              <p className="text-3xl font-black text-neon-pink">XP</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Gamified Core
              </p>
            </div>
          </div>
        </div>

        {/* Right — auth form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="glass p-8 rounded-[2.5rem] border border-white/10 w-full max-w-md mx-auto lg:ml-auto"
        >
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 glass rounded-2xl mb-8 border border-white/5">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  mode === m
                    ? 'bg-neon-blue text-black shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Access' : 'Enlist'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <h2 className="text-xl font-black tracking-tight mb-6">
                {mode === 'login' ? 'Neural Link Authentication' : 'Initiate Neural Profile'}
              </h2>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Commander"
                    className="w-full glass px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue border border-white/5"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@neurogoals.ai"
                  className="w-full glass px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue border border-white/5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                    className="w-full glass px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue border border-white/5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_40px_rgba(0,243,255,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Access System' : 'Begin Protocol'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 pt-2">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Your credentials are encrypted and stored securely. No Firebase. Pure MongoDB.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-neon-blue flex-shrink-0" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  New accounts receive <span className="text-neon-blue font-bold">10 free NeuroCredits</span> + 3 daily AI sessions.
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              © 2026 NeuroGoals Neural Network
            </p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-gray-500 hover:text-neon-blue uppercase tracking-widest font-bold">
              Privacy.Protocol
            </a>
            <a href="#" className="text-xs text-gray-500 hover:text-neon-blue uppercase tracking-widest font-bold">
              Terms.Terminal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

