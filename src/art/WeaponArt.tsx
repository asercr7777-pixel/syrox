import type { Rarity } from '../data/collections';

interface ArtProps { id: string; name: string; rarity: Rarity; size?: number; }

const PAL: Record<Rarity,{metal:string;dark:string;accent:string;glow:string}> = {
  common:{metal:'#d1d5db',dark:'#4b5563',accent:'#9ca3af',glow:'rgba(156,163,175,.28)'},
  rare:{metal:'#bfdbfe',dark:'#1e3a8a',accent:'#60a5fa',glow:'rgba(59,130,246,.5)'},
  epic:{metal:'#e9d5ff',dark:'#581c87',accent:'#c084fc',glow:'rgba(168,85,247,.58)'},
  legendary:{metal:'#fef3c7',dark:'#78350f',accent:'#fbbf24',glow:'rgba(245,158,11,.7)'},
  mythic:{metal:'#fce7f3',dark:'#831843',accent:'#f472b6',glow:'rgba(236,72,153,.75)'},
  secret:{metal:'#fef9c3',dark:'#713f12',accent:'#fde047',glow:'rgba(251,191,36,.9)'}
};

function kind(n:string){const x=n.toLowerCase(); if(x.includes('greatsword')||x.includes('cleaver'))return'great'; if(x.includes('katana'))return'katana'; if(x.includes('dagger')||x.includes('knife'))return'dagger'; if(x.includes('axe'))return'axe'; if(x.includes('hammer'))return'hammer'; if(x.includes('spear')||x.includes('lance'))return'spear'; if(x.includes('bow'))return'bow'; if(x.includes('scythe'))return'scythe'; if(x.includes('staff'))return'staff'; return'sword';}

