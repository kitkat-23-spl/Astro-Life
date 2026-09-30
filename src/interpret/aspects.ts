import type { AspectName, PointName } from '../astro/constants'

export const POINT_NOUN: Record<PointName, string> = {
  Sun: 'sense of self',
  Moon: 'emotional needs',
  Mercury: 'mind',
  Venus: 'heart and values',
  Mars: 'drive',
  Jupiter: 'optimism and growth',
  Saturn: 'discipline and fears',
  Uranus: 'need for freedom',
  Neptune: 'imagination',
  Pluto: 'intensity and power',
  'North Node': 'growth path',
  Ascendant: 'outward persona',
  Midheaven: 'public direction',
}

export const ASPECT_TEXT: Record<AspectName, { verb: string; meaning: string }> = {
  Conjunction: {
    verb: 'are fused together',
    meaning: 'These two energies act as one unit. They amplify each other and are hard to separate, so this combination is a signature feature of your personality.',
  },
  Sextile: {
    verb: 'cooperate',
    meaning: 'This is an opportunity. The two energies support each other when you make a small effort to connect them, a talent that rewards practice.',
  },
  Square: {
    verb: 'challenge each other',
    meaning: 'This is an inner tension that creates friction and motivation. It can feel uncomfortable, but squares are where much of your growth, drive and eventual strength comes from.',
  },
  Trine: {
    verb: 'flow together easily',
    meaning: 'This is a natural gift. The energies harmonise without effort, so much so that you may take this ability for granted.',
  },
  Opposition: {
    verb: 'pull in opposite directions',
    meaning: 'This is a see-saw you learn to balance. It is often experienced through relationships, where others mirror one side back to you, and the goal is integration rather than choosing one side.',
  },
}

/** Specific wisdom for well-known planetary pairings (key: alphabetical "A|B"). */
export const PAIR_THEME: Record<string, string> = {
  'Moon|Sun': 'Your will and your needs. How these interact shapes how at ease you feel inside your own skin.',
  'Mars|Venus': 'Attraction and desire. This pairing colours your romantic and creative chemistry.',
  'Moon|Saturn': 'Feelings and responsibility. You may have learned early to be self-reliant; over time this becomes emotional maturity and resilience.',
  'Saturn|Sun': 'Identity and responsibility. You take yourself seriously and may feel you must earn your place, which builds real authority with age.',
  'Jupiter|Sun': 'Identity and growth. There is generosity, confidence and a sense that life will work out.',
  'Mercury|Sun': 'Identity and mind. How you think is tightly bound to who you are.',
  'Moon|Venus': 'Emotional warmth. You find comfort in beauty, affection and harmonious relationships.',
  'Mars|Moon': 'Feelings and action. Emotions quickly turn into action, which gives passion and protectiveness but also a quick temper.',
  'Mars|Sun': 'Will and energy. You have strong drive, competitive spirit and courage.',
  'Jupiter|Mercury': 'Big thinking. You love learning, teaching and big ideas, though you may overlook details.',
  'Mercury|Saturn': 'A serious mind. You think carefully and deeply; your words carry weight.',
  'Neptune|Venus': 'Idealised love. You are drawn to romance, art and music, and you may see partners through rose-tinted glasses.',
  'Pluto|Venus': 'Intense love. Your relationships are all-or-nothing and deeply transformative.',
  'Uranus|Venus': 'Freedom in love. You are attracted to the unusual and need independence within relationships.',
  'Moon|Pluto': 'Emotional depth. Your feelings are powerful and private, with an instinct for psychological truth.',
  'Moon|Neptune': 'Emotional sensitivity. You are highly empathic, imaginative and absorb the moods around you.',
  'Mars|Saturn': 'Controlled energy. You can work extremely hard with discipline, though frustration may build when effort is blocked.',
  'Mars|Pluto': 'Formidable willpower. When you commit to a goal, your determination is intense and unrelenting.',
  'Jupiter|Saturn': 'Growth and limits. You balance optimism with realism, expanding step by step.',
  'Mercury|Uranus': 'Brilliant, unconventional thinking. Insights arrive in flashes.',
  'Mercury|Neptune': 'An imaginative mind, strong for poetry, music and intuition, though sometimes foggy on details.',
  'Ascendant|Sun': 'Your identity is highly visible. People see who you really are straight away.',
  'Ascendant|Moon': 'Your emotions show on your face. You come across as sensitive, responsive and approachable.',
  'Midheaven|Sun': 'Your identity is tied to your public path. Career and recognition matter deeply to you.',
  'Moon|Uranus': 'You need emotional freedom. Your moods can shift suddenly, and you need space to stay yourself in close bonds.',
  'Jupiter|Venus': 'Warmth and generosity in love and money. You attract good things and enjoy life’s pleasures.',
}

export function pairKey(a: PointName, b: PointName): string {
  return [a, b].sort().join('|')
}
