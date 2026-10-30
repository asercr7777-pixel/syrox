import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Map, Swords, Volume2, VolumeX, Zap } from 'lucide-react';
import { isMusicEnabled, playMusic, setMusicEnabled, stopMusic } from '../lib/audioEngine';
import { useStore } from '../store/useStore';
import { getRankByXp } from '../data/ranks';
import StoryModeSimpleV2 from '../views/StoryModeSimpleV2';
import { ShadowArmyExpansion } from './ShadowArmyExpansion';
import '../stryven-story-experience.css';

type StoryTab = 'world' | 'legion';

export function StoryExperience() {
  const { state } = useStore();
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<StoryTab>('world');
  const [cinematicSound, setCinematicSound] = useState(isMusicEnabled());
  const toggleCinematicSound = () => {
    const next = !cinematicSound;
    setCinematicSound(next);
    setMusicEnabled(next);
    if (next) playMusic('mystery');
    else stopMusic();
  };
  const enterWorld = () => {
    if (cinematicSound) playMusic('mystery');
    setEntered(true);
  };
  const exitWorld = () => {
    stopMusic();
    setEntered(false);
  };
  const rank = getRankByXp(state.xp);
  const chapter = Math.min(30, state.storyChapter + 1);

  return <main className="sv-story-game" aria-label="STRYVEN Story Mode">
    <AnimatePresence mode="wait">
      {!entered ? (
        <motion.section key="awakening" className="sv-story-awakening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.035 }} transition={{ duration: .75 }}>
          <div className="sv-story-awakening__image" />
          <div className="sv-story-awakening__veil" />
          <motion.div className="sv-story-awakening__sigil" initial={{ scale: .55, rotate: -35, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}><span /><i /><b /></motion.div>
          <motion.div className="sv-story-awakening__content" initial={{ y: 35, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .35, duration: .8 }}>
            <div className="sv-story-overline"><span /> STRYVEN SYSTEM <span /> STORY ARCHIVE</div>
            <p className="sv-story-awakening__pretitle">THE WORLD IS WAITING</p>
            <h1>THE <em>AWAKENING</em></h1>
            <p className="sv-story-awakening__quote">“A different life does not begin with a different world. It begins with the choice to rise.”</p>
            <div className="sv-story-awakening__identity"><div><small>HUNTER RANK</small><b>{rank.name.toUpperCase()}</b></div><div><small>LEVEL</small><b>{state.level}</b></div><div><small>CHAPTER</small><b>{String(chapter).padStart(2, '0')} / 30</b></div></div>
            <motion.button type="button" className="sv-story-enter" onClick={enterWorld} whileHover={{ scale: 1.025 }} whileTap={{ scale: .975 }}><span>ENTER THE WORLD</span><i><Swords size={17} /></i></motion.button>
            <div className="sv-story-awakening__hint">YOUR REAL PROGRESS SHAPES THIS WORLD</div>
          </motion.div>
          <div className="sv-story-awakening__footer"><span>STRYVEN // NARRATIVE ENGINE</span><span>01 — 30 // THE SHATTERED REALM</span></div>
          <button type="button" className="sv-story-sound" onClick={toggleCinematicSound} aria-label={cinematicSound ? 'Mute cinematic sound' : 'Enable cinematic sound'}>{cinematicSound ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>{cinematicSound ? 'SOUND ON' : 'SOUND OFF'}</span></button>
        </motion.section>
      ) : (
        <motion.section key="world" className="sv-story-world" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
          <header className="sv-story-hud">
            <div className="sv-story-hud__brand"><span className="sv-story-hud__rune">S</span><div><b>STRYVEN</b><small>THE SHATTERED REALM</small></div></div>
            <div className="sv-story-hud__stats"><span><Crown size={14} /> {rank.name.toUpperCase()}</span><span><Zap size={14} /> LVL {state.level}</span><span>CH {String(chapter).padStart(2, '0')} / 30</span></div>
            <button type="button" className="sv-story-return" onClick={exitWorld}>EXIT WORLD</button>
          </header>
          <nav className="sv-story-tabs" aria-label="Story world sections">
            <button type="button" className={tab === 'world' ? 'is-active' : ''} onClick={() => setTab('world')}><Map size={16} /> WORLD MAP <span>01</span></button>
            <button type="button" className={tab === 'legion' ? 'is-active' : ''} onClick={() => setTab('legion')}><Swords size={16} /> SHADOW LEGION <span>02</span></button>
          </nav>
          <div className="sv-story-world__content" key={tab}>
            {tab === 'world' ? <StoryModeSimpleV2 /> : <ShadowArmyExpansion />}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  </main>;
}

export default StoryExperience;
