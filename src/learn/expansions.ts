/**
 * Extra depth for the original Jyotish lessons: more rules, worked charts and
 * questions. Added after each lesson's own blocks (before its "try it" box).
 * Book material is summarised in our own words from K.S. Charak, Elements of
 * Vedic Astrology vol. 2, and standard Parashari practice.
 */
import { ex } from './exampleChart'
import type { Block, QuizQuestion } from './types'

export interface Expansion { blocks: Block[]; quiz?: QuizQuestion[] }

export const EXPANSIONS: Record<string, Expansion> = {
  'vedic-intro': {
    blocks: [
      { type: 'h', text: 'An example chart, drawn in your chosen style' },
      { type: 'chart', title: 'How to find your way round a kundali', spec: ex('Mithuna', 'Su10 Mo6 Ma7 Me10 Ju9 Ve10 Sa10@25 Ra3'), caption: [
        'This chart has **Mithuna lagna**: the sign rising in the east at birth. In North Indian style it sits in the top diamond; in South Indian style the Mithuna box is marked.',
        'Count houses from the lagna: Karka is the 2nd, Simha the 3rd, and so on round to Meena, the 10th, where four planets sit.',
        'Switch between North and South Indian styles in **Settings**, or with the toggle on any chart, and this example redraws itself.',
      ] },
      { type: 'h', text: 'The vocabulary you will meet in every lesson' },
      { type: 'table', headers: ['Term', 'Meaning'], rows: [
        ['Lagna', 'The ascendant: the sign rising at birth, which becomes the 1st house'],
        ['Rashi', 'A sign of 30°; also short for the Moon sign'],
        ['Bhava', 'A house: a field of life'],
        ['Graha', 'A planet (the seven visible planets plus Rahu and Ketu)'],
        ['Nakshatra', 'One of 27 lunar mansions of 13°20′'],
        ['Drishti', 'An aspect: the glance one planet casts on others'],
        ['Yoga', 'A named combination with a classical result'],
        ['Dasha', 'A planetary period that times the chart\'s promises'],
        ['Varga', 'A divisional chart, such as the navamsa (D9)'],
        ['Gochara', 'Transits: the planets\' current movement read against the chart'],
      ] },
      { type: 'h', text: 'How a reading is built' },
      { type: 'list', items: [
        '1. **The promise**: the birth chart (D1) and its divisional charts show what is possible.',
        '2. **The timing**: the dasha shows which part of the promise is active in each period.',
        '3. **The trigger**: transits mark the months and days within the dasha.',
        '4. **The weight**: strength (dignity, house, aspects) decides how much each factor gives.',
        'The book\'s constant reminder: a chart is read by synthesis, never from one factor.',
      ] },
      { type: 'h', text: 'The ayanamsa, briefly' },
      { type: 'p', text: 'Because the equinox slowly moves backwards against the stars (about 1° every 72 years), the sidereal and tropical zodiacs drift apart. Different schools fix the starting point differently, so the ayanamsa varies by about a degree between them. Astro Life offers Lahiri (the default), Raman, Krishnamurti and others in Settings. A planet near the edge of a sign can change sign between ayanamsas, so check edge cases.' },
    ],
    quiz: [
      { q: 'Which part of a reading shows the timing of events?', options: ['The varga', 'The dasha', 'The rashi', 'The yoga'], answer: 1, explain: 'The dasha times the promise; transits trigger it.' },
    ],
  },

  'vedic-rashis': {
    blocks: [
      { type: 'h', text: 'More classifications the rules use' },
      { type: 'table', headers: ['Classification', 'Signs', 'Where it is used'], rows: [
        ['Head-rising (sheershodaya)', 'Mithuna, Simha, Kanya, Tula, Vrishchika, Kumbha', 'Prashna: a good sign for business questions; results come early'],
        ['Back-rising (prishthodaya)', 'Mesha, Vrishabha, Karka, Dhanu, Makara', 'Prashna: delay; with malefics, concern in travel questions'],
        ['Both (ubhayodaya)', 'Meena', 'Mixed'],
        ['Two-footed (human)', 'Mithuna, Kanya, Tula, Kumbha, first half of Dhanu', 'Strong in the 1st house; Vashya koota "Manava"'],
        ['Four-footed', 'Mesha, Vrishabha, Simha, second half of Dhanu, first half of Makara', 'Strong in the 10th house'],
        ['Water signs', 'Karka, Meena, second half of Makara', 'Strong in the 4th house'],
        ['Insect', 'Vrishchika', 'Strong in the 7th house'],
      ] },
      { type: 'h', text: 'Directions and seasons' },
      { type: 'list', items: [
        '**Fire signs** (Mesha, Simha, Dhanu) point east; **earth** (Vrishabha, Kanya, Makara) south; **air** (Mithuna, Tula, Kumbha) west; **water** (Karka, Vrishchika, Meena) north. Used in prashna to find lost items and in muhurta for travel.',
        '**Odd signs** are masculine and assertive, **even signs** feminine and receptive. Maha-bhagya yoga uses this: odd signs for a man\'s day birth, even signs for a woman\'s night birth.',
      ] },
      { type: 'h', text: 'Exaltation and debilitation by sign' },
      { type: 'table', headers: ['Sign', 'Exalted here', 'Debilitated here'], rows: [
        ['Mesha', 'Sun (deepest at 10°)', 'Saturn (20°)'], ['Vrishabha', 'Moon (3°)', ''], ['Karka', 'Jupiter (5°)', 'Mars (28°)'],
        ['Kanya', 'Mercury (15°)', 'Venus (27°)'], ['Tula', 'Saturn (20°)', 'Sun (10°)'], ['Vrishchika', '', 'Moon (3°)'],
        ['Makara', 'Mars (28°)', 'Jupiter (5°)'], ['Meena', 'Venus (27°)', 'Mercury (15°)'],
      ] },
      { type: 'chart', title: 'Reading a lagna by its classifications', spec: ex('Tula', 'Su12 Mo10 Ma1 Me1 Ju7 Ve1 Sa2 Ra10'), highlight: ['Venus', 'Mars', 'Mercury'], caption: [
        '**Tula lagna** is movable, airy, odd, two-footed and head-rising: active, sociable, fair-minded and quick to engage.',
        'Its lord **Venus** is in the lagna in its own sign: the sign\'s qualities are expressed fully.',
        'Mars and Mercury in the lagna add drive and articulacy. This mirrors the arrangement in Gandhi\'s chart used above.',
      ] },
    ],
  },

  'vedic-bhavas': {
    blocks: [
      { type: 'h', text: 'How to judge any house: five steps' },
      { type: 'list', items: [
        '1. **The house itself**: which sign, which planets occupy it, which aspect it. Benefics there and aspecting it help.',
        '2. **Its lord**: where it sits (see the Classical results lessons for every placement), its dignity, combustion and aspects.',
        '3. **Its karaka**: the natural significator (Venus for the 7th, Jupiter for the 5th). A weak karaka weakens the house even when the lord is strong.',
        '4. **From the Moon** (and for some houses from the karaka): the same house counted from the Moon confirms or modifies.',
        '5. **In the varga**: the matching divisional chart (D9 for marriage, D10 for career, D7 for children, D4 for property).',
      ] },
      { type: 'chart', title: 'Judging the 4th house (home, mother, comfort)', spec: ex('Mesha', 'Su10 Mo4 Ma1 Me10 Ju4 Ve11 Sa7 Ra3'), highlight: ['Moon', 'Jupiter'], caption: [
        '**The house**: Karka holds the Moon (own sign) and Jupiter (exalted). Two benefics: an excellent start.',
        '**The lord**: the 4th lord is the Moon, in its own house. "Lord in its own house protects it."',
        '**The karaka**: the Moon is also the karaka of the mother and the 4th. Strong.',
        '**From the Moon**: the 4th from the Moon is Tula, holding exalted Saturn, which adds stability, perhaps an older home.',
        'Conclusion: comfort at home, property and a close bond with the mother, especially in the Moon and Jupiter dashas. Gajakesari and a raja yoga (4th and 9th lords together) also form here.',
      ] },
      { type: 'h', text: 'Houses as relatives, by bhavat bhavam' },
      { type: 'table', headers: ['Relative', 'House', 'Why'], rows: [
        ['Father', '9th (some schools 10th)', 'House of the guru and dharma'], ['Mother', '4th', 'House of nurture'], ['Younger siblings', '3rd', ''], ['Elder siblings', '11th', ''],
        ['Spouse', '7th', ''], ['First child', '5th', ''], ['Second child', '7th', '3rd from the 5th'], ['Father-in-law', '3rd', '9th from the 7th'],
        ['Mother-in-law', '10th', '4th from the 7th'], ['Grandchildren', '9th', '5th from the 5th'], ['Paternal grandfather', '5th', '9th from the 9th'],
      ] },
      { type: 'callout', tone: 'tip', text: 'Dusthana houses are not "bad" in every sense: the 6th gives the ability to compete and serve, the 8th research and resilience, the 12th spiritual release and foreign connections. What the texts call bad is their effect on the houses their lords join.' },
    ],
  },

  'vedic-nakshatras': {
    blocks: [
      { type: 'h', text: 'All 27 nakshatras' },
      { type: 'table', headers: ['#', 'Nakshatra', 'Span', 'Lord', 'Deity', 'Gana', 'Yoni', 'Naadi'], rows: [
        ['1', 'Ashwini', 'Mesha 0°–13°20′', 'Ketu', 'Ashwini Kumaras', 'Deva', 'Horse', 'Adya'],
        ['2', 'Bharani', 'Mesha 13°20′–26°40′', 'Venus', 'Yama', 'Manushya', 'Elephant', 'Madhya'],
        ['3', 'Krittika', 'Mesha 26°40′–Vrishabha 10°', 'Sun', 'Agni', 'Rakshasa', 'Ram', 'Antya'],
        ['4', 'Rohini', 'Vrishabha 10°–23°20′', 'Moon', 'Brahma', 'Manushya', 'Serpent', 'Antya'],
        ['5', 'Mrigashira', 'Vrishabha 23°20′–Mithuna 6°40′', 'Mars', 'Soma', 'Deva', 'Serpent', 'Madhya'],
        ['6', 'Ardra', 'Mithuna 6°40′–20°', 'Rahu', 'Rudra', 'Manushya', 'Dog', 'Adya'],
        ['7', 'Punarvasu', 'Mithuna 20°–Karka 3°20′', 'Jupiter', 'Aditi', 'Deva', 'Cat', 'Adya'],
        ['8', 'Pushya', 'Karka 3°20′–16°40′', 'Saturn', 'Brihaspati', 'Deva', 'Ram', 'Madhya'],
        ['9', 'Ashlesha', 'Karka 16°40′–30°', 'Mercury', 'The Nagas', 'Rakshasa', 'Cat', 'Antya'],
        ['10', 'Magha', 'Simha 0°–13°20′', 'Ketu', 'The Pitris', 'Rakshasa', 'Rat', 'Antya'],
        ['11', 'Purva Phalguni', 'Simha 13°20′–26°40′', 'Venus', 'Bhaga', 'Manushya', 'Rat', 'Madhya'],
        ['12', 'Uttara Phalguni', 'Simha 26°40′–Kanya 10°', 'Sun', 'Aryaman', 'Manushya', 'Cow', 'Adya'],
        ['13', 'Hasta', 'Kanya 10°–23°20′', 'Moon', 'Savitar', 'Deva', 'Buffalo', 'Adya'],
        ['14', 'Chitra', 'Kanya 23°20′–Tula 6°40′', 'Mars', 'Vishvakarma', 'Rakshasa', 'Tiger', 'Madhya'],
        ['15', 'Swati', 'Tula 6°40′–20°', 'Rahu', 'Vayu', 'Deva', 'Buffalo', 'Antya'],
        ['16', 'Vishakha', 'Tula 20°–Vrishchika 3°20′', 'Jupiter', 'Indra and Agni', 'Rakshasa', 'Tiger', 'Antya'],
        ['17', 'Anuradha', 'Vrishchika 3°20′–16°40′', 'Saturn', 'Mitra', 'Deva', 'Deer', 'Madhya'],
        ['18', 'Jyeshtha', 'Vrishchika 16°40′–30°', 'Mercury', 'Indra', 'Rakshasa', 'Deer', 'Adya'],
        ['19', 'Moola', 'Dhanu 0°–13°20′', 'Ketu', 'Nirriti', 'Rakshasa', 'Dog', 'Adya'],
        ['20', 'Purva Ashadha', 'Dhanu 13°20′–26°40′', 'Venus', 'Apas (the waters)', 'Manushya', 'Monkey', 'Madhya'],
        ['21', 'Uttara Ashadha', 'Dhanu 26°40′–Makara 10°', 'Sun', 'The Vishvedevas', 'Manushya', 'Mongoose', 'Antya'],
        ['22', 'Shravana', 'Makara 10°–23°20′', 'Moon', 'Vishnu', 'Deva', 'Monkey', 'Antya'],
        ['23', 'Dhanishtha', 'Makara 23°20′–Kumbha 6°40′', 'Mars', 'The Vasus', 'Rakshasa', 'Lion', 'Madhya'],
        ['24', 'Shatabhisha', 'Kumbha 6°40′–20°', 'Rahu', 'Varuna', 'Rakshasa', 'Horse', 'Adya'],
        ['25', 'Purva Bhadrapada', 'Kumbha 20°–Meena 3°20′', 'Jupiter', 'Aja Ekapada', 'Manushya', 'Lion', 'Adya'],
        ['26', 'Uttara Bhadrapada', 'Meena 3°20′–16°40′', 'Saturn', 'Ahir Budhnya', 'Manushya', 'Cow', 'Madhya'],
        ['27', 'Revati', 'Meena 16°40′–30°', 'Mercury', 'Pushan', 'Deva', 'Elephant', 'Antya'],
      ] },
      { type: 'p', text: 'Gana, yoni and naadi are the columns used in kundali matching (Gana, Yoni and Naadi kootas). The lord decides the Vimshottari dasha sequence.' },
      { type: 'h', text: 'Padas and the navamsa' },
      { type: 'p', text: 'Each nakshatra has four **padas** of 3°20′, and each pada is exactly one **navamsa**. So 108 padas map onto the 108 navamsas of the zodiac. Ashwini pada 1 is Mesha navamsa, pada 2 Vrishabha, and so on. This is why the Moon\'s pada also tells you the Moon\'s navamsa sign.' },
      { type: 'h', text: 'Nakshatras in muhurta' },
      { type: 'table', headers: ['Class', 'Nakshatras', 'Good for'], rows: [
        ['Dhruva (fixed)', 'Rohini, Uttara Phalguni, Uttara Ashadha, Uttara Bhadrapada', 'Lasting works, foundations'], ['Chara (movable)', 'Punarvasu, Swati, Shravana, Dhanishtha, Shatabhisha', 'Travel, vehicles'],
        ['Kshipra (swift)', 'Ashwini, Pushya, Hasta', 'Shopping, learning, medicine'], ['Mridu (gentle)', 'Mrigashira, Chitra, Anuradha, Revati', 'Arts, friendship, clothes'],
        ['Mishra (mixed)', 'Krittika, Vishakha', 'Routine work'], ['Krura and Teekshna', 'Bharani, Magha, the Poorvas; Ardra, Ashlesha, Jyeshtha, Moola', 'Harsh acts only'],
      ] },
      { type: 'h', text: 'Gandanta: the knots' },
      { type: 'p', text: 'Where a water sign ends and a fire sign begins, the nakshatra boundary falls exactly on the sign boundary: Revati to Ashwini, Ashlesha to Magha, Jyeshtha to Moola. These junctions are called **gandanta** ("knot"). A Moon or lagna there is traditionally given extra care, and muhurta avoids them.' },
      { type: 'h', text: 'Taara: counting from your birth star' },
      { type: 'p', text: 'Counting from your birth nakshatra to any other and dividing by 9 gives the **Taara**: 1 Janma, 2 Sampat, 3 Vipat, 4 Kshema, 5 Pratyari, 6 Sadhaka, 7 Vadha, 8 Mitra, 9 Ati-mitra. The 3rd, 5th and 7th are unfavourable. It is used in muhurta, matching and transits.' },
    ],
    quiz: [
      { q: 'How many padas are there in the whole zodiac?', options: ['27', '54', '108', '360'], answer: 2, explain: '27 nakshatras × 4 padas = 108, one per navamsa.' },
      { q: 'Which nakshatra pair forms a gandanta junction?', options: ['Rohini and Mrigashira', 'Revati and Ashwini', 'Hasta and Chitra', 'Pushya and Ashlesha'], answer: 1, explain: 'Revati (end of Meena) to Ashwini (start of Mesha).' },
    ],
  },

  'vedic-grahas': {
    blocks: [
      { type: 'h', text: 'Karakatva: what each planet signifies in detail' },
      { type: 'table', headers: ['Graha', 'People', 'Life areas', 'Qualities'], rows: [
        ['Sun', 'Father, rulers, officials', 'Government, authority, health, vitality', 'Soul, self-respect, leadership'],
        ['Moon', 'Mother, the public, women', 'Mind, comfort, liquids, travel', 'Emotion, care, receptivity'],
        ['Mars', 'Younger siblings, soldiers, engineers', 'Land, property, sport, surgery', 'Courage, drive, conflict'],
        ['Mercury', 'Friends, students, traders', 'Trade, writing, education, numbers', 'Intellect, speech, wit'],
        ['Jupiter', 'Teachers, children, husband (in a woman\'s chart)', 'Wealth, law, religion, advice', 'Wisdom, ethics, growth'],
        ['Venus', 'Spouse, wife (in a man\'s chart), artists', 'Marriage, arts, vehicles, luxury', 'Love, beauty, pleasure'],
        ['Saturn', 'Servants, workers, the elderly', 'Labour, land, mining, longevity, the masses', 'Discipline, endurance, delay'],
        ['Rahu', 'Foreigners, outsiders', 'Technology, foreign lands, mass media', 'Ambition, obsession, novelty'],
        ['Ketu', 'Ascetics, researchers', 'Spirituality, research, hidden matters', 'Detachment, intuition, precision'],
      ] },
      { type: 'h', text: 'Chara karakas (Jaimini)' },
      { type: 'p', text: 'Jaimini ranks the seven planets by their degree within their sign. The highest is the **Atmakaraka** (the soul and its main lesson); then the **Amatyakaraka** (career), **Bhratrikaraka** (siblings, guru), **Matrikaraka** (mother), **Putrakaraka** (children), **Gnatikaraka** (rivals, disease) and **Darakaraka** (spouse). Astro Life uses these in its career, marriage and children reports and in Jaimini raja yoga.' },
      { type: 'chart', title: 'Finding the chara karakas', spec: ex('Simha', 'Su1@28 Mo4@24 Ma10@19 Me12@8 Ju5@15 Ve2@3 Sa7@11 Ra3'), caption: [
        'Rank the seven planets by degree within the sign: Sun 28°, Moon 24°, Mars 19°, Jupiter 15°, Saturn 11°, Mercury 8°, Venus 3°.',
        '**Atmakaraka**: the Sun. **Amatyakaraka**: the Moon. **Bhratrikaraka**: Mars. **Matrikaraka**: Jupiter. **Putrakaraka**: Saturn. **Gnatikaraka**: Mercury. **Darakaraka**: Venus.',
        'Rahu is left out in the seven-karaka scheme; the eight-karaka scheme counts its degree backwards from 30°.',
      ] },
      { type: 'h', text: 'Natural strength order and speed' },
      { type: 'list', items: [
        '**Naisargika bala** (natural strength), strongest first: Sun, Moon, Venus, Jupiter, Mercury, Mars, Saturn. It breaks ties when two planets compete.',
        '**Speed**, fastest first: Moon (about 13° a day), Mercury, Venus, Sun (about 1° a day), Mars, Jupiter, Saturn (about 2° a month). Rahu and Ketu move backwards about 3° a month. Speed decides how long a transit lasts.',
      ] },
    ],
  },

  'vedic-strength': {
    blocks: [
      { type: 'h', text: 'Combustion orbs' },
      { type: 'table', headers: ['Planet', 'Combust within (degrees of the Sun)', 'When retrograde'], rows: [
        ['Moon', '12°', ''], ['Mars', '17°', ''], ['Mercury', '14°', '12°'], ['Jupiter', '11°', ''], ['Venus', '10°', '8°'], ['Saturn', '15°', ''],
      ] },
      { type: 'h', text: 'Shadbala: the six-fold strength' },
      { type: 'table', headers: ['Component', 'What it measures'], rows: [
        ['Sthana bala', 'Positional strength: dignity in the sign and the vargas, kendra placement, odd or even sign'],
        ['Dig bala', 'Directional strength: the house where the planet is strongest'],
        ['Kala bala', 'Temporal strength: day or night birth, the Moon\'s phase, the year, month, day and hour lords'],
        ['Cheshta bala', 'Motional strength: retrograde and slow planets are strong'],
        ['Naisargika bala', 'Natural strength, fixed for each planet'],
        ['Drik bala', 'Aspectual strength: benefic aspects add, malefic aspects subtract'],
      ] },
      { type: 'p', text: 'The total, in rupas, is compared with each planet\'s required minimum. Astro Life\'s Planets tab shows each planet\'s Shadbala as a percentage of that minimum; above 100% is strong enough to give its results.' },
      { type: 'h', text: 'Planetary age (baladi avastha)' },
      { type: 'p', text: 'Each sign is split into five 6° parts. In odd signs a planet is an infant (0°–6°), youth (6°–12°), adult (12°–18°), old (18°–24°) and dead (24°–30°); in even signs the order is reversed. Adult planets give full results, youthful ones about half, infants about a quarter, old ones little and "dead" ones almost none. The Planets tab shows each planet\'s age, alertness and mood.' },
      { type: 'h', text: 'Grading a chart, planet by planet' },
      { type: 'chart', title: 'A quick strength grading', spec: ex('Karka', 'Su11@10 Mo1@8 Ma10 Me11@20 Ju1@5 Ve12 Sa4@19 Ra6'), highlight: ['Moon', 'Jupiter', 'Mars', 'Saturn'], caption: [
        '**Jupiter** in Karka at 5°: exalted at its deepest degree, in the lagna with dig bala. Top grade.',
        '**Moon** in Karka: own sign, in the lagna. Strong, and the lagna lord is in the lagna.',
        '**Mars** in Mesha in the 10th: own sign with dig bala. Strong. For Karka lagna Mars is also the yogakaraka.',
        '**Saturn** in Tula in the 4th at 19°: exalted, near its deepest degree. Strong, though it rules the 7th and 8th.',
        '**Mercury** in Vrishabha, 10° from the Sun: inside its 14° orb, so combust. Weak despite a friendly sign.',
      ] },
      { type: 'callout', tone: 'note', text: 'The book: retrograde planets lose their kindness where health is concerned, and a strong planet with few Ashtakavarga bindus loses much of its good effect. Strength is never one number; it is a judgement across all these factors.' },
    ],
    quiz: [
      { q: 'Venus within how many degrees of the Sun is combust (direct motion)?', options: ['5°', '10°', '17°', '30°'], answer: 1, explain: 'Venus: 10° direct, 8° retrograde.' },
      { q: 'Which part of Shadbala measures retrograde motion?', options: ['Dig bala', 'Cheshta bala', 'Kala bala', 'Drik bala'], answer: 1, explain: 'Cheshta bala is motional strength.' },
    ],
  },

  'vedic-planets-in-houses': {
    blocks: [
      { type: 'h', text: 'Two rules from the book' },
      { type: 'list', items: [
        '**The planet\'s nature meets the house**: the result comes from what the planet *is*, regardless of what it rules. Lordship is read separately (the Classical results lessons).',
        '**Karako bhava nashaya**: a significator in its own house of signification can harm it. The Sun (father) in the 9th, Jupiter (children) in the 5th, Venus (spouse) in the 7th, the Moon (mother) in the 4th are the classic cases; strength and aspects decide how much.',
      ] },
      { type: 'chart', title: 'Reading three placements together', spec: ex('Dhanu', 'Su10 Mo5 Ma3 Me10 Ju5 Ve11 Sa6 Ra2'), highlight: ['Sun', 'Jupiter', 'Saturn'], caption: [
        '**Sun in the 10th** (Kanya): the Sun with directional strength in the house of career; authority and a public role.',
        '**Jupiter in the 5th** (Mesha) with the Moon: wisdom, good counsel and Gajakesari, but also karako bhava nashaya for children, so the 5th needs checking in the D7.',
        '**Saturn in the 6th** (Vrishabha): a malefic in an upachaya, excellent for defeating opponents and for steady service.',
      ] },
      { type: 'callout', tone: 'tip', text: 'For the book\'s full line-by-line results of every planet in every house, and the Manasagari results counted from the Moon, see the lesson **The nine planets in the twelve houses, and from the Moon** in the Classical results module.' },
    ],
  },

  'vedic-drishti': {
    blocks: [
      { type: 'h', text: 'Full and partial aspects' },
      { type: 'p', text: 'Parashara also gives partial aspects that every planet casts: a quarter on the 3rd and 10th, a half on the 5th and 9th, three quarters on the 4th and 8th, and full on the 7th. The special aspects of Mars, Jupiter and Saturn are their full-strength versions. Most practical work uses only the full aspects, as Astro Life does.' },
      { type: 'chart', title: 'Tracing every aspect in one chart', spec: ex('Mesha', 'Su5 Mo7 Ma1 Me5 Ju9 Ve6 Sa10 Ra3'), highlight: ['Mars', 'Jupiter', 'Saturn'], caption: [
        '**Mars** in Mesha (1st) aspects the 4th (Karka), 7th (Tula, where the Moon is) and 8th (Vrishchika).',
        '**Jupiter** in Dhanu (9th) aspects the 5th from itself (Mesha, the lagna), the 7th (Mithuna, the 3rd house) and the 9th (Simha, the 5th house, where the Sun and Mercury are).',
        '**Saturn** in Makara (10th) aspects the 3rd from itself (Meena, the 12th house), the 7th (Karka, the 4th) and the 10th (Tula, the 7th, where the Moon is).',
        'So the Moon in the 7th receives both Mars and Saturn: a classic marker of friction in partnership, eased by nothing benefic here.',
      ] },
      { type: 'h', text: 'Aspects in the Tajika (annual chart) system' },
      { type: 'p', text: 'The annual chart uses a different system: aspects by house distance with friendly (3, 5, 9, 11 apart), inimical (1, 4, 7, 10) and neutral (2, 6, 8, 12) kinds, and exact-degree orbs. See the Varshaphala lesson.' },
    ],
    quiz: [
      { q: 'Saturn in Makara aspects which signs?', options: ['Meena, Karka, Tula', 'Mesha, Karka, Simha', 'Kumbha, Simha, Vrishchika', 'Karka only'], answer: 0, explain: '3rd: Meena, 7th: Karka, 10th: Tula.' },
    ],
  },

  'vedic-conjunctions': {
    blocks: [
      { type: 'h', text: 'Closeness, combustion and planetary war' },
      { type: 'list', items: [
        '**Degree closeness**: a conjunction within a few degrees is far stronger than one at opposite ends of a sign.',
        '**Combustion**: any planet too close to the Sun (see the strength lesson) is overpowered; its significations are hidden behind the Sun\'s.',
        '**Graha yuddha (planetary war)**: when two of Mars, Mercury, Jupiter, Venus and Saturn are within 1° of each other, they are at war. The winner (traditionally the one further north, or the brighter) keeps its strength; the loser gives weak results.',
        '**Multiple planets**: three or more in one sign concentrate life in that house. Four or more of the seven form a Pravrajya yoga.',
      ] },
      { type: 'chart', title: 'A crowded house', spec: ex('Simha', 'Su10@5 Mo4 Ma10@27 Me10@20 Ju10@29 Ve9 Sa7 Ra3'), highlight: ['Sun', 'Mars', 'Mercury', 'Jupiter'], caption: [
        'Four planets in Vrishabha, the 10th house: career dominates the chart, and Pravrajya yoga forms.',
        'Mercury (20°) is 15° from the Sun: just outside its 14° orb, so not combust. Mars (27°) and Jupiter (29°) are 2° apart: close, but not within 1°, so no planetary war.',
        'Mars (yogakaraka for Simha) with Jupiter (5th lord) in the 10th forms a raja yoga; the Sun as lagna lord joins it.',
      ] },
    ],
  },

  'vedic-grahas-bhavas': {
    blocks: [
      { type: 'h', text: 'A quick rule for any lord in any house' },
      { type: 'table', headers: ['Lord of', 'In a kendra or trikona', 'In a dusthana (6, 8, 12)'], rows: [
        ['A kendra or trikona', 'Strengthens both houses: good', 'Damages the house it rules'],
        ['A dusthana', 'Brings that dusthana\'s problems to the good house', 'Vipareeta: the bad houses cancel, often good'],
        ['The 2nd or 7th (marakas)', 'Mostly good for wealth or partners', 'Mixed'],
        ['The 3rd or 11th', 'Effort and gains in that area', 'Mixed; the 11th lord in a dusthana is Daridra yoga'],
      ] },
      { type: 'chart', title: 'Following three lords', spec: ex('Kanya', 'Su9 Mo4 Ma3 Me10 Ju7 Ve9 Sa5 Ra2'), highlight: ['Mercury', 'Venus', 'Jupiter'], caption: [
        '**Lagna lord Mercury** is in the 10th (Mithuna, its own sign): the self is expressed through career; also lord of the 10th in the 10th, a strong professional signature.',
        '**Venus**, lord of the 2nd and 9th, sits in the 9th (Vrishabha, own sign): fortune and wealth support each other; a dhana yoga.',
        '**Jupiter**, lord of the 4th and 7th, is in the 7th (Meena, own sign): a good partner and home, but for Kanya lagna Jupiter has kendradhipati dosha (a benefic ruling two kendras loses some of its kindness).',
      ] },
      { type: 'callout', tone: 'tip', text: 'For what each lord gives in each of the twelve houses, see **House lords in the twelve houses** I and II in the Classical results module.' },
    ],
  },

  'vedic-functional': {
    blocks: [
      { type: 'h', text: 'The principles behind the table' },
      { type: 'list', items: [
        '**Trikona lords** (5th and 9th) are always auspicious; the 9th more than the 5th.',
        '**Kendra lords** lose their natural nature: natural benefics ruling kendras become neutral (kendradhipati dosha), natural malefics ruling kendras become neutral or helpful.',
        '**Dusthana lords** (6th, 8th, 12th) are troublesome; the 8th lord is the worst, except the Sun and Moon, which are exempt from the blame of ruling the 8th.',
        '**The 3rd and 11th lords** are mildly negative (desire and effort).',
        '**A planet ruling a kendra and a trikona** is a yogakaraka; ruling a trikona and a dusthana it gives mixed results, with the trikona usually winning.',
        '**Marakas**: the lords of the 2nd and 7th, watched in health timing.',
      ] },
      { type: 'chart', title: 'Vrishabha lagna: why Saturn is the best friend', spec: ex('Vrishabha', 'Su12 Mo3 Ma7 Me1 Ju8 Ve11 Sa9 Ra5'), highlight: ['Saturn', 'Jupiter'], caption: [
        '**Saturn** rules Makara (the 9th) and Kumbha (the 10th): a trikona and a kendra. It is the **yogakaraka**, and here it sits in its own sign in the 9th.',
        '**Jupiter**, the great natural benefic, rules Dhanu (the 8th) and Meena (the 11th): a dusthana and the house of desire. For this lagna it is a functional malefic, placed here in the 8th itself.',
        'This is the lesson of functional nature: by lordship, Saturn is this chart\'s best planet and Jupiter one of its most difficult.',
      ] },
    ],
    quiz: [
      { q: 'For Vrishabha lagna Jupiter rules which houses?', options: ['5th and 9th', '8th and 11th', '1st and 6th', '4th and 7th'], answer: 1, explain: 'Dhanu is the 8th and Meena the 11th from Vrishabha.' },
    ],
  },

  'vedic-yogas': {
    blocks: [
      { type: 'h', text: 'The Yoga library' },
      { type: 'p', text: 'This lesson is the overview. The **Yoga library** module explains every one of the 92 yogas Astro Life checks, each with an example chart that the engine verifies as the page loads:' },
      { type: 'list', items: [
        '**How yogas work**: the four relationships, strength, timing and cancellation.',
        '**Pancha Mahapurusha**: Ruchaka, Bhadra, Hamsa, Malavya, Shasha.',
        '**Raja yogas**: kendra-trikona lords, yogakaraka, Dharma-Karmadhipati, Parashara\'s special raja yogas, Jaimini raja yoga, Adhi yoga and Neecha Bhanga.',
        '**Vipareeta and exchange yogas**: Harsha, Sarala, Vimala and the four kinds of parivartana.',
        '**Dhana yogas**: wealth combinations, Lakshmi, Saraswati, Kalanidhi, the Indu lagna and Daridra.',
        '**Solar and lunar yogas**: Vesi to Vasumati, including Gajakesari and Kemadruma.',
        '**Special yogas**: Parijata, Chamara, Shankha, Bheri, Kahala, Parvata, Maha-bhagya, Chatus-saagara, Pravrajya and more.',
        '**Doshas**: Mangal dosha, Kaal Sarp and the other difficult combinations, with their cancellations.',
        '**Nabhasa yogas**: all 32 sky patterns, with the rules for which one wins when they overlap.',
      ] },
      { type: 'chart', title: 'Several yogas in one chart', spec: ex('Mesha', 'Su1 Mo4 Ma10 Me2 Ju4 Ve3 Sa11 Ra6'), highlight: ['Moon', 'Jupiter', 'Mars'], caption: [
        '**Raja yoga**: the 4th lord Moon with the 9th lord Jupiter in Karka.',
        '**Gajakesari**: Jupiter with the Moon (a kendra from it).',
        '**Hamsa**: Jupiter exalted in a kendra. **Ruchaka**: Mars exalted in the 10th.',
        '**Lakshmi**: the 9th lord exalted in a kendra with a strong lagna lord.',
        'This is why yogas must be weighed: a strong chart forms many at once, and the dashas of these planets carry the results.',
      ] },
    ],
  },

  'vedic-vargas': {
    blocks: [
      { type: 'h', text: 'Parashara\'s sixteen vargas' },
      { type: 'table', headers: ['Chart', 'Name', 'Life area'], rows: [
        ['D1', 'Rashi', 'The whole life; the body'], ['D2', 'Hora', 'Wealth'], ['D3', 'Drekkana', 'Siblings, courage'], ['D4', 'Chaturthamsa', 'Property, fortune'],
        ['D7', 'Saptamsa', 'Children'], ['D9', 'Navamsa', 'Marriage, dharma, inner strength of every planet'], ['D10', 'Dasamsa', 'Career, status'], ['D12', 'Dwadasamsa', 'Parents'],
        ['D16', 'Shodasamsa', 'Vehicles, comforts'], ['D20', 'Vimsamsa', 'Spiritual life'], ['D24', 'Chaturvimsamsa', 'Learning, education'], ['D27', 'Bhamsa', 'Strength and weakness'],
        ['D30', 'Trimsamsa', 'Misfortune, difficulties'], ['D40', 'Khavedamsa', 'Maternal legacy'], ['D45', 'Akshavedamsa', 'Paternal legacy, character'], ['D60', 'Shashtyamsa', 'Past karma; very time-sensitive'],
      ] },
      { type: 'h', text: 'Vimshopaka: strength across the vargas' },
      { type: 'p', text: 'Vimshopaka bala scores a planet out of 20 by its dignity across a set of vargas, with the D1 and D9 weighted most. A planet that is strong in D1 but weak across the vargas gives its promise only partly; a planet weak in D1 but strong in the vargas often recovers.' },
      { type: 'chart', title: 'Vargottama in practice', spec: ex('Mesha', 'Su1@2 Mo4@1 Ma10 Me2 Ju9@2 Ve3 Sa11 Ra6'), highlight: ['Sun', 'Moon', 'Jupiter'], caption: [
        'A planet in the first navamsa of a movable sign, the fifth of a fixed sign or the ninth of a dual sign falls in the same sign in the D9: it is **vargottama**.',
        'Here the Sun at 2° Mesha (movable, first navamsa) and the Moon at 1° Karka (movable) are vargottama. Jupiter at 2° Dhanu (dual) falls in the first navamsa of Dhanu, which is Mesha, so it is not.',
        'Open the Divisional charts tab of any chart to see the D9 drawn beside the D1.',
      ] },
    ],
    quiz: [
      { q: 'Which varga is used for education?', options: ['D7', 'D16', 'D24', 'D30'], answer: 2, explain: 'The Chaturvimsamsa (D24) shows learning.' },
    ],
  },

  'vedic-dashas': {
    blocks: [
      { type: 'h', text: 'Antardashas: the sub-periods' },
      { type: 'p', text: 'Each mahadasha divides into nine antardashas in the same order, starting with its own lord. Length of an antardasha = mahadasha years × antardasha lord\'s years ÷ 120.' },
      { type: 'table', headers: ['Saturn mahadasha (19 years)', 'Length'], rows: [
        ['Saturn / Saturn', '19 × 19 ÷ 120 = 3 y 0 m 3 d'], ['Saturn / Mercury', '19 × 17 ÷ 120 = 2 y 8 m 9 d'], ['Saturn / Ketu', '1 y 1 m 9 d'], ['Saturn / Venus', '3 y 2 m 0 d'],
        ['Saturn / Sun', '11 m 12 d'], ['Saturn / Moon', '1 y 7 m 0 d'], ['Saturn / Mars', '1 y 1 m 9 d'], ['Saturn / Rahu', '2 y 10 m 6 d'], ['Saturn / Jupiter', '2 y 6 m 12 d'],
      ] },
      { type: 'h', text: 'Judging a period' },
      { type: 'list', items: [
        '**The mahadasha lord** sets the theme: the houses it rules and occupies, its strength and yogas.',
        '**The antardasha lord** brings its own houses into that theme. Count the antardasha lord from the mahadasha lord: in the 6th, 8th or 12th from it, the period has friction; in kendras and trikonas from it, cooperation.',
        '**Dasha sandhi**: the months around the change of a mahadasha are unsettled; the book and tradition advise against starting major ventures then.',
        '**The book\'s sequence rule** (for health, but useful generally): a good period followed by a bad one marks the start of trouble; bad then good marks recovery; two bad in a row, a prolonged course.',
      ] },
      { type: 'chart', title: 'Which dashas will matter in this chart?', spec: ex('Tula', 'Su11 Mo4 Ma3 Me11 Ju9 Ve1 Sa5 Ra6'), highlight: ['Saturn', 'Venus', 'Jupiter'], caption: [
        '**Saturn** is the yogakaraka for Tula (4th and 5th lord), placed in the 5th in its own sign: its 19-year dasha is the chart\'s most productive.',
        '**Venus**, the lagna lord, in the lagna in its own sign (Malavya yoga): its 20-year dasha strengthens health, status and comfort.',
        '**Jupiter** rules the 3rd and 6th for Tula: functionally difficult despite sitting in the 9th. Its dasha brings effort, competition and service along with teachers and travel.',
      ] },
      { type: 'h', text: 'Other dasha systems' },
      { type: 'p', text: 'Vimshottari is the default for most charts. Astro Life also computes **Yogini** (36-year cycle), **Ashtottari** (108 years) and **Chara** (Jaimini, sign-based) dashas on the Dasha tab; agreement between two systems strengthens a timing. In the annual chart, **Mudda dasha** compresses Vimshottari into one year.' },
    ],
    quiz: [
      { q: 'How long is the Jupiter antardasha within a Venus mahadasha?', options: ['16 months', '2 y 8 m', '20 years', '1 year'], answer: 1, explain: '20 × 16 ÷ 120 = 2.67 years, about 2 years 8 months.' },
    ],
  },

  'vedic-transits': {
    blocks: [
      { type: 'h', text: 'Reading a transit in four steps' },
      { type: 'list', items: [
        '1. **House from the Moon and from the lagna**: favourable or not (see the table above).',
        '2. **Vedha**: is another planet in the obstructing house? (Gochara in depth lesson.)',
        '3. **Bindus**: how many bindus the planet has in its own Ashtakavarga table for that sign.',
        '4. **Dasha**: does the transiting planet, or the house it touches, relate to the running dasha lords?',
      ] },
      { type: 'chart', title: 'A favourable Jupiter year', spec: ex('Karka', 'Su8 Mo6 Ma2 Me8 Ju10 Ve7 Sa11 Ra4'), highlight: ['Moon', 'Jupiter'], caption: [
        'Treat this as the sky against a natal Moon in **Dhanu** (the 6th house here). Jupiter is passing **Mesha**, the 5th from the Moon: a favourable house (happiness, children, intelligence).',
        'Its vedha house is the 4th from the Moon (Meena, the 9th house here), which is empty: no obstruction.',
        'From the lagna, Jupiter is crossing the 10th: career matters are switched on. If the dasha also points to career, this is a year to act.',
      ] },
      { type: 'callout', tone: 'tip', text: 'The **Gochara in depth** lesson has the book\'s full tables: vedha pairs, the result of every planet in every house from the Moon, and the modifiers.' },
    ],
  },

  'vedic-career': {
    blocks: [
      { type: 'h', text: 'A complete worked chart' },
      { type: 'chart', title: 'Career reading, step by step', spec: ex('Mithuna', 'Su11 Mo6 Ma10 Me11 Ju9 Ve12 Sa10@25 Ra5'), highlight: ['Jupiter', 'Saturn', 'Mars'], caption: [
        '**10th house**: Meena, holding Mars and Saturn. Saturn is the 9th lord (Kumbha): fortune enters the career. Mars in the 10th is strong for drive and technical work.',
        '**10th lord**: Jupiter, in Kumbha, the 9th: the 10th lord in the 9th points to teaching, law, research or philosophy.',
        '**Dharma-Karmadhipati**: the 9th lord (Saturn) in the 10th and the 10th lord (Jupiter) in the 9th exchange signs: the strongest career raja yoga.',
        '**From the Moon** (Vrishchika): the 10th from the Moon is Simha, ruled by the Sun, in Mesha exalted. Authority and recognition.',
        'Next steps: confirm in the D10, find the Amatyakaraka and the navamsa dispositor of the 10th lord, then time with the Jupiter and Saturn dashas.',
      ] },
      { type: 'h', text: 'The 10th lord through the twelve houses, in brief' },
      { type: 'table', headers: ['10th lord in', 'Direction of the career'], rows: [
        ['1st', 'Self-made; leadership or own enterprise'], ['2nd', 'Finance, family business, food, speech, teaching'], ['3rd', 'Media, writing, sales, skilled hands; self-effort'],
        ['4th', 'Property, vehicles, education, agriculture, work from home'], ['5th', 'Advisory, creative or educational work, investment, politics'], ['6th', 'Service, healthcare, law, defence, problem-solving'],
        ['7th', 'Partnerships, clients, trade; business favoured'], ['8th', 'Research, insurance, taxation, surgery, mining; changes of direction'], ['9th', 'Teaching, law, religion, publishing, long-distance travel'],
        ['10th', 'A strong, self-directed career with authority'], ['11th', 'Large organisations, networks, finance, technology; strong gains'], ['12th', 'Foreign countries, multinationals, hospitals, research institutions'],
      ] },
    ],
  },

  'vedic-marriage': {
    blocks: [
      { type: 'h', text: 'The 7th lord in each house, in brief' },
      { type: 'table', headers: ['7th lord in', 'Tendency'], rows: [
        ['1st', 'The partner is central to life; early or self-chosen marriage'], ['2nd', 'Marriage brings wealth or family ties; an earning spouse'], ['3rd', 'Partner from the neighbourhood or through siblings; communication central'],
        ['4th', 'A homely partnership; marriage linked to property'], ['5th', 'Romance; a love marriage is more likely'], ['6th', 'Friction, service or health matters in marriage; delay'],
        ['7th', 'A strong, capable partner; the house is protected'], ['8th', 'Delays or sudden changes; in-laws prominent'], ['9th', 'A principled or fortunate partner; marriage brings luck'],
        ['10th', 'A partner linked to career; marriage raises status'], ['11th', 'Gains through marriage; partner from one\'s circle'], ['12th', 'Partner from far away; expenses or distance in marriage'],
      ] },
      { type: 'chart', title: 'A marriage reading, step by step', spec: ex('Simha', 'Su1 Mo11 Ma3 Me12 Ju7 Ve2 Sa7@25 Ra4'), highlight: ['Saturn', 'Jupiter', 'Venus'], caption: [
        '**7th house**: Kumbha, holding Jupiter and Saturn. Jupiter protects; Saturn delays and matures. Saturn is also the 7th lord, in its own house: a lasting, serious partnership.',
        '**Venus** (karaka) in Kanya, the 2nd: debilitated. A weak karaka: affection is expressed through duty and care, and the D9 needs checking.',
        '**Mangal dosha**: Mars in the 3rd from the lagna, 5th from the Moon and 2nd from Venus. South Indian practice counts the 2nd from Venus, so check the partner\'s chart.',
        'Overall: a stable but later marriage, best timed in Saturn or Jupiter periods with Jupiter transiting the 7th.',
      ] },
    ],
  },

  'vedic-matching': {
    blocks: [
      { type: 'callout', tone: 'tip', text: 'For every table the book gives (varna, vashya, taara, yoni, graha maitri, gana, bhakoota, naadi), its exceptions and its worked example scoring 24, see **Ashtakoota matching in depth**, the next lesson.' },
      { type: 'h', text: 'What the book adds about matching' },
      { type: 'list', items: [
        'The method checks the **minds** (the Moons) above all. Scriptures say a match based on genuine mutual love needs no matching.',
        'Strict adherence to the score is not needed when both charts are otherwise good. Charak calls 18 or more acceptable.',
        'A full assessment also looks at each chart alone: the promise of married life and children, the dashas, the D9 and the D7, and what the couple want from the marriage.',
        '**Mangal dosha** is balanced when both have it, or when the partner has a malefic in the same houses; best of all is a malefic in the same house as the other\'s Mars.',
        'When fixing the wedding date, keep the 8th from both the lagna and the Moon free of affliction.',
      ] },
    ],
  },

  'vedic-synthesis': {
    blocks: [
      { type: 'h', text: 'Practise on a fresh chart' },
      { type: 'chart', title: 'An eight-step reading', spec: ex('Karka', 'Su10 Mo2 Ma10@25 Me11 Ju1 Ve9 Sa4 Ra6'), highlight: ['Moon', 'Jupiter', 'Mars', 'Sun'], caption: [
        '**1. Lagna**: Karka, with Jupiter exalted in it (Hamsa yoga). A protected, principled, generous personality.',
        '**2. Moon**: the lagna lord, in Simha (the 2nd): a friend\'s sign, in the house of wealth and speech.',
        '**3. Functional nature**: for Karka, Mars is the yogakaraka (5th and 10th lord) and sits in the 10th in its own sign with the exalted Sun: Ruchaka yoga and a strong raja yoga in the house of career.',
        '**4. Strength**: Jupiter, the Sun, Mars and Saturn (exalted in the 4th, Shasha yoga) are all at full dignity. Venus in Meena (the 9th) is exalted too.',
        '**5. Yogas**: Hamsa, Ruchaka and Shasha form. Venus is exalted too, but in the 9th rather than a kendra, so Malavya does not. Several raja yogas link the 10th, 5th and 9th lords.',
        '**6. House by house**: follow each lord with the Classical results lessons.',
        '**7. Vargas**: confirm Mars and the Sun in the D10, Venus and the 7th lord in the D9.',
        '**8. Timing**: the Mars, Sun and Jupiter dashas are the peaks; read transits of Jupiter and Saturn over the 10th within them.',
      ] },
      { type: 'callout', tone: 'tip', text: 'Astro Life\'s **Overview** tab follows the same order: life areas first, then the current dasha and transits, then foundations and the main yogas. Every rule it applies is listed in the reports.' },
    ],
  },
}
