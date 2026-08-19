export type SkillBranch = 'strength' | 'focus' | 'discipline' | 'knowledge' | 'consistency' | 'defense' | 'agility' | 'awareness' | 'leadership' | 'shadow';

export interface SkillNode {
  id: string;
  branch: SkillBranch;
  name: string;
  description: string;
  cost: number;
  requires?: string;
  icon: string;
  tier: number;
  index: number;
}

export const SKILL_BRANCHES: { id: SkillBranch; name: string; description: string; icon: string }[] = [
  { id: 'strength', name: 'Strength', description: 'Build physical power and training mastery.', icon: '💪' },
  { id: 'focus', name: 'Focus', description: 'Sharpen concentration and mental control.', icon: '🧠' },
  { id: 'discipline', name: 'Discipline', description: 'Turn completed tasks into lasting growth.', icon: '🔥' },
  { id: 'knowledge', name: 'Knowledge', description: 'Convert learning into practical mastery.', icon: '📚' },
  { id: 'consistency', name: 'Consistency', description: 'Build momentum that survives difficult days.', icon: '⚡' },
  { id: 'defense', name: 'Defense', description: 'Protect your progress from setbacks.', icon: '🛡️' },
  { id: 'agility', name: 'Agility', description: 'Improve speed, movement, and adaptability.', icon: '🏃' },
  { id: 'awareness', name: 'Awareness', description: 'Notice patterns, opportunities, and risks.', icon: '👁️' },
  { id: 'leadership', name: 'Leadership', description: 'Develop initiative, responsibility, and influence.', icon: '👑' },
  { id: 'shadow', name: 'Shadow', description: 'Master the hidden path of the Syrox Hunter.', icon: '🌑' },
];

const BRANCH_META: Record<SkillBranch, { icon: string; adjective: string }> = {
  strength: { icon: '💪', adjective: 'physical' },
  focus: { icon: '🧠', adjective: 'mental' },
  discipline: { icon: '🔥', adjective: 'discipline' },
  knowledge: { icon: '📚', adjective: 'knowledge' },
  consistency: { icon: '⚡', adjective: 'consistency' },
  defense: { icon: '🛡️', adjective: 'defensive' },
  agility: { icon: '🏃', adjective: 'agility' },
  awareness: { icon: '👁️', adjective: 'awareness' },
  leadership: { icon: '👑', adjective: 'leadership' },
  shadow: { icon: '🌑', adjective: 'shadow' },
};

const PREFIXES = ['Awakening', 'Foundation', 'Rising', 'Forged', 'Focused', 'Relentless', 'Veteran', 'Mastery', 'Ascendant', 'Legendary'];
const ACTIONS = ['Control', 'Pulse', 'Resolve', 'Rhythm', 'Instinct', 'Will', 'Precision', 'Momentum', 'Command', 'Mastery'];

/** 10 branches × 1,000 nodes = 10,000 total skills. Generated deterministically to keep the bundle small. */
export const SKILL_NODES: SkillNode[] = SKILL_BRANCHES.flatMap((branch) => {
  const meta = BRANCH_META[branch.id];
  return Array.from({ length: 1000 }, (_, zeroIndex) => {
    const index = zeroIndex + 1;
    const tier = Math.floor(zeroIndex / 10) + 1;
    const stage = Math.floor(zeroIndex / 100);
    const prefix = PREFIXES[stage];
    const action = ACTIONS[zeroIndex % ACTIONS.length];
    return {
      id: `${branch.id}_${index}`,
      branch: branch.id,
      name: `${prefix} ${action} ${index}`,
      description: `Tier ${tier} ${meta.adjective} specialization. Strengthen this part of your Hunter development path.`,
      cost: Math.min(25, 1 + Math.floor(zeroIndex / 40)),
      requires: index === 1 ? undefined : `${branch.id}_${index - 1}`,
      icon: meta.icon,
      tier,
      index,
    };
  });
});

export const SKILL_NODE_COUNT = SKILL_NODES.length;
export const SKILLS_PER_BRANCH = 1000;

export function getSkillNode(id: string): SkillNode | undefined {
  const [branch, rawIndex] = id.split('_');
  const index = Number(rawIndex);
  if (!branch || !Number.isInteger(index) || index < 1 || index > 1000) return undefined;
  const branchExists = SKILL_BRANCHES.some((item) => item.id === branch);
  if (!branchExists) return undefined;
  return SKILL_NODES[(SKILL_BRANCHES.findIndex((item) => item.id === branch) * 1000) + index - 1];
}
