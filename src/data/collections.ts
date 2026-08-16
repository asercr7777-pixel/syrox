export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'secret';

export const RARITY_META: Record<Rarity, { label: string; color: string; glow: string; weight: number }> = {
  common: { label: 'Common', color: '#9ca3af', glow: 'rgba(156,163,175,0.4)', weight: 50 },
  rare: { label: 'Rare', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)', weight: 30 },
  epic: { label: 'Epic', color: '#a855f7', glow: 'rgba(168,85,247,0.6)', weight: 15 },
  legendary: { label: 'Legendary', color: '#f59e0b', glow: 'rgba(245,158,11,0.7)', weight: 4.5 },
  mythic: { label: 'Mythic', color: '#ec4899', glow: 'rgba(236,72,153,0.75)', weight: 0.4 },
  secret: { label: 'Secret', color: '#fbbf24', glow: 'rgba(251,191,36,0.9)', weight: 0.1 },
};

export interface Aura {
  id: string;
  name: string;
  rarity: Rarity;
  color: string;
  /** 0-100 visual intensity */
  intensity: number;
  description: string;
}

export const AURAS: Aura[] = [
  // Common
  { id: 'ember', name: 'Ember Aura', rarity: 'common', color: '#ff7a18', intensity: 30, description: 'A warm flicker of determination.' },
  { id: 'breeze', name: 'Breeze Aura', rarity: 'common', color: '#7dd3fc', intensity: 30, description: 'A gentle wind at your back.' },
  { id: 'mist', name: 'Mist Aura', rarity: 'common', color: '#cbd5e1', intensity: 30, description: 'Soft and elusive.' },
  { id: 'stone', name: 'Stone Aura', rarity: 'common', color: '#a8a29e', intensity: 35, description: 'Unmovable resolve.' },
  { id: 'bronze', name: 'Bronze Aura', rarity: 'common', color: '#b45309', intensity: 35, description: 'Forged in effort.' },
  // Rare
  { id: 'frost', name: 'Frost Aura', rarity: 'rare', color: '#38bdf8', intensity: 50, description: 'Cold, sharp focus.' },
  { id: 'storm', name: 'Storm Aura', rarity: 'rare', color: '#6366f1', intensity: 55, description: 'Crackling energy.' },
  { id: 'crimson', name: 'Crimson Aura', rarity: 'rare', color: '#ef4444', intensity: 55, description: 'Burning passion.' },
  { id: 'azure', name: 'Azure Aura', rarity: 'rare', color: '#3b82f6', intensity: 55, description: 'Deep and steady.' },
  { id: 'phantom', name: 'Phantom Aura', rarity: 'rare', color: '#8b5cf6', intensity: 60, description: 'A ghostly presence.' },
  // Epic
  { id: 'void', name: 'Void Aura', rarity: 'epic', color: '#1e1b4b', intensity: 70, description: 'The pull of nothingness.' },
  { id: 'eclipse', name: 'Eclipse Aura', rarity: 'epic', color: '#4c1d95', intensity: 70, description: 'Shadow over light.' },
  { id: 'inferno', name: 'Inferno Aura', rarity: 'epic', color: '#dc2626', intensity: 75, description: 'An unquenchable blaze.' },
  { id: 'celestial', name: 'Celestial Aura', rarity: 'epic', color: '#fbbf24', intensity: 75, description: 'Touched by the heavens.' },
  { id: 'titan', name: 'Titan Aura', rarity: 'epic', color: '#0ea5e9', intensity: 75, description: 'The strength of giants.' },
  // Legendary
  { id: 'shadow_monarch', name: 'Shadow Monarch Aura', rarity: 'legendary', color: '#7c3aed', intensity: 90, description: 'Command of the shadow army.' },
  { id: 'solar', name: 'Solar Aura', rarity: 'legendary', color: '#f59e0b', intensity: 90, description: 'Radiant as the sun.' },
  { id: 'dragon', name: 'Dragon Aura', rarity: 'legendary', color: '#16a34a', intensity: 90, description: 'The aura of the ancient wyrms.' },
  { id: 'divine', name: 'Divine Aura', rarity: 'legendary', color: '#fde68a', intensity: 90, description: 'Blessed by the divine.' },
  { id: 'eternal', name: 'Eternal Aura', rarity: 'legendary', color: '#a78bfa', intensity: 90, description: 'Beyond the flow of time.' },
  // Mythic
  { id: 'abyss', name: 'Abyss Aura', rarity: 'mythic', color: '#0f172a', intensity: 95, description: 'Stares back from the deep.' },
  { id: 'cosmic', name: 'Cosmic Aura', rarity: 'mythic', color: '#6366f1', intensity: 95, description: 'Woven from stardust.' },
  { id: 'chaos', name: 'Chaos Aura', rarity: 'mythic', color: '#be123c', intensity: 95, description: 'Order undone.' },
  { id: 'infinity', name: 'Infinity Aura', rarity: 'mythic', color: '#0891b2', intensity: 95, description: 'Without end.' },
  { id: 'ragnarok', name: 'Ragnarok Aura', rarity: 'mythic', color: '#b91c1c', intensity: 95, description: 'The end of all things.' },
  // Secret / Limited
  { id: 'sung', name: 'Sung Aura', rarity: 'secret', color: '#facc15', intensity: 100, description: 'The aura of the Solo Leveler.' },
  { id: 'black_flame', name: 'Black Flame Aura', rarity: 'secret', color: '#18181b', intensity: 100, description: 'Fire that consumes shadow itself.' },
  { id: 'blood_moon', name: 'Blood Moon Aura', rarity: 'secret', color: '#dc2626', intensity: 100, description: 'Rises once an age.' },
  { id: 'necromancer', name: 'Necromancer Aura', rarity: 'secret', color: '#4c1d95', intensity: 100, description: 'Master of the fallen.' },
  { id: 'world_breaker', name: 'World Breaker Aura', rarity: 'secret', color: '#f59e0b', intensity: 100, description: 'Shatters the very world.' },
  { id: 'dimensional', name: 'Dimensional Aura', rarity: 'secret', color: '#06b6d4', intensity: 100, description: 'Between worlds.' },
  { id: 'eclipse_monarch', name: 'Eclipse Monarch Aura', rarity: 'secret', color: '#7c3aed', intensity: 100, description: 'Ruler of the eclipse.' },
  { id: 'genesis', name: 'Genesis Aura', rarity: 'secret', color: '#fde68a', intensity: 100, description: 'The first aura.' },
  { id: 'void_king', name: 'Void King Aura', rarity: 'secret', color: '#1e1b4b', intensity: 100, description: 'Sovereign of the void.' },
  { id: 'ascended_shadow', name: 'Ascended Shadow Aura', rarity: 'secret', color: '#a78bfa', intensity: 100, description: 'Shadow transcended.' },
];

