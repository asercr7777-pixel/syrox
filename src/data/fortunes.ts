export const FORTUNE_QUOTES: string[] = [
  "The System has chosen you. Rise, Hunter.",
  "Shadows gather strength from discipline. Feed them well.",
  "Your potential is limitless. The question is: will you claim it?",
  "Every task completed echoes through the dungeon of your destiny.",
  "Weakness is a choice. Strength is a habit.",
  "The gate opens only for those who never stop ascending.",
  "Discipline is the forge where hunters are tempered.",
  "You are not bound by yesterday's failures. Today, you rise.",
  "The System rewards the relentless. Prove you are not merciful to yourself.",
  "In the shadows, only those with unwavering will survive.",
  "Each day is a dungeon. Each completed task, a floor conquered.",
  "The path to power is paved with small victories. Build it brick by brick.",
  "Awaken the hunter within. The world has been waiting.",
  "Your growth knows no ceiling, only the limits you accept.",
  "The gates of power bow to those who never bow.",
  "Discipline today becomes strength tomorrow.",
  "The System is fair. Excellence yields to effort.",
  "You are the architect of your own ascension.",
  "Fear is the final gate. Pass through it and emerge evolved.",
  "The shadows test only those worthy of their depths.",
  "What separates hunters from prey? Consistency.",
  "Your potential was never capped. Only your conviction matters.",
  "The dungeons of discipline reveal only truth.",
  "Rise so high that your former self becomes unreognizable.",
  "The System watches. Show it you are worth the selection.",
  "In the silence of your grind lies the loudest thunder.",
  "Tomorrow's victories are today's habits.",
  "The gate recognizes only one currency: your relentless will.",
  "You chose this path. Now walk it with fangs bared.",
  "Ascension is not a destination. It is a choice you make every dawn."
];

export const LUCK_RATINGS: Array<{
  rating: number;
  label: string;
  color: string;
  bonus: string;
}> = [
  {
    rating: 1,
    label: "Ominous",
    color: "#8B0000",
    bonus: "-10% to all rewards"
  },
  {
    rating: 2,
    label: "Cloudy",
    color: "#808080",
    bonus: "-5% to all rewards"
  },
  {
    rating: 3,
    label: "Balanced",
    color: "#808080",
    bonus: "Normal rewards"
  },
  {
    rating: 4,
    label: "Favorable",
    color: "#FFD700",
    bonus: "+10% to all rewards"
  },
  {
    rating: 5,
    label: "Blessed",
    color: "#00CED1",
    bonus: "+25% to all rewards"
  }
];

function hashDate(dateString: string): number {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getDailyFortune(date: string): {
  luck: number;
  quote: string;
  bonusType: "coins" | "xp" | "luck";
  bonusAmount: number;
} {
  const hash = hashDate(date);

  const luck = (hash % 5) + 1;
  const quoteIndex = (hash >> 5) % FORTUNE_QUOTES.length;
  const bonusTypeIndex = (hash >> 10) % 3;
  const bonusAmount = 10 + ((hash >> 12) % 41);

  const bonusTypes: Array<"coins" | "xp" | "luck"> = [
    "coins",
    "xp",
    "luck"
  ];

  return {
    luck,
    quote: FORTUNE_QUOTES[quoteIndex],
    bonusType: bonusTypes[bonusTypeIndex],
    bonusAmount
  };
}