export function WeaponArt({id,name,rarity,size=120}:ArtProps){
 const p=PAL[rarity], k=kind(name), u=`nw-${id.replace(/[^a-z0-9]/gi,'')}`, high=['legendary','mythic','secret'].includes(rarity);
 return <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
  <defs><linearGradient id={`${u}m`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={p.metal}/><stop offset=".48" stopColor="#fff" stopOpacity=".72"/><stop offset="1" stopColor={p.dark}/></linearGradient><radialGradient id={`${u}g`}><stop stopColor={p.accent} stopOpacity=".55"/><stop offset="1" stopColor={p.accent} stopOpacity="0"/></radialGradient><filter id={`${u}b`}><feGaussianBlur stdDeviation="3"/></filter></defs>
  <circle cx="60" cy="60" r="52" fill={`url(#${u}g)`}/>
  {high&&<circle cx="60" cy="60" r="43" fill="none" stroke={p.accent} strokeOpacity=".22" strokeDasharray="2 5"/>}
  <g transform="translate(60 60) rotate(-8)">{k==='sword'&&<Sword p={p} u={u}/>} {k==='great'&&<Great p={p} u={u}/>} {k==='katana'&&<Katana p={p} u={u}/>} {k==='dagger'&&<Dagger p={p} u={u}/>} {k==='axe'&&<Axe p={p} u={u}/>} {k==='hammer'&&<Hammer p={p} u={u}/>} {k==='spear'&&<Spear p={p} u={u}/>} {k==='bow'&&<Bow p={p} u={u}/>} {k==='scythe'&&<Scythe p={p} u={u}/>} {k==='staff'&&<Staff p={p} u={u}/>}</g>
  {high&&[0,1,2,3,4,5].map(i=><circle key={i} cx={60+Math.cos(i*Math.PI/3)*43} cy={60+Math.sin(i*Math.PI/3)*43} r="1.2" fill={p.accent} opacity=".8"/>)}
 </svg>;
}
const base=(p:any,u:string)=><><rect x="-2.5" y="7" width="5" height="25" rx="1.5" fill={p.dark}/><path d="M-3 10h6M-3 16h6M-3 22h6M-3 28h6" stroke={p.accent} strokeWidth=".6" opacity=".65"/><circle cy="35" r="4" fill={`url(#${u}m)`} stroke={p.dark} strokeWidth=".8"/><circle cy="35" r="1.5" fill={p.accent}/></>;
function Sword({p,u}:{p:any,u:string}){return <><path d="M0-50L-7 3H7Z" fill={`url(#${u}m)`} stroke={p.dark}/><path d="M0-47V1" stroke="#fff" strokeOpacity=".55"/><path d="M-18 5Q0 0 18 5" fill="none" stroke={p.accent} strokeWidth="4" strokeLinecap="round"/>{base(p,u)}</>}
function Great({p,u}:{p:any,u:string}){return <><path d="M-8-52L-11 7H11L8-52Z" fill={`url(#${u}m)`} stroke={p.dark}/><path d="M0-49V5" stroke="#fff" strokeOpacity=".45"/><path d="M-25 8H25" stroke={p.accent} strokeWidth="5" strokeLinecap="round"/>{base(p,u)}</>}
function Katana({p,u}:{p:any,u:string}){return <><path d="M-2-52Q12-25 5 5L-1 8Q4-25-4-50Z" fill={`url(#${u}m)`} stroke={p.dark}/><ellipse cy="7" rx="8" ry="3" fill={p.accent} stroke={p.dark}/>{base(p,u)}</>}
function Dagger({p,u}:{p:any,u:string}){return <><path d="M0-48L-9 7H9Z" fill={`url(#${u}m)`} stroke={p.dark}/><path d="M-15 8H15" stroke={p.accent} strokeWidth="4" strokeLinecap="round"/>{base(p,u)}</>}
function Axe({p,u}:{p:any,u:string}){return <><rect x="-2" y="-38" width="4" height="72" rx="2" fill={p.dark}/><path d="M0-35Q-28-28-27 2Q-18 13 0 4Z" fill={`url(#${u}m)`} stroke={p.dark}/><path d="M-20-18Q-8-22 0-18" stroke={p.accent} fill="none" strokeWidth="2"/><circle cy="35" r="4" fill={p.accent}/></>}
function Hammer({p,u}:{p:any,u:string}){return <><rect x="-2.5" y="-28" width="5" height="64" rx="2" fill={p.dark}/><rect x="-25" y="-38" width="50" height="20" rx="4" fill={`url(#${u}m)`} stroke={p.dark}/><path d="M-18-34H18" stroke="#fff" strokeOpacity=".45"/>{base(p,u)}</>}
function Spear({p,u}:{p:any,u:string}){return <><rect x="-1.5" y="-30" width="3" height="66" fill={p.dark}/><path d="M0-52L-10-27L0-34L10-27Z" fill={`url(#${u}m)`} stroke={p.dark}/><path d="M0-46V-31" stroke="#fff" strokeOpacity=".5"/>{base(p,u)}</>}
function Bow({p}:{p:any;u:string}){return <><path d="M-22-40Q-42 0-22 40" fill="none" stroke={p.accent} strokeWidth="4"/><path d="M-22-40L22 40M-22 40L22-40" stroke={p.dark} strokeWidth="2"/><path d="M-22 0H27" stroke={`url(#${'x'}m)`} strokeWidth="2" opacity="0"/></>}
function Scythe({p}:{p:any;u:string}){return <><path d="M-2-35H2V38H-2Z" fill={p.dark}/><path d="M0-34Q-38-38-32-3Q-27-20 0-18" fill={`url(#${'x'}m)`} stroke={p.dark}/><circle cy="37" r="4" fill={p.accent}/></>}
function Staff({p,u}:{p:any;u:string}){return <><rect x="-2" y="-25" width="4" height="62" rx="2" fill={p.dark}/><circle cy="-32" r="10" fill={`url(#${u}m)`} stroke={p.dark}/><circle cy="-32" r="4" fill={p.accent}/><circle cy="-32" r="16" fill="none" stroke={p.accent} strokeOpacity=".45" strokeDasharray="2 3"/></>}
