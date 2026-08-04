/**
 * Audio Engine for Story Mode
 * - Voice narration via Web Speech Synthesis (each NPC has unique voice params)
 * - Sound effects via Web Audio API (procedurally generated)
 * - Background music via Web Audio oscillators with adaptive layering
 */

import type { VoiceProfile, Emotion } from '../data/story/types';

// ============ VOICE NARRATION ============

interface VoiceConfig {
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
}

const VOICE_PROFILES: Record<VoiceProfile, VoiceConfig> = {
  narrator: { rate: 0.85, pitch: 0.4, volume: 0.9, lang: 'en-US' },
  mentor: { rate: 0.9, pitch: 0.7, volume: 0.85, lang: 'en-US' },
  merchant: { rate: 1.0, pitch: 0.9, volume: 0.8, lang: 'en-US' },
  warrior: { rate: 1.05, pitch: 0.6, volume: 0.9, lang: 'en-US' },
  survivor: { rate: 0.95, pitch: 0.85, volume: 0.75, lang: 'en-US' },
  corrupted: { rate: 0.8, pitch: 0.3, volume: 0.85, lang: 'en-US' },
  guardian: { rate: 0.75, pitch: 0.25, volume: 0.95, lang: 'en-US' },
  boss: { rate: 0.7, pitch: 0.2, volume: 1.0, lang: 'en-US' },
  player: { rate: 1.0, pitch: 1.0, volume: 0.8, lang: 'en-US' },
};

const EMOTION_MODIFIERS: Record<Emotion, { rate: number; pitch: number }> = {
  neutral: { rate: 1, pitch: 1 },
  happy: { rate: 1.1, pitch: 1.15 },
  serious: { rate: 0.9, pitch: 0.9 },
  excited: { rate: 1.2, pitch: 1.25 },
  mysterious: { rate: 0.85, pitch: 0.8 },
  angry: { rate: 1.1, pitch: 0.7 },
  sad: { rate: 0.8, pitch: 0.85 },
  fear: { rate: 1.15, pitch: 1.3 },
};

let voiceEnabled = true;
let onNarrationEnd: (() => void) | null = null;

export function setVoiceEnabled(v: boolean) {
  voiceEnabled = v;
  if (!v) stopNarration();
}

export function isVoiceEnabled(): boolean {
  return voiceEnabled;
}

export function narrate(
  text: string,
  voice: VoiceProfile,
  emotion: Emotion = 'neutral',
  onEnd?: () => void
) {
  if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  stopNarration();
  const profile = VOICE_PROFILES[voice] ?? VOICE_PROFILES.narrator;
  const mod = EMOTION_MODIFIERS[emotion] ?? EMOTION_MODIFIERS.neutral;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = profile.rate * mod.rate;
  utter.pitch = Math.max(0, Math.min(2, profile.pitch * mod.pitch));
  utter.volume = profile.volume;
  utter.lang = profile.lang;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const preferred = voices.find((v) => v.lang.startsWith(profile.lang.split('-')[0]));
    if (preferred) utter.voice = preferred;
  }
  utter.onend = () => {
    onNarrationEnd?.();
  };
  utter.onerror = () => {
    onNarrationEnd?.();
  };
  onNarrationEnd = onEnd ?? null;
  window.speechSynthesis.speak(utter);
}

export function pauseNarration() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

export function resumeNarration() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

export function stopNarration() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isNarrationPaused(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.paused;
}

// ============ SOUND EFFECTS ============

let audioCtx: AudioContext | null = null;
let sfxEnabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function setSfxEnabled(v: boolean) {
  sfxEnabled = v;
}

export function isSfxEnabled(): boolean {
  return sfxEnabled;
}

export type SfxType =
  | 'footstep' | 'door' | 'wind' | 'rain' | 'thunder' | 'sword_clash'
  | 'magic' | 'fire' | 'click' | 'hover' | 'success' | 'failure'
  | 'quest_complete' | 'level_up' | 'coin' | 'boss_roar'
  | 'dungeon_ambient' | 'forest_ambient' | 'cave_ambient' | 'temple_ambient'
  | 'whoosh' | 'impact' | 'reward' | 'error' | 'task';