export interface Title {
  id: string;
  name: string;
  rarity: Rarity;
}

export const TITLES: Title[] = [
  // Common
  { id: 'rookie', name: 'Rookie', rarity: 'common' },
  { id: 'wanderer', name: 'Wanderer', rarity: 'common' },
  { id: 'survivor', name: 'Survivor', rarity: 'common' },
  { id: 'trainee', name: 'Trainee', rarity: 'common' },
  { id: 'seeker', name: 'Seeker', rarity: 'common' },
  { id: 'explorer', name: 'Explorer', rarity: 'common' },
  { id: 'fighter', name: 'Fighter', rarity: 'common' },
  { id: 'challenger', name: 'Challenger', rarity: 'common' },
  { id: 'adventurer', name: 'Adventurer', rarity: 'common' },
  { id: 'hunter', name: 'Hunter', rarity: 'common' },
  // Rare
  { id: 'elite_hunter', name: 'Elite Hunter', rarity: 'rare' },
  { id: 'night_walker', name: 'Night Walker', rarity: 'rare' },
  { id: 'silent_blade', name: 'Silent Blade', rarity: 'rare' },
  { id: 'iron_will', name: 'Iron Will', rarity: 'rare' },
  { id: 'beast_slayer', name: 'Beast Slayer', rarity: 'rare' },
  { id: 'gate_explorer', name: 'Gate Explorer', rarity: 'rare' },
  { id: 'dungeon_raider', name: 'Dungeon Raider', rarity: 'rare' },
  { id: 'shadow_scout', name: 'Shadow Scout', rarity: 'rare' },
  { id: 'lone_wolf', name: 'Lone Wolf', rarity: 'rare' },
  { id: 'storm_chaser', name: 'Storm Chaser', rarity: 'rare' },
  // Epic
  { id: 'shadow_walker', name: 'Shadow Walker', rarity: 'epic' },
  { id: 'abyss_explorer', name: 'Abyss Explorer', rarity: 'epic' },
  { id: 'dragon_slayer', name: 'Dragon Slayer', rarity: 'epic' },
  { id: 'void_hunter', name: 'Void Hunter', rarity: 'epic' },
  { id: 'elite_commander', name: 'Elite Commander', rarity: 'epic' },
  { id: 'demon_hunter', name: 'Demon Hunter', rarity: 'epic' },
  { id: 'soul_reaper', name: 'Soul Reaper', rarity: 'epic' },
  { id: 'nightmare_bringer', name: 'Nightmare Bringer', rarity: 'epic' },
  { id: 'eclipse_warrior', name: 'Eclipse Warrior', rarity: 'epic' },
  { id: 'arcane_master', name: 'Arcane Master', rarity: 'epic' },
  // Legendary
  { id: 'shadow_monarch', name: 'Shadow Monarch', rarity: 'legendary' },
  { id: 'king_of_hunters', name: 'King of Hunters', rarity: 'legendary' },
  { id: 'the_awakened', name: 'The Awakened', rarity: 'legendary' },
  { id: 'world_breaker', name: 'World Breaker', rarity: 'legendary' },
  { id: 'monarchs_successor', name: "Monarch's Successor", rarity: 'legendary' },
  { id: 'the_conqueror', name: 'The Conqueror', rarity: 'legendary' },
  { id: 'the_immortal', name: 'The Immortal', rarity: 'legendary' },
  { id: 'the_chosen_one', name: 'The Chosen One', rarity: 'legendary' },
  { id: 'supreme_hunter', name: 'Supreme Hunter', rarity: 'legendary' },
  { id: 'god_slayer', name: 'God Slayer', rarity: 'legendary' },
  // Mythic
  { id: 'the_absolute', name: 'The Absolute', rarity: 'mythic' },
  { id: 'the_eternal', name: 'The Eternal', rarity: 'mythic' },
  { id: 'the_unbreakable', name: 'The Unbreakable', rarity: 'mythic' },
  { id: 'beyond_limits', name: 'Beyond Limits', rarity: 'mythic' },
  { id: 'infinite_one', name: 'Infinite One', rarity: 'mythic' },
  { id: 'the_last_monarch', name: 'The Last Monarch', rarity: 'mythic' },
  { id: 'the_nameless_king', name: 'The Nameless King', rarity: 'mythic' },
  { id: 'apex_predator', name: 'Apex Predator', rarity: 'mythic' },
  { id: 'the_transcendent', name: 'The Transcendent', rarity: 'mythic' },
  { id: 'the_one_above', name: 'The One Above', rarity: 'mythic' },
  // Secret
  { id: 'solo_leveler', name: 'Solo Leveler', rarity: 'secret' },
  { id: 'systems_chosen', name: "System's Chosen", rarity: 'secret' },
  { id: 'shadow_king', name: 'Shadow King', rarity: 'secret' },
  { id: 'lord_of_darkness', name: 'Lord of Darkness', rarity: 'secret' },
  { id: 'void_emperor', name: 'Void Emperor', rarity: 'secret' },
  { id: 'eclipse_monarch', name: 'Eclipse Monarch', rarity: 'secret' },
  { id: 'divine_successor', name: 'Divine Successor', rarity: 'secret' },
  { id: 'the_forbidden_one', name: 'The Forbidden One', rarity: 'secret' },
  { id: 'legend_never_dies', name: 'Legend Never Dies', rarity: 'secret' },
];

