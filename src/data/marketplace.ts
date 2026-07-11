import type { Rarity } from './collections';
import { AURAS, WEAPONS, TITLES, SHIELDS, FRAMES, BACKGROUNDS } from './collections';
import type { RankId } from './ranks';
import { RANKS } from './ranks';

export type MarketCategory = 'weapons' | 'auras' | 'titles' | 'shields' | 'frames' | 'backgrounds';

export interface MarketItem {
  id: string;
  name: string;
  rarity: Rarity;
  category: MarketCategory;
  price: number;
  xpRequired: number;
  rankRequired: RankId;
  description: string;
}

const RARITY_PRICE: Record<Rarity, number> = {
  common: 200,
  rare: 800,
  epic: 2500,
  legendary: 8000,
  mythic: 25000,
  secret: 75000,
};

const RARITY_XP: Record<Rarity, number> = {
  common: 0,
  rare: 1500,
  epic: 10000,
  legendary: 60000,
  mythic: 320000,
  secret: 1500000,
};

function rankForXp(xp: number): RankId {
  let result: RankId = 'E';
  for (const r of RANKS) {
    if (xp <= r.xpRequired) {
      result = r.id;
      break;
    }
    result = r.id;
  }
  return result;
}

function buildItems<T extends { id: string; name: string; rarity: Rarity }>(
  items: T[],
  category: MarketCategory,
  descriptions: Record<string, string>,
): MarketItem[] {
  return items.map((item) => {
    const xpReq = RARITY_XP[item.rarity];
    return {
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      category,
      price: RARITY_PRICE[item.rarity],
      xpRequired: xpReq,
      rankRequired: rankForXp(xpReq),
      description: descriptions[item.id] ?? `${item.name} — a prized possession.`,
    };
  });
}

const WEAPON_DESC: Record<string, string> = {
  iron_sword: 'A reliable blade forged from basic iron. Every hunter starts somewhere.',
  hunter_dagger: 'Quick and deadly. Favored by those who strike from the shadows.',
  wooden_spear: 'Simple yet effective. A hunter\'s first reach weapon.',
  bronze_axe: 'Heavy and brutal. Crushes through enemy defenses.',
  steel_blade: 'Tempered steel with a razor edge. A step above iron.',
  short_bow: 'Compact and swift. Ideal for close-range encounters.',
  iron_hammer: 'A devastating blunt weapon that shatters armor and bone.',
  combat_knife: 'Military-grade steel. Designed for silent takedowns.',
  travelers_sword: 'A well-worn blade that has seen many journeys.',
  recruit_lance: 'Standard issue for new hunters. Reach keeps you alive.',
  frost_blade: 'Enchanted with eternal frost. Slows enemies with every strike.',
  flame_sword: 'Wreathed in arcane fire. Burns through even the toughest hide.',
  storm_spear: 'Crackles with lightning. Each thrust carries a thunderclap.',
  phantom_dagger: 'Semi-transparent blade that phases through armor.',
  shadow_bow: 'Fires arrows of pure shadow. Silent and invisible in the dark.',
  thunder_axe: 'Each swing releases a bolt of raw electrical fury.',
  crystal_sword: 'Forged from arcane crystals. Refracts light into blinding rays.',
  venom_blade: 'Coated in a potent neurotoxin. One cut is all it takes.',
  moon_katana: 'A crescent-moon blade that gleams under the night sky.',
  hunter_crossbow: 'Engineered for rapid fire. Three bolts per reload.',
  void_blade: 'A slash that tears through the fabric of reality itself.',
  dragon_slayer: 'Forged specifically to pierce dragon scales. Massive and heavy.',
  eclipse_katana: 'A blade that absorbs light, leaving only darkness in its wake.',
  inferno_greatsword: 'A massive two-hander that erupts in flames when drawn.',
  soul_reaper_scythe: 'Harvests the souls of the fallen with each sweep.',
  arcane_staff: 'Channels raw magical energy into devastating spells.',
  titan_hammer: 'A weapon so heavy it creates shockwaves on impact.',
  blood_fang: 'A cursed blade that drinks the blood of its victims.',
  nightmare_spear: 'Inflicts waking nightmares upon those it strikes.',
  tempest_bow: 'Summons a localized storm with each arrow loosed.',
  monarchs_blade: 'The chosen weapon of the Shadow Monarch. Commands respect.',
  abyss_greatsword: 'Forged in the deepest abyss. Whispers drive the weak mad.',
  divine_katana: 'Blessed by celestial beings. Cuts through evil effortlessly.',
  celestial_spear: 'A spear of pure starlight. Never misses its target.',
  eternal_blade: 'A blade that exists outside of time. Never dulls, never breaks.',
  world_breaker_w: 'Each swing cracks the earth. The world trembles before it.',
  cosmic_scythe: 'Harvests not souls, but entire galaxies.',
  kings_greatsword: 'A royal arm passed down through a hundred generations of kings.',
  heaven_splitter: 'A single vertical cut can cleave the sky in two.',
  shadow_edge: 'A blade made of solidified shadow. Exists in two dimensions at once.',
  infinity_blade: 'A weapon with no beginning and no end. It simply IS.',
  void_monarch_sword: 'The sovereign blade of the void. Bends reality to its wielder.',
  ragnarok_axe: 'The axe that will end the world. Each swing brings Ragnarok closer.',
  genesis_blade: 'The first blade ever forged. Contains the spark of creation.',
  chaos_scythe: 'Reaps order itself, leaving only entropy behind.',
  eclipse_destroyer: 'Consumes all light in a radius. Darkness becomes tangible.',
  black_sun_katana: 'A katana forged from a collapsed star. Impossibly dense.',
  oblivion_sword: 'Strikes not the body, but the very memory of the target.',
  dimensional_cleaver: 'Cuts through dimensional barriers. Hits from impossible angles.',
  omega_blade: 'The last blade. The final word in any conflict.',
  crimson_eclipse: 'A blood-red blade that blots out the sun when drawn.',
  soul_devourer: 'Consumes souls to fuel its wielder\'s power. Insatiable.',
  dark_star_blade: 'A blade of collapsed matter. Its gravity crushes enemies.',
  phantom_requiem: 'A spectral blade that plays a deathly melody with each swing.',
  dragon_kings_spear: 'The spear of the Dragon King. Commands all dragonkind.',
  astral_katana: 'Forged from astral light. Cuts through the ethereal plane.',
  abyss_reaver: 'A reaver from the deepest abyss. Nothing escapes its grasp.',
  black_hole_scythe: 'Each swing creates a singularity that devours everything nearby.',
  eternal_judgment: 'The blade of final judgment. Its verdict is always death.',
  last_monarch_blade: 'The blade of the last Monarch. The end of an era.',
};

