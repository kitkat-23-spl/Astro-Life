/**
 * Classical indications for placements, summarised in our own words from
 * K.S. Charak, Elements of Vedic Astrology, vol. 2 (ch. XVII to XIX), which
 * follows Parashara, Phaladeepika and Manasagari. Wording is curated: lines
 * that predict death, caste or worse are softened or left out.
 *
 * Each text starts with a tone marker: '+' supportive, '~' mixed, '-' needs care.
 */
import { ordinal } from '../astro/constants'
import { GRAHA_INFO, SIGN_LORD, type Graha } from './constants'
import { aspectsOnGraha, conjunctWith, lordOfHouse, pos } from './query'
import type { VedicChart } from './sidereal'

export type ClassicalTone = 'good' | 'mixed' | 'challenge'
export interface ClassicalLine { id: string; label: string; text: string; tone: ClassicalTone; source: string }

const parse = (s: string) => ({ tone: (s[0] === '+' ? 'good' : s[0] === '-' ? 'challenge' : 'mixed') as ClassicalTone, text: s.slice(1) })

/* ------------------------------------------------------------------ */
/* Ch XVII: lords of houses in houses                                   */
/* ------------------------------------------------------------------ */

/** LORD_IN_HOUSE[lord house - 1][occupied house - 1] */
const LORD_IN_HOUSE: string[][] = [
  [ // 1st lord
    '+Sound health, long life and courage; thoughtful; gains from land and property.',
    '+Learned, prosperous, religious and long-lived; sober and self-respecting; earnings from land.',
    '+Very courageous, prosperous and wise, with good support from siblings and relatives.',
    '+Comfort from the mother, several siblings, good looks and long life; devoted to the parents.',
    '~Quick to anger and proud, yet honoured by authority; limited comfort from children; virtuous deeds.',
    '~Good health, victory over opponents, thrift and wealth; earnings from land.',
    '+Bright, with a good-looking and good-natured spouse.',
    '~Long life and accumulated wealth, but health and temper need care; suited to spiritual pursuits.',
    '+Fortunate, learned and well liked; devout; spouse, children and wealth; fame.',
    '+Learned and honoured by authority, with support from the father; fame and wealth by own effort.',
    '+Many gains and good qualities; fame; long-lived children; a comfortable life.',
    '-Few bodily comforts and unproductive pursuits; life away from the place of birth.',
  ],
  [ // 2nd lord: the wealth earner
    '~Wealthy and thrifty, with comforts and children; helpful to outsiders but hard on the family.',
    '+Wealthy, with good earnings and comforts; proud; few children.',
    '~Virtuous, wise and brave, but greedy.',
    '+Wealth, truthfulness and long life; gains from the father.',
    '+Wealth and a name for efficiency; several children; some illness.',
    '~Accumulates wealth and beats enemies, even earns through them.',
    '~An earning spouse.',
    '-Income from land and property, but less comfort from the spouse and elder siblings; dependence on others.',
    '+Wealthy and hard-working; a sickly childhood, healthy later; a good speaker.',
    '~Learned and self-respecting; earns through government or authority; little comfort from children.',
    '+Well known, efficient, respected and wealthy; supports many people.',
    '-Brave and hard-working but loses wealth; little comfort from the eldest child.',
  ],
  [ // 3rd lord: effort and activity
    '~Self-made, courageous and wealthy; clever without formal schooling; restless desires.',
    '-Little initiative or comfort; covets what others have; at odds with own people.',
    '+Healthy and brave; help from siblings; children, wealth and supportive friends; devout.',
    '~Comfort, wealth and wisdom, but friction with the mother and a harsh spouse.',
    '+Virtuous, long-lived and helpful to others; children.',
    '~Very rich but at odds with siblings; little help from the maternal uncle; eye trouble.',
    '~A hard childhood and comfort later; serves those in power; a good-natured spouse.',
    '-Trouble with authority and dishonest dealings; hard on siblings.',
    '~Fortune through women and help from children; little comfort from the father; learned.',
    '+Wealth by own effort, varied comforts and honour from authority.',
    '~Weak health and some dependence, yet brave; self-earned wealth; pleasure-seeking.',
    '-Spends on vices; fortune through women; estranged from relatives; travels abroad.',
  ],
  [ // 4th lord: possessions and home
    '+Comfort from the mother; education, land, vehicles and good qualities.',
    '+Property, courage and a large family; charming and pleasure-seeking.',
    '~Generous, talented and brave; charitable and self-made, but a worry to the parents.',
    '+Large property, sober and comfortable; ministerial standing; devoted to the spouse; religious.',
    '+Comforts, well liked and devout; self-earned income; long life; gains from the father.',
    '-Little comfort from the mother; quick temper.',
    '~Knows many subjects; gives up ancestral property; hesitant in public speaking.',
    '-Lacks home comforts and parental help; sickly.',
    '+Popular, comfortable, virtuous, learned and devout; lives apart from the father.',
    '+Honour from authority, very good health, comforts and self-control.',
    '+Generous, helpful, talented and charitable; devoted to the father; some illness.',
    '-No settled home; idle; the father lives abroad.',
  ],
  [ // 5th lord: the fruits of past karma
    '~Shrewd, learned and renowned, with little comfort from children.',
    '+Many children, much wealth and fame; musical.',
    '~Liked by siblings, charming and sweet-spoken, but gossiping and selfish.',
    '+Comfort from the mother, wealth and wisdom; a minister or teacher; follows the family profession.',
    '+Learning, children and fame; virtuous.',
    '-Illness of, or conflict with, a child; enemies; ill health and little respect.',
    '+Religious, proud and helpful; children; devout; a virtuous spouse.',
    '-Temper and unhappiness; hard on children; respiratory illness.',
    '+High standing for a child; an author, poet or musician; good looks; honoured.',
    '+Royal fame, many pleasures and virtuous deeds; good for the mother.',
    '+Very learned, wealthy and a renowned author; many children; a loyal friend.',
    '-Little comfort from children; travels abroad.',
  ],
  [ // 6th lord: struggle and hostility
    '~Ill health, but renown and self-made wealth; brave; defeats enemies; at odds with relatives.',
    '~Known in the family and an orator; lives abroad; earns and saves; some illness.',
    '-Hostile to siblings; temper; little initiative; poor staff.',
    '-Little comfort from the mother; restless; friction with an ailing father, though still rich.',
    '-Unsteady friends and wealth; friction with own children.',
    '~Hostile to own people but friendly with outsiders; moderate wealth; good health.',
    '-Little marital happiness; a hostile, short-tempered spouse; difficulty having children.',
    '-Ailing; covets the wealth of others.',
    '~Trades in wood; fluctuating income; sceptical of scripture; friction with siblings.',
    '~Known in the family and an orator; distant from the father; comfortable abroad.',
    '~Brave, proud and virtuous; gains from opponents; losses to theft; gains from animals.',
    '-Wasteful; restless travel; fatalistic.',
  ],
  [ // 7th lord: partnerships
    '~Clever, good-looking and pleasure-seeking; attached to the spouse; Vata ailments.',
    '~Many relationships, or none despite opportunity; earns through women; slow to act.',
    '~Spiritual strength and affection; concern around the spouse\'s pregnancies.',
    '~Truthful and religious; strain on fidelity in the marriage; dental trouble.',
    '+Wealthy, proud, virtuous and content.',
    '-An ailing spouse and mutual friction; temper and unhappiness.',
    '+A good spouse; learned and well known; Vata ailments.',
    '-An ailing or difficult spouse, or separation; unhappiness.',
    '+Famous and good-natured; drawn to the company of women.',
    '+Religious and wealthy, with children; an independent-minded spouse.',
    '+Earns through the spouse; more daughters; a beautiful and virtuous spouse.',
    '-Poverty; trade in cloth; spends on, or is deceived by, the spouse.',
  ],
  [ // 8th lord: obstacles and deprivation
    '-Few comforts; injuries; irreverence.',
    '-Little wealth; loses earnings; enemies; trouble with authority.',
    '-Idle and weak; little comfort from siblings; at odds with friends.',
    '-Little comfort from home, land or the mother; friction with the father.',
    '~Few children, but wealth and long life; a slower intellect.',
    '~A sickly childhood; defeats enemies; caution near water.',
    '-Two marriages; abdominal trouble.',
    '+Long life, good health and fame.',
    '-Irreligious; a difficult spouse; mouth trouble.',
    '-Little comfort from the father; reluctant to make effort; serves authority.',
    '~An unhappy childhood but prosperity later.',
    '-Spends on vices; harsh; sickly.',
  ],
  [ // 9th lord: fortune and virtue
    '+Learned, good-looking, honoured and fortunate; devout.',
    '+Spouse, children and wealth; learned and likeable; mouth trouble.',
    '+Very good-looking, wealthy and virtuous; siblings, relatives and a beautiful spouse.',
    '+Devoted to the mother; famous; house, land and vehicles.',
    '+Devoted to teachers, religious and learned; fortunate children.',
    '-Troubled by enemies; religious; sickly.',
    '+A truthful, beautiful and devoted spouse; virtuous.',
    '-Unfortunate; little comfort from the elder sibling; irreligious.',
    '+Very fortunate, good-looking and virtuous; siblings; religious.',
    '+Virtuous and renowned; high standing with authority; devoted to the parents.',
    '+Virtuous and pious; steady income; long life; wealthy and famous.',
    '~Spends on religious giving; honoured abroad; scholarly and good-looking.',
  ],
  [ // 10th lord: one's work
    '+Learned and virtuous; health improves after childhood; steadily growing wealth.',
    '+Virtuous, wealthy, honoured and charitable, though acquisitive.',
    '+Brave, virtuous and a good speaker; siblings and staff.',
    '+Prosperous; land, vehicles and comforts; devoted to the parents.',
    '+Wealth, children and learning; good health; favoured by authority; musical.',
    '-Skilled but poor; troubled by enemies; little comfort from the father; quarrelsome.',
    '+A good spouse; virtuous, thoughtful and pious.',
    '-Long life, but reluctant to start ventures; critical of others.',
    '+Wealth and children; near-royal standing; good-natured, with good friends.',
    '+Truthful, brave, very capable and comfortable; kind to the mother.',
    '+Riches, children and virtue; truthful, content and long-lived.',
    '~Clever but anxious; fears opponents; expenses through authority.',
  ],
  [ // 11th lord: the multiplier
    '+Wealthy, sattvic and even-handed; a poet; steady income; strong and brave.',
    '+Very wealthy, comfortable, spiritual and charitable; some illness.',
    '+Very capable, with many siblings; defeats enemies; abdominal pain.',
    '+Wealth through the mother; land and houses; pilgrimages; good sense of timing.',
    '+Learned, religious and comfortable; virtuous children.',
    '-Sickly, with strong enemies; lives abroad.',
    '+Earns through the spouse; generous; long life; high status.',
    '-Ventures that fail; sickly, though long-lived.',
    '+Favoured by authority; wealthy, truthful, religious and very learned.',
    '+Honoured by authority; self-controlled and truthful; devoted to the mother.',
    '+Gains from all pursuits; renowned for learning and wealth; many children and grandchildren.',
    '~Dealings with foreigners; spends on religious deeds; chronic illness. Today often an elder sibling abroad, or import and export.',
  ],
  [ // 12th lord: the subtractor
    '-Spendthrift and physically weak; lives abroad; good-looking; late or no marriage.',
    '~Religious and sweet-spoken; spends on good causes; fear of theft, fire and authority.',
    '~Lives apart from siblings; self-reliant and thrifty.',
    '-No land, home or vehicles; little comfort from the mother; sickly.',
    '-Spends for a child; little learning; pilgrimages.',
    '-Temper and unhappiness; hostility to own people; eye trouble.',
    '-Spends on the spouse, with little comfort from the spouse.',
    '+Sweet-spoken, with good qualities; acquires wealth.',
    '~Selfish; at odds with friends and teachers; pilgrimages.',
    '-Little comfort from the father; losses through authority; saves for the children.',
    '~Rich and famous but suffers losses; long life; truthful.',
    '-Spendthrift; temper; sickly.',
  ],
]