export interface Weapon {
  id: string;
  name: string;
  rarity: Rarity;
  /** Optional minor XP boost percentage when equipped. */
  boost?: number;
}

export const WEAPONS: Weapon[] = [
  // Common
  { id: 'iron_sword', name: 'Iron Sword', rarity: 'common', boost: 1 },
  { id: 'hunter_dagger', name: 'Hunter Dagger', rarity: 'common', boost: 1 },
  { id: 'wooden_spear', name: 'Wooden Spear', rarity: 'common', boost: 1 },
  { id: 'bronze_axe', name: 'Bronze Axe', rarity: 'common', boost: 1 },
  { id: 'steel_blade', name: 'Steel Blade', rarity: 'common', boost: 2 },
  { id: 'short_bow', name: 'Short Bow', rarity: 'common', boost: 1 },
  { id: 'iron_hammer', name: 'Iron Hammer', rarity: 'common', boost: 2 },
  { id: 'combat_knife', name: 'Combat Knife', rarity: 'common', boost: 1 },
  { id: 'travelers_sword', name: "Traveler's Sword", rarity: 'common', boost: 1 },
  { id: 'recruit_lance', name: 'Recruit Lance', rarity: 'common', boost: 1 },
  // Rare
  { id: 'frost_blade', name: 'Frost Blade', rarity: 'rare', boost: 3 },
  { id: 'flame_sword', name: 'Flame Sword', rarity: 'rare', boost: 3 },
  { id: 'storm_spear', name: 'Storm Spear', rarity: 'rare', boost: 3 },
  { id: 'phantom_dagger', name: 'Phantom Dagger', rarity: 'rare', boost: 3 },
  { id: 'shadow_bow', name: 'Shadow Bow', rarity: 'rare', boost: 3 },
  { id: 'thunder_axe', name: 'Thunder Axe', rarity: 'rare', boost: 4 },
  { id: 'crystal_sword', name: 'Crystal Sword', rarity: 'rare', boost: 3 },
  { id: 'venom_blade', name: 'Venom Blade', rarity: 'rare', boost: 3 },
  { id: 'moon_katana', name: 'Moon Katana', rarity: 'rare', boost: 4 },
  { id: 'hunter_crossbow', name: 'Hunter Crossbow', rarity: 'rare', boost: 3 },
  // Epic
  { id: 'void_blade', name: 'Void Blade', rarity: 'epic', boost: 5 },
  { id: 'dragon_slayer', name: 'Dragon Slayer', rarity: 'epic', boost: 5 },
  { id: 'eclipse_katana', name: 'Eclipse Katana', rarity: 'epic', boost: 5 },
  { id: 'inferno_greatsword', name: 'Inferno Greatsword', rarity: 'epic', boost: 6 },
  { id: 'soul_reaper_scythe', name: 'Soul Reaper Scythe', rarity: 'epic', boost: 6 },
  { id: 'arcane_staff', name: 'Arcane Staff', rarity: 'epic', boost: 5 },
  { id: 'titan_hammer', name: 'Titan Hammer', rarity: 'epic', boost: 6 },
  { id: 'blood_fang', name: 'Blood Fang', rarity: 'epic', boost: 5 },
  { id: 'nightmare_spear', name: 'Nightmare Spear', rarity: 'epic', boost: 5 },
  { id: 'tempest_bow', name: 'Tempest Bow', rarity: 'epic', boost: 5 },
  // Legendary
  { id: 'monarchs_blade', name: "Monarch's Blade", rarity: 'legendary', boost: 8 },
  { id: 'abyss_greatsword', name: 'Abyss Greatsword', rarity: 'legendary', boost: 8 },
  { id: 'divine_katana', name: 'Divine Katana', rarity: 'legendary', boost: 8 },
  { id: 'celestial_spear', name: 'Celestial Spear', rarity: 'legendary', boost: 8 },
  { id: 'eternal_blade', name: 'Eternal Blade', rarity: 'legendary', boost: 9 },
  { id: 'world_breaker_w', name: 'World Breaker', rarity: 'legendary', boost: 9 },
  { id: 'cosmic_scythe', name: 'Cosmic Scythe', rarity: 'legendary', boost: 8 },
  { id: 'kings_greatsword', name: "King's Greatsword", rarity: 'legendary', boost: 9 },
  { id: 'heaven_splitter', name: 'Heaven Splitter', rarity: 'legendary', boost: 9 },
  { id: 'shadow_edge', name: 'Shadow Edge', rarity: 'legendary', boost: 8 },
  // Mythic
  { id: 'infinity_blade', name: 'Infinity Blade', rarity: 'mythic', boost: 12 },
  { id: 'void_monarch_sword', name: 'Void Monarch Sword', rarity: 'mythic', boost: 12 },
  { id: 'ragnarok_axe', name: 'Ragnarok Axe', rarity: 'mythic', boost: 12 },
  { id: 'genesis_blade', name: 'Genesis Blade', rarity: 'mythic', boost: 13 },
  { id: 'chaos_scythe', name: 'Chaos Scythe', rarity: 'mythic', boost: 12 },
  { id: 'eclipse_destroyer', name: 'Eclipse Destroyer', rarity: 'mythic', boost: 13 },
  { id: 'black_sun_katana', name: 'Black Sun Katana', rarity: 'mythic', boost: 12 },
  { id: 'oblivion_sword', name: 'Oblivion Sword', rarity: 'mythic', boost: 13 },
  { id: 'dimensional_cleaver', name: 'Dimensional Cleaver', rarity: 'mythic', boost: 13 },
  { id: 'omega_blade', name: 'Omega Blade', rarity: 'mythic', boost: 14 },
  // Secret
  { id: 'crimson_eclipse', name: 'Crimson Eclipse', rarity: 'secret', boost: 15 },
  { id: 'soul_devourer', name: 'Soul Devourer', rarity: 'secret', boost: 15 },
  { id: 'dark_star_blade', name: 'Dark Star Blade', rarity: 'secret', boost: 15 },
  { id: 'phantom_requiem', name: 'Phantom Requiem', rarity: 'secret', boost: 15 },
  { id: 'dragon_kings_spear', name: "Dragon King's Spear", rarity: 'secret', boost: 16 },
  { id: 'astral_katana', name: 'Astral Katana', rarity: 'secret', boost: 15 },
  { id: 'abyss_reaver', name: 'Abyss Reaver', rarity: 'secret', boost: 16 },
  { id: 'black_hole_scythe', name: 'Black Hole Scythe', rarity: 'secret', boost: 16 },
  { id: 'eternal_judgment', name: 'Eternal Judgment', rarity: 'secret', boost: 16 },
  { id: 'last_monarch_blade', name: 'Last Monarch Blade', rarity: 'secret', boost: 18 },
];

