import type { SignName } from '../astro/constants'

export interface SignText {
  keywords: string[]
  essence: string
  /** Adverbial phrase: how any planet in this sign tends to operate. */
  style: string
  sun: string
  moon: string
  rising: string
  strengths: string[]
  growth: string[]
}

export const SIGN_TEXT: Record<SignName, SignText> = {
  Aries: {
    keywords: ['initiative', 'courage', 'directness', 'independence'],
    essence: 'Aries is the spark at the start of the zodiac: the urge to begin, act and prove yourself through experience.',
    style: 'directly, quickly and with a pioneering instinct',
    sun: 'You come alive when you are starting something. You feel most yourself when you act first and refine later, and you respect honesty and courage in others.',
    moon: 'Your feelings arrive fast and hot, and they pass just as quickly. You need freedom to react, room to move your body, and people who can handle directness without taking it personally.',
    rising: 'People first meet you as energetic, frank and ready to go. You approach new situations head-on and often become the one who gets things moving.',
    strengths: ['Brave in new situations', 'Honest and uncomplicated', 'Self-starting'],
    growth: ['Pausing before reacting', 'Finishing what you start', 'Patience with slower people'],
  },
  Taurus: {
    keywords: ['stability', 'sensuality', 'patience', 'loyalty'],
    essence: 'Taurus is about building something that lasts. It values comfort, beauty and security earned through steady effort.',
    style: 'steadily, patiently and with an eye for what is real and lasting',
    sun: 'You are at your best when you build slowly and well. You trust what you can touch, you are loyal once committed, and your calm presence steadies other people.',
    moon: 'You find emotional safety in routine, good food, nature and physical comfort. Once you settle into a feeling it lasts a long time, so sudden change can be hard.',
    rising: 'You come across as calm, grounded and pleasant to be around. People sense that you will not be rushed and that you are dependable.',
    strengths: ['Reliable and consistent', 'Strong aesthetic sense', 'Calm under pressure'],
    growth: ['Adapting when plans change', 'Letting go of what no longer serves', 'Avoiding stubbornness'],
  },
  Gemini: {
    keywords: ['curiosity', 'communication', 'versatility', 'wit'],
    essence: 'Gemini is the mind in motion: gathering information, making connections and sharing ideas.',
    style: 'curiously, conversationally and in several directions at once',
    sun: 'You thrive on variety, conversation and learning. Your mind makes connections quickly, and you are often the one who knows a little about everything and someone for every occasion.',
    moon: 'You process feelings by talking or writing them through. You need mental stimulation to feel safe, and boredom can feel like an emotional emergency.',
    rising: 'You come across as lively, chatty and quick-witted. You meet the world with questions and adapt easily to new people.',
    strengths: ['Quick learner', 'Great communicator', 'Adaptable and social'],
    growth: ['Depth over breadth', 'Following through on commitments', 'Feeling emotions, not just analysing them'],
  },
  Cancer: {
    keywords: ['nurture', 'belonging', 'memory', 'protection'],
    essence: 'Cancer is the instinct to protect and nourish. It is about home, family, emotional roots and caring for what is vulnerable.',
    style: 'protectively, intuitively and with deep emotional memory',
    sun: 'You lead with care. You build a sense of home wherever you go, you remember what matters to people, and your intuition about moods is usually right.',
    moon: 'The Moon is at home in Cancer, so your emotional life is rich and deeply felt. You need a safe base, close bonds and time to retreat into your shell to recharge.',
    rising: 'You come across as warm but a little guarded at first. People feel looked after around you, and once trust is built you are fiercely loyal.',
    strengths: ['Emotionally intelligent', 'Protective and loyal', 'Creates belonging'],
    growth: ['Not taking things personally', 'Letting go of the past', 'Asking directly for what you need'],
  },
  Leo: {
    keywords: ['creativity', 'warmth', 'confidence', 'generosity'],
    essence: 'Leo is the heart of the zodiac. It is about self-expression, creativity, play and the courage to be seen.',
    style: 'warmly, expressively and with a flair for being seen',
    sun: 'The Sun rules Leo, so your core identity shines without effort. You are generous and creative, and you are happiest when your heart is fully in what you do and it is appreciated.',
    moon: 'You need to feel special, appreciated and free to express yourself. Emotional warmth, play and recognition keep you well.',
    rising: 'You make an impression: warm, confident and noticeable. People often look to you for energy and leadership in a room.',
    strengths: ['Big-hearted and generous', 'Natural leader and performer', 'Loyal and encouraging'],
    growth: ['Sharing the spotlight', 'Handling criticism gracefully', 'Separating self-worth from praise'],
  },
  Virgo: {
    keywords: ['precision', 'service', 'improvement', 'discernment'],
    essence: 'Virgo is the craftsperson of the zodiac: refining, analysing and making things work better through careful attention.',
    style: 'carefully, analytically and with a desire to improve things',
    sun: 'You are driven to be useful and to do things well. You notice details others miss, and your practical help is how you show you care.',
    moon: 'You feel safe when life is ordered and you are being useful. Worry can be your way of processing feelings, and simple routines calm you.',
    rising: 'You come across as modest, thoughtful and capable. People often come to you when something needs fixing or organising.',
    strengths: ['Attention to detail', 'Practical problem-solver', 'Humble and helpful'],
    growth: ['Self-compassion over self-criticism', 'Accepting good enough', 'Receiving help as well as giving it'],
  },
  Libra: {
    keywords: ['harmony', 'fairness', 'partnership', 'grace'],
    essence: 'Libra seeks balance. It is about relationships, fairness, beauty and seeing every side of a situation.',
    style: 'diplomatically, gracefully and always in relation to others',
    sun: 'You come into your own through relationships and collaboration. You have a gift for seeing both sides, creating harmony and bringing beauty into ordinary spaces.',
    moon: 'You need peace, fairness and companionship to feel emotionally settled. Conflict can unsettle you deeply, and you often understand your feelings by sharing them with someone.',
    rising: 'You come across as charming, polite and easy to like. You naturally put people at ease and read social dynamics well.',
    strengths: ['Diplomatic and fair', 'Refined taste', 'Great partner and mediator'],
    growth: ['Making decisions without consensus', 'Voicing disagreement honestly', 'Being comfortable alone'],
  },
  Scorpio: {
    keywords: ['depth', 'intensity', 'transformation', 'loyalty'],
    essence: 'Scorpio goes beneath the surface. It is about emotional depth, truth, power, intimacy and the capacity to transform.',
    style: 'intensely, privately and with a drive to reach the truth underneath',
    sun: 'You are drawn to what is real, hidden and powerful. You do nothing halfway, you read people deeply, and you can regenerate after experiences that would break others.',
    moon: 'Your emotions run very deep, even if you show little on the surface. Trust is everything to you, and you need emotional honesty and privacy.',
    rising: 'You come across as magnetic, perceptive and a little mysterious. People sense that you notice more than you say.',
    strengths: ['Emotionally resilient', 'Perceptive and focused', 'Deeply loyal'],
    growth: ['Letting others in', 'Releasing control and grudges', 'Trusting without testing'],
  },
  Sagittarius: {
    keywords: ['exploration', 'meaning', 'optimism', 'freedom'],
    essence: 'Sagittarius is the seeker. It is about travel, philosophy, big-picture meaning and the belief that life is an adventure.',
    style: 'expansively, optimistically and in search of meaning',
    sun: 'You are fuelled by adventure, learning and big ideas. Your optimism is contagious, and you need room to explore both the world and your beliefs.',
    moon: 'You feel emotionally alive when you have freedom, humour and something to look forward to. Feeling confined is your biggest stressor.',
    rising: 'You come across as friendly, upbeat and open-minded. You meet the world as an adventure and make people laugh.',
    strengths: ['Optimistic and inspiring', 'Honest and philosophical', 'Adventurous'],
    growth: ['Tact alongside honesty', 'Following through on details', 'Staying present'],
  },
  Capricorn: {
    keywords: ['ambition', 'discipline', 'responsibility', 'mastery'],
    essence: 'Capricorn climbs the mountain. It is about long-term goals, structure, integrity and earning authority through effort.',
    style: 'strategically, responsibly and with long-term goals in mind',
    sun: 'You play the long game. You are responsible, ambitious and grounded, and you tend to get better with age as your efforts compound into real mastery.',
    moon: 'You may have learned to be self-reliant early. You feel secure when you are in control and making progress, and you show care through dependable action.',
    rising: 'You come across as composed, mature and competent. People assume you are in charge, often before you even say a word.',
    strengths: ['Disciplined and persistent', 'Responsible and trustworthy', 'Strategic thinker'],
    growth: ['Resting without guilt', 'Showing vulnerability', 'Measuring worth beyond achievement'],
  },
  Aquarius: {
    keywords: ['originality', 'independence', 'community', 'vision'],
    essence: 'Aquarius sees the future. It is about innovation, individuality, ideals and serving the collective.',
    style: 'originally, independently and with an eye on the bigger system',
    sun: 'You are here to think differently. You value freedom, fairness and ideas that could improve things for everyone, and you are loyal to your friends and your principles.',
    moon: 'You process emotions through ideas and a little distance. You need space, friendship and freedom to be unconventional to feel at home.',
    rising: 'You come across as friendly but individual, slightly unusual and hard to box in. People notice that you march to your own drum.',
    strengths: ['Innovative thinker', 'Humanitarian values', 'Loyal friend'],
    growth: ['Emotional intimacy', 'Flexibility in your own principles', 'Connecting heart and head'],
  },
  Pisces: {
    keywords: ['imagination', 'compassion', 'intuition', 'transcendence'],
    essence: 'Pisces dissolves boundaries. It is about imagination, empathy, spirituality and the sense that everything is connected.',
    style: 'intuitively, imaginatively and with porous, compassionate boundaries',
    sun: 'You feel the world deeply and see possibilities others miss. You are compassionate, creative and intuitive, and you need beauty, art or spirit to feel whole.',
    moon: 'You absorb the moods around you like a sponge. You need quiet, creative outlets and gentle people, and time alone to find your own feelings again.',
    rising: 'You come across as gentle, dreamy and approachable. People often confide in you because you feel safe and understanding.',
    strengths: ['Deep empathy', 'Imaginative and artistic', 'Spiritually attuned'],
    growth: ['Firm boundaries', 'Facing reality directly', 'Not absorbing others’ burdens'],
  },
}
