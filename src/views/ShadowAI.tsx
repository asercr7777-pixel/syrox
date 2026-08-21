import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Brain, ChevronDown, Copy, Dumbbell, Eraser, MessageSquare, Send, Sparkles, Trash2, User, WandSparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ViewId } from '../components/Navigation';
import { toast } from '../components/ui/Toast';

interface ShadowAIProps { onNavigate: (view: ViewId) => void; }
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; };
const STORAGE_KEY = 'forged-shadow-ai-chat-v2';

const suggestions = [
  'Help me plan my day',
  'Explain something I am studying',
  'Help me with a coding problem',
  'Give me a safe workout idea',
];

function starterMessage(): ChatMessage { return { id: 'welcome', role: 'assistant', content: "Hey — I'm Shadow. I can help with almost anything: studying, coding, planning, writing, the Forged app, workouts, ideas, or just explaining something clearly. What are we working on?" }; }

export function ShadowAI({ onNavigate: _onNavigate }: ShadowAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return Array.isArray(saved) && saved.length ? saved : [starterMessage()]; } catch { return [starterMessage()]; }
  });
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); }, [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: sending ? 'smooth' : 'auto' }); }, [messages, sending]);

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.slice(0, 4000) };
    const next = [...messages, userMessage];
    setMessages(next); setInput(''); setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('shadow-ai', { body: { messages: next.map(({ role, content }) => ({ role, content })) } });
      if (error) throw error;
      if (!data?.message) throw new Error(data?.error || 'Shadow did not return a response.');
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: data.message }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Shadow AI could not respond right now.';
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: `I couldn't reach Shadow right now. ${message.includes('not configured') ? 'The AI service still needs its server-side API key configured.' : 'Please try again in a moment.'}` }]);
    } finally { setSending(false); }
  };

  const clearChat = () => { setMessages([starterMessage()]); localStorage.removeItem(STORAGE_KEY); };
  const copyMessage = async (message: ChatMessage) => { try { await navigator.clipboard.writeText(message.content); setCopied(message.id); setTimeout(() => setCopied(null), 1200); } catch { toast({ title: 'Copy unavailable', message: 'Your browser blocked clipboard access.', type: 'error' }); } };

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-2">
    <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_15%_0%,rgba(124,92,255,.20),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(34,211,238,.13),transparent_32%),linear-gradient(145deg,#111522,#080a10_72%)] p-5 shadow-[0_25px_80px_rgba(0,0,0,.28)] sm:p-7">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4"><div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 shadow-[0_0_45px_rgba(99,102,241,.18)]"><Brain size={28} className="text-cyan-200"/><span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0b0e15] bg-emerald-400"/></div><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.28em] text-cyan-300/60">FORGED INTELLIGENCE</p><h1 className="mt-1 truncate font-display text-2xl font-black tracking-tight text-white sm:text-3xl">SHADOW</h1><p className="mt-1 text-xs text-ink-400 sm:text-sm">Your general-purpose AI companion inside Forged.</p></div></div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Online</div>
      </div>
    </section>

    <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#080a0f]/90 shadow-[0_25px_80px_rgba(0,0,0,.24)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5"><div className="flex items-center gap-2 text-xs font-bold text-ink-300"><MessageSquare size={15} className="text-cyan-300"/> Shadow Chat</div><button onClick={clearChat} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-ink-500 transition hover:bg-white/[0.04] hover:text-ink-200"><Trash2 size={13}/> Clear</button></div>
      <div className="min-h-[420px] max-h-[62vh] overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-7">
        {messages.length === 1 && <div className="mx-auto mb-7 max-w-xl text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200"><WandSparkles size={21}/></div><p className="text-sm font-bold text-ink-200">What can Shadow help you with?</p><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => setInput(suggestion)} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-xs text-ink-400 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-ink-200">{suggestion}</button>)}</div></div>}
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map((message) => <div key={message.id} className={`flex gap-2.5 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-200"><Bot size={16}/></div>}
            <div className={`group max-w-[88%] sm:max-w-[78%] ${message.role === 'user' ? 'order-1' : ''}`}><div className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_10px_30px_rgba(99,102,241,.16)]' : 'rounded-bl-md border border-white/[0.06] bg-white/[0.025] text-ink-200'}`}>{message.content}</div>{message.role === 'assistant' && <button onClick={() => copyMessage(message)} className="mt-1.5 inline-flex items-center gap-1 px-1 text-[9px] text-ink-600 opacity-0 transition group-hover:opacity-100 hover:text-ink-300">{copied === message.id ? <><Sparkles size={11}/> Copied</> : <><Copy size={11}/> Copy</>}</button>}</div>
            {message.role === 'user' && <div className="order-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-300/10 bg-violet-400/[0.08] text-violet-200"><User size={16}/></div>}
          </div>)}
          {sending && <div className="flex gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-200"><Bot size={16}/></div><div className="rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.025] px-4 py-3"><div className="flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300"/><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:120ms]"/><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:240ms]"/></div></div></div>}
          <div ref={endRef}/>
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-black/20 p-3 sm:p-4"><form onSubmit={sendMessage} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#10131b] p-2 shadow-[0_10px_40px_rgba(0,0,0,.22)]"><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} rows={1} maxLength={4000} disabled={sending} placeholder="Message Shadow..." className="max-h-32 min-h-[42px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-ink-100 outline-none placeholder:text-ink-600"/><button type="submit" disabled={!input.trim() || sending} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-500 text-[#07090d] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-30"><Send size={17}/></button></form><div className="mx-auto mt-2 flex max-w-3xl items-center justify-between px-1 text-[9px] text-ink-700"><span>Enter to send · Shift+Enter for a new line</span><span>{input.length}/4000</span></div></div>
    </section>

    <div className="grid gap-3 sm:grid-cols-3"><InfoCard icon={<Sparkles size={17}/>} title="General AI" text="Study, write, plan, brainstorm, explain, or ask questions."/><InfoCard icon={<Dumbbell size={17}/>} title="Forged-aware" text="Shadow can help you use the app and organize your routine."/><InfoCard icon={<Eraser size={17}/>} title="Private chat" text="Your conversation is kept in this browser until you clear it."/></div>
  </div>;
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4"><div className="mb-2 flex items-center gap-2 text-cyan-300">{icon}<span className="text-xs font-bold text-ink-200">{title}</span></div><p className="text-[11px] leading-5 text-ink-500">{text}</p></div>; }
