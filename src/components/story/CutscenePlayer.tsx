import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, RotateCcw, Volume2, VolumeX, Eye } from 'lucide-react';
import type { DialogueLine } from '../../data/story/types';
import { getShadowImage, type ShadowState } from '../../lib/story/shadowReactions';
import { narrate, pauseNarration, resumeNarration, stopNarration, setVoiceEnabled, isVoiceEnabled, duckMusic, playSfx, type SfxType } from '../../lib/audioEngine';

interface CutscenePlayerProps { lines: DialogueLine[]; onComplete: () => void; bgGradient: string; chapterEmoji?: string; chapterTitle?: string; shadowGuide?: boolean; shadowState?: ShadowState; }

function stateFromLine(line: DialogueLine | undefined): ShadowState {
  const emotion = line?.emotion;
  if (emotion === 'angry') return 'threat';
  if (emotion === 'excited' || emotion === 'happy') return 'power';
  if (emotion === 'sad') return 'memory';
  if (emotion === 'fear') return 'warning';
  if (emotion === 'serious') return 'command';
  if (emotion === 'mysterious') return 'observing';
  return 'idle';
}

// SpeechSynthesis does not expose a reliable duration API, so the text reveal is
// paced from the same voice/emotion family and then held until narration ends.
// This keeps the text from racing ahead of the voice while preserving the
// existing audio engine and all other callers.
function getRevealDuration(text: string, voice: DialogueLine['voice'], emotion?: DialogueLine['emotion']): number {
  const baseWpm: Record<string, number> = {
    narrator: 145, mentor: 150, merchant: 165, warrior: 175, survivor: 155,
    corrupted: 135, guardian: 125, boss: 115, player: 165,
  };
  const emotionRate: Record<string, number> = {
    neutral: 1, happy: 1.1, serious: 0.9, excited: 1.2,
    mysterious: 0.85, angry: 1.1, sad: 0.8, fear: 1.15,
  };
  const wpm = (baseWpm[voice] ?? 145) * (emotionRate[emotion ?? 'neutral'] ?? 1);
  const words = Math.max(1, text.trim().split(/\s+/).length);
  const punctuationPauses = (text.match(/[,.!?;:]/g) ?? []).length * 90;
  return Math.max(900, (words / wpm) * 60_000 + punctuationPauses);
}

