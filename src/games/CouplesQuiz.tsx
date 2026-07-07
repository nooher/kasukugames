import React, { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, Heart, ChevronRight, Lock, Eye, Check, X, RotateCcw, Star, Crown, Sparkles, Shuffle, MessageCircle, Map, Flame, HelpCircle, Compass } from 'lucide-react';
import { COLOR, RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxReveal, sfxGameOver } from '../lib/sfx';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#080c12',
  card: '#151d2b',
  border: '#1c2940',
  text: '#e8edf5',
  muted: '#8494a7',
  dim: '#4a5d75',
  rose: COLOR.rose,
  emerald: COLOR.emerald,
  sapphire: COLOR.sapphire,
  violet: COLOR.violet,
  amber: COLOR.amber,
  teal: COLOR.teal,
  gold: COLOR.gold,
  coral: COLOR.coral,
} as const;

const glass = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
};

const PARTNER_COLORS = [C.rose, C.sapphire] as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Category = 'love_language' | 'memories' | 'preferences' | 'dreams' | 'intimacy' | 'hypothetical' | 'deep';

interface Question {
  q: string;
  options: string[];
}

type Phase = 'setup' | 'category' | 'pass-answer' | 'answering' | 'pass-guess' | 'guessing' | 'reveal' | 'results';

interface PartnerState {
  name: string;
  score: number;
  correctGuesses: number;
  streak: number;
  bestStreak: number;
  categoryCorrect: Record<Category, number>;
  categoryTotal: Record<Category, number>;
}

interface RoundData {
  category: Category;
  questionIndex: number;
  answererIdx: number;
  answer: number | null;
  guess: number | null;
}

/* ------------------------------------------------------------------ */
/*  Category metadata                                                  */
/* ------------------------------------------------------------------ */
const CATEGORY_META: Record<Category, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  love_language: { label: 'Love Language', color: C.rose, icon: <Heart size={18} />, desc: 'How you show and receive love, gestures, acts of service' },
  memories: { label: 'Memories', color: C.amber, icon: <Map size={18} />, desc: 'First dates, favorite trips, embarrassing moments, milestones' },
  preferences: { label: 'Preferences', color: C.sapphire, icon: <Star size={18} />, desc: 'Food, music, movies, ideal weekends, dream vacations' },
  dreams: { label: 'Dreams', color: C.teal, icon: <Compass size={18} />, desc: 'Future plans, career goals, bucket list, family planning' },
  intimacy: { label: 'Intimacy', color: C.coral, icon: <Flame size={18} />, desc: 'Desires, fantasies, physical preferences, bedroom chemistry' },
  hypothetical: { label: 'Hypothetical', color: C.emerald, icon: <HelpCircle size={18} />, desc: 'What-if scenarios about the relationship' },
  deep: { label: 'Deep', color: C.violet, icon: <MessageCircle size={18} />, desc: 'Fears, insecurities, childhood, values, dealbreakers' },
};

const emptyCategoryCounts = (): Record<Category, number> => ({
  love_language: 0, memories: 0, preferences: 0, dreams: 0,
  intimacy: 0, hypothetical: 0, deep: 0,
});