export interface Shield {
  id: string;
  name: string;
  rarity: Rarity;
}

export const SHIELDS: Shield[] = [
  { id: 'guardian_shield', name: 'Guardian Shield', rarity: 'common' },
  { id: 'shadow_aegis', name: 'Shadow Aegis', rarity: 'rare' },
  { id: 'dragon_shield', name: 'Dragon Shield', rarity: 'epic' },
  { id: 'titan_bulwark', name: 'Titan Bulwark', rarity: 'epic' },
  { id: 'eclipse_guard', name: 'Eclipse Guard', rarity: 'legendary' },
  { id: 'void_barrier', name: 'Void Barrier', rarity: 'legendary' },
  { id: 'iron_fortress', name: 'Iron Fortress', rarity: 'mythic' },
  { id: 'celestial_shield', name: 'Celestial Shield', rarity: 'mythic' },
  { id: 'monarchs_shield', name: "Monarch's Shield", rarity: 'secret' },
  { id: 'eternal_aegis', name: 'Eternal Aegis', rarity: 'secret' },
];

export interface Frame {
  id: string;
  name: string;
  rarity: Rarity;
  color: string;
}

export const FRAMES: Frame[] = [
  { id: 'shadow_frame', name: 'Shadow Frame', rarity: 'rare', color: '#1e1b4b' },
  { id: 'golden_frame', name: 'Golden Frame', rarity: 'epic', color: '#f59e0b' },
  { id: 'crimson_frame', name: 'Crimson Frame', rarity: 'epic', color: '#dc2626' },
  { id: 'frost_frame', name: 'Frost Frame', rarity: 'epic', color: '#38bdf8' },
  { id: 'eclipse_frame', name: 'Eclipse Frame', rarity: 'legendary', color: '#7c3aed' },
  { id: 'dragon_frame', name: 'Dragon Frame', rarity: 'legendary', color: '#16a34a' },
  { id: 'void_frame', name: 'Void Frame', rarity: 'mythic', color: '#0f172a' },
  { id: 'celestial_frame', name: 'Celestial Frame', rarity: 'mythic', color: '#fde68a' },
  { id: 'monarch_frame', name: 'Monarch Frame', rarity: 'secret', color: '#a78bfa' },
  { id: 'infinity_frame', name: 'Infinity Frame', rarity: 'secret', color: '#06b6d4' },
];

