import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, RotateCcw, Volume2, VolumeX, Eye, Sparkles, ChevronRight, Volume1 } from 'lucide-react';
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

function getRevealDuration(text: string, voice: DialogueLine['voice'], emotion?: DialogueLine['emotion']): number {
  const baseWpm: Record<string, number> = { narrator: 145, mentor: 150, merchant: 165, warrior: 175, survivor: 155, corrupted: 135, guardian: 125, boss: 115, player: 165 };
  const emotionRate: Record<string, number> = { neutral: 1, happy: 1.1, serious: .9, excited: 1.2, mysterious: .85, angry: 1.1, sad: .8, fear: 1.15 };
  const wpm = (baseWpm[voice] ?? 145) * (emotionRate[emotion ?? 'neutral'] ?? 1);
  const words = Math.max(1, text.trim().split(/\s+/).length);
  const punctuationPauses = (text.match(/[,.!?;:]/g) ?? []).length * 90;
  return Math.max(900, (words / wpm) * 60000 + punctuationPauses);
}

function atmosphereForEmotion(emotion?: DialogueLine['emotion'], shadow = false) {
  if (shadow || emotion === 'mysterious') return { glow: 'rgba(124,58,237,.24)', accent: 'rgba(167,139,250,.8)', wash: 'rgba(49,20,90,.18)' };
  if (emotion === 'angry') return { glow: 'rgba(220,38,38,.24)', accent: 'rgba(248,113,113,.8)', wash: 'rgba(90,15,15,.18)' };
  if (emotion === 'fear') return { glow: 'rgba(14,116,144,.22)', accent: 'rgba(103,232,249,.75)', wash: 'rgba(8,47,73,.18)' };
  if (emotion === 'sad') return { glow: 'rgba(59,130,246,.18)', accent: 'rgba(147,197,253,.72)', wash: 'rgba(15,35,70,.18)' };
  if (emotion === 'excited' || emotion === 'happy') return { glow: 'rgba(245,158,11,.22)', accent: 'rgba(253,186,116,.82)', wash: 'rgba(92,45,5,.14)' };
  if (emotion === 'serious') return { glow: 'rgba(99,102,241,.2)', accent: 'rgba(165,180,252,.75)', wash: 'rgba(30,32,80,.16)' };
  return { glow: 'rgba(139,92,246,.16)', accent: 'rgba(196,181,253,.65)', wash: 'rgba(25,20,45,.12)' };
}

