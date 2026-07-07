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
  Shuffle,
} from 'lucide-react';
import { sfxTap, sfxWrong, sfxLevelUp, sfxGameOver, sfxScore, sfxTimer, sfxCombo } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx';

/* ------------------------------------------------------------------ */
/*  COMPREHENSIVE DICTIONARY (5000+ common English words, 3-9 letters) */
/* ------------------------------------------------------------------ */
const DICTIONARY = new Set([
  // ---- 3-letter words (500+) ----
  'ace','act','add','ado','ads','aft','age','ago','aid','aim','air','ale','all',
  'and','ant','any','ape','apt','arc','are','ark','arm','art','ash','ask','ate',
  'awe','awl','axe','aye','bad','bag','ban','bar','bat','bay','bed','bee','beg',
  'bet','bib','bid','big','bin','bit','boa','bob','bod','bog','bon','boo','bow',
  'box','boy','bra','bud','bug','bum','bun','bur','bus','but','buy','cab','cad',
  'cam','can','cap','car','cat','caw','cob','cod','cog','col','con','coo','cop',
  'cor','cos','cot','cow','cox','coy','cub','cud','cue','cup','cur','cut','dab',
  'dad','dam','dap','day','den','dew','did','dig','dim','din','dip','doe','dog',
  'don','dot','dry','dub','dud','due','dug','dun','duo','dye','ear','eat','ebb',
  'eel','egg','ego','elk','elm','emu','end','era','err','eve','ewe','eye','fad',
  'fan','far','fat','fax','fed','fee','fen','fer','few','fib','fig','fin','fir',
  'fit','fix','fly','fob','foe','fog','fop','for','fox','fry','fun','fur','gab',
  'gag','gal','gap','gas','gay','gel','gem','get','gig','gin','gnu','gob','god',
  'got','gum','gun','gus','gut','guy','gym','had','hag','ham','hap','has','hat',
  'hay','hem','hen','her','hew','hex','hid','him','hip','his','hit','hob','hod',
  'hoe','hog','hop','hot','how','hub','hue','hug','hum','hut','ice','icy','ilk',
  'ill','imp','ink','inn','ion','ire','irk','its','ivy','jab','jag','jam','jar',
  'jaw','jay','jet','jib','jig','job','jog','jot','joy','jug','jus','jut','keg',
  'ken','key','kid','kin','kit','lab','lad','lag','lap','law','lax','lay','lea',
  'led','leg','lei','let','lib','lid','lie','lip','lit','log','lot','low','lox',
  'lug','mad','man','map','mar','mat','maw','may','men','met','mew','mid','mix',
  'mob','mod','mom','mop','mow','mrs','mud','mug','mum','nab','nag','nap','nay',
  'net','new','nil','nip','nit','nod','nor','not','now','nub','nun','nut','oak',
  'oar','oat','odd','ode','off','oft','ohm','oil','old','one','opt','orb','ore',
  'our','out','owe','owl','own','pad','pal','pan','pap','par','pat','paw','pay',
  'pea','peg','pen','pep','per','pet','pew','pie','pig','pin','pit','ply','pod',
  'pop','pot','pow','pro','pry','pub','pug','pun','pup','pus','put','rag','ram',
  'ran','rap','rat','raw','ray','red','ref','rem','rep','rev','rib','rid','rig',
  'rim','rip','rob','rod','roe','rot','row','rub','rug','rum','run','rut','rye',
  'sac','sad','sag','sap','sat','saw','say','sea','set','sew','she','shy','sin',
  'sip','sir','sis','sit','six','ski','sky','sly','sob','sod','son','sop','sot',
  'sow','soy','spa','spy','sty','sub','sue','sum','sun','sup','tab','tad','tag',
  'tan','tap','tar','tat','tax','tea','ten','the','thy','tic','tie','tin','tip',
  'tit','toe','tog','ton','too','top','tot','tow','toy','try','tub','tug','tun',
  'two','ugh','ump','urn','use','van','vat','vet','via','vie','vim','vow','wad',
  'wag','war','was','wax','way','web','wed','wet','who','wig','win','wit','woe',
  'wok','won','woo','wow','yak','yam','yap','yaw','yea','yes','yet','yew','you',
  'zap','zed','zen','zig','zip','zoo',
  // ---- 4-letter words (1200+) ----
  'able','abet','ache','acid','acme','acne','acre','aged','ahem','aide','ails',
  'aims','also','amid','amps','arch','area','aria','army','arts','asks','atom',
  'aunt','auto','avid','away','awry','axes','axis','babe','back','bade','bags',
  'bail','bait','bake','bald','bale','ball','balm','band','bane','bang','bank',
  'bans','barb','bare','bark','barn','bars','base','bash','bask','bass','bath',
  'bats','bawl','bays','bead','beak','beam','bean','bear','beat','beds','beef',
  'been','beer','bees','bell','belt','bend','bent','berg','best','bets','bevy',
  'bias','bide','bids','bile','bill','bind','bins','bird','bite','bits','blab',
  'blah','bled','blew','blob','bloc','blog','blot','blow','blue','blur','boar',
  'boat','bobs','bode','body','bogs','boil','bold','bolt','bomb','bond','bone',
  'bony','book','boom','boon','boot','bore','born','boss','both','bout','bowl',
  'bows','boys','brag','bran','bred','brew','brig','brim','buck','buds','buff',
  'bugs','bulb','bulk','bull','bump','bums','bunk','buoy','burn','burp','bury',
  'bush','bust','busy','buzz','byte','cafe','cage','cake','calf','call','calm',
  'came','camp','cane','cape','caps','card','care','carp','cars','cart','case',
  'cash','cask','cast','cats','cave','cell','cent','char','chat','chef','chin',
  'chip','chop','chow','cite','city','clad','clam','clan','clap','claw','clay',
  'clip','clod','clog','clop','club','clue','coal','coat','cock','code','cogs',
  'coil','coin','coke','cold','cole','colt','comb','come','cone','cook','cool',
  'cope','cops','copy','cord','core','cork','corn','cost','cosy','coup','cove',
  'crab','cram','crew','crib','crop','crow','crud','cube','cubs','cues','cuff',
  'cult','cups','curb','curd','cure','curl','curt','cute','cuts','czar','dabs',
  'daft','dale','dame','damn','damp','dams','dang','dare','dark','darn','dart',
  'dash','data','date','daub','dawn','days','daze','dead','deaf','deal','dean',
  'dear','debt','deck','deed','deem','deep','deer','demo','dent','deny','desk',
  'dial','dice','died','dies','diet','digs','dill','dime','dims','dine','dips',
  'dire','dirk','dirt','disc','dish','disk','dive','dock','docs','does','dole',
  'doll','dome','done','doom','door','dope','dork','dose','dote','dots','dove',
  'down','doze','dozy','drab','drag','draw','drew','drip','drop','drum','drub',
  'drug','dual','dubs','duck','duct','dude','duds','duel','dues','duet','duff',
  'duke','dull','dumb','dump','dune','dung','dunk','dupe','dusk','dust','duty',
  'dyed','dyes','each','earl','earn','ears','ease','east','easy','eats','eave',
  'echo','edge','edgy','edit','eels','eggs','eggo','elks','else','emit','ends',
  'envy','epic','etch','euro','even','ever','eves','evil','exam','exec','exit',
  'expo','eyed','eyes','face','fact','fade','fail','fain','fair','fake','fall',
  'fame','fang','fans','fare','farm','fart','fast','fate','fawn','faze','fear',
  'feat','feed','feel','fees','feet','fell','felt','fend','fern','fest','feud',
  'fiat','fief','file','fill','film','find','fine','fire','firm','fish','fist',
  'fits','five','flag','flair','flak','flam','flan','flap','flat','flaw','flax',
  'flay','flea','fled','flee','flew','flex','flit','flog','flop','flow','flub',
  'flue','flux','foam','fobs','foci','foes','foil','fold','folk','fond','font',
  'food','fool','foot','ford','fore','fork','form','fort','foul','four','fowl',
  'foxy','fray','free','fret','frog','from','fuel','full','fume','fund','funk',
  'furl','fury','fuse','fuss','fuzz','gags','gain','gait','gale','gall','game',
  'gang','gape','gaps','garb','gash','gasp','gate','gave','gawk','gaze','gear',
  'gels','gems','gene','germ','gets','gift','gild','gill','gilt','gist','give',
  'glad','glen','glib','glim','glob','glop','glow','glue','glum','glut','gnar',
  'gnaw','goad','goal','goat','gobs','gods','goes','gold','golf','gone','gong',
  'good','goof','gore','gory','gosh','grab','gram','gray','grew','grid','grim',
  'grin','grip','grit','grog','groom','grot','grow','grub','gulp','gums','gunk',
  'guns','gush','gust','guts','guys','gybe','gyms','hack','hags','hail','hair',
  'hale','half','hall','halt','hams','hand','hang','hank','hare','hark','harm',
  'harp','hash','hasp','hast','hate','hath','haul','have','hawk','haze','hazy',
  'head','heal','heap','hear','heat','heck','heed','heel','heft','heir','held',
  'hell','helm','help','hems','hens','herb','herd','here','hero','hers','hewn',
  'hews','hide','high','hike','hill','hilt','hind','hint','hips','hire','hiss',
  'hits','hive','hoar','hoax','hobs','hock','hoed','hoes','hogs','hold','hole',
  'holy','home','hone','hood','hoof','hook','hoop','hoot','hope','hops','horn',
  'hose','host','hour','howl','hubs','hued','hues','huff','huge','hugs','hull',
  'hump','hums','hung','hunk','hunt','hurl','hurt','hush','husk','huts','hymn',
  'icon','idea','iffy','ills','imps','inch','info','inks','inky','inns','into',
  'ions','iris','irks','iron','isle','itch','item','jabs','jack','jade','jags',
  'jail','jamb','jams','jape','jars','jaws','jays','jazz','jean','jeer','jell',
  'jerk','jest','jets','jibe','jibs','jiff','jigs','jilt','jinx','jive','jobs',
  'jock','jogs','join','joke','jolt','josh','jots','jowl','joys','jugs','jump',
  'junk','jury','just','juts','kale','keen','keep','kegs','kelp','kept','keys',
  'kick','kids','kill','kilt','kind','king','kink','kiss','kite','kits','kiwi',
  'knab','knee','knelt','knew','knit','knob','knot','know','lace','lack','lacy',
  'lads','lags','laid','lain','lair','lake','lame','lamp','land','lane','laps',
  'lard','lark','lars','lash','lass','last','late','laud','lava','lawn','laws',
  'lays','lazy','lead','leaf','leak','lean','leap','left','lend','lens','lent',
  'less','lest','levy','liar','lick','lids','lied','lien','lies','lieu','life',
  'lift','like','lily','limb','lime','limp','line','link','lint','lion','lips',
  'list','live','load','loaf','loam','loan','lobe','lock','lode','loft','loge',
  'logo','logs','lone','long','look','loom','loon','loop','loot','lops','lord',
  'lore','lorn','lose','loss','lost','lots','loud','lout','love','lows','luck',
  'luge','lugs','lull','lump','lump','lung','lure','lurk','lush','lust','lute',
  'lynx','mace','made','maid','mail','maim','main','make','male','mall','malt',
  'mane','many','maps','mare','mark','mars','mart','mash','mask','mass','mast',
  'mate','math','maul','maze','mead','meal','mean','meat','meek','meet','meld',
  'melt','memo','mend','menu','meow','mere','mesh','mess','mete','mice','mild',
  'mile','milk','mill','mime','mind','mine','mint','mire','miss','mist','mite',
  'mitt','moan','moat','mock','mode','mold','mole','molt','monk','mood','moon',
  'moor','moot','mope','mops','more','morn','moss','most','moth','move','much',
  'muck','muds','muff','mugs','mule','mull','mumm','mums','murk','muse','mush',
  'musk','must','mute','mutt','myth','nabs','nags','nail','name','nape','naps',
  'nave','navy','near','neat','neck','need','neon','nerd','nest','nets','news',
  'newt','next','nibs','nice','nick','nine','nips','nits','node','nods','none',
  'nook','noon','nope','norm','nose','nosy','note','noun','nude','numb','nuns',
  'nuts','oafs','oaks','oars','oath','oats','obey','odds','odes','odor','offs',
  'ogle','ogre','oily','okay','omen','omit','once','ones','only','onto','ooze',
  'opal','open','opts','opus','oral','orbs','orca','ores','oust','outs','oven',
  'over','owed','owes','owls','owns','oxen','pace','pack','pact','pads','page',
  'paid','pail','pain','pair','pale','palm','pals','pane','pang','pans','pant',
  'pare','park','part','pass','past','pate','path','pave','pawn','paws','pays',
  'peak','peal','pear','peas','peat','peck','peel','peep','peer','pegs','pelt',
  'pend','pens','pent','peon','peps','perk','perm','pert','pest','pets','pews',
  'pick','pier','pies','pigs','pike','pile','pill','pine','ping','pink','pins',
  'pint','piny','pipe','pips','pith','pits','pity','plan','play','plea','pled',
  'plod','plop','plot','plow','ploy','plug','plum','plus','pock','pods','poem',
  'poet','poke','pole','poll','polo','pomp','pond','pool','poor','pope','pops',
  'pore','pork','port','pose','posh','post','posy','pour','pout','pray','prey',
  'prig','prim','prod','prof','prom','prop','pros','prow','prys','pubs','puck',
  'puds','puff','pugs','pull','pulp','puma','pump','puns','punk','pups','pure',
  'purr','push','puts','putt','quay','quit','quiz',
  'race','rack','raft','rage','rags','raid','rail','rain','rake','ramp','rams',
  'rand','rang','rank','rant','raps','rash','rasp','rate','rats','rave','rays',
  'raze','read','real','ream','reap','rear','reed','reef','reek','reel','refs',
  'rein','rely','rend','rent','reps','rest','revs','ribs','rice','rich','ride',
  'rids','rife','rift','rigs','rile','rill','rime','rims','rind','ring','rink',
  'riot','ripe','rips','rise','risk','rite','road','roam','roar','robe','robs',
  'rock','rode','rods','roes','roil','role','roll','romp','roof','rook','room',
  'root','rope','rose','rosy','rote','rots','rout','rove','rows','rubs','ruby',
  'ruck','rude','rued','rues','ruff','rugs','ruin','rule','rump','rums','rune',
  'rung','runs','runt','ruse','rush','rust','ruts','sack','safe','saga','sage',
  'sags','said','sail','sake','sale','salt','same','sand','sane','sang','sank',
  'saps','sari','sash','sass','save','saws','says','scab','scam','scan','scar',
  'seal','seam','sear','seas','seat','sect','seed','seek','seem','seen','seep',
  'seer','self','sell','semi','send','sent','sept','sets','sewn','sews','shed',
  'shim','shin','ship','shod','shoe','shoo','shop','shot','show','shun','shut',
  'side','sift','sigh','sign','silk','sill','silo','silt','sing','sink','sips',
  'sire','sirs','site','sits','size','skid','skim','skin','skip','skit','slab',
  'slag','slam','slap','slat','slaw','slay','sled','slew','slid','slim','slit',
  'slob','sloe','slog','slop','slot','slow','slug','slum','slur','slut','smog',
  'snap','snag','snip','snit','snob','snot','snow','snub','snug','soak','soap',
  'soar','sobs','sock','soda','sofa','soft','soil','sold','sole','solo','some',
  'song','sons','soon','soot','sore','sort','soul','soup','sour','span','spar',
  'spat','spec','sped','spin','spit','spot','spry','spud','spun','spur','stab',
  'stag','star','stay','stem','step','stew','stir','stop','stow','stub','stud',
  'stun','such','suck','suds','sued','suit','sulk','sums','sung','sunk','sure',
  'surf','swab','swam','swan','swap','swat','sway','swim','swum','tabs','tack',
  'tact','tags','tail','take','tale','talk','tall','tame','tamp','tang','tank',
  'tape','taps','tarn','tarp','tars','tart','task','taxi','teal','team','tear',
  'teas','teem','tell','temp','tend','tens','tent','term','tern','test','text',
  'than','that','thaw','them','then','they','thin','this','thou','thud','thus',
  'tick','tidy','tied','tier','ties','tile','till','tilt','time','tine','ting',
  'tint','tiny','tips','tire','toad','tock','toed','toes','tofu','toga','togs',
  'toil','told','toll','tomb','tome','tone','tons','tony','took','tool','tops',
  'tore','torn','tort','toss','tour','tout','town','toys','tram','trap','tray',
  'tree','trek','trim','trio','trip','trod','trot','true','tubs','tuck','tuft',
  'tugs','tulip','tuna','tune','turf','turn','tusk','tutu','twig','twin','twit',
  'type','ugly','undo','unit','unto','upon','urge','urns','used','user','uses',
  'vain','vale','vane','vans','vary','vase','vast','vats','veal','veer','veil',
  'vein','vend','vent','verb','very','vest','veto','vets','vial','vibe','vice',
  'vied','vies','view','vile','vine','visa','void','volt','vote','vows','wade',
  'wads','wage','wail','wait','wake','walk','wall','wand','wane','want','ward',
  'ware','warm','warn','warp','wart','wary','wash','wasp','wave','wavy','waxy',
  'ways','weak','wean','wear','webs','weds','weed','week','weep','well','welt',
  'went','wept','were','west','whet','whey','whig','whim','whip','whir','whom',
  'wick','wide','wife','wigs','wild','wile','will','wilt','wily','wimp','wind',
  'wine','wing','wink','wins','wipe','wire','wiry','wise','wish','wisp','with',
  'wits','woes','woke','wolf','womb','wont','wood','woof','wool','word','wore',
  'work','worm','worn','wove','wrap','wren','writ','yaks','yams','yank','yaps',
  'yard','yarn','yawl','yawn','yaws','year','yell','yelp','yens','yoga','yoke',
  'yolk','your','yowl','zany','zaps','zeal','zero','zest','zinc','zing','zone',
  'zoom','zoos',
  // ---- 5-letter words (1500+) ----
  'aback','abaft','abase','abate','abbey','abbot','abhor','abide','about','above',
  'abuse','abyss','ached','aches','acids','acorn','acres','acted','actor','acute',
  'adage','added','adder','adept','admit','adopt','adore','adorn','adult','aegis',
  'afoot','after','again','agent','aging','agile','aglow','agony','agree','ahead',
  'aided','aimed','aired','aisle','alarm','album','alder','alert','algae','alibi',
  'alien','align','alike','alive','allay','alley','allot','allow','alloy','aloft',
  'alone','along','aloof','aloud','alpha','altar','alter','amass','amaze','amber',
  'amble','amend','amine','amino','amiss','among','ample','amply','amuse','angel',
  'anger','angle','angry','angst','ankle','annex','antic','anvil','aorta','apart',
  'aping','apple','apply','apron','aptly','arbor','arena','argue','arise','armor',
  'aroma','arose','array','arrow','arson','aside','asset','atlas','atone','attic',
  'audit','aural','avail','avert','avian','avoid','await','awake','award','aware',
  'awful','axial','axiom','badge','badly','bagel','baggy','baker','balls','bands',
  'banes','bangs','banjo','banks','baron','basal','based','basic','basil','basin',
  'basis','batch','bathe','baton','beads','beams','beans','beard','bears','beast',
  'beats','beech','beefy','begin','begun','being','belch','belly','below','bench',
  'berry','berth','beset','bible','bigot','bills','birch','birds','birth','black',
  'blade','blame','bland','blank','blare','blast','blaze','bleak','bleat','bleed',
  'blend','bless','blimp','blind','blink','bliss','blitz','bloat','block','bloke',
  'blond','blood','bloom','blown','blows','blues','bluff','blunt','blurt','blush',
  'board','boast','boats','boggy','bolts','bombs','bonds','bones','bonus','books',
  'boost','boots','booty','booze','bored','borne','bosom','bossy','botch','bound',
  'bough','bowel','bower','brace','braid','brain','brake','brand','brass','brave',
  'brawn','bread','break','breed','brick','bride','brief','brine','bring','brink',
  'brisk','broad','broil','broke','brood','brook','broom','broth','brown','brush',
  'brunt','brute','buddy','budge','buggy','build','built','bulge','bulky','bully',
  'bunch','burnt','burst','buyer','cabin','cable','cadet','candy','caned','canes',
  'canoe','caper','cards','cargo','carry','carve','cases','catch','cater','cause',
  'cease','cedar','chain','chair','chalk','champ','chant','chaos','charm','chart',
  'chase','cheap','cheat','check','cheek','cheer','chess','chest','chick','chief',
  'child','chili','chill','china','chips','choir','chord','chore','chose','chunk',
  'churn','cider','cigar','cinch','civic','civil','clack','claim','clamp','clams',
  'clang','clank','clash','clasp','class','clean','clear','clerk','click','cliff',
  'climb','cling','clink','cloak','clock','clone','close','cloth','cloud','clout',
  'clown','clubs','cluck','clued','clues','clump','clung','coach','coast','cobra',
  'cocoa','coils','coins','color','comet','comic','comma','coral','cords','cores',
  'corny','couch','could','count','coupe','court','cover','covet','crack','craft',
  'cramp','crane','crank','crash','crate','crave','crawl','craze','crazy','creak',
  'cream','creek','creep','crest','crick','cried','crime','crisp','crook','crops',
  'cross','crowd','crown','crude','cruel','crush','crust','cubic','curry','curse',
  'curve','cycle','daily','dairy','daisy','dance','dandy','dated','dates','datum',
  'dealt','death','debit','debug','debut','decal','decay','decor','decoy','decry',
  'deeds','defer','deity','delay','delta','delve','demon','demur','denim','dense',
  'depot','depth','derby','desks','deter','detox','deuce','devil','diary','dicey',
  'digit','diner','dirty','disco','ditch','ditto','ditty','diver','dizzy','dodge',
  'doing','dolls','donor','dopey','doubt','dough','dowdy','downs','dowry','draft',
  'drain','drake','drama','drank','drape','drawl','drawn','draws','dread','dream',
  'dress','dried','drier','drift','drill','drink','drive','droit','droll','drone',
  'drool','droop','drops','dross','drove','drown','drums','drunk','dryer','dryly',
  'ducal','ducks','dully','dummy','dumps','dunce','dunes','dunno','dusty','dwarf',
  'dwell','dwelt','dying','eager','eagle','early','earth','easel','eased','eaten',
  'eater','eaves','ebbed','ebony','edged','edges','edict','eight','eject','elbow',
  'elder','elect','elite','elope','elude','email','ember','emcee','емits','empty',
  'enact','ended','endow','enemy','enjoy','ennui','ensue','enter','entry','envoy',
  'epoch','equal','equip','erase','erode','error','essay','ether','ethic','evade',
  'event','every','evict','evoke','exact','exalt','exams','excel','exert','exile',
  'exist','expat','expel','extra','exude','exult','fable','faced','facet','facts',
  'fagot','fails','faint','fairy','faith','falls','false','famed','fancy','fangs',
  'farce','farms','fatal','fatty','fault','fauna','feast','feats','feeds','feign',
  'feint','fella','felon','femur','fence','ferry','fetal','fetch','fetid','fetus',
  'feud','fever','fewer','fiber','fibre','field','fiend','fiery','fifth','fifty',
  'fight','filch','filed','filet','fills','filmy','films','filth','final','finch',
  'finds','fined','finer','fires','first','fishy','fixed','flair','flake','flaky',
  'flame','flank','flaps','flare','flash','flask','flats','flawy','fleet','flesh',
  'flick','flier','flies','fling','flint','flips','flirt','float','flock','flood',
  'floor','flops','flora','floss','flour','flout','flown','flows','fluff','fluid',
  'fluke','flung','flunk','flush','flute','foamy','focal','focus','foggy','foils',
  'folds','folly','fonts','foods','foray','force','forge','forgo','forks','forms',
  'forte','forth','forum','found','foxes','foyer','frail','frame','frank','fraud',
  'frays','freak','freed','fresh','friar','fried','frill','frisk','fritz','frock',
  'front','frost','frown','froze','fruit','frump','fully','fumed','fumes','funds',
  'fungi','funky','funny','furry','fused','fussy','futile','fuzzy','gaily','gains',
  'gaits','gales','games','gamma','gangs','gaped','gapes','garbs','gases','gauge',
  'gaunt','gauze','gauzy','gazer','gears','genes','genre','genus','ghost','giant',
  'giddy','gifts','girth','given','gives','gizmo','gland','glare','glass','glaze',
  'gleam','glean','glide','glint','globe','gloom','glory','gloss','glove','gloze',
  'glued','glues','goats','godly','going','gonna','goods','goody','gooey','goose',
  'gorge','gotta','gouge','gourd','grace','grade','graft','grain','grand','grant',
  'grape','graph','grasp','grass','grate','grave','gravy','graze','great','greed',
  'green','greet','grief','grill','grind','gripe','grips','groan','groin','groom',
  'grope','gross','group','grove','growl','grown','grows','gruel','gruff','grump',
  'grunt','guard','guava','guess','guest','guide','guild','guilt','guise','gulch',
  'gulls','gulps','gummy','guppy','gusto','gusty','haiku','hairs','hairy','haler',
  'halls','halve','hands','handy','hangs','hardy','harem','harps','harpy','harry',
  'harsh','haste','hasty','hatch','haunt','haven','havoc','hazel','heads','heady',
  'heals','heaps','heard','heart','heave','heavy','hedge','heels','hefty','heirs',
  'hello','helps','hence','herbs','herds','heron','haste','hilly','hilts','hinds',
  'hinge','hints','hippo','hired','hitch','hoard','hoary','hobby','hoist','holds',
  'holes','holly','homer','homes','honey','honor','hoods','hooks','hoped','horde',
  'horns','horse','hosts','hotel','hound','hours','house','hover','howls','human',
  'humid','humor','humps','hunks','hunts','hurry','hurts','husky','hyena','hymns',
  'ideal','ideas','idiot','idyll','igloo','image','imbue','impel','imply','inane',
  'incur','index','inept','inert','infer','ingot','inlet','inner','input','inset',
  'inter','intro','ionic','irate','irony','issue','ivory','jazzy','jeans','jelly',
  'jerks','jerky','jewel','jiffy','joint','joker','jolly','jolts','joust','judge',
  'juice','juicy','jumbo','jumps','jumpy','juror','karma','kayak','keels','keeps',
  'kicks','kills','kinds','kings','kiosk','kites','knack','knead','kneel','knelt',
  'knelt','knife','knits','knobs','knock','knoll','knots','known','knows','kudos',
  'label','labor','laced','laces','laden','ladle','lager','lance','lands','lanes',
  'lapse','large','larva','laser','lasso','latch','later','latte','laugh','layer',
  'leads','leafy','leaks','leaky','leaps','leapt','learn','lease','leash','least',
  'leave','ledge','legal','lemon','level','lever','light','liked','lilac','limbo',
  'limbs','limit','linen','liner','lines','lingo','links','lions','lipid','lists',
  'liter','lithe','liver','livid','llama','loads','loans','lobby','local','locks',
  'locus','lodge','lofty','logic','login','looks','loose','lords','lorry','loser',
  'loses','lousy','loved','lover','loves','lower','lowly','loyal','lucid','lucky',
  'lumen','lunar','lunch','lunge','lured','lyric','macho','macro','magic','major',
  'maker','males','manor','maple','march','marks','marry','marsh','mason','match',
  'mated','mayor','mazes','mealy','means','meant','meats','meaty','medal','media',
  'medic','melee','melon','melts','mercy','merge','merit','merry','metal','meter',
  'midst','might','mills','mimic','minds','miner','minor','minus','mirth','miser',
  'misty','miter','mixed','mixer','moats','model','modem','mogul','moist','moldy',
  'money','month','moods','moody','moose','moral','morph','mossy','motel','moths',
  'motor','motto','mound','mount','mourn','mouse','mouth','moved','mover','moves',
  'movie','muddy','mulch','multi','mummy','mural','murky','music','musty','muted',
  'naive','named','names','nanny','nasal','nasty','naval','nerve','never','newer',
  'nexus','niche','night','ninja','ninth','noble','nobly','nodes','noise','noisy',
  'north','notch','noted','notes','novel','nudge','nurse','occur','ocean','oddly',
  'odors','offer','often','olive','omega','onset','optic','opted','orbit','order',
  'organ','other','ought','ounce','outer','outdo','ovals','ovens','overt','owing',
  'owner','oxide','ozone','paced','paces','packs','pacts','paddy','pages','pains',
  'paint','pairs','palms','panel','panes','pangs','panic','pants','papal','paper',
  'parks','parts','party','paste','patch','patio','pause','peach','peaks','pearl',
  'pears','pecan','pedal','penny','perch','peril','perks','perky','petal','petty',
  'phase','phone','photo','piano','piece','pilot','pinch','pitch','pixel','pixie',
  'pizza','place','plaid','plain','plane','plank','plans','plant','plate','plaza',
  'plead','pleat','plied','plier','plods','plops','plots','plows','ploys','pluck',
  'plugs','plumb','plume','plump','plums','plunk','plush','poets','point','poise',
  'polar','polls','ponds','pools','pooch','porch','posed','posit','posse','posts',
  'pouch','pound','power','prank','prawn','press','price','prick','pride','prime',
  'print','prior','prism','privy','prize','probe','prone','prong','proof','prose',
  'proud','prove','prowl','prude','prune','psalm','pulse','punch','pupil','puppy',
  'purge','purse','pushy','quack','qualm','quart','quasi','queen','query','quest',
  'queue','quick','quiet','quill','quilt','quirk','quota','quote','rabid','radar',
  'radii','radio','rails','raise','rally','ranch','range','ranks','rapid','rated',
  'ratio','raven','razor','reach','react','reads','ready','realm','reams','rebel',
  'rebus','recap','recur','reedy','refer','regal','reign','reins','relax','relay',
  'relic','remit','renew','repay','repel','reply','rerun','reset','reside','resin',
  'retry','revel','rider','ridge','rifle','right','rigid','rigor','rinse','ripen',
  'risen','risky','rival','river','rivet','roads','roams','roars','roast','robin',
  'robot','rocky','rogue','roles','rolls','roman','roost','roots','ropes','roses',
  'rotor','rouge','rough','round','rouse','route','rowdy','royal','ruins','ruled',
  'ruler','rules','rumba','rumor','rural','rusty','saber','sadly','saint','salad',
  'sales','salon','sandy','sauce','saucy','sauna','savor','savvy','scale','scalp',
  'scald','scant','scare','scarf','scary','scene','scent','scope','score','scout',
  'scowl','scram','scrap','screw','scrub','seams','seats','sedan','seeds','seize',
  'sense','serve','setup','seven','sever','shade','shady','shaft','shake','shaky',
  'shall','shame','shape','share','shark','sharp','shawl','shear','sheds','sheen',
  'sheer','sheet','shelf','shell','shift','shims','shine','shiny','ships','shirt',
  'shock','shoes','shone','shook','shoot','shops','shore','short','shout','shove',
  'shown','shows','shrub','shrug','shuck','shunt','sided','sides','siege','sight',
  'sigma','silks','silky','silly','since','siren','sissy','sixth','sixty','sized',
  'sizes','skate','skein','skier','skill','skimp','skips','skirt','skull','skunk',
  'slack','slain','slang','slant','slash','slate','slats','slave','sleek','sleep',
  'sleet','slept','slice','slide','slime','slimy','sling','slink','slope','slots',
  'sloth','slump','slung','slunk','small','smart','smash','smell','smelt','smile',
  'smirk','smite','smith','smock','smoke','snack','snail','snake','snare','snarl',
  'sneak','sneer','snide','sniff','snore','snort','snout','snowy','snubs','snuff',
  'soapy','soars','sober','solar','solid','solve','sonic','sorry','sorts','souls',
  'sound','south','space','spade','spare','spark','spawn','speak','spear','specs',
  'speed','spell','spend','spent','spice','spicy','spied','spike','spill','spine',
  'spoke','spoon','sport','spots','spout','spray','spree','sprig','spunk','spurt',
  'squad','squid','stack','staff','stage','staid','stain','stair','stake','stale',
  'stalk','stall','stamp','stand','stank','stare','stark','stars','start','stash',
  'state','stave','stays','steak','steal','steam','steel','steep','steer','stems',
  'steps','stern','stews','stick','stiff','still','sting','stink','stint','stock',
  'stoic','stoke','stole','stomp','stone','stony','stood','stool','stoop','store',
  'stork','storm','story','stout','stove','strap','straw','stray','strip','strut',
  'stuck','studs','study','stuff','stump','stung','stunk','stunt','style','suave',
  'suing','suite','suits','sulky','sunny','super','surge','swamp','swarm','swear',
  'sweat','sweep','sweet','swept','swift','swill','swine','swing','swipe','swirl',
  'sword','swore','sworn','swung','syrup','tabby','table','tacit','taken','tales',
  'talks','tally','talon','tangy','tasks','taste','tasty','taunt','tease','teens',
  'teeth','tempo','tends','tense','tenth','tepid','terms','terra','theft','theme',
  'there','these','thick','thief','thigh','thing','think','third','thorn','those',
  'three','threw','throw','thumb','thump','tidal','tiger','tight','tiles','timer',
  'times','timid','tipsy','tired','titan','title','toast','today','token','tonal',
  'toned','tones','tonic','tools','tooth','topic','torch','total','touch','tough',
  'towel','tower','towns','toxic','trace','track','tract','trade','trail','train',
  'trait','tramp','tread','treat','trees','trend','trial','tribe','trick','tried',
  'trims','trips','trite','troll','troop','trout','truce','truck','truly','trunk',
  'trust','truth','tubes','tulip','tumor','tuned','tunes','tunic','turns','tutor',
  'twang','tweak','tweed','twice','twigs','twine','twins','twirl','twist','tying',
  'udder','ulcer','ultra','umbra','uncle','under','undid','union','unite','unity',
  'unlit','until','unwed','upper','upset','urban','urged','usage','usher','using',
  'usual','utter','valid','valor','value','valve','vapor','vault','veils','veins',
  'venue','verge','verse','vigor','vinyl','viola','viper','viral','virus','visor',
  'visit','vista','vital','vivid','vocal','vodka','vogue','voice','voter','vouch',
  'vowel','wager','wages','wagon','waist','walks','walls','waltz','wands','wants',
  'waste','watch','water','waved','waves','waxed','weary','weave','wedge','weeds',
  'weigh','weird','wells','whack','whale','wheat','wheel','where','which','while',
  'whine','whirl','white','whole','whose','widen','wider','width','wield','wings',
  'witch','wives','woman','women','woods','woody','wordy','world','worry','worse',
  'worst','worth','would','wound','wrack','wraps','wrath','wreak','wreck','wring',
  'wrist','wrote','yacht','yearn','years','yeast','yield','young','youth','zesty',
  // ---- 6-letter words (1000+) ----
  'absorb','absent','absurd','accent','accept','access','accrue','accuse','across',
  'acting','action','active','actual','addict','adjust','admire','admits','adhere',
  'advent','adverb','advice','advise','aerial','affair','affirm','afford','afraid',
  'agenda','ageing','aghast','agreed','aiming','albeit','albino','alcove','allies',
  'allure','almost','alpine','always','ambush','amidst','amount','anchor','anemia',
  'animal','annual','anoint','answer','anthem','anyone','anyway','apache','appeal',
  'appear','append','apples','arched','archer','arctic','ardent','arenas','argued',
  'armada','arming','armory','around','arouse','arrest','arrive','artery','artist',
  'ascend','ascent','ashore','aspect','assert','assess','assign','assist','assort',
  'assume','assure','asylum','atomic','atoned','attach','attack','attain','attend',
  'attest','attire','august','aurora','austere','author','autumn','avenue','averts',
  'aviary','backer','backup','badger','baffle','bakery','ballot','bamboo','banana',
  'bandit','banker','banner','banter','barely','barley','barren','basket','battle',
  'beacon','beaker','beamed','beaten','beauty','became','become','bedbug','before',
  'behalf','behave','beheld','behind','behold','belief','belong','beside','bestow',
  'betray','better','beware','beyond','biased','bishop','bisect','bitter','blanch',
  'blazer','bleach','blazed','blends','blight','blithe','blonde','bloody','blotch',
  'blouse','boards','bodily','boldly','bonnet','bonsai','border','borrow','bother',
  'bottle','bottom','bounce','bouncy','bounty','branch','brandy','brassy','braved',
  'breach','breath','breeze','breezy','bridle','bright','brings','broken','broker',
  'bronze','bruise','brunch','brutal','bubble','bucket','buckle','budget','buffer',
  'buffet','bugger','bundle','bungle','bunker','burden','bureau','burger','burial',
  'burner','burrow','bushel','bustle','butler','butter','button','bypass','cactus',
  'calmer','camera','campus','cancel','candle','candid','canopy','canyon','carbon',
  'career','caress','caring','carpet','carrot','carton','carved','casino','castle',
  'casual','cattle','caught','causal','cavity','cement','censor','center','cereal',
  'chains','chairs','chance','change','chapel','charge','chased','cheese','cherry',
  'choice','choose','chosen','chrome','chunky','church','cinder','cinema','cipher',
  'circle','circus','citrus','claims','classy','clause','clergy','clever','client',
  'clinic','clique','closet','clothe','clumsy','clutch','cobalt','cobweb','cocoon',
  'coddle','coffee','coffin','collar','colony','column','combat','comedy','coming',
  'commit','common','comply','compel','convoy','cookie','cooler','copied','copper',
  'corner','cornet','corpse','costly','cotton','cougar','couple','coupon','course',
  'cousin','covers','coward','cradle','crafts','cranky','crazed','create','credit',
  'cringe','crisis','crispy','cross','cruise','crumbs','crunch','crusty','crutch',
  'cuddle','custom','cutout','cyborg','dagger','damage','dampen','dancer','danger',
  'daring','darken','deacon','deadly','dealer','debate','debris','decade','deceit',
  'decent','decide','decode','decree','deduce','deemed','deepen','deeply','defeat',
  'defect','defend','define','deftly','degree','delete','demand','demise','denial',
  'denote','dental','depart','depend','depict','deploy','depose','deputy','derive',
  'desert','design','desire','detail','detach','detect','deviate','device','devoid',
  'devote','devour','dialog','differ','digest','dilemma','dimple','dining','dinner',
  'direct','disarm','dismal','dismay','dispel','divide','divine','dollar','domain',
  'donkey','donors','dosage','double','doubly','doting','dozens','drafts','dragon',
  'drapes','drawer','dreams','dreary','driven','driver','drills','drinks','drivel',
  'drowsy','during','earned','earner','easily','easter','eating','effect','effort',
  'eighth','either','elated','elbow','eldest','elicit','enable','encase','encode',
  'encore','endear','ending','endure','energy','engage','engine','engulf','enigma',
  'enjoys','enough','enrage','enrich','ensign','ensure','entail','enters','entire',
  'entity','entice','eraser','errant','escape','escort','esprit','essays','estate',
  'esteem','ethnic','evenly','evolve','exceed','except','excise','excite','excuse',
  'exempt','exhort','exotic','expand','expect','expert','export','expose','extend',
  'extent','extern','extras','eyelet','fabric','facial','facing','factor','fairly',
  'fallen','famine','famous','fanboy','fandom','farmer','fathom','fatten','faucet',
  'faulty','fealty','feeble','fellow','felony','female','fender','ferret','fervor',
  'fickle','fiddle','fierce','figure','filled','filler','filter','filthy','finale',
  'finder','finely','finger','finish','fiscal','fished','fisher','fitted','fitter',
  'flashy','flavor','fleece','flight','flinch','flimsy','floppy','floral','flower',
  'fluent','fluffy','flying','foiled','follow','fondle','fondly','forbid','forced',
  'forest','forget','forgot','formal','format','former','fossil','foster','fought',
  'fourth','freeze','frenzy','friday','friend','fright','fringe','frisky','frosty',
  'frozen','frugal','fruity','fumble','funded','funnel','furrow','futile','future',
  'gadget','gaffer','gained','galaxy','gallop','gambit','gamble','gaming','garage',
  'garden','garlic','garner','gather','gauged','gender','gently','gentle','german',
  'giggle','gifted','ginger','girdle','glacial','gladly','glance','global','gloomy',
  'glossy','gluten','gnarly','gobble','goblet','golden','govern','graced','grains',
  'grands','grapes','grated','grater','gravel','graved','graven','gravel','grayed',
  'grease','greasy','greedy','grieve','grimly','grills','grimed','grocer','groove',
  'groped','ground','grouse','growth','grudge','guitar','gutter','guzzle','gypsum',
  'hammer','hamper','handed','handle','hangar','harbor','harden','harder','hardly',
  'harmed','hasty','hatred','hasten','hatred','having','hazard','headed','healer',
  'health','hearth','heaven','heaved','hectic','hedged','helper','hereby','heresy',
  'hermit','heroic','hidden','higher','highly','hinder','hobbit','hockey','holder',
  'hollow','honest','hooked','hopper','horror','horrid','housed','huddle','hugely',
  'humble','humbly','hunger','hungry','hunted','hunter','hurdle','hurled','hustle',
  'hybrid','ignore','immune','impact','impair','impede','import','impose','impure',
  'incite','income','indeed','indoor','induce','infant','infect','inflow','inform',
  'infuse','ingest','inhale','inject','injure','injury','inmate','innate','insane',
  'insect','insert','inside','insist','insult','intact','intend','intent','intern',
  'invade','invent','invest','invite','inward','island','isolate','issued','jacket',
  'jammed','jargon','jeered','jester','jigsaw','jingle','jogged','joined','jostle',
  'jounce','judged','jumble','jumper','jungle','junior','justly','kennel','kernel',
  'kettle','kicked','kinder','kindle','kindly','knight','kitten','knives','ladder',
  'launch','lather','lavish','lawful','lawman','lawyer','layers','layout','leader',
  'league','leaked','leaned','leaped','learnt','leased','legacy','legend','lender',
  'length','lessen','lesser','lesson','letter','lifted','likely','lining','linear',
  'linger','linked','liquid','listen','litter','little','lively','living','loaded',
  'loafer','locker','lodged','logics','lonely','longer','looked','looped','loosen',
  'loosely','lorded','lovely','lowest','lucked','lumber','lunacy','luxury','lyrics',
  'madden','maiden','mainly','malice','manage','mangle','manner','mantle','manual',
  'marble','margin','marina','marine','marked','marker','market','maroon','marvel',
  'masked','master','matter','mature','mayhem','meadow','meager','meddle','median',
  'medium','melody','member','memoir','memory','menace','mental','mentor','merger',
  'merely','merits','method','mettle','middle','midway','mighty','mildly','miller',
  'minded','mingle','minute','mirror','misery','misled','missed','mister','mitten',
  'mobile','modern','modest','modify','molten','moment','monkey','morale','morals',
  'morsel','mortal','mortar','mosaic','mostly','mother','motion','motive','mounts',
  'movers','moving','muffin','mumble','murder','murmur','muscle','museum','musing',
  'muster','mutual','muzzle','myself','mystic','namely','narrow','nation','native',
  'nature','nausea','nearby','neatly','nectar','needle','negate','nimble','ninety',
  'nobody','nodded','normal','noting','notice','notify','notion','nozzle','number',
  'nursed','object','oblige','obtain','occupy','occurs','offend','office','offset',
  'online','opener','openly','oppose','optics','option','oracle','orange','ordeal',
  'origin','orphan','outfit','outing','outlaw','output','outset','outwit','overdo',
  'overrun','owning','oxygen','packed','packer','paddle','palace','palate','paltry',
  'pamper','pander','panels','pantry','papers','parade','parcel','parent','parish',
  'parody','parole','parrot','parted','partly','patrol','patron','paused','paving',
  'payout','peachy','peanut','pebble','pencil','people','pepper','period','permit',
  'person','pestle','petite','phrase','picket','pickle','picked','pigeon','pillar',
  'pillow','pinned','pirate','pistol','placed','placid','plague','plains','planet',
  'planks','plates','player','pledge','plenty','pliant','plight','plowed','plunge',
  'plunks','pocket','podium','poetry','poison','police','policy','polish','polite',
  'ponder','pooled','poorly','portal','poster','potent','potato','potion','potter',
  'poultry','pounce','powder','praise','prayer','prefer','pretty','priced','priest',
  'prince','prison','prized','profit','prompt','proper','propel','proved','proven',
  'pumped','punish','puppet','purple','pursue','puzzle','quaint','quarry','quartz',
  'queasy','queens','quench','quirky','rabbit','racial','racism','racist','racket',
  'radial','raging','ragged','raised','raisin','ramble','random','ransom','rarely',
  'rascal','rather','rating','rattle','ravage','raving','reacts','reader','really',
  'reason','reboot','recall','recede','recent','recess','recipe','reckon','record',
  'recoup','rector','reduce','refill','refine','reform','refuse','refute','regain',
  'regard','regent','regime','region','regret','rehash','reject','relate','relief',
  'relish','relive','reload','reluct','remain','remark','remedy','remind','remote',
  'remove','render','rental','reopen','repaid','repair','repeat','repent','replay',
  'report','rescue','resent','reside','resign','resist','resort','result','resume',
  'retail','retain','retire','retort','return','reveal','revere','revert','review',
  'revise','revive','revolt','reward','ribbon','riddle','riding','riffle','ripple',
  'ritual','robust','rocket','roller','rookie','rotate','rotten','ruffle','rugged',
  'ruling','rumble','runway','rustic','sadden','saddle','safari','safely','safety',
  'sailor','salary','saliva','salmon','saloon','sample','sandal','sanity','savage',
  'saving','savior','scarce','scared','scenic','scheme','school','scores','screen',
  'scripted','scroll','search','season','seated','second','secret','sector','secure',
  'seeker','seldom','select','seller','senior','sequel','serial','series','sermon',
  'served','server','settle','severe','shadow','shaken','shaker','shaman','shaped',
  'shared','shaved','sheets','shield','shinny','shorts','should','shower','shrewd',
  'shriek','shrimp','shrine','shrink','shroud','sicken','siding','signal','signed',
  'silent','silver','simile','simple','simply','single','sister','sketch','skiing',
  'sliced','slider','slight','sloppy','slowly','smooth','snappy','snatch','sneaky',
  'social','socket','soften','softly','solace','solder','solemn','solely','solved',
  'solver','somber','source','sparse','speech','sphere','spider','spiral','spirit',
  'splash','spoken','sponge','spooky','spouse','sprawl','spread','spring','sprint',
  'sprout','sputum','square','squash','squeal','squint','stable','staged','stagger',
  'staked','stance','stands','staple','starch','stated','statue','status','stayed',
  'steady','steamy','stereo','sticky','stingy','stitch','stocks','stolen','stoned',
  'stooge','strain','strand','strata','stream','street','stress','strict','stride',
  'strike','string','stripe','strive','stroke','strong','struck','strung','studio',
  'submit','subtle','suburb','sudden','suffer','summit','summon','sundry','sunset',
  'superb','supper','supply','surely','survey','sutler','swampy','switch','symbol',
  'system','tables','tackle','talent','tamper','tandem','tangle','target','tariff',
  'taught','teapot','temple','tenant','tender','tennis','tenure','tester','thatch',
  'theirs','theory','thesis','thirst','thirty','thorny','though','thread','threat',
  'thrice','thrift','thrill','thrive','throne','throng','thrown','thrust','thwart',
  'ticket','tiding','tilled','timber','timely','tinder','tinted','tissue','titter',
  'toggle','toilet','tomato','tongue','tootle','topped','trophy','trough','trudge',
  'truant','truism','tunnel','turkey','turnip','tussle','twelve','twenty','tycoon',
  'undone','unfair','unfold','unholy','unions','unique','united','unless','unlike',
  'unload','unlock','unplug','unreal','unrest','unsafe','unseen','unstop','unsung',
  'untidy','untold','unused','unveil','unwind','unwise','upbeat','update','uphold',
  'upkeep','uplift','upload','uppers','uppity','uproar','uproot','upshot','upside',
  'uptake','uptown','upturn','upward','urgent','usable','useful','utmost','utter',
  'utopia','vacant','vacuum','vainly','valley','valued','vanish','vanity','varied',
  'vector','vendor','veneer','verbal','verify','versus','vessel','viable','victim',
  'virgin','virtue','vision','visual','voiced','volume','vortex','voyage','vulgar',
  'waffle','walken','walker','wallet','walnut','wander','wanted','warden','warmly',
  'warmth','warned','wasted','wealth','weapon','weaker','weekly','welder','wholly',
  'wicked','widely','widget','willed','wimple','winded','window','winner','winter',
  'wisdom','wished','within','wizard','wolves','wonder','wooden','worker','worthy',
  'wreath','writer','yearly','yeoman','yogurt','zealot','zenith','zephyr','zigzag',
  // ---- 7-letter words (600+) ----
  'abandon','abdomen','abiding','ability','abolish','absence','abscess','absolve',
  'abstain','absence','absorbs','abstain','abstain','academy','account','achieve',
  'acquire','acreage','address','adjourn','admiral','adopted','advance','adverse',
  'adviser','aerobic','afflict','ageless','ailment','aimless','airfare','airline',
  'airport','alchemy','alcohol','algebra','almanac','already','amazing','amenity',
  'amiable','amnesty','amplify','analogy','analyst','analyze','anarchy','anatomy',
  'ancient','angrily','angelic','angular','animate','anthill','antenna','anxiety',
  'anxious','anytime','applied','appoint','apricot','arrange','arsenal','arrival',
  'article','artisan','artwork','asphalt','assault','attempt','auction','audible',
  'auditor','average','aviator','awkward','awfully','babysit','backing','backlog',
  'baggage','balance','balloon','bandage','banking','bargain','barrage','barrier',
  'bashful','battery','bearing','because','bedding','bedroom','believe','beloved',
  'beneath','benefit','besides','between','bicycle','bidding','billing','billion',
  'binding','bizarre','blanket','blatant','blazing','bleaker','blender','blessed',
  'blossom','blowout','blunder','bombard','bonfire','booking','boulder','bounced',
  'bouncer','bracket','breaker','brewing','bribery','briefly','brigade','brigade',
  'bristle','british','brittle','broaden','broadly','browser','bruised','buffalo',
  'builder','buildup','bulging','bulldog','bumping','bungler','burglar','burnout',
  'cabinet','calcium','caliber','calling','camphor','capable','capital','captain',
  'caption','captive','capture','cardiac','careful','carrier','cascade','catalog',
  'caution','cavalry','caveman','ceiling','central','century','ceramic','certain',
  'chamber','channel','chapter','charter','chicken','chimney','circuit','citizen',
  'clamber','clarity','classic','cleaner','cleanup','clearly','climate','climber',
  'clinker','clipped','closest','closing','closure','cluster','clutter','coastal',
  'cobbler','cockpit','coconut','coexist','collage','collect','college','comfort',
  'command','comment','compact','company','compare','compass','compel','compete',
  'complex','compose','compute','comrade','conceal','concept','concern','concise',
  'condemn','conduct','confess','confide','confine','confirm','conform','confuse',
  'connect','conquer','consent','consort','consist','consist','contact','contain',
  'contend','content','contest','context','contour','control','convene','convert',
  'convict','cooking','coolant','correct','corrode','corrupt','costume','cottage',
  'council','counsel','counter','country','coupled','courage','courier','creator',
  'craving','creator','crimson','crinkle','cripple','crusade','crystal','cuisine',
  'culture','cunning','curator','current','curtain','cushion','custard','customs',
  'cutback','cutting','cyclist','cynical','damages','dancing','dealing','decline',
  'declare','decoded','decorum','default','defence','deficit','deflect','defunct',
  'degrade','deliver','deltoid','delusion','density','deposit','depress','deprive',
  'desktop','despair','despite','destiny','destroy','detract','develop','devoted',
  'dialect','diamond','dictate','digital','dilemma','diluted','diploma','disable',
  'discard','discern','discuss','disease','disgust','dislike','dismiss','display',
  'dispute','disrupt','distant','distill','distort','disturb','diverse','divided',
  'divorce','donated','doorway','dormant','dossier','doubled','drafted','drained',
  'draping','drawing','dressed','drifted','droplet','drought','drummer','durable',
  'dweller','dynamic','earlier','earnest','earning','earthen','eastern','ecology',
  'economy','editing','edition','educate','elderly','elected','elegant','element',
  'elevate','embrace','emerged','emotion','emperor','empiric','empower','emptied',
  'enabled','encoder','endless','endorse','enforce','engaged','enhance','ensured',
  'episode','erected','erosion','essence','eternal','ethical','evident','exclaim',
  'excited','exclude','exhaust','exhibit','expense','explain','exploit','explore',
  'exposed','express','extract','extreme','eyebrow','eyewear','faculty','failing',
  'failure','fairway','fallacy','fallout','falsify','fashion','fatally','fatigue',
  'feature','fiction','filling','finally','finance','finding','firearm','firstly',
  'fishing','fitness','fixture','flannel','flaring','flashed','flatten','flavors',
  'flicker','fleeing','flipped','floated','flooded','flowing','flutter','footstep',
  'foreign','forever','formula','forsake','fortune','forward','fossils','founded',
  'founder','fragile','freedom','freight','frenemy','frantic','fulfill','funding',
  'furnace','furnish','gallery','gateway','general','generic','genetic','genuine',
  'geology','gesture','getting','glacier','glamour','glimpse','glitter','globals',
  'glorify','goddess','gradual','grandma','granite','graphic','gravity','greater',
  'greatly','griddle','grieved','grocery','grounds','growing','grumble','gunfire',
  'habitat','halfway','halving','halibut','handled','handler','handout','hangout',
  'happily','harbour','hardest','hardily','harmful','harmony','harvest','headset',
  'healthy','hearing','heavily','helpers','helpful','hemlock','herself','highway',
  'himself','history','holding','holiday','horizon','hormone','hostile','hosting',
  'housing','however','humming','hundred','hunting','hurried','husband','hydrant',
  'hygiene','iceberg','illegal','imagine','immense','immerse','immoral','impacts',
  'impeach','implied','improve','impulse','include','indexed','indoors','indulge',
  'inflame','inflate','inflict','initial','inquiry','insight','inspect','install',
  'instant','instead','interim','invalid','invader','inkling','invoice','involve',
  'isolate','jackpot','jaggedly','janitor','javelin','jealous','jointly','journal',
  'journey','jubilee','justice','justify','kalends','keenest','keeping','keynote',
  'kickoff','kindled','kindest','kingdom','kitchen','kneaded','knocked','knotted',
  'labeled','landing','largess','largest','lasting','lateral','lattice','launder',
  'lawsuit','leading','leaflet','leaping','learned','leather','lecture','leftist',
  'liberal','liberty','license','lighter','lighten','limited','listing','literal',
  'locally','logical','longest','looking','loyalty','machine','magnate','magnify',
  'mailbox','majesty','makeout','mandate','mangled','mankind','manners','mapping',
  'martial','masking','massive','mastery','matched','maximum','meaning','measure',
  'medical','meeting','melodic','melting','memento','memorial','mention','methods',
  'midterm','migrate','million','mineral','minimum','miracle','missing','mission',
  'mistake','mixture','modest','monarch','monitor','monthly','morning','mounted',
  'mystery','mystify','natural','nearest','neatest','neglect','neither','nervous',
  'nesting','network','neutral','notable','nothing','noticed','novelty','nuclear',
  'nullify','nursery','nurture','nursing','obvious','offense','officer','offline',
  'ongoing','opening','operate','opinion','optimal','organic','origins','outcome',
  'outdoor','outline','outlook','outside','outward','overall','overlap','overrun',
  'oversee','painful','painter','palette','parking','partial','partner','passage',
  'passing','passion','passive','pastime','patient','patriot','pattern','payment',
  'payroll','peacock','peasant','penalty','pending','pension','perfect','perform',
  'persist','persona','phantom','pilgrim','pioneer','pitched','pitcher','pivotal',
  'plastic','plateau','playful','pleased','pledged','plenary','plotter','plumber',
  'pointed','poising','polemic','politic','popular','portion','portray','posture',
  'pottery','poverty','powered','praying','precede','precise','predict','preface',
  'premise','premium','prepare','present','preside','pressed','presume','pretend',
  'prevail','prevent','preview','primary','printer','privacy','private','probate',
  'problem','proceed','process','procure','produce','product','profile','program',
  'project','promise','promote','prosper','protect','protein','protest','provide',
  'provoke','publish','pursued','puzzled','pyramid','qualify','quality','quarter',
  'quickly','quieted','racquet','radical','rafting','ragtime','railcar','railing',
  'rainbow','raising','rampant','rancher','rapidly','realize','reality','receipt',
  'receive','recital','recover','reflect','refugee','regular','related','release',
  'remains','removal','renamed','renewal','replace','replied','request','require',
  'reserve','reshape','resolve','respect','respond','restart','restore','results',
  'retired','retreat','reunion','reverse','revisit','revival','revolve','routine',
  'rubbing','rumored','running','rupture','rushing','sadness','safeguard','salvage',
  'sampled','sandbox','satisfy','savings','scatter','scenery','scholar','science',
  'seating','section','segment','seizure','senator','serious','servant','serving',
  'session','settled','seventh','several','shading','shallow','sharing','sharpen',
  'shatter','shelter','shifted','shimmer','shortly','shrivel','shuffle','shuttle',
  'sidebar','silence','silicon','similar','sincere','singled','sitting','skeptic',
  'skilled','slammed','slender','slipped','slumber','smaller','smoking','snapped',
  'snippet','soldier','somehow','sparked','speaker','special','specify','sponsor',
  'spotted','squared','squeezy','stadium','stamina','standby','stapled','started',
  'startle','station','steamer','steward','storage','strange','stretch','student',
  'studied','subject','succeed','success','suggest','sulfate','summary','summons',
  'sunrise','support','suppose','surface','surplus','surfeit','surgeon','surplus',
  'surpass','surplus','surplus','survive','suspect','suspend','swallow','sweater',
  'teacher','teaming','telling','tempest','tension','termite','terrain','terrify',
  'therapy','thereby','thermal','thicken','thought','thrifty','through','thunder',
  'tobacco','tonight','toolbar','topical','topmost','tossing','totally','tourism',
  'tourist','towards','tracker','trading','traffic','tragedy','trainer','transit',
  'trapped','travels','trekked','tremors','tribune','tribute','trigger','trilogy',
  'triumph','trouble','trusted','trustee','tumbled','turbine','turning','twisted',
  'typical','tyranny','umpteen','unaware','uncanny','unclean','undergo','uniform',
  'unravel','unusual','upgrade','upright','upscale','upstart','upswing','uptight',
  'utensil','utility','uttered','vacancy','vaguely','vampire','vanilla','variety',
  'various','varnish','venture','verdict','veteran','vibrant','victory','villain',
  'vintage','violate','violent','virtual','visible','visitor','voltage','volumes',
  'voucher','vulture','wadding','waiting','walking','warfare','warlike','warming',
  'warning','warrant','warrior','wasting','watched','weather','website','wedding',
  'weekday','weekend','welcome','welfare','western','wetland','whisper','whistle',
  'whoever','widened','willful','willing','winning','without','witness','wizened',
  'workers','working','workout','worship','wounded','wrapped','wrapper','writing',
  'written','wrongly',
  // ---- 8-letter words (400+) ----
  'abdicate','abnormal','abortion','abrasion','abstract','abundant','academic',
  'accepted','accident','accuracy','accurate','achieved','acquaint','activate',
  'actually','addition','adequacy','adequate','adjusted','advanced','advocate',
  'affected','afforded','agitated','agreeing','aircraft','allergen','alliance',
  'allocate','allowing','altitude','ambiance','ambition','amicable','analysis',
  'analytic','ancestor','animated','announce','annually','answered','antibody',
  'anything','anywhere','apparent','appetite','applause','applying','apposite',
  'approach','approval','aquarium','argument','arrested','artistic','assembly',
  'assessed','assuming','asteroid','athletic','attached','attacker','attained',
  'atheists','attested','attorney','audacity','audience','authored','autonomy',
  'aviation','backdrop','bacteria','balanced','bankrupt','bargains','barnacle',
  'baseball','baseline','bathroom','becoming','befriend','behavior','believed',
  'belonged','betrayal','birthday','blasting','bleeding','blessing','blinding',
  'blissful','blocking','blooming','blossoms','bookmark','borrower','boundary',
  'brackets','branding','breaking','breeding','briefing','brighten','brightly',
  'bristled','broadcast','browning','brushing','building','bulletin','bundling',
  'bursting','business','buttoned','calendar','campaign','campfire','cannibal',
  'cannabis','capacity','captured','cardigan','carefree','caretake','carnival',
  'carrying','catching','catering','cautious','ceremony','chairman','champion',
  'chapters','charcoal','charging','charisma','checkout','cheerful','chemical',
  'children','chipsets','choosing','citation','civilian','claiming','classify',
  'cleanser','clearing','climbing','clinical','clipping','coaching','coherent',
  'coincide','collapse','colloquy','colonial','colorful','combined','comeback',
  'comedian','commerce','communal','commuter','compared','compares','compiled',
  'compiler','complain','complete','composed','compound','computer','conceive',
  'conclude','concrete','condense','confetti','confined','conflict','congress',
  'conjured','conquest','consider','conspire','constant','consults','consumer',
  'consumed','contacts','contempt','contents','continue','contract','contrast',
  'controls','convince','corridor','cosmetic','costumer','coupling','coverage',
  'cowardly','creation','creative','creature','criminal','criteria','critique',
  'crossing','crossbow','cultured','currency','customer','database','daughter',
  'deadline','debugger','deceived','december','deciding','decision','declared',
  'declined','decorate','decrease','dedicate','deducted','deepened','defeated',
  'defended','defender','definite','delicate','delivery','demanded','demolish',
  'departed','depicted','deployed','deposing','deprived','describe','designer',
  'desktops','destined','detailed','detector','diabetes','diagonal','dialogue',
  'diamonds','dictator','differed','dilemmas','diminish','dingiest','dinosaur',
  'diplomat','directed','director','disabled','disaster','disciple','disclose',
  'discount','discover','discrete','disorder','dispatch','disperse','displace',
  'disposal','disposal','disprove','distance','distinct','distract','district',
  'dividend','dividing','doctrine','document','domestic','dominant','dominate',
  'donation','doorstep','doubling','downfall','download','dramatic','drawings',
  'dreaming','drinking','dropping','drowning','drunking','duration','dwelling',
  'dynamite','earnings','eastward','educated','educator','effected','eighteen',
  'election','elective','electric','elegance','elevated','elevator','eligible',
  'elimbing','embedded','emerging','emission','emotions','emphasis','employed',
  'employee','employer','empowered','enabling','enclosed','encircle','encoding',
  'endanger','endorsed','enduring','engaging','engineer','enormity','enormous',
  'enrolled','entirely','entitled','entrance','envelope','equality','equation',
  'equipped','erosions','escalate','escapade','esteemed','estimate','evacuate',
  'evaluate','eventual','everyone','everyday','evidence','exalting','examined',
  'examiner','exceeded','exchange','exciting','excluded','executed','exercise',
  'exerting','exhuming','existing','expanded','expected','expedite','expelled',
  'expended','expenses','explicit','explored','explorer','exponent','exported',
  'exporter','exposure','extended','external','extorted','extracts','extremes',
  'eyeballs','fabulous','facility','faithful','familiar','famished','fanciful',
  'fastened','favorite','fearless','feasible','featured','feedback','feminine',
  'festival','fictional','fifteenth','figurine','filename','filament','filtered',
  'finalize','finalist','financed','findings','finished','firewall','firmness',
  'flagship','flamingo','flashily','flattery','flexible','flipside','floating',
  'flooding','flooring','flourish','flowered','fluently','focusing','followed',
  'follower','football','foothold','footnote','footwear','forecast','foremost',
  'forestry','forester','forgiven','formally','formerly','formulas','forsaken',
  'fortress','forwards','fossiled','fostered','fraction','fracture','fragment',
  'freehold','fourteen','fraction','franklin','freezing','friendly','frolicky',
  'frontier','fruitful','fruition','fulltime','function','funereal','furthest',
  'gambling','gangster','gardener','garrison','gathered','generate','generous',
  'genocide','geodesic','geology','geranium','gingerly','gleaming','glancing',
  'globally','glorious','glossary','graceful','gradient','graffiti','grandeur',
  'graphing','grateful','gripping','grooming','grouping','grounded','guardian',
  'guidance','habitual','hallmark','handicap','handbook','handling','happened',
  'harangue','hardball','hardened','hardcore','hardship','hardware','harmless',
  'harmonic','harshest','haunting','headline','headlong','hearties','heartily',
  'heavenly','heighten','helpless','heritage','hereunto','hermetic','hesitant',
  'hesitate','highland','highrise','historic','homework','honestly','honeybee',
  'horizons','horrible','horribly','hostages','humidity','humility','humorous',
  'hundreds','hydrogen','hypothec','identity','ignition','ignorant','illusion',
  'imminent','immortal','immunity','imperial','implicit','imported','imposing',
  'imprison','improper','improved','impurity','inactive','incident','includes',
  'increase','incurred','indebted','indicate','indirect','indulged','industry',
  'inequity','infantry','infinite','inflated','inflexed','informal','infrared',
  'inherent','initiate','innocent','innovate','inputted','insecure','insisted',
  'inspires','installs','instance','instinct','instruct','insurant','integral',
  'intended','interact','interest','interior','internal','interval','intimate',
  'intruder','invaders','invasion','invented','inventor','invested','investor',
  'involved','isolated','jokingly','judgment','junction','keyboard','keepsake',
  'kindling','kindness','knocking','labeling','landmark','landlord','language',
  'latitude','lawmaker','lavender','leverage','licensed','lifetime','lighting',
  'likewise','limitary','limiting','linearly','lingered','listener','literacy',
  'literary','literate','literary','location','lockdown','logistic','lonesome',
  'longevit','lukewarm','luminous','luncheon','magazine','magnetic','mainland',
  'maintain','majority','mandarin','manifest','manifold','manipula','managing',
  'mappings','marathon','marginal','maritime','markings','marriage','massacre',
  'matching','material','maturity','maximize','measured','mechanic','medalist',
  'medicine','medieval','membrane','memorial','merchant','midnight','migrated',
  'militant','military','millions','minimize','ministry','minority','mirrored',
  'mischief','moderate','molecule','momentum','monarchy','monopoly','monotone',
  'monument','morality','mortgage','motivate','mounting','movement','multiply',
  'munition','murderer','mushroom','mutation','mutually','mystical','national',
  'navigate','negative','neglects','neighbor','nestling','networks','newcomer',
  'nineteen','nitrogen','nobleman','nominate','nonsense','normally','notation',
  'notebook','noticing','novelist','november','numerous','obituary','objected',
  'oblivion','observer','obstacle','obtained','occasion','occupied','occurred',
  'offended','offering','official','offshore','olympics','onscreen','openness',
  'opponent','opposite','optimism','optimist','optional','ordering','ordinary',
  'organism','original','orphaned','orthodox','outbreak','outburst','outclass',
  'outdoors','outfield','outlined','outreach','outright','outsider','overcome',
  'overlaid','overload','overlook','overrule','overseen','overtake','overtime',
  'overview','owership','packages','painting','pamphlet','paradise','parallel',
  'paranoid','parental','particle','partisan','passable','passport','pastoral',
  'patience','patently','pathetic','patriate','pavilion','peaceful','peasants',
  'peculiar','pedagogy','pedantic','penetrad','penguins','perceive','perchance',
  'performs','periodic','persists','personal','persuade','petition','phantoms',
  'pharmacy','pheasant','physical','pictures','piercing','pilaster','pilgrims',
  'pinpoint','pipeline','pittance','placated','platform','platonic','playbook',
  'pleasant','pleasure','plentily','plotting','plunging','policing','polished',
  'politics','populace','populist','porosity','portrait','position','positive',
  'possible','possibly','potently','powerful','practice','precious','predator',
  'pregnant','premiere','premises','prepared','presence','preserve','pressing',
  'pressure','prestige','presumed','pretense','previous','priestly','princess',
  'princely','printing','priority','prisoner','probable','probably','proceeds',
  'proclaim','produced','producer','products','profound','progress','prohibit',
  'prolific','prolongs','prompted','promptly','proofing','properly','property',
  'prophecy','proposal','proposed','prospect','prospers','protects','protects',
  'protocol','provided','provider','province','provoked','prudence','publicly',
  'purchase','pursuits','puzzling','qualifed','quantity','quarters','question',
  'radiance','railroad','rainfall','randomly','rational','reaction','readable',
  'reaffirm','realized','realtime','reasoned','rebelled','received','receiver',
  'recently','reckless','reclined','recognin','recorded','recorder','recovery',
  'recruits','recycled','redesign','redirect','reducing','refining','reflects',
  'reformed','refusing','regional','register','regulate','reigning','reinvest',
  'rejected','relating','relation','relative','relaxing','released','relevant',
  'reliable','relieved','religion','relocate','remained','remember','reminded',
  'remotely','removing','renowned','repaints','repaying','repeated','replaced',
  'reported','reporter','republic','requests','required','research','reserved',
  'resident','resigned','resolved','resource','respects','responds','response',
  'restless','restored','restrict','resulted','retailer','retained','retiring',
  'retrieve','returned','reusable','revealed','reversal','reversed','reviewer',
  'revision','reviving','revolted','rhetoric','richness','ridicule','rigorous',
  'romantic','roommate','rumbling','ruthless','sabotage','sadistic','safetied',
  'sampling','sanction','sandwich','satirize','scenario','schedule','scooters',
  'scramble','scrutiny','seasonal','secondly','securing','security','selected',
  'sensible','sentence','separate','sequence','sergeant','serviced','settling',
  'severity','sexually','shallows','shameful','sharonly','shelling','shelving',
  'shifting','shipping','shocking','shopping','shortage','shoulder','showdown',
  'shutdown','sickness','sideways','signaled','silenced','simplest','simulate',
  'sinister','situated','skeleton','sketched','skillful','slashing','sleeping',
  'slippery','smallest','smartest','snapshot','snowfall','socially','software',
  'solution','somebody','somewhat','southern','spacious','sparking','speaking',
  'specific','specimen','spectral','spelling','spending','spinning','spirited',
  'splashed','splendid','sporting','sporting','spotless','sprawled','squeezed',
  'stacking','staffing','stagnant','staining','stalemat','stallion','standard',
  'standing','starling','startled','steadily','steaming','steeping','stepping',
  'sticking','stiffest','stimulus','stinging','stirring','stopping','storming',
  'straight','strained','stranded','stranger','strategy','straying','strength',
  'stressed','strictly','striking','stripped','striving','strongly','struggle',
  'stubborn','stumbled','stunning','stumping','suburban','suddenly','suffered',
  'sufferer','sufficed','suggests','suitable','suitably','summoned','sunlight',
  'superior','supplied','supplier','supports','supposed','suppress','surround',
  'surveyor','survival','survived','survivor','suspect','suspense','suspends',
  'swapping','sweeping','swimming','switched','symbolic','sympathy','symptoms',
  'syndrome','tactical','tailored','takeover','tangible','taxpayer','teammate',
  'teaching','tempting','tendency','terminal','terrific','terribly','thankful',
  'theology','theories','thinking','thorough','thousand','thriller','tightest',
  'timeless','timeline','together','tolerant','tolerate','tomorrow','tortured',
  'touching','township','tracking','trailing','training','transfer','transmit',
  'traveled','traveler','treasure','treating','triangle','trillion','troubled',
  'trusting','truthful','tuneable','turnover','tutoring','twisting','ultimate',
  'umbrella','uncommon','undercut','underdog','underway','universe','unlikely',
  'unlocked','upcoming','updating','upgrades','upheaval','vacation','validate',
  'valuable','vanished','variable','velocity','ventures','verified','vertical',
  'veterans','vicinity','victoria','vigorous','violated','violence','virginia',
  'visiting','vitamins','volatile','volcanic','voltages','volumes','voluntar',
  'warranty','watchdog','weakness','weaponry','whatever','whenever','wherever',
  'whispers','wholesome','wildfire','windmill','wireless','withdraw','withheld',
  'withhold','withstand','woodland','workflow','workshop','writings','yearbook',
  'yearning','yielding',
  // ---- 9-letter words (200+) ----
  'abandoned','abolition','absorbing','abundance','academics','accompany','according',
  'accounted','acquiring','activator','addressed','adhesives','adjusting','admirable',
  'admission','admission','advantage','adventure','advertise','aesthetic','affecting',
  'affection','afternoon','aftermath','aggregate','agitation','agreement','algorithm',
  'alignment','alongside','alternate','amazement','ambiguity','ambitious','amendment',
  'amplified','analogous','analyzing','animation','announced','anonymous','apartment',
  'apologize','appealing','appliance','appointed','appraisal','approving','arbitrary',
  'architect','assaulted','assembled','asserting','assisting','associate','asteroids',
  'astounded','astronomy','attempted','attendant','attention','attribute','authority',
  'authorize','automatic','available','averaging','awareness','backstage','bandwidth',
  'barricade','basically','battalion','beautiful','beginning','benchmark','bilingual',
  'biography','blueprint','borrowing','boulevard','breakdown','breathing','brilliant',
  'broadband','broadcast','brokerage','brutality','budgeting','butterfly','bypassing',
  'calculate','candidate','captivate','capturing','carefully','carpenter','catalogue',
  'celebrate','cellphone','centering','certainly','certified','challenge','champagne',
  'character','chemistry','childhood','chocolate','chronicle','cigarette','circulate',
  'civilized','clearance','clustered','coalition','cognitive','collapses','colleague',
  'collected','combining','combating','commander','commenced','commodity','communism',
  'community','companion','competent','complaint','compliant','component','composing',
  'composure','computing','conceived','concerned','concludes','condition','conducive',
  'conducted','conductor','confessed','confident','confirmed','confusing','confusion',
  'connected','conquered','conquered','consensus','consented','conserved','considers',
  'consisted','consoling','constable','construct','consulted','consuming','contacted',
  'contained','container','contender','contested','continent','continued','contorted',
  'contrasts','contribut','converted','convicted','convinced','cooperate','copyright',
  'corporate','corrected','correctly','correlate','corrupted','courtyard','craftsman',
  'creatures','creditors','criterion','criticism','criticize','crocodile','crossover',
  'cultivate','customary','customize','dangerous','deceptive','decisions','declaring',
  'declining','dedicated','defendant','defending','defensive','deficient','delivered',
  'demanding','democracy','democrats','departing','departure','depending','depicting',
  'depleting','deposited','depressed','depicting','described','deserving','designing',
  'desolated','desperate','destroyed','detecting','detective','detention','determine',
  'developed','developer','deviation','diagnosed','diagnosis','dialogues','dictation',
  'differing','difficult','dignified','diligence','dimension','dimishing','diplomacy',
  'directing','direction','directive','directory','disappear','discharge','disclosed',
  'discovery','disgraced','disguised','dishonest','dismissal','dismissed','disorient',
  'dispersal','displaces','displayed','disposing','disregard','dissected','dissolved',
  'distanced','distorted','disturbed','diversity','diverting','documents','dominated',
  'donations','dreadful','duplexing','duplicate','dynamical','elaborate','electoral',
  'electrode','elegantly','elevation','eliminate','elsewhere','emanation','embedding',
  'emergence','emergency','emotional','emphasize','empirical','employers','employing',
  'empowered','emptiness','encounter','encourage','endlessly','enforcing','engineers',
  'enjoyable','enjoyment','enrolling','enriching','enshrined','entailing','entertain',
  'entialted','entourage','enveloped','equipment','equipping','erroneous','escalated',
  'espionage','essential','establish','estimable','estimated','evacuated','evaluated',
  'everybody','evidenced','evolution','examining','examiners','excavated','exception',
  'excessive','exchanged','exclaimed','excluding','exclusion','exclusive','executing',
  'execution','executive','exemplary','exemption','exhausted','exhibited','existence',
  'expanding','expansion','expectant','expensive','expertise','explained','explosion',
  'explosive','exposures','expressed','extending','extension','extensive','extracted',
  'extremist','extremity','fabricate','facetious','facilitate','fascinate','favorable',
  'featuring','fertility','festivity','fictional','filmstrip','financial','finishing',
  'firebrand','firehouse','fisherman','flowering','fluctuate','forbidden','foreclose',
  'forefront','forgiving','formalize','formulate','fortunate','forwarded','framework',
  'franchise','frequency','frivolous','frontline','frustrate','fulfilled','fullscale',
  'furniture','garnished','gathering','generated','generator','geography','genuinely',
  'glamorous','globalism','governing','governors','graduated','grandchil','graphical',
  'gratified','greetings','grenadier','grievance','groundbreaking','guarantee','guerrilla',
  'guidebook','guideline','gymnasium','halfheart','hallmarks','hammering','happening',
  'happiness','harboring','hardboard','harnessed','headlight','heartbeat','heartfelt',
  'heaviness','helpfully','herbalist','heroic','highlight','hindrance','histogram',
  'historian','homegrown','hopefully','horseback','horseshoe','hostility','household',
  'hurricane','hypnotize','identical','idolizing','ignorance','illegally','imaginary',
  'imagining','imbalance','imitation','immediate','immigrant','immovable','impartial',
  'imperfect','implanted','implement','implicate','important','importing','imposters',
  'improving','impulsive','inability','incapable','incentive','including','inclusion',
  'inclusive','incorrect','increment','incurring','indemnify','indicator','indignant',
  'indirectly','indonesia','induction','inductive','indulging','ineffable','infecting',
  'infection','inference','inflected','inflation','influence','informant','informing',
  'infringed','ingenious','inherited','initially','injecting','injection','innocence',
  'innovated','innovator','inoculate','insatiare','insidious','insisting','inspector',
  'installed','installer','instantly','institute','insurable','insurance','insurrect',
  'integrity','intellect','intending','intensely','intensity','intensify','intention',
  'intercept','intercity','interface','interlock','interpret','interrupt','intervene',
  'interview','introduce','intrusion','intuition','intuitive','investing','investors',
  'invisible','involving','irrefuted','irrigated','irritable','irritated','isolation',
  'itinerary','judiciary','justified','keystroke','knowledge','labelling','landscape',
  'laterally','launching','lawmaking','legendary','legislate','leisurely','liberated',
  'librarian','licensing','lifestyle','lightning','limestone','literally','literary',
  'lithesome','livestock','logistics','longitude','luxurious','machinery','magnitude',
  'magnified','maintains','makeovers','malicious','mandatory','manifesto','manipulat',
  'manifests','marketing','masculine','matchless','materials','maternity','mealtimes',
  'meanwhile','measuring','mechanics','mechanism','medically','meditated','memorable',
  'mentality','mentioned','mentoring','merchants','messenger','metaphors','migrating',
  'migration','milestone','millinery','mindfully','miniature','minimized','miscreant',
  'misspoken','modelling','moderator','molecular','monastery','monitored','moonlight',
  'mortgaged','motivated','municipal','narrative','naturally','navigated','navigator',
  'necessity','negligent','negotiate','nervously','nightmare','nominated','nonprofit',
  'nostalgic','notifying','nurturing','nutrition','objecting','objection','objective',
  'obligated','observing','obsession','obtaining','obviously','occupying','occurring',
  'offending','offensive','offspring','operating','operation','operative','operators',
  'opponents','opponents','opportune','opponents','optimizer','ordaining','ordinance',
  'organizer','orienting','originals','originate','otherwise','ourselves','outermost',
  'outgrowth','outlining','outnumber','outskirts','overshoot','oversight','overthrow',
  'ownership','oxidation','packaging','painfully','panicking','paragraph','parallels',
  'paramount','partition','passenger','pathology','patronage','patronize','peaceable',
  'peninsula','perceived','perennial','perfectly','performed','performer','permitted',
  'persecute','persevere','personage','personnel','pertinent','pessimist','petroleum',
  'piercing','placement','plaintext','plantains','platforms','plausible','playfully',
  'pleasured','plentiful','plutonium','populated','porcelain','portfolio','possessed',
  'posterity','potential','powerless','practical','preceding','precision','predating',
  'predicted','predictor','preferred','prejudice','premature','prescribe','preserved',
  'president','pretended','prevalent','prevented','primarily','primitive','principal',
  'principle','printable','privately','privilege','probation','proceding','proceeded',
  'processor','proclaims','procuring','producing','profanity','professed','profiling',
  'profiteer','profusion','programme','projected','projector','prolonged','prominent',
  'promising','promotion','prompting','pronunced','proponent','proposals','proposing',
  'prosecute','prospered','prostrate','protected','protested','protester','providing',
  'provision','provoking','prudently','publisher','pulsating','punctuate','purchased',
  'purposely','purposing','qualified','qualifier','quarterly','quickened','racketing',
  'radiation','ramifying','rantingly','ratifying','rationale','reactions','reasoning',
  'rebelling','rebellion','rebutting','recalling','receiving','reception','recession',
  'reckoning','reclaimed','recognize','recommend','reconcile','recruited','recurring',
  'recycling','redefault','redefined','redesigns','redundant','reenacted','reference',
  'referring','reflected','reforming','regarding','registers','regretful','regularly',
  'regulated','regulator','rehearsal','reinstall','reinstate','reiterate','rejection',
  'relations','releasing','relevance','relenting','reluctant','remainder','remaining',
  'remarking','remedying','reminding','rendering','renounced','reopening','reordered',
  'repacking','repayment','repealing','repeating','repelling','repercuss','replacing',
  'replicate','reporting','reproduced','reproduce','republics','reputable','requested',
  'requiring','resembled','resentful','reserving','reshaping','residence','resilient',
  'resistant','resolving','resonance','resorting','resources','respected','responded',
  'restoring','restraint','restricts','resulting','retailing','retaining','retention',
  'retrieval','retrieved','returning','revealing','revolting','revolving','rewarding',
  'rewritten','righteous','rightmost','riverside','ruthfully','sacrified','saddening',
  'safeguard','sanctuary','sandstorm','satellite','satisfied','scattered','scenarios',
  'scheduled','screening','sculpting','sculpture','searching','seasoning','secondary',
  'secretary','selecting','selection','selective','sensation','sensitive','sentiment',
  'separable','separated','separator','sequenced','seriously','shattered','sheltered',
  'shielding','shipboard','shortened','shoulders','sidelined','signaling','signature',
  'silencing','similarly','simulated','simulator','sincerely','skeptical','smartened',
  'snowflake','socialite','softening','solicited','solutions','somewhere','sophomore',
  'speculate','spiritual','spotlight','spreading','squashing','squelched','stability',
  'staggered','staircase','stampeded','standards','standings','startling','statehood',
  'statement','statistic','steadfast','stiffened','stimulate','stockpile','stomached',
  'stoplight','storyline','stragglers','strategic','streaming','strengths','stretched',
  'stricken','stringent','strongest','structure','struggled','stumbling','submitted',
  'subscribe','substance','succeeded','successor','suffering','sufficing','suggested',
  'summarily','summarize','sunflower','superfine','supervise','supplying','supported',
  'supporter','supremacy','surcharge','surmising','surprised','surrender','surrogate',
  'surrounds','surviving','suspected','suspended','suspicion','sustained','sweetened',
  'switching','symbolize','symmetric','synagogue','synthetic','taxpayers','technical',
  'technique','telegraph','telephone','telescope','temperley','temporary','tenacious',
  'terminate','territory','terrorism','terrorist','testament','thankless','theorized',
  'therapist','therefore','thrilling','threshold','tightened','timestamp','tolerable',
  'tolerance','tombstone','tradition','trademark','tragedies','trainload','trampling',
  'transform','transient','translate','transport','treatment','trembling','triggered',
  'triumphed','troubling','turbulent','twentieth','unabashed','unaltered','uncertain',
  'undecided','underwent','underline','undermine','undertake','undertone','undivided',
  'unearthed','unhappily','uniformed','uniformly','unilateral','universal','unlimited',
  'unmatched','unnatural','unopposed','unraveled','unrelated','unsettled','untouched',
  'unwilling','upgrading','uppermost','urinating','usability','utilities','utilizing',
  'validated','vandalism','variables','vegetable','venerated','ventilate','versioned',
  'viability','vibrating','violation','violently','virtually','visionary','visualize',
  'volunteer','wandering','warranted','watershed','welcoming','wholesome','widespread',
  'willfully','willingly','withdrawn','witnessed','wonderful','woodchuck','wordsmith',
  'worldwide','worrisome','worsening','worthless','wrestling','wristband',
]);

