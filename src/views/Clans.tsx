import { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Flag, Shield, Swords, Trophy, Users, Zap, Plus, RefreshCw, Upload, Search, UserPlus, LogOut, Settings2, Check, X, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useStore } from '../store/useStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

type Role = 'member' | 'officer' | 'leader';
type Clan = { id: string; name: string; emblem: string; image_url: string | null; description: string | null; leader_id: string; level: number; xp: number; max_members: number; created_at: string };
type Member = { clan_id: string; user_id: string; role: Role; joined_at: string; contribution_xp: number; username?: string; avatar?: string };
type Mission = { id: string; title: string; description: string | null; target: number; progress: number; xp_reward: number; ends_at: string | null; completed_at: string | null };
type HistoryItem = { id: string; event_type: string; title: string; details: string | null; created_at: string };
type Request = { id: string; user_id: string; created_at: string; username?: string; avatar?: string };
type ClanSearch = { id: string; name: string; emblem: string; image_url: string | null; level: number; xp: number; max_members: number; member_count: number };

const EMBLEMS = ['⚔️', '🐺', '🔥', '☠️', '🛡️', '👁️', '🐉', '🩸', '🌑', '⚡', '🦅', '👑'];

export function Clans() {
  const { user } = useAuth();
  const { state } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [season, setSeason] = useState<{ id: string; season_number: number; name: string } | null>(null);
  const [seasonRank, setSeasonRank] = useState<number | null>(null);
  const [clanSeasonXp, setClanSeasonXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'overview' | 'members' | 'missions' | 'history'>('overview');
  const [manage, setManage] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [emblem, setEmblem] = useState('⚔️');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ClanSearch[]>([]);
  const [pendingRequest, setPendingRequest] = useState<string | null>(null);

  const isLeader = !!clan && clan.leader_id === user?.id;
  const myMembership = members.find(m => m.user_id === user?.id);
  const isManager = myMembership?.role === 'leader' || myMembership?.role === 'officer';

  const loadClan = async () => {
    if (!user || !isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: membership, error: membershipError } = await supabase.from('clan_members').select('clan_id,user_id,role,joined_at,contribution_xp').eq('user_id', user.id).maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) { setClan(null); setMembers([]); setMissions([]); setHistory([]); setRequests([]); return; }
      const [{ data: c, error: ce }, { data: m, error: me }, { data: mi, error: mie }, { data: h, error: he }, { data: r, error: re }, { data: s }] = await Promise.all([
        supabase.from('clans').select('id,name,emblem,image_url,description,leader_id,level,xp,max_members,created_at').eq('id', membership.clan_id).single(),
        supabase.from('clan_members').select('clan_id,user_id,role,joined_at,contribution_xp').eq('clan_id', membership.clan_id).order('role', { ascending: false }).order('joined_at', { ascending: true }),
        supabase.from('clan_missions').select('id,title,description,target,progress,xp_reward,ends_at,completed_at').eq('clan_id', membership.clan_id).order('completed_at', { ascending: true, nullsFirst: true }).order('ends_at', { ascending: true }).limit(20),
        supabase.from('clan_history').select('id,event_type,title,details,created_at').eq('clan_id', membership.clan_id).order('created_at', { ascending: false }).limit(30),
        supabase.from('clan_join_requests').select('id,user_id,created_at').eq('clan_id', membership.clan_id).eq('status', 'pending').order('created_at', { ascending: true }),
        supabase.from('seasons').select('id,season_number,name').eq('status','active').order('season_number',{ascending:false}).limit(1).maybeSingle(),
      ]);
      if (ce || me || mie || he || re) throw ce || me || mie || he || re;
      const rawMembers = (m ?? []) as Member[];
      const ids = rawMembers.map(x => x.user_id);
      const { data: profiles } = ids.length ? await supabase.from('profiles').select('id,username,avatar').in('id', ids) : { data: [] as any[] };
      const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const hydrated = rawMembers.map(x => ({ ...x, username: pMap.get(x.user_id)?.username, avatar: pMap.get(x.user_id)?.avatar }));
      const rawRequests = (r ?? []) as Request[];
      const requestIds = rawRequests.map(x => x.user_id);
      const { data: reqProfiles } = requestIds.length ? await supabase.from('profiles').select('id,username,avatar').in('id', requestIds) : { data: [] as any[] };
      const rp = new Map((reqProfiles ?? []).map((p: any) => [p.id, p]));
      setClan(c as Clan); setDraftName((c as Clan).name); setDraftDescription((c as Clan).description ?? ''); setEmblem((c as Clan).emblem || '⚔️');
      setMembers(hydrated); setMissions((mi ?? []) as Mission[]); setHistory((h ?? []) as HistoryItem[]); setRequests(rawRequests.map(x => ({ ...x, username: rp.get(x.user_id)?.username, avatar: rp.get(x.user_id)?.avatar })));
      if (s) {
        setSeason(s as any);
        const { data: score } = await supabase.from('clan_season_scores').select('xp,rank').eq('season_id', (s as any).id).eq('clan_id', membership.clan_id).maybeSingle();
        setClanSeasonXp(Number(score?.xp ?? 0)); setSeasonRank(score?.rank ?? null);
      } else { setSeason(null); setClanSeasonXp(0); setSeasonRank(null); }
    } catch (error) { console.error('Clan load failed', error); toast({ title: 'Could not load clan', type: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadClan(); }, [user?.id]);

  const createClan = async () => {
    if (!user) return;
    const name = newClanName.trim();
    if (name.length < 3 || name.length > 28) { toast({ title: 'Clan name must be 3–28 characters', type: 'error' }); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.from('clans').insert({ name, leader_id: user.id, emblem }).select('id').single();
      if (error) throw error;
      await supabase.rpc('create_default_clan_mission', { p_clan_id: data.id });
      setNewClanName(''); toast({ title: 'Clan founded', type: 'success' }); await loadClan();
    } catch (error: any) { toast({ title: error?.code === '23505' ? 'That clan name is already taken' : 'Could not create clan', type: 'error' }); }
    finally { setBusy(false); }
  };

  const saveClan = async () => {
    if (!clan || !isLeader) return;
    const name = draftName.trim();
    if (name.length < 3) return;
    setBusy(true);
    const { error } = await supabase.from('clans').update({ name, description: draftDescription.trim(), emblem, updated_at: new Date().toISOString() }).eq('id', clan.id);
    setBusy(false);
    if (error) { toast({ title: 'Could not update clan', type: 'error' }); return; }
    toast({ title: 'Clan settings saved', type: 'success' }); setManage(false); await loadClan();
  };

  const uploadImage = async (file: File) => {
    if (!clan || !isLeader) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Choose an image file', type: 'error' }); return; }
    if (file.size > 3 * 1024 * 1024) { toast({ title: 'Image must be under 3 MB', type: 'error' }); return; }
    setBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${clan.id}/${Date.now()}.${ext}`;
      const { error: upError } = await supabase.storage.from('clan-images').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upError) throw upError;
      const { data } = supabase.storage.from('clan-images').getPublicUrl(path);
      const { error } = await supabase.from('clans').update({ image_url: data.publicUrl, updated_at: new Date().toISOString() }).eq('id', clan.id);
      if (error) throw error;
      toast({ title: 'Clan image updated', type: 'success' }); await loadClan();
    } catch (error) { console.error(error); toast({ title: 'Could not upload clan image', type: 'error' }); }
    finally { setBusy(false); }
  };

  const searchClans = async () => {
    const q = search.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    const { data, error } = await supabase.from('clans').select('id,name,emblem,image_url,level,xp,max_members,clan_members(count)').ilike('name', `%${q}%`).limit(12);
    if (error) { toast({ title: 'Clan search failed', type: 'error' }); return; }
    setSearchResults((data ?? []).map((x: any) => ({ ...x, member_count: Number(x.clan_members?.[0]?.count ?? 0) })));
  };

  const requestJoin = async (clanId: string) => {
    if (!user) return;
    setPendingRequest(clanId);
    const { error } = await supabase.from('clan_join_requests').insert({ clan_id: clanId, user_id: user.id });
    setPendingRequest(null);
    if (error) toast({ title: error.code === '23505' ? 'Request already sent' : 'Could not send request', type: 'error' });
    else toast({ title: 'Join request sent', type: 'success' });
  };

  const acceptRequest = async (id: string) => {
    setBusy(true); const { error } = await supabase.rpc('accept_join_request', { p_request_id: id }); setBusy(false);
    if (error) toast({ title: error.message === 'clan_full' ? 'Clan is full' : 'Could not accept request', type: 'error' }); else { toast({ title: 'Hunter accepted', type: 'success' }); await loadClan(); }
  };
  const declineRequest = async (id: string) => { const { error } = await supabase.rpc('decline_join_request', { p_request_id: id }); if (error) toast({ title: 'Could not decline request', type: 'error' }); else await loadClan(); };
  const leaveClan = async () => { if (!clan || !confirm('Leave this clan?')) return; setBusy(true); const { error } = await supabase.rpc('leave_clan', { p_clan_id: clan.id }); setBusy(false); if (error) toast({ title: error.message === 'leader_cannot_leave' ? 'Leader cannot leave the clan' : 'Could not leave clan', type: 'error' }); else { toast({ title: 'You left the clan', type: 'success' }); await loadClan(); } };
  const changeRole = async (member: Member, role: 'member' | 'officer') => { if (!clan || !isLeader || member.user_id === user?.id) return; setBusy(true); const { error } = await supabase.rpc('set_clan_member_role', { p_clan_id: clan.id, p_user_id: member.user_id, p_role: role }); setBusy(false); if (error) toast({ title: 'Could not change role', type: 'error' }); else await loadClan(); };
  const kick = async (member: Member) => { if (!clan || !isManager || member.user_id === user?.id || !confirm(`Remove ${member.username ?? 'this hunter'} from the clan?`)) return; setBusy(true); const { error } = await supabase.rpc('kick_clan_member', { p_clan_id: clan.id, p_user_id: member.user_id }); setBusy(false); if (error) toast({ title: 'Could not remove member', type: 'error' }); else { toast({ title: 'Member removed', type: 'success' }); await loadClan(); } };
  const createMission = async () => { if (!clan || !isManager) return; setBusy(true); const { error } = await supabase.rpc('create_default_clan_mission', { p_clan_id: clan.id }); setBusy(false); if (error) toast({ title: 'Could not create mission', type: 'error' }); else await loadClan(); };
  const addMissionProgress = async (mission: Mission) => { if (!clan || !isManager) return; const { error } = await supabase.rpc('update_clan_mission_progress', { p_mission_id: mission.id, p_amount: 1 }); if (error) toast({ title: 'Could not update mission', type: 'error' }); else await loadClan(); };

  const levelProgress = useMemo(() => Math.min(100, (Number(clan?.xp ?? 0) % 1000) / 10), [clan?.xp]);
  const activeMission = missions.find(m => !m.completed_at) ?? missions[0];

  if (!user) return <Empty title="Sign in to access Clans." />;
  if (loading) return <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-12 text-center"><RefreshCw size={24} className="mx-auto mb-3 animate-spin text-ember-400"/><p className="text-sm text-ink-400">Synchronizing clan command...</p></div>;

  if (!clan) return <div className="space-y-5 pb-8"><section className="mx-auto max-w-3xl rounded-[1.75rem] border border-white/10 bg-ink-950/70 p-6 sm:p-8"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.3em] text-ember-400"><Shield size={14}/> Clan Command</div><h1 className="font-display text-3xl font-black uppercase sm:text-5xl">Forge Your Clan</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink-400">Create a real squad. Recruit hunters, build shared XP, complete missions and compete every season.</p><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]"><input value={newClanName} onChange={e => setNewClanName(e.target.value)} maxLength={28} placeholder="Clan name" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-ember-500/50"/><button disabled={busy} onClick={() => void createClan()} className="btn-primary text-xs uppercase tracking-widest"><Plus size={14}/> {busy ? 'Founding...' : 'Found Clan'}</button></div><div className="mt-4 flex flex-wrap gap-2">{EMBLEMS.map(e => <button key={e} onClick={() => setEmblem(e)} className={`h-10 w-10 rounded-xl border text-lg ${emblem === e ? 'border-ember-500 bg-ember-500/10' : 'border-white/10 bg-black/20'}`}>{e}</button>)}</div></section><section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-ink-500"/><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && void searchClans()} placeholder="Search existing clans" className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm outline-none"/></div><button onClick={() => void searchClans()} className="btn-ghost text-xs uppercase tracking-widest">Search</button></div>{searchResults.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{searchResults.map(c => <ClanSearchCard key={c.id} clan={c} busy={pendingRequest === c.id} onJoin={() => void requestJoin(c.id)}/>)}</div>}</section></div>;

  return <div className="space-y-5 pb-8">
    <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-950/70 p-5 sm:p-8">
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent"/>
      {clan.image_url && <img src={clan.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25"/>}
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-black/50 text-4xl shadow-2xl">{clan.image_url ? <img src={clan.image_url} alt="Clan emblem" className="h-full w-full object-cover"/> : clan.emblem}</div><div className="min-w-0"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.3em] text-ember-400"><Users size={14}/> Clan Command</div><h1 className="truncate font-display text-3xl font-black uppercase sm:text-5xl">{clan.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-300">{clan.description || 'A squad forged through discipline, progression and shared victories.'}</p></div></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => void loadClan()} className="btn-ghost text-xs" aria-label="Refresh clan"><RefreshCw size={14}/></button>{isLeader && <button onClick={() => setManage(v => !v)} className="btn-ghost text-xs uppercase tracking-widest"><Settings2 size={14}/> {manage ? 'Close' : 'Manage'}</button>}{!isLeader && <button disabled={busy} onClick={() => void leaveClan()} className="btn-ghost text-xs uppercase tracking-widest"><LogOut size={14}/> Leave</button>}</div>
      </div>
      {manage && isLeader && <div className="relative mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:grid-cols-2"><div><label className="text-[10px] uppercase tracking-widest text-ink-500">Clan name</label><input value={draftName} onChange={e => setDraftName(e.target.value)} maxLength={28} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"/></div><div><label className="text-[10px] uppercase tracking-widest text-ink-500">Description</label><input value={draftDescription} onChange={e => setDraftDescription(e.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"/></div><div className="sm:col-span-2"><label className="text-[10px] uppercase tracking-widest text-ink-500">Emblem</label><div className="mt-2 flex flex-wrap gap-2">{EMBLEMS.map(e => <button key={e} onClick={() => setEmblem(e)} className={`h-9 w-9 rounded-lg border text-base ${emblem === e ? 'border-ember-500 bg-ember-500/10' : 'border-white/10 bg-black/20'}`}>{e}</button>)}</div></div><div className="sm:col-span-2 flex flex-wrap gap-2"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && void uploadImage(e.target.files[0])}/><button disabled={busy} onClick={() => fileRef.current?.click()} className="btn-ghost text-xs uppercase tracking-widest"><Upload size={14}/> Upload Clan Image</button><button disabled={busy} onClick={() => void saveClan()} className="btn-primary text-xs uppercase tracking-widest"><Check size={14}/> Save Changes</button></div><p className="sm:col-span-2 text-[10px] text-ink-500">Only the clan leader can change the clan image, name and emblem.</p></div>}
    </header>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Stat icon={Crown} label="Clan Level" value={String(clan.level)}/><Stat icon={Zap} label="Clan XP" value={Number(clan.xp).toLocaleString()}/><Stat icon={Users} label="Members" value={`${members.length}/${clan.max_members}`}/><Stat icon={Trophy} label="Season Rank" value={seasonRank ? `#${seasonRank}` : '—'}/><Stat icon={Flag} label="Season XP" value={clanSeasonXp.toLocaleString()}/></section>

    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-1">{(['overview','members','missions','history'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest ${tab === t ? 'bg-white/10 text-white' : 'text-ink-500 hover:text-ink-200'}`}>{t}</button>)}</nav>

    {tab === 'overview' && <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Clan Progress</p><h2 className="mt-1 font-display text-xl font-bold uppercase">Shared Power</h2></div><Shield size={20} className="text-ink-500"/></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-gradient-to-r from-ember-500 to-gold-500" style={{ width: `${levelProgress}%` }}/></div><div className="mt-2 flex justify-between text-[10px] text-ink-500"><span>{(Number(clan.xp) % 1000).toLocaleString()} XP</span><span>1,000 XP</span></div><p className="mt-3 text-xs text-ink-500">Every member's real leaderboard XP contributes to the clan automatically.</p></article>
      <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Active Mission</p><h2 className="mt-1 font-display text-xl font-bold uppercase">{activeMission?.title ?? 'No active mission'}</h2><p className="mt-2 text-xs leading-5 text-ink-400">{activeMission?.description ?? 'Create a mission from the Missions tab.'}</p>{activeMission && <><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-ember-500" style={{ width: `${Math.min(100, activeMission.progress / Math.max(1, activeMission.target) * 100)}%` }}/></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-ink-300">{activeMission.progress}/{activeMission.target}</span><span className="text-ember-400">+{activeMission.xp_reward} XP</span></div></>}</article>
      <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 lg:col-span-2"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Season</p><h2 className="mt-1 font-display text-xl font-bold uppercase">{season?.name ?? 'No active season'}</h2></div><Trophy size={20} className="text-ink-500"/></div><p className="mt-3 text-xs leading-6 text-ink-400">{season ? `Your clan is ranked #${seasonRank ?? '—'} with ${clanSeasonXp.toLocaleString()} season XP.` : 'Season ranking will appear when a season is active.'}</p></article>
    </div>}

    {tab === 'members' && <section className="space-y-4"><article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Roster</p><h2 className="mt-1 font-display text-xl font-bold uppercase">Members</h2></div><span className="text-xs text-ink-500">{members.length}/{clan.max_members}</span></div><div className="mt-4 grid gap-2">{members.map(member => <MemberRow key={member.user_id} member={member} self={member.user_id === user.id} leader={isLeader} manager={isManager} busy={busy} onRole={role => void changeRole(member, role)} onKick={() => void kick(member)}/>)}</div></article>{isManager && <article className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center gap-2"><UserPlus size={18}/><h2 className="font-display text-xl font-bold uppercase">Join Requests</h2><span className="ml-auto rounded-full bg-ember-500/10 px-2 py-1 text-[10px] text-ember-400">{requests.length}</span></div>{requests.length ? <div className="mt-4 grid gap-2">{requests.map(r => <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] p-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-black/40">{r.avatar || '🐺'}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{r.username || `Hunter ${r.user_id.slice(0,6)}`}</p><p className="text-[10px] text-ink-500">Requested {new Date(r.created_at).toLocaleDateString()}</p></div><button disabled={busy} onClick={() => void acceptRequest(r.id)} className="btn-primary text-[10px] uppercase"><Check size={13}/> Accept</button><button disabled={busy} onClick={() => void declineRequest(r.id)} className="btn-ghost text-[10px] uppercase"><X size={13}/> Decline</button></div>)}</div> : <p className="mt-3 text-xs text-ink-500">No pending requests.</p>}</article>}</section>}

    {tab === 'missions' && <section className="space-y-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-ember-400">Clan Operations</p><h2 className="font-display text-2xl font-bold uppercase">Missions</h2></div>{isManager && <button onClick={() => void createMission()} disabled={busy} className="btn-primary text-[10px] uppercase tracking-widest"><Plus size={14}/> Create Mission</button>}</div>{missions.length ? missions.map(m => <article key={m.id} className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase">{m.title}</p><p className="mt-1 text-xs leading-5 text-ink-500">{m.description}</p></div><span className="font-mono text-xs text-ember-400">+{m.xp_reward} XP</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-900"><div className="h-full rounded-full bg-ember-500" style={{ width: `${Math.min(100, m.progress / Math.max(1, m.target) * 100)}%` }}/></div><div className="mt-2 flex items-center justify-between text-[10px] text-ink-500"><span>{m.progress}/{m.target}</span><span>{m.completed_at ? 'COMPLETED' : m.ends_at ? `ENDS ${new Date(m.ends_at).toLocaleDateString()}` : 'ACTIVE'}</span></div>{isManager && !m.completed_at && <button onClick={() => void addMissionProgress(m)} className="btn-ghost mt-4 text-[10px] uppercase"><ChevronRight size={13}/> Add progress</button>}</article>) : <Empty title="No clan missions yet."/>}</section>}

    {tab === 'history' && <section className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"><div className="flex items-center gap-2"><Trophy size={18}/><h2 className="font-display text-xl font-bold uppercase">Clan History</h2></div><div className="mt-4 space-y-2">{history.length ? history.map(item => <div key={item.id} className="rounded-xl border border-white/5 bg-white/[.02] p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">{item.title}</p><span className="text-[9px] uppercase tracking-widest text-ink-600">{new Date(item.created_at).toLocaleDateString()}</span></div><p className="mt-1 text-[10px] leading-5 text-ink-500">{item.details ?? item.event_type}</p></div>) : <p className="text-xs text-ink-500">No history recorded yet.</p>}</div></section>}
  </div>;
}

