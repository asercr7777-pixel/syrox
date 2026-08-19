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
  { id: 'strength', name: 'Strength', description: 'Build a stronger physical foundation.', icon: '💪' },
  { id: 'focus', name: 'Focus', description: 'Sharpen attention and mental control.', icon: '🧠' },
  { id: 'discipline', name: 'Discipline', description: 'Turn completed tasks into stronger progression.', icon: '🔥' },
  { id: 'knowledge', name: 'Knowledge', description: 'Turn learning into long-term growth.', icon: '📚' },
  { id: 'consistency', name: 'Consistency', description: 'Build momentum that survives difficult days.', icon: '⚡' },
  { id: 'defense', name: 'Defense', description: 'Develop resilience against setbacks.', icon: '🛡️' },
  { id: 'agility', name: 'Agility', description: 'Improve speed, adaptation and movement.', icon: '🏃' },
  { id: 'awareness', name: 'Awareness', description: 'See patterns and make better decisions.', icon: '👁️' },
  { id: 'leadership', name: 'Leadership', description: 'Develop initiative and personal command.', icon: '👑' },
  { id: 'shadow', name: 'Shadow', description: 'Master the hidden path of the Forged.', icon: '🌑' },
];

const prefix: Record<SkillBranch, string> = {
  strength: 'Power', focus: 'Focus', discipline: 'Forge', knowledge: 'Lore', consistency: 'Momentum',
  defense: 'Guard', agility: 'Swift', awareness: 'Sight', leadership: 'Command', shadow: 'Shadow',
};

const iconFor = (branch: SkillBranch) => SKILL_BRANCHES.find((item) => item.id === branch)!.icon;

export const SKILL_NODES: SkillNode[] = SKILL_BRANCHES.flatMap(({ id: branch }) =>
  Array.from({ length: 1000 }, (_, i) => {
    const index = i + 1;
    const tier = Math.ceil(index / 10);
    return {
      id: `${branch}_${index}`,
      branch,
      name: `${prefix[branch]} ${index}`,
      description: `${prefix[branch]} path skill ${index}. Advance through the path one step at a time.`,
      cost: index,
      requires: index === 1 ? undefined : `${branch}_${index - 1}`,
      icon: iconFor(branch),
      tier,
      index,
    };
  })
);

export function getSkillNode(id: string): SkillNode | undefined {
  return SKILL_NODES.find((node) => node.id === id);
}
