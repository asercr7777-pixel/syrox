import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { DialogueLine, Emotion } from '../../data/story/types';
import {
  narrate, pauseNarration, resumeNarration, stopNarration, setVoiceEnabled, isVoiceEnabled, duckMusic, playSfx,
  type SfxType,
} from '../../lib/audioEngine';

const EMOTION_COLORS: Record<Emotion, string> = {
  neutral: '#e6eaf5',
  happy: '#fbbf24',
  serious: '#f97316',
  excited: '#ff7a18',
  mysterious: '#a78bfa',
  angry: '#ef4444',
  sad: '#60a5fa',
  fear: '#8b5cf6',
};

const SPEAKER_COLORS: Record<string, string> = {
  Narrator: '#94a3b8',
  Shadow: '#a78bfa',
  Kael: '#fbbf24',
  Lyra: '#ff7a18',
  Oren: '#60a5fa',
  Malakai: '#ef4444',
  Guardian: '#06b6d4',
  Boss: '#dc2626',
  Player: '#34d399',
};

interface DialogueBoxProps {
  line: DialogueLine;
  onComplete: () => void;
  onSkip: () => void;
  autoPlay?: boolean;
}

export function DialogueBox({ line, onComplete, onSkip, autoPlay = true }: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(isVoiceEnabled());
  const skipRef = useRef(false);
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const speakerColor = SPEAKER_COLORS[line.speaker] ?? '#e6eaf5';
  const emotionColor = EMOTION_COLORS[line.emotion ?? 'neutral'];

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    skipRef.current = false;
    let i = 0;
    const speed = 28;
    typeIntervalRef.current = setInterval(() => {
      if (skipRef.current) {
        setDisplayedText(line.text);
        setIsTyping(false);
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
        return;
      }
      if (i < line.text.length) {
        setDisplayedText(line.text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      }
    }, speed);
    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    };
  }, [line.text]);

  // Auto-play narration
  useEffect(() => {
    if (autoPlay && voiceOn) {
      setIsPlaying(true);
      duckMusic(true);
      narrate(line.text, line.voice, line.emotion ?? 'neutral', () => {
        setIsPlaying(false);
        duckMusic(false);
      });
      if (line.sfx) playSfx(line.sfx as SfxType);
    }
    return () => {
      stopNarration();
      duckMusic(false);
    };
  }, [line]);

  const handleSkipTyping = useCallback(() => {
    if (isTyping) {
      skipRef.current = true;
      setDisplayedText(line.text);
      setIsTyping(false);
    }
  }, [isTyping, line.text]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseNarration();
      setIsPlaying(false);
    } else {
      resumeNarration();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleReplay = useCallback(() => {
    setIsPlaying(true);
    duckMusic(true);
    narrate(line.text, line.voice, line.emotion ?? 'neutral', () => {
      setIsPlaying(false);
      duckMusic(false);
    });
  }, [line]);

  const handleSkip = useCallback(() => {
    stopNarration();
    duckMusic(false);
    setIsPlaying(false);
    onSkip();
  }, [onSkip]);

  const handleToggleVoice = useCallback(() => {
    const newVal = !voiceOn;
    setVoiceOn(newVal);
    setVoiceEnabled(newVal);
    if (!newVal) {
      stopNarration();
      setIsPlaying(false);
      duckMusic(false);
    }
  }, [voiceOn]);

  const handleAdvance = useCallback(() => {
    if (isTyping) {
      handleSkipTyping();
      return;
    }
    stopNarration();
    duckMusic(false);
    setIsPlaying(false);
    onComplete();
  }, [isTyping, handleSkipTyping, onComplete]);

  return (
    <div className="w-full">
      {/* Speaker name + emotion indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="px-3 py-1 rounded-lg text-sm font-bold"
          style={{ background: `${speakerColor}20`, color: speakerColor, border: `1px solid ${speakerColor}40` }}
        >
          {line.speaker}
        </div>
        {line.emotion && line.emotion !== 'neutral' && (
          <span className="text-xs uppercase tracking-wider" style={{ color: emotionColor }}>
            {line.emotion}
          </span>
        )}
      </div>

      {/* Dialogue text */}
      <div
        className="relative p-4 md:p-5 rounded-xl bg-ink-950/80 backdrop-blur-md border border-white/10 min-h-[80px] cursor-pointer"
        onClick={handleAdvance}
      >
        <p className="text-sm md:text-base leading-relaxed text-ink-100">
          {displayedText}
          {isTyping && <span className="inline-block w-2 h-4 ml-0.5 bg-ember-400 animate-pulse" />}
        </p>
        {!isTyping && (
          <div className="absolute bottom-2 right-3 text-xs text-ink-400 animate-pulse">
            Click to continue ▸
          </div>
        )}
      </div>

      {/* Voice controls */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handlePlayPause}
          className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5"
          disabled={!voiceOn}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={handleReplay}
          className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5"
          disabled={!voiceOn}
        >
          <RotateCcw size={14} /> Replay
        </button>
        <button
          onClick={handleSkip}
          className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5"
        >
          <SkipForward size={14} /> Skip
        </button>
        <button
          onClick={handleToggleVoice}
          className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5 ml-auto"
        >
          {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {voiceOn ? 'Voice On' : 'Voice Off'}
        </button>
      </div>
    </div>
  );
}
