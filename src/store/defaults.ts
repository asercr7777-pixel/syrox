import type { AppState } from './types';
import { CORE_TASKS, DEFAULT_EXERCISES } from '../data/tasks';
import { RANKS } from '../data/ranks';

export const STORAGE_KEY = 'stryven-system-v2';
export function todayStr(){return new Date().toISOString().slice(0,10)}
export function nowWeekKey(){const d=new Date();const y=d.getFullYear();const s=new Date(y,0,1);const w=Math.ceil(((d.getTime()-s.getTime())/86400000+s.getDay()+1)/7);return `${y}-W${w}`}
export function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4)}
export function xpForLevel(level:number){return Math.floor(100*Math.pow(level,1.45))}
export function levelFromXp(xp:number){let level=1,acc=0;while(xp>=acc+xpForLevel(level)){acc+=xpForLevel(level);level++}return level}
export function levelProgress(xp:number){const level=levelFromXp(xp);let acc=0;for(let l=1;l<level;l++)acc+=xpForLevel(l);const into=xp-acc,needed=xpForLevel(level);return {current:into,needed,pct:Math.min(100,into/needed*100),level}}
const makeDay=(name:string, exercises:any[])=>({name,stretching:[],exercises:exercises.map(e=>({id:uid(),...e,completed:false})),plyometric:[],enabled:true});
export function createDefaultState():AppState{
 const mainTasks=CORE_TASKS.map((t,i)=>({id:t.id,label:t.label,emoji:t.emoji,points:t.points,description:'',category:t.category,enabled:true,order:i}));
 const coreCompleted:Record<string,boolean>={}; mainTasks.forEach(t=>coreCompleted[t.id]=false);
 const legacy:any=DEFAULT_EXERCISES;
 const workouts:any={day1:makeDay('Day 1',legacy.push||[]),day2:makeDay('Day 2',legacy.pull||[]),day3:makeDay('Day 3',legacy.leg||[]),day4:makeDay('Day 4',[]),day5:makeDay('Day 5',[]),day6:makeDay('Day 6',[])};
 return {username:'Hunter',avatar:'🐺',avatarColor:'#7c3aed',bannerColor:'#1e1b4b',nameColor:'#fbbf24',theme:'shadow',xp:0,level:1,coins:0,totalPoints:0,streak:0,bestStreak:0,lastActiveDate:null,streakShield:0,coreCompleted,customCompleted:{},dailyXp:0,dailyPoints:0,dailyCap:1000,lastDailyResetDate:todayStr(),customTasks:[],mainTasks,workouts,workoutsCompletedToday:0,workoutRewardsClaimedToday:{day1:false,day2:false,day3:false,day4:false,day5:false,day6:false},lastWorkoutDate:null,workoutSessions:[],totalWorkoutSeconds:0,schedule:[],dungeonClearedToday:false,lastDungeonDate:null,dungeonsCleared:0,secretDungeonAvailable:false,secretDungeonId:null,secretDungeonExpiresAt:null,lastLoginClaimDate:null,loginStreak:0,lastSpinDate:null,lastSpinRewardId:null,dailyChallengeIds:[],dailyChallengeCompleted:{},dailyChallengeDate:null,weeklyMissionIds:[],weeklyMissionCompleted:{},weeklyMissionWeek:null,inventory:[{id:'ember',type:'aura',obtainedAt:Date.now(),favorite:false}],equipped:{aura:'ember',weapon:null,title:null,shield:null,frame:null,background:null},backgroundType:'default',customBackground:null,backgroundVideo:null,backgroundBlur:0,backgroundDarken:40,backgroundBrightness:100,selectedBackgroundId:null,achievements:[],history:[],notes:{},chat:[{id:uid(),role:'ai',text:'Welcome to STRYVEN. I am your AI Coach. Forge your discipline one day at a time.',at:Date.now()}],friends:[],soundEnabled:true,notifications:{workout:true,water:true,sleep:true,reading:true,prayer:true,tasks:true},seasonXp:0,seasonId:'season-1',doubleXpUntil:null,easterEggsFound:[],createdAt:Date.now(),storyChapter:0,storyMission:0,storyChoices:{},storyCompletedMissions:{},storyBossDefeated:{},storyNpcReputation:{},storyLoreUnlocked:[],storyAchievements:[],activeBossId:null,bossHpRemaining:{},bossDefeated:{},chestInventory:{common_chest:1},petId:null,petLevel:1,petXp:0,battlePassTier:1,battlePassXp:0,battlePassPremium:false,battlePassClaimedFree:[],battlePassClaimedPremium:[],lastFortuneDate:null,lastFortuneLuck:3,lastFortuneQuote:'',milestoneClaimed:[],prestigeLevel:0,prestigeMultiplier:1,dailyShopSeed:null,dailyShopDate:null,secretShopAvailable:false,secretShopExpiresAt:null,searchHistory:[],rankRewardsClaimed:[]};
}
export function getStarterRank(){return RANKS[0]}
