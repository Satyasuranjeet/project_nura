import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  profile: any;
}

export function Layout({ children, activeTab, setActiveTab, onLogout, profile }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'assistant', label: 'AI Coach', icon: Sparkles },
    { id: 'wallet', label: 'Wallet', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-dark-surface)] font-sans">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col w-64 glass border-r border-white/5 h-full p-6 z-20"
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter neon-text">NeuroGoals</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id
                  ? 'glass bg-white/10 text-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.1)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,243,255,0.8)]"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="glass bg-white/5 p-4 rounded-xl">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
              <span>Neuro Balance</span>
              <Zap className="w-3 h-3 text-neon-purple shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-white">{profile?.credits || 0}</span>
              <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1 px-1.5 py-0.5 bg-white/5 rounded">
                KR
              </span>
            </div>
            <button
              onClick={() => setActiveTab('wallet')}
              className="w-full mt-3 py-2 bg-neon-blue/10 text-neon-blue text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-neon-blue hover:text-black transition-all border border-neon-blue/20"
            >
              Synchronize
            </button>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-30 flex items-center justify-between px-6 border-b border-white/5">
        <h1 className="text-lg font-bold neon-text">NeuroGoals</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto pt-20 md:pt-6 px-6 md:px-10 pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-w-6xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-64 glass border-r border-white/10 z-50 md:hidden p-6"
            >
              <div className="flex items-center gap-3 mb-10">
                <Target className="w-8 h-8 text-neon-blue" />
                <h1 className="text-xl font-bold neon-text">NeuroGoals</h1>
              </div>
              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                      activeTab === item.id ? 'bg-white/10 text-neon-blue' : 'text-gray-400'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
