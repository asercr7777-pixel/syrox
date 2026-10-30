import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Ghost, LockKeyhole, Users, Sparkles, X, Zap } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { toast } from './ui/Toast';
import { ShadowArmy } from '../views/ShadowArmy';

type ShadowDefinition = {
  id: string; name: string; epithet: string; role: string; rank: string; element: string;
  description: string; ability: string; power: number; defense: number; speed: number;
  minLevel: number; minExtracted: number; theme: string;
};
type SavedShadow = { id: string; xp: number; recruitedAt: string };
const ORIGINAL_SHADOWS: ShadowDefinition[] = [
  { id: 'vexar', name: 'VEXAR', epithet: 'The Hollow Vanguard', role: 'VANGUARD', rank: 'S', element: 'VOID', description: 'A silent frontline commander forged in the space between worlds. Vexar holds the line when every other force retreats.', ability: 'ABYSSAL BREAK', power: 92, defense: 94, speed: 68, minLevel: 1, minExtracted: 0, theme: 'vanguard' },
  { id: 'nyx', name: 'NYX', epithet: 'The Unseen Edge', role: 'ASSASSIN', rank: 'A', element: 'SHADOW', description: 'A swift executioner who moves through the blind spot of every enemy. Her strikes are precise, quiet and final.', ability: 'PHANTOM STEP', power: 88, defense: 62, speed: 99, minLevel: 3, minExtracted: 0, theme: 'assassin' },
  { id: 'orynd', name: 'ORYND', epithet: 'The Rift Arcanist', role: 'MAGE', rank: 'A', element: 'ARCANE', description: 'A keeper of fractured stars who bends unstable energy into controlled devastation.', ability: 'ECLIPSE NOVA', power: 98, defense: 58, speed: 73, minLevel: 5, minExtracted: 0, theme: 'mage' },
  { id: 'khael', name: 'KHAEL', epithet: 'The Iron Warden', role: 'TANK', rank: 'B', element: 'IRON', description: 'An unbreakable guardian whose armor absorbs the force of an entire battlefield and returns it as pressure.', ability: 'AEGIS WALL', power: 64, defense: 100, speed: 48, minLevel: 2, minExtracted: 0, theme: 'warden' },
  { id: 'sable', name: 'SABLE', epithet: 'The Dusk Ranger', role: 'RANGER', rank: 'B', element: 'DUSK', description: 'A patient hunter who marks targets from the edge of the battlefield and never wastes a shot.', ability: 'SOUL ARROW', power: 82, defense: 60, speed: 88, minLevel: 4, minExtracted: 0, theme: 'ranger' },
  { id: 'draeven', name: 'DRAEVEN', epithet: 'The Crimson Reaper', role: 'REAPER', rank: 'S', element: 'CRIMSON', description: 'An ancient reaper bound by a broken oath. His presence turns a victory into a warning for every rival monarch.', ability: 'BLOOD MOON HARVEST', power: 100, defense: 78, speed: 91, minLevel: 8, minExtracted: 1, theme: 'reaper' }
];
const SHADOW_IDS = new Set(ORIGINAL_SHADOWS.map((unit) => unit.id));
const MAX_DEPLOYED = 4;
function unitLevel(unit: SavedShadow): number { return 1 + Math.floor(Math.max(0, unit.xp) / 100); }
function unitPower(unit: ShadowDefinition, saved?: SavedShadow): number { return unit.power + Math.max(0, unitLevel(saved ?? { id: unit.id, xp: 0, recruitedAt: '' }) - 1) * 3; }

