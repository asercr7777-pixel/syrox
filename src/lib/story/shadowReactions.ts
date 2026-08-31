export type ShadowState = 'idle' | 'observing' | 'ready' | 'command' | 'memory' | 'power' | 'revelation' | 'threat' | 'side' | 'standing' | 'walking' | 'warning';

export type StoryEventType =
  | 'workout_completed'
  | 'task_completed'
  | 'streak_increased'
  | 'day_completed'
  | 'return_after_absence'
  | 'milestone_reached'
  | 'dungeon_cleared';

export interface ShadowReaction {
  state: ShadowState;
  title: string;
  lines: string[];
  priority: number;
}

const reactions: Record<StoryEventType, ShadowReaction> = {
  workout_completed: { state: 'observing', title: 'SHADOW // OBSERVING', lines: ['I saw that.', 'You did not stop when it became difficult.'], priority: 30 },
  task_completed: { state: 'ready', title: 'SHADOW // NOTED', lines: ['Another decision made.', 'Small actions become patterns.'], priority: 20 },
  streak_increased: { state: 'power', title: 'SHADOW // PROGRESS DETECTED', lines: ['The pattern is changing.', 'Keep going.'], priority: 40 },
  day_completed: { state: 'command', title: 'SHADOW // DAY COMPLETE', lines: ['Today is done.', 'Tomorrow will ask the same question.'], priority: 50 },
  return_after_absence: { state: 'memory', title: 'SHADOW // MEMORY', lines: ['You disappeared.', 'But you came back. That matters.'], priority: 60 },
  milestone_reached: { state: 'revelation', title: 'SHADOW // THRESHOLD', lines: ['You crossed a line you could not see before.', 'There is more beyond it.'], priority: 80 },
  dungeon_cleared: { state: 'threat', title: 'SHADOW // THREAT DETECTED', lines: ['The gate is weaker now.', 'Do not mistake progress for safety.'], priority: 55 },
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
