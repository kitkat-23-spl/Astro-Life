/**
 * Lessons built on K.S. Charak, Elements of Vedic Astrology vol. 2, chapters
 * XVII to XXX, in our own words. The classical tables come straight from the
 * data the site uses on chart cards (src/vedic/classical.ts), so the lessons
 * and the readings always agree.
 */
import { ordinal } from '../astro/constants'
import { CLASSICAL_TABLES, parseClassical } from '../vedic/classical'
import { RASHI, type Graha } from '../vedic/constants'
import { signName } from '../vedic/sidereal'
import { ex } from './exampleChart'
import type { Block, Lesson } from './types'

const R = 'Classical results'
const P = 'Timing and practice'
const SIGN = (i: number) => `${RASHI[signName(i)]} (${signName(i)})`
const HOUSE_WORD = ['self', 'wealth', 'effort', 'home', 'children', 'conflict', 'partner', 'obstacles', 'fortune', 'career', 'gains', 'loss']

const LORD_THEME = [
  'the body, health and direction of life',
  'the wealth earner: money, family and speech',
  'activity and effort: courage, siblings, initiative',
  'possessions and comfort at home: mother, property, vehicles',
  'the fruits of past karma: children, intellect, merit',
  'struggle and hostility: opponents, illness, service',
  'partnerships and relationships',
  'obstacles and deprivation: crises, longevity, hidden matters',
  'fortune and virtue: father, teachers, dharma',
  'one\'s work and functions: career and status',
  'the multiplier: gains, networks, elder siblings',
  'the divider: expenses, losses, foreign lands, release',
]

const lordBlock = (lord: number): Block => ({
  type: 'classical',
  title: `${ordinal(lord)} lord: ${LORD_THEME[lord - 1]}`,
  rows: CLASSICAL_TABLES.lordInHouse[lord - 1].map((raw, i) => [`In the ${ordinal(i + 1)} (${HOUSE_WORD[i]})`, raw] as [string, string]),
  source: 'Charak XVII, after Parashara',
})
const lordLine = (lord: number, house: number) => parseClassical(CLASSICAL_TABLES.lordInHouse[lord - 1][house - 1]).text

const HOUSE_NOTE: Partial<Record<Graha, string>> = {
  Sun: 'favourable in the 3rd, 6th, 10th and 11th',
  Moon: 'adverse in the 6th, 8th and 12th unless under benefic influence',
  Mars: 'good in the 3rd, 6th, 10th and 11th; in the 1st, 4th, 7th, 8th and 12th it forms Mangal dosha',
  Rahu: 'good in the 3rd, 6th, 10th and 11th',
  Ketu: 'good in the 3rd, 6th, 10th and 11th',
}
const houseBlock = (g: Graha): Block => ({
  type: 'classical',
  title: `${g}${HOUSE_NOTE[g] ? `: ${HOUSE_NOTE[g]}` : ''}`,
  rows: CLASSICAL_TABLES.inHouse[g].map((raw, i) => [`In the ${ordinal(i + 1)}`, raw] as [string, string]),
  source: 'Charak XVIII',
})
const houseLine = (g: Graha, house: number) => parseClassical(CLASSICAL_TABLES.inHouse[g][house - 1]).text

const moonBlock = (g: Graha): Block => ({
  type: 'classical',
  title: `${g} counted from the Moon`,
  rows: (CLASSICAL_TABLES.fromMoon[g] ?? []).flatMap((raw, i) => (raw ? [[`${ordinal(i + 1)} from the Moon`, raw] as [string, string]] : [])),
  source: 'Charak XVIII, after Manasagari',
})

const SIGN_NOTE: Partial<Record<Graha, string>> = {
  Sun: 'exalted in Mesha, debilitated in Tula', Moon: 'exalted in Vrishabha, debilitated in Vrishchika', Mars: 'exalted in Makara, debilitated in Karka',
  Mercury: 'exalted in Kanya, debilitated in Meena', Jupiter: 'exalted in Karka, debilitated in Makara', Venus: 'exalted in Meena, debilitated in Kanya', Saturn: 'exalted in Tula, debilitated in Mesha',
}
const signBlock = (g: Graha): Block => ({
  type: 'classical',
  title: `${g} by sign: ${SIGN_NOTE[g]}`,
  rows: (CLASSICAL_TABLES.inSign[g] ?? []).map((raw, i) => [SIGN(i), raw] as [string, string]),
  source: 'Charak XIX',
})
const signLine = (g: Graha, sign: number) => parseClassical(CLASSICAL_TABLES.inSign[g]![sign]).text

const SEVEN: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
const NINE: Graha[] = [...SEVEN, 'Rahu', 'Ketu']

const LORDS_RULES: Block[] = [
  { type: 'list', items: [
    '1. **A planet that rules two houses gives results for both.** For Simha lagna, Venus rules the 3rd and the 10th; wherever Venus goes, both effort and career go with it.',
    '2. **Contradictory results cancel.** If one lordship promises gain and the other loss from the same placement, neither shows strongly.',
    '3. **Different (not contradictory) results can both occur.**',
    '4. **Strong planets give full results; weak planets give weak results.** Dignity, combustion, aspects and the D9 decide strength.',
    '5. **Results arrive in the dasha of the planets concerned.**',
    '6. **Read in a modern context.** The 11th lord in the 12th, for example, can mean an elder sibling living abroad, or income from import and export.',
  ] },
]

