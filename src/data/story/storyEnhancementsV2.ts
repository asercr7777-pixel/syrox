import type { StoryChapter, StoryMission } from './types';

const ARC_NAMES=['THE AWAKENING','THE SIGNAL','THE CONSEQUENCE','THE MEMORY','THE SEALS','THE CONTROL'] as const;
const THEMES=['awakening','signal','consequence','memory','seals','control','judgment','debt','obedience','truth','reflection','identity','memory','resistance','truth','war','alliances','hope','threshold','choice','machine','patterns','submission','origin','identity','history','freedom','independence','consequence','choice'] as const;
const BEATS=[['SCOUT','Find the first crack in the lie.'],['SIGNAL','Turn a small action into proof that you are still in control.'],['VOW','Keep the promise when the easier option is available.'],['TRIAL','Strengthen yourself before the next confrontation.'],['REVEAL','Recover one piece of the hidden record.'],['DECISION','Choose what you will protect when the path becomes unclear.']] as const;
const BOSS_PHASES=[['READ THE PATTERN','The guardian studies the habits that brought you here.'],['BREAK THE PATTERN','The arena changes when you stop reacting automatically.'],['MAKE THE CHOICE','Victory is not enough. Decide what this battle changes.']] as const;
const arc=(n:number)=>ARC_NAMES[Math.min(5,Math.floor((n-1)/5))];
const theme=(n:number)=>THEMES[n-1]??'choice';

export function directStory(chapters:StoryChapter[]):StoryChapter[]{
 return chapters.map(ch=>{
  const t=theme(ch.number);
  const missions=ch.missions.map((m,index)=>{
   const [beat,instruction]=BEATS[index]??BEATS[5];
   // The live task system exposes Quran reading, not a generic `read` task.
   // Normalize legacy Story missions so this objective can actually be completed.
   const missionType: StoryMission['type'] = m.type === 'read_book' ? 'read_quran' : m.type;
   const choices=m.choices?.map(c=>({...c,consequence:`${c.consequence} This decision is recorded under the ${t} arc.`}));
   const out:StoryMission={...m,type:missionType,title:`${beat} · ${m.title}`,description:`${instruction} ${m.description}`,choices,
    cutsceneBefore:[...m.cutsceneBefore,{speaker:'Shadow',voice:'mentor',text:`${arc(ch.number)}. The lesson here is ${t}. Act deliberately.`,emotion:'mysterious'}],
    cutsceneAfter:[...m.cutsceneAfter,{speaker:'Narrator',voice:'narrator',text:`The System records your action as a ${t} decision.`,emotion:'neutral'}]};
   return out;
  });
  return {...ch,subtitle:`${arc(ch.number)} · ${ch.subtitle}`,description:`${ch.description} Every chapter now follows investigate → act → confront → choose.`,missions,
   boss:{...ch.boss,title:`${ch.boss.title} · ${t.toUpperCase()}`,dialogue:[...ch.boss.dialogue,...BOSS_PHASES.map(([name,line],i)=>({speaker:'Boss',voice:'boss' as const,text:`${name}. ${line} ${i===2?`This chapter is about ${t}.`:'I know your next reaction.'}`,emotion:i===2?'angry' as const:'serious' as const}))],
    defeatDialogue:[...ch.boss.defeatDialogue,{speaker:'Shadow',voice:'mentor',text:`${ch.boss.name} is down. The enemy was a pattern, not just a creature. ${t} is still your choice.`,emotion:'mysterious'},{speaker:'Narrator',voice:'narrator',text:`CHAPTER ${String(ch.number).padStart(2,'0')} COMPLETE. The record has changed.`,emotion:'neutral'}]}};
 });
}
