import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { generateCoachResponse, getGreeting } from '../lib/coachEngine';
import { Markdown } from '../components/ui/Markdown';
import { Send, Sparkles, Dumbbell, Apple, Heart, Zap, Brain, RotateCcw } from 'lucide-react';

const QUICK_PROMPTS = [
  { icon: Dumbbell, label: 'Push/Pull/Legs', text: 'Give me a push pull legs workout routine' },
  { icon: Brain, label: 'Exercise Form', text: 'How do I squat with proper form?' },
  { icon: Apple, label: 'Calculate Calories', text: 'Calculate my daily calories and protein. I\'m 80kg, 180cm, 25 years old, male, and I want to build muscle.' },
  { icon: Heart, label: 'Recovery', text: 'How do I deal with muscle soreness?' },
  { icon: Zap, label: 'Fat Loss', text: 'How do I lose fat and keep muscle?' },
  { icon: Apple, label: 'Meal Plan', text: 'Give me a healthy meal plan for building muscle' },
];

export function Shadow() {
  const { state, sendChat, addAIMessage, clearChat } = useStore();
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    if (!hasGreetedRef.current && state.chat.length === 0) {
      hasGreetedRef.current = true;
      const greeting = getGreeting(state);
      const timer = setTimeout(() => addAIMessage(greeting), 400);
      return () => clearTimeout(timer);
    }
    hasGreetedRef.current = true;
  }, [state, addAIMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [state.chat, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    };
  }, []);

  const handleSend = useCallback(() => {
    if (!chatInput.trim() || isTyping) return;
    const text = chatInput.trim();
    setChatInput('');
    setIsTyping(true);
    sendChat(text);

    const delay = 600 + Math.min(1200, text.length * 8);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    responseTimeoutRef.current = setTimeout(() => {
      const response = generateCoachResponse(state, text);
      addAIMessage(response);
      setIsTyping(false);
    }, delay);
  }, [chatInput, isTyping, sendChat, addAIMessage, state]);

  const handleQuickPrompt = useCallback((promptText: string) => {
    if (isTyping) return;
    setChatInput('');
    setIsTyping(true);
    sendChat(promptText);

    const delay = 600 + Math.min(1200, promptText.length * 8);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    responseTimeoutRef.current = setTimeout(() => {
      const response = generateCoachResponse(state, promptText);
      addAIMessage(response);
      setIsTyping(false);
    }, delay);
  }, [isTyping, sendChat, addAIMessage, state]);

  const handleClearChat = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    setIsTyping(false);
    clearChat();
  }, [clearChat]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)', maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="card-premium px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 flex-shrink-0">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 energy-pulse"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}
        >
          <Sparkles size={20} className="text-shadow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-bold text-gradient-shadow">AI Coach</h1>
          <p className="text-xs text-ink-400 truncate">Your personal fitness & nutrition coach</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald2-500/10 border border-emerald2-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald2-400 animate-pulse" />
            <span className="text-xs text-emerald2-400 font-medium">Online</span>
          </div>
          {state.chat.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg text-ink-400 hover:text-ink-200 hover:bg-white/5 transition"
              title="Clear conversation"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 md:px-6 space-y-4"
      >
        {state.chat.length === 0 && !isTyping && (
          <WelcomeScreen onPrompt={handleQuickPrompt} />
        )}

        <AnimatePresence initial={false}>
          {state.chat.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-shadow-500/15 border border-shadow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={14} className="text-shadow-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-ember-500/20 to-ember-600/10 border border-ember-500/20 text-ink-100 rounded-br-md'
                    : 'bg-ink-800/50 border border-white/5 text-ink-200 rounded-bl-md'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <Markdown content={msg.text} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-lg bg-shadow-500/15 border border-shadow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={14} className="text-shadow-400" />
            </div>
            <div className="px-4 py-3.5 rounded-2xl bg-ink-800/50 border border-white/5 rounded-bl-md flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-shadow-400 typing-dot"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick prompts (shown when chat is empty or as a compact row) */}
      {state.chat.length <= 1 && !isTyping && (
        <div className="px-4 pb-2 md:px-6 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleQuickPrompt(prompt.text)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ink-800/60 border border-white/5 text-xs font-medium text-ink-300 hover:border-shadow-500/30 hover:text-shadow-400 transition-all whitespace-nowrap flex-shrink-0"
              >
                <prompt.icon size={14} />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 md:px-6 md:pb-6 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              className="input resize-none pr-4 py-3 max-h-32 min-h-[48px] leading-relaxed"
              placeholder="Ask your coach about workouts, nutrition, form, recovery..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!chatInput.trim() || isTyping}
            className="btn-primary btn-sheen px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-ink-500 mt-2 text-center">
          AI Coach provides fitness & nutrition guidance. Not medical advice — consult a professional for health concerns.
        </p>
      </div>
    </div>
  );
}

function WelcomeScreen({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', duration: 0.6 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 energy-pulse"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        <Sparkles size={28} className="text-shadow-400" />
      </motion.div>
      <h2 className="font-display text-xl font-bold text-ink-100 mb-2">Your AI Coach</h2>
      <p className="text-sm text-ink-400 max-w-md mb-6 leading-relaxed">
        I'm here to help you train smarter, eat better, and recover properly. Ask me about workouts, nutrition, form, supplements, or anything fitness-related.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-w-lg w-full">
        {QUICK_PROMPTS.map((prompt, i) => (
          <motion.button
            key={prompt.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            onClick={() => onPrompt(prompt.text)}
            className="card p-3 flex flex-col items-center gap-1.5 hover:border-shadow-500/30 hover:bg-shadow-500/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-shadow-500/10 flex items-center justify-center group-hover:bg-shadow-500/20 transition-colors">
              <prompt.icon size={16} className="text-shadow-400" />
            </div>
            <span className="text-xs font-medium text-ink-300">{prompt.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