const AURA_DESC: Record<string, string> = {
  ember: 'A warm flicker of determination. The spark of every great journey.',
  breeze: 'A gentle wind at your back. Light, free, and ever-present.',
  mist: 'Soft and elusive. Hard to grasp, impossible to hold.',
  stone: 'Unmovable resolve. The earth itself acknowledges your will.',
  bronze: 'Forged in effort and sweat. The mark of a true worker.',
  frost: 'Cold, sharp focus. Freezes distractions in their tracks.',
  storm: 'Crackling energy surrounds you. Electric and unpredictable.',
  crimson: 'Burning passion made visible. A red haze of raw emotion.',
  azure: 'Deep and steady as the ocean. Calm power, vast and patient.',
  phantom: 'A ghostly presence that chills the air. You are here, but not.',
  void: 'The pull of nothingness. Reality bends around the edges.',
  eclipse: 'Shadow over light. A total eclipse follows your every step.',
  inferno: 'An unquenchable blaze. Everything burns in your presence.',
  celestial: 'Touched by the heavens. Radiant and divine.',
  titan: 'The strength of giants flows through your veins.',
  shadow_monarch: 'Command of the shadow army. The aura of a true sovereign.',
  solar: 'Radiant as the sun. Light emanates from your very being.',
  dragon: 'The aura of the ancient wyrms. Primordial and terrifying.',
  divine: 'Blessed by the divine. Holy light surrounds you always.',
  eternal: 'Beyond the flow of time. Ageless, timeless, eternal.',
  abyss: 'Stares back from the deep. The void has eyes, and they watch.',
  cosmic: 'Woven from stardust. The universe itself is your essence.',
  chaos: 'Order undone. Entropy radiates from your every pore.',
  infinity: 'Without end. Without beginning. Without limit.',
  ragnarok: 'The end of all things. The air itself trembles with doom.',
  sung: 'The aura of the Solo Leveler. The System acknowledges you.',
  black_flame: 'Fire that consumes shadow itself. Darkness made destructive.',
  blood_moon: 'Rises once an age. A crimson omen of terrible power.',
  necromancer: 'Master of the fallen. The dead answer your call.',
  world_breaker: 'Shatters the very world. Reality cracks in your wake.',
  dimensional: 'Between worlds. You exist in multiple planes simultaneously.',
  eclipse_monarch: 'Ruler of the eclipse. Light and darkness bow to you.',
  genesis: 'The first aura. The original spark of all power.',
  void_king: 'Sovereign of the void. The emptiness obeys your commands.',
  ascended_shadow: 'Shadow transcended. Beyond mere darkness into pure power.',
};