function OriginalShadowCollection() {
  const { user } = useAuth();
  const { state } = useStore();
  const userId = user?.id;
  const extractedCount = state.shadowExtractedBossIds?.length ?? 0;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState<SavedShadow[]>([]);
  const [formation, setFormation] = useState<string[]>([]);
  const [essenceSpent, setEssenceSpent] = useState(0);
  const [selected, setSelected] = useState<ShadowDefinition | null>(null);
  const [filter, setFilter] = useState<'all' | 'deployed' | 'recruited' | 'locked'>('all');
  const essenceEarned = extractedCount * 100;
  const essenceAvailable = Math.max(0, essenceEarned - essenceSpent);
  const recruitedIds = useMemo(() => new Set(roster.map((unit) => unit.id)), [roster]);
  const deployedPower = useMemo(() => formation.reduce((sum, id) => {
    const definition = ORIGINAL_SHADOWS.find((unit) => unit.id === id);
    const saved = roster.find((unit) => unit.id === id);
    return sum + (definition ? unitPower(definition, saved) : 0);
  }, 0), [formation, roster]);
  const visibleUnits = ORIGINAL_SHADOWS.filter((unit) => {
    const recruited = recruitedIds.has(unit.id);
    const deployed = formation.includes(unit.id);
    if (filter === 'deployed') return deployed;
    if (filter === 'recruited') return recruited;
    if (filter === 'locked') return !recruited;
    return true;
  });

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    async function loadArmy() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('user_state').select('state').eq('user_id', userId).maybeSingle();
        if (error) throw error;
        const cloud = (data?.state ?? {}) as Record<string, unknown>;
        const savedRoster = Array.isArray(cloud.shadowArmyRoster) ? cloud.shadowArmyRoster : [];
        const safeRoster = savedRoster.map((item) => item as SavedShadow).filter((item) => item && SHADOW_IDS.has(item.id) && Number.isFinite(Number(item.xp)) && typeof item.recruitedAt === 'string');
        const savedFormation = Array.isArray(cloud.shadowArmyFormation) ? cloud.shadowArmyFormation : [];
        const safeFormation = savedFormation.filter((id): id is string => typeof id === 'string' && safeRoster.some((unit) => unit.id === id)).slice(0, MAX_DEPLOYED);
        const spent = Math.max(0, Math.floor(Number(cloud.shadowArmyEssenceSpent) || 0));
        if (!cancelled) {
          setRoster(safeRoster);
          setFormation(safeFormation);
          setEssenceSpent(Math.min(essenceEarned, spent));
        }
      } catch (error) {
        if (!cancelled) toast({ title: 'Shadow roster unavailable', message: error instanceof Error ? error.message : 'Could not load your saved army.', type: 'error' });
      } finally { if (!cancelled) setLoading(false); }
    }
    void loadArmy();
    return () => { cancelled = true; };
  }, [userId, essenceEarned]);

  async function persist(nextRoster: SavedShadow[], nextFormation: string[], nextSpent: number) {
    if (!userId) throw new Error('Sign in to save your Shadow Army.');
    const { error } = await supabase.rpc('save_shadow_army_state', {
      p_roster: nextRoster, p_formation: nextFormation, p_essence_spent: nextSpent
    });
    if (error) throw error;
    setRoster(nextRoster);
    setFormation(nextFormation);
    setEssenceSpent(nextSpent);
  }

  async function recruit(unit: ShadowDefinition) {
    if (saving || recruitedIds.has(unit.id)) return;
    if (state.level < unit.minLevel || extractedCount < unit.minExtracted) {
      toast({ title: 'Shadow still sealed', message: 'Reach Level ' + unit.minLevel + (unit.minExtracted ? ' and extract ' + unit.minExtracted + ' story shadow(s).' : ' to recruit this unit.'), type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const nextRoster = [...roster, { id: unit.id, xp: 0, recruitedAt: new Date().toISOString() }];
      const nextFormation = formation.length < MAX_DEPLOYED ? [...formation, unit.id] : formation;
      await persist(nextRoster, nextFormation, essenceSpent);
      toast({ title: unit.name + ' has arisen', message: 'Original STRYVEN shadow recruited and saved to your legion.', type: 'success' });
    } catch (error) {
      toast({ title: 'Recruitment failed', message: error instanceof Error ? error.message : 'Please retry.', type: 'error' });
    } finally { setSaving(false); }
  }

  async function toggleDeployment(unitId: string) {
    if (saving || !recruitedIds.has(unitId)) return;
    const nextFormation = formation.includes(unitId) ? formation.filter((id) => id !== unitId) : formation.length < MAX_DEPLOYED ? [...formation, unitId] : null;
    if (!nextFormation) {
      toast({ title: 'Formation is full', message: 'Remove a deployed shadow before adding another. Maximum formation size: ' + MAX_DEPLOYED + '.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await persist(roster, nextFormation, essenceSpent);
      toast({ title: formation.includes(unitId) ? 'Shadow recalled' : 'Shadow deployed', message: 'Your formation has been saved.', type: 'success' });
    } catch (error) {
      toast({ title: 'Formation update failed', message: error instanceof Error ? error.message : 'Please retry.', type: 'error' });
    } finally { setSaving(false); }
  }

  async function train(unitId: string) {
    if (saving) return;
    if (essenceAvailable < 100) {
      toast({ title: 'Not enough Shadow Essence', message: 'Extract story bosses to earn 100 essence for each shadow training cycle.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const nextRoster = roster.map((unit) => unit.id === unitId ? { ...unit, xp: unit.xp + 100 } : unit);
      await persist(nextRoster, formation, essenceSpent + 100);
      toast({ title: 'Shadow evolution advanced', message: '100 Shadow Essence converted into unit XP.', type: 'success' });
    } catch (error) {
      toast({ title: 'Training failed', message: error instanceof Error ? error.message : 'Please retry.', type: 'error' });
    } finally { setSaving(false); }
  }

  return <section className="sv-original-shadow-system" aria-labelledby="original-shadow-title">
    <header className="sv-original-shadow-hero">
      <div className="sv-original-shadow-hero__copy">
        <span className="sv-eyebrow"><Sparkles size={14}/> STRYVEN ORIGINAL UNITS / MONARCH ARCHIVE</span>
        <h1 id="original-shadow-title">THE <em>ASCENDED</em> LEGION</h1>
        <p>Original shadows forged for STRYVEN. Recruit them through your hunter progression, deploy a four-unit formation and evolve their power with essence earned from confirmed story extractions.</p>
        <div className="sv-original-shadow-hero__meta"><span><Users size={15}/>{roster.length} / {ORIGINAL_SHADOWS.length} RECRUITED</span><span><Zap size={15}/>{deployedPower} FORMATION POWER</span></div>
      </div>
      <div className="sv-original-shadow-sigil" aria-hidden="true"><div/><div/><div/><Ghost size={58}/><span>STRYVEN / SHADOW DIVISION</span></div>
    </header>

    <div className="sv-original-shadow-stats">
      <article><small>RECRUITED UNITS</small><b>{String(roster.length).padStart(2, '0')}<i> / {ORIGINAL_SHADOWS.length}</i></b><span>Original STRYVEN shadows</span></article>
      <article><small>ACTIVE FORMATION</small><b>{String(formation.length).padStart(2, '0')}<i> / {MAX_DEPLOYED}</i></b><span>Deployed units</span></article>
      <article><small>SHADOW ESSENCE</small><b>{essenceAvailable}</b><span>{essenceEarned} earned · {essenceSpent} spent</span></article>
      <article><small>HUNTER RANK</small><b>{state.level}</b><span>Level {state.level} · {extractedCount} confirmed extractions</span></article>
    </div>

    <section className="sv-original-shadow-formation">
      <div className="sv-original-shadow-section-head"><div><span className="sv-eyebrow">01 / ACTIVE DEPLOYMENT</span><h2>MONARCH FORMATION</h2><p>Choose up to four recruited shadows. Deployment is saved to your account.</p></div><span>{formation.length} / {MAX_DEPLOYED} SLOTS</span></div>
      <div className="sv-original-shadow-formation__grid">
        {Array.from({ length: MAX_DEPLOYED }, (_, index) => {
          const unitId = formation[index];
          const unit = ORIGINAL_SHADOWS.find((item) => item.id === unitId);
          const saved = roster.find((item) => item.id === unitId);
          return <article key={index} className={unit ? 'is-filled' : ''}>
            <small>FORMATION SLOT {String(index + 1).padStart(2, '0')}</small>
            {unit ? <><div className={'sv-original-shadow-avatar is-' + unit.theme}><i/><b/></div><strong>{unit.name}</strong><span>{unit.role} · LVL {unitLevel(saved!)}</span><button type="button" onClick={() => void toggleDeployment(unit.id)} disabled={saving}>RECALL UNIT</button></> : <><Ghost size={25}/><b>EMPTY SLOT</b><span>Awaiting deployment</span></>}
          </article>;
        })}
      </div>
    </section>

    <section className="sv-original-shadow-roster">
      <div className="sv-original-shadow-section-head"><div><span className="sv-eyebrow">02 / ORIGINAL SHADOW CODEX</span><h2>RECRUITMENT ROSTER</h2><p>Every unit has its own combat role, signature ability and progression track.</p></div><span>{loading ? 'SYNCING ROSTER' : ORIGINAL_SHADOWS.length + ' ORIGINAL UNITS'}</span></div>
      <div className="sv-original-shadow-filters">
        {([{ id: 'all', label: 'ALL UNITS' }, { id: 'deployed', label: 'DEPLOYED' }, { id: 'recruited', label: 'RECRUITED' }, { id: 'locked', label: 'SEALED' }] as const).map((option) => <button type="button" key={option.id} className={filter === option.id ? 'is-active' : ''} onClick={() => setFilter(option.id)}>{option.label}</button>)}
      </div>
      <div className="sv-original-shadow-grid">
        {visibleUnits.map((unit) => {
          const saved = roster.find((item) => item.id === unit.id);
          const recruited = Boolean(saved);
          const deployed = formation.includes(unit.id);
          const unlocked = state.level >= unit.minLevel && extractedCount >= unit.minExtracted;
          const level = unitLevel(saved ?? { id: unit.id, xp: 0, recruitedAt: '' });
          return <article key={unit.id} className={'sv-original-shadow-card ' + (recruited ? 'is-recruited' : unlocked ? 'is-unlocked' : 'is-locked')}>
            <button type="button" className="sv-original-shadow-card__art" onClick={() => setSelected(unit)} aria-label={'View ' + unit.name + ' details'}>
              <div className={'sv-original-shadow-avatar is-' + unit.theme}><i/><b/></div>
              <span className="sv-original-shadow-rank">RANK {unit.rank}</span>
              {recruited && <span className="sv-original-shadow-status"><Check size={12}/> RECRUITED</span>}
              {!recruited && !unlocked && <span className="sv-original-shadow-status"><LockKeyhole size={12}/> SEALED</span>}
            </button>
            <div className="sv-original-shadow-card__body">
              <div><small>{unit.role} / {unit.element}</small><h3>{unit.name}</h3><p>{unit.epithet}</p></div>
              <div className="sv-original-shadow-card__ability"><span>SIGNATURE ABILITY</span><b>{unit.ability}</b></div>
              {recruited ? <><div className="sv-original-shadow-level"><span>UNIT LEVEL {level}</span><b>{saved!.xp % 100} / 100 XP</b></div><div className="sv-original-shadow-progress"><i style={{ width: (saved!.xp % 100) + '%' }}/></div><div className="sv-original-shadow-card__actions"><button type="button" onClick={() => void toggleDeployment(unit.id)} disabled={saving}>{deployed ? 'RECALL' : 'DEPLOY'}</button><button type="button" onClick={() => void train(unit.id)} disabled={saving || essenceAvailable < 100}>TRAIN · 100 ESSENCE</button></div></> : <div className="sv-original-shadow-card__actions"><button type="button" disabled={!unlocked || saving} onClick={() => void recruit(unit)}>{unlocked ? 'RECRUIT SHADOW' : 'REQUIREMENT: LVL ' + unit.minLevel + (unit.minExtracted ? ' + ' + unit.minExtracted + ' EXTRACTION' : '')}</button></div>}
              <button type="button" className="sv-original-shadow-details" onClick={() => setSelected(unit)}>VIEW UNIT FILE <ArrowUpRight size={13}/></button>
            </div>
          </article>;
        })}
      </div>
    </section>

    {selected && <div className="sv-original-shadow-modal" role="dialog" aria-modal="true" aria-labelledby="sv-shadow-detail-title">
      <button type="button" className="sv-original-shadow-modal__backdrop" onClick={() => setSelected(null)} aria-label="Close details"/>
      <div className="sv-original-shadow-modal__panel">
        <button type="button" className="sv-original-shadow-modal__close" onClick={() => setSelected(null)} aria-label="Close"><X size={18}/></button>
        <div className={'sv-original-shadow-avatar is-' + selected.theme}><i/><b/></div>
        <span className="sv-eyebrow">STRYVEN ORIGINAL / RANK {selected.rank} / {selected.element}</span>
        <h2 id="sv-shadow-detail-title">{selected.name}</h2><h3>{selected.epithet}</h3>
        <p>{selected.description}</p>
        <div className="sv-original-shadow-modal__ability"><small>SIGNATURE ABILITY</small><b>{selected.ability}</b></div>
        <div className="sv-original-shadow-modal__stats">
          {[{ label: 'POWER', value: selected.power }, { label: 'DEFENSE', value: selected.defense }, { label: 'SPEED', value: selected.speed }].map((stat) => <div key={stat.label}><span>{stat.label}</span><b>{stat.value}</b><i><em style={{ width: stat.value + '%' }}/></i></div>)}
        </div>
        <button type="button" className="sv-original-shadow-modal__action" onClick={() => { const recruited = recruitedIds.has(selected.id); setSelected(null); if (!recruited) void recruit(selected); else void toggleDeployment(selected.id); }} disabled={saving}>{recruitedIds.has(selected.id) ? (formation.includes(selected.id) ? 'RECALL FROM FORMATION' : 'DEPLOY TO FORMATION') : 'RECRUIT SHADOW'} <ChevronRight size={15}/></button>
      </div>
    </div>}
  </section>;
}

export function ShadowArmyExpansion() {
  return <div className="sv-shadow-expansion">
    <OriginalShadowCollection/>
    <ShadowArmy/>
  </div>;
}
