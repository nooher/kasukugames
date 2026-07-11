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
  love_language: { label: 'Love Language', color: C.rose, icon: <Heart size={18} />, desc: 'How you show and receive love — words, physical touch, quality time, acts of service, and gifts' },
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
    { q: "What makes your partner feel cherished on an ordinary Tuesday?", options: ["A random text saying you were thinking of them", "A hug from behind while they are busy", "You putting your work down to check in on them", "You handling a small annoyance before they get to it"] },
    { q: "How does your partner most want to be greeted when you come home?", options: ["An excited hello and a genuine 'I missed you'", "A hug and a kiss before anything else", "You asking about their day and actually listening", "You noticing what needs doing and jumping in"] },
    { q: "What term of endearment does your partner love being called?", options: ["Something sweet like babe or love", "A private nickname only you two use", "Their actual name said with warmth", "They are not big on pet names honestly"] },
    { q: "When your partner is overwhelmed, what tiny gesture resets them?", options: ["You telling them it is going to be okay", "A back rub or their hand squeezed", "You sitting quietly beside them", "You making them tea and clearing their to-do list"] },
    { q: "What does your partner secretly wish you would notice without being told?", options: ["When they are fishing for reassurance", "When they want to be held but will not ask", "When they need your undivided attention", "When they are exhausted and need help"] },
    { q: "How does your partner like to be reassured during a disagreement?", options: ["Hearing that you still love them mid-argument", "A hand on their arm to stay connected", "You slowing down to really hear their side", "You showing you will fix your part of it"] },
    { q: "What kind of touch calms your partner the fastest?", options: ["Fingers running through their hair", "A firm, grounding hug", "Their hand held while you talk", "A gentle back rub at the end of the day"] },
    { q: "How does your partner most want support before a big event?", options: ["A pep talk telling them they will crush it", "A long hug and physical steadiness", "You being fully present and calming their nerves", "You handling the logistics so they can focus"] },
    { q: "What is the sweetest thing your partner has ever texted you?", options: ["A long message about how much you mean to them", "Something that made you want to rush home to them", "A note that you two should make time together soon", "A reminder they handled something so you would not worry"] },
    { q: "What makes your partner feel prioritized?", options: ["You choosing your words carefully around them", "You reaching for them first in a crowd", "You clearing your schedule for them", "You anticipating what they need before they say it"] },
    { q: "How does your partner want to reconnect after a busy week?", options: ["A long talk about everything you both missed", "A whole day of cuddling and closeness", "A dedicated date with no distractions", "You taking chores off their plate so they can breathe"] },
    { q: "What does your partner do when they are craving your affection?", options: ["They drop hints and fish for compliments", "They physically inch closer to you", "They ask if you want to do something together", "They start helping you as a way to be near you"] },
    { q: "What kind of praise lands hardest for your partner?", options: ["Being told they are a wonderful partner", "Being told how attractive you find them", "Being told you love spending time with them", "Being told how much they do for everyone"] },
    { q: "How does your partner want to be checked on during a hard week?", options: ["Frequent sweet messages throughout the day", "A hug the moment you see them", "You carving out real time to be present", "You quietly lightening their load"] },
    { q: "What is the first thing your partner wants after a fight is resolved?", options: ["To hear you say you love them again", "A long make-up hug", "To spend the rest of the day close together", "To see you follow through on what changed"] },
    { q: "How does your partner prefer to be encouraged when chasing a goal?", options: ["Words of belief and constant cheerleading", "A reassuring touch and physical presence", "You showing up to support them in person", "You clearing obstacles out of their way"] },
    { q: "What makes your partner feel emotionally safe with you?", options: ["You saying you are not going anywhere", "You holding them when they are vulnerable", "You giving them your full undistracted attention", "You proving through actions that you are reliable"] },
    { q: "What small daily ritual would mean the world to your partner?", options: ["A daily 'I love you' that never feels routine", "A kiss goodbye and hello every single time", "Ten minutes of real conversation each night", "Their coffee made exactly how they like it"] },
    { q: "How does your partner react to receiving a heartfelt compliment?", options: ["They light up and want to hear more", "They get shy and lean into you", "They remember it and bring it up later", "They say it means more when you show it"] },
    { q: "What does your partner miss most when you travel apart?", options: ["Your voice and the sweet things you say", "The physical closeness and cuddling", "Your company and just being around you", "The little things you handle that they now do alone"] },
    { q: "How does your partner want you to respond when they cry?", options: ["Soft reassuring words that they are not alone", "Just holding them without trying to fix it", "Sitting with them for as long as it takes", "Handling everything else so they can just feel it"] },
    { q: "What is your partner's favorite way you show up for them in public?", options: ["Bragging about them to others", "A hand on their back or holding hands", "Staying by their side and engaging with them", "Quietly making sure they have what they need"] },
    { q: "What makes your partner feel most connected on a quiet night in?", options: ["Talking for hours about anything", "Being tangled up together on the couch", "Doing a shared activity side by side", "You cooking for them while they unwind"] },
    { q: "How does your partner most want to feel appreciated for their efforts?", options: ["Being told out loud that you noticed", "A grateful hug or kiss", "You setting aside time to celebrate them", "You reciprocating without being asked"] },
    { q: "What does your partner want more of when they feel distant from you?", options: ["Verbal check-ins about where you both stand", "More physical affection to bridge the gap", "More intentional time together", "More shared effort in daily life"] },
    { q: "How does your partner like to fall asleep next to you?", options: ["After exchanging soft goodnight words", "Wrapped up in your arms", "After talking quietly in the dark", "Knowing you handled the tomorrow-morning things"] },
    { q: "What gesture from you would surprise your partner most in a good way?", options: ["An unexpected note listing why you love them", "Pulling them in for a slow dance in the kitchen", "Planning a surprise evening just for them", "Secretly finishing a task they have been dreading"] },
    { q: "How does your partner want to be loved when they are feeling insecure?", options: ["Direct reassurance about how you see them", "Being held and physically wanted", "Your patient, present attention", "You showing up consistently to prove it"] },
    { q: "What is your partner's favorite kind of good-morning?", options: ["A sweet text or whispered greeting", "A sleepy cuddle before the alarm", "Coffee and a slow chat in bed", "Waking up to find you already handled the morning chaos"] },
    { q: "How does your partner most feel your love during tough times?", options: ["When you keep telling them you believe in them", "When you physically stay close and steady", "When you refuse to leave their side", "When you carry the practical burden for them"] },
    { q: "What makes your partner feel truly seen by you?", options: ["You remembering the little things they mention", "You reading their body language without words", "You giving them your complete focus", "You acting on what they need before they ask"] },
    { q: "How does your partner want to celebrate a small personal win?", options: ["Loud enthusiastic praise from you", "A big celebratory hug", "Some quality time to mark the moment", "You handling everything so they can savor it"] },
    { q: "What is your partner's love language when they are the one comforting you?", options: ["They talk you through it with kind words", "They hold you close until you settle", "They stay present and cancel other plans", "They quietly take care of everything around you"] },
    { q: "How does your partner feel when you remember a tiny detail they mentioned?", options: ["Deeply touched that you were listening", "Warm and wanting to be close to you", "Seen and valued in a way words cannot capture", "Cared for, like you were paying attention all along"] },
    { q: "What does your partner want from you on a low, hard day?", options: ["Gentle words to lift them back up", "To be wrapped up and held", "You choosing to just be near them", "You handling the day so they can rest"] },
    { q: "How does your partner most enjoy being flirted with?", options: ["Playful, sweet compliments", "A lingering touch or teasing closeness", "You giving them all your attention", "You doing something thoughtful just to charm them"] },
    { q: "What does your partner treasure about your bedtime routine together?", options: ["The soft things you say before sleep", "Falling asleep tangled together", "The quiet end-of-day conversation", "Knowing you locked up and set the alarm"] },
    { q: "How does your partner want to be welcomed back after time apart?", options: ["A heartfelt 'I missed you so much'", "A long, tight embrace", "You clearing your day to reconnect", "You having their favorite things ready"] },
    { q: "What is your partner's favorite way to be shown you are proud of them?", options: ["You telling them and everyone else", "A proud squeeze or hug", "You marking the moment with time together", "You handling a reward or treat for them"] },
    { q: "How does your partner respond best when you are the one apologizing?", options: ["Hearing a sincere, specific 'I am sorry'", "A reconnecting hug to break the ice", "You sitting down to really talk it out", "You fixing the actual problem right away"] },
    { q: "What makes your partner feel most desired in everyday life?", options: ["You telling them how much you want them around", "Spontaneous affection through the day", "You choosing them over other distractions", "You going out of your way to make their day easier"] },
    { q: "How does your partner want you to react to good news they share?", options: ["Immediate excited words and hype", "Grabbing them for a celebratory hug", "Dropping everything to hear the whole story", "Springing into action to celebrate them"] },
    { q: "What does your partner need most on your anniversary?", options: ["A meaningful message or heartfelt toast", "An entire day of closeness", "Uninterrupted time doing something special", "You planning and running every detail"] },
    { q: "How does your partner most like receiving little surprises?", options: ["A sweet unexpected note", "A surprise kiss or embrace", "Surprise plans for time together", "A small task done for them out of nowhere"] },
    { q: "What makes your partner feel most reassured about the relationship?", options: ["Hearing you say you are all in", "Consistent physical affection", "Regular, real quality time", "Seeing you show up dependably"] },
    { q: "How does your partner want comfort after a fight with someone else?", options: ["You building them up and taking their side kindly", "A hug and physical reassurance", "You being fully present to listen", "You handling everything else so they can decompress"] },
    { q: "What tiny thing you do makes your partner feel most loved?", options: ["A spontaneous compliment out of nowhere", "A quick kiss on the forehead", "You looking up and smiling at them", "You bringing them a snack or drink unprompted"] },
    { q: "How does your partner want to be encouraged when self-doubt hits?", options: ["Firm, loving words about their worth", "Being physically held and steadied", "Your patient presence and time", "You proving their worth by how you treat them"] },
    { q: "What is your partner's favorite way to spend a rainy day with you?", options: ["Deep conversation with hot drinks", "Cuddled up watching the rain", "Doing a cozy shared activity together", "You cooking a warm meal while they relax"] },
    { q: "How does your partner most want to be loved on their birthday?", options: ["A heartfelt speech or letter", "A day full of affection and closeness", "Your complete attention and shared time", "You orchestrating a perfect stress-free day"] },
    { q: "What makes your partner feel like your top priority?", options: ["You saying it and meaning it", "You reaching for them constantly", "You protecting your time together", "You anticipating and meeting their needs"] },
    { q: "How does your partner want to reconnect after a small argument?", options: ["A soft 'I love you' to reset", "A hug that says we are okay", "Some quiet time together to move past it", "You doing something kind to make it right"] },
    { q: "What is the most meaningful way your partner receives support during stress?", options: ["Constant encouraging words", "Physical closeness and steadiness", "You cancelling plans to be there", "You quietly handling their responsibilities"] },
    { q: "How does your partner most want to be adored?", options: ["Told, out loud and often", "Held, touched, and kept close", "Chosen, prioritized, and given time", "Cared for through thoughtful actions"] },
    { q: "What gesture makes your partner feel the relationship is thriving?", options: ["Regular sweet affirmations from you", "Easy, frequent physical affection", "Protected, undistracted time together", "A balanced life where you both pull your weight"] },
    { q: "When your partner wants to feel close after work, what do they reach for?", options: ["A few kind words about their day", "A hug the moment you meet", "Sitting together with no screens", "You having handled dinner already"] },
    { q: "What tells your partner you were thinking of them while apart?", options: ["A thoughtful message midday", "A long hug when you reunite", "You keeping the evening free for them", "A small errand you ran for them"] },
    { q: "How does your partner most enjoy lazy Sunday affection?", options: ["Whispered sweet nothings", "Staying wrapped up together", "Doing a slow activity side by side", "You making breakfast for them"] },
    { q: "What makes your partner feel valued when they are swamped?", options: ["A quick note of encouragement", "A shoulder squeeze in passing", "You waiting up to spend time later", "You quietly handling their chores"] },
    { q: "How does your partner want to be soothed during a panic?", options: ["Calm words that ground them", "Being held until it passes", "You staying right beside them", "You taking over what they cannot do"] },
    { q: "What makes your partner feel most understood by you?", options: ["You naming exactly how they feel", "You reaching out to hold them", "You giving them uninterrupted focus", "You acting on what they needed"] },
    { q: "How does your partner most love being greeted at the door?", options: ["An enthusiastic hello", "A kiss before words", "You dropping everything to focus on them", "You taking their bags and coat"] },
    { q: "What kind of attention does your partner secretly crave daily?", options: ["Being told they matter", "Being touched and held", "Being genuinely listened to", "Being taken care of in little ways"] },
    { q: "How does your partner want you to show up on their worst days?", options: ["With gentle uplifting words", "With arms open to hold them", "By simply staying present", "By handling everything for them"] },
    { q: "What melts your partner during an ordinary moment?", options: ["An out-of-nowhere compliment", "A hand resting on their knee", "You looking up and smiling at them", "You bringing them a warm drink"] },
    { q: "How does your partner most want to be pursued in a long relationship?", options: ["Flirty texts and sweet words", "Playful touches and closeness", "Planned time set aside for them", "Thoughtful acts that show effort"] },
    { q: "What reassurance does your partner need after a rough patch?", options: ["Hearing you are still committed", "Being physically close again", "Time carved out to reconnect", "Seeing you follow through on change"] },
    { q: "How does your partner want affection woven into the workday?", options: ["A midday text saying they are missed", "A hug before you both leave", "A lunch break spent together", "You packing their lunch or coffee"] },
    { q: "What does your partner appreciate most when they are ill?", options: ["Soft encouraging check-ins", "Being held and comforted", "You staying near all day", "You bringing medicine and soup"] },
    { q: "How does your partner most feel your devotion?", options: ["Through the words you choose", "Through constant closeness", "Through the time you protect", "Through the things you handle"] },
    { q: "What tiny ritual does your partner treasure most from you?", options: ["A daily sweet message", "A goodbye kiss every time", "A nightly chat in the dark", "Their coffee made just right"] },
    { q: "How does your partner want comfort when they feel small?", options: ["Words that build them back up", "Being wrapped in your arms", "Your patient, present company", "You easing their burdens"] },
    { q: "What makes your partner feel truly wanted by you?", options: ["Being told how much you adore them", "Being reached for and touched", "Being chosen over distractions", "Being cared for without asking"] },
    { q: "How does your partner most enjoy being celebrated after a win?", options: ["Loud proud praise", "A huge celebratory hug", "Special time to mark it", "You arranging a treat for them"] },
    { q: "What does your partner want most on a quiet evening in?", options: ["Long meaningful talk", "Cuddling with no agenda", "A shared cozy activity", "You cooking while they rest"] },
    { q: "How does your partner want to be reassured mid-argument?", options: ["Hearing you still love them", "A steadying touch on the arm", "You slowing down to listen", "You showing you will fix your part"] },
    { q: "What form of touch settles your partner fastest?", options: ["Fingers through their hair", "A firm grounding hug", "Their hand held gently", "A slow back rub at night"] },
    { q: "How does your partner most want to fall asleep beside you?", options: ["After soft goodnight words", "Wrapped in your arms", "After talking quietly", "Knowing tomorrow is handled"] },
    { q: "What makes your partner feel prioritized above all else?", options: ["You saying they come first", "You reaching for them in a crowd", "You clearing time for them", "You anticipating their needs"] },
    { q: "How does your partner want to reconnect after a hard week?", options: ["A long overdue heart-to-heart", "A whole day of closeness", "A distraction-free date", "You lifting chores off them"] },
    { q: "What does your partner do when craving your affection?", options: ["They fish for compliments", "They inch physically closer", "They suggest doing something together", "They start helping just to be near you"] },
    { q: "How does your partner want support before something scary?", options: ["A pep talk full of belief", "A long steadying hug", "You calmly present with them", "You handling the logistics"] },
    { q: "What kind of praise reaches your partner deepest?", options: ["That they are a wonderful partner", "How attractive you find them", "That you love time with them", "How much they do for others"] },
    { q: "How does your partner want to be checked on all day?", options: ["Sweet messages throughout", "A hug the moment you see them", "Real time set aside", "You quietly lightening their load"] },
    { q: "What does your partner want first once a fight ends?", options: ["To hear I love you again", "A long make-up hug", "The rest of the day together", "To see the change happen"] },
    { q: "How does your partner want encouragement while chasing a goal?", options: ["Constant verbal cheering", "A reassuring touch and presence", "You showing up in person", "You clearing obstacles away"] },
    { q: "What helps your partner feel emotionally secure with you?", options: ["You promising you will stay", "You holding them when vulnerable", "You giving them full attention", "You proving you are reliable"] },
    { q: "How does your partner react to a heartfelt compliment?", options: ["They glow and want more", "They get shy and lean in", "They remember and bring it up later", "They insist you show it, not say it"] },
    { q: "What does your partner miss most when you travel?", options: ["Your voice and sweet words", "The physical closeness", "Just having you around", "The little things you handle"] },
    { q: "How does your partner want you to respond to their tears?", options: ["Soft words that they are not alone", "Just holding them, no fixing", "Sitting with them as long as needed", "Handling everything else so they can feel"] },
    { q: "What is your partner favorite way you show up in public?", options: ["Bragging about them to others", "A hand on their back", "Staying engaged by their side", "Quietly making sure they are okay"] },
    { q: "How does your partner most feel connected on a night in?", options: ["Talking for hours", "Tangled up on the couch", "Doing something side by side", "You cooking while they unwind"] },
    { q: "What does your partner want more of when feeling distant?", options: ["Verbal check-ins", "More physical affection", "More intentional time", "More shared effort at home"] },
    { q: "How does your partner most wish to be adored day to day?", options: ["Told out loud and often", "Held, touched, kept close", "Chosen and given time", "Cared for through actions"] },
    { q: "What gesture surprises your partner most in a good way?", options: ["A note listing why you love them", "A slow dance in the kitchen", "A surprise evening for them", "Secretly finishing a dreaded task"] },
    { q: "How does your partner want to be loved when insecure?", options: ["Direct reassurance about them", "Being held and wanted", "Your patient attention", "You showing up consistently"] },
    { q: "What is your partner favorite kind of good-morning?", options: ["A whispered sweet greeting", "A sleepy cuddle", "Coffee and a slow chat", "You handling the morning chaos"] },
    { q: "How does your partner feel your love in tough times?", options: ["You keep saying you believe in them", "You stay physically close", "You refuse to leave their side", "You carry the practical burden"] },
    { q: "What makes your partner feel truly seen?", options: ["You remember the little things", "You read their body language", "You give complete focus", "You act before they ask"] },
    { q: "How does your partner want a small win marked?", options: ["Loud enthusiastic praise", "A big celebratory hug", "Quality time to savor it", "You handling everything else"] },
    { q: "How does your partner comfort you in return?", options: ["With kind words", "By holding you close", "By staying fully present", "By taking care of everything"] },
    { q: "How does your partner feel when you recall a tiny detail?", options: ["Deeply touched you listened", "Warm and wanting closeness", "Seen beyond words", "Cared for and noticed"] },
    { q: "What does your partner want on a low, heavy day?", options: ["Gentle words to lift them", "To be wrapped up and held", "You just being near", "You handling the day"] },
    { q: "How does your partner most love to be teased and flirted with?", options: ["Playful sweet compliments", "A lingering teasing touch", "Your undivided attention", "A thoughtful charming gesture"] },
    { q: "What does your partner treasure about your bedtime routine?", options: ["The soft things you say", "Falling asleep entwined", "The quiet end-of-day talk", "Knowing you locked up"] },
    { q: "How does your partner want to be welcomed after time apart?", options: ["A heartfelt I missed you", "A long tight embrace", "You clearing the day to reconnect", "Their favorite things ready"] },
    { q: "What is your partner favorite proof that you are proud?", options: ["Telling them and everyone", "A proud squeeze or hug", "Marking it with time together", "Arranging a reward for them"] },
    { q: "How does your partner respond best to your apology?", options: ["A sincere specific sorry", "A reconnecting hug", "Sitting to talk it out", "Fixing the real problem"] },
    { q: "What makes your partner feel desired in daily life?", options: ["You saying you want them around", "Spontaneous affection", "You choosing them over distractions", "You making their day easier"] },
    { q: "How does your partner want you to react to good news?", options: ["Immediate excited words", "A celebratory hug", "Dropping everything to hear it", "Springing into action to celebrate"] },
    { q: "What does your partner most want to feel on your anniversary?", options: ["A heartfelt toast or letter", "A whole day of closeness", "Uninterrupted special time", "You running every detail"] },
    { q: "How does your partner most like little surprises?", options: ["A sweet unexpected note", "A surprise kiss", "Surprise plans for time together", "A task done out of nowhere"] },
    { q: "What most reassures your partner about the relationship?", options: ["Hearing you are all in", "Consistent physical affection", "Regular quality time", "Seeing you show up reliably"] },
    { q: "How does your partner want comfort after outside conflict?", options: ["You taking their side kindly", "A hug and reassurance", "You fully present to listen", "You handling the rest so they decompress"] },
    { q: "What tiny thing you do makes your partner feel loved most?", options: ["A random compliment", "A forehead kiss", "A warm smile across the room", "A snack brought unprompted"] },
    { q: "How does your partner want encouragement when doubting themselves?", options: ["Firm loving words on their worth", "Being held and steadied", "Your patient presence", "You proving it by how you treat them"] },
    { q: "What is your partner favorite rainy-day affection?", options: ["Deep talk over hot drinks", "Cuddled watching the rain", "A cozy shared activity", "You cooking a warm meal"] },
    { q: "How does your partner most want to be celebrated on their birthday?", options: ["A heartfelt speech", "A day full of closeness", "Your complete attention", "You running a stress-free day"] },
    { q: "How does your partner want to reset after a small argument?", options: ["A soft I love you", "A hug that says we are okay", "Quiet time together", "A kind gesture to make it right"] },
    { q: "How does your partner receive support best during stress?", options: ["Encouraging words", "Physical steadiness", "You cancelling plans to be there", "You handling their responsibilities"] },
    { q: "What sign tells your partner they are cherished on a Tuesday?", options: ["A text saying you thought of them", "A hug from behind", "You checking in on them", "You handling an annoyance first"] },
    { q: "How does your partner want to be encouraged before a big day?", options: ["Words that they will crush it", "A grounding hug", "You calmly present", "You handling logistics"] },
    { q: "What kind of touch does your partner crave when tired?", options: ["A gentle head rub", "A firm cuddle", "Their hand held", "A slow back rub"] },
    { q: "How does your partner want to be shown patience?", options: ["Reassuring words that it is okay", "A calming touch", "You slowing to their pace", "You handling the pressure for them"] },
    { q: "What does your partner value most in a goodnight?", options: ["Soft loving words", "A warm embrace", "A quiet recap of the day", "Knowing the morning is set"] },
    { q: "How does your partner most want daily closeness?", options: ["Frequent kind words", "Constant small touches", "Regular real conversation", "Small helpful acts"] },
    { q: "What makes your partner feel like your whole world?", options: ["You telling them so", "You reaching for them first", "You protecting your time together", "You anticipating their needs"] },
    { q: "How does your partner want love shown when overwhelmed?", options: ["Words that it will be okay", "A grounding hug", "You sitting quietly beside them", "You clearing their to-do list"] },
    { q: "What does your partner want you to notice unprompted?", options: ["When they need reassurance", "When they want to be held", "When they need your attention", "When they are exhausted"] },
    { q: "How does your partner most enjoy a slow morning?", options: ["Sweet words in bed", "Extra cuddling minutes", "Coffee and conversation", "You handling breakfast"] },
    { q: "When is your partner most open with you?", options: ["When sharing words about feelings", "When holding onto you tightly", "During late-night talks", "When letting you care for them"] },
    { q: "What smallest thing makes your partner smile every time?", options: ["A random sweet name", "A gentle touch on the back", "Your full focus for a moment", "A tiny helpful act"] },
    { q: "How does your partner want their effort acknowledged?", options: ["Told out loud you noticed", "A grateful kiss", "Time set aside to celebrate", "You reciprocating in kind"] },
    { q: "What does your partner want when feeling unappreciated?", options: ["More verbal thanks", "More physical warmth", "More undistracted time", "More shared effort"] },
    { q: "How does your partner most want to reconnect nightly?", options: ["A few sweet words before sleep", "Falling asleep close", "A quiet chat in the dark", "Knowing you set the alarm"] },
    { q: "What does your partner secretly hope you keep doing?", options: ["Telling them you love them", "Reaching for their hand", "Making time just for them", "Doing the little things"] },
    { q: "How does your partner want to be met after they cry?", options: ["Words that they are loved", "Being held in silence", "You staying present", "You handling the rest"] },
    { q: "What makes your partner feel adored on a normal day?", options: ["A spontaneous compliment", "A surprise embrace", "Your genuine attention", "A caring little act"] },
    { q: "How does your partner want warmth shown at breakfast?", options: ["A sweet good-morning", "A kiss before coffee", "Sitting together to eat", "You having made it for them"] },
    { q: "What does your partner most want when they feel alone?", options: ["To hear they are not alone", "To be held close", "You choosing to be near", "You quietly showing up"] },
    { q: "How does your partner want reassurance about your future?", options: ["Hearing your plans include them", "Being pulled close", "Time spent dreaming together", "Actions that build toward it"] },
    { q: "What is your partner favorite way to be pursued again?", options: ["Flirty affirming texts", "Renewed physical attention", "Dedicated date nights", "Thoughtful romantic gestures"] },
    { q: "How does your partner want love shown through a busy season?", options: ["Little notes of love", "Quick hugs and kisses", "Even ten minutes together", "You picking up the slack"] },
    { q: "What makes your partner feel most at home with you?", options: ["Your comforting words", "Your steady closeness", "Your undivided presence", "Your dependable care"] },
    { q: "How does your partner want tenderness after a nightmare?", options: ["Soft calming words", "Being held until safe", "You staying awake with them", "You getting them water and comfort"] },
    { q: "What does your partner most want on a slow weekend?", options: ["Long affectionate conversation", "Endless cuddling", "A shared activity together", "You handling the meals"] },
    { q: "How does your partner want love shown when proud of themselves?", options: ["You hyping them up", "A celebratory embrace", "Time to enjoy the moment together", "You treating them to something"] },
    { q: "What gesture makes your partner feel chosen every day?", options: ["A daily loving word", "A daily kiss or touch", "Daily protected time", "A daily thoughtful act"] },
    { q: "How does your partner most want to be held after a long day?", options: ["While you talk it through", "In a firm quiet hug", "Just lying close together", "After you handled the chores"] },
    { q: "What makes your partner feel like a priority in a crowd?", options: ["You introducing them warmly", "Your hand finding theirs", "You staying by their side", "You making sure they are comfortable"] },
    { q: "How does your partner want affection on a stressful morning?", options: ["Encouraging words before they go", "A long hug at the door", "A few minutes of connection", "You having handled everything"] },
    { q: "What does your partner most want to hear before sleep?", options: ["How much you love them", "Come here and cuddle", "A recap of your favorite moment", "That tomorrow is all set"] },
    { q: "How does your partner want to be comforted about work stress?", options: ["Words that they are capable", "A grounding embrace", "You listening fully", "You easing home responsibilities"] },
    { q: "What is your partner favorite spontaneous affection?", options: ["A surprise sweet text", "A surprise kiss", "Surprise plans together", "A surprise helpful act"] },
    { q: "How does your partner want to feel wanted mid-week?", options: ["A flirty affirming message", "An unexpected touch", "A midweek date idea", "A gesture that makes their day"] },
    { q: "What does your partner treasure most about mornings together?", options: ["The first sweet words", "The sleepy closeness", "The shared quiet coffee", "You handling the rush"] },
    { q: "How does your partner most want love shown when anxious?", options: ["Calm reassuring words", "Being held steadily", "You staying present", "You taking things off their plate"] },
    { q: "What makes your partner feel truly pursued after years together?", options: ["You still complimenting them", "You still reaching for them", "You still making time", "You still doing thoughtful things"] },
    { q: "How does your partner want to be soothed after bad news?", options: ["Gentle grounding words", "Being wrapped up close", "You sitting with them", "You handling what needs doing"] },
    { q: "What small daily act would mean the world to your partner?", options: ["A genuine compliment each day", "A real hug each day", "Ten focused minutes each day", "One helpful act each day"] },
    { q: "How does your partner most want closeness on a cold night?", options: ["Warm loving words", "Cuddled under blankets", "Talking quietly together", "You making something warm"] },
    { q: "What makes your partner feel most secure in your love?", options: ["Hearing it spoken often", "Feeling it through touch", "Seeing it in your time", "Watching it in your actions"] },
    { q: "How does your partner want affection shown at a party?", options: ["A quiet sweet aside", "A hand on the small of their back", "You checking in through the night", "You getting them a drink"] },
    { q: "What does your partner most want after a big accomplishment?", options: ["Proud loud praise", "A huge celebratory hug", "Time set aside to celebrate", "You arranging the reward"] },
    { q: "How does your partner most feel cared for when sick in bed?", options: ["Sweet check-ins", "Being held gently", "You staying near", "You bringing everything they need"] },
    { q: "What is your partner favorite way to end a date night?", options: ["Sweet words before parting", "A long lingering kiss", "Staying up talking together", "You handling the ride and plans"] },
    { q: "How does your partner want love shown on a milestone day?", options: ["A heartfelt written message", "A day of closeness", "Your total attention", "You orchestrating everything"] },
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
    { q: "What does your partner remember most about the night you became official?", options: ["The exact words that were said", "How nervous and excited you both were", "Where you were and what it looked like", "That it happened in a way neither of you expected"] },
    { q: "What is the first meal you two ever cooked together?", options: ["Something simple that turned into a disaster", "A recipe that became a repeat favorite", "Something ambitious that surprisingly worked", "Neither of you can remember it clearly"] },
    { q: "What was your partner wearing on your first date?", options: ["Something they overthought for hours", "Their comfortable go-to outfit", "Something you still tease them about", "They genuinely cannot remember"] },
    { q: "What is the silliest inside joke your partner still laughs about?", options: ["One from a misheard phrase or typo", "One from an embarrassing public moment", "One only the two of you would ever understand", "One that started years ago and never died"] },
    { q: "What first gift did your partner ever give you?", options: ["Something small but thoughtful", "Something they were nervous you would not like", "A handmade or personal gesture", "They struggle to remember what it was"] },
    { q: "What trip do you two most want to recreate someday?", options: ["Your first vacation together", "A spontaneous getaway that felt magical", "A trip where everything went perfectly", "One where the mishaps made it unforgettable"] },
    { q: "What is your partner's favorite memory from a holiday season together?", options: ["Decorating or preparing together", "A quiet moment away from the chaos", "A gift exchange that hit perfectly", "A new tradition you two started"] },
    { q: "What is the most nervous your partner has ever been around you?", options: ["Before saying I love you for the first time", "Meeting your family or friends", "Before a big vulnerable conversation", "The very first date"] },
    { q: "What memory makes your partner laugh every single time?", options: ["A travel mishap that went sideways", "Something clumsy one of you did", "A ridiculous argument about nothing", "An awkward run-in with someone"] },
    { q: "What is the first movie you two watched together?", options: ["Something you both actually loved", "Something one of you fell asleep during", "A film that became a shared favorite", "Neither of you remembers what it was"] },
    { q: "What was the moment your partner realized you two clicked?", options: ["A conversation that flowed effortlessly", "A shared laugh that felt different", "A moment of unexpected comfort", "When you both liked the same obscure thing"] },
    { q: "What is your partner's favorite small tradition you built together?", options: ["A specific meal on a specific day", "A recurring inside greeting or phrase", "A weekly show you watch together", "A route or walk you always take"] },
    { q: "What is the most memorable meal you two have shared?", options: ["A fancy dinner for a special occasion", "Street food or something cheap and perfect", "A home-cooked meal on an ordinary night", "A meal in a place you traveled to"] },
    { q: "What was the first thing your partner noticed about you?", options: ["Your smile or your eyes", "Your sense of humor", "Your voice or the way you spoke", "Your confidence or how you carried yourself"] },
    { q: "What early text exchange does your partner still remember?", options: ["The first time you made them laugh", "A late-night conversation that went deep", "The moment flirting became obvious", "The text that made them fall for you"] },
    { q: "What is the most spontaneous night out you two have had?", options: ["An impromptu adventure with no plan", "A night that started small and escalated", "Getting lost and making the best of it", "A last-minute decision that became a great memory"] },
    { q: "What memory does your partner get sentimental about?", options: ["A quiet moment early in the relationship", "A milestone you crossed together", "A time you took care of them", "The first time they felt truly at home with you"] },
    { q: "What is the funniest misunderstanding you two have had?", options: ["A text taken completely the wrong way", "A plan that got crossed hilariously", "A moment where you heard totally different things", "A surprise that backfired comedically"] },
    { q: "What was your partner's reaction the first time you cooked for them?", options: ["Genuinely impressed and surprised", "Polite but secretly unsure", "They still bring it up fondly", "They do not remember it clearly"] },
    { q: "What is the earliest photo you have together?", options: ["A blurry selfie from an early outing", "A candid someone else took", "A posed photo from a special day", "You wish you had taken one sooner"] },
    { q: "What place do you two always end up returning to?", options: ["A restaurant that feels like yours", "A park or spot from an early date", "A city or town you keep going back to", "Home, honestly, is your favorite place"] },
    { q: "What is the biggest laugh you two have shared recently?", options: ["Something absurd that happened out and about", "An inside joke that resurfaced", "One of you doing something clumsy", "A show or video that broke you both"] },
    { q: "What memory does your partner wish they could bottle up?", options: ["A perfect lazy morning together", "A moment of pure uncontrollable laughter", "A quiet drive with the right song on", "The first time you said I love you"] },
    { q: "What was the first difficult thing you two navigated together?", options: ["A disagreement early on", "A stressful external situation", "A misunderstanding about expectations", "A distance or scheduling challenge"] },
    { q: "What is your partner's fondest memory of a night in together?", options: ["Cooking and dancing in the kitchen", "A deep talk that lasted until dawn", "A movie marathon under blankets", "Doing absolutely nothing but being together"] },
    { q: "What was the moment you two first felt like a real team?", options: ["Tackling a problem side by side", "Making a decision together confidently", "Getting through a crisis as a unit", "Planning something big together"] },
    { q: "What is the most romantic place you have been together?", options: ["Somewhere with an unforgettable view", "A candlelit dinner spot", "A quiet beach or waterfront", "Home, made romantic by effort"] },
    { q: "What early moment made your partner feel truly safe with you?", options: ["When you kept a secret they trusted you with", "When you showed up during a hard time", "When you were patient with their fears", "When they could finally be themselves fully"] },
    { q: "What is the story your partner loves telling about how you met?", options: ["The version where it was destiny", "The funny slightly embarrassing version", "The version that surprises everyone", "They keep the real story just between you"] },
    { q: "What surprise from you did your partner not see coming?", options: ["A gift they mentioned once ages ago", "A visit or appearance when you were apart", "Plans you secretly arranged", "A gesture during a hard moment"] },
    { q: "What memory represents your relationship at its happiest?", options: ["A carefree trip together", "A quiet ordinary perfect day", "A celebration surrounded by loved ones", "A private moment only you two shared"] },
    { q: "What is your partner's favorite thing you did on an early date?", options: ["Something thoughtful you planned", "A spontaneous detour you took", "The way you made them feel at ease", "A small gesture that stuck with them"] },
    { q: "What is the longest you two have talked without noticing the time?", options: ["An all-nighter early in the relationship", "A road trip that flew by", "A dinner that turned into hours", "It happens all the time honestly"] },
    { q: "What moment did your partner feel proudest of the two of you?", options: ["Getting through something hard together", "Reaching a goal you set as a couple", "How you handled a crisis calmly", "A moment others admired your bond"] },
    { q: "What is a memory your partner brings up when they miss you?", options: ["A specific tender moment", "A trip you took together", "A silly time that makes them smile", "The early butterflies phase"] },
    { q: "What was the first fight you two ever had about?", options: ["A miscommunication over plans", "Jealousy or insecurity", "Something small that spiraled", "You cannot even remember now"] },
    { q: "What is your partner's favorite memory involving your friends?", options: ["A group trip or outing", "The night your friends approved of them", "A hilarious group moment", "A quiet double date"] },
    { q: "What tradition did the two of you accidentally start?", options: ["Ordering the same thing every time", "A phrase you always say", "A place you always go", "A ritual neither of you planned"] },
    { q: "What memory of you does your partner keep to themselves?", options: ["A private moment that meant everything", "A time you were unexpectedly tender", "Something you said you may have forgotten", "A vulnerable moment they treasure"] },
    { q: "What was your partner's first impression of your home or space?", options: ["Surprised by how you lived", "Instantly comfortable there", "Amused by something they saw", "It told them a lot about you"] },
    { q: "What is the most adventurous date you two have been on?", options: ["An outdoor challenge or hike", "Trying something totally new together", "A spontaneous trip out of town", "A dare that turned into a story"] },
    { q: "What memory does your partner associate with your first kiss?", options: ["Where it happened", "How long you both waited for it", "The nervous lead-up to it", "That it happened out of nowhere"] },
    { q: "What is your partner's favorite anniversary you have celebrated?", options: ["The first one you marked together", "One with a surprise element", "A low-key one that felt just right", "One where you traveled somewhere"] },
    { q: "What early gesture from you won your partner over?", options: ["Remembering something small they said", "Showing up when it counted", "A thoughtful message at the right time", "A moment of genuine kindness"] },
    { q: "What memory of the two of you would make the best movie scene?", options: ["A dramatic reunion", "A quiet meaningful conversation", "A spontaneous adventure", "A hilarious chaotic moment"] },
    { q: "What is the first thing you two did as an official couple?", options: ["A celebratory date", "Told the people closest to you", "A quiet night in together", "Nothing special, and that was perfect"] },
    { q: "What memory does your partner replay when they feel grateful for you?", options: ["A time you sacrificed for them", "A perfect shared day", "The moment they knew you were it", "A tender ordinary morning"] },
    { q: "What is the best gift you have ever received from your partner?", options: ["Something deeply personal and thoughtful", "An experience they planned around you", "Something you had wanted forever", "A surprise you never expected"] },
    { q: "What was the moment your two worlds first fully merged?", options: ["Meeting each other's families", "Blending your friend groups", "Moving in or sharing space", "A holiday spent together"] },
    { q: "What memory captures your partner's sense of humor best?", options: ["A prank they pulled on you", "A joke that landed perfectly", "A ridiculous thing they said seriously", "A moment they made a stranger laugh"] },
    { q: "What is your partner's favorite memory of you being spontaneous?", options: ["A surprise trip you sprang on them", "A last-minute plan you made", "A bold move that paid off", "A random act of romance"] },
    { q: "What early moment made your partner think 'this could be serious'?", options: ["A conversation about the future", "A feeling of unexpected ease", "A small act that showed your character", "The way you treated someone else"] },
    { q: "What memory would your partner want your future kids to hear about?", options: ["How you two met", "A great adventure you shared", "A moment that defined your love", "A funny story they will exaggerate"] },
    { q: "What is the most meaningful place you two have visited together?", options: ["Somewhere connected to your history", "A dream destination you finally reached", "A place that changed your perspective", "Somewhere simple that felt profound"] },
    { q: "What was the weather like on your very first date?", options: ["Sunny and warm", "Rainy and cozy", "Cold and crisp", "Neither of you remembers"] },
    { q: "What is your partner favorite memory of you being silly?", options: ["A ridiculous dance you did", "A goofy voice or impression", "A prank that backfired", "A joke only they found funny"] },
    { q: "What do you two always laugh about from an early date?", options: ["An awkward silence", "A spilled drink or mess", "A wrong turn or getting lost", "Something one of you said"] },
    { q: "What is the first show you two binged together?", options: ["A comedy you both loved", "A drama you got hooked on", "A reality show for fun", "Neither of you can recall"] },
    { q: "What moment made your partner first trust you completely?", options: ["A secret you kept safe", "You showing up in a crisis", "A promise you kept", "A vulnerable talk you shared"] },
    { q: "What is your partner favorite memory of cooking together?", options: ["A dish that turned out great", "A total kitchen disaster", "A messy fun evening", "Trying a new recipe together"] },
    { q: "What early text from you did your partner screenshot or save?", options: ["The first flirty one", "A sweet good-morning", "A funny one that landed", "The one that made it official feeling"] },
    { q: "What is the most spontaneous yes you two ever said?", options: ["To a last-minute trip", "To a random adventure", "To meeting each other family early", "To moving faster than planned"] },
    { q: "What is your partner favorite photo backdrop from your travels?", options: ["A beach at sunset", "A city skyline", "A mountain view", "A cozy little cafe"] },
    { q: "What was the first concert or show you attended together?", options: ["A live music night", "A comedy show", "A theater performance", "You have not been to one yet"] },
    { q: "What memory does your partner bring up when feeling nostalgic?", options: ["Your first trip", "An early quiet night in", "A milestone you crossed", "The night you met"] },
    { q: "What is the funniest nickname you two invented?", options: ["One from an inside joke", "One based on a habit", "One that makes no sense", "One only you two understand"] },
    { q: "What was your partner most nervous about early on?", options: ["Saying the wrong thing", "Meeting your friends", "Whether you liked them back", "The first big talk"] },
    { q: "What memory would your partner frame if they could?", options: ["A candid laughing shot", "A tender embrace", "A travel adventure", "A perfectly ordinary day"] },
    { q: "What is the best surprise your partner ever received from you?", options: ["A thoughtful planned gift", "A spontaneous visit", "A secret event or party", "A gesture during a hard time"] },
    { q: "What is your partner favorite thing you did on an early trip?", options: ["Planned a special detour", "Went along with their idea", "Made them feel relaxed", "A small romantic gesture"] },
    { q: "What early moment made your partner feel truly comfortable?", options: ["A conversation that flowed", "A shared laugh", "A quiet easy silence", "Being fully themselves with you"] },
    { q: "What is the longest you two stayed up talking on a first meeting?", options: ["Past midnight easily", "Until sunrise", "A few hours that flew by", "You lost track completely"] },
    { q: "What is your partner favorite memory involving bad weather?", options: ["Getting caught in the rain", "A snow day inside together", "A storm you waited out", "A heatwave adventure"] },
    { q: "What was the first meal you two shared?", options: ["A casual bite", "A fancy dinner", "Fast food on the go", "Something you cooked"] },
    { q: "What tradition did you two start without meaning to?", options: ["A recurring order", "A phrase you always say", "A place you keep returning to", "A little ritual"] },
    { q: "What is your partner favorite memory of you two dressed up?", options: ["A wedding you attended", "A fancy date night", "A holiday party", "A themed event"] },
    { q: "What early gesture from your partner won you over?", options: ["Remembering a small detail", "Showing up unexpectedly", "A sweet message", "A kind act toward others"] },
    { q: "What is the most memorable dessert you two shared?", options: ["Splitting one spoon", "A birthday treat", "A late-night indulgence", "Something from a trip"] },
    { q: "What was your partner reaction to your first real gift to them?", options: ["Genuinely surprised", "Quietly touched", "They still mention it", "They keep it somewhere special"] },
    { q: "What is your partner favorite quiet memory of the two of you?", options: ["A slow lazy morning", "A long drive with music", "A walk with no destination", "Reading side by side"] },
    { q: "What early disagreement do you two laugh about now?", options: ["A silly texting mix-up", "A misheard plan", "A tiny jealousy", "Something totally trivial"] },
    { q: "What is the most beautiful place you have watched a sunset together?", options: ["On a beach", "From a rooftop", "In the mountains", "From your own window"] },
    { q: "What memory captures your relationship at its most carefree?", options: ["A spontaneous road trip", "A day with zero plans", "A night out dancing", "A silly afternoon at home"] },
    { q: "What is your partner favorite thing you two did on a budget?", options: ["A picnic in the park", "A cheap movie night", "A free local event", "A homemade dinner date"] },
    { q: "What is the first thing you two argued and made up about?", options: ["A scheduling mix-up", "A misunderstanding", "A small jealousy", "You cannot even remember"] },
    { q: "What memory of your partner makes you smile most?", options: ["Their laugh at something", "A sweet thing they did", "A goofy moment", "The way they looked at you"] },
    { q: "What is your partner favorite memory with your pet or animals?", options: ["Meeting a pet for the first time", "A funny animal encounter", "Adopting together", "A day out with animals"] },
    { q: "What was your first inside joke about?", options: ["A funny mishap", "A phrase taken wrong", "A shared observation", "A ridiculous moment"] },
    { q: "What memory does your partner replay when missing you?", options: ["A tender moment", "A fun adventure", "A silly time together", "The early butterflies"] },
    { q: "What is the most adventurous meal you two have tried?", options: ["Exotic street food", "A tasting menu", "Something neither had eaten", "A dish from your travels"] },
    { q: "What early moment felt like a scene from a movie?", options: ["A rainy kiss", "A spontaneous dance", "A dramatic reunion", "A quiet perfect pause"] },
    { q: "What is your partner favorite memory of a holiday together?", options: ["Decorating together", "A quiet moment away from chaos", "A perfect gift exchange", "Starting a new tradition"] },
    { q: "What was the first thing you two celebrated as a couple?", options: ["A one-month mark", "A birthday", "A small win", "Just being together"] },
    { q: "What memory does your partner wish had been filmed?", options: ["A spontaneous funny moment", "The moment you connected", "A trip with no photos", "A private perfect scene"] },
    { q: "What is the best road trip snack tradition you two have?", options: ["Sharing a favorite candy", "Coffee stops", "A specific fast food", "Whatever the gas station has"] },
    { q: "What early moment made your partner think you two clicked?", options: ["A conversation that flowed", "Laughing at the same thing", "Unexpected comfort", "Liking the same obscure thing"] },
    { q: "What is your partner favorite memory of a night that went off-plan?", options: ["A cancelled plan that turned fun", "Getting lost together", "A surprise change of scenery", "A last-minute adventure"] },
    { q: "What was the first gift your partner gave you?", options: ["Something small and sweet", "Something handmade", "Something they were nervous about", "You struggle to recall"] },
    { q: "What memory of your friends and your partner stands out most?", options: ["A group trip", "The night they were approved of", "A hilarious group moment", "A double date"] },
    { q: "What is the most memorable dance you two shared?", options: ["A slow one at an event", "A goofy kitchen dance", "A wedding dance", "A spontaneous one anywhere"] },
    { q: "What early habit of yours did your partner find endearing?", options: ["A little quirk", "A way you texted", "A phrase you used", "Something you always did"] },
    { q: "What is your partner favorite memory of a lazy vacation day?", options: ["Doing absolutely nothing", "Sleeping in late", "Lounging by water", "A slow long breakfast"] },
    { q: "What was the moment you two first felt like home to each other?", options: ["A quiet ordinary evening", "Waking up together", "A comfortable silence", "Coming back to each other after time apart"] },
    { q: "What is the funniest thing that happened on a trip together?", options: ["A travel mishap", "A language mix-up", "A wrong hotel or booking", "An unexpected detour"] },
    { q: "What memory represents your partner sense of adventure?", options: ["Trying something risky", "A spontaneous plan", "A bold choice", "A dare they took"] },
    { q: "What is your partner favorite memory of you being thoughtful?", options: ["Remembering something small", "A surprise gesture", "Showing up when needed", "A quiet act of care"] },
    { q: "What is the first place you two called your spot?", options: ["A cafe or restaurant", "A park bench", "A specific view", "A corner of your home"] },
    { q: "What was the most nervous your partner was before seeing you early on?", options: ["Before the first date", "Before a big talk", "Before meeting your people", "Before saying how they felt"] },
    { q: "What memory of the two of you would make the best story to tell?", options: ["How you met", "A wild adventure", "A romantic moment", "A hilarious mishap"] },
    { q: "What is your partner favorite memory of an ordinary weeknight?", options: ["Cooking together", "A show and takeout", "A long talk", "Just being near each other"] },
    { q: "What early moment showed you two make a good team?", options: ["Solving a problem together", "Making a decision as one", "Getting through a stressful thing", "Planning something big"] },
    { q: "What is the most romantic surprise you have pulled off?", options: ["A secret getaway", "A candlelit dinner", "A meaningful gift", "A heartfelt gesture"] },
    { q: "What memory does your partner get sentimental thinking about?", options: ["An early quiet moment", "A milestone you crossed", "A time you cared for them", "Feeling at home with you"] },
    { q: "What was the first thing you two did on a rainy day together?", options: ["Stayed in with a movie", "Went out anyway", "Cooked something warm", "Napped the day away"] },
    { q: "What is your partner favorite memory of a spontaneous kiss?", options: ["In the rain", "Mid-conversation", "In a crowd", "Right at the door"] },
    { q: "What memory would your partner want future family to hear?", options: ["How you two met", "A great shared adventure", "A defining moment of love", "A funny story to exaggerate"] },
    { q: "What is the best view you two have shared?", options: ["From a mountaintop", "Over a city at night", "Across the ocean", "From a cozy window"] },
    { q: "What early moment made your partner feel truly chosen?", options: ["You picking them over others", "A thoughtful surprise", "You clearing time for them", "A sincere confession"] },
    { q: "What is your partner favorite memory of you two getting ready together?", options: ["Before a big event", "For a night out", "For a trip", "For a lazy day"] },
    { q: "What was the most memorable gift exchange between you two?", options: ["A surprise that hit perfectly", "A funny gag gift", "A deeply personal one", "A homemade gesture"] },
    { q: "What memory captures your partner sense of humor best?", options: ["A prank they pulled", "A perfectly timed joke", "A ridiculous thing said seriously", "Making a stranger laugh"] },
    { q: "What is the first adventure you two took outside your comfort zone?", options: ["An outdoor challenge", "A new activity together", "A spontaneous trip", "A daring first"] },
    { q: "What is your partner favorite memory of a slow morning in bed?", options: ["Talking softly", "Cuddling with no rush", "Slow coffee together", "Just lying there content"] },
    { q: "What moment made your two worlds first fully merge?", options: ["Meeting each other families", "Blending friend groups", "Sharing a home", "A holiday together"] },
    { q: "What is the most heartfelt thing your partner ever wrote you?", options: ["A long message", "A birthday card", "A note left behind", "A text at the right moment"] },
    { q: "What early moment made your partner feel butterflies?", options: ["The first time you laughed together", "The first touch", "A late-night talk", "The first time you said their name softly"] },
    { q: "What is your partner favorite memory of surprising you?", options: ["A gift you loved", "An unexpected visit", "Secret plans", "A gesture during a hard time"] },
    { q: "What was the first big milestone you two celebrated?", options: ["Making it official", "Moving in", "A first anniversary", "Surviving a challenge"] },
    { q: "What memory does your partner treasure from a quiet holiday?", options: ["A calm morning together", "A small tradition", "A meaningful gift", "Just the two of you"] },
    { q: "What is the funniest photo you two have together?", options: ["A blurry candid", "A silly posed one", "An unflattering laugh", "A bad-timing shot"] },
    { q: "What early moment made your partner feel deeply seen?", options: ["You understanding them instantly", "You noticing something small", "A vulnerable talk", "You accepting a flaw"] },
    { q: "What is your partner favorite memory of a shared meal at home?", options: ["A special home-cooked dinner", "Breakfast in bed", "A messy fun cooking night", "Takeout on the floor"] },
    { q: "What was the most memorable trip mishap you two survived?", options: ["A missed flight or train", "A booking gone wrong", "Getting completely lost", "Weather ruining a plan"] },
    { q: "What memory does your partner associate with feeling proud of you two?", options: ["Getting through something hard", "Reaching a shared goal", "Handling a crisis calmly", "Others admiring your bond"] },
    { q: "What is your partner favorite memory of an unplanned day off together?", options: ["A spontaneous outing", "Staying in all day", "A last-minute trip", "Doing nothing at all"] },
    { q: "What early gesture from your partner still touches you?", options: ["A thoughtful surprise", "Showing up when it counted", "A sweet message", "A moment of real kindness"] },
    { q: "What is the most memorable celebration you two have had?", options: ["A birthday surprise", "An anniversary trip", "A big life win", "A quiet meaningful one"] },
    { q: "What memory would your partner pick as your happiest together?", options: ["A carefree trip", "An ordinary perfect day", "A celebration with loved ones", "A private tender moment"] },
    { q: "What is your partner favorite memory of you two in the car?", options: ["Singing loudly together", "A deep talk on a long drive", "A quiet comfortable ride", "Getting lost and laughing"] },
    { q: "What was the first thing you two disagreed on but figured out?", options: ["How to spend a weekend", "A communication style", "A small habit", "Plans for a trip"] },
    { q: "What memory does your partner keep entirely private and special?", options: ["A vulnerable moment", "A time you were tender", "Something you may have forgotten", "A perfect quiet scene"] },
    { q: "What is your partner favorite memory of the two of you outdoors?", options: ["A hike with a view", "A beach day", "A picnic in the sun", "A walk under the stars"] },
    { q: "What was the moment you two first said something big out loud?", options: ["A confession of feelings", "A plan for the future", "A fear you shared", "A promise you made"] },
    { q: "What is the most memorable thing you two built or made together?", options: ["Furniture or a project", "A meal from scratch", "A plan or dream", "A tradition"] },
    { q: "What early memory makes your partner feel grateful for you?", options: ["A time you sacrificed for them", "A perfect shared day", "The moment they knew", "A tender ordinary morning"] },
    { q: "What is your partner favorite memory of a night you danced?", options: ["At a wedding", "In the kitchen", "At a concert", "Anywhere spontaneously"] },
    { q: "What was the first thing your partner noticed you were good at?", options: ["A hidden talent", "How you treated others", "Your sense of humor", "How capable you were"] },
    { q: "What memory would your partner turn into a painting?", options: ["A candid laughing moment", "A tender embrace", "An adventure scene", "An ordinary quiet day"] },
    { q: "What is the most spontaneous trip you two have taken?", options: ["A same-day getaway", "A weekend decided on a whim", "An unplanned detour that became a trip", "You have not done one yet"] },
    { q: "What early moment made your partner feel safe being vulnerable?", options: ["You listening without judgment", "You sharing something first", "A patient gentle response", "You keeping their trust"] },
    { q: "What is your partner favorite memory of a shared victory?", options: ["Solving something together", "Reaching a goal as a team", "Winning at a game", "Getting through a crisis"] },
    { q: "What was the first place that felt truly yours as a couple?", options: ["A favorite restaurant", "A specific park", "A neighborhood", "Your shared home"] },
    { q: "What memory does your partner think best captures your love?", options: ["A quiet tender moment", "A big adventure", "A time of care during hardship", "An everyday perfect day"] },
    { q: "What is your partner favorite memory of laughing until it hurt?", options: ["At something absurd", "At an inside joke", "At a clumsy moment", "At a show or video"] },
    { q: "What was the moment you two first felt unstoppable together?", options: ["Tackling a big problem", "Making a bold decision", "Surviving something hard", "Planning a future"] },
    { q: "What is the most meaningful anniversary you two have marked?", options: ["The very first one", "One with a surprise", "A low-key perfect one", "One where you traveled"] },
    { q: "What early memory does your partner replay most fondly?", options: ["The first date", "The first kiss", "The first I love you", "The first trip"] },
    { q: "What is your partner favorite memory of a cozy night in during winter?", options: ["Under blankets together", "By a fire or candles", "A warm meal and a movie", "Just talking for hours"] },
    { q: "What was the first challenge you two overcame side by side?", options: ["A stressful move", "A tough decision", "A family situation", "A distance or scheduling issue"] },
    { q: "What memory of your partner would you keep forever if you could keep only one?", options: ["Their laugh", "A tender look", "A perfect shared day", "The moment you knew"] },
    { q: "What is your partner favorite memory of a surprise you did not see coming?", options: ["A gift they arranged", "A visit when apart", "Secret plans", "A gesture in a hard moment"] },
    { q: "What was the first thing you two collected or kept as a keepsake?", options: ["A ticket stub", "A photo", "A small souvenir", "A note or letter"] },
    { q: "What memory best shows how far you two have come?", options: ["An early awkward moment versus now", "A challenge you grew through", "A goal you reached together", "How comfortable you are now"] },
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
    { q: "What is your partner's go-to takeout order?", options: ["Pizza, the ultimate reliable choice", "Something Asian like sushi or noodles", "A burger and fries kind of night", "Whatever new place looks interesting"] },
    { q: "How does your partner like their coffee shop visit?", options: ["Grab and go, no lingering", "Sit down and enjoy the atmosphere", "A quick drive-through if possible", "They prefer making coffee at home"] },
    { q: "What is your partner's ideal room temperature?", options: ["Cool, they run hot and love the AC", "Warm and cozy, more blankets", "Somewhere neutral in the middle", "They never seem satisfied either way"] },
    { q: "How does your partner prefer to spend a snow day?", options: ["Bundled inside with hot drinks", "Outside playing in it", "Sleeping in and doing nothing", "Getting work done while stuck home"] },
    { q: "What is your partner's dessert of choice?", options: ["Chocolate anything", "Something fruity and light", "Ice cream in any form", "They usually skip dessert"] },
    { q: "How does your partner like to unwind after work?", options: ["Zoning out to TV or their phone", "A workout or physical activity", "Talking through their day with someone", "A quiet solo activity like reading or a bath"] },
    { q: "What is your partner's music preference while driving?", options: ["Loud sing-along hits", "Chill background vibes", "A podcast or talk radio", "Silence, they like to think"] },
    { q: "How does your partner feel about spicy food?", options: ["The spicier the better", "A little heat is nice", "Mild only, please", "They cannot handle spice at all"] },
    { q: "What is your partner's preferred way to travel?", options: ["Fly, get there fast", "Road trip, enjoy the journey", "Train, relaxed and scenic", "They do not love traveling much"] },
    { q: "How does your partner organize their space?", options: ["Immaculate, everything in its place", "Organized chaos that only they understand", "Cluttered but they know where things are", "It swings between spotless and disaster"] },
    { q: "What is your partner's ideal Friday night?", options: ["Out with friends and energy", "A cozy night in with you", "A nice dinner somewhere new", "Whatever requires the least effort"] },
    { q: "How does your partner take their tea or coffee?", options: ["Black, no additions", "With milk and sugar", "Fancy and flavored", "They switch it up constantly"] },
    { q: "What kind of vacation activity excites your partner most?", options: ["Exploring museums and culture", "Adventure sports and thrills", "Lounging and doing nothing", "Eating their way through the trip"] },
    { q: "How does your partner prefer to shop?", options: ["In person, they need to see it", "Online, from the couch", "They avoid shopping entirely", "They love browsing with no goal"] },
    { q: "What is your partner's screen-time weakness?", options: ["Endless social media scrolling", "Binge-watching series", "Gaming for hours", "YouTube rabbit holes"] },
    { q: "How does your partner feel about mornings versus nights?", options: ["Total morning person", "Night owl through and through", "Neither, they are always tired", "Depends on the day"] },
    { q: "What is your partner's comfort TV rewatch?", options: ["A classic sitcom they know by heart", "A drama they love returning to", "A reality show for background noise", "A movie they can quote entirely"] },
    { q: "How does your partner like their weekends structured?", options: ["Fully booked with plans", "One thing planned, rest open", "Completely free and spontaneous", "Productive with a big to-do list"] },
    { q: "What is your partner's favorite kind of snack?", options: ["Salty and crunchy", "Sweet and indulgent", "Healthy like fruit or nuts", "Whatever is in front of them"] },
    { q: "How does your partner feel about big crowds?", options: ["They thrive in the energy", "Fine in small doses", "They tolerate it but get drained", "They avoid crowds whenever possible"] },
    { q: "What is your partner's dream weekend getaway?", options: ["A beach escape", "A mountain cabin retreat", "A vibrant city break", "A wellness or spa trip"] },
    { q: "How does your partner decorate for the holidays?", options: ["All out, the more the better", "Tasteful and minimal", "One or two token pieces", "They do not bother"] },
    { q: "What is your partner's ideal breakfast?", options: ["A big savory spread", "Something sweet like pancakes", "Just coffee and maybe toast", "They usually skip it"] },
    { q: "How does your partner feel about board games?", options: ["Competitive and loves them", "Fun casually, no big deal", "Only if others really want to", "They find them tedious"] },
    { q: "What is your partner's preferred workout time?", options: ["First thing in the morning", "During their lunch break", "In the evening to decompress", "Whenever they can squeeze it in, if ever"] },
    { q: "How does your partner feel about trying new restaurants?", options: ["Always up for something new", "Prefers proven favorites", "Open but nervous about it", "Depends on the reviews"] },
    { q: "What is your partner's go-to comfort movie genre?", options: ["A feel-good comedy", "A nostalgic classic", "A cozy romance", "An animated favorite"] },
    { q: "How does your partner handle a free afternoon?", options: ["Fills it with a project or errand", "Naps or fully relaxes", "Calls someone or makes plans", "Gets lost in a hobby"] },
    { q: "What is your partner's beverage of choice at a bar?", options: ["A classic cocktail", "Beer or something casual", "Wine, they know their preferences", "Something non-alcoholic"] },
    { q: "How does your partner feel about waking up to an alarm?", options: ["Up on the first ring", "Multiple snoozes required", "They dread it every day", "They rarely need one"] },
    { q: "What is your partner's ideal night's sleep environment?", options: ["Pitch black and silent", "Some white noise or a fan", "Cool with lots of blankets", "They can sleep through anything"] },
    { q: "How does your partner prefer to celebrate good news?", options: ["Going out to mark the occasion", "A quiet toast at home", "Telling everyone they know", "A nice meal to celebrate"] },
    { q: "What is your partner's relationship with plants?", options: ["A proud plant parent", "Kills every plant they touch", "Has a few low-maintenance ones", "No interest in plants"] },
    { q: "How does your partner feel about reality competition shows?", options: ["Obsessed and invested", "Watches casually", "Cannot stand them", "Only cooking or talent ones"] },
    { q: "What is your partner's preferred way to receive news?", options: ["Reading articles", "Watching or listening", "Through social media", "They avoid the news"] },
    { q: "How does your partner feel about themed parties?", options: ["Loves an excuse to dress up", "Will participate but not go overboard", "Reluctant but a good sport", "Would rather not"] },
    { q: "What is your partner's favorite type of weather to sleep in?", options: ["Rainy and stormy", "Cool and crisp", "Warm with a breeze", "It does not matter to them"] },
    { q: "How does your partner feel about long phone calls?", options: ["Loves them and talks for hours", "Prefers keeping them short", "Would rather text", "Only with certain people"] },
    { q: "What is your partner's ideal way to celebrate a small win at work?", options: ["A treat like a nice coffee or snack", "Telling you all about it", "Buying themselves something", "Quietly moving on to the next thing"] },
    { q: "How does your partner feel about camping?", options: ["Loves being in nature", "Glamping only, please", "Will do it occasionally", "Absolutely not, no thank you"] },
    { q: "What is your partner's approach to fashion?", options: ["Trendy and always current", "Classic and timeless", "Comfort above all", "They put in minimal effort"] },
    { q: "How does your partner like to spend a birthday morning?", options: ["Sleeping in luxuriously", "A special breakfast", "Being showered with attention", "Treating it like a normal day"] },
    { q: "What is your partner's preferred movie theater snack?", options: ["Buttery popcorn", "Candy or sweets", "A soft drink or slushie", "They sneak in their own snacks"] },
    { q: "How does your partner feel about surprise visitors?", options: ["Loves the spontaneity", "Fine if they get a heads up", "Stressed by the mess and prep", "Prefers no unannounced guests"] },
    { q: "What is your partner's ideal Sunday?", options: ["Rest and total recovery", "Prepping for the week ahead", "A fun outing before Monday", "Slow morning then productivity"] },
    { q: "How does your partner take their burgers?", options: ["Loaded with everything", "Simple and classic", "Something gourmet or unusual", "They prefer a veggie or alternative option"] },
    { q: "What is your partner's music discovery style?", options: ["Always hunting for new artists", "Loyal to their old favorites", "Whatever is trending", "They let playlists decide"] },
    { q: "How does your partner feel about spicy debates or heated topics?", options: ["Loves a good passionate debate", "Engages but stays calm", "Avoids conflict entirely", "Only debates things they care about"] },
    { q: "What is your partner's preferred way to exercise their brain?", options: ["Puzzles and games", "Reading and learning", "Deep conversations", "They would rather rest their brain"] },
    { q: "How does your partner feel about early morning flights?", options: ["Worth it to maximize the day", "A necessary evil", "They would rather pay for a later one", "They dread them completely"] },
    { q: "What is your partner's go-to order at a diner?", options: ["Breakfast food any time of day", "A classic burger and fries", "Comfort food like a melt or soup", "Something different every time"] },
    { q: "How does your partner feel about dancing?", options: ["First one on the dance floor", "Needs a little push but enjoys it", "Prefers to watch", "Two left feet and proud of it"] },
    { q: "What is your partner's ideal amount of alone time?", options: ["A lot, they recharge in solitude", "A little each day is enough", "Barely any, they love company", "It varies with their mood"] },
    { q: "How does your partner feel about spontaneous road trips?", options: ["Grab keys and go", "Fun with a rough plan", "Prefers everything mapped out", "Would rather stay put"] },
    { q: "What is your partner go-to pizza topping?", options: ["Classic pepperoni", "Loaded with veggies", "Something unusual", "Plain cheese, always"] },
    { q: "How does your partner prefer their steak?", options: ["Rare and red", "Medium", "Well done", "They do not eat steak"] },
    { q: "What is your partner ideal thermostat setting?", options: ["Cold, they run warm", "Toasty and cozy", "Right in the middle", "They are never satisfied"] },
    { q: "How does your partner feel about spicy snacks?", options: ["The hotter the better", "A little kick is nice", "Mild only", "No spice at all"] },
    { q: "What is your partner favorite kind of chocolate?", options: ["Dark", "Milk", "White", "They prefer other sweets"] },
    { q: "How does your partner like their pasta?", options: ["Creamy sauces", "Tomato based", "Loaded with garlic", "Simple with oil"] },
    { q: "What is your partner preferred way to wake up?", options: ["Naturally, no alarm", "A gentle alarm", "Blasting music", "Multiple snoozes"] },
    { q: "How does your partner feel about long museum visits?", options: ["Loves every exhibit", "Enjoys the highlights", "Gets tired quickly", "Would rather skip it"] },
    { q: "What is your partner favorite kind of chips?", options: ["Plain salted", "Bold flavored", "Kettle cooked", "They avoid chips"] },
    { q: "How does your partner take their toast?", options: ["Butter only", "Jam or honey", "Savory toppings", "Barely toasted"] },
    { q: "What is your partner ideal amount of sleep?", options: ["A solid eight hours", "Six is plenty", "As much as possible", "It varies wildly"] },
    { q: "How does your partner feel about surprise phone calls?", options: ["Loves an unexpected chat", "Fine if brief", "Would rather text first", "Screens most calls"] },
    { q: "What is your partner favorite type of cheese?", options: ["Sharp and aged", "Soft and creamy", "Mild and everyday", "Not a cheese fan"] },
    { q: "How does your partner prefer their coffee strength?", options: ["Strong and bold", "Medium and smooth", "Light and mild", "Mostly milk and sugar"] },
    { q: "What is your partner ideal weekend morning?", options: ["Early and productive", "Slow and lazy", "Out for breakfast", "Sleeping in fully"] },
    { q: "How does your partner feel about hot versus iced drinks?", options: ["Always hot", "Always iced", "Depends on weather", "Whatever is offered"] },
    { q: "What is your partner favorite fast food indulgence?", options: ["Burgers and fries", "Fried chicken", "Tacos", "They avoid fast food"] },
    { q: "How does your partner like their popcorn?", options: ["Extra buttery", "Lightly salted", "Sweet caramel", "Not a popcorn person"] },
    { q: "What is your partner preferred seat on a plane?", options: ["Window for the view", "Aisle for the legroom", "Middle, they do not mind", "They dislike flying entirely"] },
    { q: "How does your partner feel about themed restaurants?", options: ["Loves the novelty", "Fun once in a while", "Prefers regular spots", "Not their thing"] },
    { q: "What is your partner favorite ice cream flavor?", options: ["Chocolate", "Vanilla", "Something fruity", "Something adventurous"] },
    { q: "How does your partner organize their phone?", options: ["Everything in neat folders", "Apps scattered everywhere", "Only the essentials on screen", "Total chaos"] },
    { q: "What is your partner ideal way to spend a gift card?", options: ["On food", "On clothes", "On experiences", "They save it forever"] },
    { q: "How does your partner feel about early bedtimes?", options: ["Loves being in bed early", "Prefers staying up late", "It depends on the day", "They fight sleep constantly"] },
    { q: "What is your partner favorite breakfast drink?", options: ["Coffee", "Tea", "Juice", "Just water"] },
    { q: "How does your partner feel about crowded beaches?", options: ["Loves the lively energy", "Fine for a bit", "Prefers quiet spots", "Avoids the beach"] },
    { q: "What is your partner go-to sandwich?", options: ["Classic deli meat", "Grilled cheese", "Something veggie", "Whatever is around"] },
    { q: "How does your partner like their weekend planned?", options: ["Packed with plans", "One anchor plan", "Totally open", "Chores first, fun later"] },
    { q: "What is your partner favorite kind of soup?", options: ["Hearty and chunky", "Creamy and smooth", "Broth based", "They skip soup"] },
    { q: "How does your partner feel about loud restaurants?", options: ["Loves the buzz", "Tolerates it", "Prefers quiet dining", "Cannot stand it"] },
    { q: "What is your partner preferred workout style?", options: ["Cardio", "Weights", "Group classes", "They skip the gym"] },
    { q: "How does your partner like their eggs at brunch?", options: ["Scrambled", "Poached", "In an omelette", "They pass on eggs"] },
    { q: "What is your partner ideal seat at the movies?", options: ["Dead center", "Near the back", "Up front", "Wherever is open"] },
    { q: "How does your partner feel about surprise gifts?", options: ["Loves receiving them", "Prefers to be asked", "Feels awkward about it", "Would rather give than receive"] },
    { q: "What is your partner favorite way to eat potatoes?", options: ["Fried", "Mashed", "Baked", "Roasted"] },
    { q: "How does your partner handle a long car ride?", options: ["Music and singing", "Napping", "Deep conversation", "A podcast or audiobook"] },
    { q: "What is your partner preferred pace of eating?", options: ["Fast and efficient", "Slow and savoring", "Depends on the meal", "Distracted and grazing"] },
    { q: "How does your partner feel about waking up early on weekends?", options: ["Up with the sun anyway", "Sleeps in gladly", "Depends on plans", "Fights it every time"] },
    { q: "What is your partner favorite comfort drink at night?", options: ["Hot tea", "Warm milk or cocoa", "A glass of wine", "Just water"] },
    { q: "How does your partner feel about trying exotic foods?", options: ["Adventurous and eager", "Cautiously curious", "Prefers the familiar", "Sticks to what they know"] },
    { q: "What is your partner ideal type of hotel?", options: ["Luxury and pampering", "Boutique and unique", "Simple and clean", "Whatever is cheapest"] },
    { q: "How does your partner like their weekends to feel?", options: ["Exciting and full", "Restful and slow", "Social and connected", "Productive and accomplished"] },
    { q: "What is your partner favorite way to eat fruit?", options: ["Fresh and whole", "In a smoothie", "In a dessert", "They rarely eat fruit"] },
    { q: "How does your partner feel about board game nights?", options: ["Fiercely competitive", "Casually fun", "Only to please others", "Finds them tedious"] },
    { q: "What is your partner preferred kind of vacation souvenir?", options: ["A magnet or trinket", "Local food or drink", "A piece of art", "Just photos"] },
    { q: "How does your partner take their tea?", options: ["Plain", "Milk and sugar", "Honey and lemon", "Herbal, no additions"] },
    { q: "What is your partner ideal Friday evening plan?", options: ["Out on the town", "Cozy at home", "Dinner somewhere new", "Whatever is easiest"] },
    { q: "How does your partner feel about spontaneous plans?", options: ["Loves them", "Fine with warning", "Prefers a plan", "Dislikes surprises"] },
    { q: "What is your partner favorite kind of music for cleaning?", options: ["Upbeat pop", "Throwback hits", "Loud and energetic", "A podcast instead"] },
    { q: "How does your partner prefer to celebrate small wins?", options: ["A treat for themselves", "Telling everyone", "A quiet moment of pride", "On to the next thing"] },
    { q: "What is your partner go-to order at a cafe?", options: ["A strong espresso drink", "A sweet flavored latte", "Tea", "Something cold and blended"] },
    { q: "How does your partner feel about hiking?", options: ["Loves a challenging trail", "Enjoys an easy walk", "Only for the views", "Would rather not"] },
    { q: "What is your partner ideal number of pillows?", options: ["Just one", "Two or three", "A mountain of them", "None, flat is best"] },
    { q: "How does your partner feel about surprise days off?", options: ["Total joy", "Nice but restless", "They fill it with tasks", "They do not know what to do"] },
    { q: "What is your partner favorite kind of bread?", options: ["Crusty sourdough", "Soft white", "Whole grain", "They avoid bread"] },
    { q: "How does your partner like to plan a trip?", options: ["Every detail mapped out", "A loose outline", "Book and wing it", "Let someone else plan"] },
    { q: "What is your partner preferred late-night snack?", options: ["Something salty", "Something sweet", "Leftovers", "They do not snack late"] },
    { q: "How does your partner feel about big shopping trips?", options: ["Loves browsing for hours", "In and out fast", "Only online", "Avoids shopping"] },
    { q: "What is your partner ideal type of movie night?", options: ["A new release", "A comfort rewatch", "A themed marathon", "Whatever is trending"] },
    { q: "How does your partner take their burger?", options: ["Fully loaded", "Simple and classic", "Gourmet style", "A veggie option"] },
    { q: "What is your partner favorite season for activities?", options: ["Summer adventures", "Autumn coziness", "Winter fun", "Spring freshness"] },
    { q: "How does your partner feel about waking to natural light?", options: ["Loves it, curtains open", "Prefers total darkness", "Does not notice", "Depends on the day"] },
    { q: "What is your partner go-to breakfast on a busy day?", options: ["A grab-and-go bar", "Coffee only", "Something quick and hot", "They skip it"] },
    { q: "How does your partner feel about dinner parties?", options: ["Loves hosting", "Loves attending", "Prefers small ones", "Would rather not"] },
    { q: "What is your partner preferred kind of dessert?", options: ["Rich and chocolatey", "Light and fruity", "Creamy like ice cream", "They skip dessert"] },
    { q: "How does your partner handle a rainy weekend?", options: ["Cozy inside all day", "Out despite the rain", "Catching up on tasks", "Sleeping it away"] },
    { q: "What is your partner favorite way to drink water?", options: ["Ice cold", "Room temperature", "Sparkling", "With lemon or flavor"] },
    { q: "How does your partner feel about karaoke nights?", options: ["First to the mic", "Needs warming up", "Happy to watch", "Avoids it entirely"] },
    { q: "What is your partner ideal weekend outing?", options: ["A hike or nature trip", "A market or festival", "A museum or gallery", "A cozy cafe"] },
    { q: "How does your partner like their salad?", options: ["Loaded with everything", "Simple and fresh", "Heavy on dressing", "They avoid salad"] },
    { q: "What is your partner preferred way to relax at night?", options: ["A show or movie", "Reading", "A warm bath", "Scrolling their phone"] },
    { q: "How does your partner feel about trying new coffee shops?", options: ["Always exploring", "Loyal to favorites", "Open but hesitant", "Prefers home brewing"] },
    { q: "What is your partner favorite kind of weather to walk in?", options: ["Warm and sunny", "Cool and crisp", "Light rain", "They avoid walking outdoors"] },
    { q: "How does your partner feel about surprise weekend getaways?", options: ["Absolutely loves them", "Loves them with notice", "Prefers to plan", "Would rather stay home"] },
    { q: "What is your partner go-to takeaway cuisine?", options: ["Pizza", "Chinese or Thai", "Burgers", "Something healthy"] },
    { q: "How does your partner like their bedroom at night?", options: ["Pitch black", "A soft nightlight", "Cool and airy", "Warm and cozy"] },
    { q: "What is your partner ideal way to spend a bonus?", options: ["A big splurge", "A trip", "Save it all", "Treat loved ones"] },
    { q: "How does your partner feel about spontaneous dance parties?", options: ["Instantly joins in", "Warms up to it", "Prefers to watch", "Not their vibe"] },
    { q: "What is your partner favorite kind of tea time treat?", options: ["A pastry", "Cookies or biscuits", "Fresh fruit", "Nothing, just the drink"] },
    { q: "How does your partner prefer to spend a public holiday?", options: ["A big event or outing", "Relaxing at home", "Time with family", "Catching up on rest"] },
    { q: "What is your partner favorite kind of breakfast on vacation?", options: ["A big buffet", "Room service", "A local cafe", "Skipping it to explore"] },
    { q: "How does your partner feel about matching outfits or looks?", options: ["Loves the idea", "Only subtly", "Finds it cheesy", "Absolutely not"] },
    { q: "What is your partner ideal noise level for focus?", options: ["Complete silence", "Soft background music", "A busy cafe hum", "Anything works"] },
    { q: "How does your partner like their weekends to end?", options: ["Prepping for the week", "One last fun thing", "Early to bed", "Relaxing until the last minute"] },
    { q: "What is your partner favorite kind of warm drink in winter?", options: ["Hot chocolate", "Spiced tea", "A latte", "Mulled cider"] },
    { q: "How does your partner feel about long brunches?", options: ["Loves lingering for hours", "Enjoys them occasionally", "Prefers a quick bite", "Would rather do lunch"] },
    { q: "What is your partner preferred way to unwind on Sunday?", options: ["A slow morning", "A nature walk", "Meal prepping", "Doing nothing at all"] },
    { q: "How does your partner feel about eating dessert first?", options: ["Absolutely, life is short", "Only sometimes", "Never, save the best", "They skip dessert anyway"] },
    { q: "What is your partner favorite type of holiday film?", options: ["A festive classic", "A cheesy romance", "A family comedy", "They skip holiday films"] },
    { q: "How does your partner like their eggs on toast?", options: ["Runny yolk", "Fully cooked", "Scrambled on top", "No eggs for them"] },
    { q: "What is your partner ideal way to spend a snow day?", options: ["Playing outside", "Cozy inside", "Getting work done", "Sleeping in"] },
    { q: "How does your partner feel about spicy curry?", options: ["Bring the heat", "Medium is perfect", "Mild please", "Not a curry fan"] },
    { q: "What is your partner favorite kind of park activity?", options: ["A picnic", "A long walk", "People watching", "A game or sport"] },
    { q: "How does your partner prefer their morning to start?", options: ["Quiet and slow", "Active and moving", "With coffee first", "Straight into tasks"] },
    { q: "What is your partner go-to comfort meal?", options: ["Something warm and hearty", "Comfort carbs", "A childhood favorite", "Something sweet"] },
    { q: "How does your partner feel about trying trendy diets?", options: ["Loves experimenting", "Curious but casual", "Skeptical", "Ignores them entirely"] },
    { q: "What is your partner favorite way to enjoy a beach day?", options: ["Swimming and playing", "Lounging and reading", "Walking the shore", "Finding shade and snacks"] },
    { q: "How does your partner like their weekend coffee?", options: ["Slow and savored", "On the go", "A special treat drink", "Homemade and simple"] },
    { q: "What is your partner ideal type of night out?", options: ["Dancing", "A nice dinner", "A show or concert", "A quiet bar"] },
    { q: "How does your partner feel about spontaneous shopping?", options: ["Loves an impulse buy", "Only for a deal", "Feels guilty after", "Never impulsive"] },
    { q: "What is your partner favorite kind of nut or trail snack?", options: ["Salty roasted nuts", "Sweet trail mix", "Fresh or dried fruit", "They prefer other snacks"] },
    { q: "How does your partner prefer to spend a quiet evening?", options: ["Reading", "A show", "A hobby", "Just relaxing together"] },
    { q: "What is your partner ideal type of birthday cake?", options: ["Chocolate", "Vanilla", "Something fruity", "An ice cream cake"] },
    { q: "How does your partner feel about early flights for a trip?", options: ["Worth it to gain the day", "A necessary evil", "Would pay to avoid", "They dread it"] },
    { q: "What is your partner favorite way to eat noodles?", options: ["In a rich broth", "Stir fried", "Cold and refreshing", "Saucy and hearty"] },
    { q: "How does your partner like to spend a holiday morning?", options: ["Sleeping in", "A big breakfast", "Opening surprises", "Treating it as normal"] },
    { q: "What is your partner ideal way to cool down in summer?", options: ["A cold drink", "A swim", "The air conditioning", "Ice cream"] },
    { q: "How does your partner feel about surprise house guests?", options: ["Loves the company", "Fine with a heads up", "Stressed by it", "Prefers no drop-ins"] },
    { q: "What is your partner favorite kind of pancake topping?", options: ["Syrup", "Fresh fruit", "Chocolate or sweet spread", "They prefer savory breakfast"] },
    { q: "How does your partner prefer to spend a free evening at home?", options: ["A movie", "A project or hobby", "Calling someone", "Total rest"] },
    { q: "What is your partner ideal type of getaway?", options: ["Beach escape", "City break", "Mountain retreat", "Wellness or spa trip"] },
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
    { q: "What dream does your partner think about but rarely says out loud?", options: ["Leaving it all to travel the world", "Writing, creating, or performing something", "Starting a business of their own", "Building a big, close-knit family"] },
    { q: "What would your partner do with a fully free year and no obligations?", options: ["Travel to as many places as possible", "Master a skill they have always wanted", "Rest and finally recover from burnout", "Launch that project they keep postponing"] },
    { q: "What kind of impact does your partner hope to have on the world?", options: ["Changing individual lives directly", "Creating something lasting and scalable", "Raising a family that carries good values forward", "Quietly making their community better"] },
    { q: "Where does your partner picture growing old?", options: ["By the ocean somewhere warm", "In a lively city that never slows down", "In the peaceful countryside", "Wherever their loved ones are"] },
    { q: "What milestone is your partner most eager to reach next?", options: ["A career breakthrough", "A financial goal like buying property", "A relationship milestone", "A personal achievement or challenge"] },
    { q: "What does your partner secretly want to be famous for?", options: ["A creative work", "A groundbreaking idea or invention", "Being an inspiring leader", "They have no desire for fame"] },
    { q: "What adventure is at the top of your partner's list?", options: ["Seeing a natural wonder in person", "An extreme experience like skydiving", "A long solo or couples expedition", "Living abroad for a while"] },
    { q: "What would your partner's ideal work-life balance look like?", options: ["Work hard now, retire early", "Flexible remote work forever", "A passion project as their full-time job", "Minimal work, maximum living"] },
    { q: "What dream would your partner chase if failure were impossible?", options: ["A wildly ambitious creative pursuit", "Starting a company from nothing", "A complete career reinvention", "A bold move to a new country"] },
    { q: "What kind of home does your partner most want to build a life in?", options: ["A cozy place full of warmth and character", "A sleek modern dream house", "A property with land and space", "Somewhere that changes as they travel"] },
    { q: "What does your partner want to be doing at 50?", options: ["Enjoying the fruits of early success", "Still building something meaningful", "Traveling and living freely", "Surrounded by a thriving family"] },
    { q: "What legacy project would your partner love to leave behind?", options: ["A book, film, or body of work", "A business that outlives them", "A foundation for a cause they love", "A family story worth passing down"] },
    { q: "What place does your partner dream of living for a season?", options: ["A tropical island", "A romantic European city", "A remote mountain town", "A bustling global metropolis"] },
    { q: "What is your partner's boldest financial dream?", options: ["Complete financial freedom", "Owning multiple properties", "Building generational wealth", "Enough to never worry, nothing more"] },
    { q: "What skill does your partner dream of mastering later in life?", options: ["A musical instrument", "A new language", "An art form like painting or writing", "A physical discipline like dance or martial arts"] },
    { q: "What kind of parent or mentor does your partner hope to become?", options: ["The wise and patient guide", "The fun and adventurous one", "The steady and dependable rock", "The one who champions others' dreams"] },
    { q: "What does your partner dream your life together will look like in twenty years?", options: ["Settled, secure, and deeply content", "Still adventuring and exploring together", "Surrounded by family you built", "Free to do whatever you want, whenever"] },
    { q: "What cause would your partner devote their life to if they could?", options: ["Education and opportunity", "Health and human dignity", "The environment and the planet", "Justice and equality"] },
    { q: "What is your partner's ultimate travel dream?", options: ["Visiting every continent", "A long slow trip with no return date", "Retracing their heritage or roots", "One unforgettable trip of a lifetime"] },
    { q: "What does your partner wish they had more courage to pursue?", options: ["A creative dream they set aside", "A big risky career leap", "A relationship or life change", "An adventure they keep putting off"] },
    { q: "What kind of retirement does your partner fantasize about?", options: ["Traveling endlessly", "A quiet life near family", "Finally doing all their hobbies", "Somewhere sunny with zero stress"] },
    { q: "What would your partner attempt if they had a second life to live?", options: ["A completely different career", "Living in a totally different place", "Chasing a dream they gave up on", "The exact same life, they have no regrets"] },
    { q: "What future purchase is your partner most excited about?", options: ["A dream home", "A car they have always wanted", "A once-in-a-lifetime trip", "An investment in their own venture"] },
    { q: "What does your partner most want to teach the next generation?", options: ["Kindness and empathy", "Resilience and grit", "Curiosity and love of learning", "How to build something of their own"] },
    { q: "What dream vacation would your partner take with unlimited money?", options: ["A private island escape", "A world cruise", "A luxury safari", "A months-long grand tour"] },
    { q: "What is your partner's vision of the perfect family life?", options: ["A big lively household full of energy", "A small close-knit unit", "Extended family always around", "A chosen family of close friends"] },
    { q: "What would your partner build if they could start a nonprofit tomorrow?", options: ["One focused on children and education", "One tackling poverty or hunger", "One protecting the environment", "One supporting mental health"] },
    { q: "What does your partner dream of learning to overcome a fear?", options: ["Swimming or diving", "Flying or heights", "Public speaking", "Something physical and daring"] },
    { q: "What is your partner's dream way to make a living?", options: ["Doing creative work they love", "Running their own company", "Helping people directly", "Anything with total freedom and flexibility"] },
    { q: "What does your partner hope will define your relationship decades from now?", options: ["Still laughing together every day", "Having built a beautiful life together", "Never losing the spark", "Being each other's safe place through it all"] },
    { q: "What kind of retirement location does your partner picture?", options: ["A beach town", "A vibrant walkable city", "A quiet lakeside or forest home", "Traveling with no fixed home"] },
    { q: "What does your partner most want to accomplish before 40?", options: ["Financial stability", "A major career milestone", "Starting a family", "A personal dream or adventure"] },
    { q: "What dream does your partner think you two could achieve together?", options: ["Building a home from the ground up", "Traveling the world as a pair", "Starting a business together", "Raising an amazing family"] },
    { q: "What would your partner do with a surprise sabbatical?", options: ["Travel somewhere far", "Dive into a passion project", "Rest and reset completely", "Learn something entirely new"] },
    { q: "What is your partner's dream role in ten years?", options: ["Leading their own team or company", "Being an expert others look up to", "Working for themselves", "A role with meaning over money"] },
    { q: "What does your partner secretly hope the future holds for them?", options: ["Recognition for their work", "Peace and stability", "Freedom to live on their terms", "A deeply loving family life"] },
    { q: "What dream home feature does your partner most want?", options: ["A stunning kitchen", "A luxurious primary suite", "A big outdoor space", "A dedicated hobby or creative room"] },
    { q: "What kind of grandparent does your partner imagine being?", options: ["The spoiling, fun one", "The wise storyteller", "The adventurous globe-trotting one", "The always-present, hands-on one"] },
    { q: "What is your partner's dream way to give back?", options: ["Mentoring young people", "Donating to causes they love", "Volunteering hands-on", "Building something that helps many"] },
    { q: "What future experience does your partner most look forward to sharing with you?", options: ["A big trip abroad", "A milestone celebration", "Building a home together", "Growing old side by side"] },
    { q: "What does your partner dream of doing that scares them a little?", options: ["Quitting to chase a passion", "Moving somewhere brand new", "Putting their work out into the world", "A huge physical adventure"] },
    { q: "What kind of impact does your partner want their career to have?", options: ["Improving people's daily lives", "Advancing an entire field", "Creating jobs and opportunity", "Inspiring the next generation"] },
    { q: "What is your partner's dream possession someday?", options: ["A dream car", "A vacation home", "A boat or unique vehicle", "They dream of experiences, not things"] },
    { q: "What does your partner want to look back on with the most pride?", options: ["The family they raised", "The work they created", "The lives they touched", "The obstacles they overcame"] },
    { q: "What is your partner's biggest hope for your future together?", options: ["Lasting happiness and peace", "Shared adventures and memories", "A strong, secure foundation", "Growing better together, never apart"] },
    { q: "What dream would your partner sacrifice comfort to achieve?", options: ["A creative or artistic breakthrough", "Building a business", "Making a real difference somewhere", "A life-changing adventure"] },
    { q: "What place does your partner most want you two to see together?", options: ["A romantic bucket-list destination", "A remote natural wonder", "A city neither of you has been to", "Somewhere tied to your heritage"] },
    { q: "What is the dream your partner is quietly working toward right now?", options: ["A career goal they rarely mention", "A financial target", "A personal transformation", "A shared future with you"] },
    { q: "What does your partner hope people say about them at the end?", options: ["That they were deeply kind", "That they achieved something remarkable", "That they loved fully", "That they made the world a little better"] },
    { q: "What kind of adventure does your partner want to have in their 30s?", options: ["Traveling extensively", "Taking a big career risk", "Starting a family", "Chasing a personal passion"] },
    { q: "What does your partner most want financial freedom for?", options: ["Time with the people they love", "The ability to travel anytime", "Never worrying about the future", "The freedom to help others"] },
    { q: "What dream project would your partner love to work on with you?", options: ["Renovating or building a home", "Planning an epic trip", "Launching something creative", "Raising a family together"] },
    { q: "What is your partner's idea of the perfect future daily routine?", options: ["Slow mornings and meaningful work", "Active days full of movement and people", "Flexible days with room to wander", "Simple, peaceful, and unrushed"] },
    { q: "What does your partner dream of being remembered as within the family?", options: ["The heart that held everyone together", "The one who built the foundation", "The adventurer with the best stories", "The wise one everyone came to"] },
    { q: "What does your partner dream of doing on their fiftieth birthday?", options: ["A once-in-a-lifetime trip", "A big celebration with loved ones", "A quiet meaningful day", "Something bold and adventurous"] },
    { q: "What is your partner ultimate creative dream?", options: ["Writing a book", "Making music", "Creating visual art", "Producing a film or show"] },
    { q: "What does your partner want to have accomplished by next year?", options: ["A career step forward", "A financial goal", "A personal challenge", "A relationship milestone"] },
    { q: "What dream city does your partner want to live in briefly?", options: ["A vibrant global capital", "A romantic old-world city", "A laid-back coastal town", "A quiet mountain place"] },
    { q: "What is your partner biggest dream for their health?", options: ["Lifelong strength and energy", "Peace of mind and calm", "Running a major physical feat", "Simply staying active and well"] },
    { q: "What does your partner hope to build with their hands someday?", options: ["A home", "A piece of furniture", "A garden", "A business"] },
    { q: "What dream trip does your partner most want to take with family?", options: ["A big reunion vacation", "A heritage or roots trip", "A theme park adventure", "A relaxing beach holiday"] },
    { q: "What is your partner secret dream job?", options: ["An artist or performer", "A world traveler paid to explore", "A leader of their own company", "A helper in a caring field"] },
    { q: "What does your partner dream of learning in retirement?", options: ["A new language", "An instrument", "A craft or trade", "A field of study"] },
    { q: "What legacy does your partner most want to leave for children?", options: ["Strong values", "Financial security", "A love of learning", "Wonderful memories"] },
    { q: "What is your partner dream way to celebrate a major win?", options: ["A lavish trip", "A big party", "A quiet reflection", "Sharing it with loved ones"] },
    { q: "What does your partner hope the next decade brings?", options: ["Stability and peace", "Adventure and growth", "Family and connection", "Freedom and flexibility"] },
    { q: "What dream skill would your partner love to be effortless at?", options: ["Public speaking", "Cooking", "An art form", "A sport"] },
    { q: "What is your partner biggest hope for their career?", options: ["Reaching the top", "Working on their own terms", "Doing meaningful work", "Financial security"] },
    { q: "What does your partner dream of owning one day?", options: ["A dream home", "A special car", "A piece of land", "A creative studio"] },
    { q: "What does your partner most want to teach others?", options: ["A skill they mastered", "A life lesson", "A love of something", "How to build something"] },
    { q: "What is your partner dream volunteer role?", options: ["Working with children", "Helping the vulnerable", "Protecting nature", "Supporting the arts"] },
    { q: "What future adventure does your partner most crave?", options: ["Seeing a natural wonder", "An extreme thrill", "A long expedition", "Living somewhere new"] },
    { q: "What does your partner dream your home will feel like?", options: ["Warm and full of life", "Calm and serene", "Elegant and refined", "Cozy and lived-in"] },
    { q: "What is your partner boldest dream for the two of you?", options: ["Traveling the world together", "Building a business together", "Raising a family", "Growing old in a dream place"] },
    { q: "What does your partner hope to master in their forties?", options: ["A creative pursuit", "Financial wisdom", "Physical fitness", "Inner peace"] },
    { q: "What is your partner dream way to give back later in life?", options: ["Mentoring", "Donating generously", "Volunteering hands-on", "Building something lasting"] },
    { q: "What does your partner dream of experiencing at least once?", options: ["Seeing the northern lights", "A safari", "A world cruise", "Living abroad"] },
    { q: "What is your partner biggest professional dream this year?", options: ["A promotion", "A new venture", "Recognition for their work", "More balance and flexibility"] },
    { q: "What does your partner hope your future daily life looks like?", options: ["Slow and meaningful", "Active and social", "Free and flexible", "Simple and peaceful"] },
    { q: "What dream would your partner chase if guaranteed success?", options: ["A creative masterpiece", "Their own company", "A total reinvention", "A bold move abroad"] },
    { q: "What is your partner ideal vision of family life?", options: ["A big lively household", "A small close unit", "Extended family nearby", "A chosen family of friends"] },
    { q: "What does your partner most want to be financially free for?", options: ["Time with loved ones", "Travel anytime", "Peace of mind", "Helping others"] },
    { q: "What is your partner dream contribution to the world?", options: ["Changing individual lives", "Building something scalable", "Raising good humans", "Bettering their community"] },
    { q: "What does your partner picture for their golden years?", options: ["Traveling freely", "Near family", "Pursuing hobbies", "A calm sunny life"] },
    { q: "What dream project would your partner love to tackle with you?", options: ["Renovating a home", "Planning an epic trip", "Starting something creative", "Raising a family"] },
    { q: "What does your partner hope defines your relationship in the future?", options: ["Still laughing daily", "A beautiful shared life", "Never losing the spark", "Being each other safe place"] },
    { q: "What is your partner dream way to spend a free year?", options: ["Traveling everywhere", "A passion project", "Resting fully", "Deep learning"] },
    { q: "What future milestone excites your partner the most?", options: ["A career breakthrough", "Buying property", "A relationship step", "A personal achievement"] },
    { q: "What is your partner dream retirement location?", options: ["A beach town", "A lively city", "A quiet countryside", "Traveling with no fixed home"] },
    { q: "What does your partner secretly dream of being known for?", options: ["A creative work", "A big idea", "Inspiring leadership", "Nothing, they avoid fame"] },
    { q: "What is your partner most ambitious travel dream?", options: ["Every continent", "A never-ending trip", "Retracing their roots", "One epic journey"] },
    { q: "What does your partner wish they had courage to pursue?", options: ["A creative dream", "A risky career leap", "A big life change", "An adventure they postpone"] },
    { q: "What is your partner dream way to work?", options: ["Creative and free", "Running their own thing", "Helping people directly", "Total flexibility"] },
    { q: "What does your partner hope people say about them one day?", options: ["That they were kind", "That they achieved a lot", "That they loved fully", "That they made things better"] },
    { q: "What is your partner dream home feature?", options: ["A stunning kitchen", "A dreamy bedroom suite", "A big outdoor space", "A hobby room"] },
    { q: "What kind of grandparent does your partner dream of being?", options: ["The fun spoiling one", "The wise storyteller", "The adventurous one", "The always-present one"] },
    { q: "What does your partner dream of overcoming one day?", options: ["A lifelong fear", "A limiting habit", "A personal doubt", "An old wound"] },
    { q: "What future purchase does your partner dream about?", options: ["A dream home", "A special vehicle", "A trip of a lifetime", "An investment in themselves"] },
    { q: "What is your partner biggest dream for their community?", options: ["Better education", "More opportunity", "A cleaner environment", "Stronger connection"] },
    { q: "What does your partner dream of learning to make?", options: ["Gourmet meals", "Beautiful art", "Music", "Something handmade"] },
    { q: "What is your partner dream way to spend a windfall?", options: ["Secure the future", "Travel the world", "Buy the dream home", "Help those they love"] },
    { q: "What does your partner most look forward to sharing with you?", options: ["A big trip", "A milestone", "Building a home", "Growing old together"] },
    { q: "What dream would your partner sacrifice comfort to reach?", options: ["A creative breakthrough", "Building a business", "Making a difference", "A life-changing adventure"] },
    { q: "What place does your partner most dream of seeing with you?", options: ["A romantic bucket-list spot", "A remote natural wonder", "A brand-new city", "Somewhere tied to heritage"] },
    { q: "What quiet dream is your partner working toward right now?", options: ["A career goal", "A financial target", "A personal change", "A shared future"] },
    { q: "What kind of adventure does your partner dream of in their thirties?", options: ["Extensive travel", "A big career risk", "Starting a family", "A personal passion"] },
    { q: "What does your partner dream your future together looks like in twenty years?", options: ["Settled and content", "Still adventuring", "Surrounded by family", "Free to do anything"] },
    { q: "What cause would your partner devote their life to?", options: ["Education", "Human dignity", "The planet", "Justice and equality"] },
    { q: "What does your partner dream of building for the next generation?", options: ["A family legacy", "A business", "A charity", "A body of work"] },
    { q: "What is your partner dream way to make a living someday?", options: ["Creative work", "Their own company", "Helping others", "Anything flexible"] },
    { q: "What future experience does your partner most anticipate?", options: ["A big trip abroad", "A milestone celebration", "Building a home", "Growing old side by side"] },
    { q: "What does your partner dream of doing that scares them?", options: ["Quitting to chase a passion", "Moving somewhere new", "Sharing their work publicly", "A big physical feat"] },
    { q: "What impact does your partner dream their career will have?", options: ["Improving daily lives", "Advancing a field", "Creating opportunity", "Inspiring others"] },
    { q: "What does your partner dream of achieving before forty?", options: ["Financial stability", "A career milestone", "Starting a family", "A personal dream"] },
    { q: "What dream vacation would your partner take with unlimited funds?", options: ["A private island", "A world cruise", "A luxury safari", "A grand tour"] },
    { q: "What does your partner most want to feel proud of one day?", options: ["The family they raised", "The work they made", "The lives they touched", "What they overcame"] },
    { q: "What is your partner biggest hope for your future together?", options: ["Lasting happiness", "Shared adventures", "A secure foundation", "Growing better together"] },
    { q: "What does your partner dream of teaching their kids most?", options: ["Kindness", "Resilience", "Curiosity", "Self-reliance"] },
    { q: "What is your partner dream role in ten years?", options: ["Leading their own team", "An expert others admire", "Working for themselves", "A role with meaning"] },
    { q: "What does your partner secretly hope the future holds?", options: ["Recognition", "Peace and stability", "Freedom on their terms", "A loving family life"] },
    { q: "Where does your partner dream of spending a whole season?", options: ["A tropical island", "A European city", "A mountain town", "A busy metropolis"] },
    { q: "What is your partner boldest financial dream?", options: ["Complete freedom", "Owning property", "Generational wealth", "Enough to never worry"] },
    { q: "What skill does your partner hope to master in their later years?", options: ["An instrument", "A language", "An art form", "A physical discipline"] },
    { q: "What does your partner dream of doing on a full sabbatical?", options: ["Travel far", "A passion project", "Rest and reset", "Learn something new"] },
    { q: "What does your partner hope your home will always have?", options: ["Laughter", "Peace", "Warmth", "Room for people"] },
    { q: "What is your partner dream way to celebrate an anniversary far in the future?", options: ["Recreating your first trip", "A grand new adventure", "A quiet perfect day", "Surrounded by loved ones"] },
    { q: "What does your partner dream of accomplishing as a team with you?", options: ["Building a home", "Traveling widely", "Starting something together", "Raising a family"] },
    { q: "What future does your partner picture for their friendships?", options: ["Lifelong close bonds", "A wide circle", "A few deep ones", "A found family"] },
    { q: "What does your partner dream of being financially able to gift?", options: ["A home for family", "Dream trips for loved ones", "Support for a cause", "Freedom for their kids"] },
    { q: "What is your partner dream way to spend their days at seventy?", options: ["Traveling", "With grandchildren", "On hobbies", "Somewhere peaceful"] },
    { q: "What does your partner dream of writing or recording someday?", options: ["A memoir", "Letters for the future", "A family history", "A creative work"] },
    { q: "What is your partner dream way to reinvent themselves?", options: ["A new career", "A new city", "A new passion", "A whole new chapter"] },
    { q: "What does your partner most hope to pass down?", options: ["Wisdom", "Wealth", "Traditions", "A good name"] },
    { q: "What is your partner dream of the perfect future weekend?", options: ["Slow and restful", "Full of activity", "With family", "Just the two of you"] },
    { q: "What does your partner dream of doing to leave a mark?", options: ["Helping many people", "Creating something lasting", "Raising great kids", "Bettering their corner of the world"] },
    { q: "What is your partner biggest dream about personal growth?", options: ["Becoming more confident", "Finding real peace", "Living authentically", "Overcoming an old fear"] },
    { q: "What future does your partner dream of for their finances?", options: ["Total freedom", "Comfortable security", "Generational impact", "Simplicity and enough"] },
    { q: "What does your partner dream of experiencing with you next?", options: ["A new country", "A big life step", "A shared adventure", "A quiet milestone"] },
    { q: "What is your partner dream way to spend a milestone birthday?", options: ["A dream trip", "A joyful gathering", "A reflective retreat", "A bold new experience"] },
    { q: "What does your partner hope your love looks like decades from now?", options: ["Still playful", "Deeply peaceful", "Adventurous still", "A steady safe harbor"] },
    { q: "What is your partner dream about their creative legacy?", options: ["A finished body of work", "A business that lasts", "A cause they built", "A story worth telling"] },
    { q: "What does your partner dream of finally having time for?", options: ["Travel", "Hobbies", "Loved ones", "Rest"] },
    { q: "What is your partner dream way to serve others one day?", options: ["Teaching", "Building", "Giving", "Caring directly"] },
    { q: "What does your partner most dream your kids or future will inherit?", options: ["A loving home", "Financial security", "Big dreams", "Strong roots"] },
    { q: "What is your partner dream about their retirement lifestyle?", options: ["Endless travel", "Quiet by family", "Full of hobbies", "Sunny and stress-free"] },
    { q: "What does your partner dream of accomplishing that scares them a little?", options: ["A creative leap", "A brave move", "Putting work out there", "A physical challenge"] },
    { q: "What future does your partner picture for where you both live?", options: ["By the ocean", "In a lively city", "In the countryside", "Wherever family is"] },
    { q: "What is your partner dream way to celebrate reaching a big goal?", options: ["A trip", "A gathering", "A quiet reward", "Sharing it forward"] },
    { q: "What does your partner most want their story to say?", options: ["That they loved well", "That they built something", "That they lived boldly", "That they helped others"] },
    { q: "What is your partner dream about their impact on family?", options: ["Being the glue", "Building security", "Sharing adventures", "Being the wise one"] },
    { q: "What does your partner dream of learning to overcome a limitation?", options: ["A fear of water", "A fear of heights", "Stage fright", "A physical challenge"] },
    { q: "What is your partner dream about their ideal work-life balance?", options: ["Work hard, retire early", "Flexible forever", "Passion as work", "Minimal work, maximum life"] },
    { q: "What does your partner dream your relationship will be a model of?", options: ["Endless laughter", "Deep understanding", "Lasting passion", "Unshakable support"] },
    { q: "What is your partner dream possession for the future?", options: ["A dream car", "A vacation home", "A boat or unique vehicle", "Experiences, not things"] },
    { q: "What does your partner dream of being remembered for by friends?", options: ["Loyalty", "Fun", "Wisdom", "Warmth"] },
    { q: "What is your partner dream about the pace of their future life?", options: ["Slow and intentional", "Fast and exciting", "Balanced", "Free and unstructured"] },
    { q: "What does your partner dream of doing the moment they retire?", options: ["Book a big trip", "Start a passion project", "Rest completely", "Move somewhere new"] },
    { q: "What is your partner dream about the family traditions you build?", options: ["Annual trips", "Weekly rituals", "Holiday customs", "Personal ceremonies"] },
    { q: "What does your partner dream of becoming better at over time?", options: ["Patience", "Courage", "Presence", "Forgiveness"] },
    { q: "What is your partner dream about their future home location?", options: ["Near the water", "In the heart of a city", "Surrounded by nature", "Close to loved ones"] },
    { q: "What does your partner dream your shared adventures will look like?", options: ["Spontaneous and wild", "Planned and grand", "Cozy and simple", "Ever-changing"] },
    { q: "What is your partner biggest dream about their character?", options: ["To be truly kind", "To be brave", "To be wise", "To be steady"] },
    { q: "What does your partner dream of finally saying yes to?", options: ["A big adventure", "A career leap", "A creative risk", "A life change"] },
    { q: "What is your partner dream about the mark they leave on people?", options: ["Making them feel seen", "Inspiring them", "Supporting them", "Making them laugh"] },
    { q: "What does your partner most dream of doing before they are old?", options: ["Traveling everywhere", "Building their dream", "Starting a family", "Chasing a passion"] },
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
    { q: "What makes your partner feel most connected to you physically?", options: ["Slow, unhurried closeness", "Passionate, intense moments", "Long embraces with no agenda", "Gentle touch throughout the day"] },
    { q: "How does your partner most enjoy being kissed?", options: ["Slow and lingering", "Passionate and eager", "Soft and tender", "Playful and teasing"] },
    { q: "What sets the mood best for your partner?", options: ["Soft lighting and music", "A deep emotional conversation first", "Spontaneity and surprise", "A relaxed, unhurried evening"] },
    { q: "What does your partner find most romantic about closeness?", options: ["Feeling completely wanted", "The emotional vulnerability of it", "The undivided attention", "The comfort and safety of it"] },
    { q: "How does your partner like to be held afterward?", options: ["Wrapped up tightly and close", "Facing each other, talking softly", "Loosely, just touching", "They drift off happily to sleep"] },
    { q: "What is your partner's favorite kind of affection?", options: ["Cuddling on the couch", "Holding hands everywhere", "Playful teasing touches", "Long hugs that linger"] },
    { q: "How does your partner prefer romance to build?", options: ["Slowly, with anticipation", "Naturally, in the moment", "Through flirtation and play", "After feeling emotionally close"] },
    { q: "What makes your partner feel most desired?", options: ["Being told how attractive they are", "Being pursued and initiated with", "Feeling like your full focus", "Sweet unexpected gestures of wanting them"] },
    { q: "What is your partner's love for physical closeness rooted in?", options: ["Feeling emotionally safe", "The passion and chemistry", "The comfort and warmth", "Feeling truly wanted"] },
    { q: "How does your partner like to reconnect physically after time apart?", options: ["A long, tight embrace", "Slow reintroduction of closeness", "An eager, passionate reunion", "Just being wrapped up together"] },
    { q: "What non-physical thing most turns your partner on?", options: ["Confidence and self-assuredness", "Deep emotional intimacy", "A great sense of humor", "Being genuinely cared for"] },
    { q: "What is your partner's favorite intimate setting?", options: ["Cozy at home", "Somewhere new like a getaway", "By candlelight", "It does not matter, just being together"] },
    { q: "How does your partner feel about slow dancing together?", options: ["They melt for it", "They enjoy it in the right mood", "A little awkward but sweet", "Not really their thing"] },
    { q: "What form of affection does your partner crave most when tired?", options: ["Being held and comforted", "A gentle back or head rub", "Just lying close together", "Soft reassuring words and touch"] },
    { q: "How does your partner like intimacy to be initiated?", options: ["A slow build from cuddling", "A clear, confident move", "Playful flirting first", "A meaningful look you both understand"] },
    { q: "What makes an intimate moment unforgettable for your partner?", options: ["Deep eye contact and presence", "Raw passion and chemistry", "Feeling completely safe and open", "A sense of adventure and newness"] },
    { q: "How does your partner feel about morning cuddles?", options: ["The best part of waking up", "Nice when there is time", "They need to fully wake up first", "They are up and moving too fast for it"] },
    { q: "What physical gesture makes your partner feel most loved?", options: ["A forehead kiss", "A hand on the small of their back", "Fingers intertwined", "Being pulled in close"] },
    { q: "What atmosphere helps your partner relax into closeness?", options: ["Warm, dim, and quiet", "Playful and lighthearted", "Emotionally connected and safe", "Spontaneous and free"] },
    { q: "How does your partner like affection during everyday moments?", options: ["Constant little touches", "A big hug now and then", "Hand-holding while out", "A kiss whenever passing by"] },
    { q: "What makes your partner feel most attractive?", options: ["Genuine compliments from you", "The way you look at them", "Being pursued and wanted", "Feeling confident in their own skin"] },
    { q: "How does your partner feel about surprise romantic evenings?", options: ["Absolutely loves being surprised", "Prefers a little heads up", "Loves them if the timing is right", "Would rather plan it together"] },
    { q: "What does your partner most want to hear in an intimate moment?", options: ["How much you love them", "How attracted you are to them", "How safe they make you feel", "Reassurance that they are your one"] },
    { q: "How does your partner like affection to be paced?", options: ["Slow and gentle", "Passionate and spontaneous", "A mix depending on the mood", "Whatever feels natural in the moment"] },
    { q: "What is your partner's favorite way to end an intimate evening?", options: ["Wrapped up talking softly", "Falling asleep tangled together", "A warm shower or bath together", "Just holding each other in silence"] },
    { q: "What makes your partner feel emotionally close during physical closeness?", options: ["Eye contact and presence", "Whispered sweet words", "Slow, intentional touch", "Feeling fully accepted"] },
    { q: "How does your partner feel about affection in front of others?", options: ["Loves showing they are together", "Comfortable with subtle gestures", "Prefers to keep it private", "Depends entirely on the setting"] },
    { q: "What is your partner's favorite kind of hug?", options: ["A long, enveloping one", "A from-behind surprise hug", "A swaying, gentle sway", "A quick but meaningful squeeze"] },
    { q: "How does your partner feel about being the center of your attention romantically?", options: ["They love and crave it", "They enjoy it but get shy", "They prefer mutual focus", "They deflect but secretly love it"] },
    { q: "What builds anticipation best for your partner?", options: ["Teasing and playful flirting", "A romantic slow evening", "Knowing you are thinking of them", "A surprise element"] },
    { q: "How does your partner most like to show physical affection?", options: ["Initiating cuddles", "Reaching for your hand", "Playful nudges and touches", "Warm lingering hugs"] },
    { q: "What makes your partner feel cherished in tender moments?", options: ["Gentle words and reassurance", "Being held like they are precious", "Your full, undistracted presence", "Small caring gestures"] },
    { q: "How does your partner feel about spontaneous kisses?", options: ["Loves them, more please", "Sweet in the right moment", "Prefers them at home", "They are usually the one initiating"] },
    { q: "What is your partner's ideal romantic gesture?", options: ["A candlelit dinner at home", "A surprise weekend away", "A heartfelt note left for them", "Slow dancing in the living room"] },
    { q: "How does your partner respond to being pursued romantically?", options: ["They love feeling wanted", "They enjoy it but like to pursue too", "They get a little bashful", "They light up completely"] },
    { q: "What makes your partner feel safest opening up physically?", options: ["Feeling emotionally secure first", "Knowing there is no pressure", "A warm, private setting", "Your patience and gentleness"] },
    { q: "How does your partner like affection when they are feeling down?", options: ["Just to be held", "Gentle reassuring touch", "Closeness without any expectation", "A comforting hand to hold"] },
    { q: "What is your partner's favorite intimate ritual?", options: ["A goodnight kiss every night", "Morning cuddles before rising", "A shared bath or shower", "Falling asleep holding hands"] },
    { q: "How does your partner feel about writing or receiving romantic notes?", options: ["They treasure every one", "They enjoy it occasionally", "They prefer spoken words", "They are shy but secretly love it"] },
    { q: "What makes your partner feel most connected in a quiet moment?", options: ["Resting their head on you", "A shared knowing glance", "Soft conversation in the dark", "Simply being close, no words needed"] },
    { q: "How does your partner like to be complimented romantically?", options: ["About how they make you feel", "About their appearance", "About the connection you share", "About being irreplaceable to you"] },
    { q: "What sets the perfect romantic tone for your partner?", options: ["Music, candles, and no distractions", "A heartfelt conversation", "Playfulness and laughter", "Spontaneity and surprise"] },
    { q: "How does your partner feel about physical closeness while traveling?", options: ["It is the highlight of the trip", "A nice bonus to the adventure", "They are usually too busy exploring", "It brings them closer to you"] },
    { q: "What makes your partner feel most romanced?", options: ["Thoughtful planning and effort", "Spontaneous passion", "Undivided attention", "Small daily gestures of desire"] },
    { q: "How does your partner prefer affection first thing in the morning?", options: ["A sleepy cuddle", "A soft good-morning kiss", "A warm embrace before the day", "They need coffee before any of it"] },
    { q: "What is your partner's favorite kind of romantic surprise?", options: ["An unexpected date night", "A love note somewhere they will find it", "A spontaneous getaway", "A gesture that shows you were thinking of them"] },
    { q: "How does your partner feel about long, slow evenings together?", options: ["Their absolute favorite", "Lovely once in a while", "They prefer more activity", "Depends on their energy"] },
    { q: "What makes your partner feel truly wanted?", options: ["You initiating closeness", "Genuine compliments", "Your attention and pursuit", "Feeling chosen every day"] },
    { q: "How does your partner like reassurance during vulnerable moments?", options: ["Soft words that they are loved", "Being held closely", "Your calm patient presence", "A tender look that says everything"] },
    { q: "What is your partner's favorite way to feel close without words?", options: ["Cuddling in comfortable silence", "Holding hands", "A long shared glance", "Resting against each other"] },
    { q: "How does your partner feel about romantic getaways?", options: ["They dream about them", "They love the occasional one", "They prefer romance at home", "It depends on the destination"] },
    { q: "What makes your partner feel most adored physically?", options: ["Gentle attentive touch", "Passionate embraces", "Being held tenderly", "Small affectionate gestures all day"] },
    { q: "How does your partner like to reconnect after a stressful day?", options: ["A long comforting hug", "Cuddling on the couch", "A gentle shoulder rub", "Just lying close together"] },
    { q: "What is your partner's ideal way to feel romanced on an ordinary night?", options: ["A surprise home-cooked dinner", "Slow dancing in the kitchen", "A heartfelt unexpected compliment", "Being pulled in for a long embrace"] },
    { q: "What is your partner favorite kind of goodnight kiss?", options: ["Soft and lingering", "Quick and sweet", "Playful and teasing", "Deep and unhurried"] },
    { q: "How does your partner most love to be held while watching a movie?", options: ["Curled into your side", "Head on your lap", "Hands intertwined", "Fully wrapped up together"] },
    { q: "What tender gesture makes your partner feel most cherished?", options: ["A forehead kiss", "A hand on their cheek", "Fingers laced together", "A slow embrace from behind"] },
    { q: "How does your partner like to be greeted with affection in the morning?", options: ["A soft kiss", "A sleepy cuddle", "A warm hug", "A whispered good morning"] },
    { q: "What makes a slow evening feel romantic to your partner?", options: ["Candlelight and music", "Undivided attention", "Gentle touches throughout", "Meaningful conversation"] },
    { q: "How does your partner most enjoy reconnecting after being apart?", options: ["A long tight hug", "A tender kiss", "Being pulled close", "Just holding hands and talking"] },
    { q: "What kind of closeness does your partner crave on a cozy night?", options: ["Cuddling under blankets", "Resting against each other", "Gentle back rubs", "Warm hand-holding"] },
    { q: "What sets the most romantic mood for your partner?", options: ["Dim warm lighting", "Their favorite music", "A quiet private space", "A heartfelt moment first"] },
    { q: "How does your partner like affection during a slow dance?", options: ["Cheek to cheek", "Foreheads touching", "Wrapped up close", "Playful and swaying"] },
    { q: "What makes your partner feel most desired in a sweet way?", options: ["Being told they are beautiful", "A lingering gaze", "Being reached for first", "A tender touch"] },
    { q: "How does your partner most enjoy being kissed unexpectedly?", options: ["On the forehead", "On the cheek", "On the hand", "A soft one on the lips"] },
    { q: "What is your partner favorite tender ritual before sleep?", options: ["A goodnight kiss", "Cuddling for a while", "Talking softly in the dark", "Holding hands as they drift off"] },
    { q: "How does your partner like to feel emotionally close in a quiet moment?", options: ["A shared knowing look", "Resting their head on you", "Soft whispered words", "Simply being near, no words"] },
    { q: "What makes your partner melt during a romantic evening?", options: ["A heartfelt compliment", "A slow tender kiss", "Being held closely", "Your full attention"] },
    { q: "How does your partner most like affection shown on a walk together?", options: ["Holding hands", "An arm around them", "Leaning into each other", "Stealing a sweet kiss"] },
    { q: "What kind of embrace comforts your partner most?", options: ["A long enveloping one", "A gentle swaying hug", "A from-behind hug", "A tight reassuring squeeze"] },
    { q: "How does your partner enjoy being pursued romantically?", options: ["With sweet words", "With gentle touches", "With planned surprises", "With undivided focus"] },
    { q: "What makes your partner feel adored on a lazy morning?", options: ["Slow cuddles", "Soft kisses", "Whispered affection", "Breakfast brought to bed"] },
    { q: "How does your partner like romance to unfold on a date?", options: ["Slowly and tenderly", "Naturally in the moment", "Through playful flirting", "After feeling connected"] },
    { q: "What tender words does your partner most love to hear?", options: ["You are beautiful to me", "I feel so close to you", "I love holding you", "You are my favorite person"] },
    { q: "How does your partner most enjoy a candlelit evening?", options: ["Deep conversation", "Close cuddling", "Slow dancing", "Simply being together"] },
    { q: "What makes your partner feel safest being affectionate?", options: ["Feeling emotionally secure", "No pressure at all", "A warm private setting", "Your patience and gentleness"] },
    { q: "How does your partner like to be comforted with touch when down?", options: ["Just being held", "A gentle head stroke", "Lying close together", "A comforting hand to hold"] },
    { q: "What is your partner favorite affectionate habit of yours?", options: ["Random forehead kisses", "Reaching for their hand", "Playful little touches", "Long lingering hugs"] },
    { q: "How does your partner like to end a romantic evening?", options: ["Talking softly wrapped up", "Falling asleep close", "A warm bath together", "Holding each other in silence"] },
    { q: "What makes your partner feel most romanced by surprise?", options: ["A love note", "An unexpected date night", "A spontaneous getaway", "A gesture showing you care"] },
    { q: "How does your partner like affection sprinkled through the day?", options: ["Little touches often", "A big hug now and then", "Sweet texts", "A kiss in passing"] },
    { q: "What makes your partner feel most attractive to you?", options: ["Genuine compliments", "The way you look at them", "Being wanted", "Feeling confident with you"] },
    { q: "How does your partner enjoy slow mornings of affection?", options: ["Extra cuddling", "Soft kisses", "Whispered words", "Lingering in bed together"] },
    { q: "What is your partner favorite way to feel close without words?", options: ["Cuddling in silence", "Holding hands", "A long shared glance", "Leaning on each other"] },
    { q: "How does your partner most like to be flirted with sweetly?", options: ["Playful compliments", "A teasing touch", "Your full attention", "A charming gesture"] },
    { q: "What makes a quiet night feel intimate to your partner?", options: ["Deep talk", "Being tangled together", "Soft music and low light", "A slow shared activity"] },
    { q: "How does your partner like reassurance in a tender moment?", options: ["Soft loving words", "Being held closely", "Your calm presence", "A gentle knowing look"] },
    { q: "What makes your partner feel most connected during a hug?", options: ["Its length", "Its warmth", "The way you hold on", "Feeling truly wanted"] },
    { q: "How does your partner like affection on a rainy day inside?", options: ["Cuddled watching the rain", "Warm and close under blankets", "Slow and unhurried", "Talking softly together"] },
    { q: "What is your partner favorite romantic surprise?", options: ["A candlelit dinner at home", "A love note left for them", "A spontaneous slow dance", "A gesture showing you thought of them"] },
    { q: "How does your partner most enjoy being pulled close?", options: ["Suddenly and playfully", "Slowly and tenderly", "From behind unexpectedly", "Into a long embrace"] },
    { q: "What makes your partner feel truly wanted in a gentle way?", options: ["You initiating closeness", "Genuine compliments", "Your pursuit and attention", "Feeling chosen daily"] },
    { q: "How does your partner like to feel romanced on a normal Tuesday?", options: ["An unexpected compliment", "A surprise embrace", "A little planned gesture", "Slow dancing in the kitchen"] },
    { q: "What tender moment does your partner treasure most?", options: ["A morning cuddle", "A goodnight kiss", "Holding hands", "A quiet embrace"] },
    { q: "How does your partner like affection while cooking together?", options: ["A kiss on the cheek", "A hug from behind", "Playful nudges", "Dancing in the kitchen"] },
    { q: "What makes your partner feel most cared for in tender moments?", options: ["Gentle reassuring words", "Being held like they are precious", "Your undistracted presence", "Small caring gestures"] },
    { q: "How does your partner most enjoy a romantic getaway feeling?", options: ["Lots of closeness", "Uninterrupted time together", "Slow romantic evenings", "New shared experiences"] },
    { q: "What is your partner favorite affectionate way to say goodbye?", options: ["A lingering kiss", "A long hug", "A sweet whisper", "A hand squeeze"] },
    { q: "How does your partner like to be welcomed home affectionately?", options: ["A warm hug", "A kiss at the door", "Being pulled close", "A happy greeting and a squeeze"] },
    { q: "What makes your partner feel emotionally close in an embrace?", options: ["Eye contact after", "Whispered words", "The gentleness of it", "Feeling fully accepted"] },
    { q: "How does your partner enjoy affection on a slow weekend?", options: ["Cuddling all morning", "Sweet unhurried kisses", "Holding each other", "Lingering in bed"] },
    { q: "What tender gesture surprises your partner most sweetly?", options: ["A forehead kiss out of nowhere", "A hand reaching for theirs", "A hug from behind", "A slow pull into your arms"] },
    { q: "How does your partner like romance built through anticipation?", options: ["Sweet teasing texts", "A planned romantic evening", "Knowing you are thinking of them", "A hint of a surprise"] },
    { q: "What makes your partner feel most romanced at dinner?", options: ["Candlelight", "Your full attention", "A heartfelt toast", "Reaching across to hold hands"] },
    { q: "How does your partner enjoy closeness while stargazing or outdoors?", options: ["Wrapped in a blanket together", "Head on your shoulder", "Holding hands", "Cuddled close"] },
    { q: "What makes your partner feel cherished first thing in the morning?", options: ["A sleepy kiss", "A warm cuddle", "A soft good morning", "Being held a little longer"] },
    { q: "How does your partner most like tender touch at the end of the day?", options: ["A gentle shoulder rub", "A comforting hug", "Holding hands on the couch", "Lying close together"] },
    { q: "What is your partner favorite kind of slow, romantic music moment?", options: ["Slow dancing", "Cuddling to it", "Talking over it softly", "Just holding each other"] },
    { q: "How does your partner like affection shown when you are out together?", options: ["Subtle hand-holding", "An arm around them", "A quiet sweet aside", "A stolen kiss"] },
    { q: "What makes your partner feel most emotionally connected physically?", options: ["Slow intentional touch", "Whispered sweet words", "Eye contact and presence", "Feeling fully wanted"] },
    { q: "How does your partner enjoy being comforted with closeness?", options: ["A long hug", "Cuddling quietly", "A gentle touch", "Just being near"] },
    { q: "What tender ritual would mean the most to your partner?", options: ["A kiss every goodbye", "Cuddles every morning", "Holding hands each night", "A daily warm embrace"] },
    { q: "How does your partner most love a romantic evening to feel?", options: ["Warm and unhurried", "Playful and light", "Deep and connected", "Spontaneous and sweet"] },
    { q: "What makes your partner feel adored in an ordinary moment?", options: ["A passing kiss", "A gentle touch", "A loving glance", "A small caring act"] },
    { q: "How does your partner like affection during a long drive?", options: ["Holding hands", "A hand on their leg", "Leaning close", "Sweet conversation"] },
    { q: "What is your partner favorite way to feel pursued romantically?", options: ["Flirty sweet words", "Gentle affection", "Planned romance", "Undivided attention"] },
    { q: "How does your partner enjoy a tender surprise on a hard day?", options: ["A comforting hug", "A sweet note", "Being held quietly", "A gentle caring gesture"] },
    { q: "What makes your partner feel most treasured in a soft moment?", options: ["Being held gently", "Kind whispered words", "Your patient closeness", "A tender look"] },
    { q: "How does your partner like to reconnect physically after a busy week?", options: ["A whole day of cuddling", "Slow reintroduction of closeness", "Long warm hugs", "Just being wrapped up together"] },
    { q: "What tender gesture makes your partner feel loved without words?", options: ["A forehead kiss", "A hand on their back", "Fingers intertwined", "Being pulled in close"] },
    { q: "How does your partner most enjoy romance on a special occasion?", options: ["A candlelit evening", "A surprise getaway", "A heartfelt gesture", "Slow dancing together"] },
    { q: "What makes your partner feel safest opening up affectionately?", options: ["Emotional security", "No pressure", "A private cozy setting", "Your gentleness"] },
    { q: "How does your partner like affection when feeling vulnerable?", options: ["Just to be held", "Gentle reassuring touch", "Closeness with no expectation", "A comforting hand"] },
    { q: "What is your partner favorite tender moment during travel?", options: ["Cuddling in a new place", "Holding hands exploring", "A romantic dinner away", "Falling asleep close somewhere new"] },
    { q: "How does your partner most love being surprised with romance?", options: ["An unexpected date", "A note somewhere sweet", "A spontaneous trip", "A gesture showing you care"] },
    { q: "What makes your partner feel most romanced by thoughtfulness?", options: ["Careful planning", "Spontaneous sweetness", "Undivided attention", "Small daily gestures"] },
    { q: "How does your partner like affection first thing when waking?", options: ["A sleepy cuddle", "A soft kiss", "A warm embrace", "A gentle good morning"] },
    { q: "What tender thing does your partner most want to hear at night?", options: ["How much you love them", "How safe they make you feel", "How glad you are to have them", "That they are your one"] },
    { q: "How does your partner enjoy slow affection on a quiet Sunday?", options: ["Endless cuddling", "Sweet unhurried kisses", "Holding each other", "A shared cozy morning"] },
    { q: "What makes your partner feel most cherished on a walk?", options: ["Holding hands", "An arm around them", "Leaning together", "A sweet stolen kiss"] },
    { q: "How does your partner like reassurance through touch?", options: ["A gentle squeeze", "A warm hug", "A hand held", "A tender caress"] },
    { q: "What is your partner favorite tender surprise before bed?", options: ["A sweet goodnight note", "A long cuddle", "A soft kiss", "Being held close"] },
    { q: "How does your partner most enjoy being romanced without a plan?", options: ["A spontaneous slow dance", "A surprise kiss", "Being pulled close", "A sweet in-the-moment gesture"] },
    { q: "What makes your partner feel most connected in a soft embrace?", options: ["Its warmth", "The eye contact", "The gentle words", "Feeling fully wanted"] },
    { q: "How does your partner like affection during a cozy fireside night?", options: ["Cuddled close", "Head on your shoulder", "Holding hands", "Wrapped up together"] },
    { q: "What tender gesture makes your partner smile every time?", options: ["A forehead kiss", "A gentle touch", "A loving look", "A warm hug"] },
    { q: "How does your partner most enjoy reconnecting at day end?", options: ["A long comforting hug", "Cuddling on the couch", "A gentle shoulder rub", "Lying close together"] },
    { q: "What makes your partner feel most romanced on a getaway?", options: ["Slow romantic evenings", "Lots of closeness", "Uninterrupted time", "New experiences shared"] },
    { q: "How does your partner like tender affection while relaxing?", options: ["A head in their lap", "Fingers running through hair", "A gentle back rub", "Just being held"] },
    { q: "What is your partner favorite way to feel wanted gently?", options: ["Being reached for", "Genuine compliments", "Your attention", "Feeling chosen"] },
    { q: "How does your partner enjoy being welcomed with a kiss?", options: ["A soft one on the lips", "On the forehead", "On the cheek", "A lingering sweet one"] },
    { q: "What makes your partner feel most emotionally safe in closeness?", options: ["Your patience", "Feeling accepted", "No judgment", "Knowing you will stay"] },
    { q: "How does your partner like romance shown on an anniversary?", options: ["Recreating a sweet memory", "A heartfelt gesture", "A quiet perfect evening", "Lots of closeness"] },
    { q: "What tender moment does your partner most look forward to daily?", options: ["The morning cuddle", "The goodnight kiss", "Holding hands", "A warm hug hello"] },
    { q: "How does your partner most enjoy being adored physically in a soft way?", options: ["Gentle attentive touch", "Tender embraces", "Being held close", "Small affectionate gestures"] },
    { q: "What makes your partner feel most romanced by a small act?", options: ["A surprise home dinner", "A slow kitchen dance", "An unexpected compliment", "A long warm embrace"] },
    { q: "How does your partner like affection while saying goodbye for the day?", options: ["A lingering kiss", "A tight hug", "A sweet whisper", "A hand squeeze"] },
    { q: "What is your partner favorite tender thing during a quiet cuddle?", options: ["Soft words", "Gentle strokes", "A knowing look", "Comfortable silence"] },
    { q: "How does your partner most enjoy romance on a cold night?", options: ["Warm loving words", "Cuddled under blankets", "Talking quietly close", "A warm drink and closeness"] },
    { q: "What makes your partner feel most secure in your affection?", options: ["Hearing it often", "Feeling it through touch", "Seeing it in your time", "Watching it in your care"] },
    { q: "How does your partner like affection shown subtly in public?", options: ["A quiet aside", "A hand on their back", "A knowing glance", "A gentle hand-hold"] },
    { q: "What makes your partner feel most treasured after closeness?", options: ["Being held", "Soft talking", "A shared shower or bath", "Quiet togetherness"] },
    { q: "How does your partner most love a romantic surprise timed right?", options: ["An unexpected date night", "A love note found later", "A spontaneous getaway", "A caring gesture at the right moment"] },
    { q: "What tender gesture helps your partner relax into closeness?", options: ["A slow embrace", "A gentle touch", "Soft reassuring words", "Warm dim surroundings"] },
    { q: "How does your partner like affection when they are tired?", options: ["Being held and comforted", "A gentle back or head rub", "Lying close together", "Soft reassuring touch"] },
    { q: "What makes your partner feel most romanced on an ordinary evening?", options: ["A surprise dinner", "Slow dancing", "A heartfelt compliment", "A long embrace"] },
    { q: "How does your partner most enjoy tender closeness on a couch night?", options: ["Curled into your side", "Head on your lap", "Fully wrapped up", "Hands intertwined"] },
    { q: "What is your partner favorite affectionate way to start a weekend?", options: ["A slow morning cuddle", "A sweet kiss", "A warm embrace", "Coffee and closeness"] },
    { q: "How does your partner like romance to feel over the years?", options: ["Still playful", "Deeply tender", "Warm and steady", "Full of little surprises"] },
    { q: "What makes your partner feel most desired in a sweet everyday way?", options: ["A passing kiss", "A gentle touch", "A loving glance", "Being pulled close"] },
    { q: "How does your partner most enjoy being reassured they are loved?", options: ["Soft words", "A warm hug", "Your presence", "A tender look"] },
    { q: "What tender ritual does your partner most cherish with you?", options: ["A goodnight kiss every night", "Morning cuddles", "Holding hands as they sleep", "A warm embrace each evening"] },
    { q: "How does your partner like affection woven into a normal day?", options: ["Little touches often", "Sweet words in passing", "A hug whenever you can", "A kiss on the way by"] },
    { q: "What makes your partner feel most romanced by your effort?", options: ["A thoughtful surprise", "A planned tender evening", "Undivided attention", "A small daily gesture of love"] },
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
    { q: "If you two suddenly won a year of free travel, how would your partner want to spend it?", options: ["Backpacking on a budget for the experience", "Luxury travel to the finest places", "Slow travel, one country at a time", "A mix of adventure and relaxation"] },
    { q: "If your partner could instantly resolve one recurring argument, which would they pick?", options: ["The one about chores and responsibilities", "The one about time and attention", "The one about money", "The one about family or friends"] },
    { q: "If you two switched bodies for a day, what would your partner do first?", options: ["Fix a habit of yours they find annoying", "Finally understand how you feel", "Have fun causing gentle chaos", "Take care of things they think you neglect"] },
    { q: "If your partner had to pick a couple's motto, what would it be?", options: ["Us against the world", "Grow together, always", "Never a dull moment", "Home is wherever we are"] },
    { q: "If your relationship were a season, which would your partner say it is right now?", options: ["Spring, fresh and blooming", "Summer, warm and passionate", "Autumn, cozy and deep", "Winter, quiet and steady"] },
    { q: "If your partner could give your past self one warning, what would it be?", options: ["Do not sweat the small stuff so much", "Trust the process, it works out", "Communicate sooner and more openly", "Enjoy every stage while it lasts"] },
    { q: "If you had to survive a zombie apocalypse together, what role would your partner take?", options: ["The strategist making the plans", "The protector and fighter", "The morale keeper and heart", "The one who finds supplies and solutions"] },
    { q: "If your partner could relive your first year knowing what they know now, what would change?", options: ["They would worry less", "They would be more open sooner", "They would savor it more", "Nothing, it was perfect as it was"] },
    { q: "If you two had to live without technology for a month, how would your partner cope?", options: ["Thrive and love the disconnection", "Struggle badly at first", "Adapt with some grumbling", "Secretly enjoy it more than expected"] },
    { q: "If your partner could plan the ultimate anniversary, what would it involve?", options: ["A surprise trip somewhere meaningful", "Recreating your first date", "A grand romantic gesture", "A quiet perfect day just for two"] },
    { q: "If your partner could know exactly how the relationship ends, would they want to?", options: ["Yes, they would want to know", "No, they prefer the mystery", "Only if it is a happy ending", "They are torn about it"] },
    { q: "If you two could adopt any animal together, what would your partner choose?", options: ["A big loyal dog", "A cozy cat", "Something exotic and unusual", "They would rather have none"] },
    { q: "If your partner had to describe you to a stranger in three words, what would they say?", options: ["Kind, funny, loyal", "Driven, passionate, strong", "Warm, caring, patient", "Wild, spontaneous, exciting"] },
    { q: "If you two started a podcast together, what would it be about?", options: ["Your relationship and love advice", "Comedy and everyday life", "A shared passion or hobby", "Deep conversations about anything"] },
    { q: "If your partner could magically fix one thing about your daily routine as a couple, what would it be?", options: ["Less rushing in the mornings", "More time together in the evenings", "Fewer distractions during meals", "A better balance of chores"] },
    { q: "If you had to move somewhere with no friends or family for a job, how would your partner feel?", options: ["Excited for the fresh adventure", "Nervous but willing for you", "Reluctant and homesick already", "They would need serious convincing"] },
    { q: "If your partner could have any celebrity endorse your relationship, who would they pick?", options: ["A famous long-married couple", "A comedian for the laughs", "A romantic icon", "They do not care about celebrities"] },
    { q: "If you two wrote a book about your love story, what would the title be?", options: ["Something sweet and sentimental", "Something funny and self-aware", "Something dramatic and epic", "Something simple and understated"] },
    { q: "If your partner could freeze your ages forever, what age would they choose?", options: ["Right now, this exact moment", "Their twenties, full of energy", "A future age when life is settled", "They would never freeze it, they want to grow old"] },
    { q: "If you had to give up one comfort for the relationship, what would your partner sacrifice?", options: ["Their alone time", "A favorite hobby's time", "Some financial freedom", "A personal habit they love"] },
    { q: "If your partner could send a message to your relationship five years from now, what would it say?", options: ["Do not forget how this felt", "Keep choosing each other", "Never stop talking and laughing", "You made it, well done"] },
    { q: "If you two were stuck somewhere unexpectedly overnight, how would your partner cope?", options: ["Turn it into an adventure", "Stay calm and practical", "Get anxious but manage", "Make the best of it with humor"] },
    { q: "If your partner could star in any love story from film, which would they choose?", options: ["A grand romantic epic", "A quirky indie romance", "A slow-burn friends-to-lovers tale", "A dramatic against-all-odds story"] },
    { q: "If you had to describe your relationship as a weather forecast, what would your partner say?", options: ["Sunny with the occasional storm", "Warm and steady", "Unpredictable but exciting", "Cozy and calm"] },
    { q: "If your partner could gift you one full day of anything, what would it be?", options: ["A day of total pampering", "An adventure you have always wanted", "A quiet day with zero obligations", "A day reliving a favorite memory"] },
    { q: "If you two could master a skill together overnight, what would your partner pick?", options: ["Dancing", "Cooking gourmet meals", "A shared sport", "A new language for travel"] },
    { q: "If your partner had to choose the soundtrack to your relationship, what mood would it be?", options: ["Romantic and dreamy", "Upbeat and fun", "Deep and emotional", "Eclectic and unpredictable"] },
    { q: "If you had to raise a pet together as a practice run, what would your partner want?", options: ["A puppy to test the waters", "A low-maintenance pet", "Something you both would love", "They would rather skip straight to the real thing"] },
    { q: "If your partner could relive the exact moment they fell for you, when would it be?", options: ["The first date", "A specific conversation", "An intimate quiet moment", "They are not sure of the exact one"] },
    { q: "If you two could design your dream date from scratch, what would your partner include?", options: ["Amazing food and wine", "An outdoor adventure", "A cultural experience", "A cozy night in with no rules"] },
    { q: "If your partner had to teach a masterclass on your relationship, what would it cover?", options: ["Keeping romance alive", "Communicating through conflict", "Balancing togetherness and independence", "Growing together over time"] },
    { q: "If you had to spend a year on a remote island together, what would your partner miss most?", options: ["Friends and family", "Modern conveniences", "Their favorite foods", "Honestly, nothing but each other"] },
    { q: "If your partner could have any fictional couple over for dinner, who would they pick?", options: ["A classic romantic pair", "A hilarious comedic duo", "An adventurous power couple", "A wise old married pair"] },
    { q: "If you two could restart the relationship from scratch, what would your partner do differently?", options: ["Take things slower to savor it", "Be more open from the start", "Communicate expectations sooner", "Nothing, they would do it all again"] },
    { q: "If your partner could pick one word to sum up their feelings about your future, what would it be?", options: ["Hopeful", "Certain", "Excited", "Grateful"] },
    { q: "If you had to win an amazing race together, what would your partner's strength be?", options: ["Navigation and planning", "Physical stamina", "Staying calm under pressure", "Charming people to help you"] },
    { q: "If your partner could have your relationship painted as a portrait, what would it show?", options: ["A candid laughing moment", "A tender embrace", "The two of you on an adventure", "A quiet ordinary day together"] },
    { q: "If you two could time travel to any point in your relationship, where would your partner go?", options: ["The very beginning", "A favorite trip", "A milestone moment", "The present, to appreciate it more"] },
    { q: "If your partner had to trade one of your traits for a superpower, would they?", options: ["No, they love you as you are", "Only if it helped the relationship", "Maybe, for the right power", "They would need to think hard about it"] },
    { q: "If you had to describe your partner's love with a color, what would it be?", options: ["Warm red, passionate", "Calm blue, steady", "Bright yellow, joyful", "Deep purple, complex and rich"] },
    { q: "If your partner could relive one ordinary day with you exactly as it was, which would they pick?", options: ["A lazy Sunday together", "A day full of small laughs", "A quiet evening at home", "A random day that felt perfect"] },
    { q: "If you two ran a small business together, what would it be?", options: ["A cozy cafe or restaurant", "A creative studio", "A travel or adventure company", "A shop selling something you both love"] },
    { q: "If your partner could freeze one of your qualities in time forever, what would it be?", options: ["Your sense of humor", "Your kindness", "Your looks", "The way you love them"] },
    { q: "If you had to face your biggest fear together, who would take the lead?", options: ["Your partner, they are the brave one", "You, they would rather support", "Both of you, side by side", "Whoever panics less in the moment"] },
    { q: "If your partner could bottle one feeling from the relationship, which would it be?", options: ["The comfort of coming home to you", "The excitement of the early days", "The security of being loved", "The joy of laughing together"] },
    { q: "If you two could co-author your ideal weekend, what would your partner's version be?", options: ["Nonstop plans and activity", "Total rest and relaxation", "A spontaneous mini-trip", "A balance of fun and downtime"] },
    { q: "If your partner had to keep one photo of you two forever, which would they choose?", options: ["The most candid one", "The most romantic one", "The funniest one", "The earliest one"] },
    { q: "If you both had one wish for the relationship granted, what would your partner wish?", options: ["Endless time together", "Never losing the spark", "Perfect understanding always", "A lifetime of health and happiness"] },
    { q: "If your partner could relive your proposal or a key moment, what would they change?", options: ["Nothing, it was perfect", "They would be less nervous", "They would savor it longer", "They would capture it better"] },
    { q: "If you two got a do-over on your worst day together, how would your partner handle it?", options: ["More patience", "More honesty about feelings", "Walking away to cool off first", "Reaching out sooner to reconnect"] },
    { q: "If your partner could give your relationship a theme for the next year, what would it be?", options: ["Adventure and new experiences", "Deepening the connection", "Building toward a big goal", "Slowing down and savoring"] },
    { q: "If you had to be apart for a year, how would your partner stay connected?", options: ["Daily calls no matter what", "Long heartfelt messages", "Scheduled visits to look forward to", "Little surprises sent in the mail"] },
    { q: "If your partner could describe the feeling of being with you, what would it be like?", options: ["Coming home", "A thrilling adventure", "A safe harbor", "The best part of every day"] },
    { q: "If you two could pass one lesson to future couples, what would your partner share?", options: ["Communicate everything", "Never stop dating each other", "Choose kindness in hard moments", "Grow together, not apart"] },
    { q: "If your partner could have any view from your future home, what would they pick?", options: ["The ocean", "A city skyline", "Rolling hills", "A forest"] },
    { q: "If you two could instantly speak a new language together, which would your partner choose?", options: ["Italian", "Japanese", "Spanish", "French"] },
    { q: "If your partner could relive one date over and over, which would it be?", options: ["The first one", "The most romantic one", "The funniest one", "The most spontaneous one"] },
    { q: "If you two won a cooking show together, what would your partner make?", options: ["A comfort classic", "Something gourmet", "A family recipe", "Whatever they could improvise"] },
    { q: "If your partner could give your relationship a mascot animal, what would it be?", options: ["A loyal dog", "A clever fox", "A gentle deer", "A playful otter"] },
    { q: "If you two could freeze time on any day, which would your partner choose?", options: ["A carefree vacation day", "A quiet perfect Sunday", "A big celebration", "The day you met"] },
    { q: "If your partner could design your dream date night, what is the centerpiece?", options: ["Amazing food", "A beautiful setting", "A fun activity", "Just quality time"] },
    { q: "If you both had to pick a couple superpower, what would your partner want?", options: ["Reading each other minds", "Instant teleportation to each other", "Never needing sleep", "Perfect memory of every moment"] },
    { q: "If your partner could relive your first year knowing everything, what would change?", options: ["Worry less", "Open up sooner", "Savor it more", "Nothing at all"] },
    { q: "If you two got a free month anywhere, where would your partner go?", options: ["A tropical paradise", "A European tour", "An adventure trip", "A cozy remote cabin"] },
    { q: "If your partner could swap lives with any couple for a day, who would they pick?", options: ["A famous adventurous pair", "A quiet content couple", "A glamorous power couple", "No one, they love your life"] },
    { q: "If you had to pick a song for your first dance again, what mood would your partner want?", options: ["Slow and romantic", "Upbeat and joyful", "Deep and emotional", "Fun and playful"] },
    { q: "If your partner could add one tradition to your relationship, what would it be?", options: ["A yearly trip", "A weekly date night", "Love letters on occasions", "A monthly adventure"] },
    { q: "If you two could live in any fictional world together, where would your partner choose?", options: ["A magical fantasy realm", "A futuristic city", "A cozy small town story", "A grand adventure epic"] },
    { q: "If your partner could know one honest thought you have about them, what would they ask?", options: ["What you find most attractive", "How you see your future", "What you admire most", "Whether they make you happy"] },
    { q: "If you had to survive a week off-grid together, what role would your partner take?", options: ["The planner", "The provider", "The morale keeper", "The problem solver"] },
    { q: "If your partner could pick a theme for your next year together, what would it be?", options: ["Adventure", "Deepening connection", "Building a goal", "Slowing down"] },
    { q: "If you two could relive your best trip, which one would your partner choose?", options: ["The most romantic", "The most adventurous", "The most spontaneous", "The first one"] },
    { q: "If your partner could give you a whole day of anything, what would it be?", options: ["Total pampering", "An adventure", "A stress-free day", "Reliving a favorite memory"] },
    { q: "If you two started a business together, what would your partner want it to be?", options: ["A cozy cafe", "A creative studio", "A travel company", "A shop you both love"] },
    { q: "If your partner could describe your relationship as a drink, what would it be?", options: ["Warm coffee", "Sparkling champagne", "Comforting tea", "A bold cocktail"] },
    { q: "If you had to pick a city to elope in, where would your partner choose?", options: ["Paris", "A beach paradise", "A mountain town", "Somewhere close to home"] },
    { q: "If your partner could relive the moment they fell for you, when would it be?", options: ["The first date", "A specific conversation", "A quiet intimate moment", "They are not sure exactly"] },
    { q: "If you two could master one hobby together overnight, what would your partner pick?", options: ["Dancing", "Cooking", "A sport", "Playing music"] },
    { q: "If your partner had to sum up your love in one image, what would it be?", options: ["A warm hearth", "An open road", "A safe harbor", "A dance floor"] },
    { q: "If you both got to redo your first meeting, how would your partner want it to go?", options: ["Exactly the same", "More smoothly", "More memorably", "Sooner in life"] },
    { q: "If your partner could gift your relationship one guarantee, what would it be?", options: ["Endless laughter", "Never losing the spark", "Perfect understanding", "Lifelong health together"] },
    { q: "If you two had to spend a year on an island, what would your partner miss most?", options: ["Friends and family", "Modern comforts", "Favorite foods", "Nothing but each other"] },
    { q: "If your partner could pick your relationship theme song genre, what would it be?", options: ["Romantic ballad", "Upbeat pop", "Soulful R&B", "Warm indie folk"] },
    { q: "If you had to describe your bond as a season right now, what would your partner say?", options: ["Spring", "Summer", "Autumn", "Winter"] },
    { q: "If your partner planned a milestone anniversary, what would it include?", options: ["A surprise trip", "Recreating your first date", "A grand gesture", "A quiet perfect day"] },
    { q: "If you two could adopt any pet together, what would your partner choose?", options: ["A big loyal dog", "A cozy cat", "Something exotic", "None at all"] },
    { q: "If your partner had to describe you in three words to a stranger, what would they say?", options: ["Kind, funny, loyal", "Driven, warm, strong", "Gentle, caring, patient", "Wild, fun, exciting"] },
    { q: "If you two hosted a podcast, what would your partner want it to be about?", options: ["Love and relationships", "Comedy and daily life", "A shared passion", "Deep conversations"] },
    { q: "If your partner could fix one thing about your daily routine, what would it be?", options: ["Less morning rush", "More evening time", "Fewer distractions", "A better chore balance"] },
    { q: "If you two could revisit any moment in your relationship, where would your partner go?", options: ["The very beginning", "A favorite trip", "A milestone moment", "The present, to savor it"] },
    { q: "If your partner could give your past self advice, what would it be?", options: ["Do not stress the small stuff", "Trust the process", "Communicate sooner", "Enjoy every stage"] },
    { q: "If you both had one shared wish granted, what would your partner wish for?", options: ["Endless time together", "Never losing the spark", "Always understanding each other", "A lifetime of happiness"] },
    { q: "If your partner could star in any love story, which would they choose?", options: ["A grand epic", "A quirky indie romance", "A slow-burn friends to lovers", "An against-all-odds tale"] },
    { q: "If you two could co-design your perfect weekend, what is your partner version?", options: ["Packed with plans", "Total rest", "A spontaneous trip", "A balance of both"] },
    { q: "If your partner could bottle one feeling from your relationship, what would it be?", options: ["Coming home to you", "The early excitement", "Feeling deeply loved", "Laughing together"] },
    { q: "If you had to name your couple motto, what would your partner pick?", options: ["Us against the world", "Grow together always", "Never a dull moment", "Home is wherever we are"] },
    { q: "If your partner could relive one ordinary day exactly, which would it be?", options: ["A lazy Sunday", "A day of small laughs", "A quiet evening in", "A random perfect day"] },
    { q: "If you two got stranded overnight somewhere, how would your partner handle it?", options: ["Turn it into an adventure", "Stay calm and practical", "Get anxious but manage", "Make the best of it with humor"] },
    { q: "If your partner could pick a color to represent your love, what would it be?", options: ["Warm red", "Calm blue", "Bright yellow", "Deep purple"] },
    { q: "If you both switched bodies for a day, what would your partner do first?", options: ["Fix an annoying habit", "Understand how you feel", "Have fun with it", "Take care of what you neglect"] },
    { q: "If your partner could keep only one photo of you two, which would they choose?", options: ["The most candid", "The most romantic", "The funniest", "The earliest"] },
    { q: "If you two ran an amazing race together, what would your partner strength be?", options: ["Navigation", "Stamina", "Staying calm", "Charming people to help"] },
    { q: "If your partner could send a note to your future selves, what would it say?", options: ["Do not forget this feeling", "Keep choosing each other", "Never stop laughing", "You made it, well done"] },
    { q: "If you two could open any kind of shop, what would your partner want?", options: ["A bookstore", "A bakery", "A record or art shop", "A cozy plant shop"] },
    { q: "If your partner could redo a key relationship moment, what would they change?", options: ["Nothing", "Be less nervous", "Savor it longer", "Capture it better"] },
    { q: "If you had to face your biggest fear together, who would lead?", options: ["Your partner", "You", "Both side by side", "Whoever panics less"] },
    { q: "If your partner could plan a dream double date, who would you go with?", options: ["Your funniest friends", "A wise older couple", "Your closest friends", "Just the two of you, actually"] },
    { q: "If you two could learn a couple dance style, what would your partner pick?", options: ["Slow romantic", "Energetic salsa", "Classic ballroom", "Something fun and silly"] },
    { q: "If your partner could describe being with you as a place, where is it?", options: ["Coming home", "A thrilling journey", "A safe harbor", "The best part of every day"] },
    { q: "If you had to survive a storm stranded together, how would your partner cope?", options: ["Take charge calmly", "Keep spirits high", "Solve problems", "Lean on you"] },
    { q: "If your partner could give your relationship a book title, what would it be?", options: ["Something sweet", "Something funny", "Something epic", "Something simple"] },
    { q: "If you two could win a lifetime of one thing, what would your partner choose?", options: ["Free travel", "Free dinners out", "Endless date nights", "A dream home"] },
    { q: "If your partner could pause your ages at one point, what would they pick?", options: ["Right now", "Their twenties", "A future settled age", "They would never freeze it"] },
    { q: "If your partner had to surrender one comfort for the relationship, what would go?", options: ["Alone time", "A hobby", "Some spending", "A personal habit"] },
    { q: "If your partner could design a surprise for you, what would it look like?", options: ["Grand and public", "Private and intimate", "Involving loved ones", "An adventure somewhere stunning"] },
    { q: "If you two could switch to any career together, what would your partner pick?", options: ["Travel bloggers", "Restaurant owners", "Creative artists", "Something helping others"] },
    { q: "If your partner could relive one holiday together, which would it be?", options: ["The first one as a couple", "The most festive", "The most relaxed", "The most surprising"] },
    { q: "If you two were separated for a year, how would your partner keep the bond?", options: ["Daily calls", "Long messages", "Scheduled visits", "Surprises in the mail"] },
    { q: "If your partner could gift your relationship a whole free day, what would you do?", options: ["Sleep in and relax", "An epic adventure", "Reconnect deeply", "Something totally new"] },
    { q: "If you two wrote your vows again, what would your partner emphasize?", options: ["Endless laughter", "Unwavering support", "Deep understanding", "Lifelong adventure"] },
    { q: "If your partner could pick a dream destination for your honeymoon do-over, where?", options: ["A tropical island", "A European city", "A safari", "A cozy cabin"] },
    { q: "If you both had to describe the other in a single emoji, what would your partner pick for you?", options: ["A heart", "A star", "A sun", "A flame"] },
    { q: "If your partner could relive the first time you said I love you, what would they feel?", options: ["The same nerves", "Pure joy", "Relief", "Butterflies all over again"] },
    { q: "If you two could design a dream home together, what room would your partner insist on?", options: ["A big kitchen", "A cozy reading nook", "A home theater", "A peaceful bedroom"] },
    { q: "If your partner could pick one word for how they feel about your future, what is it?", options: ["Hopeful", "Certain", "Excited", "Grateful"] },
    { q: "If you had to choose a fictional couple to have dinner with, who would your partner pick?", options: ["A classic romantic pair", "A comedic duo", "An adventurous couple", "A wise old married pair"] },
    { q: "If your partner could relive one laugh you shared, which would it be?", options: ["A travel mishap", "An inside joke", "A clumsy moment", "A show that broke you both"] },
    { q: "If you two could take a class together, what would your partner choose?", options: ["Cooking", "Dancing", "A language", "Pottery or art"] },
    { q: "If your partner could give you a superpower just for the relationship, what would it be?", options: ["Always knowing what they need", "Being everywhere they are", "Making moments last", "Healing any hurt"] },
    { q: "If you two could plan the perfect lazy day, what would your partner include?", options: ["Sleeping in", "Movies and snacks", "No plans at all", "Breakfast in bed"] },
    { q: "If your partner could relive your most romantic moment, where was it?", options: ["A beautiful view", "A candlelit dinner", "A quiet moment at home", "An unexpected place"] },
    { q: "If your partner gave your relationship a weather forecast, what would it be?", options: ["Sunny with rare storms", "Warm and steady", "Unpredictable but exciting", "Cozy and calm"] },
    { q: "If your partner could pick a dream role in an adventure movie, what would it be?", options: ["The brave leader", "The clever planner", "The loyal heart", "The comic relief"] },
    { q: "If you two could freeze one quality in each other, what would your partner keep in you?", options: ["Your humor", "Your kindness", "Your looks", "The way you love them"] },
    { q: "If your partner could plan your dream getaway, what is the vibe?", options: ["Romantic and slow", "Wild and adventurous", "Cozy and simple", "Luxurious and grand"] },
    { q: "If you both had to co-write your love story, what genre would your partner pick?", options: ["Romance", "Comedy", "Adventure", "Drama"] },
    { q: "If your partner could give your relationship one wish for next year, what is it?", options: ["More adventures", "Deeper connection", "A big shared goal", "More peace and ease"] },
    { q: "If you two could have any celebrity officiate a vow renewal, who would your partner want?", options: ["A famous comedian", "A romantic icon", "A beloved actor", "No one, keep it private"] },
    { q: "If your partner could relive your happiest day together, which would it be?", options: ["A carefree trip", "An ordinary perfect day", "A big celebration", "A private tender moment"] },
    { q: "If you had to pick a shared bucket-list item to do first, what would your partner choose?", options: ["See a natural wonder", "Take a dream trip", "Try something daring", "Live somewhere new briefly"] },
    { q: "If your partner could describe your love in a single sound, what would it be?", options: ["Laughter", "A soft sigh of comfort", "Music", "Quiet contentment"] },
    { q: "If you two could win a dream experience, what would your partner pick?", options: ["A luxury vacation", "A concert of a lifetime", "A private cooking lesson", "A hot air balloon ride"] },
    { q: "If your partner could relive your first trip together, what would they do differently?", options: ["Nothing at all", "Worry less", "Take more photos", "Stay longer"] },
    { q: "If you had to name a star after your relationship, what would your partner call it?", options: ["Something romantic", "Something funny", "Both your names combined", "A shared inside joke"] },
    { q: "If your partner could design a perfect surprise weekend for you, where would it be?", options: ["A beach escape", "A city adventure", "A cozy cabin", "A spa retreat"] },
    { q: "If you two could relive one meal together, which would your partner pick?", options: ["Your first dinner", "A fancy celebration", "A cheap perfect meal", "A meal while traveling"] },
    { q: "If your partner could freeze one moment of your future together, what would it be?", options: ["A milestone", "A quiet ordinary day", "A big adventure", "A tender private moment"] },
    { q: "If you both got matching tattoos, what would your partner want it to represent?", options: ["Your love", "A shared memory", "A private symbol", "A meaningful word"] },
    { q: "If your partner could pick a dream anniversary destination, where would it be?", options: ["Where you first traveled", "Somewhere brand new", "A romantic classic", "Somewhere meaningful to you"] },
    { q: "If you two could have any superpower for date nights, what would your partner choose?", options: ["Endless energy", "Teleporting anywhere", "Pausing time", "Perfect weather always"] },
    { q: "If your partner could relive your funniest date, which would it be?", options: ["The one that went wrong", "The one full of laughs", "The awkward first one", "A spontaneous silly one"] },
    { q: "If you had to describe your relationship as a journey, what would your partner say it is?", options: ["A grand adventure", "A steady road home", "A winding scenic route", "An exciting unknown"] },
    { q: "If your partner could keep one shared tradition forever, which would it be?", options: ["Date nights", "Yearly trips", "A daily ritual", "Inside jokes"] },
    { q: "If you two could master a language for one dream trip, where would your partner go?", options: ["Italy", "Japan", "France", "Spain"] },
    { q: "If your partner could relive your engagement or a milestone, what would they savor?", options: ["The surprise of it", "The words said", "The setting", "The joy afterward"] },
    { q: "If you both had to survive on a desert island, what would your partner bring for comfort?", options: ["Photos of you two", "A favorite book", "A keepsake from home", "Nothing, just you"] },
    { q: "If your partner could design your dream date from scratch, what comes first?", options: ["A beautiful dinner", "An adventure", "A cultural experience", "A cozy night in"] },
    { q: "If you two could relive your first kiss, what would your partner change?", options: ["Nothing at all", "Make it sooner", "Make it more memorable", "Slow it down"] },
    { q: "If your partner could give your relationship a color palette, what would it be?", options: ["Warm and cozy tones", "Bright and joyful", "Soft romantic hues", "Bold and vibrant"] },
    { q: "If you had to face a big life change together, how would your partner want to handle it?", options: ["Plan it out carefully", "Dive in bravely", "Talk it through fully", "Take it one step at a time"] },
    { q: "If your partner could relive one quiet morning with you, which would it be?", options: ["A slow weekend one", "A cozy rainy one", "A vacation morning", "A random peaceful one"] },
    { q: "If you two could throw any kind of party together, what would your partner want?", options: ["A big lively bash", "An intimate dinner", "A themed celebration", "A casual backyard hangout"] },
    { q: "If your partner could describe your relationship as a movie ending, what would it be?", options: ["A joyful reunion", "A quiet peaceful fade-out", "An adventure into the sunset", "A big romantic finale"] },
    { q: "If you both could relive the day you became official, what would your partner feel?", options: ["The same butterflies", "Pure happiness", "A little disbelief", "Deep certainty"] },
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
    { q: "What does your partner do to feel in control when life is chaotic?", options: ["Organize and plan obsessively", "Retreat into solitude", "Lean on the people they trust", "Throw themselves into work"] },
    { q: "What belief did your partner have to unlearn as they grew up?", options: ["That they had to earn love", "That vulnerability is weakness", "That success defines their worth", "That conflict means something is broken"] },
    { q: "What does your partner secretly worry they are not good enough at?", options: ["Being emotionally available", "Their career or ambition", "Being a good partner", "Living up to others' expectations"] },
    { q: "What is your partner's relationship with forgiveness?", options: ["They forgive easily but never forget", "They hold on longer than they should", "They forgive others but not themselves", "They struggle to forgive at all"] },
    { q: "What does your partner do when they feel truly misunderstood?", options: ["They shut down and go quiet", "They over-explain to be understood", "They get frustrated and defensive", "They withdraw and process alone"] },
    { q: "What is the fear your partner rarely admits to?", options: ["Ending up alone", "Not living up to their potential", "Being truly known and rejected", "Losing the people they love"] },
    { q: "What shaped your partner's view of love the most?", options: ["Their parents' marriage", "A past relationship", "A book, film, or role model", "Their own hard-earned experience"] },
    { q: "What does your partner need to feel truly at peace?", options: ["Security and stability", "Freedom and autonomy", "Deep connection with others", "A sense of purpose"] },
    { q: "What part of themselves does your partner hide from the world?", options: ["Their insecurities and doubts", "Their soft, sensitive side", "Their big ambitions and dreams", "Their true opinions to keep the peace"] },
    { q: "What does your partner wish they were braver about?", options: ["Speaking their mind", "Chasing what they really want", "Being vulnerable with others", "Setting boundaries"] },
    { q: "What old wound does your partner still carry from their family?", options: ["Feeling overlooked or unseen", "Pressure to be perfect", "A lack of emotional warmth", "Feeling responsible for others"] },
    { q: "What does your partner believe is the key to being truly happy?", options: ["Inner peace and self-acceptance", "Meaningful relationships", "Freedom to live authentically", "Purpose and contribution"] },
    { q: "What is your partner's biggest internal conflict?", options: ["Wanting closeness but fearing it", "Craving stability but loving risk", "Ambition versus contentment", "Independence versus needing others"] },
    { q: "What does your partner most fear being seen as?", options: ["Weak or incapable", "Selfish or unkind", "A failure or disappointment", "Unlovable or too much"] },
    { q: "What does your partner need to hear when they are struggling?", options: ["That they are not alone", "That it is okay to not be okay", "That you believe in them", "That you are proud of them anyway"] },
    { q: "What does your partner think their younger self would say about their life now?", options: ["Proud of how far they have come", "Surprised by the path they took", "Disappointed they gave up on something", "Relieved they turned out okay"] },
    { q: "What is the hardest emotion for your partner to express?", options: ["Sadness", "Anger", "Fear", "Needing help"] },
    { q: "What does your partner secretly hope people see in them?", options: ["Strength and resilience", "Kindness and warmth", "Depth and intelligence", "That they are trying their best"] },
    { q: "What childhood belief still quietly drives your partner?", options: ["That they must be independent", "That they have to prove themselves", "That love must be earned", "That they should never be a burden"] },
    { q: "What does your partner do to cope with feeling overwhelmed?", options: ["Shut down and disconnect", "Get productive and busy", "Reach out to someone", "Isolate until it passes"] },
    { q: "What does your partner value most in a friendship?", options: ["Absolute loyalty", "Honest, real conversation", "Being able to be themselves", "Showing up when it counts"] },
    { q: "What does your partner most regret not saying?", options: ["Something to a person now gone", "How they really felt at a key moment", "A goodbye they never got to say", "The truth when it mattered"] },
    { q: "What does your partner think is the root of most of their fears?", options: ["Fear of abandonment", "Fear of failure", "Fear of not being enough", "Fear of losing control"] },
    { q: "What does your partner secretly need more of from life?", options: ["Rest and permission to slow down", "Adventure and excitement", "Recognition and appreciation", "Connection and belonging"] },
    { q: "What truth about themselves did your partner take the longest to accept?", options: ["That they cannot please everyone", "That they need others more than they admit", "That they deserve good things", "That some things are out of their control"] },
    { q: "What does your partner think defines a person's character?", options: ["How they treat those who can do nothing for them", "How they handle failure", "Whether they keep their word", "How they act when no one is watching"] },
    { q: "What does your partner feel most guilty about?", options: ["Not being there for someone", "Words said in anger", "Time they wasted", "Putting themselves last too often"] },
    { q: "What does your partner most want to be understood about them?", options: ["That their quiet does not mean they do not care", "That their toughness hides tenderness", "That they carry more than they show", "That they love more deeply than they say"] },
    { q: "What does your partner believe happens when we are gone?", options: ["Our impact lives on in others", "There is something beyond this life", "We simply return to nature", "They honestly do not know"] },
    { q: "What is the loneliest kind of moment for your partner?", options: ["Being surrounded but feeling unseen", "Facing a hard time alone", "Not being able to share good news", "Feeling misunderstood by loved ones"] },
    { q: "What does your partner think is their most misunderstood quality?", options: ["Their bluntness comes from honesty", "Their reserve comes from depth", "Their intensity comes from caring", "Their humor hides real feeling"] },
    { q: "What does your partner need to feel truly safe with someone?", options: ["Consistency and reliability", "No fear of judgment", "Full honesty always", "Knowing they will not leave"] },
    { q: "What lesson has life taught your partner the hard way?", options: ["That people show you who they are", "That time is the most precious thing", "That you cannot control others", "That you have to advocate for yourself"] },
    { q: "What does your partner most want to heal in themselves?", options: ["Their tendency to overthink", "Their difficulty trusting", "Their harsh inner critic", "Their fear of being vulnerable"] },
    { q: "What does your partner think is worth suffering for?", options: ["The people they love", "A cause they believe in", "Their own growth", "A dream they refuse to give up"] },
    { q: "What does your partner fear inheriting from their parents?", options: ["A specific temperament or temper", "A way of handling conflict", "An emotional distance", "A pattern in relationships"] },
    { q: "What does your partner do when they feel unloved?", options: ["Pull away to protect themselves", "Seek reassurance quietly", "Get busy to distract themselves", "Question whether they did something wrong"] },
    { q: "What does your partner think is the bravest thing a person can do?", options: ["Be vulnerable and open", "Start over from nothing", "Forgive someone who hurt them", "Stay true to themselves under pressure"] },
    { q: "What part of their past does your partner rarely talk about?", options: ["A painful family chapter", "A relationship that scarred them", "A failure they are ashamed of", "A period of real struggle"] },
    { q: "What does your partner believe they are on this earth to do?", options: ["To love and be loved fully", "To create or build something", "To help and uplift others", "They are still searching for it"] },
    { q: "What emotion does your partner find hardest to sit with?", options: ["Uncertainty", "Helplessness", "Rejection", "Loneliness"] },
    { q: "What does your partner wish they could tell their younger self?", options: ["You are enough as you are", "It gets better, hold on", "Do not let fear decide for you", "Cherish the people around you"] },
    { q: "What does your partner think is the hardest part of growing up?", options: ["Realizing your parents are human", "Losing certain friendships", "Carrying more responsibility", "Facing your own flaws"] },
    { q: "What quiet insecurity affects your partner more than they let on?", options: ["Feeling behind their peers", "Doubting they are truly loved", "Worrying they are not interesting enough", "Fearing they are hard to be around"] },
    { q: "What does your partner most crave from the people closest to them?", options: ["To feel truly seen", "To feel accepted without conditions", "To feel appreciated", "To feel they can let their guard down"] },
    { q: "What does your partner think love actually requires?", options: ["Choosing each other every day", "Radical honesty", "Endless patience", "Growing without growing apart"] },
    { q: "What does your partner do to protect their heart?", options: ["Keep some walls up", "Test people before trusting", "Stay independent just in case", "Hold back their deepest feelings"] },
    { q: "What does your partner think they most need to forgive themselves for?", options: ["A past mistake they replay", "Not being there for someone", "Choices made out of fear", "Being too hard on themselves"] },
    { q: "What does your partner believe is the truest sign of love?", options: ["Staying through the hard times", "Complete honesty", "Sacrifice without keeping score", "Feeling fully at home with someone"] },
    { q: "What does your partner secretly hope you never stop doing?", options: ["Choosing them", "Seeing the good in them", "Making them laugh", "Being their safe place"] },
    { q: "What does your partner think their greatest test in life has been?", options: ["A profound loss", "A relationship that broke them open", "A failure they had to rise from", "Learning to accept themselves"] },
    { q: "What does your partner most want their life to have meant?", options: ["That they loved well", "That they made a difference", "That they lived authentically", "That they left people better than they found them"] },
    { q: "What does your partner find hardest to believe about themselves?", options: ["That they are truly worthy of love", "That they are as capable as others see", "That they deserve rest and good things", "That people genuinely like them"] },
    { q: "What does your partner think is the deepest kind of connection?", options: ["Being fully known and still loved", "Understanding without words", "Growing through hardship together", "Feeling like home to each other"] },
    { q: "What does your partner think is their most misunderstood strength?", options: ["Their quietness is depth", "Their toughness is care", "Their bluntness is honesty", "Their calm is real strength"] },
    { q: "What does your partner secretly wish they were better at?", options: ["Letting people in", "Asking for help", "Setting boundaries", "Forgiving themselves"] },
    { q: "What childhood moment does your partner think shaped their heart?", options: ["A moment of feeling loved", "A moment of loss", "A moment of being let down", "A moment of unexpected kindness"] },
    { q: "What does your partner fear people would think if they truly knew them?", options: ["That they are not as strong as they seem", "That they carry a lot of doubt", "That they need more than they admit", "That they are softer than they let on"] },
    { q: "What does your partner do when they feel truly seen?", options: ["They open up more", "They get emotional", "They lean in closer", "They finally relax"] },
    { q: "What value did your partner inherit from their family?", options: ["Loyalty", "Hard work", "Kindness", "Resilience"] },
    { q: "What does your partner most fear losing about themselves?", options: ["Their independence", "Their kindness", "Their drive", "Their sense of who they are"] },
    { q: "What does your partner believe heals a person most?", options: ["Being truly heard", "Unconditional love", "Time and patience", "Meaningful purpose"] },
    { q: "What does your partner struggle to forgive in themselves?", options: ["Past mistakes", "Times they let someone down", "Choices made from fear", "Being too self-critical"] },
    { q: "What does your partner do when overwhelmed by emotion?", options: ["Go quiet", "Seek closeness", "Distract themselves", "Process it alone"] },
    { q: "What does your partner think makes love last?", options: ["Choosing each other daily", "Honest communication", "Growing together", "Endless patience"] },
    { q: "What part of their story does your partner rarely share?", options: ["A painful family chapter", "A past heartbreak", "A failure they hide", "A hard season they survived"] },
    { q: "What does your partner most want to feel from you?", options: ["Truly understood", "Fully accepted", "Deeply appreciated", "Safe to be themselves"] },
    { q: "What does your partner think is the bravest choice a person can make?", options: ["Being vulnerable", "Starting over", "Forgiving", "Staying true to themselves"] },
    { q: "What does your partner quietly worry about most?", options: ["Not being enough", "The future", "Losing loved ones", "Falling behind"] },
    { q: "What belief did your partner have to let go of to grow?", options: ["That love is earned", "That vulnerability is weakness", "That success defines them", "That conflict means failure"] },
    { q: "What does your partner think they most need to heal?", options: ["Their overthinking", "Their trust issues", "Their inner critic", "Their fear of being vulnerable"] },
    { q: "What does your partner most crave from those closest to them?", options: ["To feel seen", "To feel accepted", "To feel appreciated", "To let their guard down"] },
    { q: "What does your partner do to guard their heart?", options: ["Keep some walls up", "Test people first", "Stay independent", "Hold back deep feelings"] },
    { q: "What does your partner think love truly requires?", options: ["Daily choice", "Radical honesty", "Endless patience", "Growing side by side"] },
    { q: "What does your partner quietly hope you always keep doing?", options: ["Choosing them", "Seeing their good", "Making them laugh", "Being their safe place"] },
    { q: "What does your partner consider their greatest test in life?", options: ["A profound loss", "A relationship that broke them open", "A failure they rose from", "Learning to accept themselves"] },
    { q: "What does your partner most hope their life will have stood for?", options: ["That they loved well", "That they made a difference", "That they lived truly", "That they left people better"] },
    { q: "What does your partner struggle most to accept about themselves?", options: ["That they are worthy of love", "That they are as capable as others see", "That they deserve rest", "That people genuinely like them"] },
    { q: "What emotion does your partner hide behind a smile?", options: ["Sadness", "Anxiety", "Exhaustion", "Loneliness"] },
    { q: "What does your partner think shaped their fear of failure?", options: ["High expectations growing up", "A specific disappointment", "Comparing to others", "Wanting to prove themselves"] },
    { q: "What does your partner most need to hear when doubting themselves?", options: ["That they are enough", "That you believe in them", "That it is okay to struggle", "That you are proud of them"] },
    { q: "What does your partner think is the hardest part of loving deeply?", options: ["The fear of loss", "The vulnerability", "The sacrifice", "The trust it takes"] },
    { q: "When your partner feels unloved, how do they typically cope?", options: ["Pull away quietly", "Seek reassurance", "Get busy", "Question themselves"] },
    { q: "What does your partner most want to be remembered for?", options: ["Their kindness", "Their strength", "Their love", "Their impact"] },
    { q: "What does your partner think is the truest sign of love?", options: ["Staying through hardship", "Complete honesty", "Selfless sacrifice", "Feeling at home together"] },
    { q: "What childhood wish does your partner still carry?", options: ["To feel fully seen", "To feel safe", "To be free", "To make their family proud"] },
    { q: "What does your partner believe is worth enduring hardship for?", options: ["The people they love", "A cause they believe in", "Their own growth", "A dream they refuse to release"] },
    { q: "What does your partner do to feel grounded in chaos?", options: ["Plan and organize", "Retreat alone", "Lean on loved ones", "Throw themselves into work"] },
    { q: "What quiet fear drives many of your partner choices?", options: ["Fear of abandonment", "Fear of failure", "Fear of not mattering", "Fear of losing control"] },
    { q: "What does your partner most want you to understand about them?", options: ["Their quiet is not distance", "Their strength hides softness", "They carry more than they show", "They love more than they say"] },
    { q: "What does your partner believe is life greatest lesson?", options: ["People show you who they are", "Time is precious", "You cannot control others", "You must value yourself"] },
    { q: "What does your partner feel guiltiest about?", options: ["Not being there for someone", "Words said in anger", "Time wasted", "Neglecting themselves"] },
    { q: "What does your partner think their younger self would admire now?", options: ["Their courage", "Their growth", "Their choices", "That they made it"] },
    { q: "How does your partner respond when they feel truly misunderstood?", options: ["Shut down", "Over-explain", "Get defensive", "Withdraw to process"] },
    { q: "What label does your partner most fear being given?", options: ["Weak", "Selfish", "A failure", "Too much"] },
    { q: "What does your partner think is the root of their insecurities?", options: ["Childhood experiences", "A past relationship", "High expectations", "Comparison to others"] },
    { q: "What does your partner most want to give the people they love?", options: ["Security", "Joy", "Understanding", "Their best self"] },
    { q: "What truth about life did your partner learn the hard way?", options: ["That healing takes time", "That not everyone stays", "That vulnerability matters", "That you must speak up"] },
    { q: "What does your partner think makes them hard to know?", options: ["Their reserved nature", "Their deep layers", "Their protective walls", "Their fear of judgment"] },
    { q: "What does your partner need to feel truly safe with you?", options: ["Consistency", "No judgment", "Full honesty", "Knowing you will stay"] },
    { q: "What does your partner most regret not doing?", options: ["Speaking up sooner", "Taking a risk", "Cherishing a moment", "Being more honest"] },
    { q: "What does your partner think is the bravest thing they have done?", options: ["Left something safe", "Was truly vulnerable", "Stood up for someone", "Faced a deep fear"] },
    { q: "What quiet strength does your partner not give themselves credit for?", options: ["Their resilience", "Their empathy", "Their patience", "Their loyalty"] },
    { q: "What does your partner think heals a broken heart?", options: ["Time", "New love", "Self-work", "Support from others"] },
    { q: "What does your partner most fear about vulnerability?", options: ["Being rejected", "Being seen as weak", "Being hurt again", "Losing control"] },
    { q: "What does your partner think defines a life well lived?", options: ["Love shared", "Impact made", "Being true to yourself", "Growth over time"] },
    { q: "What does your partner do when they cannot express their feelings?", options: ["Go silent", "Get restless", "Bottle it up", "Show it through actions"] },
    { q: "What does your partner most want to forgive themselves for?", options: ["A past mistake", "Not being there", "Fearful choices", "Being too hard on themselves"] },
    { q: "What childhood dynamic still affects how your partner loves?", options: ["How affection was shown", "How conflict was handled", "How emotions were treated", "How love felt conditional"] },
    { q: "What does your partner think is the hardest emotion to admit?", options: ["Fear", "Jealousy", "Sadness", "Needing help"] },
    { q: "What does your partner most hope to grow into?", options: ["A more open person", "A more confident one", "A more peaceful one", "A more present one"] },
    { q: "What does your partner believe people deserve more of?", options: ["Compassion", "Honesty", "Patience", "Second chances"] },
    { q: "What does your partner most fear about the future?", options: ["Not achieving enough", "Losing loved ones", "Feeling stuck", "The uncertainty"] },
    { q: "What does your partner think is their deepest personal growth?", options: ["Learning to trust", "Learning to rest", "Learning to open up", "Learning to accept themselves"] },
    { q: "What does your partner do to cope with a hard day?", options: ["Withdraw quietly", "Stay busy", "Reach out to you", "Sit with it alone"] },
    { q: "What does your partner most want their close ones to know?", options: ["How much they care", "How hard they try", "How much they carry", "How deeply they feel"] },
    { q: "What does your partner think is the key to inner peace?", options: ["Self-acceptance", "Meaningful connection", "Living authentically", "A sense of purpose"] },
    { q: "What old belief does your partner still work to unlearn?", options: ["That they must be perfect", "That rest is laziness", "That needing others is weak", "That love must be earned"] },
    { q: "What does your partner most fear inheriting from their past?", options: ["A pattern in love", "A way of handling conflict", "An emotional wall", "A specific temperament"] },
    { q: "What does your partner think their toughest season taught them?", options: ["Who truly shows up", "Their own strength", "What matters most", "To ask for help"] },
    { q: "What does your partner most crave when life feels heavy?", options: ["Rest", "Reassurance", "Connection", "Understanding"] },
    { q: "What does your partner think is the deepest form of trust?", options: ["Being fully honest", "Being vulnerable", "Relying on someone", "Believing they will stay"] },
    { q: "What does your partner rarely let anyone see?", options: ["Their doubts", "Their sensitivity", "Their exhaustion", "Their fears"] },
    { q: "What does your partner most want to make peace with?", options: ["A past choice", "A relationship that ended", "Their own flaws", "Things beyond their control"] },
    { q: "What does your partner think makes someone truly strong?", options: ["Being vulnerable", "Getting back up", "Staying kind", "Being honest"] },
    { q: "What does your partner most fear about being truly known?", options: ["Being judged", "Being rejected", "Being seen as flawed", "Being too much"] },
    { q: "What does your partner believe they are here to do?", options: ["To love fully", "To create something", "To help others", "They are still discovering"] },
    { q: "What does your partner most need to feel understood?", options: ["To be listened to", "To not be judged", "To be given time", "To be accepted as is"] },
    { q: "What does your partner find the hardest part of becoming an adult?", options: ["Seeing parents as human", "Losing friendships", "More responsibility", "Facing their flaws"] },
    { q: "What does your partner quietly wish others recognized in them?", options: ["Strength", "Kindness", "Depth", "That they are trying"] },
    { q: "What does your partner think love should always feel like?", options: ["Safe", "Freeing", "Steady", "Warm"] },
    { q: "What does your partner most fear about disappointing others?", options: ["Losing their respect", "Being seen as a failure", "Letting them down", "Not being enough"] },
    { q: "What does your partner think is the bravest thing about love?", options: ["Choosing to trust again", "Being fully open", "Staying through hard times", "Loving without guarantees"] },
    { q: "What does your partner most want to heal from their past?", options: ["An old heartbreak", "A family wound", "A personal failure", "A period of loneliness"] },
    { q: "What does your partner think they most need to accept?", options: ["That they are enough", "That they need others", "That they deserve good", "That they cannot control everything"] },
    { q: "What does your partner do when they feel like a burden?", options: ["Pull back", "Overcompensate", "Handle things alone", "Apologize too much"] },
    { q: "What does your partner think is the deepest kind of love?", options: ["Being chosen daily", "Being fully accepted", "Being understood", "Feeling at home"] },
    { q: "What does your partner most fear losing in a relationship?", options: ["Their identity", "The connection", "The passion", "The trust"] },
    { q: "What does your partner think their heart most needs?", options: ["Security", "Freedom", "Connection", "Peace"] },
    { q: "What does your partner most struggle to believe you feel for them?", options: ["That you truly love them", "That you find them attractive", "That you will stay", "That they are enough"] },
    { q: "What does your partner think is worth fighting for?", options: ["The people they love", "Their dreams", "Their values", "The relationship"] },
    { q: "What does your partner do when they need comfort but cannot ask?", options: ["Grow quiet and hope you notice", "Stay close without words", "Distract themselves", "Wait for you to reach out"] },
    { q: "What does your partner most want to teach the world?", options: ["Kindness", "Resilience", "Honesty", "Compassion"] },
    { q: "What does your partner think is the hardest kind of forgiveness?", options: ["Forgiving themselves", "Forgiving betrayal", "Forgiving family", "Letting go of resentment"] },
    { q: "What does your partner most fear about being vulnerable with you?", options: ["Being too much", "Being misunderstood", "Being seen as weak", "Being hurt"] },
    { q: "What does your partner believe makes a person worthy of love?", options: ["Simply being themselves", "Their kindness", "Their honesty", "Nothing to prove, just being"] },
    { q: "What does your partner most want to let go of?", options: ["Old fears", "Past regrets", "Self-doubt", "The need to control"] },
    { q: "What does your partner think their greatest quiet strength is?", options: ["Enduring hard things", "Understanding others", "Staying gentle", "Showing up faithfully"] },
    { q: "What does your partner most want to feel at the end of a hard day?", options: ["Not alone", "Understood", "Safe", "Loved anyway"] },
    { q: "What does your partner think is the deepest thing you have given them?", options: ["A sense of home", "Unconditional acceptance", "True understanding", "A safe place to be themselves"] },
    { q: "What does your partner most fear people assume about them?", options: ["That they have it all together", "That they do not care much", "That they are simpler than they are", "That they are tougher than they feel"] },
    { q: "What does your partner think helps them feel whole?", options: ["Being loved as they are", "Living with purpose", "Deep connection", "Inner peace"] },
    { q: "What old wound does your partner still gently carry?", options: ["Feeling overlooked", "A pressure to be perfect", "A lack of warmth", "Feeling responsible for others"] },
    { q: "What does your partner most want to give themselves permission to do?", options: ["Rest", "Feel their feelings", "Ask for help", "Be imperfect"] },
    { q: "What does your partner think is the hardest thing to say out loud?", options: ["I need you", "I am struggling", "I am scared", "I am not okay"] },
    { q: "What does your partner most hope your love teaches them?", options: ["That they are worthy", "That they can be open", "That they are safe", "That they are enough"] },
    { q: "What does your partner believe is the point of it all?", options: ["Love and connection", "Growth", "Experiencing life fully", "Leaving good behind"] },
    { q: "What does your partner most want to be gentle with in themselves?", options: ["Their mistakes", "Their fears", "Their pace", "Their expectations"] },
    { q: "What does your partner think their soul most longs for?", options: ["To be understood", "To belong", "To feel free", "To matter"] },
    { q: "What does your partner do to feel like themselves again?", options: ["Time alone", "Time with you", "A favorite ritual", "Getting outside"] },
    { q: "What does your partner most fear about opening their heart fully?", options: ["Getting hurt", "Being rejected", "Losing control", "Being truly seen"] },
    { q: "What does your partner think love has taught them most?", options: ["Patience", "Trust", "Selflessness", "Vulnerability"] },
    { q: "What does your partner most want to make sure you always know?", options: ["That they love you deeply", "That you are their home", "That they are grateful for you", "That they are all in"] },
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
  duo?: { me: string; them: string } | null;
}

export default function CouplesQuiz({ onBack, onGameEnd, duo }: Props) {
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

  /* -- if invited via a duo prop, skip setup: seed both names and jump
        straight to the category/choose screen (what 'setup' advances to) -- */
  useEffect(() => {
    if (duo) {
      setName(0, duo.me);
      setName(1, duo.them);
      setPhase('category');
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
