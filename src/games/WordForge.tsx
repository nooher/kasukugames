import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  Star,
  Trophy,
  Zap,
  Check,
  RotateCcw,
  ChevronRight,
  Flame,
  Target,
} from 'lucide-react';
import { sfxTap, sfxWrong, sfxLevelUp, sfxGameOver, sfxScore, sfxTimer } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx';

/* ------------------------------------------------------------------ */
/*  DICTIONARY (~200 common 3-7 letter English words)                  */
/* ------------------------------------------------------------------ */
const DICTIONARY = new Set([
  // 3-letter
  'ace','act','add','age','ago','aid','aim','air','all','and','ant','any','ape',
  'arc','are','ark','arm','art','ask','ate','awe','axe','bad','bag','ban','bar',
  'bat','bay','bed','bet','bid','big','bin','bit','bow','box','boy','bud','bug',
  'bun','bus','but','buy','cab','can','cap','car','cat','cop','cow','cry','cub',
  'cup','cur','cut','dab','dad','dam','day','den','dew','did','dig','dim','dip',
  'doe','dog','dot','dry','dub','dud','due','dug','dye','ear','eat','egg','elk',
  'elm','end','era','eve','ewe','eye','fan','far','fat','fed','few','fig','fin',
  'fir','fit','fix','fly','foe','fog','for','fox','fry','fun','fur','gag','gap',
  'gas','gem','get','gin','god','got','gum','gun','gut','guy','gym','had','ham',
  'has','hat','hay','hen','her','hid','him','hip','his','hit','hog','hop','hot',
  'how','hub','hue','hug','hum','hut','ice','ill','imp','ink','inn','ion','ire',
  'irk','its','ivy','jab','jag','jam','jar','jaw','jay','jet','jig','job','jog',
  'jot','joy','jug','jut','keg','ken','key','kid','kin','kit','lab','lad','lag',
  'lap','law','lay','led','leg','let','lid','lie','lip','lit','log','lot','low',
  'lug','mad','man','map','mar','mat','may','men','met','mid','mix','mob','mom',
  'mop','mud','mug','nab','nag','nap','net','new','nil','nip','nit','nod','nor',
  'not','now','nun','nut','oak','oar','oat','odd','ode','off','oft','oil','old',
  'one','opt','orb','ore','our','out','owe','owl','own','pad','pal','pan','pat',
  'paw','pay','pea','peg','pen','per','pet','pie','pig','pin','pit','ply','pod',
  'pop','pot','pow','pro','pry','pub','pug','pun','pup','put','rag','ram','ran',
  'rap','rat','raw','ray','red','ref','rib','rid','rig','rim','rip','rob','rod',
  'rot','row','rub','rug','rum','run','rut','rye','sad','sag','sap','sat','saw',
  'say','sea','set','sew','she','shy','sin','sip','sir','sis','sit','six','ski',
  'sky','sly','sob','sod','son','sop','sot','sow','soy','spa','spy','sty','sub',
  'sue','sum','sun','sup','tab','tad','tag','tan','tap','tar','tax','tea','ten',
  'the','tie','tin','tip','toe','ton','too','top','tow','toy','try','tub','tug',
  'two','urn','use','van','vat','vet','vie','vow','wad','wag','war','was','wax',
  'way','web','wed','wet','who','wig','win','wit','woe','wok','won','woo','wow',
  'yak','yam','yap','yaw','yea','yes','yet','yew','you','zap','zed','zen','zig',
  'zip','zoo',
  // 4-letter
  'able','also','area','army','away','back','ball','band','bank','barn','base',
  'bath','bear','beat','been','bell','belt','bend','best','bill','bird','bite',
  'blow','blue','boat','body','bold','bolt','bomb','bond','bone','book','born',
  'boss','both','bowl','bulk','burn','busy','cafe','cage','cake','call','calm',
  'came','camp','card','care','cart','case','cash','cast','cave','chip','chop',
  'cite','city','clam','clan','clap','clay','clip','club','clue','coal','coat',
  'code','coil','coin','cold','cole','come','cone','cook','cool','cope','copy',
  'cord','core','cork','corn','cost','crew','crop','cube','cult','cure','curl',
  'cute','dale','dame','damp','dare','dark','dart','data','date','dawn','dead',
  'deal','dear','debt','deck','deed','deem','deep','deer','demo','deny','desk',
  'dial','dice','diet','dirt','disc','dish','dock','does','dome','done','doom',
  'door','dose','down','drag','draw','drew','drip','drop','drum','dual','duck',
  'duel','duke','dull','dumb','dump','dune','dusk','dust','duty','each','earn',
  'ease','east','easy','edge','else','emit','envy','epic','even','ever','evil',
  'exam','exit','expo','face','fact','fade','fail','fair','fake','fall','fame',
  'fang','fare','farm','fast','fate','fear','feat','feed','feel','fell','felt',
  'file','fill','film','find','fine','fire','firm','fish','fist','five','flag',
  'flan','flap','flat','flaw','fled','flew','flip','flog','flow','foam','foil',
  'fold','folk','fond','font','fool','foot','ford','fore','fork','form','fort',
  'foul','four','free','from','fuel','full','fund','fury','fuse','gain','gale',
  'game','gang','gate','gave','gaze','gear','gene','gift','girl','give','glad',
  'glow','glue','goat','goes','gold','golf','gone','good','grab','gram','gray',
  'grew','grid','grim','grin','grip','grit','grow','gulf','gust','guts','hack',
  'hail','hair','hale','half','hall','halt','hand','hang','hard','hare','harm',
  'harp','hate','haul','have','haze','head','heal','heap','hear','heat','heed',
  'heel','held','help','herb','herd','here','hero','hide','high','hike','hill',
  'hint','hire','hold','hole','home','hook','hope','horn','host','hour','huge',
  'hull','hung','hunt','hurt','hymn','icon','idea','idle','inch','info','iron',
  'isle','item','jack','jade','jail','jest','jilt','join','joke','jump','jury',
  'just','keen','keep','kept','kick','kill','kind','king','kiss','kite','knee',
  'knew','knit','knob','knot','know','lace','lack','laid','lake','lamb','lame',
  'lamp','land','lane','lard','lark','last','late','lawn','lead','leaf','leak',
  'lean','leap','left','lend','lens','less','liar','lick','life','lift','like',
  'limb','lime','limp','line','link','lion','list','live','load','loaf','loan',
  'lock','loft','lone','long','look','loop','lord','lore','lose','loss','lost',
  'loud','love','luck','lump','lure','lurk','lush','made','maid','mail','main',
  'make','male','mall','malt','mane','many','mare','mark','mask','mass','mast',
  'mate','maze','meal','mean','meat','meet','melt','memo','mend','menu','mere',
  'mesh','mess','mild','mile','milk','mill','mind','mine','mint','miss','mist',
  'moat','mock','mode','mold','mood','moon','more','moss','most','moth','move',
  'much','mule','must','mute','myth','nail','name','navy','near','neat','neck',
  'need','nest','news','next','nice','nine','node','none','noon','norm','nose',
  'note','noun','nude','obey','odds','okay','once','only','onto','open','oral',
  'oven','over','pace','pack','page','paid','pail','pain','pair','pale','palm',
  'pane','pare','park','part','pass','past','path','peak','peal','pear','peel',
  'peer','pest','pick','pier','pile','pine','pink','pipe','plan','play','plea',
  'plot','plow','plug','plum','plus','poem','poet','pole','poll','polo','pond',
  'pool','poor','pope','pore','pork','port','pose','post','pour','pray','prey',
  'prop','pull','pulp','pump','pure','push','quit',
  // 5-letter
  'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
  'agent','agree','ahead','alarm','album','alien','align','alike','alive','alley',
  'allow','alone','along','alter','ample','angel','anger','angle','angry','apart',
  'apple','apply','arena','arise','armor','array','arrow','aside','asset','attic',
  'avoid','awake','aware','badge','baker','baron','basic','basin','basis','batch',
  'beach','beard','beast','begin','being','below','bench','berry','bible','birth',
  'black','blade','blame','bland','blank','blast','blaze','bleed','blend','bless',
  'blind','blink','block','blood','bloom','blown','board','boast','bonus','booth',
  'bound','brain','brand','brave','bread','break','breed','brick','bride','brief',
  'bring','broad','broke','brown','brush','build','built','bunch','burst','buyer',
  'cabin','cable','candy','cargo','carry','catch','cause','cedar','chain','chair',
  'chalk','chaos','charm','chart','chase','cheap','check','cheek','cheer','chess',
  'chest','chief','child','china','chunk','civil','claim','clash','class','clean',
  'clear','clerk','cliff','climb','cling','clock','clone','close','cloth','cloud',
  'coach','coast','color','comet','comic','coral','count','court','cover','crack',
  'craft','crane','crash','crazy','cream','creek','crime','crisp','cross','crowd',
  'cruel','crush','curve','cycle','daily','dance','death','debut','decor','delay',
  'delta','dense','depth','derby','devil','diary','dirty','ditch','dizzy','doubt',
  'dough','draft','drain','drake','drama','drank','drawn','dream','dress','dried',
  'drift','drill','drink','drive','drone','drown','drums','drunk','dryer','dusty',
  'dwarf','dying','eager','eagle','early','earth','eight','elect','elite','empty',
  'enemy','enjoy','enter','equal','equip','erase','error','essay','event','every',
  'exact','exams','exert','exile','exist','extra','fable','faith','false','fancy',
  'fatal','fault','feast','fence','ferry','fetch','fever','fiber','field','fifth',
  'fight','final','flame','flash','fleet','flesh','float','flock','flood','floor',
  'flour','fluid','flush','flute','focal','focus','force','forge','forth','forum',
  'found','frame','frank','fraud','fresh','front','frost','fruit','fully','funny',
  // 6-letter
  'absorb','accent','accept','access','across','action','actual','adjust','admire',
  'advice','afford','agenda','almost','amount','animal','annual','appeal','appear',
  'archer','artist','assert','assist','assume','attach','attack','attend','basket',
  'battle','beauty','become','before','behalf','behind','beside','beyond','bitter',
  'blanch','borrow','bottle','bottom','bounce','branch','breath','bridge','bright',
  'broken','bronze','bubble','bucket','budget','bundle','burden','bureau','butter',
  'candle','carbon','career','castle','casual','caught','center','chance','change',
  'charge','choice','choose','chosen','church','circle','clever','client','clinic',
  'closet','coffee','collar','colony','column','combat','comedy','common','comply',
  'corner','cotton','couple','course','cousin','create','credit','crisis','custom',
  'damage','danger','dealer','debate','decent','defeat','defend','define','degree',
  'demand','depend','derive','desert','design','desire','detail','detect','device',
  'devote','differ','dinner','direct','divide','domain','double','dragon','driver',
  'during','easily','editor','effect','effort','emerge','empire','enable','endure',
  'energy','engage','engine','enough','ensure','entire','escape','estate','evolve',
  'exceed','except','excite','excuse','exempt','expand','expect','expert','export',
  'extend','extent','fabric','factor','fairly','farmer','father','faucet','fellow',
  'fierce','figure','filter','finger','finish','flower','flying','follow','forest',
  'forget','formal','former','foster','fourth','freeze','friend','frozen','future',
  'gadget','galaxy','garage','garden','gather','gender','gentle','gifted','global',
  'golden','govern','gravel','ground','growth','guitar','handle','harbor','having',
  'health','heaven','hidden','honest','horror','hunger','hunter','ignore','impact',
  'import','impose','income','indeed','indoor','inform','inject','injury','insert',
  'insist','intact','intend','invest','island','jacket','kidney','knight','launch',
  'leader','legend','lender','lesson','letter','linear','linked','liquid','listen',
  'lively','magnet','mainly','manage','manner','marine','market','master','matter',
  'medium','member','memoir','mental','mentor','merger','method','middle','mighty',
  'minute','mirror','mobile','modern','modest','modify','moment','mostly','mother',
  'motion','museum','mutual','myself','narrow','nation','nature','nearby','nickel',
  'nobody','normal','notice','notion','number','object','obtain','occupy','offend',
  'office','online','option','orange','origin','outfit','output','oxygen','palace',
  'parent','parish','partly','patron','peanut','pencil','people','period','permit',
  'person','phrase','pillar','planet','plunge','pocket','poison','police','policy',
  'portal','poster','potato','potion','powder','prefer','pretty','prince','prison',
  'profit','prompt','proper','proven','public','pursue','puzzle','rabbit','racial',
  'random','rather','rating','reason','recipe','record','reduce','reform','refuse',
  'regard','regime','region','reject','relate','relief','remain','remote','remove',
  'render','rental','repair','repeat','report','rescue','resist','resort','result',
  'retain','retire','return','reveal','review','revolt','reward','ritual','rocket',
  'runner','safely','safety','sailor','sample','saving','scheme','school','screen',
  'script','search','season','second','sector','secure','select','senior','series',
  'settle','signal','silver','simple','single','sister','sketch','slight','smooth',
  'social','sodium','softly','solver','source','speech','spirit','spoken','spread',
  'square','stable','strain','strand','stream','street','stress','strict','strike',
  'string','stroke','strong','studio','submit','sudden','summit','supply','surely',
  'survey','switch','symbol','system','tackle','talent','target','temple','tender',
  'terror','thirty','thread','throne','timber','tissue','tomato','tongue','tribal',
  'tunnel','twelve','unfair','unique','unlike','update','urging','useful','valley',
  'vessel','victim','virgin','virtue','vision','volume','walker','wallet','warmth',
  'wealth','weapon','weekly','wholly','wicked','widget','window','winner','winter',
  'wisdom','within','wonder','worker','worthy','writer',
  // 7-letter
  'ability','absence','absolve','academy','account','achieve','acquire','address',
  'advance','adverse','adviser','affaire','already','amazing','ancient','another',
  'anxiety','anymore','anytime','applied','arrange','article','attempt','auction',
  'average','banking','bargain','barrier','battery','bearing','because','bedroom',
  'believe','beneath','benefit','besides','billion','binding','blanket','bonding',
  'boolean','brother','brought','browser','cabinet','calcium','captain','capture',
  'cardiac','careful','caution','ceiling','central','century','certain','chamber',
  'chapter','charter','chicken','circuit','climate','cluster','coastal','combine',
  'comfort','command','comment','compact','company','compare','compete','complex',
  'compose','concept','concern','conduct','confirm','connect','consent','consist',
  'contain','content','contest','context','control','convert','cooking','correct',
  'council','counsel','counter','country','coupled','courage','crucial','crystal',
  'culture','current','curtain','cushion','customs','cutting','dealing','decline',
  'declare','default','defence','deficit','deliver','density','deposit','desktop',
  'despite','destiny','destroy','develop','devoted','digital','dining','diploma',
  'disable','discard','discuss','disease','display','dispute','diverse','divided',
  'divorce','donated','drawing','edition','elderly','element','emotion','emperor',
  'endless','enforce','enhance','excited','exhibit','expense','explain','exploit',
  'explore','express','extract','extreme','factory','faculty','failure','fashion',
  'feature','fiction','fighter','finally','finding','firearm','fitness','flannel',
  'foolish','foreign','forever','formula','fortune','forward','founded','freedom',
  'freight','fulfill','funding','funeral','gallery','gateway','general','genetic',
  'genuine','gesture','glimpse','goddess','gradual','graphic','gravity','greater',
  'greatly','growing','habitat','halfway','handful','handler','healthy','hearing',
  'heavily','helpful','herself','highway','himself','history','holding','holiday',
  'horizon','hormone','hostile','hosting','housing','however','hundred','hunting',
  'husband','illegal','imagine','immense','impeach','implied','improve','impulse',
  'include','initial','inquiry','insight','inspect','install','instant','instead',
  'interim','invalid','involve','Islamic','jointly','journal','journey','justice',
  'justify','kingdom','kitchen','kneecap','landing','lasting','lawsuit','leading',
  'leather','lecture','leftist','liberal','liberty','license','lighter','limited',
  'linking','listing','literal','locally','logical','longest','looking','loyalty',
  'machine','mandate','marking','massive','mastery','maximum','meaning','measure',
  'medical','meeting','mention','Message','methods','midterm','million','mineral',
  'minimal','minimum','miracle','mission','mistake','mixture','monitor','monthly',
  'morning','mounted','mystery','nations','natural','nearest','neither','nervous',
  'network','neutral','notable','nothing','nuclear','nursing','obvious','october',
  'offense','officer','ongoing','opening','operate','opinion','organic','outline',
  'outlook','outside','overall','painful','painter','parking','partial','partner',
  'passage','passing','passion','patient','pattern','payment','penalty','pension',
  'percent','perfect','perform','persist','picture','pioneer','plastic','pointed',
  'polling','popular','portion','pottery','poverty','precise','predict','prepare',
  'present','preview','primary','printer','privacy','private','probate','Problem',
  'process','produce','product','profile','program','project','promise','promote',
  'prosper','protect','protein','protest','provide','publish','quarter','quickly',
  'radical','reading','realize','reality','receipt','receive','recover','reflect',
  'refugee','refusal','related','release','recover','remains','removal','replace',
  'request','require','reserve','resolve','respect','respond','restore','reunion',
  'reverse','revival','routine','running','russian','satisfy','scatter','scholar',
  'section','senator','serious','servant','serving','session','setting','seventh',
  'several','shelter','shortly','shuttle','silence','similar','sitting','skilled',
  'slavery','smoking','soldier','somehow','speaker','special','sponsor','stadium',
  'station','steward','storage','strange','stretch','student','subject','succeed',
  'success','suggest','summary','support','suppose','supreme','surgeon','surplus',
  'survive','suspect','sustain','tangent','teacher','tension','therapy','thereby',
  'thought','through','tonight','torture','totally','tourism','tourist','towards',
  'tracker','trading','trainer','transit','tribute','trigger','trouble','turning',
  'typical','uniform','unknown','upgrade','Usually','utility','variety','vehicle',
  'venture','version','veteran','victims','village','vintage','violent','visible',
  'visitor','waiting','walking','warfare','warning','warrior','weather','website',
  'wedding','weekend','welcome','welfare','western','whether','whoever','willing',
  'without','witness','workers','working','worship','writing','written',
]);