const TITLE_DESC: Record<string, string> = {
  rookie: 'Every legend starts here. The first step on a long road.',
  wanderer: 'A drifter with no destination. The journey is the goal.',
  survivor: 'You\'ve endured what breaks most. Still standing.',
  trainee: 'Learning the ropes. Potential radiates from within.',
  seeker: 'Always searching for the next challenge, the next gate.',
  explorer: 'No gate is too deep, no dungeon too dark.',
  fighter: 'You don\'t back down. Every fight makes you stronger.',
  challenger: 'You seek out the impossible and dare it to defeat you.',
  adventurer: 'A life of danger and glory. The wild is your home.',
  hunter: 'A certified hunter. The System recognizes your skill.',
  elite_hunter: 'Above the common ranks. Your reputation precedes you.',
  night_walker: 'You move through darkness like it was made for you.',
  silent_blade: 'Your enemies never hear you coming. Silence is your weapon.',
  iron_will: 'Unbreakable. Unbendable. Your will is forged steel.',
  beast_slayer: 'Beasts fear your name. You are their nightmare.',
  gate_explorer: 'You\'ve delved deeper than most dare to dream.',
  dungeon_raider: 'Dungeons are your hunting ground. You are the apex predator within.',
  shadow_scout: 'You scout the darkness and report to no one.',
  lone_wolf: 'No pack, no master. You hunt alone, and you always win.',
  storm_chaser: 'You run toward the storm, not away from it.',
  shadow_walker: 'You walk between shadows. The dark is a doorway.',
  abyss_explorer: 'You\'ve gazed into the abyss and it looked away first.',
  dragon_slayer: 'Dragons are not myths to you. They are trophies.',
  void_hunter: 'You hunt in the spaces between reality.',
  elite_commander: 'You lead from the front. Your squad would follow you into the void.',
  demon_hunter: 'Demons know your name and they tremble.',
  soul_reaper: 'You harvest souls. The dead do not rest in your presence.',
  nightmare_bringer: 'You are the thing that goes bump in the night.',
  eclipse_warrior: 'You fight in the shadow of the eclipse. Light and dark are your weapons.',
  arcane_master: 'Mastery of the arcane arts. Magic bends to your will.',
  shadow_monarch: 'The Monarch of Shadows. Sovereign ruler of the shadow army.',
  king_of_hunters: 'The supreme hunter. All others bow before you.',
  the_awakened: 'You have awakened. The System sees you clearly now.',
  world_breaker: 'You break worlds. Not with force, but with will.',
  monarchs_successor: 'The chosen heir of the Monarch. The crown awaits.',
  the_conqueror: 'You conquer all. Nothing stands in your path.',
  the_immortal: 'Death cannot claim you. You are beyond its reach.',
  the_chosen_one: 'The System chose you above all others. The reason is clear.',
  supreme_hunter: 'The pinnacle of the hunter\'s path. There is no higher.',
  god_slayer: 'You have slain gods. Their power flows through you.',
  the_absolute: 'Absolute. Without equal. Without peer. Without limit.',
  the_eternal: 'You exist beyond time. Forever and always.',
  the_unbreakable: 'No force in existence can break you. You are the mountain.',
  beyond_limits: 'You have transcended all limitations. There are no walls left.',
  infinite_one: 'The one who is infinite. Boundless and eternal.',
  the_last_monarch: 'The final sovereign. After you, there are no more kings.',
  the_nameless_king: 'A king so powerful that names are meaningless. You simply are.',
  apex_predator: 'You are at the top of every food chain. Nothing hunts you.',
  the_transcendent: 'You have transcended existence itself. A being beyond.',
  the_one_above: 'Above all. Below none. The apex of all that is.',
  solo_leveler: 'The one who levels alone. The System\'s chosen protagonist.',
  systems_chosen: 'The System itself chose you. Its purpose is your purpose.',
  shadow_king: 'King of all shadows. The darkness is your kingdom.',
  lord_of_darkness: 'All darkness answers to you. You are its lord.',
  void_emperor: 'Emperor of the void. The emptiness is your empire.',
  eclipse_monarch: 'Monarch of the eclipse. You rule the moment light dies.',
  divine_successor: 'The successor to the divine. Heaven awaits your reign.',
  the_forbidden_one: 'The one who was forbidden. The one who exists anyway.',
  legend_never_dies: 'Your legend will never die. It echoes through eternity.',
};