/* ------------------------------------------------------------------ */
/*  Question bank (280+ questions)                                     */
/* ------------------------------------------------------------------ */
const QUESTIONS: Record<Category, Question[]> = {
  love_language: [
    { q: "How does your partner prefer to receive love?", options: ["Words of affirmation and compliments", "Physical touch and closeness", "Quality time and undivided attention", "Acts of service and doing things for them"] },
    { q: "What gesture from you makes your partner feel most loved?", options: ["Writing them a heartfelt message", "Holding them close without a word", "Dropping everything to spend the day together", "Handling a chore they hate without being asked"] },
    { q: "When your partner is stressed, what do they need most from you?", options: ["To hear that they are doing great and you believe in them", "A long hug or their hand held", "You sitting with them, fully present", "You quietly taking something off their plate"] },
    { q: "How does your partner show you they love you day to day?", options: ["They tell you, in texts or out loud, often", "They reach for your hand or lean into you", "They carve out time just for the two of you", "They do small helpful things before you ask"] },
    { q: "What love language does your partner wish you spoke more fluently?", options: ["Verbal appreciation and encouragement", "More physical affection throughout the day", "More present, phone-down quality time", "More proactive helping and anticipating needs"] },
    { q: "How does your partner react when they feel unloved?", options: ["They get quiet and withdraw emotionally", "They become physically distant and cold", "They pick fights over unrelated things", "They start doing everything themselves resentfully"] },
    { q: "What gift would mean the most to your partner?", options: ["A handwritten love letter recounting your memories", "Something wearable that keeps you close to them", "A surprise trip with just the two of you", "Something practical that makes their life easier"] },
    { q: "What kind of compliment affects your partner the deepest?", options: ["About their character and who they are as a person", "About their physical appearance and attractiveness", "About how they make your life better by being in it", "About their competence and how capable they are"] },
    { q: "How important is physical touch to your partner?", options: ["Essential -- they need it to feel connected", "Very important but they can go a while without it", "Nice but not their primary need", "They can take it or leave it honestly"] },
    { q: "What does a perfect evening with you look like to your partner?", options: ["Deep conversation over dinner, phones away", "Cuddled on the couch, no agenda", "Out doing something new and exciting together", "You cooking for them while they relax"] },
    { q: "How does your partner feel about surprise romantic gestures?", options: ["Loves them deeply, the more surprise the better", "Appreciates them but prefers consistent daily love", "A little uncomfortable with grand gestures", "Prefers you ask what they want instead of guessing"] },
    { q: "When your partner is sick, what do they want from you?", options: ["Constant verbal check-ins and sweet words", "To be held and physically comforted", "You staying home and being near them all day", "You bringing soup, medicine, running errands"] },
    { q: "What is your partner's apology language?", options: ["They need to hear 'I am sorry' with sincerity", "They need a hug or physical reconnection", "They need you to make time to talk it through", "They need you to fix the thing that went wrong"] },
    { q: "How does your partner signal that they need attention?", options: ["They start talking more and trying to engage you", "They get physically clingy or touchy", "They suggest doing something together", "They seem restless or start doing things around you"] },
    { q: "What recurring small act of love matters most to your partner?", options: ["A good morning or goodnight text every single day", "A kiss before leaving the house, always", "Eating dinner together without distractions", "Making the coffee or handling their morning routine"] },
    { q: "How does your partner prefer to celebrate your anniversary?", options: ["Exchanging heartfelt letters or gifts with meaning", "Staying in and being physically close all day", "Going somewhere special together, just the two of you", "You planning and handling every detail as a surprise"] },
    { q: "What makes your partner feel most taken for granted?", options: ["When you stop saying sweet things to them", "When physical intimacy becomes routine or absent", "When you are always distracted or elsewhere mentally", "When they do everything and you do not notice"] },
    { q: "How does your partner respond to public displays of affection?", options: ["Loves it, hold me in front of everyone", "Prefers subtle PDA like hand-holding", "Gets uncomfortable with it in public", "Depends on their mood and setting"] },
    { q: "When your partner feels most in love with you, what triggered it?", options: ["Something incredibly kind you said", "A moment of physical closeness that felt electric", "An experience you shared that bonded you", "You doing something selfless they did not expect"] },
    { q: "What is the one thing your partner says you could do more of?", options: ["Express how you feel about them more vocally", "Initiate physical affection more often", "Be more present and less distracted", "Help more without needing to be asked"] },
    { q: "How does your partner feel when you plan something special for them?", options: ["Deeply moved and verbally expressive about it", "Shows it through closeness and physical warmth", "Feels truly seen and connected to you", "Feels relieved and cared for, like a weight is lifted"] },
    { q: "What is your partner's biggest complaint about your love language?", options: ["You do not say enough sweet things", "You are not physically affectionate enough", "You are always busy and do not make enough time", "You do not pitch in enough without being told"] },
    { q: "What kind of date night recharges your partner?", options: ["One with deep, meaningful conversation", "One with lots of physical closeness and warmth", "One doing a fun shared activity together", "One where you handle all the planning and logistics"] },
    { q: "How does your partner express gratitude?", options: ["With words -- they tell you thank you and why it mattered", "With touch -- they hug you or kiss you", "By reciprocating with quality time together", "By doing something thoughtful for you in return"] },
    { q: "What ruins a romantic moment for your partner fastest?", options: ["You saying something dismissive or careless", "You pulling away physically or seeming cold", "You checking your phone or being mentally elsewhere", "A practical issue crashing in that nobody handled"] },
    { q: "How does your partner want to be comforted after a bad day?", options: ["Hearing you validate their feelings and build them up", "Being physically held with no need to talk", "Having you sit with them and just be together", "You handling dinner, cleanup, everything so they can rest"] },
    { q: "What is your partner's ideal way to say goodbye before a trip?", options: ["A long emotional message or phone call", "A tight embrace that neither wants to end", "Spending the entire last day together doing nothing", "Them finding that you packed their bag with notes and snacks"] },
    { q: "How does your partner deal with feeling disconnected from you?", options: ["They bring it up and want to talk about it", "They try to initiate physical closeness", "They suggest a date or activity together", "They get productive and handle things alone but seem off"] },
    { q: "What would your partner consider the most romantic thing you have done?", options: ["Something you said that they still remember word for word", "A moment of physical intimacy that took their breath away", "A trip or experience that was just the two of you", "A time you went above and beyond to make their life easier"] },
    { q: "What is the love language your partner least connects with?", options: ["Verbal affirmations feel empty to them", "Physical touch feels performative sometimes", "Quality time feels forced when scheduled", "Acts of service feel transactional to them"] },
    { q: "How does your partner want to start each morning ideally?", options: ["With sweet words or a loving text from you", "Wrapped up together in bed for a few extra minutes", "Sharing coffee and conversation before the day starts", "You having handled something so their morning is smooth"] },
    { q: "When is your partner most vulnerable with you?", options: ["When they open up with words about what they are feeling", "When they reach for you silently and hold on tight", "During late-night talks when it is just the two of you", "When they let you take care of them without resisting"] },
    { q: "What is the smallest thing you do that makes your partner smile?", options: ["Calling them by a nickname or saying something sweet randomly", "Reaching for their hand or touching their back gently", "Looking up from your phone and giving them your full focus", "Refilling their water, charging their phone, tiny helpful acts"] },
    { q: "What type of romantic movie scene makes your partner melt?", options: ["The big declaration of love in front of everyone", "The slow, charged physical reunion scene", "Two people choosing each other quietly over everything else", "One partner sacrificing to take care of the other"] },
    { q: "If your partner could redesign your relationship habit, what would change?", options: ["More daily verbal affection, unprompted", "More spontaneous physical affection", "More uninterrupted time together each week", "More equal effort in daily responsibilities"] },
    { q: "What does your partner think is your strongest love language?", options: ["You are great with words when you try", "You are naturally physically affectionate", "You are good at showing up and being present", "You are reliable and always handle things"] },
    { q: "How does your partner want you to react when they accomplish something?", options: ["Celebrate them loudly with words and hype", "A huge proud hug or physical celebration", "Plan something special to mark the occasion together", "Quietly handle the logistics so they can enjoy the win"] },
    { q: "What would your partner trade everything else for in the relationship?", options: ["Hearing 'I love you' and knowing you mean it", "Feeling physically desired and wanted", "Genuine quality time without distractions", "Knowing you will always show up and carry your weight"] },
    { q: "How does your partner feel about love notes?", options: ["They would melt -- they keep every one", "Nice but they prefer a hug to a note", "Sweet but they would rather you spend time with them", "They value the gesture of you doing something practical more"] },
    { q: "When your partner daydreams about the relationship at its best, what does it look like?", options: ["Both of you verbally adoring each other effortlessly", "Constant easy physical affection and closeness", "Adventures and experiences you share only with each other", "A well-run life where both partners carry equal weight joyfully"] },
  ],

  memories: [
    { q: "What is your partner's favorite memory of your first date?", options: ["A specific thing one of you said", "The nervous energy and first physical contact", "The place and what you did together", "Something unexpected that happened and made it memorable"] },
    { q: "What was your partner's first impression of you?", options: ["They thought you were attractive but intimidating", "They thought you were funny and easy to talk to", "They were not sure about you at first", "They were immediately drawn to you, almost annoyingly so"] },
    { q: "What moment does your partner consider the turning point of the relationship?", options: ["When one of you first said I love you", "The first time you were physically intimate", "A trip or experience that bonded you deeply", "A difficult moment you navigated together"] },
    { q: "What is the most embarrassing thing your partner has done in front of you?", options: ["Said something they immediately wanted to take back", "Had a physical mishap like tripping or spilling", "Got overly emotional in an unexpected moment", "Got caught doing something silly they thought you did not see"] },
    { q: "What trip together does your partner consider the best you have taken?", options: ["One that was spontaneous and unplanned", "One that was meticulously planned and perfect", "One where something went wrong but it became a great story", "A simple weekend getaway that felt like an escape"] },
    { q: "What is the hardest moment your relationship has survived?", options: ["A major fight that almost ended things", "A period of distance or disconnection", "An external crisis that tested you both", "A betrayal of trust that you worked through"] },
    { q: "What song does your partner associate with your relationship?", options: ["A song that was playing during a key moment", "A song you danced to or listened to together", "A song that describes how they feel about you", "They do not really have one specific song"] },
    { q: "What is the funniest thing that has happened to you as a couple?", options: ["A miscommunication that became a legendary story", "Something that happened during travel", "An awkward encounter with someone else", "Something that happened in private that only you know about"] },
    { q: "What does your partner remember about the first time they met your family?", options: ["They were terrified and it shows in photos", "They felt surprisingly welcomed and comfortable", "Something awkward happened that they still cringe about", "They tried so hard to impress it was almost comical"] },
    { q: "What holiday together does your partner cherish most?", options: ["The first holiday you celebrated together", "One where you started a tradition of your own", "One where a gift or gesture was deeply meaningful", "One that was low-key but felt perfectly right"] },
    { q: "What is the worst date you two have ever been on?", options: ["The food or venue was terrible", "One of you was in a bad mood the whole time", "Something awkward happened with other people", "It was boring and neither of you will admit it"] },
    { q: "What does your partner consider the most romantic thing you have done?", options: ["A handwritten letter or thoughtful message", "A surprise trip or experience you planned secretly", "A small unexpected gesture on a random day", "Something you did during a difficult time that showed commitment"] },
    { q: "What is your partner's favorite mundane memory of your relationship?", options: ["A lazy morning in bed with no plans", "Cooking together and making a mess", "A long drive or walk where you just talked", "Grocery shopping or running errands that felt like an adventure"] },
    { q: "When did your partner first realize they were in love with you?", options: ["During a specific conversation that changed everything", "During an intimate moment that felt different from others", "During a trip or experience together", "When you did something for them they did not expect"] },
    { q: "What is the biggest surprise your partner has pulled off for you?", options: ["A surprise party or gathering with friends and family", "A spontaneous trip or getaway", "A gift they spent months thinking about", "They are not really the surprise type"] },
    { q: "What argument does your partner still bring up?", options: ["One where they were right and you admitted it", "One that was so ridiculous it became a joke", "One that actually hurt and took time to heal", "They do not hold onto arguments, they let things go"] },
    { q: "What milestone in your relationship means the most to your partner?", options: ["The first time you said I love you", "Moving in together or making it official", "Surviving a major challenge together", "A quiet moment that symbolized commitment"] },
    { q: "What childhood memory has your partner shared with you that they rarely tell others?", options: ["Something funny from their family life", "Something painful that shaped who they are", "A dream or ambition they had as a child", "A secret or mischief they got into"] },
    { q: "What is your partner's favorite photo of the two of you?", options: ["One from a trip or special occasion", "A candid one where you both look genuinely happy", "One from early in the relationship", "A silly or unflattering one that makes them laugh"] },
    { q: "What moment does your partner say they knew you were 'the one'?", options: ["A grand romantic moment", "A quiet ordinary moment that felt extraordinary", "A moment of crisis where you stepped up", "They are still figuring that out honestly"] },
    { q: "What is the most adventurous thing you have done together?", options: ["Traveled somewhere neither of you had been", "Tried an extreme activity or sport", "Made a major life decision spontaneously", "Something in the bedroom that was new for both of you"] },
    { q: "What restaurant or place holds the most memories for your partner?", options: ["Where you had your first date", "A place you go to regularly that feels like yours", "A place from a special trip or celebration", "A place that no longer exists but they still talk about"] },
    { q: "What is the longest you two have been apart and how did your partner handle it?", options: ["They were fine and independent about it", "They struggled and told you constantly", "They busied themselves but clearly missed you", "They were surprisingly emotional about it"] },
    { q: "What is the most thoughtful thing your partner has done for your birthday?", options: ["A gift that showed they truly listen to you", "An experience or trip planned around your interests", "A surprise involving people you love", "Something small but deeply personal"] },
    { q: "What is a memory your partner has of your relationship that you have forgotten?", options: ["Something sweet you said early on", "A small date or outing you do not remember", "A way you comforted them during a hard time", "Something funny you did that they still laugh about"] },
    { q: "What season does your partner associate with falling in love with you?", options: ["Spring or summer, everything felt warm and new", "Autumn, cozy and intimate", "Winter, close and bundled together", "They do not think about it seasonally"] },
    { q: "What is the biggest sacrifice your partner has made for the relationship?", options: ["Career or job change to be together", "Moving to a new city or place", "Letting go of a friendship or family expectation", "Changing a core habit or lifestyle for you"] },
    { q: "What is the story your partner tells most about you to other people?", options: ["How you met -- they embellish it every time", "Something hilarious you did", "Something romantic or sweet you did", "Something that shows your character and values"] },
    { q: "What do you wish you could relive together?", options: ["The early dating butterflies", "A specific trip or adventure", "A milestone celebration", "A simple perfect day you both remember"] },
    { q: "What fight early in the relationship does your partner laugh about now?", options: ["Something about texting habits or communication", "Something about jealousy or insecurity", "Something about a misunderstanding that was ridiculous", "They do not laugh about early fights, they were serious"] },
    { q: "What was the moment your partner told their friends about you?", options: ["After the first date because they were excited", "After a few weeks when it started getting serious", "They waited a long time because they are private", "Their friends figured it out before being told"] },
    { q: "What couple tradition does your partner value the most?", options: ["A regular date night or weekly ritual", "An annual trip or celebration", "A daily routine like coffee or bedtime", "Inside jokes and shared language"] },
    { q: "What is the worst gift you have given your partner?", options: ["Something generic that showed no thought", "Something they specifically did not want", "Forgetting an occasion entirely", "Something well-intentioned that completely missed the mark"] },
    { q: "What moment made your partner proudest to be with you?", options: ["Watching you succeed professionally or personally", "How you treated someone else with kindness", "Standing up for something important", "How you handled a tough situation with grace"] },
    { q: "What is the most spontaneous thing you have done as a couple?", options: ["Packed a bag and left for a trip with no plan", "Made a major life decision on a whim", "Tried something completely outside both your comfort zones", "Had an unexpected adventure that started from nothing"] },
    { q: "What is your partner's favorite thing about your morning routine together?", options: ["The first words or greeting of the day", "The physical closeness before getting up", "Having coffee or breakfast together quietly", "The comfortable silence that does not need filling"] },
    { q: "What moment in the relationship scared your partner the most?", options: ["A health scare involving one of you", "A fight where they thought it might be over", "A period where feelings felt unequal", "An external threat to the relationship from someone else"] },
    { q: "What does your partner wish they had a photo of from your time together?", options: ["A specific spontaneous moment that was never captured", "The exact moment they fell in love", "A trip or event where no one took pictures", "A quiet private moment that was too perfect to interrupt"] },
    { q: "What is the longest road trip you have taken together?", options: ["Under 4 hours, you keep it simple", "A full day drive with lots of stops", "A multi-day road trip with a destination", "You have never done a proper road trip together yet"] },
    { q: "What concert, show, or event was the best you attended together?", options: ["A live music performance that was electric", "A sporting event where the energy was incredible", "A quiet show like theater or comedy", "A festival or multi-day event"] },
  ],

  preferences: [
    { q: "What is your partner's ideal lazy weekend?", options: ["Sleeping in, cooking brunch, movies all day", "Getting outside -- hike, beach, or park", "A social weekend with friends or family", "A productive weekend, errands and projects done"] },
    { q: "What cuisine does your partner crave the most?", options: ["Italian -- pasta, pizza, comfort", "Asian -- sushi, ramen, Thai", "Mexican -- tacos, burritos, spice", "Home cooking -- whatever reminds them of childhood"] },
    { q: "What music does your partner play when they are in the best mood?", options: ["Upbeat pop or dance music", "R&B, soul, or smooth vibes", "Hip-hop or rap", "Rock, indie, or alternative"] },
    { q: "What kind of movie does your partner want to watch on date night?", options: ["A romantic comedy or love story", "A thriller or mystery that keeps them guessing", "A drama with depth and great acting", "An action or adventure film"] },
    { q: "What is your partner's dream vacation?", options: ["A tropical beach with nothing to do", "A European city tour with history and culture", "An adventure trip -- safari, mountains, diving", "A cozy cabin or cottage somewhere remote"] },
    { q: "How does your partner feel about mornings?", options: ["They are a natural early riser who loves them", "They can do mornings but need coffee first", "They are not a morning person at all", "It depends entirely on what is happening that day"] },
    { q: "What is your partner's comfort food?", options: ["Something warm and savory like soup or stew", "Something sweet like ice cream or chocolate", "Something carb-heavy like bread, pasta, or pizza", "Something from their cultural background or childhood"] },
    { q: "What is your partner's biggest pet peeve?", options: ["Being late or other people being late", "Rudeness or disrespect toward others", "Messiness or disorganization", "Loud chewing or annoying sounds"] },
    { q: "How does your partner prefer to exercise?", options: ["Running, walking, or solo cardio", "Gym, weights, and structured workouts", "Team sports or group fitness", "They actively avoid exercise"] },
    { q: "What is your partner's go-to drink?", options: ["Coffee, they cannot function without it", "Tea, simple and comforting", "Something cold -- smoothie, juice, iced coffee", "Water, they are surprisingly disciplined about it"] },
    { q: "What kind of books does your partner prefer?", options: ["Fiction that pulls you into another world", "Self-improvement and growth books", "True stories, biographies, or memoirs", "They do not read much honestly"] },
    { q: "How does your partner feel about social media?", options: ["They post regularly and enjoy it", "They scroll but rarely post", "They think it is mostly toxic or a waste of time", "They are indifferent, take it or leave it"] },
    { q: "What is your partner's ideal home decor style?", options: ["Modern and minimalist, clean lines", "Warm and cozy with lots of texture", "Eclectic and collected, full of personality", "Practical, they do not care much about decor"] },
    { q: "What type of weather makes your partner happiest?", options: ["Hot and sunny, beach weather", "Cool and crisp, sweater weather", "Rainy, cozy-inside weather", "Snowy, winter wonderland weather"] },
    { q: "What is your partner's favorite way to spend money?", options: ["On food and dining experiences", "On travel and new experiences", "On clothing, accessories, or personal items", "They are a saver who avoids spending"] },
    { q: "What app does your partner spend the most time on?", options: ["A social media platform", "A streaming service", "A messaging app", "A game or utility app"] },
    { q: "How does your partner feel about cooking?", options: ["They love it, it is a genuine hobby", "They can cook and enjoy it sometimes", "They tolerate it but prefer eating out", "They avoid cooking whenever possible"] },
    { q: "What is your partner's ideal party?", options: ["A big energetic gathering with dancing", "A chill house party with good music", "A small dinner party with close friends", "They would rather not go to parties"] },
    { q: "What kind of car does your partner dream of?", options: ["A sleek sports car or luxury sedan", "A practical reliable SUV or crossover", "A classic vintage car with character", "They do not care about cars at all"] },
    { q: "How does your partner feel about surprises in general?", options: ["Loves all surprises unconditionally", "Likes good surprises but hates unexpected changes", "Prefers to know what is coming", "They say they like surprises but actually do not"] },
    { q: "What is your partner's guilty pleasure TV show?", options: ["A reality dating or competition show", "A cheesy drama or soap opera", "True crime documentaries or podcasts", "They do not have guilty pleasures, they own everything they watch"] },
    { q: "How does your partner like their eggs?", options: ["Scrambled, simple and easy", "Over easy or sunny side up", "Omelette with everything in it", "They do not like eggs"] },
    { q: "What is your partner's favorite season?", options: ["Summer -- warmth, freedom, energy", "Autumn -- cozy, beautiful, comforting", "Winter -- holidays, intimacy, quiet", "Spring -- renewal, optimism, fresh starts"] },
    { q: "What scent does your partner love the most?", options: ["Something fresh and clean like laundry or ocean breeze", "Something warm like vanilla, cinnamon, or wood", "Something floral or botanical", "Your scent, specifically"] },
    { q: "How does your partner feel about pets?", options: ["Dog person through and through", "Cat person, low maintenance love", "Loves all animals and wants many", "Prefers not to have pets"] },
    { q: "What is your partner's biggest daily indulgence?", options: ["Their morning coffee or tea ritual", "Scrolling through their phone in bed", "A sweet treat or snack they have every day", "A long shower or personal grooming routine"] },
    { q: "What skill does your partner wish they had?", options: ["Playing a musical instrument", "Speaking another language fluently", "Being a great cook or baker", "Having artistic ability, drawing or painting"] },
    { q: "How does your partner take compliments?", options: ["They deflect and get awkward", "They accept gracefully and say thank you", "They return a compliment immediately", "It depends on who is giving the compliment"] },
    { q: "What is your partner's preferred vacation pace?", options: ["Packed itinerary, see and do everything", "Relaxed with a few planned activities", "Completely unstructured, go with the flow", "A balance of both planned and spontaneous"] },
    { q: "What restaurant type does your partner prefer for a special occasion?", options: ["Fine dining with a tasting menu", "A trendy spot that is hard to get into", "A casual favorite with sentimental value", "Homemade dinner at home is more special to them"] },
    { q: "What is your partner's hidden talent?", options: ["They can sing better than anyone expects", "They are surprisingly good at a sport or physical activity", "They have a creative talent like writing or art", "They are shockingly good at fixing or building things"] },
    { q: "How does your partner handle being bored?", options: ["They scroll endlessly on their phone", "They find a project or task to do", "They reach out to people and socialize", "They nap or zone out and recharge"] },
    { q: "What type of humor does your partner have?", options: ["Dry and sarcastic wit", "Silly and goofy, loves physical comedy", "Dark and edgy, nothing is off limits", "Wholesome and punny, keep it light"] },
    { q: "What is your partner's stance on tattoos?", options: ["They have them or want more", "They appreciate them but would never get one", "They are indifferent about tattoos", "They do not find them attractive"] },
    { q: "How does your partner handle being wrong?", options: ["They admit it fairly quickly", "They resist at first but come around", "They double down before eventually conceding", "They rarely think they are wrong"] },
    { q: "What is your partner's nighttime routine?", options: ["They crash immediately, asleep in minutes", "A full routine -- skincare, reading, wind-down", "They scroll their phone until they pass out", "They toss and turn, often a restless sleeper"] },
    { q: "How does your partner feel about flying?", options: ["They love it, window seat always", "They tolerate it, it is just transportation", "They get nervous but deal with it", "They genuinely hate flying"] },
    { q: "What is your partner's ideal birthday celebration?", options: ["A big party with everyone they love", "A quiet dinner with their closest people", "A solo day of self-care and relaxation", "They do not like making a big deal of their birthday"] },
    { q: "What does your partner order at a coffee shop?", options: ["A strong, no-nonsense espresso or black coffee", "A fancy latte or flavored drink", "Tea, they are not a coffee person", "Something cold and blended regardless of the weather"] },
    { q: "How does your partner feel about karaoke?", options: ["They love it and will sing anything", "They need liquid courage first but then they are in", "They enjoy watching but will not participate", "They actively avoid karaoke"] },
  ],

  dreams: [
    { q: "Where does your partner see themselves in ten years?", options: ["Settled with a family and stable career", "Traveling and experiencing the world", "Having built something of their own -- a business or project", "Honestly, they are not sure and that sometimes worries them"] },
    { q: "What is your partner's dream career if money did not matter?", options: ["Something creative -- art, music, writing, film", "Something that helps people -- medicine, teaching, nonprofit", "Something adventurous -- travel, exploration, sports", "Something entrepreneurial -- their own business or brand"] },
    { q: "How many children does your partner want?", options: ["None, they do not want children", "One, focused attention on a single child", "Two or three, a full household", "They are genuinely undecided about it"] },
    { q: "What is on your partner's bucket list?", options: ["A specific travel destination they have always dreamed of", "A physical challenge like a marathon or skydiving", "A creative achievement like writing a book or album", "A life milestone like owning a home or starting a business"] },
    { q: "Where would your partner live if they could live anywhere?", options: ["A warm coastal city near the beach", "A major world city like London, Tokyo, or New York", "A quiet countryside or small town", "Back in their hometown, close to family"] },
    { q: "What does your partner's dream home look like?", options: ["Modern and sleek with big windows and clean lines", "Warm and traditional with character and history", "A beachfront or waterfront property", "A farmhouse or homestead with land and space"] },
    { q: "What does your partner want to be remembered for?", options: ["Being kind and making people feel valued", "Achieving something remarkable in their field", "Being an amazing partner and parent", "Creating something that outlasts them"] },
    { q: "What is your partner's biggest professional ambition?", options: ["Reaching the top of their industry or field", "Having the freedom and flexibility to work on their terms", "Making enough money to never worry about finances", "Doing work that has genuine impact and meaning"] },
    { q: "How does your partner feel about retirement?", options: ["They want to retire early and enjoy life", "They will probably work forever because they enjoy it", "They dream of a specific retirement lifestyle", "They try not to think about it too much"] },
    { q: "What legacy does your partner want to leave behind?", options: ["A family that is close, healthy, and thriving", "Professional or creative work that matters", "Financial security and generational wealth", "Having made the world slightly better than they found it"] },
    { q: "What country does your partner most want to visit?", options: ["Japan -- for the culture, food, and beauty", "Italy -- for the romance, history, and cuisine", "An African country -- for the landscapes and heritage", "Somewhere in South America -- for the energy and nature"] },
    { q: "What does your partner dream about doing together?", options: ["Building a home together from scratch", "Traveling to a dozen countries together", "Starting a business or project as a team", "Growing old together in a place you both love"] },
    { q: "What skill does your partner want to learn next?", options: ["A new language they have been wanting to speak", "A creative skill like photography, cooking, or music", "A professional skill that would advance their career", "A physical skill like surfing, martial arts, or dance"] },
    { q: "How does your partner feel about the idea of starting a business?", options: ["It is a serious goal they think about often", "Interesting but too risky for their comfort", "They would do it with the right idea and partner", "Not for them, they prefer the security of a job"] },
    { q: "What does your partner's ideal daily life look like in the future?", options: ["Wake up without an alarm, work on what they love, end the day together", "A structured productive day with clear purpose and routine", "Maximum flexibility -- travel, work remotely, adventure", "A simple life focused on family, health, and community"] },
    { q: "What is the biggest risk your partner wants to take?", options: ["A major career change or leap of faith", "Moving to a new country or city", "Starting a business or creative project", "They are risk-averse and prefer stability"] },
    { q: "What kind of parent does your partner want to be?", options: ["The fun one who gives their kids the best experiences", "The strict but loving one with strong values", "The supportive one who lets their kids find their own way", "They do not want children or have not thought about it yet"] },
    { q: "Where does your partner see the relationship going?", options: ["Marriage and a life fully built together", "A deep committed partnership, maybe not traditional marriage", "They are taking it one day at a time", "They know what they want but are afraid to say it out loud"] },
    { q: "What is a dream your partner has given up on?", options: ["A creative dream they decided was not practical", "A travel or adventure dream that life got in the way of", "A career path they abandoned for something safer", "They have not given up on any of them yet"] },
    { q: "How does your partner want to spend their golden years?", options: ["Traveling the world without rush or agenda", "Near family, being a doting grandparent", "Pursuing hobbies and passions they never had time for", "In a warm place, simple life, zero stress"] },
    { q: "What achievement would make your partner feel like they made it?", options: ["Financial freedom, never worrying about money again", "Being recognized in their field as one of the best", "Having a happy, healthy family", "Completing a creative or personal project that matters deeply to them"] },
    { q: "What does your partner fear most about the future?", options: ["Not achieving what they want in time", "Losing people they love", "Being stuck in a life that does not fulfill them", "The uncertainty of it all"] },
    { q: "What kind of wedding does your partner dream of?", options: ["A big beautiful celebration with everyone they love", "A small intimate ceremony with just close family", "An elopement somewhere breathtaking", "They do not care about weddings much"] },
    { q: "If your partner could master anything instantly, what would it be?", options: ["A musical instrument at concert level", "Every language in the world", "Financial investing and wealth building", "A specific sport or physical discipline"] },
    { q: "What does your partner value more -- time or money?", options: ["Time, without question", "Money, it provides security and freedom", "It depends on the season of life", "They want both and refuse to choose"] },
    { q: "What is your partner's dream role in the community?", options: ["A mentor or teacher who shapes young minds", "A leader who creates change and progress", "A quiet contributor who helps behind the scenes", "They prefer to focus on their own circle"] },
    { q: "What hobby does your partner want to pick up?", options: ["Something outdoorsy like gardening, hiking, or fishing", "Something creative like painting, pottery, or music", "Something active like martial arts, dance, or climbing", "Something intellectual like chess, writing, or investing"] },
    { q: "How does your partner imagine spending a year off?", options: ["Traveling to every continent", "Working on a passion project full time", "Resting and recovering from burnout", "Learning and studying something new deeply"] },
    { q: "What cause does your partner care most about?", options: ["Education and opportunity for young people", "Health and wellness access for all", "Environmental protection and sustainability", "Social justice and equality"] },
    { q: "What does your partner think is the key to a lasting relationship?", options: ["Honest communication above everything else", "Never losing physical and emotional attraction", "Growing together instead of apart", "Mutual respect and maintaining individuality"] },
    { q: "What does your partner secretly wish you two would plan together?", options: ["A big international trip", "A major life decision like buying property", "A creative project or adventure", "Starting a family or expanding your family"] },
    { q: "What age does your partner want to retire?", options: ["As early as possible, 40s or earlier", "Traditional retirement age, around 60", "They never want to fully retire", "They have not really thought about it concretely"] },
    { q: "What does your partner consider the purpose of life?", options: ["Connection and love with others", "Growth, learning, and becoming your best self", "Experiencing as much as possible", "Leaving a positive mark on the world"] },
    { q: "What does your partner dream about late at night?", options: ["Financial freedom and the life it would bring", "A creative breakthrough or recognition", "A perfectly balanced happy family life", "Something they have never told you about"] },
    { q: "If your partner won the lottery tomorrow, what is the first thing they would do?", options: ["Pay off debts and set up financial security", "Book a trip to somewhere they have always wanted to go", "Quit their job immediately", "Buy or build their dream home"] },
    { q: "What scares your partner about getting older?", options: ["Losing their health or physical ability", "Running out of time to do everything they want", "Watching the people they love age and change", "Becoming irrelevant or forgotten"] },
    { q: "What tradition does your partner want to start for the future?", options: ["An annual trip to somewhere new each year", "A weekly ritual like Sunday dinners or movie nights", "A family tradition to pass down to children", "A personal tradition like a yearly reflection or journal"] },
    { q: "What would make your partner drop everything and start over?", options: ["A job opportunity in a dream field or location", "A calling to pursue a passion they have been ignoring", "A life event that reshuffles their priorities", "Nothing, they are committed to the path they are on"] },
    { q: "How does your partner define success?", options: ["Freedom -- doing what they want, when they want", "Impact -- knowing their work matters", "Family -- a happy home and healthy relationships", "Achievement -- reaching the top of their goals"] },
    { q: "What is the one thing your partner would build if they had unlimited resources?", options: ["A school, hospital, or community center", "A dream home that is an architectural masterpiece", "A company or platform that changes an industry", "A foundation or charity for a cause they believe in"] },
  ],

  intimacy: [
    { q: "What is your partner's biggest turn-on?", options: ["Confidence and someone who takes charge", "Slow build-up with teasing and anticipation", "Emotional connection and deep eye contact", "Physical attributes and raw attraction"] },
    { q: "Where does your partner most like to be touched?", options: ["Their neck and collarbone area", "Their lower back and waist", "Their inner thighs", "Their face, hair, and behind their ears"] },
    { q: "What time of day does your partner feel most in the mood?", options: ["Morning, they wake up ready", "Late at night when everything is quiet", "Afternoon or spontaneous midday moments", "It is unpredictable, depends entirely on the vibe"] },
    { q: "How does your partner prefer intimacy to start?", options: ["Slowly, with kissing and buildup over time", "Directly, they like when you make it obvious you want them", "Playfully, with teasing and flirting first", "Emotionally, after a deep conversation or connection moment"] },
    { q: "What does your partner wish you did more of in bed?", options: ["More vocal appreciation and talking during", "More eye contact and emotional presence", "More variety and willingness to try new things", "More foreplay and taking your time"] },
    { q: "What is your partner's favorite position?", options: ["Something face to face where they can see you", "Something from behind where they can feel intensity", "Something where they are in control on top", "They like switching and do not have one favorite"] },
    { q: "How important is physical intimacy to your partner in the relationship?", options: ["Extremely -- it is how they feel most connected", "Very important but they can go stretches without it", "Important but secondary to emotional connection", "It matters less to them than most people would think"] },
    { q: "What fantasy has your partner hinted at but never fully expressed?", options: ["Something involving a new location or setting", "Something involving role play or power dynamics", "Something involving adding sensory elements like restraints or blindfolds", "Something they are too shy to put into words"] },
    { q: "How does your partner feel about talking during intimacy?", options: ["They love it -- the dirtier the talk the better", "They like some verbal connection but keep it romantic", "They prefer sounds and reactions over actual words", "They are mostly quiet and prefer physical expression"] },
    { q: "What kind of lingerie or outfit would your partner find most attractive on you?", options: ["Something classic and elegant, lace or silk", "Something bold and revealing that shows confidence", "Something simple and understated, less is more", "They honestly prefer you in nothing at all"] },
    { q: "What does your partner do that tells you they want to be intimate?", options: ["They start with intentional physical touch and closeness", "They verbally flirt or say something suggestive", "They create the mood with setting, music, or lighting", "They give you a specific look that you both understand"] },
    { q: "How does your partner feel about spontaneous versus planned intimacy?", options: ["Spontaneous is far more exciting to them", "They like the anticipation of knowing it is going to happen", "A mix of both keeps things interesting", "They need to be mentally prepared, so planned is better"] },
    { q: "What part of your body is your partner most attracted to?", options: ["Your face and eyes", "Your hands and arms", "Your chest or torso", "Your backside or legs"] },
    { q: "How does your partner feel after being intimate?", options: ["Cuddly and wanting to talk and be close", "Sleepy and ready to drift off", "Energized and wide awake", "Hungry, they always want food after"] },
    { q: "What would your partner say is the best intimate experience you have shared?", options: ["A time that was slow, emotional, and deeply connected", "A time that was intense, passionate, and physical", "A time that was new, adventurous, and exciting", "A time that was spontaneous and unexpected"] },
    { q: "How does your partner feel about sexting or sending intimate messages?", options: ["They love it and initiate it regularly", "They enjoy receiving but rarely initiate", "They find it awkward and prefer in person", "They are into it only in certain moods"] },
    { q: "What aspect of your physical relationship does your partner value most?", options: ["The emotional closeness it creates between you", "The physical pleasure and chemistry", "The sense of being desired and wanted", "The variety and exploration of trying new things"] },
    { q: "What is a boundary your partner has that they have been clear about?", options: ["Certain acts that are off limits for them", "Needing to feel emotionally safe before being physical", "Not being okay with anything involving other people", "Needing control over pace and timing"] },
    { q: "How adventurous is your partner in the bedroom?", options: ["Very -- they are always open to trying something new", "Moderately -- open to suggestions but has clear limits", "Conservative -- they prefer what they know and like", "It has evolved over time and they are more open now than before"] },
    { q: "What does your partner need to feel desired?", options: ["You initiating intimacy, not always them", "Physical compliments about their body", "Your full attention and presence when you are together", "Actions that show you are thinking about them sexually"] },
    { q: "How long does your partner prefer intimate sessions to last?", options: ["Quick and intense, quality over quantity of time", "A solid 30 minutes to an hour of connection", "As long as possible, they want it to be an event", "It depends entirely on the mood and energy level"] },
    { q: "What scent or cologne on you drives your partner wild?", options: ["A specific cologne or perfume you wear", "Your natural scent, especially after a shower", "Something woodsy, musky, or warm", "They have never specifically mentioned one"] },
    { q: "How does your partner feel about morning intimacy?", options: ["It is their absolute favorite time", "Open to it but need a few minutes to wake up first", "Not ideal, they prefer later in the day", "Depends on whether there is time pressure"] },
    { q: "What role does kissing play for your partner during intimacy?", options: ["Essential -- they cannot be intimate without deep kissing", "Important at the start but they get lost in other things", "A nice addition but not the main event for them", "They wish there was more kissing throughout"] },
    { q: "What is the most sensitive non-obvious spot on your partner's body?", options: ["Their earlobes or behind their ears", "The nape of their neck", "Their hip bones or lower stomach", "The inside of their wrists or forearms"] },
    { q: "How does your partner feel about incorporating music during intimacy?", options: ["They love it, it sets the mood perfectly", "They are indifferent, it does not make or break it", "They find it distracting", "They have a specific playlist for it"] },
    { q: "What kind of touch does your partner find most arousing?", options: ["Light, teasing touches that build anticipation", "Firm, confident touches that show desire", "Slow, full-body contact with no rush", "A mix -- they like when it escalates from gentle to intense"] },
    { q: "How does your partner feel about complimenting each other's bodies?", options: ["They crave it and it makes them feel confident", "They appreciate it but can get shy about it", "They think actions speak louder than words about attraction", "They are uncomfortable with explicit body compliments"] },
    { q: "What would your partner say is missing from your physical relationship?", options: ["More frequency and initiation from you", "More variety, adventure, and trying new things", "More emotional depth and connection during", "More communication about what they want and need"] },
    { q: "How does your partner recover after a dry spell in your relationship?", options: ["They address it directly and want to talk about it", "They initiate physically to break the tension", "They get moody and it affects other areas of the relationship", "They wait for you to notice and bring it up"] },
    { q: "What is your partner's biggest physical insecurity during intimacy?", options: ["A specific body part they are self-conscious about", "Their performance or ability to please you", "How they look in certain positions or lighting", "They are actually quite confident and not very insecure"] },
    { q: "How does alcohol affect your partner's desire for intimacy?", options: ["It lowers their inhibitions and makes them more forward", "It makes them affectionate but not necessarily more intimate", "It has little to no effect on their desire", "It actually makes them less interested"] },
    { q: "What does your partner consider the most intimate act beyond the physical?", options: ["Looking into each other's eyes during vulnerable moments", "Sleeping naked together without any agenda", "Showering or bathing together", "Sharing a fantasy or desire they have never told anyone"] },
    { q: "How does your partner like to be woken up for intimacy?", options: ["Gentle touches and kisses that build slowly", "They would rather be fully awake first, do not wake them for it", "They love being surprised and woken up that way", "It has never happened or they have no preference"] },
    { q: "What does your partner wish you knew about their body that you have not figured out yet?", options: ["A spot or technique that really works for them", "That pace and rhythm matter more than intensity", "That they need more warm-up time than you think", "They think you actually know their body pretty well"] },
    { q: "How does your partner prefer the atmosphere for intimacy?", options: ["Dark or very dim lighting", "Candlelight or soft warm lighting", "Natural light, they do not mind being seen", "They do not care about the setting, just the connection"] },
    { q: "What is your partner's favorite way to initiate?", options: ["A slow escalation from cuddling to more", "A direct verbal statement that they want you", "Coming out of the shower or getting dressed in front of you", "A look, a touch, something non-verbal but unmistakable"] },
    { q: "How does your partner feel about leaving marks or being marked?", options: ["They love it, it is a visible sign of passion", "They are okay with it in hidden places only", "They prefer not to, it makes them uncomfortable", "They have never expressed a preference either way"] },
    { q: "What does your partner consider the ultimate intimate gesture?", options: ["Giving you complete vulnerability and trust in the moment", "Making sure you finish and prioritizing your pleasure", "Trying something new because you asked, even if they are nervous", "The aftercare -- holding each other and being close after"] },
    { q: "How does stress affect your partner's desire for intimacy?", options: ["Stress kills their desire almost completely", "Stress actually increases their need for physical connection", "It has no consistent effect, depends on the type of stress", "They use intimacy as a way to de-stress and reset"] },
  ],

  hypothetical: [
    { q: "If you had to move to a new country together, where would your partner choose?", options: ["Somewhere warm with beaches and relaxed culture", "Somewhere in Europe with history and charm", "Somewhere in Asia with food and culture", "Somewhere close to home, they would not want to go far"] },
    { q: "If your partner could relive one year of your relationship, which would they pick?", options: ["The very first year, the excitement and discovery", "The year where you grew the most as a couple", "A year with a memorable trip or milestone", "The current year, they want to be more present this time"] },
    { q: "If your partner had to choose between their dream job abroad or staying with you, what would they do?", options: ["Take the job and ask you to come", "Stay, the relationship matters more", "Try long distance and see if it works", "It would depend on where the relationship is at that moment"] },
    { q: "If you could only communicate through one method forever, what would your partner choose?", options: ["In person, face to face always", "Phone calls, they need to hear your voice", "Texting, they express themselves better in writing", "Video calls, the best of both worlds"] },
    { q: "If your partner discovered you kept a secret from them, how would they react?", options: ["Hurt but they would want to understand before reacting", "Angry and it would take time to rebuild trust", "Disappointed but forgiving if the reason was good", "It depends entirely on what the secret was"] },
    { q: "If your partner could change one thing about the relationship, what would it be?", options: ["More quality time together", "Better communication during disagreements", "More spontaneity and adventure", "More physical intimacy and connection"] },
    { q: "If you two had to run a business together, what role would your partner take?", options: ["The visionary and big-picture strategist", "The operations and details person", "The public-facing, sales and people person", "They would never run a business with a partner, too risky for the relationship"] },
    { q: "If your partner could get the honest answer to one question about you, what would they ask?", options: ["What do you really think about our future?", "Is there anything you have not told me?", "What is the one thing you would change about me?", "Am I really the person you want to be with forever?"] },
    { q: "If your partner could go back to before you met and give themselves advice, what would they say?", options: ["Be patient, the right one is coming", "Do not change yourself trying to be what they want", "Enjoy the early days more, they go fast", "Say how you feel sooner, do not wait so long"] },
    { q: "If you had to face a major crisis together, what would your partner's role be?", options: ["The calm rational planner who takes charge", "The emotional support who keeps morale up", "The researcher who gathers information and options", "The one who panics initially but comes through when it counts"] },
    { q: "If your partner could design your perfect date, what would it include?", options: ["Good food, candlelight, and deep conversation", "An outdoor adventure followed by cozy time at home", "A surprise they planned with hidden details you discover", "Something completely new neither of you has done before"] },
    { q: "If your partner had to sacrifice one of your shared hobbies, which would go?", options: ["Watching shows together, they can do that alone", "Dining out, they would cook at home instead", "Social events with friends, more alone time is fine", "Exercise or physical activities together, they would go solo"] },
    { q: "If your partner could live in any era with you, which would they choose?", options: ["The 1920s with jazz, glamour, and romance", "The 1960s with freedom, change, and music", "The distant future with technology and space travel", "Right now, they would not trade the present"] },
    { q: "If your partner found out you were reading their journal, how would they react?", options: ["Furious, that is a massive violation of privacy", "Hurt but curious about what you learned", "Uncomfortable but would try to talk it through", "They would not care much, they are an open book"] },
    { q: "If you could only keep one shared possession, what would your partner choose?", options: ["Photos and memories documented together", "A piece of jewelry or meaningful gift from you", "Your home or living space", "A pet, if you have one"] },
    { q: "If your partner won an all-expenses-paid trip for two, where would they take you?", options: ["The Maldives or Bora Bora, pure paradise", "A European tour -- Paris, Rome, Barcelona", "Japan for the food, culture, and experience", "An African safari, once in a lifetime adventure"] },
    { q: "If your partner could swap one personality trait with you, which would they want?", options: ["Your patience or calmness", "Your confidence or social ease", "Your ambition or work ethic", "Your humor or ability to make people comfortable"] },
    { q: "If your partner had to choose one of your friends to be stranded on an island with, who would they pick?", options: ["Your funniest friend for entertainment", "Your most capable and practical friend for survival", "Your calmest friend who would not cause drama", "None, they would rather be stranded alone or with you"] },
    { q: "If you and your partner had to create a new tradition, what would they suggest?", options: ["An annual trip to a new destination", "A weekly date night that is sacred and unbreakable", "Writing each other letters on special occasions", "A monthly challenge or adventure you do together"] },
    { q: "If your partner could delete one argument from your history, which type would it be?", options: ["A jealousy or trust argument", "A money or financial argument", "A family or in-law argument", "A silly argument that escalated for no reason"] },
    { q: "If your relationship had a theme song, what genre would your partner choose?", options: ["An R&B slow jam, smooth and intimate", "An indie folk song, warm and authentic", "A classic love ballad, timeless and grand", "A pop song, fun and full of energy"] },
    { q: "If your partner could have a superpower that only worked in the relationship, what would they pick?", options: ["Mind reading, to always know what you need", "Teleportation, to always be with you instantly", "Time freezing, to make the best moments last forever", "Healing, to fix any hurt or pain between you immediately"] },
    { q: "If you had unlimited money for one home renovation, what would your partner prioritize?", options: ["The kitchen, the heart of the home", "The bedroom, making it a luxury retreat", "The bathroom, spa-level upgrade", "An outdoor space, garden, pool, or patio"] },
    { q: "If your partner could plan your proposal or re-proposal, what would it look like?", options: ["Something grand and public, a real spectacle", "Something private and intimate, just the two of you", "Something involving family and friends for a surprise", "Something adventurous in a stunning location"] },
    { q: "If your partner had to describe your relationship in one word, what would it be?", options: ["Passionate", "Comfortable", "Growing", "Unpredictable"] },
    { q: "If your partner could guarantee one thing about your future together, what would it be?", options: ["That you will always communicate honestly", "That the physical attraction will never fade", "That you will always choose each other", "That you will achieve your shared dreams together"] },
    { q: "If your partner could erase one of your bad habits, which would go?", options: ["Your phone usage and screen time around them", "Your temper or how you handle frustration", "Your tendency to avoid difficult conversations", "A lifestyle habit they wish you would change"] },
    { q: "If a movie was made about your relationship, what genre would your partner say it is?", options: ["A romantic comedy with real heart", "A drama with incredible highs and lows", "An adventure film full of unexpected twists", "A documentary, their relationship is that real and raw"] },
    { q: "If your partner could have one do-over in your relationship, what would it be?", options: ["How they handled a specific argument or conflict", "Something they said that they cannot take back", "A time they were not there when they should have been", "They would not change anything, it all led to where you are"] },
    { q: "If you were both 80 years old looking back, what would your partner say mattered most?", options: ["The everyday moments, not the milestones", "The way you made each other feel safe and loved", "The adventures and experiences you shared", "That you stayed together through everything"] },
    { q: "If your partner could have dinner with any couple in history, who would they choose?", options: ["A legendary love story like Johnny and June Cash", "A power couple like the Obamas", "A literary or artistic pair like Frida and Diego", "Their own grandparents or parents at their age"] },
    { q: "If your partner could freeze one moment in your relationship forever, what type of moment?", options: ["A moment of pure joy and laughter together", "A deeply intimate and private moment", "A milestone moment like an engagement or move-in", "A quiet ordinary moment that felt perfect"] },
    { q: "If your partner had to teach a class about relationships, what would the first lesson be?", options: ["Communication is the foundation of everything", "You have to maintain individual identity within a couple", "Physical intimacy requires ongoing effort and attention", "Choose someone who makes the hard days better, not just the good ones"] },
    { q: "If you both had to live on a farm for a year, how would your partner handle it?", options: ["Thrive and discover they love the simple life", "Adapt but miss city conveniences constantly", "Struggle at first but find their rhythm", "Absolutely hate it and count the days"] },
    { q: "If your partner could telepathically know one thing you think about them, what would they want to know?", options: ["What you honestly think is most attractive about them", "How you feel about the future together", "What you think about during intimate moments", "Whether you ever have doubts about the relationship"] },
    { q: "If your partner could create a rule for the relationship, what would it be?", options: ["No going to bed angry, always resolve before sleep", "No phones during meals or quality time", "A mandatory weekly check-in about how the relationship is going", "Always say what you mean, no passive aggression ever"] },
    { q: "If your partner could make one insecurity disappear from the relationship, what would it be?", options: ["Worry about whether you find them attractive enough", "Fear that you might grow apart over time", "Anxiety about being compared to your past partners", "Concern about whether you are truly happy"] },
    { q: "If your partner could have a conversation with your ex, what would they want to know?", options: ["What you were like in that relationship", "Why it ended from the other person's perspective", "Nothing, they have zero interest in your past relationships", "Something specific they have always wondered about"] },
    { q: "If you could only take three things to a deserted island together, what would your partner pick?", options: ["Practical survival items, they are strategic", "Comfort items that remind them of home", "A mix of practical and sentimental things", "They would panic and forget to pack anything useful"] },
    { q: "If your partner could add one room to your home, what would it be?", options: ["A library or reading nook", "A home theater or entertainment room", "A walk-in closet or dressing room", "A home gym or wellness space"] },
  ],

  deep: [
    { q: "What is your partner's deepest fear about the relationship?", options: ["That it will end and they will be alone", "That they will lose themselves trying to make it work", "That the love will fade into routine and boredom", "That they are not enough for you"] },
    { q: "What childhood experience shaped who your partner is today?", options: ["The dynamics of their parents' relationship", "A loss or hardship they experienced young", "Being raised in a specific cultural or religious way", "A moment of success or failure that defined their confidence"] },
    { q: "What does your partner consider their biggest flaw?", options: ["They are too controlling or rigid", "They are too emotional or sensitive", "They shut down and avoid conflict", "They put others' needs before their own to a fault"] },
    { q: "What is the one thing your partner would change about their childhood?", options: ["Having more stability and security at home", "Having a closer relationship with a parent or sibling", "Being allowed to express themselves more freely", "Having more confidence and less self-doubt"] },
    { q: "What keeps your partner up at night?", options: ["Worry about the future and whether they are on the right path", "Replaying conversations or conflicts that went wrong", "Fear of losing someone they love", "Anxiety about finances or career stability"] },
    { q: "What value does your partner refuse to compromise on?", options: ["Honesty, even when it is painful", "Loyalty, they expect total faithfulness", "Independence, they need their own identity", "Kindness, how you treat others is everything"] },
    { q: "What is your partner's attachment style in relationships?", options: ["Anxious, they need reassurance and closeness", "Avoidant, they pull back when things get intense", "Secure, they are generally balanced and steady", "It shifts depending on the relationship dynamic"] },
    { q: "What is the hardest truth your partner has had to accept about themselves?", options: ["That they repeat patterns they swore they would break", "That they are not as tough or independent as they pretend", "That they sometimes push people away when they need them most", "That they settle for less than they deserve because they fear being alone"] },
    { q: "What does your partner need from you that they struggle to ask for?", options: ["More verbal reassurance that you love them", "More physical affection without it leading to anything else", "More patience when they are struggling", "More independence without it meaning you love them less"] },
    { q: "What relationship from your partner's past still affects them?", options: ["A parent relationship that was complicated or painful", "A romantic relationship that ended badly", "A friendship that was lost or betrayed", "A family dynamic that shaped their trust issues"] },
    { q: "What is the mask your partner wears that most people do not see through?", options: ["The happy or positive mask when they are actually struggling", "The tough or independent mask when they actually need help", "The easygoing mask when they actually have strong opinions", "The busy or productive mask when they are actually avoidant"] },
    { q: "What is your partner's biggest regret in life so far?", options: ["Not taking a risk when the opportunity was there", "How they treated someone who did not deserve it", "Time wasted on something that did not matter", "Not being honest with themselves sooner about what they wanted"] },
    { q: "What does your partner think is the biggest threat to your relationship?", options: ["Growing apart as individuals over time", "Poor communication during hard times", "External pressures like work, family, or money", "Taking each other for granted and losing the spark"] },
    { q: "What would your partner say is their love blind spot?", options: ["They idealize partners and ignore red flags", "They give too much and then resent it later", "They mistake intensity for love", "They struggle to be vulnerable even when they should be"] },
    { q: "What emotion does your partner suppress the most?", options: ["Anger, they internalize it until it explodes", "Sadness, they hide it behind humor or productivity", "Fear, they pretend to be braver than they are", "Jealousy, they feel it but would never admit to it"] },
    { q: "What family dynamic does your partner not want to repeat?", options: ["Their parents' communication patterns", "How conflict was handled or avoided growing up", "The emotional distance between family members", "The way love was conditional on performance or behavior"] },
    { q: "What is your partner's relationship with their own body?", options: ["Generally positive, they feel comfortable in their skin", "Complicated, it shifts between confidence and insecurity", "Difficult, they are often self-critical about it", "Improving, they have done a lot of work to accept themselves"] },
    { q: "What is the most painful thing you have said to your partner?", options: ["Something about their character that cut deep", "Something you said in anger that you did not mean", "Something dismissive when they needed you to care", "They would say nothing, that you are always kind"] },
    { q: "What childhood dream did your partner give up?", options: ["A career or creative aspiration they once had", "A fantasy about what adulthood would look like", "A dream about the kind of family they would have", "They are still holding onto their childhood dreams"] },
    { q: "How does your partner handle grief?", options: ["They withdraw and process alone quietly", "They lean into loved ones and need closeness", "They stay busy and productive to avoid the pain", "They feel it deeply but rarely show it outwardly"] },
    { q: "What dealbreaker would end the relationship for your partner instantly?", options: ["Infidelity, physical or emotional", "Lying about something fundamental", "Disrespecting their family or values", "Any form of control or manipulation"] },
    { q: "What insecurity does your partner have that you can help heal?", options: ["Feeling not attractive enough or desired enough", "Feeling not smart or accomplished enough", "Feeling like a burden when they need support", "Feeling like they are hard to love or too much"] },
    { q: "What does your partner think happens after death?", options: ["Something spiritual, an afterlife or continuation", "Nothing, consciousness simply ends", "They are genuinely uncertain and it scares them", "They try not to think about it at all"] },
    { q: "What political or social issue does your partner feel most strongly about?", options: ["Equality and justice for marginalized groups", "Economic opportunity and fair systems", "Education and empowering the next generation", "Environmental protection and sustainability"] },
    { q: "What is the hardest conversation your partner has been avoiding?", options: ["A conversation with a family member about something unresolved", "A conversation about the future of your relationship", "A conversation about something they need to change about themselves", "A conversation with a friend about a growing distance between them"] },
    { q: "What does your partner think is the meaning of life?", options: ["Love and connection with the people who matter most", "Growth, constantly becoming a better version of yourself", "Making a difference and leaving the world better", "Finding joy and peace in the present moment"] },
    { q: "What triggers your partner's anxiety the most?", options: ["Uncertainty about the future", "Feeling out of control of a situation", "Social situations or being judged by others", "Health concerns, theirs or someone they love"] },
    { q: "What part of their identity does your partner feel most protective of?", options: ["Their cultural or ethnic background", "Their intellectual abilities and knowledge", "Their independence and self-sufficiency", "Their role as a partner, friend, or family member"] },
    { q: "What is the loneliest your partner has ever felt?", options: ["During a period of being single and isolated", "While in a relationship where they felt unseen", "After losing someone important to them", "During a transition like moving, graduating, or changing jobs"] },
    { q: "What does your partner need to hear from you that they have never asked for?", options: ["That you are proud of them and who they are becoming", "That you find them physically beautiful and desirable", "That you are not going anywhere, no matter what", "That it is okay for them to not be strong all the time"] },
    { q: "What is your partner's moral gray area?", options: ["They believe some lies are necessary to protect people", "They think rules are meant to be bent when the cause is right", "They struggle with the line between self-interest and generosity", "They hold grudges even when they know forgiveness is healthier"] },
    { q: "What is the bravest thing your partner has ever done?", options: ["Left something safe to pursue something uncertain", "Was vulnerable with someone at great emotional risk", "Stood up for someone or something when it was hard", "Faced a personal fear or challenge head-on"] },
    { q: "What does your partner wish their parents understood about them?", options: ["That the path they chose is valid even if it is different", "That they need emotional support, not just practical support", "That they are an adult and want to be treated as an equal", "That some wounds from childhood still affect them today"] },
    { q: "What makes your partner feel most alive?", options: ["Moments of connection and being truly seen by another person", "Moments of achievement and proving themselves", "Moments of freedom and spontaneity with no obligations", "Moments of creativity and self-expression"] },
    { q: "What does your partner think is their greatest strength?", options: ["Their resilience and ability to keep going through anything", "Their empathy and ability to understand others deeply", "Their intelligence and ability to figure things out", "Their loyalty and willingness to show up for the people they love"] },
    { q: "What is the one thing your partner is most afraid to lose?", options: ["You and this relationship", "Their health or physical ability", "A family member or close friend", "Their sense of self and identity"] },
    { q: "What conversation between you two changed the relationship the most?", options: ["A defining-the-relationship conversation that set expectations", "A fight that forced you both to grow up and communicate better", "A vulnerable late-night talk where walls came down", "A practical conversation about the future that aligned you both"] },
    { q: "What does your partner think is the biggest misconception people have about them?", options: ["That they are tougher or more confident than they actually are", "That they are simpler or less deep than they really are", "That they do not care as much as they actually do", "That they have it all together when they are actually struggling"] },
    { q: "What unresolved wound does your partner carry from a past relationship?", options: ["Being cheated on or betrayed", "Being made to feel not good enough", "Being left without explanation or closure", "Being controlled or having their identity suppressed"] },
    { q: "What does your partner think the world needs more of?", options: ["Genuine kindness and compassion between people", "Honesty and transparency in all systems", "Opportunity and fairness for everyone", "Patience and understanding across differences"] },
  ],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL_ROUNDS = 20;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

export default function CouplesQuiz({ onBack, onGameEnd }: Props) {
  const startTime = useRef(Date.now());

  /* -- state -- */
  const [phase, setPhase] = useState<Phase>('setup');
  const [partners, setPartners] = useState<[PartnerState, PartnerState]>([
    { name: '', score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
    { name: '', score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
  ]);
  const [, setSelectedCategory] = useState<Category | null>(null);
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [questionCursor, setQuestionCursor] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [round, setRound] = useState<RoundData>({ category: 'love_language', questionIndex: 0, answererIdx: 0, answer: null, guess: null });
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const [revealAnim, setRevealAnim] = useState(false);
  const [, setCategoryMode] = useState<'choose' | 'random'>('choose');
  const [roundCategories, setRoundCategories] = useState<Category[]>([]);

  const currentQuestion = questionPool[questionCursor] || null;

  /* -- name helpers -- */
  const setName = (idx: 0 | 1, name: string) => {
    setPartners(p => {
      const copy: [PartnerState, PartnerState] = [{ ...p[0] }, { ...p[1] }];
      copy[idx] = { ...copy[idx], name };
      return copy;
    });
  };
  const canStart = partners[0].name.trim().length > 0 && partners[1].name.trim().length > 0;

  /* -- build question pool from selected categories or all -- */
  const buildPool = (mode: 'choose' | 'random'): { pool: Question[]; cats: Category[] } => {
    const allCats = Object.keys(QUESTIONS) as Category[];
    if (mode === 'random') {
      const cats: Category[] = [];
      const pool: Question[] = [];
      const shuffledCats = shuffle(allCats);
      let catIdx = 0;
      for (let i = 0; i < TOTAL_ROUNDS; i++) {
        const cat = shuffledCats[catIdx % shuffledCats.length];
        cats.push(cat);
        catIdx++;
      }
      // Build a pool per category, shuffled
      const perCat: Record<Category, Question[]> = {} as Record<Category, Question[]>;
      for (const c of allCats) perCat[c] = shuffle(QUESTIONS[c]);
      const catCursors: Record<Category, number> = {} as Record<Category, number>;
      for (const c of allCats) catCursors[c] = 0;
      for (const cat of cats) {
        pool.push(perCat[cat][catCursors[cat] % perCat[cat].length]);
        catCursors[cat]++;
      }
      return { pool, cats };
    }
    return { pool: [], cats: [] };
  };

  /* -- start with random -- */
  const startRandom = () => {
    sfxTap();
    setCategoryMode('random');
    const { pool, cats } = buildPool('random');
    setQuestionPool(pool);
    setRoundCategories(cats);
    setQuestionCursor(0);
    setRoundsPlayed(0);
    setPartners(ps => [
      { ...ps[0], score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
      { ...ps[1], score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
    ]);
    const answerer = 0;
    setRound({ category: cats[0], questionIndex: 0, answererIdx: answerer, answer: null, guess: null });
    startTime.current = Date.now();
    setPhase('pass-answer');
  };

  /* -- start with specific category -- */
  const startCategory = (cat: Category) => {
    sfxTap();
    setCategoryMode('choose');
    setSelectedCategory(cat);
    const pool = shuffle(QUESTIONS[cat]);
    const cats = Array(TOTAL_ROUNDS).fill(cat) as Category[];
    setQuestionPool(pool);
    setRoundCategories(cats);
    setQuestionCursor(0);
    setRoundsPlayed(0);
    setPartners(ps => [
      { ...ps[0], score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
      { ...ps[1], score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
    ]);
    const answerer = 0;
    setRound({ category: cat, questionIndex: 0, answererIdx: answerer, answer: null, guess: null });
    startTime.current = Date.now();
    setPhase('pass-answer');
  };

  /* -- answerer picks -- */
  const pickAnswer = (optionIdx: number) => {
    sfxTap();
    setRound(r => ({ ...r, answer: optionIdx }));
    setPhase('pass-guess');
  };

  /* -- guesser guesses -- */
  const makeGuess = (optionIdx: number) => {
    sfxTap();
    setRound(r => ({ ...r, guess: optionIdx }));
    setTimeout(() => {
      sfxReveal();
      setRevealAnim(true);
      setPhase('reveal');
    }, 300);
  };

  /* -- process reveal scoring -- */
  useEffect(() => {
    if (phase !== 'reveal' || !revealAnim) return;
    const { answererIdx, answer, guess, category } = round;
    const guesserIdx = answererIdx === 0 ? 1 : 0;
    const isCorrect = answer === guess;

    setPartners(prev => {
      const copy: [PartnerState, PartnerState] = [{ ...prev[0] }, { ...prev[1] }];
      const guesser = { ...copy[guesserIdx] };
      guesser.categoryTotal = { ...guesser.categoryTotal, [category]: guesser.categoryTotal[category] + 1 };

      if (isCorrect) {
        sfxCorrect();
        const newStreak = guesser.streak + 1;
        let points = 10;
        if (newStreak >= 3) points += (newStreak - 2) * 2; // streak bonus
        guesser.score += points;
        guesser.correctGuesses++;
        guesser.streak = newStreak;
        guesser.bestStreak = Math.max(guesser.bestStreak, newStreak);
        guesser.categoryCorrect = { ...guesser.categoryCorrect, [category]: guesser.categoryCorrect[category] + 1 };
      } else {
        sfxWrong();
        guesser.streak = 0;
      }
      copy[guesserIdx] = guesser;
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealAnim]);

  /* -- fire onGameEnd -- */
  useEffect(() => {
    if (phase === 'results') {
      const totalScore = partners[0].score + partners[1].score;
      const totalCorrect = partners[0].correctGuesses + partners[1].correctGuesses;
      const accuracy = TOTAL_ROUNDS > 0 ? totalCorrect / TOTAL_ROUNDS : 0;
      sfxGameOver();
      onGameEnd?.({
        score: totalScore,
        accuracy,
        level: 1,
        maxScore: TOTAL_ROUNDS * 10,
        timeMs: Date.now() - startTime.current,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -- next round -- */
  const nextRound = () => {
    sfxTap();
    setRevealAnim(false);
    const newRoundsPlayed = roundsPlayed + 1;
    setRoundsPlayed(newRoundsPlayed);

    if (newRoundsPlayed >= TOTAL_ROUNDS) {
      setPhase('results');
      return;
    }

    const newCursor = questionCursor + 1;
    setQuestionCursor(newCursor);
    const nextAnswerer = round.answererIdx === 0 ? 1 : 0;
    const nextCat = roundCategories[newRoundsPlayed] || roundCategories[0];
    setRound({ category: nextCat, questionIndex: newRoundsPlayed, answererIdx: nextAnswerer, answer: null, guess: null });
    setPhase('pass-answer');
  };

  /* -- restart -- */
  const restart = () => {
    setPhase('setup');
    setPartners([
      { name: '', score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
      { name: '', score: 0, correctGuesses: 0, streak: 0, bestStreak: 0, categoryCorrect: emptyCategoryCounts(), categoryTotal: emptyCategoryCounts() },
    ]);
    setSelectedCategory(null);
    setQuestionPool([]);
    setQuestionCursor(0);
    setRoundsPlayed(0);
  };

  /* ---------------------------------------------------------------- */
  /*  Styles                                                           */
  /* ---------------------------------------------------------------- */
  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '20px',
    maxWidth: 520,
    margin: '0 auto',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  };

  const backBtnStyle: CSSProperties = {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: RADIUS.md,
    color: C.muted,
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${MOTION.fast}`,
  };

  const cardStyle = (accent?: string): CSSProperties => ({
    background: C.card,
    border: `1px solid ${accent ? accent + '30' : C.border}`,
    borderRadius: RADIUS.lg,
    padding: 20,
    ...glass,
    transition: `all ${MOTION.fast}`,
  });

  const inputStyle: CSSProperties = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: RADIUS.md,
    color: C.text,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: `border-color ${MOTION.fast}`,
  };

  const optionBtn = (color: string, selected: boolean, correct?: boolean, wrong?: boolean): CSSProperties => ({
    background: correct ? color + '25' : wrong ? C.rose + '15' : selected ? color + '20' : C.bg,
    border: `1.5px solid ${correct ? color : wrong ? C.rose + '60' : selected ? color + '60' : C.border}`,
    borderRadius: RADIUS.md,
    padding: '14px 16px',
    color: C.text,
    fontSize: 14,
    cursor: phase === 'reveal' ? 'default' : 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: `all ${MOTION.fast}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    ...glass,
  });

  const labelBadge = (color: string): CSSProperties => ({
    background: color + '20',
    color,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: RADIUS.full,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  });

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  /* ---- SETUP ---- */
  if (phase === 'setup') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Couples Quiz</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>How well do you really know your partner?</p>
          </div>
        </div>

        <div style={{ ...cardStyle(C.rose), marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Heart size={16} color={C.rose} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Partners</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {partners.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PARTNER_COLORS[i], flexShrink: 0 }} />
                <input
                  style={inputStyle}
                  placeholder={`Partner ${i + 1} name`}
                  value={p.name}
                  onChange={e => setName(i as 0 | 1, e.target.value)}
                  maxLength={16}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20, padding: 16 }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>HOW IT WORKS</div>
          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
            One partner answers a question about themselves secretly. The other guesses what they chose. Turns alternate -- {TOTAL_ROUNDS} rounds total. Score points for knowing each other well.
          </div>
        </div>

        <button
          style={{ ...solidBtn(C.rose), width: '100%', justifyContent: 'center', opacity: canStart ? 1 : 0.4, pointerEvents: canStart ? 'auto' : 'none', padding: '14px 24px', fontSize: 15 }}
          onClick={() => canStart && setPhase('category')}
        >
          Choose Category <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  /* ---- CATEGORY SELECT ---- */
  if (phase === 'category') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={() => setPhase('setup')}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Pick a Category</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{TOTAL_ROUNDS} rounds</p>
          </div>
        </div>

        <button
          style={{ ...cardStyle(C.gold), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', marginBottom: 16 }}
          onClick={startRandom}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: C.gold + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold, flexShrink: 0 }}>
            <Shuffle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Random Mix</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Questions from all categories</div>
          </div>
          <ChevronRight size={16} color={C.dim} />
        </button>

        <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 4 }}>
          Or choose a focus
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
            <button
              key={key}
              style={{ ...cardStyle(meta.color), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%' }}
              onClick={() => startCategory(key)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = meta.color + '50'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = meta.color + '30'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: meta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{meta.label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{meta.desc}</div>
              </div>
              <ChevronRight size={16} color={C.dim} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- PASS TO ANSWERER ---- */
  if (phase === 'pass-answer') {
    const answerer = partners[round.answererIdx];
    const answererColor = PARTNER_COLORS[round.answererIdx];
    const catMeta = CATEGORY_META[round.category];

    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: answererColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${answererColor}40` }}>
            <Lock size={36} color={answererColor} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Pass the phone to
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: answererColor }}>
              {answerer.name}
            </h2>
            <p style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>
              Answer the next question secretly
            </p>
            <div style={{ marginTop: 12 }}>
              <span style={labelBadge(catMeta.color)}>
                {catMeta.label}
              </span>
              <span style={{ ...labelBadge(C.dim), marginLeft: 6 }}>
                Round {roundsPlayed + 1}/{TOTAL_ROUNDS}
              </span>
            </div>
          </div>

          <button
            style={{ ...solidBtn(answererColor), padding: '14px 32px', fontSize: 15 }}
            onClick={() => { sfxTap(); setPhase('answering'); }}
          >
            I am Ready <Eye size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- ANSWERING ---- */
  if (phase === 'answering' && currentQuestion) {
    const answerer = partners[round.answererIdx];
    const answererColor = PARTNER_COLORS[round.answererIdx];
    const catMeta = CATEGORY_META[round.category];

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={restart}><ArrowLeft size={18} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Round {roundsPlayed + 1}/{TOTAL_ROUNDS}</span>
              <span style={labelBadge(catMeta.color)}>{catMeta.label}</span>
            </div>
          </div>
        </div>

        <div style={{ background: C.border, borderRadius: RADIUS.full, height: 4, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: C.rose, height: '100%', borderRadius: RADIUS.full, width: `${(roundsPlayed / TOTAL_ROUNDS) * 100}%`, transition: `width ${MOTION.med}` }} />
        </div>

        <div style={{ ...cardStyle(answererColor), marginBottom: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <Lock size={14} color={answererColor} />
            <span style={{ fontSize: 11, fontWeight: 600, color: answererColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {answerer.name} -- answer secretly
            </span>
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, margin: '12px 0 0' }}>{currentQuestion.q}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              style={optionBtn(answererColor, false)}
              onClick={() => pickAnswer(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: hoveredOption === i ? answererColor + '30' : C.bg, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0, transition: `all ${MOTION.fast}` }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- PASS TO GUESSER ---- */
  if (phase === 'pass-guess') {
    const guesserIdx = round.answererIdx === 0 ? 1 : 0;
    const guesser = partners[guesserIdx];
    const guesserColor = PARTNER_COLORS[guesserIdx];
    const answerer = partners[round.answererIdx];

    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: guesserColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${guesserColor}40` }}>
            <Heart size={36} color={guesserColor} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Pass the phone to
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: guesserColor }}>
              {guesser.name}
            </h2>
            <p style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>
              Guess what {answerer.name} chose
            </p>
          </div>

          <div style={{ fontSize: 12, color: C.dim }}>
            Do not peek until it is your turn.
          </div>

          <button
            style={{ ...solidBtn(guesserColor), padding: '14px 32px', fontSize: 15 }}
            onClick={() => { sfxTap(); setPhase('guessing'); }}
          >
            I am Ready <Eye size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- GUESSING ---- */
  if (phase === 'guessing' && currentQuestion) {
    const guesserIdx = round.answererIdx === 0 ? 1 : 0;
    const guesser = partners[guesserIdx];
    const guesserColor = PARTNER_COLORS[guesserIdx];
    const answerer = partners[round.answererIdx];
    const catMeta = CATEGORY_META[round.category];

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: guesserColor }} />
              <span style={{ fontWeight: 600, fontSize: 15, color: guesserColor }}>{guesser.name}'s Guess</span>
              <span style={labelBadge(catMeta.color)}>{catMeta.label}</span>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 4px' }}>What did {answerer.name} pick?</p>
          <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{currentQuestion.q}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              style={optionBtn(guesserColor, false)}
              onClick={() => makeGuess(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: hoveredOption === i ? guesserColor + '30' : C.bg, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0, transition: `all ${MOTION.fast}` }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- REVEAL ---- */
  if (phase === 'reveal' && currentQuestion) {
    const guesserIdx = round.answererIdx === 0 ? 1 : 0;
    const guesser = partners[guesserIdx];
    const answerer = partners[round.answererIdx];
    const guesserColor = PARTNER_COLORS[guesserIdx];
    const answererColor = PARTNER_COLORS[round.answererIdx];
    const correctIdx = round.answer!;
    const isCorrect = round.guess === correctIdx;

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>The Answer</span>
          </div>
        </div>

        <div style={{ ...cardStyle(answererColor), marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 8px' }}>{currentQuestion.q}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {currentQuestion.options.map((opt, i) => {
            const isThisCorrect = i === correctIdx;
            const isThisGuessed = i === round.guess;
            const wrongGuess = isThisGuessed && !isThisCorrect;

            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{
                  ...optionBtn(C.emerald, false, isThisCorrect, wrongGuess),
                  cursor: 'default',
                  animation: isThisCorrect && revealAnim ? 'cq-reveal-pulse 0.6s ease' : undefined,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: isThisCorrect ? C.emerald + '30' : wrongGuess ? C.rose + '30' : C.bg, border: `1.5px solid ${isThisCorrect ? C.emerald : wrongGuess ? C.rose : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isThisCorrect ? <Check size={14} color={C.emerald} /> : wrongGuess ? <X size={14} color={C.rose} /> : <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{String.fromCharCode(65 + i)}</span>}
                  </div>
                  <span style={{ flex: 1, fontWeight: isThisCorrect ? 600 : 400 }}>{opt}</span>
                  {isThisCorrect && <span style={labelBadge(C.emerald)}>{answerer.name}'s Answer</span>}
                  {wrongGuess && <span style={labelBadge(C.rose)}>{guesser.name}'s Guess</span>}
                  {isThisCorrect && isThisGuessed && <span style={{ ...labelBadge(guesserColor), marginLeft: 4 }}>{guesser.name}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...cardStyle(isCorrect ? C.emerald : C.rose), marginBottom: 20, textAlign: 'center' }}>
          {isCorrect ? (
            <>
              <Sparkles size={24} color={C.emerald} style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 600, fontSize: 16, color: C.emerald, marginBottom: 4 }}>
                {guesser.name} knows {answerer.name} well!
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.emerald }}>+{10 + (guesser.streak >= 3 ? (guesser.streak - 2) * 2 : 0)}</div>
              {guesser.streak >= 3 && (
                <div style={{ fontSize: 11, color: C.amber, marginTop: 4, fontWeight: 600 }}>
                  Streak x{guesser.streak} bonus!
                </div>
              )}
            </>
          ) : (
            <>
              <X size={24} color={C.rose} style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 600, fontSize: 16, color: C.rose, marginBottom: 4 }}>
                Not quite -- talk about this one later
              </div>
              <div style={{ fontSize: 13, color: C.dim }}>
                {answerer.name} surprised {guesser.name}
              </div>
            </>
          )}
        </div>

        <button
          style={{ ...solidBtn(C.rose), width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}
          onClick={nextRound}
        >
          {roundsPlayed + 1 >= TOTAL_ROUNDS ? 'See Results' : 'Next Round'} <ChevronRight size={16} />
        </button>

        <style>{`
          @keyframes cq-reveal-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px ${C.emerald}40; }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  /* ---- RESULTS ---- */
  if (phase === 'results') {
    const totalCorrect = partners[0].correctGuesses + partners[1].correctGuesses;
    const compatibility = Math.round((totalCorrect / TOTAL_ROUNDS) * 100);
    const sorted = [...partners].sort((a, b) => b.score - a.score);
    const allCats = Object.keys(CATEGORY_META) as Category[];

    // Category breakdown: combined
    const categoryBreakdown = allCats.map(cat => {
      const total = partners[0].categoryTotal[cat] + partners[1].categoryTotal[cat];
      const correct = partners[0].categoryCorrect[cat] + partners[1].categoryCorrect[cat];
      const pct = total > 0 ? Math.round((correct / total) * 100) : -1;
      return { cat, total, correct, pct };
    }).filter(c => c.total > 0).sort((a, b) => b.pct - a.pct);

    // Generate insight
    const bestCat = categoryBreakdown[0];
    const worstCat = categoryBreakdown[categoryBreakdown.length - 1];
    let insight = '';
    if (bestCat && worstCat && bestCat.cat !== worstCat.cat) {
      insight = `You know each other's ${CATEGORY_META[bestCat.cat].label.toLowerCase()} well${worstCat.pct < 50 ? ` but should talk more about ${CATEGORY_META[worstCat.cat].label.toLowerCase()}` : ''}.`;
    } else if (compatibility >= 80) {
      insight = 'You two are deeply in sync. Keep nurturing that connection.';
    } else if (compatibility >= 50) {
      insight = 'A solid foundation with room to explore each other more deeply.';
    } else {
      insight = 'There is so much still to discover about each other -- keep talking, keep asking.';
    }

    const compatLabel = compatibility >= 80 ? 'Soulmates' : compatibility >= 60 ? 'Strong Bond' : compatibility >= 40 ? 'Getting There' : 'Still Exploring';
    const compatColor = compatibility >= 80 ? C.emerald : compatibility >= 60 ? C.teal : compatibility >= 40 ? C.amber : C.rose;

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Results</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{TOTAL_ROUNDS} rounds</p>
          </div>
        </div>

        {/* Compatibility score */}
        <div style={{ ...cardStyle(compatColor), marginBottom: 16, textAlign: 'center' }}>
          <Heart size={28} color={compatColor} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: compatColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Compatibility Score
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: compatColor, lineHeight: 1 }}>
            {compatibility}%
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 6 }}>
            {compatLabel}
          </div>
          <div style={{ background: C.border, borderRadius: RADIUS.full, height: 6, overflow: 'hidden', margin: '12px 0 0' }}>
            <div style={{ height: '100%', borderRadius: RADIUS.full, width: `${compatibility}%`, background: compatColor, transition: `width ${MOTION.slow}` }} />
          </div>
        </div>

        {/* Individual scores */}
        <div style={{ ...cardStyle(), marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Individual Scores</div>
          {partners.map((p, i) => {
            const totalGuessed = p.categoryCorrect ? Object.values(p.categoryTotal).reduce((a, b) => a + b, 0) : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i === 0 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PARTNER_COLORS[i] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {p.correctGuesses}/{totalGuessed} correct
                    {p.bestStreak >= 3 && ` -- Best streak: ${p.bestStreak}`}
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 18, color: PARTNER_COLORS[i] }}>{p.score}</span>
              </div>
            );
          })}
        </div>

        {/* Winner badge */}
        {sorted[0].score > sorted[1].score && (
          <div style={{ ...cardStyle(C.gold), marginBottom: 16, textAlign: 'center', padding: 16 }}>
            <Crown size={24} color={C.gold} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Knows Their Partner Best
            </div>
            <div style={{ fontWeight: 600, fontSize: 18, color: C.gold }}>{sorted[0].name}</div>
          </div>
        )}

        {/* Category breakdown */}
        {categoryBreakdown.length > 1 && (
          <div style={{ ...cardStyle(), marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Category Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categoryBreakdown.map(({ cat, correct, total, pct }) => {
                const meta = CATEGORY_META[cat];
                const barColor = pct >= 70 ? C.emerald : pct >= 40 ? C.amber : C.rose;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: meta.color, display: 'flex', alignItems: 'center' }}>{meta.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>{correct}/{total}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: barColor, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                    </div>
                    <div style={{ background: C.border, borderRadius: RADIUS.full, height: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: RADIUS.full, width: `${pct}%`, background: barColor, transition: `width ${MOTION.slow}` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Insight */}
        <div style={{ ...cardStyle(C.violet), marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MessageCircle size={16} color={C.violet} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Relationship Insight</span>
          </div>
          <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.5 }}>{insight}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ ...solidBtn(C.dim), flex: 1, justifyContent: 'center', padding: '14px 24px' }}
            onClick={restart}
          >
            <RotateCcw size={16} /> New Game
          </button>
          <button
            style={{ ...solidBtn(C.rose), flex: 1, justifyContent: 'center', padding: '14px 24px' }}
            onClick={onBack}
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  return <div style={containerStyle}><p>Loading...</p></div>;
}