export function playSfx(type: SfxType) {
  if (!sfxEnabled) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const now = c.currentTime;

  switch (type) {
    case 'footstep': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(80, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      o.start(now); o.stop(now + 0.12);
      break;
    }
    case 'door': {
      const o = c.createOscillator();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.type = 'sawtooth';
      f.type = 'lowpass'; f.frequency.value = 400;
      o.frequency.setValueAtTime(60, now);
      o.frequency.linearRampToValueAtTime(120, now + 0.3);
      o.frequency.linearRampToValueAtTime(80, now + 0.6);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      o.start(now); o.stop(now + 0.7);
      break;
    }
    case 'wind': {
      const noise = createNoise(c, 2);
      const g = c.createGain();
      const f = c.createBiquadFilter();
      noise.connect(f); f.connect(g); g.connect(c.destination);
      f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.5;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.5);
      g.gain.linearRampToValueAtTime(0.001, now + 2);
      noise.start(now);
      break;
    }
    case 'rain': {
      const noise = createNoise(c, 2);
      const g = c.createGain();
      const f = c.createBiquadFilter();
      noise.connect(f); f.connect(g); g.connect(c.destination);
      f.type = 'highpass'; f.frequency.value = 2000;
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      noise.start(now);
      break;
    }
    case 'thunder': {
      const noise = createNoise(c, 1.5);
      const g = c.createGain();
      const f = c.createBiquadFilter();
      noise.connect(f); f.connect(g); g.connect(c.destination);
      f.type = 'lowpass'; f.frequency.value = 200;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.3, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      noise.start(now);
      break;
    }
    case 'sword_clash': {
      const o = c.createOscillator();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.type = 'sawtooth';
      f.type = 'highpass'; f.frequency.value = 1500;
      o.frequency.setValueAtTime(3000, now);
      o.frequency.exponentialRampToValueAtTime(500, now + 0.15);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.start(now); o.stop(now + 0.2);
      break;
    }
    case 'magic': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(440, now);
      o.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.start(now); o.stop(now + 0.5);
      break;
    }
    case 'fire': {
      const noise = createNoise(c, 1);
      const g = c.createGain();
      const f = c.createBiquadFilter();
      noise.connect(f); f.connect(g); g.connect(c.destination);
      f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 1;
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      noise.start(now);
      break;
    }
    case 'click': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(800, now);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.start(now); o.stop(now + 0.08);
      break;
    }
    case 'hover': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(1200, now);
      g.gain.setValueAtTime(0.03, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      o.start(now); o.stop(now + 0.05);
      break;
    }
    case 'success':
    case 'quest_complete':
    case 'reward': {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0.12, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.2);
      });
      break;
    }
    case 'failure':
    case 'error': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(220, now);
      o.frequency.setValueAtTime(180, now + 0.1);
      o.frequency.setValueAtTime(140, now + 0.2);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.start(now); o.stop(now + 0.3);
      break;
    }
    case 'level_up': {
      const notes = [440, 554, 659, 880, 1109];
      notes.forEach((freq, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.06);
        g.gain.setValueAtTime(0.15, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
        o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.3);
      });
      break;
    }
    case 'coin': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(988, now);
      o.frequency.setValueAtTime(1319, now + 0.07);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.start(now); o.stop(now + 0.15);
      break;
    }
    case 'boss_roar': {
      const o = c.createOscillator();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.type = 'sawtooth';
      f.type = 'lowpass'; f.frequency.value = 300;
      o.frequency.setValueAtTime(60, now);
      o.frequency.linearRampToValueAtTime(30, now + 0.5);
      o.frequency.linearRampToValueAtTime(80, now + 1);
      g.gain.setValueAtTime(0.2, now);
      g.gain.linearRampToValueAtTime(0.25, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      o.start(now); o.stop(now + 1.5);
      break;
    }
    case 'whoosh': {
      const noise = createNoise(c, 0.5);
      const g = c.createGain();
      const f = c.createBiquadFilter();
      noise.connect(f); f.connect(g); g.connect(c.destination);
      f.type = 'bandpass'; f.frequency.setValueAtTime(500, now);
      f.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.start(now);
      break;
    }
    case 'impact': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(150, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.start(now); o.stop(now + 0.2);
      break;
    }
    case 'task': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(660, now);
      o.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.start(now); o.stop(now + 0.15);
      break;
    }
    case 'dungeon_ambient':
    case 'cave_ambient': {
      const noise = createNoise(c, 3);
      const g = c.createGain();
      const f = c.createBiquadFilter();
      noise.connect(f); f.connect(g); g.connect(c.destination);
      f.type = 'lowpass'; f.frequency.value = 200;
      g.gain.setValueAtTime(0.04, now);
      g.gain.linearRampToValueAtTime(0.001, now + 2.5);
      noise.start(now);
      break;
    }
    case 'forest_ambient': {
      const noise = createNoise(c, 3);
      const g = c.createGain();
      const f = c.createBiquadFilter();
      noise.connect(f); f.connect(g); g.connect(c.destination);
      f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 2;
      g.gain.setValueAtTime(0.03, now);
      g.gain.linearRampToValueAtTime(0.001, now + 2.5);
      noise.start(now);
      break;
    }
    case 'temple_ambient': {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(110, now);
      g.gain.setValueAtTime(0.05, now);
      g.gain.linearRampToValueAtTime(0.001, now + 3);
      o.start(now); o.stop(now + 3);
      break;
    }
  }
}

