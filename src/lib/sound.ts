let ctx: AudioContext | null = null;
let enabled = true;
let lastTaskSoundAt = 0;
let activeTaskOsc: OscillatorNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx?.state === 'closed') ctx = null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (!v && activeTaskOsc) {
    try { activeTaskOsc.stop(); } catch { /* already stopped */ }
    activeTaskOsc = null;
  }
}

export function playSound(type: 'task' | 'levelup' | 'rankup' | 'timer' | 'reward' | 'error' | 'click' | 'whoosh' | 'workoutComplete') {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;

  if (c.state === 'suspended') {
    void c.resume().catch(() => undefined);
  }

  // Task completion can be triggered by both the task UI and the story bridge.
  // Keep it as one short sting so two completions cannot leave overlapping audio nodes.
  if (type === 'task') {
    const nowMs = Date.now();
    if (nowMs - lastTaskSoundAt < 140) return;
    lastTaskSoundAt = nowMs;
    if (activeTaskOsc) {
      try { activeTaskOsc.stop(); } catch { /* already stopped */ }
      activeTaskOsc = null;
    }
  }

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.addEventListener('ended', () => {
    try { osc.disconnect(); gain.disconnect(); } catch { /* already disconnected */ }
    if (type === 'task' && activeTaskOsc === osc) activeTaskOsc = null;
  }, { once: true });

  switch (type) {
    case 'task': {
      activeTaskOsc = osc;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }
    case 'levelup': {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5); break;
    }
    case 'rankup': {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.4);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      const osc2 = c.createOscillator();
      const gain2 = c.createGain();
      osc2.connect(gain2); gain2.connect(c.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.5);
      gain2.gain.setValueAtTime(0.12, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.start(now + 0.1); osc2.stop(now + 0.6); break;
    }
    case 'timer': {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.5); break;
    }
    case 'reward': {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4); break;
    }
    case 'error': {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25); break;
    }
    case 'click': {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now); osc.stop(now + 0.08); break;
    }
    case 'whoosh': {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now); osc.stop(now + 0.35); break;
    }
    case 'workoutComplete': {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(196, now);
      osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(392, now + 0.34);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.start(now); osc.stop(now + 0.65);

      const accent = c.createOscillator();
      const accentGain = c.createGain();
      accent.connect(accentGain); accentGain.connect(c.destination);
      accent.type = 'sine';
      accent.frequency.setValueAtTime(392, now + 0.24);
      accent.frequency.exponentialRampToValueAtTime(587.33, now + 0.48);
      accentGain.gain.setValueAtTime(0.001, now + 0.24);
      accentGain.gain.exponentialRampToValueAtTime(0.08, now + 0.29);
      accentGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      accent.start(now + 0.24); accent.stop(now + 0.7);
      break;
    }
  }
}

export function syncSoundFlag(v: boolean) {
  setSoundEnabled(v);
}
