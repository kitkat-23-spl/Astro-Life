import type { PointName, SignName } from '../astro/constants'

export interface PlanetText {
  domain: string // "your core identity and vitality"
  question: string
  keywords: string[]
  personal: boolean // personal planets are interpreted more deeply by sign
  generational?: boolean
}

export const PLANET_TEXT: Record<PointName, PlanetText> = {
  Sun: { domain: 'your core identity, vitality and purpose', question: 'Who am I becoming?', keywords: ['identity', 'purpose', 'vitality'], personal: true },
  Moon: { domain: 'your emotional needs, instincts and inner comfort', question: 'What do I need to feel safe?', keywords: ['emotions', 'needs', 'habits'], personal: true },
  Mercury: { domain: 'the way you think, learn and communicate', question: 'How do I think and speak?', keywords: ['mind', 'communication', 'learning'], personal: true },
  Venus: { domain: 'what you love, value and find beautiful, and how you relate', question: 'What do I value and how do I love?', keywords: ['love', 'values', 'beauty'], personal: true },
  Mars: { domain: 'your drive, courage, desire and how you assert yourself', question: 'How do I go after what I want?', keywords: ['drive', 'action', 'desire'], personal: true },
  Jupiter: { domain: 'where you grow, find luck and seek meaning', question: 'Where do I expand and find faith?', keywords: ['growth', 'optimism', 'wisdom'], personal: false },
  Saturn: { domain: 'where you meet responsibility, limits and eventual mastery', question: 'Where must I build patiently?', keywords: ['discipline', 'structure', 'maturity'], personal: false },
  Uranus: { domain: 'your urge for freedom, originality and sudden change', question: 'Where do I break the mould?', keywords: ['innovation', 'freedom', 'disruption'], personal: false, generational: true },
  Neptune: { domain: 'your dreams, ideals, compassion and spiritual longing', question: 'Where do I dissolve into something bigger?', keywords: ['imagination', 'ideals', 'spirituality'], personal: false, generational: true },
  Pluto: { domain: 'your capacity for deep transformation and personal power', question: 'Where do I transform?', keywords: ['power', 'depth', 'rebirth'], personal: false, generational: true },
  'North Node': { domain: 'the direction of growth your life keeps pulling you toward', question: 'Where am I growing?', keywords: ['growth path', 'purpose', 'unfamiliar territory'], personal: false },
  Ascendant: { domain: 'your first impression and approach to life', question: 'How do I meet the world?', keywords: ['persona', 'body', 'approach'], personal: true },
  Midheaven: { domain: 'your public path, reputation and vocation', question: 'What am I here to build publicly?', keywords: ['career', 'reputation', 'calling'], personal: false },
}

/** Hand-written nuance for the planets people ask about most. */
export const PLANET_IN_SIGN: Partial<Record<PointName, Record<SignName, string>>> = {
  Mercury: {
    Aries: 'You think fast and say it straight. Decisions come quickly, and you prefer bold ideas to endless debate.',
    Taurus: 'You think carefully and practically. Once you have made up your mind it stays made up, and you learn best by doing.',
    Gemini: 'Your mind is quick, curious and verbal. You juggle ideas easily and love wordplay, reading and conversation.',
    Cancer: 'You think with your feelings and remember everything that touched you. Your communication is intuitive and caring.',
    Leo: 'You speak with warmth and conviction and can hold a room. You think in big, creative, dramatic strokes.',
    Virgo: 'Your mind is precise, analytical and organised. You excel at editing, troubleshooting and practical problem-solving.',
    Libra: 'You weigh every side before deciding. You communicate diplomatically and are a natural negotiator.',
    Scorpio: 'You think like a detective, looking past the surface to motives and hidden truths. Your words can be piercing.',
    Sagittarius: 'You think in big pictures and bold truths. You love philosophy and teaching, though details can bore you.',
    Capricorn: 'You think strategically and structurally. Your communication is measured, serious and to the point.',
    Aquarius: 'You think originally and systemically. You enjoy unconventional ideas, technology and debates about the future.',
    Pisces: 'You think in images, feelings and impressions. Your mind is poetic and intuitive and picks up what is unspoken.',
  },
  Venus: {
    Aries: 'You love boldly and fall fast. Attraction needs spark, chase and independence.',
    Taurus: 'You love through loyalty, touch and consistency. You value comfort, quality and sensual pleasure.',
    Gemini: 'You are attracted to minds. Flirting through words, variety and playful banter keep love alive.',
    Cancer: 'You love by nurturing and protecting. Emotional safety and a sense of home matter most in relationships.',
    Leo: 'You love generously and dramatically. You want romance, admiration and a partner who is proud of you.',
    Virgo: 'You show love through practical care and attention. You appreciate partners who are reliable and thoughtful.',
    Libra: 'Venus is at home here. You love beauty, harmony and partnership, and you bring grace to relationships.',
    Scorpio: 'You love intensely and all-in. You crave depth, trust and soul-level intimacy rather than surface romance.',
    Sagittarius: 'You love freedom and adventure. The best partner for you is a fellow explorer who makes you laugh.',
    Capricorn: 'You love seriously and for the long term. Commitment, respect and shared goals build your trust.',
    Aquarius: 'You love as a friend first. You need independence, intellectual rapport and room to be unusual.',
    Pisces: 'You love romantically and selflessly. You see the best in people and seek a spiritual, dreamy connection.',
  },
  Mars: {
    Aries: 'Mars is at home here: direct, competitive and energetic. You act first and think second.',
    Taurus: 'You are slow to start and impossible to stop. Your drive is steady, stubborn and built for endurance.',
    Gemini: 'You channel energy through ideas and words. You multitask well and can win arguments with wit.',
    Cancer: 'Your drive is protective. You fight hardest for the people you love, though anger may come out indirectly.',
    Leo: 'You act with pride, passion and flair. You are motivated by creative challenges and recognition.',
    Virgo: 'You work precisely and methodically. Your energy goes into improving, fixing and serving.',
    Libra: 'You pursue goals through collaboration and fairness. You may avoid open conflict but fight for justice.',
    Scorpio: 'Your drive is intense, strategic and relentless. You pursue what you want with total focus.',
    Sagittarius: 'You are fuelled by adventure and conviction. You go after big goals with enthusiasm, if not always patience.',
    Capricorn: 'Mars is exalted here: disciplined, ambitious and strategic. You channel energy into long-term achievement.',
    Aquarius: 'You act on principle and for causes. Your drive is inventive, independent and sometimes rebellious.',
    Pisces: 'You move with the current rather than against it. Your drive is intuitive, creative and compassionate.',
  },
}
