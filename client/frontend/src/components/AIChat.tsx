import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, User, Bot, Trash2, Zap } from 'lucide-react';
import { getAIChatResponse, getChatHistory, clearChatHistory } from '../lib/api';
import type { Goal, UserProfile } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: 'Greetings, Commander. NeuroAssistant is online. How can I augment your productivity today?',
};

interface AIChatProps {
  profile: UserProfile | null;
  goals?: Goal[];
  onNavigate?: (tab: string) => void;
  onProfileUpdate?: (updates: Partial<UserProfile>) => void;
}

// ---------------------------------------------------------------------------
// Lightweight markdown → JSX renderer (no external deps)
// Handles: ## headings, **bold**, `code`, bullet lists, numbered lists
// ---------------------------------------------------------------------------
function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = (key: string) => {
    if (!listItems.length) return;
    if (listType === 'ol') {
      elements.push(
        <ol key={key} className="list-decimal list-inside space-y-1 my-2 pl-1">
          {listItems.map((li, i) => (
            <li key={i} className="text-gray-300">{inlineFormat(li)}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={key} className="space-y-1 my-2">
          {listItems.map((li, i) => (
            <li key={i} className="flex gap-2 text-gray-300">
              <span className="text-neon-blue mt-1 shrink-0">▸</span>
              <span>{inlineFormat(li)}</span>
            </li>
          ))}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((line, i) => {
    const ulMatch = line.match(/^[-*]\s+(.*)/);
    const olMatch = line.match(/^\d+\.\s+(.*)/);
    const h3Match = line.match(/^###\s+(.*)/);
    const h2Match = line.match(/^##\s+(.*)/);
    const hrMatch = line.match(/^---+$/);

    if (ulMatch) {
      if (listType === 'ol') flushList(`fl-${i}`);
      listType = 'ul';
      listItems.push(ulMatch[1]);
    } else if (olMatch) {
      if (listType === 'ul') flushList(`fl-${i}`);
      listType = 'ol';
      listItems.push(olMatch[1]);
    } else {
      flushList(`fl-${i}`);
      if (h3Match) {
        elements.push(
          <h3 key={i} className="text-xs font-bold uppercase tracking-widest text-neon-blue mt-4 mb-1">
            {h3Match[1]}
          </h3>
        );
      } else if (h2Match) {
        elements.push(
          <h2 key={i} className="text-sm font-black uppercase tracking-widest text-neon-blue mt-4 mb-1 border-b border-neon-blue/20 pb-1">
            {h2Match[1]}
          </h2>
        );
      } else if (hrMatch) {
        elements.push(<hr key={i} className="border-white/10 my-3" />);
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(<p key={i} className="leading-relaxed">{inlineFormat(line)}</p>);
      }
    }
  });
  flushList('end');

  return <div className="space-y-0.5 text-sm">{elements}</div>;
}

function inlineFormat(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part))
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part))
      return <em key={i} className="text-gray-200 italic">{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part))
      return <code key={i} className="bg-white/10 text-neon-blue px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

export function AIChat({ profile, goals = [], onNavigate, onProfileUpdate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canChat = (profile?.freeChatsToday || 0) > 0 || (profile?.credits || 0) >= 0.25;

  // Load persisted chat history on mount
  useEffect(() => {
    if (!profile) { setHistoryLoading(false); return; }
    getChatHistory()
      .then((history) => setMessages(history.length > 0 ? history : [GREETING]))
      .catch(() => setMessages([GREETING]))
      .finally(() => setHistoryLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  // Compute messages with date separators
  const messagesWithDates = useMemo(() => {
    type Sep = { _sep: true; date: string; key: string };
    const result: Array<Message | Sep> = [];
    let lastDate = '';
    for (const msg of messages) {
      if (msg.createdAt) {
        const d = new Date(msg.createdAt).toLocaleDateString('en-US', {
          weekday: 'long', month: 'short', day: 'numeric',
        });
        if (d !== lastDate) {
          result.push({ _sep: true, date: d, key: `sep-${msg.id}` });
          lastDate = d;
        }
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !profile) return;

    if (!canChat) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            'Neural resource exhaustion detected. Please synchronize with the Wallet to acquire more credits or wait for the daily cycle reset.',
        },
      ]);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build a context snippet from active goals for the request
    const activeGoals = goals.filter((g) => g.status === 'active');
    const goalContext = activeGoals.length
      ? 'Active goals: ' + activeGoals.map((g) => `"${g.title}" (${g.progress}% done)`).join(', ')
      : '';

    try {
      const { response, freeChatsToday, credits } = await getAIChatResponse(input, goalContext);

      onProfileUpdate?.({ freeChatsToday, credits });

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: response },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Communication failure. AI systems undergoing reboot.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <Sparkles className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h3 className="font-bold tracking-tight">
              NeuroAssistant{' '}
              <span className="text-[10px] uppercase bg-neon-blue/10 text-neon-blue px-1.5 py-0.5 rounded ml-2">
                V3.1-PRO
              </span>
            </h3>
            <div className="flex gap-3 mt-0.5">
              <span className="text-[9px] text-gray-500 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-neon-blue" /> {profile?.freeChatsToday} Free Left
              </span>
              <button
                onClick={() => onNavigate?.('wallet')}
                className="text-[9px] text-gray-500 flex items-center gap-1 hover:text-neon-purple transition-colors"
                title="Synchronize Wallet"
              >
                <Zap className="w-2.5 h-2.5 text-neon-purple" /> {parseFloat((profile?.credits ?? 0).toFixed(2))} Credits (Recharge)
              </button>
              {goals.filter((g) => g.status === 'active').length > 0 && (
                <span className="text-[9px] text-gray-600 flex items-center gap-1">
                  · {goals.filter((g) => g.status === 'active').length} goals loaded
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            await clearChatHistory().catch(() => {});
            setMessages([GREETING]);
          }}
          className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Clear history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {historyLoading ? (
          <div className="flex justify-center items-center h-32 text-gray-600 text-xs uppercase tracking-widest animate-pulse">
            Loading transmission log…
          </div>
        ) : messagesWithDates.map((item) => {
          if ('_sep' in item) {
            return (
              <div key={item.key} className="flex items-center gap-4 my-1">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-gray-600 uppercase tracking-widest shrink-0">{item.date}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            );
          }
          const msg = item as Message;
          return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center shrink-0 border border-neon-blue/20 mt-1">
                <Bot className="w-4 h-4 text-neon-blue" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-5 py-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20 rounded-tr-none text-sm leading-relaxed'
                  : 'glass text-gray-300 rounded-tl-none border border-white/5'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownBlock text={msg.content} />
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center shrink-0 border border-neon-purple/20 mt-1">
                <User className="w-4 h-4 text-neon-purple" />
              </div>
            )}
          </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-neon-blue" />
            </div>
            <div className="glass px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/5">
              <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white/5 border-t border-white/5">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Transmit command to AI coach..."
            className="flex-1 glass px-5 py-3 rounded-xl outline-none focus:ring-1 focus:ring-neon-blue text-sm"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="w-12 h-12 bg-neon-blue text-black rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

