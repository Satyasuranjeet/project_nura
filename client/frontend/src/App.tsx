import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGoals } from './hooks/useGoals';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { GoalList } from './components/GoalList';
import { GoalDetail } from './components/GoalDetail';
import { GoalForm } from './components/GoalForm';
import { AIChat } from './components/AIChat';
import { LandingPage } from './components/LandingPage';
import { AdvancedAnalytics } from './components/AdvancedAnalytics';
import { Wallet } from './components/Wallet';
import { Loader2 } from 'lucide-react';
import type { Goal } from './types';

export default function App() {
  const { profile, loading, login, register, logout, updateProfile } = useAuth();
  const { goals, addGoal, updateGoal } = useGoals(profile?.uid);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
    setSelectedGoalId(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[var(--color-dark-surface)] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-neon-blue" />
        <p className="text-sm tracking-widest font-bold text-gray-500 uppercase">
          Synchronizing Neural Links...
        </p>
      </div>
    );
  }

  if (!profile) {
    return <LandingPage onLogin={login} onRegister={register} />;
  }

  const selectedGoal = goals?.find((g) => g.id === selectedGoalId);

  const renderContent = () => {
    if (selectedGoalId && selectedGoal) {
      return (
        <GoalDetail
          goal={selectedGoal}
          onBack={() => setSelectedGoalId(null)}
          onUpdate={(updates) => updateGoal(selectedGoalId, updates)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile} goals={goals || []} />;
      case 'goals':
        return (
          <GoalList
            goals={goals || []}
            onAdd={() => setIsGoalFormOpen(true)}
            onView={(id) => setSelectedGoalId(id)}
          />
        );
      case 'assistant':
        return (
          <AIChat
            profile={profile}
            goals={goals || []}
            onNavigate={(tab) => {
              setSelectedGoalId(null);
              setActiveTab(tab);
            }}
            onProfileUpdate={updateProfile}
          />
        );
      case 'analytics':
        return <AdvancedAnalytics goals={goals || []} profile={profile} />;
      case 'wallet':
        return <Wallet profile={profile} />;
      case 'settings':
        return (
          <div className="max-w-2xl glass p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-8">System Configuration</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold">Neural Link Sensitivity</p>
                  <p className="text-sm text-gray-500">Adjust the frequency of AI nudges.</p>
                </div>
                <div className="w-12 h-6 bg-neon-blue rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold">Haptic Feedback</p>
                  <p className="text-sm text-gray-500">Enable physical notification pulses.</p>
                </div>
                <div className="w-12 h-6 bg-white/10 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-4 glass text-red-500 font-bold rounded-xl mt-10 hover:bg-red-500/10 transition-colors"
              >
                Disconnect From System
              </button>
            </div>
          </div>
        );
      default:
        return <Dashboard profile={profile} goals={goals || []} />;
    }
  };

  return (
    <>
      <Layout
        activeTab={selectedGoalId ? 'goals' : activeTab}
        setActiveTab={(tab) => {
          setSelectedGoalId(null);
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        profile={profile}
      >
        {renderContent()}
      </Layout>

      {isGoalFormOpen && (
        <GoalForm
          onClose={() => setIsGoalFormOpen(false)}
          onSubmit={async (data: Partial<Goal>) => {
            await addGoal(data);
            setIsGoalFormOpen(false);
          }}
        />
      )}
    </>
  );
}