export interface BackgroundItem {
  id: string;
  name: string;
  rarity: Rarity;
  /** CSS background value (gradient). */
  css: string;
}

export const BACKGROUNDS: BackgroundItem[] = [
  { id: 'shadow_realm', name: 'Shadow Realm', rarity: 'rare', css: 'radial-gradient(circle at 30% 20%, #1e1b4b, #05060a 70%)' },
  { id: 'crimson_eclipse_bg', name: 'Crimson Eclipse', rarity: 'epic', css: 'radial-gradient(circle at 70% 30%, #7f1d1d, #05060a 70%)' },
  { id: 'frozen_kingdom', name: 'Frozen Kingdom', rarity: 'epic', css: 'radial-gradient(circle at 50% 10%, #0c4a6e, #05060a 70%)' },
  { id: 'celestial_sky', name: 'Celestial Sky', rarity: 'epic', css: 'radial-gradient(circle at 50% 20%, #1e3a8a, #05060a 70%)' },
  { id: 'dragons_lair', name: "Dragon's Lair", rarity: 'legendary', css: 'radial-gradient(circle at 40% 60%, #14532d, #05060a 70%)' },
  { id: 'abyss_gate', name: 'Abyss Gate', rarity: 'legendary', css: 'radial-gradient(circle at 60% 40%, #4c1d95, #05060a 70%)' },
  { id: 'mystic_forest', name: 'Mystic Forest', rarity: 'rare', css: 'radial-gradient(circle at 30% 70%, #064e3b, #05060a 70%)' },
  { id: 'neon_city', name: 'Neon City', rarity: 'epic', css: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0c4a6e)' },
  { id: 'galaxy_horizon', name: 'Galaxy Horizon', rarity: 'legendary', css: 'radial-gradient(circle at 50% 50%, #312e81, #05060a 70%)' },
  { id: 'throne_of_monarch', name: 'Throne of Monarch', rarity: 'secret', css: 'radial-gradient(circle at 50% 30%, #78350f, #05060a 70%)' },
];