function createNoise(c: AudioContext, duration: number): AudioBufferSourceNode {
  const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  return src;
}

// ============ BACKGROUND MUSIC ============

type MusicTheme =
  | 'calm' | 'mystery' | 'dark' | 'battle' | 'boss_battle'
  | 'victory' | 'emotional';

let musicNodes: { oscillators: OscillatorNode[]; gains: GainNode[] } | null = null;
let musicEnabled = true;
let musicVolume = 0.15;
let targetMusicVolume = 0.15;
let musicFadeInterval: ReturnType<typeof setInterval> | null = null;

const THEME_FREQS: Record<MusicTheme, number[]> = {
  calm: [261.63, 329.63, 392.0],
  mystery: [220.0, 277.18, 369.99],
  dark: [146.83, 174.61, 220.0],
  battle: [196.0, 246.94, 329.63],
  boss_battle: [130.81, 164.81, 220.0],
  victory: [349.23, 440.0, 523.25],
  emotional: [261.63, 311.13, 392.0],
};

export function setMusicEnabled(v: boolean) {
  musicEnabled = v;
  if (!v) stopMusic();
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function playMusic(theme: string) {
  if (!musicEnabled) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  stopMusic();
  const freqs = THEME_FREQS[theme as MusicTheme] ?? THEME_FREQS.calm;
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  freqs.forEach((freq, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = i === 0 ? 'sine' : 'triangle';
    o.frequency.value = freq;
    g.gain.value = 0;
    const targetVol = musicVolume / freqs.length;
    g.gain.linearRampToValueAtTime(targetVol, c.currentTime + 1.5);
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    lfo.frequency.value = 0.2 + i * 0.1;
    lfoGain.gain.value = 2;
    o.start();
    lfo.start();
    oscillators.push(o, lfo);
    gains.push(g, lfoGain);
  });
  musicNodes = { oscillators, gains };
}

export function stopMusic() {
  if (!musicNodes || !audioCtx) return;
  const c = audioCtx;
  musicNodes.gains.forEach((g) => {
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
  });
  const nodes = musicNodes;
  setTimeout(() => {
    nodes.oscillators.forEach((o) => {
      try { o.stop(); } catch { /* already stopped */ }
    });
  }, 900);
  musicNodes = null;
}

export function duckMusic(duck: boolean) {
  targetMusicVolume = duck ? 0.05 : 0.15;
  if (musicFadeInterval) clearInterval(musicFadeInterval);
  musicFadeInterval = setInterval(() => {
    const diff = targetMusicVolume - musicVolume;
    if (Math.abs(diff) < 0.005) {
      musicVolume = targetMusicVolume;
      if (musicFadeInterval) { clearInterval(musicFadeInterval); musicFadeInterval = null; }
      return;
    }
    musicVolume += diff * 0.1;
    if (musicNodes && audioCtx) {
      const freqs = musicNodes.gains.length / 2;
      musicNodes.gains.forEach((g, i) => {
        if (i % 2 === 0) {
          g.gain.linearRampToValueAtTime(musicVolume / freqs, audioCtx!.currentTime + 0.1);
        }
      });
    }
  }, 50);
}

// ============ INIT ============

export function initAudio() {
  getCtx();
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }
}
