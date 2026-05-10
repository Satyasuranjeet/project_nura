import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Zap,
  ShieldCheck,
  ArrowRight,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import type { UserProfile, Transaction } from '../types';
import { createPaymentOrder, verifyPayment, getTransactions } from '../lib/api';

interface WalletProps {
  profile: UserProfile | null;
}

export function Wallet({ profile }: WalletProps) {
  const [purchasingBundle, setPurchasingBundle] = useState<number | null>(null);
  const [successData, setSuccessData] = useState<{ credits: number; amount: number } | null>(null);

  const loadRazorpay = (): Promise<boolean> => {
    // SDK already loaded
    if (typeof (window as any).Razorpay !== 'undefined') return Promise.resolve(true);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (creditAmount: number) => {
    setPurchasingBundle(creditAmount);
    setSuccessData(null);

    const loaded = await loadRazorpay();
    if (!loaded) {
      alert('Razorpay SDK failed to load. Check your connection.');
      setPurchasingBundle(null);
      return;
    }

    if (!profile?.uid) {
      alert('Neural Identity not established. Please sign in again.');
      setPurchasingBundle(null);
      return;
    }

    const price = creditAmount * 0.75;

    try {
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not available. Refresh and try again.');
      }

      const order = await createPaymentOrder(price);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'NeuroGoals',
        description: `Purchase ${creditAmount} NeuroCredits`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              credits: creditAmount,
              amount: price,
            });

            if (result.status === 'success') {
              setSuccessData({ credits: creditAmount, amount: price });
            } else {
              alert('Verification failed. Please contact support.');
            }
          } catch (err: any) {
            alert(`Verification error: ${err.message}`);
          }
        },
        prefill: {
          name: profile.displayName || '',
          email: profile.email || '',
        },
        theme: { color: '#00f3ff' },
        modal: {
          ondismiss: () => setPurchasingBundle(null),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      alert(error.message || 'Payment initialization failed.');
    } finally {
      setPurchasingBundle(null);
    }
  };

  const bundles = [
    { id: 'bundle_100', credits: 100, price: 75, popular: false },
    { id: 'bundle_500', credits: 500, price: 375, popular: true },
    { id: 'bundle_1000', credits: 1000, price: 750, popular: false },
  ];

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-6 rounded-3xl border-neon-blue bg-neon-blue/10 flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neon-blue rounded-2xl text-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-neon-blue uppercase tracking-widest text-sm">
                  Synchronization Successful
                </h4>
                <p className="text-xs text-gray-400">
                  Received {successData.credits} NeuroCredits for payload ₹{successData.amount}.
                  Wallet updated.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessData(null)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-neon-blue/10 to-neon-purple/5 border-neon-blue/20">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic tracking-tighter">
              NEURO<span className="neon-text">WALLET</span>
            </h2>
            <p className="text-gray-400 text-sm">Secure credit management for neural modules.</p>
          </div>
          <div className="glass p-6 rounded-3xl min-w-[200px] border-white/5 bg-white/5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              Available Credits
            </p>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-neon-blue" />
              <span className="text-4xl font-black text-white">{parseFloat((profile?.credits ?? 0).toFixed(2))}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {bundles.map((bundle) => (
          <motion.div
            key={bundle.id}
            whileHover={{ y: -5 }}
            className={`glass p-8 rounded-[2rem] flex flex-col items-center text-center relative overflow-hidden ${
              bundle.popular ? 'border-neon-blue ring-1 ring-neon-blue/20' : 'border-white/5'
            }`}
          >
            {bundle.popular && (
              <div className="absolute top-0 right-0 bg-neon-blue text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                Recommended
              </div>
            )}
            <div className={`p-4 rounded-2xl mb-6 ${bundle.popular ? 'bg-neon-blue/20' : 'bg-white/5'}`}>
              <CreditCard
                className={`w-10 h-10 ${bundle.popular ? 'text-neon-blue' : 'text-gray-400'}`}
              />
            </div>
            <h3 className="text-2xl font-black">{bundle.credits} KR</h3>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">NeuroCredits</p>

            <div className="my-8 space-y-2">
              <div className="flex items-center justify-center gap-1 text-3xl font-black text-white">
                <IndianRupee className="w-5 h-5 text-gray-500" />
                {bundle.price}
              </div>
              <p className="text-[10px] text-gray-500 font-bold">@ ₹0.75 per credit</p>
            </div>

            <button
              onClick={() => handlePurchase(bundle.credits)}
              disabled={purchasingBundle !== null}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                bundle.popular
                  ? 'bg-neon-blue text-black shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_40px_rgba(0,243,255,0.6)]'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {purchasingBundle === bundle.credits ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Acquire <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem] border-white/5 h-full">
          <h3 className="font-bold flex items-center gap-2 mb-6 text-neon-blue uppercase tracking-widest text-sm">
            <Zap className="w-5 h-5" />
            Neural Transactions
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <TransactionHistory profile={profile} />
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 h-full">
          <h3 className="font-bold flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            Quantum Security Protocol
          </h3>
          <div className="text-sm text-gray-400 leading-relaxed space-y-4">
            <p>
              All transactions are processed through the Razorpay financial interface. We do not
              store sensitive neural payment data on our servers. Credits are instantaneously
              synchronized with your NeuroID.
            </p>
            <p>
              Credits are required for advanced AI sub-tasks, deep linguistic analysis, and
              predictive coaching once your daily allocation of 3 free surges is exhausted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionHistory({ profile }: { profile: UserProfile | null }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getTransactions();
        if (!cancelled) setTransactions(data);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neon-blue" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 italic text-sm">
        No neural transactions detected in current session.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="glass bg-white/5 p-4 rounded-2xl flex items-center justify-between border-white/5"
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-xl ${
                tx.status === 'completed'
                  ? 'bg-green-400/10 text-green-400'
                  : 'bg-red-400/10 text-red-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-widest text-xs uppercase">
                  +{tx.credits} KR
                </span>
                <span className="text-[10px] text-gray-500 font-mono">₹{tx.amount}</span>
              </div>
              <p className="text-[10px] text-gray-500">
                {new Date(tx.createdAt).toLocaleDateString()}{' '}
                {new Date(tx.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                tx.status === 'completed'
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-yellow-400 bg-yellow-400/10'
              }`}
            >
              {tx.status}
            </span>
            <p className="text-[9px] font-mono text-gray-600 mt-1">
              {tx.razorpayPaymentId?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