type Ctx = { chart: VedicChart; g: Graha; house: number }
type Qualifier = [(c: Ctx) => boolean, string]

const MALEFIC: Graha[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']
const BENEFIC: Graha[] = ['Mercury', 'Jupiter', 'Venus', 'Moon']
const nearOf = (c: Ctx) => [...conjunctWith(c.chart, c.g), ...aspectsOnGraha(c.chart, c.g)]
const afflicted = (c: Ctx) => nearOf(c).some((x) => MALEFIC.includes(x))
const benefited = (c: Ctx) => nearOf(c).some((x) => BENEFIC.includes(x) && x !== 'Moon')
const naturalMalefic = (c: Ctx) => GRAHA_INFO[c.g].nature === 'malefic'
const strongSign = (c: Ctx) => { const d = pos(c.chart, c.g).dignity; return d === 'exalted' || d === 'own' || d === 'moolatrikona' }
const signIs = (...signs: number[]) => (c: Ctx) => signs.includes(pos(c.chart, c.g).sign)
const houseHas = (h: number, list: Graha[]) => (c: Ctx) => c.chart.grahas.some((x) => x.house === h && list.includes(x.graha))

/** Extra lines that apply only when a condition holds, keyed by `lord-house`. */
const LORD_QUALIFIERS: Record<string, Qualifier[]> = {
  '1-6': [[afflicted, '-Afflicted here: health and opponents need care.']],
  '1-7': [[naturalMalefic, '-As a natural malefic: distance from the spouse and a life of extremes, often away from home.']],
  '1-8': [[naturalMalefic, '-As a natural malefic: eye trouble.'], [(c) => !naturalMalefic(c), '+As a natural benefic: good looks.']],
  '1-12': [[(c) => !houseHas(12, ['Mercury', 'Jupiter', 'Venus'])(c) && !benefited(c), '-With no benefic influence: wasteful spending and temper.'], [benefited, '+Benefic influence here reduces the harm.']],
  '2-3': [[naturalMalefic, '-As a natural malefic: friction with siblings.'], [(c) => c.g === 'Mars', '-Mars here: dishonest dealings.']],
  '2-4': [[(c) => strongSign(c) || nearOf(c).some((x) => x === 'Jupiter' || x === 'Venus'), '+Exalted, or with Jupiter or Venus: royal standing.']],
  '2-6': [[afflicted, '-With malefics: loss of wealth.']],
  '2-7': [[afflicted, '-Afflicted: strain on fidelity in the marriage.']],
  '2-12': [[(c) => !naturalMalefic(c), '+As a natural benefic: a well-known trader.']],
  '3-5': [[afflicted, '-Malefic influence: a harsh spouse.']],
  '4-6': [[naturalMalefic, '-As a natural malefic: harms the father\'s good name.'], [(c) => !naturalMalefic(c), '+As a natural benefic: accumulates wealth.']],
  '5-5': [[benefited, '+Benefic influence: good for children.'], [afflicted, '-Malefic influence: children delayed or denied.']],
  '6-1': [[benefited, '+Benefic influence: good health.']],
  '8-6': ([['Sun', 'friction with authority'], ['Moon', 'illness'], ['Mars', 'a quick temper'], ['Mercury', 'timidity'], ['Jupiter', 'trouble with the limbs'], ['Venus', 'eye trouble'], ['Saturn', 'mouth trouble']] as [Graha, string][])
    .map(([g, t]): Qualifier => [(c) => c.g === g, `~${g} as the 8th lord here adds ${t}.`]),
  '8-7': [[afflicted, '-With a malefic: business losses and trouble through the spouse.']],
  '8-8': [[(c) => { const d = pos(c.chart, c.g).dignity; return d === 'debilitated' || pos(c.chart, c.g).combust }, '~Weak here, so the promise is only partly kept.']],
  '8-11': [[benefited, '+Well associated: long life.'], [afflicted, '-Badly associated: poverty.']],
  '10-12': [[naturalMalefic, '~As a natural malefic: work or travel abroad.']],
  '12-6': [[(c) => c.g === 'Venus', '-Venus here: serious eye trouble.']],
}

/* ------------------------------------------------------------------ */
/* Ch XVIII: planets in houses                                          */
/* ------------------------------------------------------------------ */

const IN_HOUSE: Record<Graha, string[]> = {
  Sun: [
    '~Proud, brave and quick to anger; tall with a spare build; eyes need care.',
    '~Losses through authority; face or teeth trouble; yet can be very rich.',
    '+Brave, wealthy, generous and strong; learned; defeats opponents; few siblings.',
    '-Few home comforts, friends, land or house; strain on the heart.',
    '-Few children and worry; wise; travels. Hard on the first child.',
    '+Opulent, powerful and victorious; in authority or a judge; strong digestion.',
    '-Humiliation and illness; friction in partnerships.',
    '-Little wealth or comfort; few children; separation from loved ones; eye trouble.',
    '~Wealth, friends, children and happiness; devout; but hard on the father (a karaka in its own house).',
    '+Renowned, wise, powerful and very wealthy; finishes what is started; royal standing.',
    '+Wealthy, powerful and efficient; many comforts.',
    '-Illness and eye trouble; strays from duty; at odds with the father.',
  ],
  Moon: [
    '~A restless mind and changeable moods.',
    '+Sweet speech, wealth, comforts and a large family; speaks little.',
    '+Virtuous, brave and educated; siblings.',
    '+Happy, detached, learned and sensual; fond of water.',
    '+Children, wealth and learning; timid.',
    '-Temper, opponents and abdominal disorders; a fragile start in life unless benefics help.',
    '+Good-looking, with a beautiful spouse; strong desires; travels.',
    '-Wise and learned but restless and sickly; a fragile start in life unless benefics help.',
    '+Dutiful; comforts, wealth, learning and children.',
    '+Wealthy, pious, capable and generous; finishes what is started.',
    '+Wealthy, famous, brave and thoughtful; children; long life.',
    '-Idle and unhappy; eye trouble; lives abroad.',
  ],
  Mars: [
    '-Reckless, restless and prone to injury.',
    '-Lacks learning, wealth and good company; mouth trouble.',
    '+Brave, powerful and upright; hard on a younger sibling.',
    '-Lacks house, land, money and comfort from the mother; brave.',
    '-Restless; lacks children, wealth and friends; little peace of mind.',
    '+Strong digestion; destroys enemies; a leader.',
    '-Sickly; strain or loss in marriage; quarrelsome.',
    '-Unhappy and sickly; injuries.',
    '~Favoured by authority but irreligious; hard on the parents.',
    '+Brave and generous; royal standing; famous and esteemed.',
    '+Wealthy and brave; gets what is wanted.',
    '-Harsh; strain in marriage; confinement; eye trouble.',
  ],
  Mercury: [
    '+Healthy, sweet-spoken and learned; a mathematician or scholar; long life.',
    '+Good speech, learning, wealth and good food.',
    '~Wavering; hard physical work; cunning; good siblings.',
    '+Very learned; wealth, vehicles, home, comforts and friends.',
    '+Eminent through learning; many children; brave and happy.',
    '~Argumentative; defeats opponents; idle and sickly.',
    '+Knowledgeable, wise and renowned; a wealthy spouse.',
    '+Famous, long-lived and of high standing; a judge.',
    '+Opulent, learned, eloquent and righteous.',
    '+Learned, powerful, righteous, famous and efficient.',
    '+Long life; truthful and intellectual; wealthy and famous.',
    '~Idle and unhappy, yet learned and sweet-spoken.',
  ],
  Jupiter: [
    '+Learned, fearless, long-lived, good-looking, balanced and wealthy.',
    '+Wealthy, eloquent and good-looking; enjoys good food; generous.',
    '~Dominated by a sibling or spouse; covetous; poor digestion; good for siblings.',
    '+Comforts, wealth, vehicles and wisdom; defeats foes; happy.',
    '~Learned, famous, wealthy and virtuous; a minister; worries over children.',
    '~Destroys enemies but idle; poor digestion; weak body; famous.',
    '+Learned and famous; surpasses the father; a good spouse and children.',
    '~Long life, but service and unhappiness.',
    '+Devout, learned, wealthy and famous; a leader or minister.',
    '+Completes undertakings well; wisdom, wealth and virtue.',
    '+Wealthy, steady and long-lived; few children.',
    '-Idle and irresolute; few or no children.',
  ],
  Venus: [
    '+Good-looking, romantic, learned, happy and long-lived.',
    '+Wealthy and graceful; a good speaker and poet.',
    '~Covetous and rich; dominated by the spouse; avoids exertion.',
    '+A good house, jewellery, clothes and vehicles; dominated by the spouse.',
    '+Wealthy and of high status; comforts, children and friends.',
    '-Few enemies but poor; little marital joy.',
    '~Attractive with strong desires; quarrels; many relationships.',
    '+Long life, opulence and many comforts; content.',
    '+Learned and wealthy; spouse, children and friends; religious.',
    '+High status, powerful, wealthy and famous; helped by women.',
    '+Wealthy; free of pain and trouble.',
    '~Idle and pleasure-seeking.',
  ],
  Saturn: [
    '-Hardship, idleness and illness.',
    '-Poverty and mouth trouble; gains after leaving home.',
    '+Strong, generous, wise and wealthy.',
    '-Hard on the mother; separation from loved ones; sickly when young, yet wise and rich.',
    '-Restless; lacks children, comfort and wisdom; defeats opponents.',
    '+Wealthy with a big appetite; much trouble from enemies, but overcomes them.',
    '-Ill health; a sickly spouse.',
    '~Heroic; gains early and losses later; generally favours longevity.',
    '~Irreligious and hard on the father, though many great spiritual figures have it: never judge by one factor.',
    '+Learned, wealthy and powerful; a judge or leader.',
    '+Stable fame, good health, much wealth and long life.',
    '-Weak sight and a spendthrift streak; yet a leader.',
  ],
  Rahu: [
    '~Brave and wealthy but harsh; ailments of the upper body.',
    '-Quarrelsome and poor; veiled speech; mouth trouble.',
    '+Wealthy, brave, proud and long-lived; spouse, children and friends; friction with siblings.',
    '-Lacks comfort; friction with the spouse.',
    '-Temper; hard on children; phobias; abdominal ailments.',
    '+Defeats enemies; wealth, children and comforts; long life.',
    '-Losses through relationships; separation; ailing.',
    '-Vata illness, few children and unhappiness; fearless.',
    '~Leads a group or town; at odds with the father; troubled by opponents.',
    '+Fearless, helpful, famous, learned and wealthy; a minister; travels.',
    '+Wealthy, long-lived, self-controlled and learned; lives abroad; ear trouble.',
    '-Little comfort or wealth; secret wrongdoing; lives abroad.',
  ],
  Ketu: [
    '-Anxious; displaced from home or position; injuries.',
    '-Little learning or wealth; eye or mouth trouble; friction with family.',
    '+Virtuous, wealthy and combative; defeats enemies; long-lived.',
    '-Loses comfort, ancestral land or house; lives away from home.',
    '-Abdominal trouble and phobias; little learning or few children.',
    '+Defeats foes; good health; generous and learned.',
    '-Little comfort from the spouse; losses.',
    '-Separation and risk of injury; covetous.',
    '~Eloquent; at odds with the father; fortune through foreigners.',
    '+Powerful and renowned; defeats opponents; self-knowledge; travels.',
    '+Brave, powerful, renowned and learned.',
    '~Secret wrongdoing; foot or eye trouble; spends on good deeds.',
  ],
}

const HOUSE_QUALIFIERS: Record<string, Qualifier[]> = {
  'Sun-1': [[signIs(0), '~In Mesha (exalted): weak eyesight.'], [signIs(4), '+In Simha (own sign): strong.'], [signIs(6), '-In Tula (debilitated): poor eyesight; hard on children.'], [signIs(11), '+In Meena: served and helped by women.']],
  'Moon-1': [[signIs(0), '+In Mesha: many children.'], [signIs(1, 3), '+In Vrisha or Karka: wealth, fame and good looks.'], [(c) => { const s = pos(c.chart, 'Sun').lon, m = pos(c.chart, 'Moon').lon; return Math.abs(((m - s + 540) % 360) - 180) < 12 }, '+A full Moon in the lagna: fearless, wealthy and long-lived.']],
  'Mars-1': [[() => true, '~Forms Kuja (Mangal) dosha, weighed when matching charts.']],
  'Mars-4': [[() => true, '~Forms Kuja (Mangal) dosha, weighed when matching charts.']],
  'Mars-7': [[() => true, '~Forms Kuja (Mangal) dosha, weighed when matching charts.']],
  'Mars-8': [[() => true, '~Forms Kuja (Mangal) dosha, weighed when matching charts.']],
  'Mars-12': [[() => true, '~Forms Kuja (Mangal) dosha, weighed when matching charts.']],
  'Saturn-1': [[signIs(6, 9, 10, 8, 11), '+In Tula, Makara, Kumbha, Dhanu or Meena: leadership, long life, virtue and scholarship instead.']],
  'Rahu-1': [[signIs(0, 3, 4), '+In Mesha, Karka or Simha: pleasure and affluence.'], [benefited, '+Aspected by benefics: all comforts.']],
  'Rahu-3': [[signIs(1), '+Exalted in Vrisha: vehicles and staff.']],
  'Ketu-1': [[benefited, '+Aspected by benefics: princely comforts.'], [signIs(9, 10), '+In a sign of Saturn: wealth and children.']],
  'Ketu-2': [[(c) => ['Mercury', 'Jupiter', 'Venus', 'Moon'].includes(SIGN_LORD[pos(c.chart, 'Ketu').sign]), '+In a benefic\'s sign: comforts.']],
  'Ketu-7': [[signIs(7), '+In Vrischika: many benefits.']],
  'Ketu-8': [[signIs(0, 1, 2, 5, 7), '+In Mesha, Vrisha, Mithuna, Kanya or Vrischika: gain of wealth.']],
  'Ketu-10': [[signIs(0, 1, 5, 7), '+In Mesha, Vrisha, Kanya or Vrischika: overcomes opponents.']],
}

/* Manasagari: planets counted from the natal Moon (Ch XVIII). null = not shown. */
const FROM_MOON: Partial<Record<Graha, (string | null)[]>> = {
  Sun: ['~Travel and enjoyment, with a taste for strife.', '+Dignity and honour from authority.', '+Wealth and influence over many.', '-Strain on the mother.', '~Many sons; concerns through daughters.', '+Defeats opponents.', '+A beautiful spouse and honour.', '-Strife and illness.', '~Religious and truthful; trouble from relatives.', '+Great wealth.', '+Royal dignity, learning and fame; heads the family.', '-Eye strain.'],
  Mars: ['~Ruddy; prone to cuts.', '+Land; a son in farming.', '+Siblings and comfort.', '-Little comfort or wealth; strain in marriage.', '-Children come late.', '-Illness and enmity.', '-A difficult spouse.', '-A pull towards wrongdoing.', '+Wealth; a son late in life.', '+Comforts, vehicles and money.', '+Fame at court; handsome.', '-Friction with others, including the mother.'],
  Mercury: ['-Few comforts; harsh speech; restless.', '+Wealth, a house and relatives.', '+Wealth and help from the great.', '+Comfort; gains from the mother\'s side.', '+Intelligent, learned and good-looking, if sharp-tongued.', '-Miserly and timid.', '~Dominated by women; wealthy; long life.', '+Famous; feared by opponents.', '-Rejects own tradition.', '+A raja yoga; family leadership if the Moon is in the 10th.', '+Gains at every step; early marriage.', '-Miserly; a son who struggles.'],
  Jupiter: ['+Long life, health, power and wealth.', '+Honour, valour and virtue; very long life.', '+Loved by women; the father prospers.', '-Few comforts; service; trouble from the mother\'s side.', '+Good eyesight, children and wealth.', '~Long life on little; without a settled home.', '+Long life, sweet speech and health; leads the family.', '-Many ailments.', '+Wealth, virtue and devotion.', '~Leaves family life for austerity.', '+Children, vehicles and royal dignity.', '-Friction with loved ones (eased if Jupiter aspects the 6th from the lagna).'],
  Venus: [null, '+Wealth and scholarship.', '+Religious and wise; earns from foreigners.', '-Phlegmatic and weak; poorer in old age.', '~Many daughters; rich; little fame.', '-Prodigal; loses contests.', '-Aimless and suspicious.', '+Fame, generosity and wealth.', '+Many siblings and friends.', '+Comfort to the parents; long life.', '+Long life, free of illness and enemies.', '-Affairs.'],
  Saturn: ['-Hard on health and relatives.', '-Hard on the mother.', null, '+Effort that overcomes opponents.', '~A dark, sweet-spoken spouse.', '-Many troubles.', '+Religious and generous.', '-Hard on the father; eased by giving.', '-Losses in the Saturn dasha.', '+Royal standing; miserly but wealthy.', '-Hard on health; irreligious.', '-Poverty; irreligious.'],
  Rahu: ['+Royal standing early in life, wealth later.', '~Wealth and fame without comfort.', null, '-Hard on the parents; unhappiness.', '-Few comforts.', '+A minister or ruler; wealthy.', '-Hard on the parents; unhappiness.', null, '+Royal standing early in life, wealth later.', '+Royal standing early in life, wealth later.', '~Wealth and fame without comfort.', '+A minister or ruler; wealthy.'],
}

/* ------------------------------------------------------------------ */
/* Ch XIX: planets in signs, and aspects on them                        */
/* ------------------------------------------------------------------ */

const IN_SIGN: Partial<Record<Graha, string[]>> = {
  Sun: [
    '~Courageous, combative and a traveller; strong bones; blood and Pitta disorders; modest wealth.',
    '+Tolerant, wise and diplomatic; earns through scents and cloth; instrumental music; mouth and eye ailments.',
    '+Good-looking, learned, wealthy and sweet-spoken; astrology; a keen learner.',
    '~Hard toil and service; friction with the father; a good speaker and religious; royal bearing under benefic influence.',
    '+Strong and learned in many arts; rich, with a royal bearing; quick to anger; ear trouble.',
    '+Writing, painting, poetry and mathematics; shy; respectful; earns well; a delicate build.',
    '-Debilitated: overcome by opponents, quarrelsome and poor; humiliation by authority; rash courage.',
    '-Quarrelsome and combative; friction with the parents; danger from fire or weapons; wastes earnings.',
    '+Rich, scholarly and devout; liked by authority; knowledge of medicine; strong.',
    '-Covetous, timid and wandering; uncomfortable; lives off others.',
    '-Few comforts or children; temper; rigid ideas; unsteady friendships; heart strain.',
    '+Friends and a loving spouse; learned; trade in water produce or land; many siblings.',
  ],
  Moon: [
    '~Quick to anger, wealthy and brave; few siblings; restless; honoured; wary of water.',
    '+Charitable, sensual, honoured and strong; many daughters; forgiving; steady in friendship.',
    '+A poet; good-looking, highly intelligent and witty; reads hidden thoughts.',
    '~Fluctuating wealth; houses, land and friends; loves water and gardens; loses composure at times.',
    '~Energetic and broad-built; roams hills and forests; hunger and dental trouble; few sons; devoted to the parents.',
    '+Good-looking, learned and truthful; a teacher; forgiving; music; many daughters; lives abroad.',
    '~Dominated by the spouse; devout; good at trade; fluctuating fortune; helps relatives who leave.',
    '-Debilitated: sickly when young; covetous and sceptical; secret wrongdoing.',
    '+Sattvic, wealthy and eloquent; many arts; inheritance; a poet; very brave.',
    '~Musical and learned; religious and forgiving; travels; idle; dislikes the cold.',
    '-Idle and clever; liked by friends but poor; lives off others.',
    '+Talented; trade in sea produce; devoted to family; defeats opponents; generous.',
  ],
  Mars: [
    '+Truthful, bold and combative; fame and wealth; livestock and crops; quick to anger.',
    '-Many enemies and few comforts; harsh speech.',
    '+A large family; good-looking; many subjects; a poet or sculptor; travels abroad.',
    '-Debilitated: lives off others; sickly and unhappy; earns from land or water.',
    '~Brave but poor; strenuous work; impatient; may lose the first spouse.',
    '+Wealthy, with a large family; sweet-spoken and learned; spendthrift; fears enemies.',
    '~A traveller and speaker; devoted to spouse and friends; may lose the first spouse.',
    '~Victorious and truthful; defeats foes; danger from poison, fire or weapons.',
    '~High status, but weapon injuries and bitter speech; disrespects elders.',
    '+Exalted: commands an army; royal; brave; self-made; stays in his own country.',
    '-Sickly, at odds with own people, untruthful and unlucky.',
    '-Humiliated by own people; sickly; lives abroad; likes praise.',
  ],
  Mercury: [
    '-Quarrelsome, cunning and changeable; music and dance; wasteful; debt.',
    '+Wealthy, trustworthy and charitable; many arts; clever, famous, musical and witty.',
    '+Fine clothes, wealth and oratory; versed in scripture; comfortable.',
    '~Scholarly; lives abroad; talkative; at odds with friends; poet, singer or dancer.',
    '-Wanders with little learning or wealth; poor memory; in service; yet famous.',
    '+Religious and learned; a poet, writer or orator; honoured, fearless and forgiving.',
    '+Clever speech and many arts; spends freely; devout; a trader.',
    '-Industrious but harsh and greedy; covets others\' wealth.',
    '+Learned, famous and forgiving; brave and wealthy; a teacher, writer and clever speaker.',
    '-In service; untruthful and fickle; shunned by relatives; timid.',
    '-Troubled by opponents; neglects duty; speech defect; timid.',
    '~Good-natured and pious; lives far away; capable; helps others while poor.',
  ],
  Jupiter: [
    '~Pious and argumentative; jewels, wealth and fame; spends freely; opposed by many.',
    '+Healthy and good-looking; devout and faithful; land and cattle; wise and kind.',
    '+A minister; friends and sons; good-looking; an orator; religious.',
    '+Exalted: wealthy, learned, handsome, religious, strong and truthful; royal.',
    '+Strong, learned, wealthy and pious; royal; leads an army.',
    '+Learned, pious and efficient; many branches of learning; defeats opponents.',
    '+Wise and learned; earns from abroad; soft-spoken; a trader.',
    '~A scriptural commentator; clever; sickly and toiling; quick to anger.',
    '+A religious teacher; very wealthy and charitable; high rank; travel and pilgrimage.',
    '-Debilitated: in service and toiling; few pleasures; weak; lives far away.',
    '-Sickly and greedy; loses money; abdominal and dental trouble (Varahamihira reads it like Karka).',
    '+Versed in scripture; respected and famous.',
  ],
  Venus: [
    '~Leads a group; relationships cause trouble; travels abroad; unreliable; night blindness.',
    '+Many relationships and children; farming and cattle; scents and flowers; no enemies.',
    '+Scriptural, famous and beautiful; a writer and poet; friendly; earns from music and dance.',
    '+Good deeds; learned, strong, religious and balanced; two marriages; illness from excess.',
    '+Gains through women; few children; defeats enemies; comfortable and wealthy.',
    '~Debilitated: very rich but few comforts; simple-natured; pilgrimages; learned.',
    '+Self-made; fine clothes; foreign visits; learned and religious; wavers under pressure.',
    '-Quarrelsome, disliked and talkative; estranged from siblings; poor.',
    '+Virtuous, liked, wealthy, learned and of high rank; admired.',
    '-Very sensual; spendthrift; thin; heart strain; covetous.',
    '-Affairs; at odds with teachers and children; worried; poorly dressed.',
    '+Exalted: very wealthy; defeats opponents; famous and charitable; favoured by authority; soft-spoken.',
  ],
  Saturn: [
    '-Debilitated: weak, overworked and quick-tempered; at odds with loved ones.',
    '-Poor and in service; versatile; unconventional choice of partner.',
    '-Debts, confinement and hard labour; idle.',
    '~Weak constitution; loss of the mother\'s comfort; sickly childhood; learned and famous.',
    '-A skilled writer but quarrelsome and unhappy; in service; few close ties.',
    '~Unsteady; poor company; a sculptor; helpful; wealth and children.',
    '+Exalted: royal; a good speaker honoured in assemblies; travels.',
    '-Danger from fire, weapons or poison; temper; losses and illness.',
    '+Widely famous and content; good earnings; learned; good children; respected.',
    '+Loyal to authority; manages others\' property; learned and famous; travels abroad; brave.',
    '~Very rich but deceitful; drinks; fickle; irreligious.',
    '+Respected, helpful and wealthy; religious, mild and calm; knowledge of gems.',
  ],
}

const ASPECTORS: Record<Graha, Graha[]> = {
  Sun: ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
  Moon: ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
  Mars: ['Sun', 'Moon', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
  Mercury: ['Sun', 'Moon', 'Mars', 'Jupiter', 'Venus', 'Saturn'],
  Jupiter: ['Sun', 'Moon', 'Mars', 'Mercury', 'Venus', 'Saturn'],
  Venus: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Saturn'],
  Saturn: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus'],
  Rahu: [], Ketu: [],
}

/**
 * Aspects on a planet by the sign it occupies. Keys are the lord of that sign
 * (for the Moon, the sign number 0 to 11). Values follow ASPECTORS order.
 */
const ASPECTS: Partial<Record<Graha, Record<string, string[]>>> = {
  Sun: {
    Mars: ['+Charitable and good-looking; many staff.', '+Very strong; composed in conflict.', '-Weak and in service.', '+Wealthy; a minister or judge.', '-Disreputable company; poverty.', '-Timid and ailing.'],
    Venus: ['~Many relationships; water trades.', '+Composed in conflict; self-made.', '+Music, poetry and writing; good looks.', '+Friends and foes; a minister; content.', '+Beautiful eyes; a minister; wealthy.', '-Idle, poor and ailing.'],
    Mercury: ['-Troubled by friends and foes; hard travel.', '-Fears enemies; defeated.', '+Kingly and famous, with friends; eye trouble.', '~Learned in mantra but volatile; travels.', '+Comfort from spouse, children and wealth.', '~Excitable and tricky; many staff.'],
    Moon: ['~Royal standing but harsh; water trades.', '-Inflammation; few friends or children.', '+Learned, of high status, liked by authority.', '+An envoy; high status; famous.', '+Earns through women; kind and brave.', '-Kapha and Vata ailments; gossip.'],
    Sun: ['~Shrewd and liked by authority; Kapha ailments.', '+Brave and clever; feared by others.', '~A writer and traveller; physically weak.', '+Builds temples, gardens and ponds; likes solitude.', '-Harsh; disliked by relatives; skin ailment.', '-Troubles loved ones.'],
    Jupiter: ['+Children, learning and fame; royal; content.', '+Fame in conflict; clear speech; wealth.', '+A poet and linguist; knowledge of metals.', '+Learned and wealthy; close to authority.', '+A virtuous, beautiful spouse; fine clothes.', '-Serves the unworthy; tends cattle.'],
    Saturn: ['-Unsteady; losses through women.', '-Illness, enemies and injury.', '~Brave but covetous.', '+Wise and famous; shelters many.', '~Trade in shells; questionable gains.', '+Defeats foes; trusted by authority; happy.'],
  },
  Moon: {
    0: ['-Quick temper; poverty.', '~Dental, eye or urinary trouble, yet high status.', '+Learned, a poet; famous.', '+Royal status and wealth.', '+Amiable, virtuous, a good speaker.', '-Sickly and untruthful.'],
    1: ['-Farming, hard labour and service.', '~Strong desires; liked by women; no property.', '+Learned, eloquent and talented.', '+Virtuous and famous; a good spouse and children.', '+Many comforts; royal.', '~Wealthy but ill-natured; hard on the mother.'],
    2: ['~Poor but clever; hardships.', '~Brave and learned; an arms trade; a limb defect.', '+Royal; a confidant; defeats opponents.', '+A wise teacher.', '+Fearless; a beautiful spouse, vehicles and jewellery.', '-Few possessions or family; a weaver.'],
    3: ['-Eye disease; guards a fort; poor.', '~Brave and of high status, but a weak body.', '+Learned, a poet and minister.', '+Learned, famous and royal.', '+Gems and jewellery; good-looking.', '-Wanders; friction with the mother; trade in iron.'],
    4: ['~Good qualities, brave and royal; children delayed.', '+Royal; commands an army; quick to anger.', '+Devoted to the spouse; an astrologer.', '+Wealthy, virtuous and famous.', '~Learned and royal, but sickly.', '-Farming; few comforts at home.'],
    5: ['+Serves women; varied comforts.', '+A sculptor; famous and wealthy.', '+A poet or astrologer; wins debates; royal.', '+Liked by authority; leads an army; keeps his word.', '+Wealthy, learned and talented.', '-Little wealth or wisdom; dependent on women.'],
    6: ['-Wanders; sickly, poor and humiliated.', '-Quick temper; eye disease.', '+Many talents; very wealthy and eloquent.', '+Highly respected; trade in gold and gems.', '+Healthy, good-looking and wealthy; a trader.', '~Harsh, wealthy and pleasure-seeking.'],
    7: ['-A learned wanderer; few comforts; disliked.', '+Famous and royal; wins conflicts.', '~Crude speech; twins; capable.', '+Principled and good-looking.', '~Wealthy and pleasant; reads others\' weaknesses.', '-Sickly; a limb defect; greedy.'],
    8: ['+Wealthy, famous and royal.', '+Commands an army; wealthy and brave.', '+A sculptor and astrologer; protects family.', '+Handsome and religious; a minister.', '+Good-looking; a good spouse and friends.', '~A good speaker and philosophical, but proud.'],
    9: ['-Poor and wandering; helps others.', '+Famous, royal and wealthy.', '~Royal, but distant from family.', '+Very brave and royal; a large family.', '~Learned; enjoys others\' wealth.', '-Idle but rich.'],
    10: ['-Plain looks; farming.', '-Truthful but idle; in service.', '+Comforts; a good speaker; royal.', '+Royal status and possessions.', '-Joyless and timid.', '-Irreligious (benefic aspects bring fame and prosperity).'],
    11: ['~Very sensual and rich; leads an army.', '-Humiliated; few comforts.', '+Witty, wealthy and famous.', '+Good-looking, very wealthy and royal.', '+Learned and amiable; music and dance.', '-Driven by desire; poor company.'],
  },
  Mars: {
    Mars: ['+A minister or judge; wealth, spouse and sons.', '~Brave but injury-prone; hard on the mother.', '-Sensual; covets others\' wealth.', '+Learned, sweet-spoken and wealthy; devoted to the father.', '-Big appetite; trouble through women.', '-Shunned by family; weak body.'],
    Venus: ['~Roams forests; quick to anger.', '-Friction with the mother; timid.', '~Learned and talkative but quarrelsome.', '+Fortunate; dance and music.', '+Praised; a minister or commander; comforts.', '+Famous, amiable, wealthy and learned.'],
    Mercury: ['+Learned, wealthy and brave.', '+Amiable, wise and wealthy; in security service.', '~Talkative and mathematical; pleasant fibs.', '+An envoy or ruler; very skilled; leaves home.', '+Wealthy; good food and clothes; devoted to the spouse.', '~Farming; idle but brave.'],
    Moon: ['~Excess Pitta; a judge who can punish.', '-Sickly; ordinary looks.', '-Shameless and friendless.', '+Famous, learned, in high office.', '-Trouble through women; losses.', '+Sea travel and trade; good-looking; royal.'],
    Sun: ['~Roams; aggressive; protects his people.', '~Tough and harsh; hard on the mother; skilful.', '~A sculptor or painter; clever but greedy.', '+Leads an army; liked by authority; learned.', '+Good-looking, famous and youthful.', '-Looks old; poor and anxious.'],
    Jupiter: ['~Respected but harsh.', '~Quarrelsome and learned; against authority.', '+Clever, learned and amiable.', '-Leaves home; little comfort; always fighting foes.', '+Many comforts.', '-In service; wanders.'],
    Saturn: ['+Brave; wealth, spouse and children.', '-Hostile to the mother; displaced.', '-Sweet-spoken but poor and weak.', '+Long-lived, good-looking and liked by authority.', '~Quarrelsome but comfortable.', '+Very wealthy, learned and royal; brave.'],
  },
  Mercury: {
    Mars: ['+Truthful and loved by siblings; comforts.', '~Music and dance; staff and vehicles.', '~Untruthful but eloquent and very rich.', '+Wealthy and happy.', '+Clever, polite and trusted.', '-Harsh and unhappy.'],
    Venus: ['-Sickly, poor and humiliated.', '+Rich, trusted, healthy and famous.', '-Humiliated by authority; illness and opponents.', '+Learned and trusted; a local leader.', '+Fortunate; fine clothes.', '-Few comforts; trouble from family.'],
    Mercury: ['+Truthful, good-looking, liked by authority.', '~Scriptural and sweet but talkative.', '~Liked; serves authority; gossip.', '+High government office; wealthy and brave.', '+Scholarly; employed by authority; a loyal friend.', '+Kind; completes tasks; wealthy.'],
    Moon: ['~Craft trades.', '-Weak; ailments; few comforts.', '-Little education; talkative.', '+Wise, kind, fortunate and honoured.', '+Very attractive; dance and music.', '-Deceitful; confinement.'],
    Sun: ['-Jealous and in service.', '+Good-looking and capable; poetry and music; wealthy.', '-Unhappy; injuries.', '+Very learned; an impressive speaker; high status.', '+Beautiful and pleasure-loving; wealthy.', '-Tall but unhappy.'],
    Jupiter: ['~Brave and calm; kidney stones or diabetes.', '+A writer; good-looking; good friends.', '~A writer; unscrupulous company.', '+Very learned with a great memory; a treasurer.', '~A minister; youthful and brave.', '-A big appetite; incompetent.'],
    Saturn: ['~A large family; a wrestler; famous.', '~Water trades; timid.', '~Inactive and shy, but wealthy.', '+Very wealthy; a local leader.', '~Many children; a difficult spouse.', '-Poor and unhappy.'],
  },
  Jupiter: {
    Mars: ['+Very pious, truthful and famous.', '+Gentle, religious and a scholar; loved by the spouse.', '+Brave; a leader who humbles opponents.', '-Deceptive and fault-finding.', '~Timid, but fine clothes and pleasures.', '-Greedy; an unsteady friend.'],
    Venus: ['~Wanders; serves authority; vehicles and cattle.', '+Very rich and handsome.', '+Honoured; learned and wealthy.', '+Learned, clever and virtuous.', '+Wealthy, famous and comfortable.', '~Scholarly and wealthy; a local head.'],
    Mercury: ['+A village head; a large family; well known.', '+Very famous and wealthy; loved by the mother.', '+Victorious and wealthy; scars.', '+An astrologer and good speaker; family.', '+Wealth, spouse, children, land and houses.', '+A local head; honoured.'],
    Moon: ['~Losses then gains through the spouse; a leader.', '+Manages a treasury; high status.', '+Wealthy and scholarly; scars.', '~Favours siblings; wealthy but quarrelsome.', '+Very famous and fortunate.', '~Heads a town or army; comfort in old age.'],
    Sun: ['+A big spender; famous and kind; royal.', '+Very fortunate; wealth through the spouse.', '+Does hard tasks; a pious leader.', '+A builder, scientist, orator and minister.', '+Status from authority; strong.', '-No comfort; loses status.'],
    Jupiter: ['-Against authority; shunned by friends.', '+Many comforts; proud of wealth.', '~Injured in conflict; harsh yet helpful.', '+A minister or ruler; wealth, sons and fortune.', '+Wealthy, content, famous and long-lived.', '-Timid; loses status.'],
    Saturn: ['+Learned, royal, handsome and brave.', '+A sharp intellect; religious; wealthy.', '+Brave; serves the state; honoured.', '~Yields to women; a leader; rich; many friends.', '+Many pleasures and possessions.', '+High character; learned, famous and royal.'],
  },
  Venus: {
    Mars: ['~Favoured by authority; troubled by the spouse.', '-Very fickle; strong desires.', '-Little money or status; in service.', '-Harsh; illegitimate earnings.', '+Good-looking, charitable and tall; a good spouse.', '-Idle and wandering.'],
    Venus: ['+A beautiful spouse; wealthy.', '+Sons, wealth and status; good looks.', '-No home or comfort; defeated.', '+Learned, well-mannered and famous.', '+Gets everything desired.', '-Poor and sickly; a difficult spouse.'],
    Mercury: ['+Serves women; wise, rich and comfortable.', '+Youthful looks; comforts.', '~Fortunate; spends on women.', '+Learned, good-looking and wealthy; a leader.', '+A learned teacher; an artist; comforts.', '-Humiliated; unhappy.'],
    Moon: ['~Temper; a wealthy spouse; opponents.', '+A daughter first, then sons.', '~Many arts and wealth; trouble from women.', '+A learned spouse; rich; wanders.', '+Wealth, sons, staff and vehicles; favoured.', '-Dominated by women; poor.'],
    Sun: ['~Jealous; earns through women.', '~Unsteady but famous; trouble through women.', '~Favoured and famous; affairs.', '-Hoards; greedy and untruthful.', '+High status; a large family; rich.', '+Royal and good-looking; marries a widow.'],
    Jupiter: ['+Learned, wealthy and strong; travels abroad.', '+Famous, of high status, very strong.', '+Comforts; a natural leader.', '+Jewellery, fine dress, food and vehicles.', '+A large family; very wealthy.', '+Fortunate, rich and earns well.'],
    Saturn: ['+Consistent, famous, wealthy and truthful.', '+Brave, powerful and wealthy.', '-Sickly; exhausted by labour; poverty.', '+Learned and truthful; saves money.', '+Youthful; music; fine clothes and perfume.', '+Staff and comforts.'],
  },
  Saturn: {
    Mars: ['+Farming; rich; cattle.', '-Poor company; fickle.', '-Harsh and cruel to animals.', '-Quarrelsome and irreligious.', '+Religious and fortunate; a minister; wealthy.', '-Changeable; destitute.'],
    Venus: ['~Little wealth; learned; clear speech.', '+High status; helped by women; fine clothes.', '+Skilled in warfare; kind; rich.', '+Witty; liked by authority.', '+Helpful, charitable and skilful.', '~Liked by authority; gains from gems; indulgent.'],
    Mercury: ['+Religious and content.', '+Royal; loved and respected by women.', '~A fighter; wise but a limb defect.', '+Wealthy; dance and the arts.', '+Favoured by authority; virtuous.', '~Fond of women; yoga.'],
    Moon: ['-Early loss of the father\'s support; few comforts.', '~Wealthy but hard on mother and siblings.', '~Weak but favoured; anxious.', '-Wanders; deceitful; an orator.', '+Friends, sons, land and houses.', '-Few comforts despite a good family.'],
    Sun: ['-Few comforts; drinks; unhappy.', '+Fame, wealth and gems; favoured.', '-Wanders; a harsh fighter.', '-Deceitful, idle and poor.', '+Leads a town or group; wealthy and virtuous.', '~Good-looking and wealthy; trouble from women.'],
    Jupiter: ['~Famous; fond of others\' children.', '~Loss of the mother\'s support; spouse, sons and riches.', '-Vata illness; lives abroad.', '+Royal, respectable and rich.', '+Royal; commands an army.', '~Lives abroad; many pursuits at once.'],
    Saturn: ['-Sickly; wanders; carries loads.', '~Wealth and a spouse; friction with the mother.', '+Brave and famous; leads multitudes.', '~Powerful and famous; little money.', '+Famous, virtuous, long-lived and healthy.', '~Very wealthy; follows no norms.'],
  },
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                           */
/* ------------------------------------------------------------------ */

const line = (id: string, label: string, raw: string, source: string): ClassicalLine => ({ id, label, source, ...parse(raw) })

function qualifiers(list: Qualifier[] | undefined, ctx: Ctx, id: string, source: string): ClassicalLine[] {
  return (list ?? []).filter(([when]) => when(ctx)).map(([, raw], i) => line(`${id}-q${i}`, 'Condition', raw, source))
}

/** Classical lines for a house lord: where it sits, with any condition that applies. */
export function lordLines(chart: VedicChart, house: number): ClassicalLine[] {
  if (chart.lagnaSign === null) return []
  const g = lordOfHouse(chart, house)
  const at = pos(chart, g).house!
  const src = 'Charak XVII (Parashara)'
  const id = `L${house}-H${at}`
  return [line(id, `${ordinal(house)} lord in the ${ordinal(at)}`, LORD_IN_HOUSE[house - 1][at - 1], src),
    ...qualifiers(LORD_QUALIFIERS[`${house}-${at}`], { chart, g, house: at }, id, src)]
}

/** Classical lines for a planet: its house, its sign, aspects it receives and its house from the Moon. */
export function grahaLines(chart: VedicChart, g: Graha): ClassicalLine[] {
  const p = pos(chart, g)
  const out: ClassicalLine[] = []
  if (p.house) {
    const id = `${g}-H${p.house}`
    out.push(line(id, `In the ${ordinal(p.house)} house`, IN_HOUSE[g][p.house - 1], 'Charak XVIII'))
    out.push(...qualifiers(HOUSE_QUALIFIERS[`${g}-${p.house}`], { chart, g, house: p.house }, id, 'Charak XVIII'))
  }
  const sign = IN_SIGN[g]
  if (sign) out.push(line(`${g}-S${p.sign}`, 'In this sign', sign[p.sign], 'Charak XIX'))
  const grid = ASPECTS[g]
  if (grid) {
    const row = grid[g === 'Moon' ? String(p.sign) : SIGN_LORD[p.sign]]
    const on = aspectsOnGraha(chart, g)
    if (row) ASPECTORS[g].forEach((a, i) => { if (on.includes(a)) out.push(line(`${g}-S${p.sign}-A${a}`, `Aspected by ${a}`, row[i], 'Charak XIX')) })
  }
  const fm = FROM_MOON[g]
  if (fm && g !== 'Moon') {
    const n = ((p.sign - pos(chart, 'Moon').sign + 12) % 12) + 1
    const raw = fm[n - 1]
    if (raw) out.push(line(`${g}-M${n}`, `${ordinal(n)} from the Moon`, raw, 'Charak XVIII (Manasagari)'))
  }
  return out
}

/** Counts of each table, for tests. */
export const CLASSICAL_SIZE = {
  lordInHouse: LORD_IN_HOUSE.flat().length,
  inHouse: Object.values(IN_HOUSE).flat().length,
  inSign: Object.values(IN_SIGN).flat().length,
  aspects: Object.values(ASPECTS).flatMap((r) => Object.values(r).flat()).length,
}