export const BOOK_LESSONS: Lesson[] = [
  {
    slug: 'results-lords-1', level: 'Vedic', module: R,
    title: 'House lords in the twelve houses I: lords of the 1st to the 6th',
    summary: 'The core Parashari method: follow each house lord to where it sits. The book\'s principles, a worked chart, and the full results for the lords of the 1st to the 6th in every house.',
    minutes: 25,
    blocks: [
      { type: 'p', text: 'Every house has a lord: the planet that rules the sign on it. **Where the lord goes, the matters of its house go.** A lord in another house links the two: the house it rules and the house it occupies. This one technique, applied twelve times, already gives a full first reading of any chart.' },
      { type: 'p', text: 'The book asks you to weigh four things before applying any line below: the planet\'s **natural character**, its **conjunctions and aspects**, its condition in the **divisional charts**, and the **running dasha**, which decides when the promise arrives.' },
      { type: 'h', text: 'The book\'s points to remember' },
      ...LORDS_RULES,
      { type: 'h', text: 'A worked example' },
      { type: 'chart', title: 'Reading the lords of a Simha lagna', spec: ex('Simha', 'Su1 Mo10 Ma9 Me2 Ju5 Ve12 Sa7 Ra11'), highlight: ['Sun', 'Mercury', 'Venus'], caption: [
        `**1st lord Sun in the 1st**: ${lordLine(1, 1)} The lagna lord in its own sign in the lagna is the strongest start a chart can have.`,
        `**2nd lord Mercury in the 2nd**: ${lordLine(2, 2)} Mercury also rules the 11th, so gains and earnings are one theme.`,
        `**10th lord Venus in the 12th**: ${lordLine(10, 12)} Venus also rules the 3rd: ${lordLine(3, 12).toLowerCase()} Two lordships, one placement: both results can occur.`,
      ] },
      { type: 'callout', tone: 'tip', text: 'On your own chart, the **Houses** tab lists each lord with these classical lines under "From the classical texts", and your planet cards show the same lines for each placement.' },
      { type: 'h', text: 'The results, lord by lord' },
      { type: 'p', text: 'Green lines are supportive, amber mixed and red need care. They are traditional indications in our own words; the book itself says never to apply them literally.' },
      lordBlock(1), lordBlock(2), lordBlock(3), lordBlock(4), lordBlock(5), lordBlock(6),
      { type: 'try', text: 'Find your lagna lord on your chart and read its line above. Then do the same for the 2nd lord. How do the two placements fit together?' },
    ],
    quiz: [
      { q: 'A planet ruling two houses gives results for…', options: ['Only the stronger house', 'Both houses', 'Neither', 'Only the house it occupies'], answer: 1, explain: 'Rule 1: both lordships give their results.' },
      { q: 'When do house-lord results arrive?', options: ['At birth', 'In the dasha of the planets concerned', 'Only in transits of Saturn', 'Every year on the birthday'], answer: 1, explain: 'Rule 5: in the relevant dashas.' },
      { q: 'If two lordships of one planet point to contradictory results…', options: ['Both happen fully', 'They cancel', 'The worse one wins', 'The better one wins'], answer: 1, explain: 'Rule 2: contradictory results cancel.' },
    ],
  },
  {
    slug: 'results-lords-2', level: 'Vedic', module: R,
    title: 'House lords in the twelve houses II: lords of the 7th to the 12th',
    summary: 'Partnerships, obstacles, fortune, career, gains and losses: the results for the lords of the 7th to the 12th in every house, with the dusthana principle.',
    minutes: 25,
    blocks: [
      { type: 'p', text: 'The second half of the houses includes three of the most sought-after lords (the 9th of fortune, the 10th of career, the 11th of gains) and two of the most feared (the 8th and 12th). The same rules apply, with one addition: the **dusthana lords** (6th, 8th, 12th) spoil good houses but improve each other.' },
      { type: 'list', items: [
        'The **8th lord** in a good house brings obstacles to it, but in the 6th or 12th it forms Sarala yoga.',
        'The **12th lord** in a good house drains it, but in the 6th or 8th it forms Vimala yoga.',
        'The **9th and 10th lords** improve every house they touch; together they form the strongest raja yoga.',
        'The **11th lord** multiplies what it touches, the **12th** divides it.',
      ] },
      { type: 'chart', title: 'Reading the upper lords of a Mesha lagna', spec: ex('Mesha', 'Su1 Mo4 Ma10 Me2 Ju4 Ve3 Sa11 Ra6'), highlight: ['Jupiter', 'Saturn', 'Venus'], caption: [
        `**9th lord Jupiter in the 4th**: ${lordLine(9, 4)} Jupiter is exalted there, so the result is strong.`,
        `**11th lord Saturn in the 11th**: ${lordLine(11, 11)} Saturn also rules the 10th: ${lordLine(10, 11).toLowerCase()}`,
        `**7th lord Venus in the 3rd**: ${lordLine(7, 3)}`,
      ] },
      lordBlock(7), lordBlock(8), lordBlock(9), lordBlock(10), lordBlock(11), lordBlock(12),
      { type: 'try', text: 'Find your 9th and 10th lords. Are they in good houses? Are they related to each other? That single check says a great deal about fortune and career.' },
    ],
    quiz: [
      { q: 'The 12th lord in the 8th house forms…', options: ['Harsha yoga', 'Vimala yoga', 'Sarala yoga', 'No yoga'], answer: 1, explain: 'Vimala is the 12th lord in the 6th or 8th.' },
      { q: 'Which lord does the book call "the multiplier"?', options: ['The 2nd', 'The 11th', 'The 12th', 'The 5th'], answer: 1, explain: 'The 11th lord multiplies; the 12th divides.' },
    ],
  },
  {
    slug: 'results-planets-houses', level: 'Vedic', module: R,
    title: 'The nine planets in the twelve houses, and from the Moon',
    summary: 'What each planet gives in each house from the lagna, the rule that a significator in its own house can harm it, and Manasagari\'s results counted from the Moon.',
    minutes: 30,
    blocks: [
      { type: 'p', text: 'House-lord results (the previous lessons) depend on what a planet **rules**. Planet-in-house results depend on what a planet **is**. The book: the result comes from the planet\'s own nature meeting the significations of the house, regardless of its lordship, and should be read with modern adjustment.' },
      { type: 'h', text: 'Two principles' },
      { type: 'list', items: [
        '**Malefics do well in the upachaya houses** (3, 6, 10, 11), where their drive becomes effort, competition and gain. Benefics do best in kendras and trikonas.',
        '**Karako bhava nashaya**: a significator placed in its own house of signification can harm it. The book\'s example is the Sun (karaka of the father) in the 9th (the house of the father). Jupiter in the 5th (children) and Venus in the 7th (spouse) are the other classic cases.',
      ] },
      { type: 'chart', title: 'Three placements read from the tables', spec: ex('Karka', 'Su9 Mo1 Ma10 Me9 Ju5 Ve7 Sa3 Ra12'), highlight: ['Sun', 'Jupiter', 'Mars'], caption: [
        `**Sun in the 9th**: ${houseLine('Sun', 9)} Karako bhava nashaya: the father\'s significator in the father\'s house.`,
        `**Jupiter in the 5th**: ${houseLine('Jupiter', 5)}`,
        `**Mars in the 10th**: ${houseLine('Mars', 10)} Mars also has directional strength in the 10th.`,
      ] },
      { type: 'h', text: 'Planets from the lagna' },
      ...NINE.map(houseBlock),
      { type: 'h', text: 'Planets counted from the Moon' },
      { type: 'p', text: 'Manasagari treats the Moon as nearly equal to the lagna and gives its own results counted from the natal Moon. Use them alongside the lagna results, especially when the birth time is uncertain. A few lines the book gives are left out where they predict death or worse.' },
      ...(['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'] as Graha[]).map(moonBlock),
      { type: 'try', text: 'Open your Planets tab. Each planet card shows its house line, its sign line, the aspects it receives and its house from the Moon, all from these tables.' },
    ],
    quiz: [
      { q: 'Planet-in-house results come mainly from…', options: ['What the planet rules', 'The planet\'s own nature and the house', 'The nakshatra only', 'The navamsa'], answer: 1, explain: 'Lordship is read separately; here the planet\'s nature meets the house.' },
      { q: 'Karako bhava nashaya is illustrated in the book by…', options: ['Mars in the 3rd', 'The Sun in the 9th', 'Venus in the 12th', 'Saturn in the 11th'], answer: 1, explain: 'The Sun, karaka of the father, in the 9th house of the father.' },
      { q: 'Malefics generally do well in…', options: ['Kendras', 'Upachaya houses (3, 6, 10, 11)', 'The 8th', 'The 5th'], answer: 1, explain: 'Their drive turns into effort and gain in the houses of growth.' },
    ],
  },
  {
    slug: 'results-planets-signs', level: 'Vedic', module: R,
    title: 'The seven planets in the twelve signs',
    summary: 'How a sign modifies the planet in it: the book\'s results for each planet in each sign, how to read them today, and how aspects change them.',
    minutes: 28,
    blocks: [
      { type: 'p', text: 'A sign colours the planet in it. The same Mars is impulsive in Mesha, steady in Makara, emotional in Karka. The book gives a result for each planet in each sign, and a second grid for the effect of every other planet\'s aspect on it, grouped by sign.' },
      { type: 'callout', tone: 'warn', text: 'The book stresses that these results must not be applied literally. Read them in today\'s terms: "favour from the ruler" can mean promotion in a government job, and "loss of the spouse" can mean separation. Lines that predict death or caste have been left out or softened.' },
      { type: 'h', text: 'How to read a sign result' },
      { type: 'list', items: [
        '**Dignity first**: exaltation and own sign strengthen the planet; debilitation and enemy signs weaken it. A weak planet in a "good" sign line gives less.',
        '**The sign lord matters**: a planet in a friend\'s sign is comfortable; in an enemy\'s sign it is restrained.',
        '**Aspects modify the line**: the book\'s aspect grid says, for example, what Jupiter\'s aspect on the Moon in Vrishabha adds. Your planet cards show these aspect lines when they apply.',
        '**Combine with the house**: the sign says *how* the planet acts; the house says *where* in life.',
      ] },
      { type: 'chart', title: 'Sign results in one chart', spec: ex('Tula', 'Su11 Mo8 Ma4 Me12 Ju10 Ve1 Sa4 Ra6'), highlight: ['Moon', 'Mars', 'Venus'], caption: [
        `**Moon in Vrishabha** (exalted): ${signLine('Moon', 1)}`,
        `**Mars in Makara** (exalted): ${signLine('Mars', 9)}`,
        `**Venus in Tula** (own sign): ${signLine('Venus', 6)}`,
      ] },
      ...SEVEN.map(signBlock),
      { type: 'try', text: 'Read the sign line for your Moon and your lagna lord. Then check, on your planet cards, which aspects they receive.' },
    ],
    quiz: [
      { q: 'Where is Saturn exalted?', options: ['Makara', 'Tula', 'Kumbha', 'Mesha'], answer: 1, explain: 'Saturn is exalted in Tula and debilitated in Mesha.' },
      { q: 'The sign a planet occupies mainly tells you…', options: ['When it gives results', 'How it acts', 'Which house it rules', 'Its nakshatra lord'], answer: 1, explain: 'Sign colours how the planet acts; the house says where.' },
    ],
  },

  {
    slug: 'practice-health', level: 'Vedic', module: P,
    title: 'Health and longevity in the classical texts',
    summary: 'How the book weighs a chart\'s resilience: the lagna, its lord, the Moon and the 8th; body parts by house; planets and the doshas; and why it warns against predicting lifespan.',
    minutes: 18,
    blocks: [
      { type: 'callout', tone: 'warn', text: 'This lesson is for study. The book itself says diagnosis belongs to physicians and that astrology cannot replace medical training, and that lifespan formulas are often wrong. Astro Life never shows health or lifespan predictions, and nothing here should guide a medical decision.' },
      { type: 'p', text: 'The book\'s approach is to weigh a chart\'s inherent **strength** (protection and recovery) against its **weak points**, which tend to show in the dashas that activate them.' },
      { type: 'h', text: 'What strengthens and what weakens' },
      { type: 'table', headers: ['Factor', 'Strengthens', 'Weakens'], rows: [
        ['Lagna', 'Occupied or aspected by its own lord, natural benefics or strong planets; free of malefics', 'No influence from its lord or benefics; malefic occupation or aspect'],
        ['Lagna lord', 'Strong in the D1 and vargas; with benefics; in good houses. Vargottama is resilient', 'Weak or debilitated; with malefics; in the 6th, 8th or 12th'],
        ['Moon', 'Strong and unafflicted', 'In the 6th, 8th or 12th, or afflicted'],
        ['Kendras and trikonas', 'Benefics there', 'Malefics there'],
        ['Houses 3, 6, 11', 'Natural malefics there protect in general', 'Their own dashas can still disturb health'],
        ['8th house and lord', 'A strong 8th lord with benefic influence; Saturn in the 8th; strong SAV in the 1st and 8th', 'Other malefics in the 8th; weak SAV in the 1st and 8th'],
        ['Either side of the lagna', 'Benefics on both sides (Shubha Kartari)', 'Malefics on both sides (Papa Kartari), especially a retrograde one in the 2nd'],
      ] },
      { type: 'h', text: 'Body parts by house' },
      { type: 'table', headers: ['House', 'Area', 'House', 'Area'], rows: [
        ['1', 'Head', '7', 'Navel region'], ['2', 'Face, right eye', '8', 'Reproductive organs'], ['3', 'Shoulders, arms, right ear', '9', 'Hips and thighs'],
        ['4', 'Chest', '10', 'Knees'], ['5', 'Heart and stomach', '11', 'Legs, left ear'], ['6', 'Intestines', '12', 'Feet, left eye'],
      ] },
      { type: 'p', text: 'The rising drekkana refines this into three bands of the body: head to mouth, neck to navel, and pelvis to feet.' },
      { type: 'h', text: 'Planets and the doshas of Ayurveda' },
      { type: 'table', headers: ['Planet', 'Dosha', 'Associated areas'], rows: [
        ['Sun', 'Pitta', 'Heart, eyes, gall bladder'], ['Moon', 'Kapha', 'Mind, breast, menstrual cycle'], ['Mars', 'Pitta', 'Accidents, surgery, burns, bone marrow'],
        ['Mercury', 'All three', 'Nerves, skin'], ['Jupiter', 'Kapha', 'Liver, metabolism'], ['Venus', 'Vata and Kapha', 'Urinary and reproductive systems, eyesight'],
        ['Saturn', 'Vata', 'Chronic conditions, legs and feet'], ['Rahu, Ketu', '', 'Chronic conditions, poisons, infections'],
      ] },
      { type: 'h', text: 'Timing in the book' },
      { type: 'list', items: [
        'Periods it flags: dashas of functional malefics for the lagna; of the 6th, 8th and 12th lords; of retrograde, combust or debilitated planets that do not recover in the vargas; of planets on the Rahu-Ketu axis.',
        'Its rule for sequences: a good period followed by a bad one marks **onset**; a bad one followed by a good one marks **recovery**; two bad periods in a row mean a **prolonged** course.',
        'Data it requires before any judgement: an accurate D1 with cusps; the D3, D9, D12 and D30; Vimshottari to the pratyantar level; a second dasha system; Ashtakavarga; the annual chart; and transits.',
      ] },
      { type: 'h', text: 'Longevity: what the texts attempt, and the book\'s verdict' },
      { type: 'p', text: 'The classical texts sort life into spans (balarishta, yogarishta, short, medium, full) and give formulas (Pindayu, Amshayu, Nisargayu) and a three-pair method based on sign types. Charak explains them and then concludes that the mathematical methods are often wrong in real charts, that combining span with dashas works better, and that any statement about lifespan calls for great caution. We teach the principle and leave the formulas out.' },
      { type: 'h', text: 'What the chart can usefully show' },
      { type: 'list', items: [
        'Which periods may need more rest and care, so that routines and check-ups can be planned.',
        'Which areas of the body the tradition links to the chart\'s weak points, as a prompt for healthy habits, not a diagnosis.',
        'Where the chart is strong: a strong lagna, lagna lord and Moon describe resilience and recovery.',
      ] },
    ],
    quiz: [
      { q: 'According to the book, who should diagnose illness?', options: ['An astrologer', 'A physician', 'Anyone with the chart', 'The annual chart'], answer: 1, explain: 'Charak: diagnosis belongs to physicians.' },
      { q: 'A bad dasha followed by a good one marks…', options: ['Onset', 'Recovery', 'A prolonged course', 'Nothing'], answer: 1, explain: 'Bad then good marks recovery.' },
      { q: 'What is the book\'s verdict on mathematical longevity formulas?', options: ['Always exact', 'Often wrong in real charts', 'Only for Mesha lagna', 'Better than dashas'], answer: 1, explain: 'It calls them unreliable and urges great caution.' },
    ],
  },

  {
    slug: 'practice-varshaphal', level: 'Vedic', module: P,
    title: 'Varshaphala: reading the annual chart',
    summary: 'The solar-return chart in the Tajika system: when it is cast, the muntha, Tajika aspects, the year lord, Mudda dasha, Dwijanma years and the book\'s rules for money, children, health, marriage and career.',
    minutes: 22,
    blocks: [
      { type: 'p', text: 'The **annual chart** (varshaphala) is cast for the moment each year when the Sun returns to its exact natal sidereal longitude (varsha-pravesha). The book reads it as a refined transit: it shows how the coming year delivers what the birth chart and the dashas promise, and **can only bring out what the birth chart promises**. The birth chart always comes first.' },
      { type: 'h', text: 'When the year begins' },
      { type: 'p', text: 'A sidereal year is 365 days 6 hours 9 minutes 10 seconds. Dropping whole weeks leaves **1 day 6 h 9 m 10 s**, the *dhruvanka*. Add one dhruvanka per completed year to the birth weekday and time (dropping whole weeks) and you get the weekday and time of the return.' },
      { type: 'example', title: 'Worked example: the 30th birthday', text: ['30 × (1 d 6 h 9 m 10 s) = 30 d + 180 h + 270 m + 300 s = 37 d 16 h 35 m.', 'Drop whole weeks: 37 days is 5 weeks and 2 days, so the shift is **2 days 16 h 35 m**.', 'Born on a Monday at 06:00, the 30th solar return falls on a **Wednesday at about 22:35**, on or within a day of the birthday.', 'Astro Life computes the exact moment astronomically on the Year ahead page.'] },
      { type: 'h', text: 'The muntha' },
      { type: 'p', text: 'The **muntha** starts in the natal lagna sign and moves one sign a year. Muntha sign = natal lagna sign + completed years (counted round the zodiac). For a Simha lagna at 30 completed years: Simha is the 5th sign; 5 + 30 = 35; 35 less 24 = 11: **Kumbha**.' },
      { type: 'table', headers: ['Muntha in the annual chart', 'Reading'], rows: [
        ['9th, 10th or 11th', 'Very auspicious'],
        ['1st, 2nd, 3rd or 5th', 'Good, through one\'s own effort'],
        ['4th, 6th, 7th, 8th or 12th', 'Inauspicious'],
        ['Muntha lord in the 4th, 6th, 7th, 8th or 12th', 'Adverse; good elsewhere'],
      ] },
      { type: 'h', text: 'Features of the Tajika system' },
      { type: 'list', items: [
        '**Tajika aspects** are by house distance. Planets 3, 5, 9 or 11 apart are friendly; 1, 4, 7 or 10 apart inimical; 2, 6, 8 or 12 apart do not aspect.',
        '**The year lord** (varshesha) is generally the strongest planet influencing the year\'s lagna, judged by Tajika strength.',
        '**Mudda dasha** is Vimshottari compressed into one year, so each planet rules a few weeks.',
        '**Sixteen Tajika yogas**, based on exact degrees, motion and orbs, drive detailed predictions.',
        '**Sahams** are sensitive points (one for each matter, such as marriage or career) calculated from the lagna and planet longitudes.',
      ] },
      { type: 'h', text: 'Reading the year' },
      { type: 'table', headers: ['Rule', 'Reading'], rows: [
        ['The house of the annual chart holding the natal lagna sign', 'Activated this year'],
        ['The natal house whose sign rises in the annual chart', 'Activated this year'],
        ['Dwijanma: the natal lagna sign rises again', 'Adverse, worse when the cusps are within 1°, the natal Moon nakshatra recurs, or the Moon is in the 6th with Jupiter in the 8th. Eased by a strong lagna lord, muntha lord and year lord, and benefics in kendras'],
        ['The natal 6th or 8th sign rising', 'Inauspicious, especially for health'],
        ['The natal lagna lord well placed', 'A comfortable year'],
        ['A natal-kendra malefic occupying the annual lagna', 'Adverse (a benefic in the same position is good)'],
      ] },
      { type: 'table', headers: ['Area', 'The book\'s rules'], rows: [
        ['Money', 'Malefics in the annual 2nd, especially with a movable lagna: loss of money. A weak planet in the 11th: loss of wealth.'],
        ['Children', 'Year lord Jupiter in the 5th or 11th; the natal Jupiter sign rising with a supporting dasha; a strong lagna lord with the 5th lord in the 5th. Retrograde Mars in the 5th is unfavourable.'],
        ['Health', 'A direct malefic in the 12th with a retrograde one in the 2nd; the natal Saturn sign rising with Saturn aspecting it inimically; the year lord with Mars in the 8th; a combust natal lagna lord in the 8th; afflicted Mars or Saturn in the 10th.'],
        ['Marriage', 'The 1st and 7th lords, or Venus and Mars, in suitable Tajika yogas, if the birth chart promises marriage. A strong 5th lord in the 7th.'],
        ['Career', 'The Sun in the 10th: very good for work; a strong Sun restores lost status. A strong Sun in the 11th: favour from authority. Strong malefics under benefic influence do well in the 10th.'],
      ] },
      { type: 'callout', tone: 'tip', text: 'The **Year ahead** page of your chart casts this year\'s and next year\'s annual chart, finds the muntha and year lord, runs the Mudda dasha month by month, and applies these rules to each area of life.' },
    ],
    quiz: [
      { q: 'The annual chart is cast for…', options: ['Each new Moon', 'The Sun\'s return to its natal sidereal longitude', 'January 1st', 'The birthday at noon'], answer: 1, explain: 'Varsha-pravesha, the solar return.' },
      { q: 'Muntha in the 10th of the annual chart is…', options: ['Inauspicious', 'Very auspicious', 'Neutral', 'Only good for health'], answer: 1, explain: 'Muntha in the 9th, 10th or 11th is very auspicious.' },
      { q: 'In Tajika, planets 4 or 7 houses apart are…', options: ['Friendly', 'Inimical', 'Not in aspect', 'Combust'], answer: 1, explain: '1, 4, 7, 10 apart: inimical aspects.' },
    ],
  },

  {
    slug: 'practice-muhurta', level: 'Vedic', module: P,
    title: 'Muhurta: choosing a good time to begin',
    summary: 'The five limbs applied to elections: tithi groups and strength, Siddha, Dagdha and Krakacha tithis, weekday uses, nakshatra classes, special yogas, Taara, Panchaka, avoided yogas and karanas, the lagna and gandanta.',
    minutes: 26,
    blocks: [
      { type: 'p', text: 'Every undertaking has a "birth time", and the chart of that moment shows how the work will go. **Muhurta** is the art of choosing it. No moment is flawless, so the aim is the best moment available, adapted to modern life.' },
      { type: 'h', text: 'Tithi: the lunar day' },
      { type: 'table', headers: ['Group', 'Tithis', 'Suited to'], rows: [
        ['Nanda (joy)', '1, 6, 11', 'Arts, farming, festivals, building'],
        ['Bhadra (good)', '2, 7, 12', 'Marriage, ceremonies, travel, vehicles'],
        ['Jaya (victory)', '3, 8, 13', 'Contests, building, medicine, farming'],
        ['Rikta (empty)', '4, 9, 14', 'Harsh acts only; avoid auspicious events'],
        ['Poorna (full)', '5, 10, 15, 30', 'Ceremonies, marriage, travel, taking office'],
      ] },
      { type: 'list', items: [
        '**Moon strength**: favourable from Shukla 10 to Krishna 5 (the Moon near full); average from 5 to 10 of either half; unfavourable from Krishna 10 to Shukla 5 (near new).',
        '**Siddha tithis** (good, offsetting other flaws): Nanda on Friday, Bhadra on Wednesday, Jaya on Tuesday, Rikta on Saturday, Poorna on Thursday.',
        '**Dagdha tithis** (burnt, avoid): Nanda on Sunday or Tuesday, Bhadra on Monday or Friday, Jaya on Wednesday, Rikta on Thursday, Poorna on Saturday.',
        '**Krakacha** (avoid): the weekday number (Sunday = 1) plus the tithi number equals 13, for example Sunday with tithi 12 or Saturday with tithi 6.',
      ] },
      { type: 'h', text: 'Weekday' },
      { type: 'table', headers: ['Day', 'Suited to'], rows: [
        ['Sunday', 'Taking office, fire rituals, starting treatment, travel, gold and copper'],
        ['Monday', 'Silver, pearls, planting, water, farming, food, music, clothes'],
        ['Tuesday', 'Fire, weapons, surgery, harsh acts'],
        ['Wednesday', 'Arts, writing, learning, marriage'],
        ['Thursday', 'Religious acts, ceremonies, travel, medicine, vehicles, building'],
        ['Friday', 'Arts, decoration, land, clothes, shopping, festivals'],
        ['Saturday', 'Building and moving house, initiation, long-lasting work'],
      ] },
      { type: 'p', text: 'An act suited to one weekday can also be done in that weekday lord\'s **hora** on another day. For travel, avoid going **east** on Monday or Saturday, **south** on Thursday, **west** on Friday or Sunday and **north** on Tuesday or Wednesday (disha shool).' },
      { type: 'h', text: 'Nakshatra' },
      { type: 'table', headers: ['Class', 'Nakshatras', 'Use'], rows: [
        ['Dhruva (fixed)', 'Rohini, the three Uttaras', 'Lasting results: foundations, house-building'],
        ['Chara (movable)', 'Punarvasu, Swati, Shravana, Dhanishtha, Shatabhisha', 'Travel, vehicles'],
        ['Kshipra (swift)', 'Ashwini, Pushya, Hasta, Abhijit', 'Shopping, learning, arts, medicine'],
        ['Mridu (gentle)', 'Mrigashira, Chitra, Anuradha, Revati', 'Arts, friendship, clothes, romance'],
        ['Mishra (mixed)', 'Krittika, Vishakha', 'Routine work'],
        ['Krura (harsh)', 'Bharani, Magha, the three Poorvas', 'Harsh acts only'],
        ['Teekshna (sharp)', 'Ardra, Ashlesha, Jyeshtha, Moola', 'Harsh acts only'],
      ] },
      { type: 'list', items: [
        '**Siddha yoga** (good for all acts): Moola on Sunday, Shravana on Monday, Uttara Bhadrapada on Tuesday, Krittika on Wednesday, Punarvasu on Thursday, Poorva Phalguni on Friday, Swati on Saturday.',
        '**Amrita-siddhi** (success): Hasta on Sunday, Shravana on Monday, Ashwini on Tuesday, Anuradha on Wednesday, Pushya on Thursday, Revati on Friday, Rohini on Saturday.',
        '**Mrityu yoga** (avoid, especially for travel): Anuradha on Sunday, Uttara Ashadha on Monday, Shatabhisha on Tuesday, Ashwini on Wednesday, Mrigashira on Thursday, Ashlesha on Friday, Hasta on Saturday.',
        '**Panchaka**: the Moon in Kumbha or Meena (second half of Dhanishtha to the end of Revati). Avoid travel south, roofing and making beds.',
      ] },
      { type: 'h', text: 'Taara: making it personal' },
      { type: 'p', text: 'Count from your **birth nakshatra** to the day\'s nakshatra and take the remainder after dividing by 9: 1 Janma, 2 Sampat, 3 Vipat, 4 Kshema, 5 Pratyari, 6 Sadhaka, 7 Vadha, 8 Mitra, 9 Ati-mitra. **3, 5 and 7 are unfavourable.** The book: use Taara in the waning half and the Moon\'s strength in the waxing half.' },
      { type: 'example', title: 'Worked example: a fine day that is not fine for everyone', text: [
        'A Thursday, Shukla 5 (a Poorna tithi), with the Moon in Pushya.',
        'Poorna on Thursday is a **Siddha tithi**. Pushya on Thursday is **Amrita-siddhi** and also Sarvartha-siddhi. Pushya is a swift nakshatra. Thursday suits ceremonies, travel and medicine. A very good day in general.',
        'For someone born in **Rohini** (the 4th nakshatra): from Rohini to Pushya (the 8th) is 5 counting inclusively, so the Taara is **5, Pratyari**: unfavourable for that person.',
        'It is the waxing half, so the book gives more weight to the Moon\'s strength (average on Shukla 5) than to Taara. Most would still go ahead, choosing a good lagna and hora.',
      ] },
      { type: 'h', text: 'Yoga, karana, lagna and gandanta' },
      { type: 'list', items: [
        '**Panchang yogas to avoid**: Vyatipata and Vaidhriti entirely; the first half of Parigha; the first 72 minutes of Vishkumbha and Vajra; the first 144 minutes of Atiganda and Ganda.',
        '**Vishti (Bhadra) karana**: avoid for auspicious acts.',
        '**The lagna of the moment**: benefics in kendras and trikonas, malefics in the 3rd, 6th and 11th; check the navamsa lagna too. Fixed lagnas suit lasting works, movable ones travel and change.',
        '**Gandanta**: avoid the junctions of water and fire signs (the last minutes of Karka, Vrishchika and Meena and the first of Simha, Dhanu and Mesha), the matching nakshatra junctions (Revati-Ashwini, Ashlesha-Magha, Jyeshtha-Moola) and the tithi junction (the last 24 minutes of a Poorna tithi and the first 24 of a Nanda).',
        '**Abhijit muhurta**: 24 minutes either side of local noon, good for starting any work when nothing better is available.',
        '**Personalise with Ashtakavarga**: choose a lagna from which the house of the matter (4th for vehicles, 5th education, 7th partnership, 10th work) has the most bindus.',
      ] },
      { type: 'callout', tone: 'tip', text: 'The **Panchang** page shows each day\'s limbs, Rahu Kaal, Choghadiya and Hora, and its "Is today good for starting something?" board applies these rules, including your Taara once you pick your birth star.' },
    ],
    quiz: [
      { q: 'Which tithi group should be avoided for auspicious events?', options: ['Nanda', 'Bhadra', 'Rikta', 'Poorna'], answer: 2, explain: 'Rikta (4, 9, 14) suits only harsh acts.' },
      { q: 'Born in Ashwini, the day\'s nakshatra is Krittika. The Taara is…', options: ['Sampat (2)', 'Vipat (3), unfavourable', 'Kshema (4)', 'Janma (1)'], answer: 1, explain: 'Ashwini to Krittika is 3 counting inclusively: Vipat.' },
      { q: 'Abhijit muhurta falls around…', options: ['Sunrise', 'Local noon', 'Sunset', 'Midnight'], answer: 1, explain: '24 minutes either side of local noon.' },
    ],
  },

  {
    slug: 'practice-matching-tables', level: 'Vedic', module: 'Applied Jyotish',
    title: 'Ashtakoota matching in depth: the full tables and a worked example',
    summary: 'Every table used in the 36-point method as the book gives it (varna, vashya, taara, yoni, graha maitri, gana, bhakoota, naadi), the exceptions, Mangal dosha balance, and the book\'s worked example scoring 24.',
    minutes: 28,
    blocks: [
      { type: 'p', text: 'The ashtakoota ("eight factors") method uses only the **sign and nakshatra of each partner\'s Moon**. It checks mental compatibility above all. The book adds that a match based on genuine mutual love needs no matching, and that a full assessment also looks at each chart alone: the promise of married life and children, the dashas, and the D9 and D7.' },
      { type: 'table', headers: ['Koota', 'Points', 'What it compares'], rows: [
        ['Varna', '1', 'Spiritual temperament (Moon-sign groups)'], ['Vashya', '2', 'Mutual influence (sign groups)'], ['Taara', '3', 'Birth-star counts'],
        ['Yoni', '4', 'Instinctive nature (animal of the nakshatra)'], ['Graha maitri', '5', 'Friendship of the Moon-sign lords'], ['Gana', '6', 'Temperament (deva, manushya, rakshasa)'],
        ['Bhakoota', '7', 'Distance between the Moon signs'], ['Naadi', '8', 'Constitution (three nakshatra groups)'],
      ] },
      { type: 'p', text: 'The book\'s verdicts: 24 to 36 excellent; 12 to 24 middling; below 12 not recommended. Elsewhere it calls 18 or more acceptable, and says strict adherence is not needed when both charts are otherwise good.' },
      { type: 'h', text: 'Varna (1 point)' },
      { type: 'p', text: 'Moon signs fall into four groups: Brahmin (Karka, Vrishchika, Meena), Kshatriya (Mesha, Simha, Dhanu), Vaishya (Vrishabha, Kanya, Makara) and Shudra (Mithuna, Tula, Kumbha). 1 point if the groom\'s group is the same as or above the bride\'s.' },
      { type: 'h', text: 'Vashya (2 points)' },
      { type: 'p', text: 'Groups: Chatushpada (four-footed: Mesha, Vrishabha, second half of Dhanu, first half of Makara); Manava (human: Mithuna, Kanya, Tula, first half of Dhanu, Kumbha); Jalachara (water: Karka, Meena, second half of Makara); Vanachara (wild: Simha); Keeta (insect: Vrishchika).' },
      { type: 'table', headers: ['Bride ↓ / Groom →', 'Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta'], rows: [
        ['Chatushpada', '2', '1', '1', '½', '1'], ['Manava', '1', '2', '½', '0', '1'], ['Jalachara', '1', '½', '2', '1', '1'], ['Vanachara', '0', '0', '0', '2', '0'], ['Keeta', '1', '1', '1', '0', '2'],
      ] },
      { type: 'h', text: 'Taara (3 points)' },
      { type: 'p', text: 'Count from the bride\'s nakshatra to the groom\'s (inclusive) and divide by 9; then from the groom\'s to the bride\'s. Each count whose remainder is not 3, 5 or 7 earns 1½ points.' },
      { type: 'h', text: 'Yoni (4 points)' },
      { type: 'table', headers: ['Nakshatras', 'Yoni', 'Bitter enemy'], rows: [
        ['Ashwini, Shatabhisha', 'Horse', 'Buffalo'], ['Bharani, Revati', 'Elephant', 'Lion'], ['Krittika, Pushya', 'Ram', 'Monkey'], ['Rohini, Mrigashira', 'Serpent', 'Mongoose'],
        ['Ardra, Moola', 'Dog', 'Deer'], ['Punarvasu, Ashlesha', 'Cat', 'Rat'], ['Magha, Poorva Phalguni', 'Rat', 'Cat'], ['Uttara Phalguni, Uttara Bhadrapada', 'Cow', 'Tiger'],
        ['Hasta, Swati', 'Buffalo', 'Horse'], ['Chitra, Vishakha', 'Tiger', 'Cow'], ['Anuradha, Jyeshtha', 'Deer', 'Dog'], ['Poorva Ashadha, Shravana', 'Monkey', 'Ram'],
        ['Uttara Ashadha, Abhijit', 'Mongoose', 'Serpent'], ['Dhanishtha, Poorva Bhadrapada', 'Lion', 'Elephant'],
      ] },
      { type: 'p', text: 'Same yoni scores 4, friendly 3, neutral 2, inimical 1 and bitter enemies 0. The full 14 × 14 table the book gives is symmetric, and Astro Life uses it exactly.' },
      { type: 'h', text: 'Graha maitri (5 points)' },
      { type: 'table', headers: ['Bride ↓ / Groom →', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'], rows: [
        ['Sun', '5', '5', '5', '4', '5', '0', '0'], ['Moon', '5', '5', '4', '1', '4', '½', '½'], ['Mars', '5', '4', '5', '½', '5', '3', '½'], ['Mercury', '4', '1', '½', '5', '½', '5', '4'],
        ['Jupiter', '5', '4', '5', '½', '5', '½', '3'], ['Venus', '0', '½', '3', '5', '½', '5', '5'], ['Saturn', '0', '½', '½', '4', '3', '5', '5'],
      ] },
      { type: 'h', text: 'Gana (6 points)' },
      { type: 'list', items: [
        '**Deva**: Ashwini, Mrigashira, Punarvasu, Pushya, Hasta, Swati, Anuradha, Shravana, Revati.',
        '**Manushya**: Bharani, Rohini, Ardra, the three Poorvas, the three Uttaras.',
        '**Rakshasa**: Krittika, Ashlesha, Magha, Chitra, Vishakha, Jyeshtha, Moola, Dhanishtha, Shatabhisha.',
      ] },
      { type: 'table', headers: ['Bride ↓ / Groom →', 'Deva', 'Manushya', 'Rakshasa'], rows: [['Deva', '6', '5', '1'], ['Manushya', '6', '6', '0'], ['Rakshasa', '0', '0', '6']] },
      { type: 'h', text: 'Bhakoota (7 points)' },
      { type: 'p', text: 'Moon signs 2/12, 5/9 or 6/8 from each other score 0; any other distance scores 7. The book softens the rule:' },
      { type: 'list', items: [
        'A 6/8 pair is not too bad when the lords are friendly: the 6th counted from an even sign, or the 8th from an odd sign.',
        'A 2/12 pair is much eased when the two sign lords are friends.',
        'The same Moon sign is good when the two nakshatras differ.',
      ] },
      { type: 'h', text: 'Naadi (8 points)' },
      { type: 'list', items: [
        '**Adya**: Ashwini, Ardra, Punarvasu, Uttara Phalguni, Hasta, Jyeshtha, Moola, Shatabhisha, Poorva Bhadrapada.',
        '**Madhya**: Bharani, Mrigashira, Pushya, Poorva Phalguni, Chitra, Anuradha, Poorva Ashadha, Dhanishtha, Uttara Bhadrapada.',
        '**Antya**: Krittika, Rohini, Ashlesha, Magha, Swati, Vishakha, Uttara Ashadha, Shravana, Revati.',
        'The same naadi scores 0, different naadis 8. **Exceptions**: no naadi dosha when the Moon sign is the same but the nakshatras differ, or the nakshatra is the same but the Moon signs differ.',
      ] },
      { type: 'h', text: 'Mangal dosha in matching' },
      { type: 'p', text: 'Mars in the 1st, 4th, 7th, 8th or 12th from the lagna or Moon is cancelled when **both** charts have it, or when the other chart has a malefic (the Sun, Saturn, Rahu or Ketu) in one of those houses. More generally, malefics in these houses should be matched in number by the partner\'s chart; best of all is a malefic in the same house as the other\'s Mars.' },
      { type: 'example', title: 'The book\'s worked example: 24 points', text: [
        'Groom: Moon in **Moola** (early Dhanu). Bride: Moon in **Uttara Bhadrapada** (Meena).',
        '**Varna 0**: the groom is Kshatriya (Dhanu), the bride Brahmin (Meena), so the groom\'s group is lower.',
        '**Vashya ½**: early Dhanu is Manava, Meena is Jalachara; the table gives ½.',
        '**Taara 1½**: one of the two counts falls on an unfavourable remainder.',
        '**Yoni 2**: Dog (Moola) with Cow (Uttara Bhadrapada) is neutral.',
        '**Graha maitri 5**: both Moon signs are ruled by Jupiter.',
        '**Gana 0**: the groom is Rakshasa, the bride Manushya.',
        '**Bhakoota 7**: Dhanu and Meena are 4/10 from each other, a good distance.',
        '**Naadi 8**: Moola is Adya, Uttara Bhadrapada Madhya: different.',
        '**Total 24 of 36**: acceptable. The groom\'s Mars in the 12th is balanced by the bride\'s Rahu in the 8th. Astro Life\'s test suite reproduces this example exactly.',
      ] },
      { type: 'callout', tone: 'tip', text: 'The **Match** page scores all eight kootas with these tables, shows the exceptions it applied, checks Mangal dosha balance across both charts and adds the ten South Indian poruthams.' },
    ],
    quiz: [
      { q: 'Same naadi but different Moon signs and the same nakshatra…', options: ['Scores 0, no exception', 'Is an exception: no naadi dosha', 'Doubles the score', 'Cancels the whole match'], answer: 1, explain: 'Same nakshatra with different Moon signs is a naadi exception.' },
      { q: 'Bride Rakshasa, groom Deva. Gana points?', options: ['6', '5', '1', '0'], answer: 3, explain: 'The table gives 0 for a Rakshasa bride with a Deva groom.' },
      { q: 'Mangal dosha is cancelled in matching when…', options: ['Only one chart has it', 'Both charts have it, or the other has a malefic in those houses', 'The wedding is on a Tuesday', 'Venus is retrograde'], answer: 1, explain: 'Matching dosha with dosha, or with another malefic in the same houses.' },
    ],
  },

  {
    slug: 'practice-prashna', level: 'Vedic', module: P,
    title: 'Prashna: answering a question from the moment it is asked',
    summary: 'Horary astrology in the book: the general rules, the four kendras for different questions, sign types, and its specific rules for travel, illness and lost items.',
    minutes: 15,
    blocks: [
      { type: 'p', text: '**Prashna** casts a chart for the moment a question is asked. It answers that question only and is not used for long-range prediction. It is often combined with Tajika yogas.' },
      { type: 'h', text: 'General rules' },
      { type: 'list', items: [
        'Benefics in kendras and trikonas, and malefics in the 3rd, 6th and 11th (out of the kendras, trikonas and the 8th), favour the matter.',
        'A house occupied or aspected by its own lord or by benefics prospers.',
        'The lagna lord and the lord of the house asked about (the *karyesha*) in their own signs, in each other\'s signs, aspecting their own signs or each other: success.',
        '**Movable** lagna: change, for better or worse. **Fixed** lagna: no change. **Dual**: the first half acts as fixed, the second as movable. Fixed matters (house, land, marriage) favour a fixed lagna; change (transfer, recovery, a return) favours a movable one.',
        'For several questions at once: judge the 1st from the lagna, the 2nd from the Moon, the 3rd from the Sun, the 4th from Jupiter, the 5th from the stronger of Mercury and Venus.',
      ] },
      { type: 'h', text: 'The four kendras for each kind of question' },
      { type: 'table', headers: ['Question', '1st', '4th', '7th', '10th'], rows: [
        ['General', 'Change of position', 'Success', 'Return', 'Absence from home'],
        ['Illness', 'Physician', 'Medicine', 'The disease', 'The patient'],
        ['Traveller', 'The traveller', 'Wellbeing', 'The road, the return', 'Absence'],
        ['Lost item', 'The person asking', 'The item', 'The one who took it', 'The authorities'],
        ['Litigation', 'The litigant', 'The verdict', 'The opponent', 'The court'],
      ] },
      { type: 'h', text: 'Specific rules from the book' },
      { type: 'list', items: [
        '**Business**: good with a benefic in the lagna, a benefic\'s navamsa rising, or the lagna and its navamsa both in head-rising signs (Mithuna, Simha, Kanya, Tula, Vrishchika, Kumbha).',
        '**Travel**: Jupiter and Venus in the 2nd and 3rd, the traveller returns; in the 4th, returns soon. Planets on both sides of the lagna, the Moon or the 7th: the planned journey may not happen.',
        '**Illness**: recovery is favoured by a benefic in the lagna with benefics in the 3rd, 6th, 9th and 11th, or Jupiter and Venus in kendras. The Moon in the 8th with only malefic aspects is a poor sign.',
        '**Lost items**: a fixed or vargottama lagna points to someone in the household; a movable lagna to a stranger. The rising drekkana places the item: first, at the entrance; second, inside; third, at the back.',
        '**Sincerity of the question**: a benefic in the lagna, or Mercury, Jupiter or the Moon aspecting the 7th, shows a sincere question.',
      ] },
      { type: 'chart', title: 'A question about a job transfer', spec: ex('Karka', 'Su10 Mo1 Ma6 Me10 Ju4 Ve11 Sa3 Ra9'), highlight: ['Moon', 'Mars', 'Jupiter'], caption: [
        'The question: "Will my transfer go through?" Change favours a **movable lagna**, and Karka is movable.',
        'The lagna lord, the **Moon**, is in the lagna in its own sign. The 10th (career) lord, **Mars**, is in the 6th (service), an upachaya.',
        'Jupiter, a benefic, is in Tula, the 4th house: the house of success in the general scheme, and a kendra. Benefics in kendras favour the matter.',
        'Reading: the matter moves, and the outlook is good, subject to the 10th lord\'s condition.',
      ] },
    ],
    quiz: [
      { q: 'A question about whether something will change favours…', options: ['A fixed lagna', 'A movable lagna', 'The 8th house', 'No lagna'], answer: 1, explain: 'Movable lagnas show change.' },
      { q: 'In an illness question, the 7th house shows…', options: ['The physician', 'The disease', 'The medicine', 'The patient'], answer: 1, explain: '1 physician, 4 medicine, 7 disease, 10 patient.' },
    ],
  },

  {
    slug: 'practice-gochara', level: 'Vedic', module: P,
    title: 'Gochara in depth: transit results, vedha and Sade Sati',
    summary: 'The book\'s full transit tables: favourable houses and their vedha (obstruction) partners, results for each planet in each house from the Moon, the modifiers, birth-star transits and Sade Sati.',
    minutes: 24,
    blocks: [
      { type: 'p', text: 'The book\'s principle: **the birth chart holds the promise, the dasha unfolds it, and transits time it.** Transits never override the chart or the dasha. The classical texts count transits from the natal **Moon**; the author finds that counting from the **lagna** also works and is more personal, so apply both.' },
      { type: 'h', text: 'Favourable houses and vedha' },
      { type: 'p', text: 'Each favourable house has a partner **vedha** house. A planet transiting the vedha house blocks the good result; likewise a planet in the favourable house blocks the bad result of a transit through the vedha house. The Sun and Saturn do not obstruct each other, nor do the Moon and Mercury.' },
      { type: 'table', headers: ['Planet', 'Favourable houses from the Moon', 'Paired vedha houses'], rows: [
        ['Sun', '3, 6, 10, 11', '9, 12, 4, 5'], ['Moon', '1, 3, 6, 7, 10, 11', '5, 9, 12, 2, 4, 8'], ['Mars', '3, 6, 11', '12, 9, 5'], ['Mercury', '2, 4, 6, 8, 10, 11', '5, 3, 9, 1, 8, 12'],
        ['Jupiter', '2, 5, 7, 9, 11', '12, 4, 3, 10, 8'], ['Venus', '1, 2, 3, 4, 5, 8, 9, 11, 12', '8, 7, 1, 10, 9, 5, 11, 3, 6'], ['Saturn, Rahu', '3, 6, 11', '12, 9, 5'],
      ] },
      { type: 'example', title: 'Reading vedha', text: ['Jupiter transits the **5th** from the Moon: a favourable house (children, happiness).', 'Its vedha partner is the **4th**. If another planet (other than the Moon\'s and Mercury\'s mutual exemption) is transiting the 4th from the Moon at the same time, the good result is obstructed.', 'Check the Transits tab: it shows each planet\'s house from your Moon.'] },
      { type: 'h', text: 'Results by house from the Moon' },
      { type: 'table', headers: ['House', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'], rows: [
        ['1', 'Strain, travel', 'Good fortune', 'Mental strain', 'Money loss', 'Displacement, expense', 'Pleasures', 'Health strain', 'Illness'],
        ['2', 'Money loss', 'Money loss', 'Money loss', 'Money gain', 'Money gain', 'Income', 'Money loss', 'Money loss'],
        ['3', 'Health, wealth', 'Victory', 'Victory', 'Fear of foes', 'Health strain', 'Gains', 'Rise in status', 'Pleasures'],
        ['4', 'Worry', 'Worry', 'Displacement', 'Many gains', 'Domestic friction', 'More friends', 'Domestic friction', 'Unhappiness'],
        ['5', 'Mental strain', 'Low mood', 'Mental strain', 'Family friction', 'Happiness, a child', 'A child', 'Strain', 'Money loss'],
        ['6', 'Defeats foes', 'Free of illness', 'Beats foes', 'Beats opponents', 'Trouble from rivals', 'Misfortune', 'Beats opponents', 'Comforts'],
        ['7', 'Travel', 'Comforts', 'Friction with spouse', 'Quarrels', 'Family comfort', 'Strain with spouse', 'Hard travel', 'Humiliation'],
        ['8', 'Humiliation', 'Setbacks', 'Accident risk', 'Gain, health dips', 'Unwanted travel', 'Health and wealth', 'Misfortunes', 'Serious strain'],
        ['9', 'Strain', 'Ill health', 'Losses', 'Obstacles', 'Virtue, gains', 'Comforts', 'Strain on the father', 'Losses'],
        ['10', 'Success', 'Success', 'Exertion', 'Comforts', 'Career worry', 'Quarrels', 'Career obstacles', 'Comforts'],
        ['11', 'High status', 'Gains', 'Health, wealth', 'Many gains', 'Wealth, status', 'Gains', 'Income, comforts', 'Good fortune'],
        ['12', 'Losses', 'Expenses', 'Money loss', 'Opponents dominate', 'Money loss', 'Wealth', 'Wasted effort', 'Heavy expenses'],
      ] },
      { type: 'h', text: 'Modifiers' },
      { type: 'list', items: [
        '**Dignity**: a good transit through the planet\'s debilitation or an enemy\'s sign gives less; a bad transit in debilitation is worse; own or exaltation signs help.',
        '**Malefic over malefic**: malefics transiting natal malefics are especially hard.',
        '**When within a sign**: the Sun and Mars act on entering the sign; Jupiter and Venus in the middle; the Moon and Saturn in the last third; Mercury and Rahu throughout.',
        '**Birth-star transits**: malefics crossing the birth nakshatra and its trines (the 10th and 19th), or the 3rd, 5th, 7th and 22nd nakshatras from it, call for care.',
        '**Ashtakavarga**: a planet transiting a sign with many bindus in its own table does better (next lesson).',
        '**Protection**: Jupiter or Rahu transiting the 11th from the Moon acts as protection.',
      ] },
      { type: 'h', text: 'Sade Sati' },
      { type: 'p', text: 'Saturn\'s transit of the **12th, 1st and 2nd from the natal Moon**, about seven and a half years, traditionally brings responsibilities, worries, expenses and fatigue. It recurs about every 30 years, at most three times in a life; tradition says the first affects the parents, the second the native, the third the children. The book\'s caution: do not apply it blindly. Weigh the natal Moon\'s house and sign, and the running dasha.' },
      { type: 'callout', tone: 'tip', text: 'The book uses transits to "switch on" houses: Jupiter or Saturn aspecting a natal house activates it, and the Moon\'s transit pins the exact day. For a wedding date it keeps the 8th from both the lagna and the Moon free of affliction.' },
    ],
    quiz: [
      { q: 'Saturn is favourable in which houses from the Moon?', options: ['1, 4, 7', '3, 6, 11', '2, 5, 9', '8, 12'], answer: 1, explain: 'Saturn and Rahu: 3, 6 and 11.' },
      { q: 'Jupiter in the 5th from the Moon, with another planet in the 4th from the Moon…', options: ['Is doubled', 'Is obstructed by vedha', 'Has no effect', 'Becomes Sade Sati'], answer: 1, explain: 'The 4th is the vedha house for Jupiter\'s 5th.' },
      { q: 'When does Saturn show its result within a sign?', options: ['On entering', 'In the middle', 'In the last third', 'Throughout'], answer: 2, explain: 'The Moon and Saturn act in the last third.' },
    ],
  },

  {
    slug: 'practice-ashtakavarga', level: 'Vedic', module: P,
    title: 'Ashtakavarga: the point system for transits',
    summary: 'How bindus are given, the Sarvashtakavarga total of 337, reading bindus 0 to 8, the book\'s house comparisons, and the daily kakshya test.',
    minutes: 22,
    blocks: [
      { type: 'p', text: '**Ashtakavarga** ("eight-fold division") is mainly a **transit** tool. Each of the seven planets and the lagna (eight reference points) gives a benefic point, a **bindu**, to certain signs counted from itself. Rahu and Ketu are left out, and the counting uses whole signs. The book ranks Ashtakavarga below the birth chart and the dashas.' },
      { type: 'h', text: 'Two kinds of table' },
      { type: 'list', items: [
        '**Bhinnashtakavarga (BAV)**: each planet\'s own table, 0 to 8 bindus per sign. It tells how that planet behaves when it transits each sign.',
        '**Sarvashtakavarga (SAV)**: the sum of the seven tables, **337** bindus in all. **28** in a sign is average. More makes the house stronger and transits through it easier; fewer makes it weaker.',
      ] },
      { type: 'table', headers: ['Planet', 'Total bindus', 'Example: houses from itself where it gives a bindu'], rows: [
        ['Sun', '48', '1, 2, 4, 7, 8, 9, 10, 11'], ['Moon', '49', '1, 3, 6, 7, 10, 11'], ['Mars', '39', '1, 2, 4, 7, 8, 10, 11'], ['Mercury', '54', '1, 3, 5, 6, 9, 10, 11, 12'],
        ['Jupiter', '56', '1, 2, 3, 4, 7, 8, 10, 11'], ['Venus', '52', '1, 2, 3, 4, 5, 8, 9, 10, 11'], ['Saturn', '39', '3, 5, 6, 11'],
      ] },
      { type: 'h', text: 'Reading bindus in a planet\'s own table' },
      { type: 'table', headers: ['Bindus', 'Classical result when the planet transits there'], rows: [
        ['0', 'Humiliation, illness and danger; malefic transits here are decidedly hard'], ['1', 'Illness, hardship, aimless effort'], ['2', 'Mental strain, trouble with authority, losses to theft'],
        ['3', 'Physical and mental discomfort'], ['4', 'Mixed: good and bad in equal measure'], ['5', 'Learning, wealth, children and good things'],
        ['6', 'Good character, victory, wealth, vehicles, renown'], ['7', 'Honours and great good fortune'], ['8', 'Royal grace and glory'],
      ] },
      { type: 'list', items: [
        'A strong, exalted or own-sign planet with **few** bindus loses much of its good effect.',
        'A weak, debilitated or combust planet with **above-average** bindus keeps much of its effect.',
        'Jupiter transiting strong houses brings dignity; Saturn transiting strong houses brings power and leadership.',
        'Dasha lords transiting strong houses give good results; weak houses, poor ones.',
      ] },
      { type: 'h', text: 'Comparing houses in the SAV' },
      { type: 'table', headers: ['Comparison', 'Reading'], rows: [
        ['1st and 8th both above 28', 'Good health and stamina'],
        ['11th above the 10th', 'More gain for less effort'],
        ['12th above the 11th', 'Spending can outrun income, or income from abroad'],
        ['2nd above the 12th', 'Saving more than spending'],
        ['A strong 6th', 'Struggle and competition are prominent'],
        ['A jump of 8 or more between adjacent houses', 'A marked rise or fall as planets move from one to the next'],
        ['5th above the 10th with a weak 11th', 'Col. A.K. Gaur observed career setbacks; the author calls it a matter for research'],
      ] },
      { type: 'example', title: 'Worked example', text: [
        'A chart has SAV 33 in the 11th and 26 in the 10th: the 11th exceeds the 10th, so gains come with less effort.',
        'The 12th has 30 and the 11th 33: income exceeds expenses.',
        'Saturn is about to enter a sign where its own table has 5 bindus: the book reads learning, wealth and good things during that transit, despite Saturn\'s reputation.',
      ] },
      { type: 'h', text: 'Kakshya: the daily test' },
      { type: 'p', text: 'Each sign is split into eight **kakshyas** of 3°45′, ruled in order by Saturn, Jupiter, Mars, the Sun, Venus, Mercury, the Moon and the lagna. A transiting planet does well while it passes a kakshya whose lord gave a bindu to that sign in the planet\'s own table. Count how many of the seven transiting planets are in such kakshyas: **7 or 6** excellent, **5** very good, **4** good (the borderline), **3** average, **2** very bad, **1 or 0** extremely bad. The book says to use this with caution, alongside the dashas.' },
      { type: 'callout', tone: 'tip', text: 'The **Ashtakavarga** tab of your chart shows the SAV chart, the readings from these comparisons, every planet\'s table, and today\'s kakshya count.' },
    ],
    quiz: [
      { q: 'What is the total of the Sarvashtakavarga?', options: ['108', '337', '360', '28'], answer: 1, explain: 'The seven tables sum to 337 bindus.' },
      { q: 'A sign with 32 bindus in the SAV is…', options: ['Weak', 'Average', 'Above average, so stronger', 'Not counted'], answer: 2, explain: '28 is average; more makes the house stronger.' },
      { q: 'Five of the seven transiting planets are in kakshyas with a bindu. The book reads the day as…', options: ['Extremely bad', 'Average', 'Very good', 'Excellent'], answer: 2, explain: '5 is very good.' },
    ],
  },
]
