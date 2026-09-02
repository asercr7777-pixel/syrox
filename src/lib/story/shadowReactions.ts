export type ShadowState = 'idle' | 'observing' | 'ready' | 'command' | 'memory' | 'power' | 'revelation' | 'threat' | 'side' | 'standing' | 'walking' | 'warning';

export type StoryEventType = 'workout_completed' | 'task_completed' | 'streak_increased' | 'day_completed' | 'return_after_absence' | 'milestone_reached' | 'dungeon_cleared';

export interface ShadowReaction { state: ShadowState; title: string; lines: string[]; priority: number; }

const reactions: Record<StoryEventType, ShadowReaction> = {
  workout_completed: { state: 'observing', title: 'SHADOW // OBSERVING', lines: ['I saw the hesitation. You moved anyway.', 'Your body answered before your excuses could.'], priority: 30 },
  task_completed: { state: 'ready', title: 'SHADOW // NOTED', lines: ['One decision became real. That is how identity is built.', 'Another small victory. Never underestimate repeated choices.'], priority: 20 },
  streak_increased: { state: 'power', title: 'SHADOW // PATTERN SHIFT', lines: ['The pattern is changing. Even the System can see it now.', 'Consistency is becoming something the world has to account for.'], priority: 40 },
  day_completed: { state: 'command', title: 'SHADOW // DAY SEALED', lines: ['Today is sealed. Do not confuse a finished day with a finished war.', 'You kept the vow for one more day. Tomorrow decides whether it was real.'], priority: 50 },
  return_after_absence: { state: 'memory', title: 'SHADOW // RETURN DETECTED', lines: ['You disappeared. I remembered the shape of your absence.', 'You came back. I will not call that weakness. I will call it evidence.'], priority: 60 },
  milestone_reached: { state: 'revelation', title: 'SHADOW // THRESHOLD CROSSED', lines: ['You crossed a line that cannot be uncrossed.', 'The world has changed by a fraction. So have you.'], priority: 80 },
  dungeon_cleared: { state: 'threat', title: 'SHADOW // GATE BREACH', lines: ['The gate is weaker. Something on the other side knows your name now.', 'You cleared the dungeon. Do not celebrate too early. It was watching you too.'], priority: 55 },
};

export function getShadowReaction(event: StoryEventType): ShadowReaction { return reactions[event]; }

export function getShadowImage(state: ShadowState): string {
  const images: Record<ShadowState, string> = {
    idle: '/shadow_idle.png.jpg', observing: '/shadow_observing.png.jpg', ready: '/shadow_ready.png.jpg', command: '/shadow_command.png.jpg',
    memory: '/shadow_memory.png.jpg', power: '/shadow_power.png.jpg', revelation: '/shadow_revelation.png.jpg', threat: '/shadow_threat.png.jpg',
    side: '/shadow_side.png.jpg', standing: '/shadow_standing.png.jpg', walking: '/shadow_walking.png.jpg', warning: '/shadow_warning.png.jpg',
  };
  return images[state];
}
