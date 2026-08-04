import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { DialogueLine } from '../../data/story/types';
import {
  narrate, pauseNarration, resumeNarration, stopNarration,
  setVoiceEnabled, isVoiceEnabled, duckMusic, playSfx,
  type SfxType,
} from '../../lib/audioEngine';

interface CutscenePlayerProps {
  lines: DialogueLine[];
  onComplete: () => void;
  bgGradient: string;
  chapterEmoji?: string;
  chapterTitle?: string;
}

export function CutscenePlayer({
  lines, onComplete, bgGradient, chapterEmoji, chapterTitle,
}: CutscenePlayerProps) {
  const [index, setIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(isVoiceEnabled());
  const skipRef = useRef(false);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentLine = lines[Math.min(index, lines.length - 1)];
  const isLast = index >= lines.length - 1;

  // Typewriter
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    skipRef.current = false;
    let i = 0;
    typeRef.current = setInterval(() => {
      if (skipRef.current) {
        setDisplayedText(currentLine.text);
        setIsTyping(false);
        if (typeRef.current) clearInterval(typeRef.current);
        return;
      }
      if (i < currentLine.text.length) {
        setDisplayedText(currentLine.text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        if (typeRef.current) clearInterval(typeRef.current);
      }
    }, 28);
    return () => { if (typeRef.current) clearInterval(typeRef.current); };
  }, [index, currentLine.text]);

  // Narration
  useEffect(() => {
    if (voiceOn) {
      setIsPlaying(true);
      duckMusic(true);
      narrate(currentLine.text, currentLine.voice, currentLine.emotion ?? 'neutral', () => {
        setIsPlaying(false);
        duckMusic(false);
      });
      if (currentLine.sfx) playSfx(currentLine.sfx as SfxType);
    }
    return () => { stopNarration(); duckMusic(false); };
  }, [index]);

  const handleAdvance = () => {
    if (isTyping) {
      skipRef.current = true;
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      return;
    }
    stopNarration();
    duckMusic(false);
    setIsPlaying(false);
    if (isLast) {
      onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) { pauseNarration(); setIsPlaying(false); }
    else { resumeNarration(); setIsPlaying(true); }
  };

  const handleReplay = () => {
    setIsPlaying(true);
    duckMusic(true);
    narrate(currentLine.text, currentLine.voice, currentLine.emotion ?? 'neutral', () => {
      setIsPlaying(false); duckMusic(false);
    });
  };

  const handleSkip = () => {
    stopNarration();
    duckMusic(false);
    setIsPlaying(false);
    onComplete();
  };

  const handleToggleVoice = () => {
    const v = !voiceOn;
    setVoiceOn(v);
    setVoiceEnabled(v);
    if (!v) { stopNarration(); setIsPlaying(false); duckMusic(false); }
  };

  return (
    <div
      className="relative w-full min-h-[400px] md:min-h-[500px] rounded-2xl overflow-hidden border border-white/10"
      style={{ background: bgGradient }}
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              animation: `floatParticle ${4 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Scene content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-10 min-h-[400px] md:min-h-[500px]">
        {chapterEmoji && (
          <motion.div
            key={chapterEmoji + index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-5xl md:text-6xl mb-4"
            style={{ filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.4))' }}
          >
            {chapterEmoji}
          </motion.div>
        )}

        {chapterTitle && (
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-lg md:text-xl font-bold text-ink-200 mb-6 text-center"
          >
            {chapterTitle}
          </motion.h2>
        )}

        {/* Dialogue */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <div className="mb-2">
              <span
                className="px-3 py-1 rounded-lg text-sm font-bold"
                style={{
                  background: 'rgba(167,139,250,0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(167,139,250,0.3)',
                }}
              >
                {currentLine.speaker}
              </span>
            </div>
            <div
              className="p-4 md:p-5 rounded-xl bg-ink-950/80 backdrop-blur-md border border-white/10 cursor-pointer"
              onClick={handleAdvance}
            >
              <p className="text-sm md:text-base leading-relaxed text-ink-100">
                {displayedText}
                {isTyping && <span className="inline-block w-2 h-4 ml-0.5 bg-ember-400 animate-pulse" />}
              </p>
              {!isTyping && (
                <div className="text-xs text-ink-400 mt-2 animate-pulse">
                  Click to continue ▸
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          <button onClick={handlePlayPause} disabled={!voiceOn} className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5">
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={handleReplay} disabled={!voiceOn} className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5">
            <RotateCcw size={14} /> Replay
          </button>
          <button onClick={handleSkip} className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5">
            <SkipForward size={14} /> Skip All
          </button>
          <button onClick={handleToggleVoice} className="btn-ghost btn-sheen px-3 py-1.5 text-xs flex items-center gap-1.5">
            {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {voiceOn ? 'Voice On' : 'Voice Off'}
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-4">
          {lines.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-ember-500' : i < index ? 'w-1.5 bg-ember-500/40' : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