/* ------------------------------------------------------------------ */
/*  SCRABBLE LETTER POINT VALUES                                       */
/* ------------------------------------------------------------------ */
const LETTER_POINTS: Record<string, number> = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
  N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,
};

/* ------------------------------------------------------------------ */
/*  LETTER GENERATION (weighted by English frequency)                  */
/* ------------------------------------------------------------------ */
const VOWELS = 'AEIOU';
const WEIGHTED_LETTERS =
  'EEEEEEEEEEEEETTTTTTTTTTAAAAAAAAAOOOOOOOOOIIIIIIIII' +
  'NNNNNNNSSSSSSSSRRRRRRRRHHHHHHHDDDDDDDLLLLLLLL' +
  'CCCCUUUUUMMMMFFWWYYGGPPBBVVKJXQZ';

function generateLetters(count: number): string[] {
  const letters: string[] = [];
  const vowelCount = 2 + Math.floor(Math.random() * 2); // 2-3 vowels guaranteed
  for (let i = 0; i < vowelCount; i++) {
    letters.push(VOWELS[Math.floor(Math.random() * VOWELS.length)]);
  }
  while (letters.length < count) {
    const ch = WEIGHTED_LETTERS[Math.floor(Math.random() * WEIGHTED_LETTERS.length)];
    if (letters.filter(l => l === ch).length < 2) {
      letters.push(ch);
    }
  }
  // Shuffle (Fisher-Yates)
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  FIND ALL POSSIBLE WORDS FROM GIVEN LETTERS                         */
/* ------------------------------------------------------------------ */
function findPossibleWords(letters: string[]): string[] {
  const letterCounts: Record<string, number> = {};
  for (const l of letters) {
    const lower = l.toLowerCase();
    letterCounts[lower] = (letterCounts[lower] || 0) + 1;
  }
  const found: string[] = [];
  for (const word of DICTIONARY) {
    if (word.length < 3 || word.length > letters.length) continue;
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
  return found.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

/* ------------------------------------------------------------------ */
/*  SCORING SYSTEM                                                     */
/* ------------------------------------------------------------------ */
const RARE_LETTERS = new Set(['Q', 'Z', 'X', 'J']);

function scoreWord(word: string, chain: number): { base: number; lengthMult: number; rareMult: number; chainMult: number; total: number } {
  // Base: sum of letter point values
  let base = 0;
  for (const ch of word.toUpperCase()) {
    base += LETTER_POINTS[ch] || 0;
  }

  // Length multiplier
  const len = word.length;
  let lengthMult = 1;
  if (len === 4) lengthMult = 1.5;
  else if (len === 5) lengthMult = 2;
  else if (len === 6) lengthMult = 3;
  else if (len >= 7) lengthMult = 5;

  // Rare letter bonus
  let rareMult = 1;
  for (const ch of word.toUpperCase()) {
    if (RARE_LETTERS.has(ch)) rareMult += 0.5;
  }

  // Chain multiplier (consecutive valid words)
  let chainMult = 1;
  if (chain >= 3) chainMult = 1.25;
  if (chain >= 5) chainMult = 1.5;
  if (chain >= 8) chainMult = 2;
  if (chain >= 12) chainMult = 2.5;

  const total = Math.round(base * lengthMult * rareMult * chainMult);
  return { base, lengthMult, rareMult, chainMult, total };
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
  chain: '#a78bfa',
};

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                           */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

type GameMode = 'timed' | 'relaxed';
type GamePhase = 'modeSelect' | 'playing' | 'summary';

export default function WordForge({ onBack, onGameEnd }: Props) {
  const TIMED_DURATION = 90;
  const _LETTER_COUNT = 8; void _LETTER_COUNT;

  const [phase, setPhase] = useState<GamePhase>('modeSelect');
  const [mode, setMode] = useState<GameMode>('timed');
  const [letters, setLetters] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundWordScores, setFoundWordScores] = useState<Record<string, number>>({});
  const [possibleWords, setPossibleWords] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [chain, setChain] = useState(0);
  const [timer, setTimer] = useState(TIMED_DURATION);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [shakeWord, setShakeWord] = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [startTime] = useState(() => Date.now());

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const wordListRef = useRef<HTMLDivElement>(null);

  // Start game
  const startGame = useCallback((selectedMode: GameMode) => {
    const count = 7 + Math.floor(Math.random() * 3); // 7, 8, or 9
    const newLetters = generateLetters(count);
    setMode(selectedMode);
    setLetters(newLetters);
    setSelected([]);
    setFoundWords([]);
    setFoundWordScores({});
    setTotalScore(0);
    setChain(0);
    setTimer(TIMED_DURATION);
    setInvalidAttempts(0);
    setTotalAttempts(0);
    setFeedback(null);
    setPhase('playing');
  }, []);

  // Calculate possible words when letters change
  useEffect(() => {
    if (letters.length > 0) {
      setPossibleWords(findPossibleWords(letters));
    }
  }, [letters]);

  // Timer for timed mode
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'timed') return;
    if (timer <= 0) {
      endGame();
      return;
    }
    if (timer <= 10) sfxTimer();
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, timer]);

  const endGame = useCallback(() => {
    sfxGameOver();
    setPhase('summary');
    const elapsed = Date.now() - startTime;
    const accuracy = totalAttempts > 0 ? (totalAttempts - invalidAttempts) / totalAttempts : 0;
    onGameEnd?.({
      score: totalScore,
      accuracy,
      level: 1,
      maxScore: possibleWords.reduce((sum, w) => sum + scoreWord(w, 0).total, 0),
      timeMs: elapsed,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalScore, invalidAttempts, totalAttempts, possibleWords, startTime, onGameEnd]);

  const handleTileClick = useCallback((index: number) => {
    if (phase !== 'playing') return;
    // Deselect if already last selected
    if (selected.length > 0 && selected[selected.length - 1] === index) {
      setSelected(prev => prev.slice(0, -1));
      return;
    }
    // Skip if already selected
    if (selected.includes(index)) return;
    sfxTap();
    setSelected(prev => [...prev, index]);
  }, [phase, selected]);

  const currentWord = selected.map(i => letters[i]).join('').toLowerCase();

  const showFeedback = useCallback((text: string, color: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ text, color });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1500);
  }, []);

  const handleSubmit = useCallback(() => {
    if (phase !== 'playing') return;
    if (selected.length < 3) {
      sfxWrong();
      showFeedback('Need 3+ letters', C.error);
      setShakeWord(true);
      setTimeout(() => setShakeWord(false), 400);
      setShakeIntensity(4);
      return;
    }
    setTotalAttempts(prev => prev + 1);
    const word = currentWord;
    if (foundWords.includes(word)) {
      sfxWrong();
      showFeedback('Already found', C.error);
      setShakeWord(true);
      setTimeout(() => setShakeWord(false), 400);
      setShakeIntensity(3);
      setSelected([]);
      return;
    }
    if (!DICTIONARY.has(word)) {
      sfxWrong();
      showFeedback('Not a word', C.error);
      setShakeWord(true);
      setTimeout(() => setShakeWord(false), 400);
      setShakeIntensity(5);
      setChain(0); // break chain
      setInvalidAttempts(prev => prev + 1);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setParticles(prev => [...prev, ...wrongBurst(rect.width / 2, rect.height * 0.35)]);
      }
      setSelected([]);
      return;
    }
    // Valid word
    const newChain = chain + 1;
    const result = scoreWord(word, newChain);
    if (newChain >= 3) sfxCombo(newChain);
    else sfxScore();
    setChain(newChain);
    setTotalScore(prev => prev + result.total);
    setFoundWords(prev => [...prev, word]);
    setFoundWordScores(prev => ({ ...prev, [word]: result.total }));
    setFlashGreen(true);
    setTimeout(() => setFlashGreen(false), 300);

    let feedbackText = `+${result.total}`;
    if (result.chainMult > 1) feedbackText += ` (${result.chainMult}x chain)`;
    showFeedback(feedbackText, C.success);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = rect.width / 2;
      const cy = rect.height * 0.4;
      setParticles(prev => [...prev, ...correctBurst(cx, cy)]);
      setScorePops(prev => [...prev, createScorePop(cx, cy, result.total, C.success)]);
    }
    if (word.length >= 6) {
      setTimeout(() => {
        const r = containerRef.current?.getBoundingClientRect();
        if (r) setParticles(prev => [...prev, ...confettiBurst(r.width / 2, r.height * 0.3)]);
      }, 200);
    }
    setSelected([]);
    // Auto-scroll found words
    setTimeout(() => {
      wordListRef.current?.scrollTo({ top: wordListRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, [phase, selected, currentWord, foundWords, chain, showFeedback]);

  const handleClear = useCallback(() => {
    setSelected([]);
  }, []);

  const handleShuffle = useCallback(() => {
    setLetters(prev => shuffleArray(prev));
    setSelected([]);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key === 'Enter') { handleSubmit(); return; }
      if (e.key === 'Backspace') {
        if (selected.length > 0) setSelected(prev => prev.slice(0, -1));
        return;
      }
      if (e.key === 'Escape') { handleClear(); return; }
      // Type a letter to select it
      const upper = e.key.toUpperCase();
      if (/^[A-Z]$/.test(upper)) {
        const idx = letters.findIndex((l, i) => l === upper && !selected.includes(i));
        if (idx !== -1) {
          sfxTap();
          setSelected(prev => [...prev, idx]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleSubmit, handleClear, selected, letters]);

  // VFX loop
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

  // CSS keyframes
  useEffect(() => {
    const styleId = 'wordforge-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes wf-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
      @keyframes wf-fadeUp {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-24px); }
      }
      @keyframes wf-slideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes wf-pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes wf-greenFlash {
        0% { box-shadow: 0 0 0 0 rgba(0,201,123,0.4); }
        50% { box-shadow: 0 0 20px 4px rgba(0,201,123,0.3); }
        100% { box-shadow: 0 0 0 0 rgba(0,201,123,0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

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
      padding: '14px 0',
      gap: 6,
      flexWrap: 'wrap',
    },
    backBtn: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      color: C.text,
      width: 38,
      height: 38,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
    },
    pill: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      padding: '5px 12px',
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
    },
    main: {
      width: '100%',
      maxWidth: 480,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      flex: 1,
    },
    wordDisplay: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '12px 20px',
      minHeight: 44,
      minWidth: 200,
      textAlign: 'center' as const,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: 3,
      textTransform: 'uppercase' as const,
      position: 'relative' as const,
      transition: 'border-color 0.2s ease',
    },
    tileGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      maxWidth: 340,
    },
    tile: {
      width: 64,
      height: 64,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'transform 0.1s ease, background 0.15s ease, border-color 0.15s ease',
      position: 'relative' as const,
    },
    controls: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
    },
    btn: {
      border: 'none',
      borderRadius: 999,
      color: '#fff',
      padding: '10px 24px',
      fontSize: 15,
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'transform 0.1s ease',
    },
    secondaryBtn: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      color: C.muted,
      padding: '10px 16px',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
    },
    wordList: {
      width: '100%',
      maxWidth: 480,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 14,
      maxHeight: 180,
      overflowY: 'auto' as const,
    },
    wordChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 999,
      padding: '3px 10px',
      margin: '3px 3px',
      fontSize: 12,
      fontWeight: 600,
    },
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(21, 29, 43, 0.96)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    modal: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '28px 24px',
      maxWidth: 420,
      width: '90%',
      textAlign: 'center' as const,
      animation: 'wf-slideIn 0.3s ease',
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 700,
      marginBottom: 4,
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '9px 0',
      borderBottom: `1px solid ${C.border}`,
      fontSize: 14,
    },
    modalBtn: {
      background: C.accent,
      border: 'none',
      borderRadius: 999,
      color: '#fff',
      padding: '12px 30px',
      fontSize: 15,
      fontWeight: 700,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
    },
  };

  /* ================================================================ */
  /*  MODE SELECT SCREEN                                               */
  /* ================================================================ */
  if (phase === 'modeSelect') {
    return (
      <div style={s.root}>
        <div style={{ ...s.header, justifyContent: 'flex-start' }}>
          <button style={s.backBtn} onClick={onBack} title="Back">
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 8 }}>Word Forge</span>
        </div>
        <div style={{ ...s.main, justifyContent: 'center', gap: 32, paddingBottom: 80 }}>
          <div style={{ textAlign: 'center' }}>
            <Zap size={40} color={C.accent} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Choose Your Mode</div>
            <div style={{ color: C.muted, fontSize: 14, maxWidth: 300 }}>
              Form words from random letters. Longer words and rare letters score more points.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
            <button
              onClick={() => startGame('timed')}
              style={{
                background: C.surface,
                border: `2px solid ${C.accent}`,
                borderRadius: 14,
                padding: '18px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                color: C.text,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Clock size={20} color={C.accent} />
                <span style={{ fontSize: 17, fontWeight: 700 }}>Timed Mode</span>
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                90 seconds. Score as many words as you can before time runs out. Chain bonus for consecutive valid words.
              </div>
            </button>
            <button
              onClick={() => startGame('relaxed')}
              style={{
                background: C.surface,
                border: `2px solid ${C.chain}`,
                borderRadius: 14,
                padding: '18px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                color: C.text,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Target size={20} color={C.chain} />
                <span style={{ fontSize: 17, fontWeight: 700 }}>Relaxed Mode</span>
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                No time limit. Find every possible word from the letters. Finish when you are satisfied.
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  SUMMARY SCREEN                                                    */
  /* ================================================================ */
  if (phase === 'summary') {
    const accuracy = totalAttempts > 0 ? Math.round(((totalAttempts - invalidAttempts) / totalAttempts) * 100) : 100;
    const longestWord = foundWords.reduce((a, b) => b.length > a.length ? b : a, '');
    const bestWord = foundWords.reduce((a, b) => (foundWordScores[b] || 0) > (foundWordScores[a] || 0) ? b : a, foundWords[0] || '');
    const missed = possibleWords.filter(w => !foundWords.includes(w));
    const maxPossibleScore = possibleWords.reduce((sum, w) => sum + scoreWord(w, 0).total, 0);

    return (
      <div style={s.root}>
        <div style={s.overlay}>
          <div style={s.modal}>
            <Trophy size={36} color={C.gold} style={{ marginBottom: 8 }} />
            <div style={s.modalTitle}>Game Complete</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
              {mode === 'timed' ? '90 second challenge' : 'Relaxed mode'} -- {foundWords.length} words forged
            </div>
            <div style={s.statRow}>
              <span style={{ color: C.muted }}>Total Score</span>
              <span style={{ fontWeight: 700, color: C.accent, fontSize: 18 }}>{totalScore.toLocaleString()}</span>
            </div>
            <div style={s.statRow}>
              <span style={{ color: C.muted }}>Words Found</span>
              <span style={{ fontWeight: 700 }}>{foundWords.length} / {possibleWords.length}</span>
            </div>
            <div style={s.statRow}>
              <span style={{ color: C.muted }}>Accuracy</span>
              <span style={{ fontWeight: 700, color: accuracy >= 80 ? C.success : C.error }}>{accuracy}%</span>
            </div>
            {longestWord && (
              <div style={s.statRow}>
                <span style={{ color: C.muted }}>Longest Word</span>
                <span style={{ fontWeight: 700, color: C.success, textTransform: 'uppercase' }}>{longestWord}</span>
              </div>
            )}
            {bestWord && (
              <div style={s.statRow}>
                <span style={{ color: C.muted }}>Best Word</span>
                <span style={{ fontWeight: 700, color: C.gold, textTransform: 'uppercase' }}>
                  {bestWord} ({foundWordScores[bestWord]}pts)
                </span>
              </div>
            )}
            {maxPossibleScore > 0 && (
              <div style={s.statRow}>
                <span style={{ color: C.muted }}>Max Possible Score</span>
                <span style={{ fontWeight: 600 }}>{maxPossibleScore.toLocaleString()}</span>
              </div>
            )}
            {missed.length > 0 && (
              <div style={{ marginTop: 14, textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                  Missed Words ({missed.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
                  {missed.slice(0, 40).map(w => (
                    <span
                      key={w}
                      style={{
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 11,
                        color: C.muted,
                      }}
                    >
                      {w}
                    </span>
                  ))}
                  {missed.length > 40 && (
                    <span style={{ fontSize: 11, color: C.muted, padding: '2px 6px' }}>
                      +{missed.length - 40} more
                    </span>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button
                style={{ ...s.modalBtn, background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                onClick={onBack}
              >
                <ArrowLeft size={15} /> Exit
              </button>
              <button
                style={s.modalBtn}
                onClick={() => {
                  sfxLevelUp();
                  setPhase('modeSelect');
                }}
              >
                <RotateCcw size={15} /> Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  PLAYING PHASE                                                     */
  /* ================================================================ */
  const timerColor = timer <= 10 ? C.error : timer <= 20 ? C.gold : C.text;
  const progressPct = mode === 'timed' ? (timer / TIMED_DURATION) * 100 : 100;

  return (
    <div ref={containerRef} style={{ ...s.root, position: 'relative', overflow: 'hidden', ...screenShakeStyle(shakeIntensity) }}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack} title="Back">
          <ArrowLeft size={17} />
        </button>
        <div style={s.pill}>
          <Star size={13} color={C.gold} />
          {totalScore.toLocaleString()}
        </div>
        {chain >= 2 && (
          <div style={{ ...s.pill, borderColor: C.chain, color: C.chain }}>
            <Flame size={13} color={C.chain} />
            {chain}x chain
          </div>
        )}
        {mode === 'timed' && (
          <div style={{ ...s.pill, color: timerColor, borderColor: timer <= 10 ? C.error : C.border }}>
            <Clock size={13} color={timerColor} />
            {timer}s
          </div>
        )}
        <div style={s.pill}>
          <Check size={13} color={C.success} />
          {foundWords.length}/{possibleWords.length}
        </div>
      </div>

      <div style={s.main}>
        {/* Current Word Display */}
        <div
          style={{
            ...s.wordDisplay,
            borderColor: flashGreen ? C.success : shakeWord ? C.error : C.border,
            animation: shakeWord ? 'wf-shake 0.4s ease' : flashGreen ? 'wf-greenFlash 0.3s ease' : 'none',
          }}
        >
          {currentWord ? (
            <span style={{ color: C.accent }}>{currentWord.toUpperCase()}</span>
          ) : (
            <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Tap letters to forge words</span>
          )}
          {feedback && (
            <div
              style={{
                position: 'absolute',
                top: -10,
                right: -8,
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 700,
                background: feedback.color,
                color: '#fff',
                animation: 'wf-fadeUp 1.5s ease forwards',
              }}
            >
              {feedback.text}
            </div>
          )}
        </div>

        {/* Letter Tiles */}
        <div style={s.tileGrid}>
          {letters.map((letter, i) => {
            const isSelected = selected.includes(i);
            const pts = LETTER_POINTS[letter] || 1;
            const isRare = RARE_LETTERS.has(letter);
            return (
              <div
                key={i}
                onClick={() => handleTileClick(i)}
                style={{
                  ...s.tile,
                  background: isSelected ? C.accent : C.surface,
                  border: `2px solid ${isSelected ? C.accent : isRare ? C.gold : C.border}`,
                  color: isSelected ? '#fff' : isRare ? C.gold : C.text,
                  transform: isSelected ? 'scale(0.93)' : 'scale(1)',
                  opacity: isSelected ? 0.5 : 1,
                }}
              >
                <span>{letter}</span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    right: 6,
                    fontSize: 9,
                    fontWeight: 600,
                    color: isSelected ? 'rgba(255,255,255,0.5)' : isRare ? C.gold : C.muted,
                  }}
                >
                  {pts}
                </span>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={s.controls}>
          <button style={s.secondaryBtn} onClick={handleClear} disabled={selected.length === 0}>
            <RotateCcw size={13} /> Clear
          </button>
          <button style={s.secondaryBtn} onClick={handleShuffle}>
            <Shuffle size={13} /> Shuffle
          </button>
          <button
            style={{
              ...s.btn,
              background: C.accent,
              opacity: selected.length < 3 ? 0.45 : 1,
            }}
            onClick={handleSubmit}
          >
            <Zap size={15} /> Forge
          </button>
          {mode === 'relaxed' && (
            <button
              style={{ ...s.btn, background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
              onClick={endGame}
            >
              Done <ChevronRight size={15} />
            </button>
          )}
        </div>

        {/* Found Words */}
        {foundWords.length > 0 && (
          <div ref={wordListRef} style={s.wordList}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              Forged Words ({foundWords.length})
            </div>
            <div>
              {foundWords.map(w => (
                <span key={w} style={{ ...s.wordChip, color: C.success }}>
                  {w}
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 500 }}>
                    {foundWordScores[w]}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timer bar (timed mode only) */}
        {mode === 'timed' && (
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              height: 4,
              background: C.border,
              borderRadius: 999,
              overflow: 'hidden',
              marginTop: 'auto',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: timer <= 10 ? C.error : C.accent,
                borderRadius: 999,
                transition: 'width 1s linear, background 0.3s ease',
              }}
            />
          </div>
        )}
      </div>

      {/* VFX particles */}
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  );
}
