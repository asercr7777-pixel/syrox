import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Circle, MessageCircle, Send, ShieldCheck, Users, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from '../components/ui/Toast';

interface CommunityMessage {
  id: string;
  user_id: string;
  username: string;
  avatar: string;
  body: string;
  created_at: string;
}

const MAX_MESSAGES = 100;

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isImageAvatar(value: string) {
  return /^https?:\/\//.test(value) || value.startsWith('data:image/');
}

export function Community() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(1);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const canSend = useMemo(() => Boolean(user && draft.trim().length > 0 && draft.length <= 500 && !sending), [user, draft, sending]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from('community_messages')
        .select('id,user_id,username,avatar,body,created_at')
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES);
      if (!active) return;
      if (error) toast({ title: 'Community unavailable', message: error.message, type: 'error' });
      else setMessages((data ?? []).reverse() as CommunityMessage[]);
      setLoading(false);
    };

    void load();

    const channel = supabase.channel('community-live', { config: { presence: { key: user.id } } });
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
        const incoming = payload.new as CommunityMessage;
        setMessages((current) => current.some((m) => m.id === incoming.id) ? current : [...current, incoming].slice(-MAX_MESSAGES));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnline(Math.max(1, Object.keys(state).length));
      })
      .on('presence', { event: 'join' }, () => setOnline(Math.max(1, Object.keys(channel.presenceState()).length)))
      .on('presence', { event: 'leave' }, () => setOnline(Math.max(1, Object.keys(channel.presenceState()).length)));

    channel.subscribe(async (status) => {
      if (!active) return;
      if (status === 'SUBSCRIBED') {
        setConnected(true);
        await channel.track({ online_at: new Date().toISOString() });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnected(false);
      }
    });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !messages.length) return;
    if (!didInitialScroll.current) {
      el.scrollTop = el.scrollHeight;
      didInitialScroll.current = true;
      return;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 180) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !canSend) return;
    const body = draft.trim();
    setSending(true);
    const { error } = await supabase.from('community_messages').insert({ user_id: user.id, body });
    setSending(false);
    if (error) {
      toast({ title: 'Message not sent', message: error.message, type: 'error' });
      return;
    }
    setDraft('');
  };

  const reportMessage = async (messageId: string) => {
    if (!user || reported.has(messageId)) return;
    const { error } = await supabase.from('community_reports').insert({ message_id: messageId, reporter_id: user.id });
    if (error && error.code !== '23505') {
      toast({ title: 'Report failed', message: error.message, type: 'error' });
      return;
    }
    setReported((current) => new Set(current).add(messageId));
    toast({ title: 'Reported', message: 'Thanks. The message has been flagged.', type: 'success' });
  };

  return <section className="mx-auto w-full max-w-4xl space-y-4 pb-2">
    <header className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#101522] via-[#0b0e15] to-[#080a0f] p-4 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.28em] text-cyan-300"><MessageCircle size={13} /> Community</div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">The Forge</h1>
          <p className="mt-1 max-w-xl text-xs leading-5 text-ink-400 sm:text-sm">A live public room for Hunters. Everyone here can see the conversation.</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold uppercase tracking-wider text-ink-500"><Users size={12} /> Online</div>
          <div className="mt-0.5 text-lg font-black tabular-nums text-cyan-200">{online}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-wider">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${connected ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300' : 'border-rose-400/20 bg-rose-400/[0.06] text-rose-300'}`}>{connected ? <Wifi size={11} /> : <WifiOff size={11} />}{connected ? 'Live connection' : 'Reconnecting'}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-ink-500"><ShieldCheck size={11} /> Keep it respectful</span>
      </div>
    </header>

    <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-black/30 shadow-[0_18px_50px_rgba(0,0,0,.25)]">
      <div ref={scrollRef} className="h-[min(62vh,620px)] min-h-[360px] overflow-y-auto overscroll-contain p-3 sm:p-5">
        {loading ? <div className="flex h-full items-center justify-center text-sm text-ink-500"><Circle className="mr-2 animate-pulse" size={12} />Loading community…</div> : messages.length === 0 ? <div className="flex h-full flex-col items-center justify-center px-6 text-center"><div className="mb-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-cyan-200"><MessageCircle size={26} /></div><p className="font-bold text-ink-200">The Forge is quiet.</p><p className="mt-1 max-w-xs text-xs leading-5 text-ink-500">Start the conversation with the first message.</p></div> : <div className="space-y-2.5">
          {messages.map((message) => {
            const mine = message.user_id === user?.id;
            return <article key={message.id} className={`group flex gap-2.5 rounded-2xl p-2.5 transition ${mine ? 'bg-cyan-300/[0.035]' : 'hover:bg-white/[0.025]'}`}>
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] text-base">
                {isImageAvatar(message.avatar) ? <img src={message.avatar} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span>{message.avatar || '🐺'}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline gap-2"><span className={`truncate text-xs font-bold ${mine ? 'text-cyan-200' : 'text-ink-200'}`}>{message.username || 'Hunter'}</span><span className="shrink-0 text-[9px] text-ink-700">{formatTime(message.created_at)}</span></div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-5 text-ink-300">{message.body}</p>
              </div>
              {!mine && <button type="button" onClick={() => void reportMessage(message.id)} disabled={reported.has(message.id)} aria-label="Report message" title="Report message" className="self-start rounded-lg p-1.5 text-ink-700 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100 disabled:text-emerald-300 sm:opacity-0">{reported.has(message.id) ? <Check size={13} /> : <AlertTriangle size={13} />}</button>}
            </article>;
          })}
        </div>}
      </div>

      <div className="border-t border-white/[0.07] bg-[#090c12] p-3 sm:p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2 focus-within:border-cyan-300/20">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 500))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Write to the community…" rows={1} maxLength={500} className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-100 outline-none placeholder:text-ink-600" aria-label="Community message" />
          <div className="flex shrink-0 items-center gap-1.5"><span className="hidden text-[9px] tabular-nums text-ink-700 sm:inline">{draft.length}/500</span><button type="button" onClick={() => void sendMessage()} disabled={!canSend} aria-label="Send message" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"><Send size={16} /></button></div>
        </div>
        <p className="mt-2 px-1 text-[9px] leading-4 text-ink-700">Enter to send · Shift + Enter for a new line · Messages are public to signed-in users.</p>
      </div>
    </div>
  </section>;
}