export interface Badge {
  id: string;
  name: string;
  rarity: Rarity;
  emoji: string;
  description: string;
}

export const BADGES: Badge[] = [
  { id: 'first_steps', name: 'First Steps', rarity: 'common', emoji: '👣', description: 'Complete your first task.' },
  { id: 'week_streak', name: 'Week Warrior', rarity: 'rare', emoji: '🔥', description: 'Maintain a 7-day streak.' },
  { id: 'month_streak', name: 'Iron Discipline', rarity: 'epic', emoji: '⛓️', description: 'Maintain a 30-day streak.' },
  { id: 'first_dungeon', name: 'Dungeon Clearer', rarity: 'rare', emoji: '🏰', description: 'Clear your first dungeon.' },
  { id: 'boss_slayer', name: 'Boss Slayer', rarity: 'legendary', emoji: '💀', description: 'Defeat the Dungeon Boss.' },
  { id: 'dungeon_conqueror', name: 'Dungeon Conqueror', rarity: 'legendary', emoji: '👑', description: 'Clear 10 dungeons.' },
  { id: 'rank_d', name: 'Awakened', rarity: 'rare', emoji: '🟢', description: 'Reach D-Rank.' },
  { id: 'rank_s', name: 'S-Class', rarity: 'epic', emoji: '🔥', description: 'Reach S-Rank.' },
  { id: 'rank_shadow', name: 'Shadow Hunter', rarity: 'legendary', emoji: '🐺', description: 'Reach Shadow Hunter rank.' },
  { id: 'rank_monarch', name: 'The Monarch', rarity: 'secret', emoji: '👑', description: 'Reach Mr. BYDA rank.' },
  { id: 'aura_collector', name: 'Aura Collector', rarity: 'epic', emoji: '✨', description: 'Own 10 different auras.' },
  { id: 'legendary_aura', name: 'Legendary Aura', rarity: 'legendary', emoji: '🌟', description: 'Obtain a legendary aura.' },
  { id: 'secret_finder', name: 'Secret Finder', rarity: 'secret', emoji: '🗝️', description: 'Discover a secret dungeon.' },
  { id: 'perfect_day', name: 'Perfect Day', rarity: 'epic', emoji: '💯', description: 'Complete all main tasks in one day.' },
  { id: 'spin_lucky', name: 'Lucky Spin', rarity: 'rare', emoji: '🎡', description: 'Win a rare+ reward from the spin wheel.' },
  { id: 'no_skip', name: 'No Skip November', rarity: 'mythic', emoji: '🛡️', description: '30 days without missing a main task.' },
];

export function getAuraById(id: string): Aura | undefined {
  return AURAS.find((a) => a.id === id);
}
export function getTitleById(id: string): Title | undefined {
  return TITLES.find((t) => t.id === id);
}
export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}
export function getShieldById(id: string): Shield | undefined {
  return SHIELDS.find((s) => s.id === id);
}
export function getFrameById(id: string): Frame | undefined {
  return FRAMES.find((f) => f.id === id);
}
export function getBackgroundById(id: string): BackgroundItem | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}
export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
