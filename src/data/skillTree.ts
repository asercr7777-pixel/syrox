export type SkillBranch = 'strength' | 'focus' | 'discipline' | 'knowledge' | 'consistency';

export interface SkillNode {
  id: string;
  branch: SkillBranch;
  name: string;
  description: string;
  cost: number;
  requires?: string;
  icon: string;
}

export const SKILL_BRANCHES: { id: SkillBranch; name: string; description: string; icon: string }[] = [
  { id: 'strength', name: 'Strength', description: 'Build a stronger physical foundation.', icon: '💪' },
  { id: 'focus', name: 'Focus', description: 'Sharpen attention and mental control.', icon: '🧠' },
  { id: 'discipline', name: 'Discipline', description: 'Turn completed tasks into stronger progression.', icon: '🔥' },
  { id: 'knowledge', name: 'Knowledge', description: 'Turn learning into long-term growth.', icon: '📚' },
  { id: 'consistency', name: 'Consistency', description: 'Build momentum that survives difficult days.', icon: '⚡' },
];

const makeBranch = (branch: SkillBranch, icon: string, names: string[], descriptions: string[]): SkillNode[] =>
  names.map((name, index) => ({
    id: `${branch}_${index + 1}`,
    branch,
    name,
    description: descriptions[index],
    cost: index + 1,
    requires: index === 0 ? undefined : `${branch}_${index}`,
    icon,
  }));

export const SKILL_NODES: SkillNode[] = [
  ...makeBranch('strength', '💪', ['Iron Start', 'Power Within', 'Battle Rhythm', 'Unbreakable Form', 'Titan Core'], [
    'Unlock your first physical specialization.', 'Improve the value of your training progression.', 'Build momentum from repeated workouts.', 'Reach the advanced Strength path.', 'Master the Strength branch.',
  ]),
  ...makeBranch('focus', '🧠', ['Clear Mind', 'Deep Focus', 'Silent Hour', 'Unshaken', 'Mind Forge'], [
    'Begin your Focus specialization.', 'Strengthen your mental progression.', 'Create a deeper focus path.', 'Reach advanced Focus mastery.', 'Master the Focus branch.',
  ]),
  ...makeBranch('discipline', '🔥', ['First Flame', 'Steady Flame', 'Forged Will', 'Command Yourself', 'Inner Mastery'], [
    'Begin your Discipline specialization.', 'Strengthen task-based progression.', 'Build a stronger completion chain.', 'Reach advanced Discipline mastery.', 'Master the Discipline branch.',
  ]),
  ...makeBranch('knowledge', '📚', ['Curious Mind', 'Scholar', 'Deep Study', 'Lorekeeper', 'Grand Archive'], [
    'Begin your Knowledge specialization.', 'Strengthen learning progression.', 'Unlock a deeper learning path.', 'Reach advanced Knowledge mastery.', 'Master the Knowledge branch.',
  ]),
  ...makeBranch('consistency', '⚡', ['First Step', 'Momentum', 'Unbroken', 'Long Game', 'Eternal Rhythm'], [
    'Begin your Consistency specialization.', 'Strengthen your momentum path.', 'Reward long-term commitment.', 'Reach advanced Consistency mastery.', 'Master the Consistency branch.',
  ]),
];

export function getSkillNode(id: string): SkillNode | undefined {
  return SKILL_NODES.find((node) => node.id === id);
}