function ClanSearchCard({ clan, busy, onJoin }: { clan: ClanSearch; busy: boolean; onJoin: () => void }) { return <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] p-3"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/40 text-xl">{clan.image_url ? <img src={clan.image_url} alt="" className="h-full w-full object-cover"/> : clan.emblem}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{clan.name}</p><p className="text-[10px] text-ink-500">Lv {clan.level} · {clan.member_count}/{clan.max_members} hunters</p></div><button disabled={busy} onClick={onJoin} className="btn-ghost text-[10px] uppercase">{busy ? 'Sending...' : 'Request'}</button></div>; }
function MemberRow({ member, self, leader, manager, busy, onRole, onKick }: { member: Member; self: boolean; leader: boolean; manager: boolean; busy: boolean; onRole: (role: 'member' | 'officer') => void; onKick: () => void }) { return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black/40 text-lg">{member.avatar || '🐺'}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{self ? 'You' : (member.username || `Hunter ${member.user_id.slice(0,6)}`)}</p><p className="text-[10px] uppercase tracking-widest text-ink-500">{member.role} · {Number(member.contribution_xp).toLocaleString()} XP</p></div>{member.role === 'leader' && <Crown size={15} className="text-gold-400"/>}{leader && !self && member.role !== 'leader' && <select disabled={busy} value={member.role} onChange={e => onRole(e.target.value as 'member' | 'officer')} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase"><option value="member">Member</option><option value="officer">Officer</option></select>}{manager && !self && member.role !== 'leader' && <button disabled={busy} onClick={onKick} className="btn-ghost text-[10px] uppercase text-red-300"><X size={13}/> Remove</button>}</div>; }
function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Icon size={16} className="mb-3 text-ember-400"/><strong className="block font-mono text-xl">{value}</strong><span className="text-[10px] uppercase tracking-widest text-ink-500">{label}</span></div>; }
function Empty({ title }: { title: string }) { return <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-8 text-center text-sm text-ink-400">{title}</div>; }