export function CutscenePlayer({ lines, onComplete, bgGradient, chapterEmoji, chapterTitle, shadowGuide = true, shadowState }: CutscenePlayerProps) {
  const [index, setIndex] = useState(0); const [displayedText, setDisplayedText] = useState(''); const [isTyping, setIsTyping] = useState(false); const [isPlaying, setIsPlaying] = useState(false); const [voiceOn, setVoiceOn] = useState(isVoiceEnabled()); const [imageFailed, setImageFailed] = useState(false);
  const skipRef = useRef(false); const typeRef = useRef<ReturnType<typeof setInterval> | null>(null); const narrationFinishedRef = useRef(false); const currentLine = lines[Math.min(index, lines.length - 1)]; const isLast = index >= lines.length - 1; const isShadow = Boolean(shadowGuide && currentLine?.speaker?.toLowerCase().includes('shadow')); const activeShadowState = shadowState ?? stateFromLine(currentLine); const shadowImage = getShadowImage(activeShadowState);
  useEffect(() => { setImageFailed(false); }, [shadowImage]);

  useEffect(() => {
    if (!currentLine) return;
    if (typeRef.current) clearInterval(typeRef.current);
    setDisplayedText('');
    setIsTyping(true);
    skipRef.current = false;
    narrationFinishedRef.current = !voiceOn;

    const text = currentLine.text;
    if (!voiceOn) {
      let i = 0;
      typeRef.current = setInterval(() => {
        if (skipRef.current) {
          setDisplayedText(text); setIsTyping(false);
          if (typeRef.current) clearInterval(typeRef.current);
          return;
        }
        if (i < text.length) { setDisplayedText(text.slice(0, i + 1)); i += 1; }
        else { setIsTyping(false); if (typeRef.current) clearInterval(typeRef.current); }
      }, 28);
      return () => { if (typeRef.current) clearInterval(typeRef.current); };
    }

    // When voice is enabled, pace the reveal to the estimated speech duration.
    // If the browser's actual speech lasts longer, the full line stays visible
    // until onEnd, so it never advances visually before the voice finishes.
    const duration = getRevealDuration(text, isShadow ? 'guardian' : currentLine.voice, currentLine.emotion);
    const stepMs = Math.max(18, duration / Math.max(1, text.length));
    let i = 0;
    typeRef.current = setInterval(() => {
      if (skipRef.current) {
        setDisplayedText(text); setIsTyping(false);
        if (typeRef.current) clearInterval(typeRef.current);
        return;
      }
      if (i < text.length && !narrationFinishedRef.current) {
        setDisplayedText(text.slice(0, i + 1)); i += 1;
      } else if (i >= text.length && narrationFinishedRef.current) {
        setDisplayedText(text); setIsTyping(false);
        if (typeRef.current) clearInterval(typeRef.current);
      }
    }, stepMs);

    return () => { if (typeRef.current) clearInterval(typeRef.current); };
  }, [index, currentLine?.text, voiceOn, isShadow]);

  useEffect(() => {
    if (!currentLine || !voiceOn) return;
    setIsPlaying(true); duckMusic(true);
    narrationFinishedRef.current = false;
    const voice = isShadow ? 'guardian' : currentLine.voice;
    narrate(
      currentLine.text,
      voice,
      currentLine.emotion ?? (isShadow ? 'mysterious' : 'neutral'),
      () => {
        narrationFinishedRef.current = true;
        setDisplayedText(currentLine.text);
        setIsTyping(false);
        setIsPlaying(false);
        duckMusic(false);
      }
    );
    if (currentLine.sfx) playSfx(currentLine.sfx as SfxType);
    return () => { stopNarration(); duckMusic(false); narrationFinishedRef.current = true; };
  }, [index, voiceOn, isShadow]);

  const advance = () => {
    if (!currentLine) return;
    if (isTyping) {
      skipRef.current = true;
      narrationFinishedRef.current = true;
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      stopNarration();
      duckMusic(false);
      setIsPlaying(false);
      return;
    }
    stopNarration(); duckMusic(false); setIsPlaying(false);
    if (isLast) onComplete(); else setIndex((v) => v + 1);
  };

  const replay = () => {
    if (!currentLine || !voiceOn) return;
    narrationFinishedRef.current = false;
    skipRef.current = false;
    setDisplayedText(''); setIsTyping(true); setIsPlaying(true); duckMusic(true);
    narrate(
      currentLine.text,
      isShadow ? 'guardian' : currentLine.voice,
      currentLine.emotion ?? (isShadow ? 'mysterious' : 'neutral'),
      () => {
        narrationFinishedRef.current = true;
        setDisplayedText(currentLine.text); setIsTyping(false); setIsPlaying(false); duckMusic(false);
      }
    );
  };

  const toggleVoice = () => {
    const v = !voiceOn; setVoiceOn(v); setVoiceEnabled(v);
    if (!v) { stopNarration(); setIsPlaying(false); duckMusic(false); narrationFinishedRef.current = true; }
  };

  if (!currentLine) return <div className="rounded-2xl border border-white/10 bg-black/50 p-8 text-center text-ink-300">No dialogue available.</div>;
  return <div className="relative min-h-[480px] overflow-hidden rounded-3xl border border-white/10" style={{ background: bgGradient }}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,.2),transparent_42%)] pointer-events-none" />
    <div className="relative grid min-h-[480px] items-center gap-6 p-5 md:grid-cols-[210px_1fr] md:p-8">
      {isShadow ? <motion.div key={activeShadowState} initial={{ opacity: 0, x: -18, scale: .96 }} animate={{ opacity: 1, x: 0, scale: 1 }} className="relative mx-auto w-full max-w-[210px] overflow-hidden rounded-3xl border border-violet-400/30 bg-black/50 shadow-[0_0_50px_rgba(124,58,237,.2)]"><img src={imageFailed ? getShadowImage('standing') : shadowImage} alt={`Shadow, ${activeShadowState} state`} className="aspect-[3/4] w-full object-cover object-center" onError={() => setImageFailed(true)} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-violet-200"><Eye size={13} /> Shadow</div><p className="mt-1 text-[10px] text-violet-100/70">{activeShadowState}</p></div></motion.div> : <div className="hidden md:block" />}
      <div className="min-w-0">
        {chapterEmoji && <motion.div key={chapterEmoji + index} initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-3 text-4xl">{chapterEmoji}</motion.div>}
        {chapterTitle && <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 font-display text-xl font-black text-white">{chapterTitle}</motion.h2>}
        <AnimatePresence mode="wait"><motion.div key={index} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><div className="mb-2"><span className={`inline-flex rounded-lg px-3 py-1 text-sm font-bold ${isShadow ? 'border border-violet-400/30 bg-violet-500/10 text-violet-200' : 'border border-ember-500/25 bg-ember-500/10 text-ember-300'}`}>{currentLine.speaker}</span></div><button onClick={advance} aria-label={isTyping ? 'Show full dialogue' : isLast ? 'Finish scene' : 'Continue dialogue'} className="w-full rounded-2xl border border-white/10 bg-black/70 p-5 text-left shadow-xl backdrop-blur-sm"><p className="text-sm leading-7 text-ink-100 md:text-base">{displayedText}{isTyping && <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-ember-400" />}</p>{!isTyping && <div className="mt-3 text-[10px] uppercase tracking-wider text-ink-500">Click to continue ▸</div>}</button></motion.div></AnimatePresence>
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => { if (isPlaying) { pauseNarration(); setIsPlaying(false); } else { resumeNarration(); setIsPlaying(true); } }} disabled={!voiceOn} className="btn-ghost btn-sheen px-3 py-1.5 text-xs"><Play size={13} />{isPlaying ? 'Pause' : 'Play'}</button><button onClick={replay} disabled={!voiceOn} className="btn-ghost btn-sheen px-3 py-1.5 text-xs"><RotateCcw size={13} /> Replay</button><button onClick={onComplete} className="btn-ghost btn-sheen px-3 py-1.5 text-xs"><SkipForward size={13} /> Skip</button><button onClick={toggleVoice} className="btn-ghost btn-sheen px-3 py-1.5 text-xs">{voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}{voiceOn ? 'Voice On' : 'Voice Off'}</button></div>
        <div className="mt-4 flex gap-1.5" aria-label={`Dialogue ${index + 1} of ${lines.length}`}>{lines.map((_, i) => <div key={i} className={`h-1.5 rounded-full ${i === index ? 'w-7 bg-ember-500' : i < index ? 'w-1.5 bg-ember-500/40' : 'w-1.5 bg-white/10'}`} />)}</div>
      </div>
    </div>
  </div>;
}