export function CutscenePlayer({ lines, onComplete, bgGradient, chapterEmoji, chapterTitle, shadowGuide = true, shadowState }: CutscenePlayerProps) {
  const [index, setIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(isVoiceEnabled());
  const [imageFailed, setImageFailed] = useState(false);
  const skipRef = useRef(false);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const narrationFinishedRef = useRef(false);
  const currentLine = lines[Math.min(index, lines.length - 1)];
  const isLast = index >= lines.length - 1;
  const isShadow = Boolean(shadowGuide && currentLine?.speaker?.toLowerCase().includes('shadow'));
  const activeShadowState = shadowState ?? stateFromLine(currentLine);
  const shadowImage = getShadowImage(activeShadowState);
  const atmosphere = atmosphereForEmotion(currentLine?.emotion, isShadow);

  useEffect(() => { setImageFailed(false); }, [shadowImage]);

  useEffect(() => {
    if (!currentLine) return;
    if (typeRef.current) clearInterval(typeRef.current);
    setDisplayedText(''); setIsTyping(true); skipRef.current = false; narrationFinishedRef.current = !voiceOn;
    const text = currentLine.text;
    const duration = voiceOn ? getRevealDuration(text, isShadow ? 'guardian' : currentLine.voice, currentLine.emotion) : Math.max(900, text.length * 28);
    const stepMs = Math.max(18, duration / Math.max(1, text.length));
    let i = 0;
    typeRef.current = setInterval(() => {
      if (skipRef.current) { setDisplayedText(text); setIsTyping(false); if (typeRef.current) clearInterval(typeRef.current); return; }
      if (i < text.length && (!voiceOn || !narrationFinishedRef.current)) { setDisplayedText(text.slice(0, i + 1)); i += 1; }
      else if (i >= text.length && (!voiceOn || narrationFinishedRef.current)) { setDisplayedText(text); setIsTyping(false); if (typeRef.current) clearInterval(typeRef.current); }
    }, stepMs);
    return () => { if (typeRef.current) clearInterval(typeRef.current); };
  }, [index, currentLine?.text, voiceOn, isShadow]);

  useEffect(() => {
    if (!currentLine || !voiceOn) return;
    setIsPlaying(true); duckMusic(true); narrationFinishedRef.current = false;
    narrate(currentLine.text, isShadow ? 'guardian' : currentLine.voice, currentLine.emotion ?? (isShadow ? 'mysterious' : 'neutral'), () => {
      narrationFinishedRef.current = true; setDisplayedText(currentLine.text); setIsTyping(false); setIsPlaying(false); duckMusic(false);
    });
    if (currentLine.sfx) playSfx(currentLine.sfx as SfxType);
    return () => { stopNarration(); duckMusic(false); narrationFinishedRef.current = true; };
  }, [index, voiceOn, isShadow]);

  const advance = () => {
    if (!currentLine) return;
    if (isTyping) { skipRef.current = true; narrationFinishedRef.current = true; setDisplayedText(currentLine.text); setIsTyping(false); stopNarration(); duckMusic(false); setIsPlaying(false); return; }
    stopNarration(); duckMusic(false); setIsPlaying(false);
    if (isLast) onComplete(); else setIndex((v) => v + 1);
  };

  const replay = () => {
    if (!currentLine || !voiceOn) return;
    narrationFinishedRef.current = false; skipRef.current = false; setDisplayedText(''); setIsTyping(true); setIsPlaying(true); duckMusic(true);
    narrate(currentLine.text, isShadow ? 'guardian' : currentLine.voice, currentLine.emotion ?? (isShadow ? 'mysterious' : 'neutral'), () => {
      narrationFinishedRef.current = true; setDisplayedText(currentLine.text); setIsTyping(false); setIsPlaying(false); duckMusic(false);
    });
  };

  const toggleVoice = () => {
    const v = !voiceOn; setVoiceOn(v); setVoiceEnabled(v);
    if (!v) { stopNarration(); setIsPlaying(false); duckMusic(false); narrationFinishedRef.current = true; }
  };

  if (!currentLine) return <div className="rounded-2xl border border-white/10 bg-black/50 p-8 text-center text-ink-300">No dialogue available.</div>;
  const progress = ((index + 1) / Math.max(lines.length, 1)) * 100;

  return <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl" style={{ backgroundImage: bgGradient }}>
    <motion.div key={`${index}-${currentLine.emotion}-${isShadow}`} className="absolute inset-0 pointer-events-none" animate={{ opacity: isPlaying ? [0.75, 1, 0.75] : .8 }} transition={{ duration: 3.2, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }} style={{ background: `radial-gradient(circle at 18% 18%, ${atmosphere.glow}, transparent 34%), radial-gradient(circle at 84% 78%, ${atmosphere.wash}, transparent 36%)` }} />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,.48)_100%)] pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
    <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none" style={{ background: atmosphere.glow, opacity: .16 }} />

    <div className="relative z-10 flex min-h-[560px] flex-col p-4 sm:p-6 md:p-8">
      <div className="absolute inset-x-0 top-0 h-2 bg-black/80" />
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div key={chapterEmoji} initial={{ scale: .75, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[.06] text-lg shadow-inner">{chapterEmoji ?? <Sparkles size={18} className="text-ember-300" />}</motion.div>
          <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.35em] text-ink-500">Story Mode</p><h2 className="truncate font-display text-sm font-black uppercase tracking-wider text-white sm:text-base">{chapterTitle ?? 'Unknown Chapter'}</h2></div>
        </div>
        <div className="shrink-0 text-right"><p className="text-[9px] font-black uppercase tracking-[.28em] text-ink-500">Scene</p><p className="font-mono text-xs font-bold text-ink-200">{String(index + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}</p></div>
      </div>

      <div className="mt-5 grid flex-1 items-center gap-7 md:grid-cols-[230px_1fr]">
        {isShadow ? <motion.div key={activeShadowState} initial={{ opacity: 0, x: -30, scale: .9, filter: 'blur(8px)' }} animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }} transition={{ duration: .55, ease: 'easeOut' }} className="relative mx-auto w-full max-w-[230px]">
          <motion.div animate={{ opacity: isPlaying ? [0.28, .5, .28] : .32, scale: isPlaying ? [1, 1.06, 1] : 1 }} transition={{ duration: 2.8, repeat: isPlaying ? Infinity : 0 }} className="absolute inset-3 rounded-[2rem] bg-violet-500 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-black/60 p-1 shadow-[0_0_80px_rgba(124,58,237,.24)]">
            <img src={imageFailed ? getShadowImage('standing') : shadowImage} alt={`Shadow, ${activeShadowState} state`} className="aspect-[3/4] w-full rounded-[1.7rem] object-cover object-center opacity-95" onError={() => setImageFailed(true)} />
            <div className="absolute inset-x-1 bottom-1 rounded-b-[1.7rem] bg-gradient-to-t from-black via-black/75 to-transparent px-5 pb-5 pt-12"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.3em] text-violet-200"><Eye size={13} /> Shadow</div><p className="mt-1 text-[10px] uppercase tracking-widest text-violet-100/45">{activeShadowState}</p></div>
          </div>
        </motion.div> : <div className="hidden md:flex md:items-center md:justify-center"><motion.div animate={{ rotate: 360, scale: isPlaying ? [1, 1.04, 1] : 1 }} transition={{ rotate: { duration: 28, repeat: Infinity, ease: 'linear' }, scale: { duration: 2.8, repeat: isPlaying ? Infinity : 0 } }} className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/5 bg-white/[.025]"><div className="absolute inset-4 rounded-full border border-ember-400/10" /><div className="absolute inset-8 rounded-full border border-violet-400/10" /><Sparkles size={26} className="text-ember-300/50" /></motion.div></div>}

        <div className="min-w-0">
          <AnimatePresence mode="wait"><motion.div key={index} initial={{ opacity: 0, y: 22, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: .985 }} transition={{ duration: .4, ease: 'easeOut' }}>
            <div className="mb-4 flex items-center gap-3">
              <motion.span key={`${currentLine.speaker}-${index}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[.22em] ${isShadow ? 'border-violet-300/20 bg-violet-500/10 text-violet-200' : 'border-ember-400/20 bg-ember-500/10 text-ember-200'}`}>{currentLine.speaker}</motion.span>
              {isPlaying && <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-ink-500"><span className="flex items-end gap-0.5"><i className="h-2 w-0.5 animate-pulse bg-ember-400" /><i className="h-4 w-0.5 animate-pulse bg-ember-400 [animation-delay:120ms]" /><i className="h-2.5 w-0.5 animate-pulse bg-ember-400 [animation-delay:240ms]" /><i className="h-3 w-0.5 animate-pulse bg-ember-400 [animation-delay:360ms]" /></span> Speaking</span>}
            </div>
            <motion.button onClick={advance} aria-label={isTyping ? 'Show full dialogue' : isLast ? 'Finish scene' : 'Continue dialogue'} whileHover={{ y: -2 }} whileTap={{ scale: .995 }} className="group relative w-full overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/55 p-6 text-left shadow-2xl backdrop-blur-xl transition-all hover:border-white/20 hover:bg-black/65 sm:p-7">
              <motion.div className="absolute left-0 top-0 h-px bg-gradient-to-r from-transparent via-ember-400/70 to-transparent" animate={{ width: isTyping ? ['20%', '70%', '35%'] : '45%' }} transition={{ duration: 2.2, repeat: isTyping ? Infinity : 0, ease: 'easeInOut' }} />
              <div className="absolute right-5 top-5 h-1.5 w-1.5 rounded-full" style={{ background: atmosphere.accent, boxShadow: `0 0 14px ${atmosphere.accent}` }} />
              <p className="min-h-[8rem] text-[15px] leading-8 text-ink-100 sm:text-base sm:leading-8">{displayedText}{isTyping && <span className="ml-1 inline-block h-5 w-1.5 animate-pulse rounded-full bg-ember-400 align-middle shadow-[0_0_10px_rgba(245,158,11,.6)]" />}</p>
              {!isTyping && <div className="mt-5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.25em] text-ink-500 transition-colors group-hover:text-ember-300"><ChevronRight size={13} /> {isLast ? 'Finish Scene' : 'Continue'}</div>}
            </motion.button>
          </motion.div></AnimatePresence>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between text-[9px] font-black uppercase tracking-[.2em] text-ink-500"><span>Scene progression</span><span>{Math.round(progress)}%</span></div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[.06]"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-ember-400 to-ember-300 shadow-[0_0_14px_rgba(245,158,11,.35)]" animate={{ width: `${progress}%` }} transition={{ duration: .4 }} /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => { if (isPlaying) { pauseNarration(); setIsPlaying(false); } else { resumeNarration(); setIsPlaying(true); } }} disabled={!voiceOn} className="btn-ghost btn-sheen px-3 py-1.5 text-xs"><Play size={13} />{isPlaying ? 'Pause' : 'Play'}</button>
          <button onClick={replay} disabled={!voiceOn} className="btn-ghost btn-sheen px-3 py-1.5 text-xs"><RotateCcw size={13} /> Replay</button>
          <button onClick={onComplete} className="btn-ghost btn-sheen px-3 py-1.5 text-xs"><SkipForward size={13} /> Skip</button>
          <button onClick={toggleVoice} className="btn-ghost btn-sheen px-3 py-1.5 text-xs">{voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}{voiceOn ? 'Voice On' : 'Voice Off'}</button>
          {isPlaying && <span className="ml-auto hidden items-center gap-2 self-center text-[9px] font-bold uppercase tracking-[.2em] text-ink-600 sm:flex"><Volume1 size={12} /> Immersive audio</span>}
        </div>
      </div>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/80" />
  </div>;
}