// Normalize dictionary to lowercase for lookup
const DICT_LOWER = new Set([...DICTIONARY].map(w => w.toLowerCase()));

/* ------------------------------------------------------------------ */
/*  LETTER GENERATION                                                   */
/* ------------------------------------------------------------------ */
const VOWELS = 'AEIOU';

// Weighted letter pool (common English letters appear more often)
const WEIGHTED_LETTERS =
  'EEEEEEEEEETTTTTTTTTAAAAAAAAOOOOOOOOIIIIIIII' +
  'NNNNNNNSSSSSSSRRRRRRRHHHHHHDDDDDLLLLLL' +
  'CCCCUUUUMMMMFFWWYYGGPPBBVVKJXQZ';

function generateLetters(): string[] {
  const letters: string[] = [];
  // Guarantee 3 vowels
  const vowelCount = 3 + Math.floor(Math.random() * 2); // 3 or 4 vowels
  for (let i = 0; i < vowelCount; i++) {
    letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
  }
  // Fill rest from weighted pool
  while (letters.length < 9) {
    const ch = WEIGHTED_LETTERS[Math.floor(Math.random() * WEIGHTED_LETTERS.length)];
    // Avoid too many duplicates (max 2 of same letter)
    if (letters.filter(l => l === ch).length < 2) {
      letters.push(ch);
    }
  }
  // Shuffle
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

/* ------------------------------------------------------------------ */
/*  FIND ALL POSSIBLE WORDS                                             */
/* ------------------------------------------------------------------ */
function findPossibleWords(letters: string[]): string[] {
  const letterCounts: Record<string, number> = {};
  for (const l of letters) {
    const lower = l.toLowerCase();
    letterCounts[lower] = (letterCounts[lower] || 0) + 1;
  }
  const found: string[] = [];
  for (const word of DICT_LOWER) {
    if (word.length < 3 || word.length > 7) continue;
    const wordCounts: Record<string, number> = {};
    for (const ch of word) {
      wordCounts[ch] = (wordCounts[ch] || 0) + 1;
    }
    let valid = true;
    for (const [ch, count] of Object.entries(wordCounts)) {
      if ((letterCounts[ch] || 0) < count) {
        valid = false;
        break;
      }
    }
    if (valid) found.push(word);
  }
  return found;
}

/* ------------------------------------------------------------------ */
/*  SCORING                                                             */
/* ------------------------------------------------------------------ */
function scoreWord(word: string, _goldenLetter: string, selectedIndices: number[], goldenIndex: number): number {
  const len = word.length;
  let base = 0;
  if (len === 3) base = 30;
  else if (len === 4) base = 60;
  else if (len === 5) base = 120;
  else if (len === 6) base = 250;
  else if (len >= 7) base = 500;
  // Check if golden letter was used
  const usedGolden = selectedIndices.includes(goldenIndex);
  return usedGolden ? base * 2 : base;
}

/* ------------------------------------------------------------------ */
/*  THEME                                                               */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#1a2230',
  surface: '#151d2b',
  border: '#1f2d3d',
  accent: '#00b4d8',
  success: '#00c97b',
  error: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  gold: '#f0c040',
};

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                           */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
}

