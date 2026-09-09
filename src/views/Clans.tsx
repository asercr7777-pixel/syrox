import { useMemo, useState } from 'react';
import { Crown, Flag, Shield, Swords, Trophy, Users, Zap } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useStore } from '../store/useStore';

const CLAN_KEY = 'stryven-clan-profile';
interface ClanProfile { name: string; emblem: string; joinedAt: number; level: number; xp: number; missions: number; }
const defaultClan = (username: string): ClanProfile => ({ name: `${username || 'Hunter'} Vanguard`, emblem: '◆', joinedAt: Date.now(), level: 1, xp: 0, missions: 0 });

export function Clans() {
  const { state } = useStore();
  const { user } = useAuth();
  const [clan, setClan] = useState<ClanProfile>(() => { try { const raw = localStorage.getItem(CLAN_KEY); return raw ? { ...defaultClan(state.username), ...JSON.parse(raw) } : defaultClan(state.username); } catch { return defaultClan(state.username); } });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(clan.name);
  const save = () => { const next = { ...clan, name: draft.trim() || clan.name }; setClan(next); localStorage.setItem(CLAN_KEY, JSON.stringify(next)); setEditing(false); };
  const seasonXp = state.seasonXp;
  const clanXp = useMemo(() => clan.xp + Math.floor(seasonXp * .1), [clan.xp, seasonXp]);
  const progress = Math.min(100, clanXp % 1000 / 10);
  return <div className="space-y-5 pb-8">
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-950/70 p-5 sm:p-8">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.3em] text-ember-400"><Users size={14}/> Clan Command</div><h1 className="font-display text-3xl font-black uppercase sm:text-5xl">{clan.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink-300">Build a persistent squad around discipline, progression and seasonal objectives.</p></div>
        <button onClick={() => setEditing(v => !v)} className="btn-ghost self-start text-xs uppercase tracking-widest">{editing ? 'Close' : 'Manage Clan'}</button>
      </div>
      {editing && <div className="relative mt-5 flex flex-col gap-2 sm:flex-row"><input value={draft} onChange={e => setDraft(e.target.value)} maxLength={28} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" /><button onClick={save} className="btn-primary text-xs">Save Name</button></div>}
    </header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={Crown} label="Clan Level" value={String(clan.level)} />
      <Stat icon={Zap} label="Clan XP" value={clanXp.toLocaleString()} />
      <Stat icon={Users} label="Members" value="1" />
      <Stat icon={Flag} label="Missions" value={String(clan.missions)} />
    </section>
    <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Clan Progress</p><h2 className="mt-1 font-display text-xl font-bold uppercase">Season Contribution</h2></div><Shield size={20} className="text-ink-500"/></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-gold-500" style={{ width: `${progress}%` }}/></div><div className="mt-2 flex justify-between text-[10px] text-ink-500"><span>{Math.floor(clanXp % 1000).toLocaleString()} XP</span><span>1,000 XP</span></div></article>
      <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Clan Mission</p><h2 className="mt-1 font-display text-xl font-bold uppercase">Raise the Standard</h2><p className="mt-2 text-xs leading-5 text-ink-400">Contribute season XP through your daily missions and training.</p><div className="mt-4 flex items-center gap-2 text-xs text-ink-300"><Swords size={15}/> Contribution is linked to your progression.</div></article>
    </section>
    <section className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center gap-2"><Trophy size={18}/><h2 className="font-display text-xl font-bold uppercase">Clan History</h2></div><div className="mt-4 rounded-xl border border-white/5 bg-white/[.02] p-4 text-xs text-ink-400">Founded {new Date(clan.joinedAt).toLocaleDateString()} · Season XP contribution {seasonXp.toLocaleString()}.</div></section>
    {!user && <p className="text-xs text-ink-500">Sign in to persist clan progress.</p>}
  </div>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Icon size={16} className="mb-3 text-ember-400"/><strong className="block font-mono text-xl">{value}</strong><span className="text-[10px] uppercase tracking-widest text-ink-500">{label}</span></div>; }