const SHIELD_DESC: Record<string, string> = {
  guardian_shield: 'A sturdy shield for the everyday hunter. Reliable and dependable.',
  shadow_aegis: 'A shield woven from shadow. Absorbs light-based attacks.',
  dragon_shield: 'Scaled with dragon hide. Resistant to fire and claws.',
  titan_bulwark: 'A massive shield that can stop a charging titan.',
  eclipse_guard: 'A shield that darkens as it absorbs damage. The more it takes, the stronger it gets.',
  void_barrier: 'A barrier of pure void energy. Nullifies magical attacks.',
  iron_fortress: 'Not a shield, but a walking fortress. Impenetrable.',
  celestial_shield: 'A shield blessed by the heavens. Radiates protective light.',
  monarchs_shield: 'The shield of the Shadow Monarch. Commands its own defense.',
  eternal_aegis: 'A shield that has existed forever. It cannot be destroyed.',
};

const FRAME_DESC: Record<string, string> = {
  shadow_frame: 'A frame of living shadow. Tendrils reach outward, seeking.',
  golden_frame: 'An ornate golden frame with a regal crown. Pure luxury.',
  crimson_frame: 'A frame of blood-red spikes. Aggressive and intimidating.',
  frost_frame: 'A frame of eternal ice crystals. Cold to the touch.',
  eclipse_frame: 'A frame depicting a total eclipse. Stars surround the void.',
  dragon_frame: 'A frame crowned with dragon horns. Scaled and ancient.',
  void_frame: 'A frame of cosmic energy. Stars swirl within its depths.',
  celestial_frame: 'A frame of radiating light. Twelve rays of pure energy.',
  monarch_frame: 'A royal frame with a golden crown and embedded jewels.',
  infinity_frame: 'A frame of galactic proportions. Stars orbit its edge.',
};

const BG_DESC: Record<string, string> = {
  shadow_realm: 'A realm of perpetual shadow. Pillars of darkness rise into an endless void.',
  crimson_eclipse_bg: 'A blood-red eclipse over jagged mountains. The sky bleeds.',
  frozen_kingdom: 'An aurora dances over ice peaks and frozen waterfalls.',
  celestial_sky: 'A sea of stars and light rays through cosmic clouds.',
  dragons_lair: 'A dragon\'s cave lit by glowing embers. An eye watches from the dark.',
  abyss_gate: 'A gate to the abyss, flanked by ancient pillars.',
  mystic_forest: 'A misty forest with fireflies dancing between ancient trees.',
  neon_city: 'A neon-lit cityscape. Windows glow in the urban night.',
  galaxy_horizon: 'A spiral galaxy on the horizon. Nebula clouds drift slowly.',
  throne_of_monarch: 'An empty throne beneath a crown. Steps lead to the seat of power.',
};

export const MARKET_ITEMS: MarketItem[] = [
  ...buildItems(WEAPONS, 'weapons', WEAPON_DESC),
  ...buildItems(AURAS, 'auras', AURA_DESC),
  ...buildItems(TITLES, 'titles', TITLE_DESC),
  ...buildItems(SHIELDS, 'shields', SHIELD_DESC),
  ...buildItems(FRAMES, 'frames', FRAME_DESC),
  ...buildItems(BACKGROUNDS, 'backgrounds', BG_DESC),
];

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  weapons: 'Weapons',
  auras: 'Auras',
  titles: 'Titles',
  shields: 'Shields',
  frames: 'Frames',
  backgrounds: 'Backgrounds',
};

export function getMarketItemById(id: string, category: MarketCategory): MarketItem | undefined {
  return MARKET_ITEMS.find((m) => m.id === id && m.category === category);
}