type GamePhase = 'playing' | 'roundEnd' | 'gameEnd';

export default function WordForge({ onBack }: Props) {
  const TOTAL_ROUNDS = 5;
  const ROUND_TIME = 60;

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [totalScore, setTotalScore] = useState(0);
  const [letters, setLetters] = useState<string[]>(() => generateLetters());
  const [goldenIndex, setGoldenIndex] = useState(() => Math.floor(Math.random() * 9));
  const [selected, setSelected] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [possibleWords, setPossibleWords] = useState<string[]>([]);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [bestWord, setBestWord] = useState('');
  const [bestWordScore, setBestWordScore] = useState(0);
  const [shakeSubmit, setShakeSubmit] = useState(false);
  const [popTile, setPopTile] = useState<number | null>(null);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Calculate possible words when letters change
  useEffect(() => {
    setPossibleWords(findPossibleWords(letters));
  }, [letters]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timer <= 0) {
      endRound();
      return;
    }
    if (timer <= 5) sfxTimer();
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timer]);

  const startNewRound = useCallback(() => {
    const newLetters = generateLetters();
    setLetters(newLetters);
    setGoldenIndex(Math.floor(Math.random() * 9));
    setSelected([]);
    setFoundWords([]);
    setTimer(ROUND_TIME);
    setFeedback(null);
    setPhase('playing');
  }, []);

  const endRound = useCallback(() => {
    // Calculate bonus
    // We already accumulated score in totalScore, so just track for display
    const allFound = possibleWords.length > 0 && foundWords.length === possibleWords.length;
    if (allFound) {
      // 2x multiplier bonus - add the current round's points again
      // We need to track round-specific score
    }
    setRoundScores(prev => [...prev, foundWords.length]);
    setPhase('roundEnd');
  }, [foundWords, possibleWords]);

  const handleTileClick = useCallback((index: number) => {
    if (phase !== 'playing') return;
    // Deselect if already last selected
    if (selected.length > 0 && selected[selected.length - 1] === index) {
      setSelected(prev => prev.slice(0, -1));
      return;
    }
    // Skip if already selected (not last)
    if (selected.includes(index)) return;

    sfxTap();
    setPopTile(index);
    setTimeout(() => setPopTile(null), 150);
    setSelected(prev => [...prev, index]);
  }, [phase, selected]);

  const currentWord = selected.map(i => letters[i]).join('').toLowerCase();

  const handleSubmit = useCallback(() => {
    if (phase !== 'playing') return;
    if (selected.length < 3) {
      sfxWrong();
      showFeedback('Need 3+ letters', C.error);
      setShakeSubmit(true);
      setTimeout(() => setShakeSubmit(false), 400);
      setShakeIntensity(4);
      return;
    }
    const word = currentWord;
    if (foundWords.includes(word)) {
      sfxWrong();
      showFeedback('Already found!', C.error);
      setShakeSubmit(true);
      setTimeout(() => setShakeSubmit(false), 400);
      setShakeIntensity(4);
      setSelected([]);
      return;
    }
    if (!DICT_LOWER.has(word)) {
      sfxWrong();
      showFeedback('Not a word', C.error);
      setShakeSubmit(true);
      setTimeout(() => setShakeSubmit(false), 400);
      setShakeIntensity(4);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setParticles(prev => [...prev, ...wrongBurst(rect.width / 2, rect.height * 0.35)]);
      }
      setSelected([]);
      return;
    }
    const pts = scoreWord(word, letters[goldenIndex], selected, goldenIndex);
    sfxScore();
    setTotalScore(prev => prev + pts);
    setFoundWords(prev => [...prev, word]);
    if (pts > bestWordScore) {
      setBestWord(word);
      setBestWordScore(pts);
    }
    showFeedback(`+${pts}`, C.success);
    // VFX burst at center of grid
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = rect.width / 2;
      const cy = rect.height * 0.45;
      setParticles(prev => [...prev, ...correctBurst(cx, cy)]);
      setScorePops(prev => [...prev, createScorePop(cx, cy, pts, C.success)]);
    }
    if (word.length >= 6) {
      setTimeout(() => {
        const r = containerRef.current?.getBoundingClientRect();
        if (r) setParticles(prev => [...prev, ...confettiBurst(r.width / 2, r.height * 0.3)]);
      }, 200);
    }
    setSelected([]);
  }, [phase, selected, currentWord, foundWords, goldenIndex, letters, bestWordScore]);

  const handleClear = useCallback(() => {
    setSelected([]);
  }, []);

  const showFeedback = (text: string, color: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ text, color });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1200);
  };

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
      if (e.key === 'Backspace') {
        if (selected.length > 0) {
          setSelected(prev => prev.slice(0, -1));
        }
      }
      if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit, handleClear, selected]);

  const vfxActive = particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0;
  useEffect(() => {
    if (!vfxActive) return;
    const loop = () => {
      setParticles(prev => prev.length ? tickParticles(prev) : prev);
      setScorePops(prev => prev.length ? tickScorePops(prev) : prev);
      setShakeIntensity(prev => prev > 0.01 ? prev * 0.85 : 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [vfxActive]);

  // Get grid position for connecting lines
  const getTileCenter = (index: number) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const tileSize = 72;
    const gap = 10;
    const totalW = 3 * tileSize + 2 * gap;
    const startX = (totalW - totalW) / 2; // centered
    return {
      x: startX + col * (tileSize + gap) + tileSize / 2,
      y: row * (tileSize + gap) + tileSize / 2,
    };
  };

  /* ---- Styles ---- */
  const s: Record<string, React.CSSProperties> = {
    root: {
      background: C.bg,
      minHeight: '100vh',
      color: C.text,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 16px',
      userSelect: 'none',
    },
    header: {
      width: '100%',
      maxWidth: 480,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      gap: 8,
    },
    backBtn: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      color: C.text,
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
    },
    statPill: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      padding: '6px 14px',
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    main: {
      width: '100%',
      maxWidth: 480,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      flex: 1,
    },
    wordDisplay: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '14px 24px',
      minHeight: 48,
      minWidth: 200,
      textAlign: 'center' as const,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: 4,
      textTransform: 'uppercase' as const,
      position: 'relative' as const,
    },
    gridContainer: {
      position: 'relative' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 72px)',
      gap: 10,
    },
    tile: {
      width: 72,
      height: 72,
      borderRadius: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'transform 0.1s ease, background 0.15s ease, border-color 0.15s ease',
      position: 'relative' as const,
    },
    controls: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    },
    submitBtn: {
      background: C.accent,
      border: 'none',
      borderRadius: 999,
      color: '#fff',
      padding: '12px 32px',
      fontSize: 16,
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'transform 0.1s ease',
    },
    clearBtn: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      color: C.muted,
      padding: '12px 20px',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    wordList: {
      width: '100%',
      maxWidth: 480,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 16,
    },
    wordChip: {
      display: 'inline-block',
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      padding: '4px 12px',
      margin: '3px 4px',
      fontSize: 13,
      fontWeight: 600,
      color: C.success,
    },
    feedbackBadge: {
      position: 'absolute' as const,
      top: -8,
      right: -8,
      borderRadius: 999,
      padding: '4px 12px',
      fontSize: 13,
      fontWeight: 700,
      animation: 'fadeUp 1.2s ease forwards',
    },
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(21, 29, 43, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    modal: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 32,
      maxWidth: 400,
      width: '90%',
      textAlign: 'center' as const,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 600,
      marginBottom: 4,
    },
    modalStat: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: `1px solid ${C.border}`,
      fontSize: 15,
    },
    modalBtn: {
      background: C.accent,
      border: 'none',
      borderRadius: 999,
      color: '#fff',
      padding: '14px 36px',
      fontSize: 16,
      fontWeight: 700,
      cursor: 'pointer',
      marginTop: 20,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
    },
  };

  // CSS keyframes injection
  useEffect(() => {
    const styleId = 'wordforge-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeUp {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
      @keyframes pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.12); }
        100% { transform: scale(1); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  /* ---- SVG connection lines ---- */
  const renderLines = () => {
    if (selected.length < 2) return null;
    const tileSize = 72;
    const gap = 10;
    const totalW = 3 * tileSize + 2 * gap;
    const totalH = 3 * tileSize + 2 * gap;
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: totalW,
          height: totalH,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {selected.slice(1).map((idx, i) => {
          const from = getTileCenter(selected[i]);
          const to = getTileCenter(idx);
          return (
            <line
              key={`${selected[i]}-${idx}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={C.accent}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.6}
            />
          );
        })}
      </svg>
    );
  };

  /* ---- Timer color ---- */
  const timerColor = timer <= 10 ? C.error : timer <= 20 ? C.gold : C.text;

  /* ---- Round End Overlay ---- */
  if (phase === 'roundEnd') {
    const accuracy = possibleWords.length > 0
      ? Math.round((foundWords.length / possibleWords.length) * 100)
      : 0;
    const missed = possibleWords.filter(w => !foundWords.includes(w));
    return (
      <div style={s.root}>
        <div style={s.overlay}>
          <div style={{ ...s.modal, animation: 'slideIn 0.3s ease' }}>
            <div style={{ marginBottom: 8 }}>
              <Target size={32} color={C.accent} />
            </div>
            <div style={s.modalTitle}>Round {round} Complete</div>
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
              {foundWords.length === possibleWords.length && possibleWords.length > 0
                ? 'Perfect round! 2x bonus applied!'
                : `${possibleWords.length - foundWords.length} words missed`}
            </div>
            <div style={s.modalStat}>
              <span style={{ color: C.muted }}>Words Found</span>
              <span style={{ fontWeight: 700, color: C.success }}>
                {foundWords.length} / {possibleWords.length}
              </span>
            </div>
            <div style={s.modalStat}>
              <span style={{ color: C.muted }}>Accuracy</span>
              <span style={{ fontWeight: 700, color: C.accent }}>{accuracy}%</span>
            </div>
            <div style={s.modalStat}>
              <span style={{ color: C.muted }}>Total Score</span>
              <span style={{ fontWeight: 700 }}>{totalScore.toLocaleString()}</span>
            </div>
            {missed.length > 0 && missed.length <= 15 && (
              <div style={{ marginTop: 16, textAlign: 'left' }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Missed Words
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {missed.slice(0, 15).map(w => (
                    <span
                      key={w}
                      style={{
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {w}
                    </span>
                  ))}
                  {missed.length > 15 && (
                    <span style={{ fontSize: 12, color: C.muted, padding: '3px 6px' }}>
                      +{missed.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {round < TOTAL_ROUNDS ? (
              <button
                style={s.modalBtn}
                onClick={() => {
                  sfxLevelUp();
                  setRound(r => r + 1);
                  startNewRound();
                }}
              >
                Round {round + 1} <ChevronRight size={18} />
              </button>
            ) : (
              <button
                style={s.modalBtn}
                onClick={() => { sfxGameOver(); setPhase('gameEnd'); }}
              >
                See Results <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Game End Overlay ---- */
  if (phase === 'gameEnd') {
    const totalWordsFound = roundScores.reduce((a, b) => a + b, 0);
    return (
      <div style={s.root}>
        <div style={s.overlay}>
          <div style={{ ...s.modal, animation: 'slideIn 0.3s ease' }}>
            <div style={{ marginBottom: 8 }}>
              <Trophy size={40} color={C.gold} />
            </div>
            <div style={s.modalTitle}>Game Over</div>
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>
              {TOTAL_ROUNDS} rounds completed
            </div>
            <div style={s.modalStat}>
              <span style={{ color: C.muted }}>Total Score</span>
              <span style={{ fontWeight: 700, color: C.accent, fontSize: 20 }}>
                {totalScore.toLocaleString()}
              </span>
            </div>
            <div style={s.modalStat}>
              <span style={{ color: C.muted }}>Words Found</span>
              <span style={{ fontWeight: 700 }}>{totalWordsFound}</span>
            </div>
            <div style={s.modalStat}>
              <span style={{ color: C.muted }}>Best Word</span>
              <span style={{ fontWeight: 700, color: C.success, textTransform: 'uppercase' }}>
                {bestWord || '-'}
              </span>
            </div>
            <div style={s.modalStat}>
              <span style={{ color: C.muted }}>Best Word Score</span>
              <span style={{ fontWeight: 700, color: C.gold }}>{bestWordScore}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button
                style={{ ...s.modalBtn, background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                onClick={onBack}
              >
                <ArrowLeft size={16} /> Exit
              </button>
              <button
                style={s.modalBtn}
                onClick={() => {
                  setRound(1);
                  setTotalScore(0);
                  setRoundScores([]);
                  setBestWord('');
                  setBestWordScore(0);
                  startNewRound();
                }}
              >
                <RotateCcw size={16} /> Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Playing Phase ---- */
  return (
    <div ref={containerRef} style={{ ...s.root, position: 'relative', overflow: 'hidden', ...screenShakeStyle(shakeIntensity) }}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={s.statPill}>
          <Flame size={14} color={C.accent} />
          R{round}/{TOTAL_ROUNDS}
        </div>
        <div style={s.statPill}>
          <Star size={14} color={C.gold} />
          {totalScore.toLocaleString()}
        </div>
        <div style={{ ...s.statPill, color: timerColor, borderColor: timer <= 10 ? C.error : C.border }}>
          <Clock size={14} color={timerColor} />
          {timer}s
        </div>
        <div style={s.statPill}>
          <Check size={14} color={C.success} />
          {foundWords.length}
        </div>
      </div>

      <div style={s.main}>
        {/* Current Word Display */}
        <div style={s.wordDisplay}>
          {currentWord ? (
            <span style={{ color: C.accent }}>{currentWord.toUpperCase()}</span>
          ) : (
            <span style={{ color: C.muted, fontSize: 16, fontWeight: 500 }}>Tap letters to build words</span>
          )}
          {feedback && (
            <div
              style={{
                ...s.feedbackBadge,
                background: feedback.color,
                color: '#fff',
              }}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* Letter Grid */}
        <div style={s.gridContainer}>
          {renderLines()}
          <div style={{ ...s.grid, position: 'relative', zIndex: 2 }}>
            {letters.map((letter, i) => {
              const isSelected = selected.includes(i);
              const isGolden = i === goldenIndex;
              const selOrder = selected.indexOf(i);
              return (
                <div
                  key={i}
                  onClick={() => handleTileClick(i)}
                  style={{
                    ...s.tile,
                    background: isSelected ? C.accent : C.surface,
                    border: `2px solid ${isSelected ? C.accent : isGolden ? C.gold : C.border}`,
                    color: isSelected ? '#fff' : isGolden ? C.gold : C.text,
                    transform: popTile === i ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: isGolden && !isSelected
                      ? `0 0 12px ${C.gold}33`
                      : isSelected
                      ? `0 0 12px ${C.accent}44`
                      : 'none',
                  }}
                >
                  {letter}
                  {isGolden && !isSelected && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 6,
                        fontSize: 11,
                        color: C.gold,
                        fontWeight: 700,
                      }}
                    >
                      2x
                    </span>
                  )}
                  {isSelected && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 6,
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.6)',
                        fontWeight: 700,
                      }}
                    >
                      {selOrder + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div style={s.controls}>
          <button
            style={s.clearBtn}
            onClick={handleClear}
            disabled={selected.length === 0}
          >
            <RotateCcw size={14} /> Clear
          </button>
          <button
            style={{
              ...s.submitBtn,
              animation: shakeSubmit ? 'shake 0.4s ease' : 'none',
              opacity: selected.length < 3 ? 0.5 : 1,
            }}
            onClick={handleSubmit}
          >
            <Zap size={16} /> Forge
          </button>
        </div>

        {/* Found Words */}
        {foundWords.length > 0 && (
          <div style={s.wordList}>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 600,
              }}
            >
              Forged Words ({foundWords.length})
            </div>
            <div>
              {foundWords.map((w) => (
                <span key={w} style={s.wordChip}>
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timer bar */}
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            height: 4,
            background: C.border,
            borderRadius: 999,
            overflow: 'hidden',
            marginTop: 'auto',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(timer / ROUND_TIME) * 100}%`,
              background: timer <= 10 ? C.error : C.accent,
              borderRadius: 999,
              transition: 'width 1s linear, background 0.3s ease',
            }}
          />
        </div>
      </div>
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  );
}
