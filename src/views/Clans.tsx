import { useEffect, useMemo, useState } from 'react';
import { Crown, Flag, Shield, Swords, Trophy, Users, Zap, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useStore } from '../store/useStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

type Clan = { id: string; name: string; emblem: string; leader_id: string; level: number; xp: number; created_at: string };
type ClanMember = { clan_id: string; user_id: string; role: 'member' | 'officer' | 'leader'; joined_at: string; contribution_xp: number };
type Mission = { id: string; title: string; description: string | null; target: number; progress: number; xp_reward: number; ends_at: string | null };
type HistoryItem = { id: string; title: string; details: string | null; created_at: string };

export function Clans() {
  const { state } = useStore();
  const { user } = useAuth();
  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [newClanName, setNewClanName] = useState('');

  const loadClan = async () => {
    if (!user || !isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: membership, error: membershipError } = await supabase
        .from('clan_members').select('clan_id, user_id, role, joined_at, contribution_xp').eq('user_id', user.id).maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) { setClan(null); setMembers([]); setMissions([]); setHistory([]); return; }
      const [{ data: clanData, error: clanError }, { data: memberData, error: memberError }, { data: missionData, error: missionError }, { data: historyData, error: historyError }] = await Promise.all([
        supabase.from('clans').select('id,name,emblem,leader_id,level,xp,created_at').eq('id', membership.clan_id).single(),
        supabase.from('clan_members').select('*').eq('clan_id', membership.clan_id).order('joined_at', { ascending: true }),
        supabase.from('clan_missions').select('id,title,description,target,progress,xp_reward,ends_at').eq('clan_id', membership.clan_id).order('ends_at', { ascending: true, nullsFirst: false }).limit(10),
        supabase.from('clan_history').select('id,title,details,created_at').eq('clan_id', membership.clan_id).order('created_at', { ascending: false }).limit(10),
      ]);
      if (clanError) throw clanError;
      if (memberError) throw memberError;
      if (missionError) throw missionError;
      if (historyError) throw historyError;
      setClan(clanData as Clan); setDraft(clanData.name); setMembers((memberData ?? []) as ClanMember[]); setMissions((missionData ?? []) as Mission[]); setHistory((historyData ?? []) as HistoryItem[]);
    } catch (error) {
      console.error('Clan load failed', error);
      toast({ title: 'Could not load clan', type: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadClan(); }, [user?.id]);

  const createClan = async () => {
    if (!user || !isSupabaseConfigured()) return;
    const name = newClanName.trim();
    if (name.length < 3) { toast({ title: 'Clan name must be at least 3 characters', type: 'error' }); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.from('clans').insert({ name, leader_id: user.id }).select('id,name,emblem,leader_id,level,xp,created_at').single();
      if (error) throw error;
      setClan(data as Clan); setNewClanName(''); toast({ title: 'Clan founded', type: 'success' }); await loadClan();
    } catch (error: any) {
      const message = error?.code === '23505' ? 'That clan name is already taken' : 'Could not create clan';
      toast({ title: message, type: 'error' });
    } finally { setCreating(false); }
  };

  const saveName = async () => {
    if (!clan) return;
    const name = draft.trim();
    if (name.length < 3) return;
    const { error } = await supabase.from('clans').update({ name, updated_at: new Date().toISOString() }).eq('id', clan.id);
    if (error) { toast({ title: 'Could not update clan', type: 'error' }); return; }
    setClan({ ...clan, name }); setEditing(false); toast({ title: 'Clan updated', type: 'success' });
  };

  const seasonContribution = useMemo(() => Math.floor(state.seasonXp * 0.1), [state.seasonXp]);
  const clanXp = Number(clan?.xp ?? 0);
  const progress = Math.min(100, (clanXp % 1000) / 10);

  if (!user) return <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-8 text-center text-sm text-ink-400">Sign in to access Clans.</div>;
  if (loading) return <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-12 text-center"><RefreshCw size={24} className="mx-auto mb-3 animate-spin text-ember-400"/><p className="text-sm text-ink-400">Synchronizing clan command...</p></div>;

  if (!clan) return <div className="mx-auto max-w-xl rounded-[1.75rem] border border-white/10 bg-ink-950/70 p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.3em] text-ember-400"><Shield size={14}/> Clan Command</div><h1 className="font-display text-3xl font-black uppercase sm:text-4xl">Found Your Clan</h1><p className="mt-3 text-sm leading-6 text-ink-400">Create your squad and turn seasonal progression into shared progress.</p><div className="mt-6 flex flex-col gap-2 sm:flex-row"><input value={newClanName} onChange={e => setNewClanName(e.target.value)} maxLength={28} placeholder="Clan name" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"/><button disabled={creating} onClick={() => void createClan()} className="btn-primary text-xs uppercase tracking-widest"><Plus size={14}/> {creating ? 'Founding...' : 'Found Clan'}</button></div></div>;

  return <div className="space-y-5 pb-8">
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-950/70 p-5 sm:p-8"><div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-ember-500/10 blur-3xl"/><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.3em] text-ember-400"><Users size={14}/> Clan Command</div><h1 className="font-display text-3xl font-black uppercase sm:text-5xl">{clan.name}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink-300">A persistent squad powered by real Supabase membership, missions and seasonal contribution.</p></div><div className="flex gap-2"><button onClick={() => void loadClan()} className="btn-ghost text-xs" aria-label="Refresh clan"><RefreshCw size={14}/></button>{clan.leader_id === user.id && <button onClick={() => setEditing(v => !v)} className="btn-ghost text-xs uppercase tracking-widest">{editing ? 'Close' : 'Manage Clan'}</button>}</div></div>{editing && clan.leader_id === user.id && <div className="relative mt-5 flex flex-col gap-2 sm:flex-row"><input value={draft} onChange={e => setDraft(e.target.value)} maxLength={28} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"/><button onClick={() => void saveName()} className="btn-primary text-xs">Save Name</button></div>}</header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={Crown} label="Clan Level" value={String(clan.level)}/><Stat icon={Zap} label="Clan XP" value={clanXp.toLocaleString()}/><Stat icon={Users} label="Members" value={String(members.length)}/><Stat icon={Flag} label="Missions" value={String(missions.length)}/></section>
    <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Clan Progress</p><h2 className="mt-1 font-display text-xl font-bold uppercase">Season Contribution</h2></div><Shield size={20} className="text-ink-500"/></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-gold-500" style={{width:`${progress}%`}}/></div><div className="mt-2 flex justify-between text-[10px] text-ink-500"><span>{Math.floor(clanXp % 1000).toLocaleString()} XP</span><span>1,000 XP</span></div><p className="mt-3 text-xs text-ink-500">Your current season contribution signal: {seasonContribution.toLocaleString()} XP.</p></article><article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Clan Mission</p><h2 className="mt-1 font-display text-xl font-bold uppercase">{missions[0]?.title ?? 'Raise the Standard'}</h2><p className="mt-2 text-xs leading-5 text-ink-400">{missions[0]?.description ?? 'Contribute through daily missions and training.'}</p>{missions[0] && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-ember-500" style={{width:`${Math.min(100, missions[0].progress / Math.max(1, missions[0].target) * 100)}%`}}/></div>}<div className="mt-4 flex items-center gap-2 text-xs text-ink-300"><Swords size={15}/> {missions[0] ? `${missions[0].progress}/${missions[0].target}` : 'Awaiting mission data'}</div></article></section>
    <section className="grid gap-4 lg:grid-cols-2"><article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center gap-2"><Users size={18}/><h2 className="font-display text-xl font-bold uppercase">Members</h2></div><div className="mt-4 space-y-2">{members.map(member => <div key={member.user_id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.02] px-3 py-3"><div><p className="text-xs font-semibold">{member.user_id === user.id ? 'You' : `Hunter ${member.user_id.slice(0, 6)}`}</p><p className="text-[10px] uppercase tracking-widest text-ink-500">{member.role}</p></div><span className="font-mono text-xs text-ember-400">{Number(member.contribution_xp).toLocaleString()} XP</span></div>)}</div></article><article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center gap-2"><Trophy size={18}/><h2 className="font-display text-xl font-bold uppercase">Clan History</h2></div><div className="mt-4 space-y-2">{history.length ? history.map(item => <div key={item.id} className="rounded-xl border border-white/5 bg-white/[.02] p-3"><p className="text-xs font-semibold">{item.title}</p><p className="mt-1 text-[10px] text-ink-500">{item.details ?? ''} · {new Date(item.created_at).toLocaleDateString()}</p></div>) : <p className="text-xs text-ink-500">No history recorded yet.</p>}</div></article></section>
  </div>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Icon size={16} className="mb-3 text-ember-400"/><strong className="block font-mono text-xl">{value}</strong><span className="text-[10px] uppercase tracking-widest text-ink-500">{label}</span></div>; }
