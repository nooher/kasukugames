import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Sparkles, Eye, EyeOff, ChevronRight, Heart, Star, Crown, Check, X, UserCircle, Lock, RotateCcw, Flame, HelpCircle } from 'lucide-react';
import { COLOR, RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxReveal } from '../lib/sfx';

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
  accent: COLOR.rose,
  emerald: COLOR.emerald,
  sapphire: COLOR.sapphire,
  violet: COLOR.violet,
  amber: COLOR.amber,
  teal: COLOR.teal,
  gold: COLOR.gold,
  surface: COLOR.surface,
} as const;

const glass = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
};

const PLAYER_COLORS = [C.accent, C.sapphire, C.emerald, C.violet];

/* ------------------------------------------------------------------ */
/*  Question bank                                                      */
/* ------------------------------------------------------------------ */
interface Question {
  template: string;
  options: string[];
}

type Category = 'relationships' | 'secrets' | 'preferences' | 'hypothetical' | 'spicy';

const CATEGORY_META: Record<Category, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  relationships: { label: 'Relationships', color: C.accent, icon: <Heart size={18} />, desc: 'Love lives, dating habits, relationship patterns' },
  secrets: { label: 'Secrets', color: C.violet, icon: <Lock size={18} />, desc: 'Hidden talents, guilty pleasures, things they hide' },
  preferences: { label: 'Preferences', color: C.sapphire, icon: <Star size={18} />, desc: 'Tastes, favorites, dream scenarios, lifestyle' },
  hypothetical: { label: 'Hypothetical', color: C.emerald, icon: <HelpCircle size={18} />, desc: 'What-if scenarios, moral dilemmas, fantasy' },
  spicy: { label: 'Spicy', color: C.amber, icon: <Flame size={18} />, desc: 'Genuinely personal and revealing deep cuts' },
};

const QUESTIONS: Record<Category, Question[]> = {
  relationships: [
    { template: "What's [name]'s biggest dealbreaker in a relationship?", options: ["Bad hygiene or laziness", "Dishonesty or secretiveness", "No ambition or drive", "Being rude to other people"] },
    { template: "How many people has [name] seriously dated?", options: ["0-1, they're very selective", "2-3, a handful of real ones", "4-6, they've been around", "7+, they've had a full roster"] },
    { template: "What's [name]'s love language?", options: ["Words of affirmation", "Physical touch", "Quality time", "Acts of service"] },
    { template: "What does [name] notice first when meeting someone attractive?", options: ["Their smile and eyes", "Their confidence and energy", "Their style and how they carry themselves", "Their sense of humor"] },
    { template: "How long does it take [name] to say 'I love you'?", options: ["Within weeks if they feel it", "A few months of getting to know them", "They wait until the other person says it first", "They might never say it at all"] },
    { template: "What would [name] do if their partner forgot their anniversary?", options: ["Be hurt but not say anything", "Bring it up immediately and be upset", "Let it slide, it's just a date", "Plan their own celebration and guilt-trip later"] },
    { template: "How does [name] act when they're into someone?", options: ["Goes out of their way to be around them", "Plays it cool to the point of seeming uninterested", "Tells everyone except the actual person", "Gets nervous and awkward around them"] },
    { template: "What type of partner is [name] most attracted to?", options: ["The mysterious, hard-to-read type", "The funny, easygoing class clown", "The ambitious, driven go-getter", "The kind, emotionally intelligent nurturer"] },
    { template: "How would [name] handle getting cheated on?", options: ["Walk away instantly, no second chances", "Hear them out but probably still leave", "Try to work through it if there's genuine remorse", "Pretend they don't know and investigate first"] },
    { template: "What's [name]'s biggest relationship red flag they ignore?", options: ["Inconsistent communication and mixed signals", "Moving way too fast emotionally", "Being overly jealous or possessive", "Talking about their ex constantly"] },
    { template: "How does [name] break up with someone?", options: ["A direct, honest conversation in person", "A long text explaining everything", "Slowly pulling away until it fizzles out", "Avoids it until the other person does it"] },
    { template: "What's [name]'s ideal first date?", options: ["Dinner at a nice restaurant", "Something adventurous like hiking or an escape room", "A casual coffee or drinks", "A walk and real conversation somewhere pretty"] },
    { template: "How does [name] handle jealousy?", options: ["Tries to hide it but it eats them up inside", "Addresses it head-on with their partner", "Gets passive-aggressive about it", "Genuinely doesn't get jealous often"] },
    { template: "What would [name] sacrifice for love?", options: ["Their career or dream job", "Their city or country for a move", "Their independence and alone time", "Nothing, love should enhance not require sacrifice"] },
    { template: "How quickly does [name] move on after a breakup?", options: ["They're on the apps within a week", "Months of processing alone", "They rebound fast but aren't truly over it", "They take years and never fully let go"] },
    { template: "What's [name]'s opinion on long-distance relationships?", options: ["Would never do it, needs physical presence", "Could make it work for the right person", "Already tried it and it didn't work", "Thinks it can actually be really romantic"] },
    { template: "What is [name] like when they're in love?", options: ["Clingy and wants to be together constantly", "A better version of themselves, more motivated", "Anxious and overthinking everything", "Relaxed and genuinely happy, their best self"] },
    { template: "What's [name]'s biggest relationship insecurity?", options: ["Not being interesting or fun enough", "Being too much or too intense", "Not being attractive enough", "Being replaceable or forgettable"] },
    { template: "How does [name] feel about public displays of affection?", options: ["Loves it, the more the better", "Comfortable with small gestures like hand holding", "Finds it uncomfortable and prefers privacy", "Depends entirely on the mood and setting"] },
    { template: "What would make [name] fall in love instantly?", options: ["Someone who makes them laugh until they cry", "Someone who remembers the small details", "Someone who challenges them intellectually", "Someone who accepts them at their worst"] },
    { template: "How does [name] show love in a relationship?", options: ["Through constant thoughtful gestures", "Through deep conversations and emotional support", "Through physical closeness and affection", "Through loyalty and always showing up"] },
    { template: "What relationship mistake does [name] keep repeating?", options: ["Falling for someone unavailable", "Giving too much too soon", "Not communicating when something is wrong", "Choosing excitement over stability"] },
    { template: "What's [name]'s stance on being friends with an ex?", options: ["Absolutely not, clean break only", "Sure, once enough time has passed", "They're already friends with most of their exes", "Only if there are mutual friends involved"] },
    { template: "How does [name] act after a fight with their partner?", options: ["Gives the silent treatment for a while", "Wants to resolve it immediately, can't sleep on it", "Sends a long apology text even if they weren't wrong", "Pretends it didn't happen the next day"] },
    { template: "What's [name]'s biggest turn-off?", options: ["Arrogance and talking about themselves constantly", "Being unreliable and flaky", "Bad manners, especially to staff", "Having no curiosity or depth"] },
    { template: "How would [name] feel about their partner having a close friend of the opposite sex?", options: ["Completely fine, trust is everything", "Fine but would want to meet the friend", "A little uneasy but wouldn't say anything", "It would bother them, they can't help it"] },
    { template: "Does [name] believe in soulmates?", options: ["Yes, completely", "Not soulmates, but deep compatibility", "No, love is a choice you make daily", "They want to believe but aren't sure"] },
    { template: "What relationship phase does [name] enjoy most?", options: ["The butterflies and excitement of early dating", "The deep comfort of a long-term relationship", "The 'getting to know you' honeymoon period", "The building-a-life-together phase"] },
    { template: "What would [name] never tolerate in a partner?", options: ["Lying, even about small things", "Disrespecting their family", "Not having their own goals or ambition", "Controlling behavior or possessiveness"] },
    { template: "How would [name] propose or want to be proposed to?", options: ["Something grand and public", "Something intimate and private, just the two of them", "A surprise they never saw coming", "Something simple, no big production needed"] },
    { template: "What's [name]'s attachment style?", options: ["Anxious, they need lots of reassurance", "Avoidant, they pull away when things get deep", "Secure, they're pretty balanced", "A chaotic mix depending on the person"] },
    { template: "How does [name] define loyalty?", options: ["Never looking at anyone else, even casually", "Always having their partner's back in public", "Being emotionally faithful, not just physically", "Choosing the relationship even when it's hard"] },
    { template: "What celebrity couple does [name] secretly admire?", options: ["The classic power couple, both at the top", "The 'against all odds' love story couple", "The private, keep-it-out-of-the-public-eye couple", "The funny, best-friends-who-married couple"] },
    { template: "What's [name]'s stance on dating apps?", options: ["Loves them, it's how modern dating works", "Uses them but hates the process", "Prefers meeting people organically", "Swore them off after bad experiences"] },
    { template: "Would [name] take back an ex?", options: ["Never, what's done is done", "Only if they both genuinely grew and changed", "Probably, if they're being honest", "Already has, no judgment"] },
    { template: "How does [name] handle the 'what are we' conversation?", options: ["Brings it up directly within weeks", "Waits for the other person to bring it up", "Avoids it as long as humanly possible", "Drops hints until the other person catches on"] },
    { template: "What's [name]'s love language they need to receive?", options: ["Verbal reassurance and compliments", "Physical affection and closeness", "Someone making time and being present", "Thoughtful gifts or gestures"] },
    { template: "How would [name] react to a partner wanting an open relationship?", options: ["Absolutely not, hard boundary", "Would consider it if there were rules", "Might be open to it with the right person", "Would agree but secretly hate it"] },
    { template: "What's the longest [name] has waited before texting back someone they like?", options: ["They respond instantly, no games", "A calculated 30-60 minutes", "Hours, to seem busy and unbothered", "Days, pure power move"] },
    { template: "How many times would [name] forgive the same mistake?", options: ["Once, after that it's a pattern", "Two or three times if it's someone they love", "Too many times, they know it's a weakness", "Zero tolerance, once is enough"] },
    { template: "What's [name]'s opinion on meeting a partner's parents?", options: ["Loves it, wants to impress them", "Terrified but does it anyway", "Thinks it's too much pressure", "Sees it as a normal part of dating"] },
    { template: "What would [name] change about their dating history?", options: ["Would have waited longer to get serious", "Would have left certain relationships sooner", "Would have been more open and vulnerable", "Wouldn't change anything, it all led to growth"] },
    { template: "How does [name] feel about surprise romantic gestures?", options: ["Loves them more than anything", "Appreciates them but prefers consistency", "Finds them a bit overwhelming or performative", "Depends entirely on what the gesture is"] },
    { template: "What's [name]'s opinion on arguing in relationships?", options: ["It's healthy and necessary", "They avoid conflict at all costs", "They argue to win, not to resolve", "They see it as a sign something is wrong"] },
    { template: "How does [name] feel about their partner posting them on social media?", options: ["Wants to be posted constantly", "A few tasteful posts are nice", "Prefers to keep the relationship private", "Doesn't care at all about social media"] },
    { template: "What would [name] do if they caught feelings for their best friend?", options: ["Tell them immediately and risk the friendship", "Bury it deep and never mention it", "Drop subtle hints and see if it's mutual", "Distance themselves to make the feelings go away"] },
    { template: "What kind of wedding does [name] secretly want?", options: ["A huge, lavish celebration with everyone they know", "A small, intimate ceremony with close family", "An elopement somewhere breathtaking", "Honestly, they'd skip the wedding entirely"] },
    { template: "How does [name] handle a partner who's more successful than them?", options: ["Proud and supportive, no ego about it", "Motivated to level up themselves", "A little intimidated, if they're being honest", "It creates quiet insecurity they don't talk about"] },
    { template: "What's the most romantic thing [name] has ever done?", options: ["A handwritten letter or message", "A surprise trip or elaborate date plan", "A grand gesture during a tough moment", "The romance is in daily small things for them"] },
    { template: "How does [name] feel about couples therapy?", options: ["Great idea, everyone should go", "Only if things are really bad", "Thinks it means the relationship is failing", "Would go but would feel weird about it"] },
    { template: "What does [name] think is the hardest part of relationships?", options: ["Maintaining individuality while being a partner", "Navigating different communication styles", "Keeping the spark alive long-term", "Being vulnerable and truly letting someone in"] },
    { template: "How does [name] react when someone they like doesn't text back?", options: ["Spirals into overthinking mode", "Sends another text like nothing happened", "Tells themselves the person is just busy", "Writes them off immediately, on to the next"] },
    { template: "What does [name] value most in a life partner?", options: ["Shared values and vision for the future", "Emotional intelligence and communication", "Physical attraction and chemistry", "A sense of humor and ability to have fun together"] },
    { template: "How does [name] feel about dating someone with kids?", options: ["Open to it, kids are great", "Would consider it for the right person", "Prefers not to, wants to start fresh", "Absolutely not, non-negotiable"] },
    { template: "How does [name] handle a partner who earns much less?", options: ["Doesn't care at all, money isn't love", "Happy to support but wants them to have drive", "It would quietly bother them over time", "Would want a partner at a similar financial level"] },
    { template: "What stage of love is [name] most afraid of?", options: ["The beginning, vulnerability is terrifying", "The middle, when routine sets in", "The deep commitment, like marriage", "The potential ending, loss is their greatest fear"] },
    { template: "Would [name] stay in a loveless marriage for the kids?", options: ["Yes, the kids come first always", "No, kids sense unhappiness anyway", "They'd try everything before deciding", "They'd live separately but co-parent well"] },
    { template: "What secret relationship habit does [name] have?", options: ["Rereading old texts from the person they like", "Overthinking every interaction to the point of paralysis", "Looking up the person's ex on social media", "Creating entire future scenarios in their head"] },
    { template: "How does [name] feel when a friend starts dating and has less time?", options: ["Happy for them but secretly a little hurt", "Totally fine, they have their own life", "Annoyed, friendships shouldn't change", "They've been that friend, so they get it"] },
    { template: "What's [name]'s dream relationship dynamic?", options: ["Equal partners in everything", "One leads, one supports, and they switch", "Best friends who happen to be in love", "Passionate and intense, never boring"] },
    { template: "How soon does [name] introduce a partner to their friends?", options: ["Almost immediately, they want approval", "After a month or two of dating", "Only when it's very serious", "They keep relationships and friendships separate"] },
    { template: "How does [name] flirt with someone they like?", options: ["Teasing and playful banter", "Compliments and full-on charm", "Subtle and barely noticeable", "They freeze up and can't flirt at all"] },
    { template: "What pet name would [name] give a partner?", options: ["Babe or baby, the classics", "Something silly and made-up", "Their actual name, no pet names", "An embarrassingly sweet nickname"] },
    { template: "What's [name]'s texting style with someone they're into?", options: ["Fast replies, long messages", "Cool and measured, never too eager", "Voice notes and memes over words", "They overthink every single text"] },
    { template: "Does [name] believe in love at first sight?", options: ["Absolutely, they've felt it", "It's just strong attraction, not love", "No, love takes real time to build", "They want to believe it but stay skeptical"] },
    { template: "What's [name]'s ideal age gap in a relationship?", options: ["Same age, on the same wavelength", "A few years older suits them", "A few years younger keeps it fun", "Age is irrelevant, connection is all"] },
    { template: "How does [name] react when a partner cries?", options: ["Drops everything to hold them", "Tries to fix the problem right away", "Gets awkward and unsure what to do", "Gives them space to let it out"] },
    { template: "How does [name] take care of a sick partner?", options: ["Full nurse mode, soup and blankets", "Checks in but keeps their distance", "Sends supplies but hates being around illness", "Stays close and just keeps them company"] },
    { template: "How does [name] handle a partner's most annoying habit?", options: ["Brings it up gently and directly", "Silently lets it build up until they snap", "Makes a running joke out of it", "Genuinely stops noticing after a while"] },
    { template: "What would [name] do if their partner had a big celebrity crush?", options: ["Laugh it off, totally unbothered", "Play along and tease them about it", "Feel a tiny bit insecure but hide it", "Draw a hard line at posters on the wall"] },
    { template: "Who does [name] think should pay on a first date?", options: ["Whoever asked should pay", "Split it evenly every time", "They always insist on covering it", "It should just flow naturally, no rules"] },
    { template: "What's [name]'s stance on moving in together?", options: ["The sooner the better once it's serious", "Only after a year or more", "Only after engagement", "They'd rather keep separate spaces forever"] },
    { template: "How does [name] divide chores in a relationship?", options: ["Strict fair split down the middle", "Whoever notices it does it", "They do most of it without complaining", "It becomes a constant negotiation"] },
    { template: "What's [name]'s stance on joint finances with a partner?", options: ["Fully combined, what's mine is yours", "Separate accounts plus a shared one", "Totally separate, keep money independent", "They avoid the money conversation entirely"] },
    { template: "How does [name] feel about their partner having a colorful dating past?", options: ["Completely fine, the past is the past", "Curious but not bothered", "A little insecure about it", "They'd rather not know the details"] },
    { template: "What would [name] do if a partner's family disliked them?", options: ["Try relentlessly to win them over", "Stay polite but keep their distance", "Let their partner handle the family", "It would seriously make them reconsider"] },
    { template: "How does [name] react to compliments from a partner?", options: ["Soaks them up and glows", "Deflects and can't take a compliment", "Compliments them right back", "Gets shy and changes the subject"] },
    { template: "What compliment means the most to [name]?", options: ["That they're funny", "That they're kind or thoughtful", "That they're attractive", "That they're smart or capable"] },
    { template: "Would [name] look through a partner's phone if given the chance?", options: ["Never, that's a hard line for them", "Only if they already had suspicions", "They'd be tempted but resist", "Honestly, yes, they'd peek"] },
    { template: "How does [name] rebuild trust after it's been broken?", options: ["Slowly, and they never fully forget", "All or nothing, they're in or they're out", "Through lots of honest conversation", "They struggle to ever trust again"] },
    { template: "How does [name] feel about cuddling?", options: ["Lives for it, all day every day", "Loves it but needs space to sleep", "Takes it or leaves it", "Gets too hot and taps out quickly"] },
    { template: "What's [name]'s preferred sleeping setup with a partner?", options: ["Tangled together all night", "Start close, drift apart to sleep", "Separate sides, no touching while asleep", "Separate blankets, ideally separate rooms"] },
    { template: "How does [name] handle a situationship with no label?", options: ["Demands clarity fast or walks", "Rides it out and hopes it evolves", "Pretends they're fine while quietly hurting", "Thrives in it, they like no strings"] },
    { template: "How does [name] define being exclusive?", options: ["No one else, on apps or in person", "A clear conversation makes it official", "Actions matter more than a label", "It should just be understood without asking"] },
    { template: "How does [name] feel about soft-launching a partner on social media?", options: ["Loves the mystery of it", "Would rather hard-launch or nothing", "Keeps relationships fully offline", "Doesn't care about posting either way"] },
    { template: "When would [name] first say 'I miss you' to someone new?", options: ["Early, they wear their heart out loud", "Only once they're sure it's mutual", "They feel it long before they say it", "They struggle to say it at all"] },
    { template: "Would [name] share their phone passwords with a partner?", options: ["Yes, they have nothing to hide", "Only after full trust is built", "No, some privacy stays sacred", "They'd share but feel weird about it"] },
    { template: "How does [name] feel about live location sharing with a partner?", options: ["Great, it's convenient and caring", "Fine short-term, not permanently", "Feels controlling to them", "They'd share it but rarely check it"] },
    { template: "Does [name] still follow their exes on social media?", options: ["Yes, all of them, no big deal", "No, clean break means unfollow", "Only the ones who ended amicably", "They unfollowed but still lurk sometimes"] },
    { template: "Would [name] block an ex after a breakup?", options: ["Instantly, block and delete", "Only if the ex made it messy", "Never, they stay civil", "They'd mute rather than block"] },
    { template: "How much closure does [name] need after a relationship ends?", options: ["A full final conversation, always", "None, they move on cold turkey", "Just a clear reason why", "They give themselves their own closure"] },
    { template: "How likely is [name] to rebound quickly after a breakup?", options: ["Very, they don't like being single", "Not at all, they need to heal alone", "They rebound but regret it later", "Depends entirely on who ended it"] },
    { template: "How does [name] feel about dating a coworker?", options: ["Would never mix work and love", "Would risk it for the right person", "Already has, no regrets", "Would keep it a total secret"] },
    { template: "How does [name] feel about dating someone much older?", options: ["Totally open to it", "Only a little older, not much", "Prefers their own age range", "Not for them at all"] },
    { template: "What personality type does [name] clash with most?", options: ["The overly controlling type", "The flaky, non-committal type", "The loud, attention-seeking type", "The cold, emotionally shut-off type"] },
    { template: "What's [name]'s conflict style in a relationship?", options: ["Talk it out immediately, no cooling off", "Needs space before they can discuss it", "Avoids conflict until it explodes", "Stays calm and negotiates like a diplomat"] },
    { template: "What's [name]'s apology style when they're wrong?", options: ["A heartfelt, direct sorry", "A grand gesture instead of words", "They struggle to say the actual words", "They apologize by acting sweet, not talking"] },
    { template: "How does [name] tell love apart from infatuation?", options: ["Love stays when the excitement fades", "They honestly can't tell in the moment", "Love is calm, infatuation is anxious", "They assume it's love until proven otherwise"] },
    { template: "How many kids does [name] want?", options: ["None, kids aren't for them", "One or two, a small family", "A big, full house of them", "They're genuinely undecided"] },
    { template: "Would [name] want a pet before kids with a partner?", options: ["Definitely, a pet is the trial run", "No, they'd go straight to kids", "A pet instead of kids entirely", "Neither, they want just the two of them"] },
    { template: "What's [name]'s Valentine's Day energy?", options: ["All in, plans it for weeks", "Low-key dinner is enough", "Thinks it's an overrated cash grab", "Forgets it exists until the day of"] },
    { template: "How much effort does [name] put into a partner's birthday?", options: ["A huge surprise production", "A thoughtful gift and a nice dinner", "Something small but heartfelt", "They're notoriously last-minute about it"] },
    { template: "How does [name] comfort a partner after a rough day?", options: ["Listens without trying to fix it", "Jumps in with solutions immediately", "Distracts them with fun and food", "Gives them quiet space to reset"] },
    { template: "What triggers [name]'s jealousy the most?", options: ["A partner texting someone they don't know", "A partner praising someone else", "A partner's ex still in the picture", "Almost nothing, they're secure"] },
    { template: "How much alone time does [name] need inside a relationship?", options: ["A lot, they recharge solo", "A little, but mostly together", "Barely any, they want constant togetherness", "It shifts wildly by mood and week"] },
    { template: "Does [name] prefer a slow burn or falling fast?", options: ["Slow burn, let it build naturally", "Falling fast, all in from day one", "Slow, they need to trust first", "Fast, then they panic and pull back"] },
    { template: "What would [name] do if someone was breadcrumbing them?", options: ["Call it out and end it", "Keep hoping it turns into something", "Play the same game right back", "Fade away without a word"] },
    { template: "What's [name]'s reaction to being ghosted?", options: ["Sends one text then lets it go", "Spirals wondering what they did wrong", "Instantly writes the person off", "Assumes the worst happened to them"] },
    { template: "How does [name] end things when they lose interest?", options: ["An honest, in-person conversation", "A carefully worded breakup text", "They slowly fade until it dies", "They wait for the other person to end it"] },
    { template: "What green flag does [name] look for immediately?", options: ["Kindness to strangers and staff", "Emotional openness and honesty", "Ambition and having their life together", "A great sense of humor"] },
    { template: "What's the first thing that makes [name] lose interest?", options: ["Arrogance or a big ego", "Flakiness and broken plans", "Bad texting and dead conversation", "No ambition or direction"] },
    { template: "How does [name] handle a partner who's emotionally distant?", options: ["Pursues harder to close the gap", "Pulls back to match their energy", "Asks directly what's going on", "Quietly resents it and says nothing"] },
    { template: "How does [name] feel about grand romantic gestures in public?", options: ["Loves being the center of it", "Sweet in private, mortifying in public", "Finds them a little performative", "Depends entirely on the gesture"] },
    { template: "Does [name] keep sentimental gifts from past relationships?", options: ["Yes, tucked away in a box somewhere", "No, they toss everything after a breakup", "Only the truly meaningful ones", "They regift or repurpose them"] },
    { template: "What would [name] do if they ran into an ex with a new partner?", options: ["Be warm and genuinely gracious", "Keep it short and escape fast", "Secretly size up the new partner", "Pretend they didn't see them"] },
    { template: "How does [name] handle a partner who's still close with an ex?", options: ["Trusts it completely, no issue", "Fine as long as they've met the ex", "Uneasy but keeps it to themselves", "It's a genuine dealbreaker for them"] },
    { template: "What's [name]'s reaction to a surprise 'we need to talk' text?", options: ["Immediate panic and worst-case spiral", "Stays calm and waits it out", "Demands to know right now what it is", "Assumes it's something minor"] },
    { template: "Would [name] rather love more or be loved more?", options: ["Love more, they like giving fully", "Be loved more, they crave security", "An equal balance or nothing", "Whichever hurts less in the end"] },
    { template: "How does [name] handle the end of the honeymoon phase?", options: ["Embraces the deeper comfort of it", "Panics that the feelings are fading", "Works to reignite the spark", "Takes it as a sign to move on"] },
    { template: "How does [name] feel about scheduled date nights?", options: ["Loves the structure and reliability", "Prefers everything spontaneous", "Fine with it but forgets to plan", "Thinks scheduling romance kills it"] },
    { template: "How does [name] handle a clingy partner?", options: ["Sets gentle boundaries early", "Feels smothered and pulls away", "Actually enjoys the attention", "Bottles it up until they burst"] },
    { template: "How far would [name] relocate for the right person?", options: ["Anywhere, love comes first", "A new city, but not a new country", "Only if they had their own plan there too", "They wouldn't uproot their life for anyone"] },
    { template: "How does [name] feel about writing love notes?", options: ["Loves it, hides them everywhere", "Prefers saying it out loud", "Finds it cheesy but secretly likes it", "Would never, way too sappy"] },
    { template: "How does [name] react to a partner planning a big surprise?", options: ["Delighted, they love surprises", "Anxious, they hate not knowing", "Grateful but slightly overwhelmed", "They usually figure it out beforehand"] },
    { template: "How does [name] picture growing old with someone?", options: ["Traveling the world together", "Cozy at home with grandkids around", "Still causing trouble and laughing", "Independent but side by side"] },
    { template: "What does [name] believe is the real secret to lasting love?", options: ["Communication above everything", "Never losing the friendship underneath", "Choosing each other every single day", "Shared values and a common vision"] },
    { template: "How does [name] act when they first develop a crush?", options: ["Can't stop talking about the person", "Acts totally normal, hides it perfectly", "Gets clumsy and weird around them", "Overthinks whether it's even real"] },
    { template: "What's [name]'s stance on couples who share one social media account?", options: ["Cute, they'd consider it", "Absolutely not, keep separate accounts", "A little cringe but harmless", "A giant red flag in their eyes"] },
    { template: "How does [name] feel about being someone's first serious relationship?", options: ["Honored to be their first real love", "Nervous about the pressure of it", "Prefers dating someone experienced", "Doesn't think about it either way"] },
    { template: "How does [name] respond when a partner is in a bad mood?", options: ["Tiptoes carefully around them", "Directly asks what's wrong", "Gives them full space until it passes", "Tries to cheer them up with humor"] },
    { template: "What's [name]'s idea of a low-key perfect night with a partner?", options: ["Takeout and a movie on the couch", "Cooking a meal together from scratch", "A long walk and deep conversation", "Doing their own thing in the same room"] },
    { template: "How does [name] feel about PDA levels like hand-holding in public?", options: ["Hand-holding and more, always", "Just hand-holding, nothing beyond", "A quick touch is their limit", "They keep affection strictly private"] },
    { template: "How does [name] handle it when a partner forgets something important to them?", options: ["Says nothing but feels quietly hurt", "Brings it up honestly right away", "Lets it go completely, no grudge", "Remembers it and mentions it later"] },
    { template: "What would [name] do if they slowly realized the spark was gone?", options: ["Work hard to rebuild it", "Have an honest talk about it", "Stay out of comfort and fear", "Start emotionally checking out"] },
    { template: "How does [name] feel about celebrating small relationship milestones?", options: ["Celebrates every little one", "Only the big ones matter", "Forgets the dates entirely", "Prefers everyday love over milestones"] },
    { template: "How does [name] handle a partner earning far more than them?", options: ["Completely secure about it", "A little insecure but supportive", "Motivated to catch up", "Prefers being the higher earner"] },
    { template: "What role does [name] naturally take in a relationship?", options: ["The planner who runs everything", "The easygoing one who goes with the flow", "The emotional anchor and support", "The fun one who keeps things light"] },
    { template: "How does [name] want to be checked on during a busy week?", options: ["A good morning and good night text", "One meaningful call is enough", "Constant little updates all day", "They'd rather just catch up later"] },
    { template: "How does [name] feel about a partner who's messy?", options: ["Doesn't care, they're messy too", "Will quietly clean up after them", "It slowly drives them insane", "A total dealbreaker over time"] },
    { template: "What would [name] do on a partner's first meeting with their parents?", options: ["Coach the partner beforehand nervously", "Let it happen naturally, no prep", "Stay glued to their side the whole time", "Downplay it so there's no pressure"] },
    { template: "How does [name] show up during a partner's big life event?", options: ["Front row, loudest supporter", "Quietly present and dependable", "Behind the scenes handling everything", "There, but not one for the spotlight"] },
    { template: "How does [name] handle a long stretch apart from a partner?", options: ["Constant calls and video chats", "Gives space and trusts the reunion", "Struggles hard with the distance", "Stays busy so they don't dwell on it"] },
    { template: "What's [name]'s reaction when a partner remembers a tiny detail?", options: ["Completely melts, it means everything", "Plays it cool but is deeply touched", "Feels seen in a way they rarely do", "Files it away and tries to match it"] },
    { template: "How does [name] feel about matching or coordinating outfits with a partner?", options: ["Loves it, fully on board", "A subtle match is fine", "Absolutely not, too much", "Would do it only as a joke"] },
    { template: "What does [name] do when they're falling for someone and it scares them?", options: ["Leans in despite the fear", "Pulls back to protect themselves", "Overanalyzes it into the ground", "Tells the person exactly how they feel"] },
    { template: "How does [name] handle a disagreement about the future?", options: ["Confronts it head-on early", "Avoids it and hopes it resolves itself", "Compromises to keep the peace", "Sees it as a potential dealbreaker"] },
    { template: "How does [name] feel about their partner having lots of friends of the opposite sex?", options: ["Totally secure, friends are friends", "Fine once they've met them all", "A little uneasy but silent", "Prefers clearer boundaries"] },
    { template: "What's [name]'s move when they want to make up after a fight?", options: ["Reaches out first, always", "Waits for the other person to break", "Buys a peace offering", "Acts sweet until it blows over"] },
    { template: "How does [name] feel about a partner reading their old journals or texts?", options: ["Fine, they have nothing to hide", "Deeply uncomfortable, that's private", "Only if they read it together", "It would genuinely feel like betrayal"] },
    { template: "How does [name] react when a relationship gets too comfortable?", options: ["Loves the deep comfort of it", "Craves excitement and gets restless", "Plans new experiences to keep it alive", "Wonders if the passion is gone"] },
    { template: "What's [name]'s ideal frequency for seeing a partner in a week?", options: ["Every single day if possible", "A few solid times a week", "Once or twice, quality over quantity", "Whenever it naturally works out"] },
    { template: "How does [name] handle a partner's flaws they can't change?", options: ["Accepts them fully as part of the package", "Gently tries to improve them", "Learns to live with the annoyance", "Lets small things build into big ones"] },
    { template: "How does [name] feel about being told 'I love you' for the first time?", options: ["Overjoyed and says it right back", "Panics if they're not ready", "Waits to be sure before saying it back", "Cries, in the best way"] },
    { template: "What's [name]'s biggest fear about long-term commitment?", options: ["Losing their independence", "Growing apart over time", "Choosing the wrong person", "Being trapped if it goes bad"] },
    { template: "How does [name] respond when a partner asks for space?", options: ["Respects it fully, no questions", "Feels rejected but hides it", "Immediately assumes the worst", "Uses it as their own me-time too"] },
    { template: "What would [name] do if they and their partner wanted different cities to settle in?", options: ["Compromise on a neutral third place", "Follow their partner wherever they go", "Stand firm on their own choice", "Let it quietly become a wedge"] },
    { template: "How does [name] feel about their partner posting them constantly online?", options: ["Loves being shown off", "A few posts, not a highlight reel", "Prefers to stay mostly off their feed", "Would rather not be posted at all"] },
    { template: "What's [name]'s move on a boring first date?", options: ["Politely powers through to the end", "Makes a graceful early exit", "Tries hard to save the conversation", "Gives an honest but kind goodbye"] },
    { template: "How does [name] want to reconnect after a rough patch?", options: ["A weekend away, just the two of them", "A long, honest heart-to-heart", "Slowly, through everyday small moments", "A clean slate and a fresh start"] },
    { template: "How does [name] feel about a partner who's very different from them?", options: ["Loves it, opposites keep it exciting", "Prefers someone more like themselves", "Great at first, exhausting later", "Depends on which differences they are"] },
    { template: "How does [name] handle admitting they were wrong to a partner?", options: ["Owns it immediately and fully", "Takes a while but gets there", "Apologizes without ever saying they were wrong", "Struggles enormously with it"] },
    { template: "What's [name]'s relationship non-negotiable?", options: ["Total honesty, no exceptions", "Mutual respect above all", "Independence and their own space", "Loyalty through everything"] },
    { template: "How does [name] act around a partner's close friends?", options: ["Charms them and fits right in", "Polite but reserved and quiet", "Tries a bit too hard to be liked", "Would rather have their partner to themselves"] },
    { template: "What's [name]'s take on 'the one that got away'?", options: ["They have one and still wonder", "No such thing, everything happens for a reason", "They're the one who did the getting away", "They refuse to romanticize the past"] },
    { template: "How does [name] handle a partner going through a hard time?", options: ["Becomes their rock and stays close", "Gives them room but stays available", "Tries to fix everything for them", "Struggles to know what to do"] },
    { template: "What's [name]'s stance on keeping some secrets in a relationship?", options: ["Total transparency, no secrets", "Small private things are healthy", "Some past chapters stay closed", "Depends what the secret protects"] },
    { template: "How does [name] feel about a partner who wants to hang out with friends often?", options: ["Encourages it, space is healthy", "Fine as long as they get time too", "A little jealous of the friend time", "Prefers a partner who's mostly with them"] },
    { template: "What would [name] do if a friend confessed feelings for them?", options: ["Be honest even if it's awkward", "Let them down as gently as possible", "Avoid the topic and hope it fades", "Secretly consider it if single"] },
    { template: "How does [name] act on the anniversary of a past relationship?", options: ["Doesn't remember the date at all", "Notices it and feels a pang", "Reflects on the lessons learned", "Reaches out to the ex, sometimes"] },
    { template: "How does [name] feel about vulnerability with a new partner?", options: ["Opens up quickly and fully", "Guards their heart until it's safe", "Shares slowly, one layer at a time", "Uses humor to avoid getting deep"] },
    { template: "What's [name]'s reaction when a partner surprises them with a gift?", options: ["Overwhelmed with genuine emotion", "Thrilled but feels guilty they didn't reciprocate", "Loves it but downplays their reaction", "Slightly stressed about matching the effort"] },
    { template: "How does [name] navigate different sleep schedules with a partner?", options: ["Adjusts to sync up with them", "Keeps their own schedule no matter what", "Compromises somewhere in the middle", "It becomes a recurring source of friction"] },
    { template: "What does [name] do when a relationship feels one-sided?", options: ["Addresses it directly and fast", "Slowly gives less to match them", "Overgives even harder hoping it changes", "Quietly starts to check out"] },
    { template: "How does [name] want their partner to handle their bad days?", options: ["Just sit with them, no fixing", "Distract them and lift the mood", "Give them space until they resurface", "Talk it all the way through"] },
    { template: "How does [name] feel about introducing a partner to their family early?", options: ["The sooner the better", "Only when it's genuinely serious", "Dreads the family scrutiny", "Keeps family and dating separate as long as possible"] },
    { template: "What's [name]'s reaction to a partner who cries during movies?", options: ["Finds it adorable and endearing", "Teases them lovingly about it", "Cries right along with them", "Doesn't quite get it but respects it"] },
    { template: "How does [name] handle needing reassurance from a partner?", options: ["Asks for it directly and clearly", "Hints at it and hopes they notice", "Pretends they don't need it at all", "Tests the partner instead of asking"] },
    { template: "What does [name] value more in the long run?", options: ["Passion and butterflies", "Stability and deep trust", "Laughter and friendship", "Growth and pushing each other forward"] },
    { template: "How does [name] behave in the honeymoon phase of a relationship?", options: ["Completely lovestruck and glowing", "Cautiously optimistic but guarded", "Still keeps one foot on the ground", "Goes all in and forgets their friends"] },
    { template: "What kind of first date does [name] actually want?", options: ["A long walk and real conversation", "Something high-energy and adventurous", "A cozy dinner somewhere quiet", "Anything as long as there is good food"] },
    { template: "How does [name] react when a partner surprises them?", options: ["Lights up and can barely speak", "Gets suspicious of the motive", "Pretends to be calm while freaking out inside", "Immediately plans a bigger surprise back"] },
    { template: "What does [name] do after a fight with a partner?", options: ["Needs space before talking it out", "Wants to resolve it right away", "Overthinks every word that was said", "Acts like nothing happened"] },
    { template: "How picky is [name] when choosing who to date?", options: ["Extremely, almost impossibly selective", "Has a clear type they stick to", "Fairly open and gives people a chance", "Follows their gut with no real rules"] },
    { template: "What makes [name] catch feelings the fastest?", options: ["Someone who really listens", "A great sense of humor", "Confidence and ambition", "Genuine kindness to strangers"] },
    { template: "How does [name] show they trust a partner?", options: ["Shares their deepest secrets", "Gives them full independence", "Introduces them to everyone", "Lets their guard fully down"] },
    { template: "What is [name] like as a long-distance partner?", options: ["Devoted and constantly in touch", "Struggles with the distance", "Surprisingly independent and chill", "Would rather not do it at all"] },
    { template: "How does [name] handle a partner who is more successful than them?", options: ["Genuinely proud and cheering them on", "A little insecure but supportive", "Uses it as motivation to level up", "Feels quietly competitive about it"] },
    { template: "What would make [name] end a relationship on the spot?", options: ["A serious betrayal of trust", "Being disrespected in public", "Realizing the spark is truly gone", "Meeting their family and being horrified"] },
    { template: "How romantic is [name] on a normal Tuesday?", options: ["Leaves little notes and gestures", "Saves romance for special occasions", "Shows love through practical help", "Not romantic but deeply loyal"] },
    { template: "What does [name] secretly want more of from a partner?", options: ["Reassurance and words of love", "Adventure and spontaneity", "Quiet time together", "Being genuinely seen and understood"] },
    { template: "How does [name] flirt when they are actually interested?", options: ["Teasing and playful banter", "Deep, intense eye contact", "Suddenly very generous and attentive", "Gets shy and barely makes a move"] },
    { template: "What is [name]'s biggest relationship blind spot?", options: ["Ignoring red flags they like", "Avoiding hard conversations", "Losing themselves in the other person", "Keeping score of every little thing"] },
    { template: "How does [name] feel about grand romantic gestures?", options: ["Lives for them completely", "Finds them a bit over the top", "Loves giving but hates receiving them", "Prefers small consistent gestures"] },
    { template: "What does [name] do when they miss an ex?", options: ["Keeps it buried deep down", "Vents to a trusted friend", "Almost texts them but stops", "Reflects on it and moves on quickly"] },
    { template: "How does [name] handle jealousy in a relationship?", options: ["Talks about it openly and calmly", "Stews on it silently", "Rarely gets jealous at all", "Becomes distant until it passes"] },
    { template: "What kind of partner brings out the best in [name]?", options: ["Someone calm who grounds them", "Someone playful who lightens them up", "Someone driven who pushes them", "Someone patient who gives them room"] },
    { template: "How does [name] define real commitment?", options: ["Choosing each other every single day", "Building a future together", "Staying through the boring parts", "Complete loyalty no matter what"] },
    { template: "What does [name] do on the anniversary of a breakup?", options: ["Barely remembers the date", "Feels a quiet pang all day", "Treats themselves to feel better", "Reflects on how far they have come"] },
    { template: "How does [name] act around a partner's ex?", options: ["Perfectly polite but watchful", "Coolly indifferent", "A little territorial", "Genuinely friendly and unbothered"] },
    { template: "What is the fastest way to lose [name]'s interest?", options: ["Playing too many games", "Being flaky and unreliable", "Talking only about themselves", "Showing no ambition at all"] },
    { template: "How does [name] want to be pursued?", options: ["Boldly and with clear intent", "Slowly, letting it build", "Through friendship first", "With effort that proves it is real"] },
    { template: "What does [name] value most in a partner's family?", options: ["Warmth and acceptance", "Respect for boundaries", "A good sense of humor", "That they raised a good person"] },
    { template: "How does [name] react to a partner crying?", options: ["Drops everything to comfort them", "Feels helpless but stays close", "Tries to fix the problem fast", "Sits quietly and holds them"] },
    { template: "What is [name]'s attachment style, honestly?", options: ["Secure and steady", "Anxious and needs reassurance", "Avoidant and values space", "A confusing mix of all of it"] },
    { template: "How does [name] handle a slow-burn romance?", options: ["Loves the anticipation of it", "Gets impatient and pushes ahead", "Second-guesses whether it is mutual", "Enjoys it but eventually needs clarity"] },
    { template: "What does [name] do when a crush likes them back?", options: ["Barely believes it is real", "Plays it cool to stay in control", "Gets giddy and tells everyone", "Suddenly gets nervous and awkward"] },
    { template: "How forgiving is [name] of a partner's mistakes?", options: ["Very, as long as it is honest", "Forgives but never forgets", "Depends entirely on the mistake", "One strike and the trust is gone"] },
    { template: "What is [name]'s idea of a perfect lazy day with a partner?", options: ["Movies and snacks all day", "Sleeping in and slow mornings", "Cooking together with no plans", "Doing nothing but talking for hours"] },
    { template: "How comfortable is [name] with affection out in public?", options: ["All for it, hold my hand anywhere", "A little goes a long way", "Prefers to keep it private", "Depends entirely on their mood"] },
    { template: "What does [name] need to hear after a rough day?", options: ["That everything will be okay", "That they did nothing wrong", "Nothing, just quiet company", "A joke to snap them out of it"] },
    { template: "How does [name] handle a partner with a busy schedule?", options: ["Fiercely independent and understanding", "Cherishes the little time they get", "Struggles with feeling like a priority", "Finds ways to sneak in together"] },
    { template: "What is [name]'s biggest fear about falling in love?", options: ["Getting hurt all over again", "Losing their independence", "Not being loved back the same", "Realizing it was never real"] },
    { template: "How does [name] pick between the heart and the head in love?", options: ["Heart wins almost every time", "Head keeps the heart in check", "Agonizes over every decision", "Follows the head but regrets it later"] },
    { template: "What does [name] do when a relationship gets too comfortable?", options: ["Plans something new to shake it up", "Loves the comfort and settles in", "Starts to feel a little restless", "Has an honest talk about it"] },
    { template: "How does [name] react to being someone's second choice?", options: ["Walks away with their dignity", "Tries to prove they should be first", "Pretends it does not bother them", "Confronts it head on"] },
    { template: "What is the sweetest thing [name] has ever done for a partner?", options: ["Planned an elaborate surprise", "Showed up when it mattered most", "Made something with their own hands", "Sacrificed something they loved"] },
    { template: "How does [name] feel about being set up on a date?", options: ["Open and willing to try", "Deeply skeptical of it", "Only if they trust the matchmaker", "Would rather meet people naturally"] },
    { template: "What does [name] look for on a second date?", options: ["Real chemistry, not just nerves", "Whether the stories add up", "If they can be themselves", "A sign the first date was not a fluke"] },
    { template: "How does [name] handle catching feelings for a friend?", options: ["Buries it to protect the friendship", "Tests the waters carefully", "Confesses and hopes for the best", "Overthinks it into oblivion"] },
    { template: "What does [name] do when a partner forgets something important?", options: ["Reminds them gently", "Feels hurt but hides it", "Calls it out directly", "Lowers their expectations quietly"] },
    { template: "How does [name] approach dating after a long relationship?", options: ["Cautiously, one step at a time", "Throws themselves back in", "Takes a long break first", "Compares everyone to the last one"] },
    { template: "What kind of love story does [name] believe in?", options: ["The slow-burning best friends kind", "The love-at-first-sight kind", "The against-all-odds kind", "The quiet, steady, unglamorous kind"] },
    { template: "How does [name] react when a partner needs space?", options: ["Gives it without question", "Worries something is wrong", "Uses the time for themselves too", "Struggles not to take it personally"] },
    { template: "What does [name] do when they realize they are in love?", options: ["Panics a little at first", "Feels calm and certain", "Wants to say it immediately", "Sits with it before acting"] },
    { template: "How does [name] handle a partner's annoying habit?", options: ["Learns to live with it", "Brings it up lightheartedly", "Lets it build until it boils over", "Finds it oddly endearing"] },
    { template: "What would [name] change about how they love?", options: ["Guard their heart a little less", "Communicate their needs sooner", "Not lose themselves so fast", "Stop expecting the worst"] },
    { template: "How does [name] feel about their partner having close opposite-gender friends?", options: ["Completely secure about it", "Fine as long as they are included", "A little uneasy but says nothing", "Needs to trust the friend first"] },
    { template: "What is [name]'s reaction to a heartfelt love letter?", options: ["Keeps it forever and rereads it", "Cries before finishing it", "Feels shy about big words", "Writes an even better one back"] },
    { template: "How does [name] act on a first date they are nervous about?", options: ["Talks a little too much", "Goes unusually quiet", "Overprepares every detail", "Fakes total confidence"] },
    { template: "What does [name] do when a relationship is clearly ending?", options: ["Faces it and has the talk", "Holds on longer than they should", "Emotionally checks out first", "Fights hard to save it"] },
    { template: "How does [name] feel about marriage?", options: ["Dreams about it constantly", "Wants it eventually, no rush", "Loves the person more than the label", "Not sure it is for them"] },
    { template: "What does [name] find most romantic?", options: ["Being remembered in small ways", "Undivided, phone-down attention", "A surprise that took real thought", "Being chosen over everyone else"] },
    { template: "How does [name] handle a partner who runs hot and cold?", options: ["Calls out the mixed signals", "Matches their energy right back", "Gets anxious and chases", "Walks away from the confusion"] },
    { template: "What is [name] like when they first start dating someone?", options: ["Cautiously guarded", "An open, eager book", "Testing them constantly", "Effortlessly natural"] },
    { template: "How does [name] respond to a partner's big dreams?", options: ["Believes in them completely", "Gently keeps them grounded", "Wants to chase them together", "Worries about the risk"] },
    { template: "What does [name] do when they feel taken for granted?", options: ["Pulls back to be noticed", "Says exactly how they feel", "Keeps giving and resents it", "Reevaluates the whole thing"] },
    { template: "How does [name] feel about their partner's ambition versus time together?", options: ["Wants a real balance of both", "Ambition first, they get it", "Time together comes above all", "Struggles when work always wins"] },
    { template: "What is [name]'s go-to move to make up after an argument?", options: ["A sincere face-to-face apology", "A thoughtful peace offering", "Making them laugh again", "Just acting normal until it passes"] },
    { template: "How does [name] handle a partner who is bad with money?", options: ["Gently tries to teach them", "Takes over the budgeting", "Finds it a serious problem", "Balances them out without judging"] },
    { template: "What does [name] want their partner to fight for?", options: ["The relationship when it is hard", "Their shared future", "Them, specifically, when it counts", "The version of them they believe in"] },
    { template: "How does [name] react to unexpected butterflies?", options: ["Leans right into the feeling", "Gets suspicious of it", "Tries to play it cool", "Overanalyzes what it means"] },
    { template: "What does [name] do when a partner is in a mood?", options: ["Gives them room to cool off", "Tries to cheer them up", "Asks directly what is wrong", "Waits it out patiently"] },
    { template: "How does [name] feel about being needed by a partner?", options: ["Loves feeling indispensable", "Wants balance, not dependence", "Finds it a little heavy", "Needs to be needed too"] },
    { template: "What is [name]'s worst dating habit?", options: ["Ghosting when it gets awkward", "Overtexting when excited", "Comparing dates to an ideal", "Bailing at the first red flag"] },
    { template: "How does [name] handle a crush that will never happen?", options: ["Admires from a safe distance", "Talks themselves out of it", "Enjoys the harmless daydream", "Distracts themselves fast"] },
    { template: "What does [name] believe makes love last?", options: ["Choosing kindness over being right", "Never taking it for granted", "Growing in the same direction", "Real friendship underneath it"] },
    { template: "How does [name] respond when a date goes badly?", options: ["Laughs it off later", "Overanalyzes what went wrong", "Politely never calls again", "Gives an honest goodbye"] },
    { template: "What does [name] do when a partner meets their friends?", options: ["Hopes desperately they click", "Watches the whole thing nervously", "Lets it happen naturally", "Grills their friends for opinions after"] },
    { template: "How does [name] feel about splitting the bill on a date?", options: ["Insists on paying every time", "Prefers to take turns", "Splitting it is totally fine", "Judges what the other person suggests"] },
    { template: "What does [name] need to feel secure in love?", options: ["Consistency they can count on", "Honesty even when it is hard", "Regular reassurance", "Freedom without being questioned"] },
    { template: "How does [name] handle a partner's family drama?", options: ["Stays out of it entirely", "Supports from the sidelines", "Gets pulled in whether they like it or not", "Offers advice nobody asked for"] },
    { template: "What is [name] like when they are truly heartbroken?", options: ["Shuts down and goes quiet", "Leans hard on friends", "Throws themselves into work", "Rebuilds slowly and privately"] },
    { template: "How does [name] decide someone is relationship material?", options: ["How they treat other people", "Whether the values line up", "The gut feeling of it", "How they handle a small conflict"] },
    { template: "What does [name] do when they are falling too fast?", options: ["Tries to pump the brakes", "Just enjoys the ride", "Warns the other person", "Ignores every alarm bell"] },
    { template: "How does [name] feel about their partner's late-night texting?", options: ["Trusts it completely", "Curious but respectful", "A little bit bothered", "Needs to know who it is"] },
    { template: "What is [name]'s reaction to a spontaneous kiss?", options: ["Melts on the spot", "Grins for hours after", "Gets flustered and shy", "Kisses right back with no hesitation"] },
    { template: "How does [name] handle wanting different things than a partner?", options: ["Looks for a real compromise", "Puts their own wants first", "Gives in to keep the peace", "Has the hard conversation"] },
    { template: "What does [name] find hardest about being single?", options: ["The lonely evenings", "Watching friends couple up", "Missing being someone's person", "Nothing, they love the freedom"] },
    { template: "How does [name] react when someone confesses feelings for them?", options: ["Handles it with real kindness", "Gets awkward and flustered", "Feels flattered but unsure", "Is brutally honest about it"] },
    { template: "What does [name] want a partner to remember about them?", options: ["The little things they said", "How hard they tried", "The way they loved", "That they were always real"] },
    { template: "How does [name] handle a relationship moving too slow?", options: ["Gently nudges it forward", "Enjoys taking their time", "Gets restless and antsy", "Asks where things stand"] },
    { template: "What does [name] do when they feel unseen by a partner?", options: ["Speaks up clearly", "Withdraws into themselves", "Tries harder to be noticed", "Questions the whole relationship"] },
    { template: "How does [name] approach the first 'I love you'?", options: ["Waits until they are certain", "Blurts it out in the moment", "Wants the other to say it first", "Shows it long before saying it"] },
    { template: "What makes [name] feel truly desired?", options: ["Being pursued with effort", "Genuine undivided attention", "Being bragged about to others", "Small unprompted gestures"] },
    { template: "How does [name] handle a partner who never apologizes?", options: ["Calls it out every time", "Slowly loses respect", "Learns to read their nonverbal sorry", "Considers it a dealbreaker"] },
    { template: "What is [name]'s biggest romantic regret?", options: ["The one they let get away", "Words they never said", "Staying too long in the wrong thing", "Leaving too soon out of fear"] },
    { template: "How does [name] feel about being someone's first relationship?", options: ["Honored to be their first", "A little wary of the pressure", "Patient and gentle about it", "Prefers someone with experience"] },
    { template: "What does [name] do when the spark starts to fade?", options: ["Actively works to rekindle it", "Talks about it openly", "Wonders if it is meant to be", "Waits to see if it comes back"] },
    { template: "How does [name] act when they are trying to impress a date?", options: ["Turns on the full charm", "Overthinks every word", "Shows off a little too much", "Stays genuine and hopes it works"] },
    { template: "What does [name] think about love at first sight?", options: ["Believes in it fully", "Thinks it is just attraction", "Wants to but stays skeptical", "Has felt something close to it"] },
    { template: "How does [name] respond to a jealous partner?", options: ["Reassures them patiently", "Finds it a bit much", "Gets defensive fast", "Sets a firm boundary"] },
    { template: "What does [name] do to keep a relationship exciting?", options: ["Plans surprises and trips", "Keeps flirting like day one", "Tries new things together", "Just keeps showing up fully"] },
    { template: "How does [name] support a partner who is going through it?", options: ["Becomes their rock", "Struggles to know what to do", "Gives constant reassurance", "Stays steady and present"] },
    { template: "What is [name]'s reaction to meeting someone out of their league?", options: ["Shoots their shot anyway", "Assumes they have no chance", "Plays it incredibly cool", "Freezes up entirely"] },
    { template: "How does [name] feel about their partner's past relationships?", options: ["Curious but not threatened", "Prefers not to hear about them", "A little insecure about it", "Sees them as part of who they are"] },
    { template: "What does [name] do when they want to define the relationship?", options: ["Asks directly and clearly", "Drops hints and waits", "Overthinks the timing forever", "Lets it define itself"] },
    { template: "How does [name] handle being ghosted?", options: ["Moves on without a word", "Sends one honest message", "Overanalyzes what went wrong", "Blocks and forgets fast"] },
    { template: "What kind of apology means the most to [name]?", options: ["Changed behavior, not just words", "A sincere heartfelt one", "Owning it with no excuses", "One that comes without prompting"] },
    { template: "How does [name] feel about being the more emotional one?", options: ["Owns it proudly", "Wishes they were more guarded", "Balances it with a calm partner", "Tries to hide it"] },
    { template: "What does [name] do when they still care about an ex?", options: ["Keeps a respectful distance", "Wishes them well and lets go", "Struggles to fully move on", "Buries it and never says a word"] },
    { template: "How does [name] handle a partner who works too much?", options: ["Encourages balance kindly", "Feels the loneliness of it", "Builds their own full life", "Resents it quietly"] },
    { template: "What is [name]'s love style in three words?", options: ["Loyal, warm, all-in", "Steady, patient, calm", "Playful, spontaneous, fun", "Deep, intense, devoted"] },
    { template: "How does [name] react to a surprise weekend getaway?", options: ["Thrilled and instantly packed", "Stressed about the lack of a plan", "Touched by the effort", "Nervous but excited"] },
    { template: "What does [name] do when they suspect a partner is hiding something?", options: ["Asks them straight out", "Watches and gathers evidence", "Gives them room to come clean", "Assumes the worst quietly"] },
    { template: "How does [name] feel about texting all day with a partner?", options: ["Lives for the constant contact", "Prefers to save it for in person", "Enjoys it in bursts", "Finds all-day texting draining"] },
    { template: "What does [name] want most from their next relationship?", options: ["Peace and ease", "Passion and excitement", "Real partnership", "To finally feel understood"] },
    { template: "How does [name] handle a partner meeting their parents for the first time?", options: ["Coaches them beforehand", "Lets the chips fall naturally", "Is nervous for everyone involved", "Trusts them completely"] },
    { template: "What does [name] do when they are giving more than they get?", options: ["Names it and asks for more", "Pulls back to protect themselves", "Keeps giving and hopes it shifts", "Walks away for good"] },
    { template: "How does [name] feel about growing old with someone?", options: ["Dreams of it constantly", "Finds it comforting", "A little scary but beautiful", "Prefers not to plan that far"] },
    { template: "What is [name]'s favorite stage of a relationship?", options: ["The thrilling early spark", "The deep comfortable middle", "The moment it turns serious", "The easy long-term rhythm"] },
    { template: "How does [name] react to a partner's grand apology?", options: ["Forgives with an open heart", "Stays cautious despite it", "Wants to see it proven", "Appreciates it but needs time"] },
    { template: "What does [name] do when they are the one who messed up?", options: ["Owns it immediately", "Struggles to say sorry", "Overcorrects to make up for it", "Gets defensive first, then apologizes"] },
    { template: "How does [name] feel about their partner keeping secrets from friends about them?", options: ["Trusts there is a reason", "Wants full transparency", "Feels a little hidden", "Is fine with some privacy"] },
    { template: "What does [name] believe about second chances in love?", options: ["Everyone deserves one", "Only if the change is real", "Rarely worth the risk", "Depends entirely on the person"] },
    { template: "How does [name] handle a partner who is very private?", options: ["Respects the mystery", "Slowly earns their trust", "Feels shut out by it", "Matches their energy"] },
    { template: "What does [name] do on a partner's birthday?", options: ["Goes completely over the top", "Keeps it meaningful and personal", "Plans a surprise for weeks", "Lets the day be about them"] },
    { template: "How does [name] feel about defining exclusivity?", options: ["Wants it clear and early", "Lets it happen when it feels right", "Avoids the conversation", "Assumes it without asking"] },
    { template: "What does [name] find most attractive in a long-term partner?", options: ["Emotional steadiness", "Shared ambition", "A quick wit", "Deep loyalty"] },
    { template: "How does [name] handle the honeymoon phase ending?", options: ["Welcomes the deeper comfort", "Mourns the lost butterflies", "Works to keep the spark", "Barely notices it fade"] },
    { template: "What does [name] do when they and a partner want kids differently?", options: ["Has the honest hard talk", "Hopes their minds will change", "Considers it a dealbreaker", "Looks for a middle path"] },
    { template: "How does [name] feel about surprise visits from a partner?", options: ["Absolutely loves them", "Prefers a heads up", "Depends on their mood", "Melts at the spontaneity"] },
    { template: "What is [name]'s reaction to a partner's insecurity?", options: ["Reassures them endlessly", "Helps them build confidence", "Finds it draining over time", "Loves them through it patiently"] },
    { template: "How does [name] handle wanting to say sorry first?", options: ["Swallows their pride and does it", "Waits for the other to crack", "Finds an indirect way to do it", "Refuses on principle"] },
    { template: "What does [name] think a healthy relationship looks like?", options: ["Two whole people, not halves", "Constant open communication", "Space to grow individually", "Being each other's safe place"] },
    { template: "How does [name] react to a partner's random act of love?", options: ["Feels seen and cherished", "Wonders what prompted it", "Reciprocates immediately", "Keeps the memory close"] },
    { template: "What does [name] do when a friend dates their ex?", options: ["Blesses it and moves on", "Feels a quiet sting", "Sets a clear boundary", "Considers it a betrayal"] },
    { template: "How does [name] handle being vulnerable for the first time?", options: ["Terrified but does it anyway", "Tests the waters slowly", "Waits until fully safe", "Struggles to lower the walls"] },
    { template: "What does [name] want a partner to do when they are quiet?", options: ["Gently check in", "Give them space", "Sit close without pushing", "Read between the lines"] },
    { template: "How does [name] feel about a partner who challenges them?", options: ["Loves being pushed to grow", "Finds it exhausting sometimes", "Respects it deeply", "Prefers an easier peace"] },
    { template: "What does [name] do when love and logic disagree?", options: ["Follows the heart anyway", "Trusts the head to protect them", "Freezes in indecision", "Sleeps on it and decides"] },
    { template: "How does [name] handle a partner's bad day taken out on them?", options: ["Stays calm and doesn't bite", "Calls it out gently later", "Gives them a pass this once", "Sets a boundary right away"] },
    { template: "What is [name]'s reaction to being called their partner's best friend?", options: ["The highest compliment there is", "Sweet but wants more spark too", "Exactly what they hoped for", "A sign it is the real thing"] },
    { template: "How does [name] feel about relationship labels?", options: ["Wants them clear and defined", "Cares more about the feeling", "Finds them a bit limiting", "Needs them to feel secure"] },
    { template: "What does [name] do when a partner is far away?", options: ["Counts down every day", "Keeps busy to cope", "Sends little reminders of love", "Struggles more than they admit"] },
    { template: "How does [name] handle a partner who forgets little details?", options: ["Reminds them without a fuss", "Feels it means they don't care", "Keeps track for both of them", "Lets the small stuff go"] },
    { template: "What does [name] want their love to feel like?", options: ["Safe and warm", "Electric and alive", "Deep and unshakable", "Easy and free"] },
    { template: "How does [name] react to a heartfelt compliment from a partner?", options: ["Glows but deflects it", "Soaks it right in", "Returns an even bigger one", "Gets shy and quiet"] },
    { template: "What does [name] do when they realize a relationship is over?", options: ["Ends it cleanly and kindly", "Drags it out too long", "Emotionally leaves first", "Fights to fix it one last time"] },
    { template: "How does [name] feel about being the planner in a relationship?", options: ["Happily takes the lead", "Wishes it were shared", "Does it but resents it", "Loves surprising their partner"] },
    { template: "What does [name] do when a partner meets an old flame of theirs?", options: ["Introduces them with ease", "Feels a flicker of unease", "Watches the dynamic closely", "Trusts it completely"] },
    { template: "How does [name] handle wanting more affection than a partner gives?", options: ["Asks for it openly", "Adjusts their own expectations", "Feels quietly starved for it", "Gives more, hoping it returns"] },
    { template: "What is [name]'s biggest turn-on in a partner's personality?", options: ["A sharp, quick mind", "Effortless confidence", "Deep kindness", "A wicked sense of humor"] },
    { template: "How does [name] feel about a partner who cries easily?", options: ["Finds it tender and real", "Wants to protect them", "A little unsure how to help", "Loves the openness of it"] },
    { template: "What does [name] do when they and a partner run out of things to say?", options: ["Enjoys the comfortable silence", "Worries it means trouble", "Finds a new spark of conversation", "Sees it as natural and fine"] },
    { template: "How does [name] handle a relationship their friends dislike?", options: ["Follows their own heart", "Takes the concern seriously", "Keeps it separate from friends", "Reevaluates carefully"] },
    { template: "What does [name] want to build with the right person?", options: ["A calm, steady home life", "A wild, adventurous life", "A power-couple partnership", "A quiet, private world of their own"] },
    { template: "How does [name] react to their partner being complimented by others?", options: ["Beams with pride", "Feels a hint of jealousy", "Agrees wholeheartedly", "Stays completely unbothered"] },
    { template: "What does [name] do when they feel the urge to run from love?", options: ["Talks themselves through it", "Actually pulls away", "Names the fear out loud", "Pushes through and stays"] },
    { template: "How does [name] handle a partner's differing love language?", options: ["Learns to speak theirs", "Struggles to feel understood", "Meets in the middle", "Explains their own patiently"] },
    { template: "What is [name]'s reaction to a whirlwind romance?", options: ["Dives in headfirst", "Enjoys it but stays grounded", "Gets swept away completely", "Worries it will burn out fast"] },
    { template: "How does [name] feel about apologizing in writing versus in person?", options: ["Always face to face", "Writing lets them say it right", "Whatever feels more sincere", "In person, then in writing too"] },
    { template: "What does [name] do when a partner surprises them with dinner?", options: ["Feels completely spoiled", "Insists on helping clean up", "Savors every bite of the effort", "Plans to top it next time"] },
    { template: "How does [name] handle falling for someone unavailable?", options: ["Shuts it down immediately", "Pines from a distance", "Waits patiently in the wings", "Redirects the energy elsewhere"] },
    { template: "What does [name] believe is the secret to a lasting relationship?", options: ["Never stopping the small efforts", "Fighting fair, always", "Choosing each other daily", "Laughing through the hard parts"] },
    { template: "How does [name] react to a partner learning their love language?", options: ["Feels deeply cared for", "Notices and appreciates it", "Is pleasantly surprised", "Falls a little harder"] },
    { template: "What does [name] do when a relationship becomes routine?", options: ["Shakes things up on purpose", "Finds comfort in the rhythm", "Feels the itch of boredom", "Talks about keeping it fresh"] },
    { template: "How does [name] handle a partner who is slow to open up?", options: ["Patiently earns their trust", "Gives them all the time they need", "Feels shut out at first", "Opens up first to lead the way"] },
    { template: "What is [name]'s reaction to being someone's whole world?", options: ["Loves it but wants balance", "Feels the weight of it", "Cherishes the devotion", "Encourages them to have their own life"] },
    { template: "How does [name] feel about their partner's flaws?", options: ["Loves them, flaws and all", "Wishes a few would change", "Finds most of them endearing", "Accepts them fully"] },
    { template: "What does [name] do when a date checks their phone constantly?", options: ["Loses interest fast", "Calls it out playfully", "Matches the energy and checks theirs", "Gives them one more chance"] },
    { template: "How does [name] handle wanting reassurance without asking?", options: ["Drops obvious hints", "Waits and hopes silently", "Eventually just asks", "Pulls away until noticed"] },
    { template: "What does [name] value in how a partner handles conflict?", options: ["Staying calm and fair", "Fixing it fast, not stewing", "Really listening first", "Never going to bed angry"] },
    { template: "How does [name] feel about being surprised with flowers?", options: ["Absolutely loves it", "Prefers a more practical gift", "Touched by any thoughtful gesture", "A little embarrassed but happy"] },
    { template: "What does [name] do when they and a partner want different futures?", options: ["Talks it through honestly", "Hopes love bridges the gap", "Faces it as a real problem", "Looks for shared ground"] },
    { template: "How does [name] react to a partner remembering a tiny detail?", options: ["Feels truly seen", "Melts a little inside", "Is genuinely impressed", "Falls for them all over again"] },
    { template: "What is [name]'s biggest strength as a partner?", options: ["Unshakable loyalty", "Deep emotional support", "Making everything more fun", "Steady, calming presence"] },
    { template: "How does [name] handle a partner who needs a lot of space?", options: ["Respects it fully", "Finds their own to fill the gap", "Worries it means distance", "Trusts it and stays secure"] },
    { template: "What does [name] do when the relationship gets serious?", options: ["Leans all the way in", "Feels a flash of fear first", "Steps up and commits", "Takes it one day at a time"] },
    { template: "How does [name] feel about a partner who plans everything?", options: ["Loves being taken care of", "Wishes for more spontaneity", "Happily goes along", "Balances it with surprises"] },
    { template: "What does [name] want to hear at the end of a hard day together?", options: ["We got through it, together", "I am proud of you", "I am here no matter what", "Tomorrow will be better"] },
    { template: "How does [name] handle a partner who is bad at texting back?", options: ["Learns not to take it personally", "Gets a little anxious about it", "Calls instead of texting", "Sets an expectation about it"] },
    { template: "What is [name]'s reaction to slow dancing in the kitchen?", options: ["The most romantic thing ever", "Feels a little silly but loves it", "Melts right into it", "Wishes it happened more"] },
    { template: "How does [name] feel about being someone's calm in the storm?", options: ["Proud to be that person", "Loves being relied on", "Wants that in return too", "Finds deep meaning in it"] },
    { template: "What does [name] do when a partner gives them their full attention?", options: ["Soaks it in completely", "Feels a little shy under it", "Opens up more easily", "Cherishes the rare moment"] },
  ],
  secrets: [
    { template: "What's [name]'s hidden talent nobody expects?", options: ["They can sing surprisingly well", "They're secretly a great cook or baker", "They can draw or paint beautifully", "They can do impressions of famous people"] },
    { template: "What does [name] secretly judge people for?", options: ["Bad grammar and spelling", "Being rude to service workers", "Their taste in music or movies", "How they load a dishwasher or organize things"] },
    { template: "What's [name]'s guilty pleasure they'd never admit?", options: ["A trashy reality TV show", "A specific junk food they'll eat an entire bag of", "Re-reading old texts or social media posts", "Singing dramatically alone in the car"] },
    { template: "What's [name]'s secret fear that surprises people?", options: ["Deep water or the open ocean", "Being forgotten or not mattering", "Small enclosed spaces", "Growing old and having regrets"] },
    { template: "What does [name] do when absolutely nobody is watching?", options: ["Have full conversations with themselves", "Dance like nobody's watching, literally", "Practice speeches or arguments in the mirror", "Google their own name or look at old photos"] },
    { template: "What secret snack does [name] eat at midnight?", options: ["Cereal straight from the box", "Cheese, just cheese by itself", "Something spicy with hot sauce on everything", "Ice cream eaten directly from the container"] },
    { template: "What would [name] never want their parents to find out?", options: ["How many times they've called in sick while perfectly healthy", "The real story behind that one night", "How much money they've actually spent on something dumb", "A friendship or relationship they kept hidden"] },
    { template: "What's [name]'s most unpopular opinion?", options: ["A beloved movie or show is actually terrible", "A food everyone loves is genuinely disgusting", "A popular life advice is completely wrong", "A celebrity everyone adores is overrated"] },
    { template: "What's [name]'s secret dream they haven't told anyone?", options: ["Writing a book or creating something major", "Living abroad in a completely different culture", "Starting a business doing something they love", "Performing on stage for music, comedy, or acting"] },
    { template: "What habit does [name] have that they try to hide?", options: ["Procrastinating until the very last second", "Stalking people's social media profiles deeply", "Talking to their pet like it's a real person", "Hoarding random things they might need someday"] },
    { template: "What's [name]'s emotional support content?", options: ["A specific TV show they've rewatched five or more times", "A playlist that fixes any bad mood", "A comfort food that heals everything", "A YouTube channel or creator they watch religiously"] },
    { template: "What's the pettiest thing [name] has ever done?", options: ["Unfollowed someone over a minor disagreement", "Remembered an insult from years ago and brought it up", "Gone out of their way to prove someone wrong", "Kept score of favors and called it out eventually"] },
    { template: "What lie does [name] tell most often?", options: ["'I'm on my way' but hasn't left yet", "'I'm fine' but is absolutely not fine", "'I've seen that' but has definitely not seen it", "'I don't care' but cares very deeply"] },
    { template: "What would [name] change about themselves if nobody would know?", options: ["Their level of confidence", "A physical feature they're self-conscious about", "Their ability to not overthink everything", "Their financial situation instantly"] },
    { template: "What does [name] pretend to like but actually can't stand?", options: ["A popular food that everyone seems to love", "Small talk with acquaintances", "A genre of music their friends are into", "Going out when they'd rather stay home"] },
    { template: "What's the weirdest thing [name] has googled recently?", options: ["A random medical symptom spiral", "Something deeply philosophical at 2 AM", "How to do something embarrassingly basic", "Whether a dream they had means something"] },
    { template: "What secret skill is [name] practicing that nobody knows about?", options: ["Learning a musical instrument", "Working on their fitness or flexibility", "Learning a new language", "Writing poetry, songs, or stories"] },
    { template: "What's [name]'s secret comfort activity when they're stressed?", options: ["Cleaning or organizing everything around them", "Taking extremely long showers or baths", "Watching the same movie or show for the hundredth time", "Eating something indulgent while pretending they don't"] },
    { template: "What does [name] secretly think they're better at than everyone?", options: ["Giving advice on other people's lives", "Their taste in music", "Driving or navigating", "Reading people and situations"] },
    { template: "What childhood habit does [name] still secretly have?", options: ["Sleeping with a stuffed animal or special blanket", "Checking under the bed or behind the shower curtain", "Eating a food the exact same weird way they always did", "Talking to an imaginary audience in their head"] },
    { template: "What's [name]'s secret spending vice?", options: ["Food delivery apps, way too often", "Clothes or shoes they never end up wearing", "Subscriptions they forgot they're still paying for", "Random online shopping at 2 AM"] },
    { template: "What celebrity does [name] secretly have an obsession with?", options: ["Someone 'embarrassing' that they'd never admit to", "A childhood crush they never grew out of", "Someone controversial that would surprise everyone", "A niche or obscure person nobody else follows"] },
    { template: "What does [name] pretend to know a lot about but is actually clueless?", options: ["Politics and current events", "Wine, coffee, or some other 'sophisticated' topic", "A sport or hobby their friends are into", "Technology and how things actually work"] },
    { template: "What's a lie [name] told that got way bigger than intended?", options: ["A small excuse that required building a whole backstory", "A white lie about their skills that put them on the spot", "Saying they already did something they hadn't started", "Pretending to know someone or something important"] },
    { template: "What's the most embarrassing song on [name]'s most-played list?", options: ["A cheesy love song from a movie soundtrack", "A children's show theme song", "An extremely old song from a decade they weren't even alive for", "A TikTok or meme song they can't stop listening to"] },
    { template: "What does [name] secretly wish they could quit?", options: ["Social media scrolling", "Caring so much about what others think", "A bad habit they've tried to drop multiple times", "Their current job or field of study"] },
    { template: "What's [name]'s secret irrational fear?", options: ["A completely harmless insect or animal", "A specific sound or texture that makes them cringe", "The dark, even as a fully grown adult", "Something happening to their phone or losing all their data"] },
    { template: "What does [name] secretly do on their phone that they'd die if someone saw?", options: ["Draft long messages they never send", "Look at someone's profile way too often", "Take selfies or practice expressions in their camera", "Read fan fiction or super niche content"] },
    { template: "What's [name]'s most embarrassing auto-correct or text fail?", options: ["Sent something meant for one person to the wrong chat entirely", "Auto-correct changed an innocent word to something explicit", "Left a voice-to-text running during a private moment", "Accidentally liked an old photo while deep-stalking someone"] },
    { template: "What does [name] secretly think is overrated?", options: ["Traveling, they'd rather stay comfortable at home", "College or traditional education", "Marriage as an institution", "Hustle culture and working constantly"] },
    { template: "What's [name]'s secret emotional trigger that makes them cry every time?", options: ["A specific type of movie scene involving parents or family", "Seeing animals being rescued or reunited with owners", "Hearing a particular song tied to a memory", "Receiving unexpected kindness from a stranger"] },
    { template: "What's a secret [name] has kept from their closest friend?", options: ["Something they were jealous about but never said", "A time they were really hurt but pretended it was fine", "An opinion about a major life decision their friend made", "A personal struggle they don't want to burden anyone with"] },
    { template: "What does [name] hoard that they'll never admit to?", options: ["Screenshots of conversations, receipts for potential drama", "Packaging from expensive items to feel fancy", "Old clothes that don't fit but have sentimental value", "Ideas and plans they'll never actually execute"] },
    { template: "What social situation secretly terrifies [name]?", options: ["Walking into a room where they don't know anyone", "Being put on the spot to speak in front of a group", "Making phone calls to strangers", "Running into someone they know unexpectedly in public"] },
    { template: "What's [name]'s secret opinion about a friend's significant other?", options: ["They think the friend could do better", "They actually like the partner more than the friend knows", "They don't trust that person fully", "They think the couple is weirdly perfect together"] },
    { template: "What's [name]'s guilty pleasure movie or show they watch alone?", options: ["A reality dating show they pretend to hate", "A kids' animated movie or cartoon series", "A truly terrible movie they find comforting", "A soap opera or melodramatic series"] },
    { template: "What bad habit has [name] been hiding from people close to them?", options: ["Staying up way too late every single night", "Skipping meals or eating very irregularly", "Spending money they don't have", "Isolating themselves more than anyone realizes"] },
    { template: "What accomplishment is [name] secretly most proud of but never brings up?", options: ["Something they built or created entirely on their own", "A time they helped someone without anyone knowing", "Overcoming a personal struggle nobody knows about", "A small win that felt massive to them personally"] },
    { template: "What personality trait does [name] secretly wish they had?", options: ["The ability to not care what people think", "Being naturally charismatic and charming", "Having more patience and emotional control", "Being funnier or more quick-witted"] },
    { template: "What's the most embarrassing thing saved in [name]'s phone?", options: ["Screenshots of their own social media analytics", "Old thirst traps they never posted", "Drafts of texts to someone they never sent", "Notes app entries that read like a diary"] },
    { template: "What's [name]'s secret comfort food combination that sounds weird?", options: ["Something sweet mixed with something salty", "A condiment on food that doesn't normally have it", "A childhood snack they still eat the exact same way", "A fast food order that's embarrassingly specific"] },
    { template: "What does [name] secretly think about before falling asleep?", options: ["Conversations they wish had gone differently", "Fantasy scenarios about their ideal life", "Cringe memories from years ago that still haunt them", "Whether the people in their life really like them"] },
    { template: "What talent does [name] have that they downplay or hide?", options: ["Athletic ability they pretend they don't have", "Emotional intelligence and reading people accurately", "A creative skill they've never shown anyone", "Being genuinely very smart but playing it down"] },
    { template: "What does [name] pretend doesn't bother them but actually does?", options: ["Being left on read or getting slow replies", "Not being invited to something their friends did", "Constructive criticism, even when it's fair", "People interrupting or talking over them"] },
    { template: "What's [name]'s guilty pleasure content to consume alone?", options: ["True crime documentaries or podcasts", "Astrology and personality type content", "Conspiracy theories, just for entertainment", "Celebrity gossip and drama channels"] },
    { template: "What does [name] lie about on their resume or dating profile?", options: ["Their hobbies being more interesting than they are", "Their experience level with something", "How adventurous or spontaneous they actually are", "Nothing, they're painfully honest about everything"] },
    { template: "What's the biggest secret [name] is currently keeping?", options: ["Something about their finances", "Something about their feelings toward someone", "Something about their health or wellbeing", "A plan they haven't told anyone about yet"] },
    { template: "What conversation does [name] replay in their head years later?", options: ["Something clever they wish they'd said in an argument", "A compliment they received that they hold onto", "An embarrassing thing they said in front of people", "A serious conversation that changed a relationship"] },
    { template: "What rule does [name] secretly break all the time?", options: ["Speed limits and traffic rules", "Social norms like eating at weird hours or skipping events", "Self-imposed rules about diet, spending, or screen time", "Workplace or school rules they consider pointless"] },
    { template: "What's something [name] pretends to have outgrown but hasn't?", options: ["Cartoons or animated shows", "A childhood toy, game, or collection", "Getting their feelings hurt easily", "Needing validation and approval from others"] },
    { template: "What do [name]'s search history and browser tabs reveal about them?", options: ["Deeply random rabbit holes with no connecting theme", "Self-improvement content and life optimization", "Embarrassingly basic questions they should know the answer to", "A lot of shopping tabs they never actually purchase from"] },
    { template: "What does [name] secretly do that would surprise their family?", options: ["The type of content they consume online", "How they actually spend their money", "What they really think about certain family traditions", "How different their personality is with friends vs. family"] },
    { template: "What's [name]'s most embarrassing public moment they never talk about?", options: ["Waving back at someone who wasn't waving at them", "Tripping or falling in front of a crowd", "Being caught talking to themselves out loud", "Walking into a door or glass they didn't see"] },
    { template: "What would [name] confess if given total anonymity?", options: ["A grudge they've held that nobody knows about", "Something they stole, broke, or lost that they blamed on someone else", "A secret opinion about someone close to them", "A time they got away with something they shouldn't have"] },
    { template: "What's [name]'s biggest insecurity they mask with confidence?", options: ["Their intelligence or knowledge", "Their appearance or physical features", "Their social skills and likability", "Their worth and whether they deserve good things"] },
    { template: "What does [name] actually think during group conversations they're quiet in?", options: ["Judging everyone's takes silently", "Planning what to say next but the moment passes", "Genuinely lost in their own unrelated thoughts", "Feeling left out but pretending they're fine just listening"] },
    { template: "What small thing would devastate [name] if they lost it?", options: ["A specific piece of jewelry or accessory", "A digital folder of photos or messages", "A journal, notebook, or creative project", "An old gift from someone important to them"] },
    { template: "What's [name]'s secret coping mechanism?", options: ["Making dark jokes about their own problems", "Over-researching everything to feel in control", "Shopping or spending as emotional relief", "Keeping insanely busy so they don't have to feel anything"] },
    { template: "What role does [name] secretly play in the friend group?", options: ["The one who knows everyone's secrets but tells no one", "The one who lowkey starts drama then watches", "The one who cares the most but shows it the least", "The one holding the group together without credit"] },
    { template: "What's [name]'s most irrational pet peeve?", options: ["The sound of people chewing or breathing loudly", "When people don't push in their chairs", "Typos in professional or important messages", "When someone touches their stuff without asking"] },
    { template: "What secret ritual does [name] do before something important?", options: ["A specific pump-up song on repeat", "A lucky item they always carry", "A pep talk in the mirror", "A weird superstition nobody knows about"] },
    { template: "What is [name] secretly terrible at but pretends they're fine?", options: ["Directions and reading a map", "Basic math without a calculator", "Cooking anything beyond the basics", "Remembering people's names"] },
    { template: "What white lie does [name] use to get out of plans?", options: ["'Something came up with family'", "'I'm not feeling well'", "'I have a work thing'", "'I forgot I already made plans'"] },
    { template: "What does [name] do during an entire day home alone?", options: ["Never changes out of pajamas", "Deep-cleans then immediately messes it up", "Watches an absurd amount of TV", "Talks to themselves the whole time"] },
    { template: "What app does [name] secretly hide in a folder on their phone?", options: ["A dating app they won't admit to", "A game they think is too childish", "A guilty-pleasure content app", "A budgeting app they're scared to open"] },
    { template: "What would [name] delete first before handing someone their unlocked phone?", options: ["Their photo album, specifically", "Certain text conversations", "Their search history", "Their notes app entries"] },
    { template: "What does [name] secretly practice in the mirror?", options: ["Their fake laugh and reactions", "Comebacks for future arguments", "Their 'candid' photo smile", "A speech they'll probably never give"] },
    { template: "What book or movie does [name] pretend they've finished?", options: ["A famous classic novel", "A critically acclaimed film everyone loves", "A dense self-help bestseller", "A show everyone quotes constantly"] },
    { template: "What is [name] secretly weirdly competitive about?", options: ["Board games and trivia nights", "Who's the better texter or planner", "Being right in every argument", "Random things like step counts"] },
    { template: "What does [name] secretly save screenshots of?", options: ["Compliments people have given them", "Embarrassing things others said", "Outfit or decor inspiration", "Receipts of drama for later"] },
    { template: "What does [name] secretly do when they can't sleep?", options: ["Scroll their phone for hours", "Plan an elaborate imaginary future", "Snack quietly in the dark", "Reorganize something random"] },
    { template: "What grooming or self-care habit does [name] hide?", options: ["An extensive secret skincare routine", "How long they actually spend on their hair", "Plucking, popping, or grooming they'd never show", "A beauty product they overuse"] },
    { template: "What childhood dream is [name] secretly embarrassed about now?", options: ["Wanting to be famous or a pop star", "Wanting to be a superhero for real", "A wildly unrealistic career", "Marrying a celebrity they were obsessed with"] },
    { template: "What does [name] lie about to seem cooler?", options: ["Music or movies they're actually into", "How adventurous they really are", "Places they've traveled to", "How busy their social life is"] },
    { template: "What does [name] secretly reread over and over?", options: ["Old messages from a specific person", "Their own old social media posts", "A comforting book passage or fanfic", "Compliments saved in their notes"] },
    { template: "What is [name] secretly superstitious about?", options: ["Not jinxing good news by saying it", "Lucky numbers or specific dates", "Knocking on wood, unironically", "Reading their horoscope daily"] },
    { template: "What does [name] hoard digitally that nobody knows about?", options: ["Thousands of unorganized screenshots", "Playlists they never actually finish", "Drafts of messages they never send", "Photos they'll never delete or look at"] },
    { template: "What comfort object does [name] still secretly rely on as an adult?", options: ["A childhood stuffed animal", "A specific blanket or pillow", "An old hoodie that isn't even theirs", "A worn-out item they refuse to replace"] },
    { template: "What does [name] pretend to hate but secretly loves?", options: ["A cheesy pop song everyone knows", "A reality show they're fully invested in", "Being the center of attention", "A trendy food they publicly mock"] },
    { template: "What secret spreadsheet or list is [name] keeping?", options: ["A ranking of their friends, honestly", "Every show or book they've consumed", "A detailed budget they hide", "Petty grievances and who owes them"] },
    { template: "What does [name] secretly do to procrastinate?", options: ["Suddenly deep-clean everything", "Fall into a random research rabbit hole", "Reorganize their whole phone or desktop", "Text people they've ignored for weeks"] },
    { template: "What does [name] refuse to tell their doctor?", options: ["How little sleep they actually get", "Their real snacking and eating habits", "How much screen time they log", "Symptoms they've been ignoring"] },
    { template: "What is [name] secretly jealous of a friend for?", options: ["Their looks or effortless style", "Their relationship or love life", "Their career or money", "How carefree and confident they seem"] },
    { template: "What conversation does [name] rehearse before actually having it?", options: ["Ordering something complicated out loud", "A confrontation they're dreading", "Asking for a raise or a favor", "A phone call to a stranger"] },
    { template: "What does [name]'s bookmark or saved-posts folder secretly reveal?", options: ["Recipes they'll never actually cook", "Workout plans they never start", "Products they window-shop endlessly", "Travel destinations they dream about"] },
    { template: "What does [name] secretly do when they're proud of themselves?", options: ["A private little victory dance", "Text someone just to humblebrag", "Take a photo they'll never post", "Sit in quiet, smug satisfaction"] },
    { template: "What everyday thing is [name] secretly terrified of?", options: ["Making phone calls to strangers", "Merging on the highway", "Ordering for the whole table", "Being early and waiting alone"] },
    { template: "What food does [name] secretly eat in a weird way?", options: ["A snack in a bizarre unexpected order", "Dipping something in an odd condiment", "Deconstructing food before eating it", "Eating around the 'best part' to save it"] },
    { template: "What does [name] secretly do the second they get home?", options: ["Change into the same ratty comfort clothes", "Raid the fridge before doing anything else", "Collapse and scroll for an hour", "Narrate their day to their pet"] },
    { template: "What secret talent does [name] have that would surprise everyone?", options: ["Doing spot-on accents or voices", "Solving puzzles absurdly fast", "Remembering random useless facts", "A hidden athletic or physical skill"] },
    { template: "What does [name] secretly keep track of about other people?", options: ["Who remembers their birthday", "Who texts first and who doesn't", "Small slights they never mention", "Compliments people have given them"] },
    { template: "What is [name] secretly still bad at that they should've learned?", options: ["Tying something or a basic life skill", "Telling left from right instantly", "A common recipe everyone knows", "Some basic technology thing"] },
    { template: "What does [name] pretend to follow in conversation but is totally lost on?", options: ["Sports stats and team talk", "Complex politics or economics", "Crypto, stocks, and finance", "Niche pop culture references"] },
    { template: "What guilty snack does [name] secretly buy and hide?", options: ["An entire tub of something sweet", "Junk food they claim they don't eat", "A childish candy or cereal", "Something they eat straight from the package"] },
    { template: "What does [name] secretly think when everyone's laughing at a joke they didn't get?", options: ["Fake-laughs and moves on", "Quietly panics about being lost", "Plans to google it later", "Genuinely doesn't care and zones out"] },
    { template: "What is [name] secretly saving for that nobody knows about?", options: ["A big trip they haven't announced", "An escape fund, just in case", "Something extravagant and impractical", "A future they're too scared to say out loud"] },
    { template: "What does [name] secretly do on social media?", options: ["Deep-stalk profiles for way too long", "Draft posts they never publish", "Watch stories without ever engaging", "Keep a private account for lurking"] },
    { template: "What childhood fear does [name] secretly still have?", options: ["The dark, or something in it", "Being home alone at night", "A specific movie villain or scene", "Going in the deep end of a pool"] },
    { template: "What does [name] secretly overthink for hours?", options: ["A text they sent that got no reply", "Something slightly awkward they said", "Whether people actually like them", "A decision that doesn't even matter"] },
    { template: "What does [name] secretly do to feel in control?", options: ["Over-plan and list everything", "Clean and organize compulsively", "Research a decision to death", "Keep a rigid routine no one sees"] },
    { template: "What is [name]'s secret comfort watch when they're low?", options: ["A childhood cartoon or animated film", "A cooking or home show on loop", "The same sitcom for the tenth time", "Cozy vlogs or ambient background videos"] },
    { template: "What does [name] secretly wish more people knew about them?", options: ["How much they actually care", "How hard they're really trying", "A talent they never show off", "How funny they think they are"] },
    { template: "What does [name] hide about their real daily routine?", options: ["How late they actually wake up", "How many hours they scroll", "How often they skip meals", "How little they leave the house"] },
    { template: "What does [name] secretly do that they'd call cringe in others?", options: ["Post cryptic sad captions", "Talk to their plants or pet", "Sing dramatically alone in the car", "Take a hundred selfies for one post"] },
    { template: "What is [name] secretly holding onto that they should throw away?", options: ["Clothes that will never fit again", "Gifts from people they've cut off", "Broken things they'll 'fix someday'", "Notes and cards from years ago"] },
    { template: "What does [name] secretly google about themselves?", options: ["Whether their symptoms are serious", "Their own name to see what comes up", "Personality tests to feel understood", "Whether a habit of theirs is normal"] },
    { template: "What does [name] pretend to be over but secretly isn't?", options: ["An ex or an old crush", "A friendship that fell apart", "An embarrassment from years ago", "A dream they claim they gave up"] },
    { template: "What is [name]'s secretly favorite way to waste time?", options: ["Watching pointless short videos for hours", "Online window-shopping with no intent to buy", "Reading strangers' drama online", "Playing the same phone game endlessly"] },
    { template: "What does [name] secretly do to feel better after a bad day?", options: ["Buy something they don't need", "Eat a very specific comfort meal", "Take an absurdly long shower", "Text an old chat they shouldn't"] },
    { template: "What is [name] secretly a snob about?", options: ["Coffee or tea, quietly judging yours", "Grammar and spelling", "Music taste, without saying it", "Food and where it's from"] },
    { template: "What does [name] secretly keep to remember a person by?", options: ["Screenshots of their conversations", "A voice note they never delete", "A small gift or object from them", "A photo they can't bring themselves to unsave"] },
    { template: "What does [name] secretly do when they get a compliment they don't believe?", options: ["Instantly deflect it with a joke", "Argue against it out loud", "Smile but internally dismiss it", "Secretly hold onto it forever"] },
    { template: "What is [name]'s most embarrassing recurring dream?", options: ["Showing up somewhere completely unprepared", "Falling, endlessly, from somewhere high", "Losing their teeth or their voice", "Being chased by something unseen"] },
    { template: "What does [name] secretly research obsessively?", options: ["Reviews before any tiny purchase", "The backstory of every celebrity drama", "How to optimize some part of their life", "Worst-case scenarios of everything"] },
    { template: "What does [name] secretly do that their friends would tease them for?", options: ["Go to bed embarrassingly early", "Have a strict, nerdy hobby schedule", "Talk in a baby voice to their pet", "Keep a very earnest personal journal"] },
    { template: "What is [name] secretly proud of that sounds silly out loud?", options: ["Their parallel parking skills", "A very specific niche knowledge", "How well they've decorated a space", "A weird thing they can do with their body"] },
    { template: "What does [name] secretly do to avoid an awkward interaction?", options: ["Pretend to be on their phone", "Take a longer route to dodge someone", "Duck into a store to hide", "Suddenly become very interested in the floor"] },
    { template: "What does [name] secretly think about their own personality?", options: ["That they're funnier than people realize", "That they're harder to love than they seem", "That they're smarter than they let on", "That they're a bit of a fraud somehow"] },
    { template: "What is [name]'s secret weakness for a certain type of content?", options: ["Feel-good animal rescue videos", "Extremely petty internet drama", "Satisfying cleaning or organizing clips", "Dramatic true-crime storytelling"] },
    { template: "What does [name] secretly do before a big social event?", options: ["Rehearse conversation topics", "Have a mini pep talk with themselves", "Plan an exit strategy in advance", "Nearly cancel at the last second"] },
    { template: "What does [name] secretly compare themselves to others about?", options: ["How successful their career looks", "Their appearance and body", "How happy their relationships seem", "How together their life appears online"] },
    { template: "What is [name]'s secret guilty-pleasure purchase?", options: ["Overpriced fancy coffee daily", "Clothes they wear once, if ever", "In-app or in-game spending", "Random gadgets they never use"] },
    { template: "What does [name] secretly do when a friend is talking too long?", options: ["Nod while completely zoning out", "Plan their reply and miss the point", "Discreetly check their phone", "Genuinely listen but fake more interest than they feel"] },
    { template: "What is the pettiest thing [name] secretly keeps a mental note of?", options: ["Who never returned something they borrowed", "Who left them on read", "Who didn't invite them to something", "Who took credit for their idea"] },
    { template: "What does [name] secretly wish they could restart?", options: ["A skill they quit too early", "A friendship they let fade", "Their savings or finances", "A version of themselves they miss"] },
    { template: "What does [name] secretly do to seem more put-together than they are?", options: ["Clean only the parts guests will see", "Buy the same 'go-to' outfit repeatedly", "Keep a tidy public persona online", "Fake confidence they don't actually feel"] },
    { template: "What is [name] secretly self-conscious about in photos?", options: ["Their smile or their teeth", "A specific angle of their face", "Their posture or how they stand", "That they never know what to do with their hands"] },
    { template: "What does [name] secretly reread to hype themselves up?", options: ["Old kind messages people sent them", "Their own past wins written down", "Motivational quotes they've saved", "A specific compliment from someone that mattered"] },
    { template: "What does [name] secretly avoid doing at all costs?", options: ["Confrontation of any kind", "Asking anyone for help", "Being the first to arrive anywhere", "Sending a voice note back"] },
    { template: "What is [name]'s secret weird flex?", options: ["They've never had a cavity or something oddly specific", "An obscure record or achievement", "A celebrity they once met briefly", "A useless skill they're weirdly good at"] },
    { template: "What does [name] secretly do when they feel left out?", options: ["Act like they didn't even want to go", "Quietly withdraw from the group", "Post something to seem unbothered", "Overthink it for days in silence"] },
    { template: "What does [name] pretend to be busy with to avoid people?", options: ["'Work' they're not actually doing", "A phone call to no one", "An urgent errand that doesn't exist", "Being 'so tired' as a blanket excuse"] },
    { template: "What is [name] secretly bad at admitting?", options: ["That they were wrong", "That they need help", "That they're not okay", "That they were jealous"] },
    { template: "What does [name] secretly do at parties they don't want to be at?", options: ["Befriend the host's pet all night", "Hover near the food and the door", "Text people pretending to be busy", "Find one person and cling to them"] },
    { template: "What is [name]'s secret comfort meal they'd never order in public?", options: ["Cereal or breakfast food for dinner", "A weird combination of leftovers", "Plain pasta or rice with butter", "Something junky straight from the wrapper"] },
    { template: "What does [name] secretly do to seem interesting at gatherings?", options: ["Recycle the same three good stories", "Skim headlines to have opinions ready", "Ask questions to avoid talking about themselves", "Nurse a drink and let others carry it"] },
    { template: "What is [name] secretly protective of that seems trivial to others?", options: ["Their morning routine", "Their favorite spot on the couch", "Their alone time on weekends", "A specific mug, chair, or item"] },
    { template: "What does [name] secretly believe about themselves on their worst days?", options: ["That they're falling behind everyone", "That they're not really that likable", "That they'll never figure it out", "That they're pretending to have it together"] },
    { template: "What does [name] secretly do the moment they wake up?", options: ["Doomscroll before their eyes fully open", "Lie there dreading the day", "Check if a specific person texted", "Snooze five times and negotiate with themselves"] },
    { template: "What is [name]'s secret unspoken rule for themselves?", options: ["Never text first, ever", "Always have an exit plan", "Never let people see them cry", "Always assume the worst to be safe"] },
    { template: "What does [name] secretly do that would embarrass their younger self?", options: ["Gone to bed at a 'boring' hour by choice", "Enjoyed something they used to mock", "Become the exact adult they swore against", "Given up a dream quietly"] },
    { template: "What is [name] secretly holding a grudge about right now?", options: ["A comment someone made recently", "Being excluded from something", "Someone taking them for granted", "A promise that got broken"] },
    { template: "What does [name] secretly wish they could say to someone?", options: ["'You hurt me more than you know'", "'I still think about you'", "'Thank you, I never told you properly'", "'I'm not actually okay'"] },
    { template: "What does [name] secretly indulge in when nobody's judging?", options: ["Trashy TV marathons", "Eating dessert first, or only dessert", "Skipping every responsibility for a day", "Rewatching the same comfort content forever"] },
    { template: "What is [name] secretly convinced they're right about?", options: ["The best way to load a dishwasher", "How a certain situation will play out", "That their taste is objectively better", "That they called something before anyone else"] },
    { template: "What does [name] secretly do to calm down when overwhelmed?", options: ["Retreat somewhere completely alone", "Clean or organize to feel control", "Make a list of everything to defuse it", "Distract themselves until it passes"] },
    { template: "What is [name]'s secret habit around money?", options: ["Impulse buys then instant regret", "Hoards it and feels guilty spending", "Never checks their balance out of fear", "Splurges on others but not themselves"] },
    { template: "What does [name] secretly do that contradicts their whole image?", options: ["The 'chill' one who secretly panics", "The 'organized' one who's chaos inside", "The 'confident' one riddled with doubt", "The 'independent' one who craves closeness"] },
    { template: "What is [name] secretly afraid people will find out about them?", options: ["How much they actually care what others think", "How little they have figured out", "How lonely they sometimes feel", "How different they are behind closed doors"] },
    { template: "What does [name] secretly keep doing despite saying they'll stop?", options: ["Staying up way too late", "Checking a certain person's profile", "Spending on the same thing", "Saying yes when they mean no"] },
    { template: "What is [name]'s secret harmless obsession right now?", options: ["A specific song on endless repeat", "A show they can't shut up about internally", "A hobby they're quietly hyperfixated on", "A creator they watch every single day"] },
    { template: "What does [name] secretly do to feel less alone?", options: ["Keep background noise playing constantly", "Text into group chats they lurk in", "Reread old conversations that felt warm", "Go somewhere just to be around people"] },
    { template: "What is the most childish thing [name] secretly still does?", options: ["Make a wish at 11:11", "Avoid stepping on cracks or lines", "Hold their breath past graveyards or tunnels", "Talk to inanimate objects"] },
    { template: "What does [name] secretly think about their friend group?", options: ["That they're the glue holding it together", "That they're a little on the outside", "That two of them would clash without them", "That they love them but need a break sometimes"] },
    { template: "What is [name]'s secret tell when they're lying or nervous?", options: ["They over-explain and add too many details", "They laugh at the wrong moment", "They avoid eye contact completely", "They get weirdly still and quiet"] },
    { template: "What does [name] secretly wish they were brave enough to do?", options: ["Quit and chase a wild dream", "Tell someone how they really feel", "Cut off a draining relationship", "Move somewhere completely new"] },
    { template: "What does [name] secretly do that they'd deny under oath?", options: ["Talk to themselves out loud constantly", "Rehearse conversations that'll never happen", "Cry at commercials or ads", "Reread their own funny old texts"] },
    { template: "What is [name] secretly counting down to?", options: ["The weekend, every single week", "A trip or event far away", "Being able to leave a situation", "A milestone birthday or life change"] },
    { template: "What does [name] secretly measure their self-worth by?", options: ["How productive they were that day", "How much people seem to like them", "Their appearance in the mirror", "Comparing their progress to peers"] },
    { template: "What is [name]'s most secret comfort activity?", options: ["Making elaborate playlists no one hears", "Redecorating or rearranging a room", "Journaling everything late at night", "Watching the same three videos on loop"] },
    { template: "What does [name] secretly do when someone leaves them on read?", options: ["Reread their own message for flaws", "Assume they said something wrong", "Play it cool and never bring it up", "Draft a follow-up they don't send"] },
    { template: "What is [name] secretly bad at that they laugh off in public?", options: ["Taking a joke at their own expense", "Being spontaneous without a plan", "Small talk with strangers", "Handling any kind of criticism"] },
    { template: "What does [name] secretly do that helps their mental health?", options: ["Long solo walks with music", "Venting into a private note or voice memo", "A tiny daily ritual only they know", "Talking to a pet like a therapist"] },
    { template: "What is [name]'s secret irrational belief?", options: ["That good things come in threes", "That saying a fear out loud invites it", "That their gut is always right", "That certain objects hold luck"] },
    { template: "What does [name] secretly do when they're jealous of someone?", options: ["Mute them but keep watching", "Overcompliment them to hide it", "Quietly compete without admitting it", "Convince themselves they don't care"] },
    { template: "What is the most embarrassing thing in [name]'s recent order history?", options: ["A wildly specific comfort-food order", "Something they bought at 2 AM impulsively", "The tenth reorder of the same thing", "A gadget the ads clearly got them with"] },
    { template: "What does [name] secretly worry is 'wrong' with them?", options: ["That they feel too much", "That they don't feel enough", "That they're behind everyone their age", "That they're hard to truly know"] },
    { template: "What secret standard does [name] hold everyone to?", options: ["How fast they reply to texts", "Whether they remember important dates", "How they treat waiters and strangers", "Whether they follow through on plans"] },
    { template: "What does [name] secretly do to reset when life feels chaotic?", options: ["A total digital detox for a day", "Deep-clean their entire space", "Disappear and go off-grid briefly", "Replan their whole life in a notebook"] },
    { template: "What is [name] secretly nostalgic for?", options: ["A simpler time before responsibilities", "An old friend group that drifted", "A place they used to live or visit", "A version of themselves they've outgrown"] },
    { template: "What does [name] secretly do that feels a little embarrassing to admit?", options: ["Narrate their life like a movie in their head", "Give themselves out-loud pep talks", "Practice red-carpet interviews in the shower", "Argue with people in imaginary scenarios"] },
    { template: "What is [name]'s secret guilty comparison trap?", options: ["Scrolling and feeling behind", "Comparing relationships to others'", "Measuring success against old classmates", "Judging their body against strangers online"] },
    { template: "What does [name] secretly keep that has no real value but they can't toss?", options: ["Ticket stubs and old receipts", "A dead phone with old photos on it", "Notes and doodles from years ago", "A broken keepsake with a story"] },
    { template: "What is [name] secretly the most sensitive about?", options: ["Being called boring or predictable", "Being told they've changed", "Any comment about their appearance", "Being left out of the group"] },
    { template: "What is the pettiest grudge [name] is secretly holding?", options: ["Something from years ago they won't drop", "A slight nobody else even remembers", "A friend who took the last slice once", "An old rival they still quietly root against"] },
    { template: "What does [name] pretend to understand but really doesn't?", options: ["Cryptocurrency and the stock market", "Certain artsy films everyone loves", "How taxes actually work", "A whole topic they nod along to"] },
    { template: "What is [name]'s most embarrassing search history entry?", options: ["Symptoms of a harmless made-up illness", "How to reply to a text they overthought", "Lyrics to a very cheesy song", "Whether a celebrity is single"] },
    { template: "What secret skill could [name] surprise everyone with?", options: ["Perfectly parallel parking every time", "Reciting an entire movie by heart", "A weirdly specific party trick", "Winning any trivia about one niche topic"] },
    { template: "What does [name] secretly spend way too much money on?", options: ["Snacks and takeout coffee", "Things they never end up using", "Their one expensive hobby", "Random late-night online orders"] },
    { template: "What is [name] secretly terrible at despite pretending otherwise?", options: ["Directions and reading a map", "Remembering names", "Following a recipe exactly", "Keeping a plant alive"] },
    { template: "What childhood habit does [name] secretly still have?", options: ["A comfort item they can't part with", "Talking to themselves", "A specific bedtime ritual", "Biting their nails when nervous"] },
    { template: "What does [name] hide in their room from guests?", options: ["A stash of snacks", "An embarrassing collection", "A pile of unopened mail", "Something they keep meaning to return"] },
    { template: "What is [name]'s guiltiest late-night internet rabbit hole?", options: ["Reading about strange conspiracy theories", "Watching random how-it's-made videos", "Deep-diving a stranger's old posts", "Looking up houses they can't afford"] },
    { template: "What does [name] secretly find harder than they admit?", options: ["Saying no to people", "Asking for help", "Sitting still and doing nothing", "Letting a compliment land"] },
    { template: "What is the white lie [name] tells most often?", options: ["I'm five minutes away", "I already ate", "I'm totally fine", "Yeah, I remember that"] },
    { template: "What secret talent would make [name] internet famous?", options: ["An oddly satisfying skill", "A hidden singing voice", "Making the perfect meme", "A ridiculous physical feat"] },
    { template: "What does [name] secretly rehearse before doing it?", options: ["Phone calls to strangers", "Ordering at a busy counter", "A joke they want to land", "Saying no to someone"] },
    { template: "What is [name]'s most irrational secret fear?", options: ["A specific harmless bug", "Losing signal in a bad spot", "A weirdly specific scenario", "Something from a childhood movie"] },
    { template: "What does [name] secretly judge in other people's homes?", options: ["How they organize the fridge", "The state of their bathroom", "Their questionable decor choices", "How many shoes are by the door"] },
    { template: "What guilty pleasure show would [name] never admit to loving?", options: ["A dramatic reality dating show", "A cheesy talent competition", "A ridiculous soap opera", "A kids' cartoon they secretly adore"] },
    { template: "What does [name] secretly do to feel productive?", options: ["Make endless to-do lists", "Reorganize things that were fine", "Clean when they should be working", "Plan instead of actually starting"] },
    { template: "What is the secret reason [name] avoids certain events?", options: ["They hate small talk", "Social battery runs out fast", "Fear of running into someone", "They'd rather be home in comfort"] },
    { template: "What does [name] keep way longer than they should?", options: ["Old receipts and ticket stubs", "Clothes that don't fit anymore", "Half-dead pens", "Screenshots they never look at"] },
    { template: "What is [name]'s secret comfort routine after a bad day?", options: ["A specific comfort meal", "The same show on repeat", "A long shower and early bed", "Ranting to one trusted person"] },
    { template: "What is the bold thing [name] secretly wishes they could pull off?", options: ["Quit and chase a wild dream", "Say exactly what they think", "Travel somewhere alone", "Try a totally new look"] },
    { template: "What embarrassing thing is saved on [name]'s phone right now?", options: ["A dramatic selfie set", "A voice memo of a bad idea", "A note full of random thoughts", "A meme folder that's out of control"] },
    { template: "What does [name] secretly do when they're home alone?", options: ["Perform full concerts", "Talk to the mirror", "Eat something weird nobody would approve of", "Nothing productive whatsoever"] },
    { template: "What is [name]'s secret superstition?", options: ["A lucky item they never skip", "Avoiding a specific number", "A ritual before something big", "Knocking on wood, always"] },
    { template: "What does [name] pretend to have read but hasn't?", options: ["A famous classic novel", "The group chat from earlier", "The terms and conditions", "An article everyone's discussing"] },
    { template: "What is the secret snack combo [name] loves?", options: ["Something sweet dipped in something salty", "An oddly specific pairing", "Leftovers eaten cold at midnight", "A childhood combo nobody else likes"] },
    { template: "What does [name] secretly overthink the most?", options: ["Texts they sent hours ago", "Something awkward from years back", "What people really think of them", "Every decision, big and small"] },
    { template: "What is [name]'s hidden petty behavior in traffic?", options: ["Full monologues at other drivers", "Refusing to let someone merge", "Racing a car that annoyed them", "Judging everyone's parking"] },
    { template: "What does [name] secretly collect that no one knows about?", options: ["Something small and specific", "Screenshots of things online", "Random ticket stubs", "A hoard of one odd item"] },
    { template: "What is the secret thing [name] does to calm down?", options: ["A very specific breathing trick", "Cleaning something furiously", "Going somewhere completely alone", "Playing one song on loop"] },
    { template: "What does [name] secretly google about their own symptoms?", options: ["Whether a headache is serious", "If a weird noise is normal", "How much sleep they really need", "Something they'll instantly regret"] },
    { template: "What is [name]'s most guarded opinion about their friends?", options: ["Which one gives the worst advice", "Who they'd trust in a crisis", "A habit that quietly annoys them", "Who has changed the most"] },
    { template: "What does [name] secretly do to avoid a phone call?", options: ["Let it ring and text instead", "Rehearse before calling back", "Pretend they didn't see it", "Send a voice note to dodge it"] },
    { template: "What is the embarrassing nickname [name] secretly has?", options: ["One from childhood they hate", "A pet name they'd never share", "Something a sibling coined", "An inside joke gone too far"] },
    { template: "What does [name] secretly spend hours doing?", options: ["Scrolling with no memory of it", "Planning trips they won't take", "Perfecting something tiny", "Watching videos of one niche thing"] },
    { template: "What is [name]'s hidden guilty habit at work or school?", options: ["Looking busy while doing nothing", "Taking the long way to stall", "Snacking when no one's looking", "Daydreaming through meetings"] },
    { template: "What does [name] secretly wish people knew about them?", options: ["They're softer than they seem", "They notice everything", "They're funnier than they let on", "They care way more than they show"] },
    { template: "What is the secret item [name] can't sleep without?", options: ["A specific pillow or blanket", "White noise or a fan", "Their phone within reach", "Total darkness, no exceptions"] },
    { template: "What does [name] secretly do when they win an argument?", options: ["Gloat internally for days", "Play it cool but celebrate later", "Bring it up forever after", "Feel bad and let it go"] },
    { template: "What is [name]'s hidden talent for wasting time?", options: ["Reorganizing apps on their phone", "Watching one more episode", "Falling into comment sections", "Perfecting a text draft"] },
    { template: "What does [name] secretly keep in their bag at all times?", options: ["An emergency snack", "Way too many receipts", "A charger they never lend", "Something oddly specific"] },
    { template: "What is the small lie [name] tells to seem cooler?", options: ["That they've seen the popular show", "That they're not that into it", "That they knew that already", "That they meant to do that"] },
    { template: "What does [name] secretly practice when no one's around?", options: ["Their acceptance speech", "Comebacks for old arguments", "A dance nobody will see", "Their signature or autograph"] },
    { template: "What is [name]'s guiltiest food secret?", options: ["Eating dessert before dinner", "A weird condiment obsession", "Finishing the whole thing alone", "Something they'd never order in public"] },
    { template: "What does [name] secretly do to avoid a conversation?", options: ["Suddenly get very busy", "Fake a phone notification", "Change the subject fast", "Physically leave the room"] },
    { template: "What is the embarrassing thing [name] does when excited?", options: ["A tiny involuntary squeal", "An awkward little dance", "Talking way too fast", "Telling everyone immediately"] },
    { template: "What does [name] secretly reread or rewatch over and over?", options: ["An old favorite comfort show", "Their own old messages", "A book from childhood", "The same funny clip"] },
    { template: "What is [name]'s hidden reason for staying up too late?", options: ["Just one more scroll", "The quiet feels precious", "They lose track of time", "Revenge against a long day"] },
    { template: "What is [name]'s secret ritual for feeling in control?", options: ["Line everything up neatly", "Plan the whole day out", "Clean one specific thing", "Make a list they won't finish"] },
    { template: "What is the secret talent [name] downplays completely?", options: ["Being weirdly good at games", "Remembering random facts", "Fixing things nobody else can", "Reading people instantly"] },
    { template: "What does [name] secretly do when they get a compliment?", options: ["Replay it in their head later", "Deflect it immediately", "Get flustered and change topics", "Secretly glow for hours"] },
    { template: "What is [name]'s most hidden pet peeve?", options: ["Loud chewing near them", "People walking too slowly", "A specific misused word", "Being interrupted mid-sentence"] },
    { template: "What does [name] secretly stash away for emergencies?", options: ["A hidden bit of cash", "A backup charger", "A stress snack", "Something no one would guess"] },
    { template: "What is the secret way [name] procrastinates?", options: ["Cleaning instead of the real task", "Researching endlessly first", "Suddenly getting hungry", "Reorganizing their whole space"] },
    { template: "What does [name] secretly do the moment they get home?", options: ["Change into the same comfy clothes", "Collapse and do nothing", "Raid the kitchen instantly", "Put on the same background noise"] },
    { template: "What is [name]'s guiltiest form of eavesdropping?", options: ["Listening in on strangers nearby", "Reading over shoulders on transit", "Following a nearby argument", "Tuning into gossip they shouldn't"] },
    { template: "What does [name] secretly believe about themselves?", options: ["They're destined for something big", "They're a bit of a fraud", "They're funnier than everyone thinks", "They're smarter than they let on"] },
    { template: "What is the secret habit [name] does in the car alone?", options: ["Full dramatic sing-alongs", "Practicing conversations out loud", "Eating something messy", "Sitting in the driveway to decompress"] },
    { template: "What does [name] secretly hate but pretends to enjoy?", options: ["A friend's cooking", "A certain group activity", "A trend everyone loves", "Surprise parties"] },
    { template: "What is [name]'s hidden weakness for a certain type of content?", options: ["Trashy drama they can't quit", "Cute animal videos", "True crime deep dives", "Satisfying cleaning clips"] },
    { template: "What does [name] secretly do to prepare for a party?", options: ["Plan their exit strategy early", "Rehearse a few stories", "Pregame with alone time", "Decide when they'll leave beforehand"] },
    { template: "What is the small thing [name] is secretly proud of?", options: ["A skill nobody notices", "How they handled something hard", "A weirdly specific achievement", "Something from a long time ago"] },
    { template: "What is [name]'s secret move when sleep just won't come?", options: ["Solve imaginary problems", "Plan their dream life", "Scroll until sunrise", "Rehash an old embarrassing moment"] },
    { template: "What is [name]'s guiltiest shopping-cart secret?", options: ["A cart full of things never bought", "Impulse buys at checkout", "Saving items for someday", "Buying the same thing again"] },
    { template: "What does [name] secretly do to seem confident?", options: ["Fake it until it's real", "Copy someone they admire", "Rehearse the whole thing first", "Power pose where no one sees"] },
    { template: "What is the memory [name] secretly cringes at?", options: ["Something they said years ago", "An old fashion phase", "A text they can't unsend", "A moment only they remember"] },
    { template: "What does [name] secretly do with unwanted gifts?", options: ["Regift them quietly", "Stash them in a drawer forever", "Pretend to love and forget them", "Donate them the next week"] },
    { template: "What is [name]'s hidden habit with their phone battery?", options: ["Lets it die constantly", "Charges it obsessively", "Ignores every low warning", "Carries a backup everywhere"] },
    { template: "What does [name] secretly do when they mess up in public?", options: ["Laugh it off but die inside", "Pretend it was on purpose", "Replay it for weeks", "Leave the scene fast"] },
    { template: "What is the secret thing [name] does for good luck?", options: ["Wears a specific item", "Follows a tiny ritual", "Repeats a phrase to themselves", "Avoids doing something risky"] },
    { template: "What does [name] secretly find weirdly satisfying?", options: ["Popping or peeling something", "A perfectly organized space", "Checking off a full list", "A clean, oddly specific sound"] },
    { template: "What is [name]'s most secret comfort splurge?", options: ["Fancy takeout just for them", "A small treat they hide", "An extra of something they love", "A guilty little luxury"] },
    { template: "What does [name] secretly do to avoid making a decision?", options: ["Ask everyone else first", "Put it off indefinitely", "Flip a mental coin", "Let it decide itself"] },
    { template: "What is the embarrassing thing [name] does when tired?", options: ["Say things that make no sense", "Get emotional over nothing", "Laugh at everything", "Zone out mid-conversation"] },
    { template: "What does [name] secretly keep from their past?", options: ["An old note or letter", "A ticket from a special day", "A photo they never show", "A gift from someone gone"] },
    { template: "What is [name]'s hidden habit during video calls?", options: ["Checking their own face constantly", "Doing something off-camera", "Muting to mutter to themselves", "Only half paying attention"] },
    { template: "What does [name] secretly do to psych themselves up?", options: ["Blast one hype song", "Give a mirror pep talk", "Picture the win in detail", "Pace around the room"] },
    { template: "What is the secret [name] would take to the grave?", options: ["A harmless little crush", "Something embarrassing they did", "An opinion about a friend", "A tiny lie that grew"] },
    { template: "What does [name] secretly do when a plan gets canceled?", options: ["Feel secretly relieved", "Pretend to be disappointed", "Immediately get cozy at home", "Celebrate the free time"] },
    { template: "What is [name]'s guilty habit with leftovers?", options: ["Forgets them until they turn", "Eats them cold at 2am", "Hoards them possessively", "Never actually reheats them"] },
    { template: "What does [name] secretly notice first about a person?", options: ["Their shoes", "How they treat waitstaff", "Their teeth or smile", "Whether they're on their phone"] },
    { template: "What is the secret thing [name] does before a big event?", options: ["A private hype ritual", "Overpacks for every scenario", "Rehearses conversations", "Barely sleeps from nerves"] },
    { template: "What does [name] secretly wish they could redo?", options: ["A conversation gone wrong", "A choice they rushed", "A missed opportunity", "How they treated someone once"] },
    { template: "What is [name]'s hidden guilty habit while cooking?", options: ["Tasting everything constantly", "Ignoring the recipe entirely", "Making a huge mess", "Snacking so much they're full"] },
    { template: "What does [name] secretly do when they're bored in a meeting?", options: ["Doodle in the margins", "Draft texts they won't send", "Plan dinner in their head", "Count down the minutes"] },
    { template: "What is the secret way [name] shows they're upset?", options: ["Goes suspiciously quiet", "Cleans aggressively", "Gets extra polite", "Answers in one word replies"] },
    { template: "What does [name] secretly do with their old journals or notes?", options: ["Never reread out of fear", "Hide them very well", "Cringe and keep them anyway", "Threaten to burn them"] },
    { template: "What is [name]'s hidden talent nobody would believe?", options: ["An accent they can nail", "A random useful skill", "Mimicking someone perfectly", "A trick with a strange object"] },
    { template: "What does [name] secretly do when they get good news?", options: ["Keep it quiet to savor it", "Tell one person immediately", "Do a private happy dance", "Wait for the perfect moment to share"] },
    { template: "What is the secret reason [name] loves being alone?", options: ["No performing for anyone", "Total control of the remote", "Peace and quiet at last", "Freedom to be their weird self"] },
    { template: "What does [name] secretly do to remember things?", options: ["Notes to themselves everywhere", "A song or rhyme trick", "Say it out loud repeatedly", "Trust their memory and forget"] },
    { template: "What is [name]'s guilty habit with unread messages?", options: ["Leaves them on read forever", "Reads and forgets to reply", "Opens them only when ready", "Ignores the badge entirely"] },
    { template: "What does [name] secretly do at a boring party?", options: ["Befriend the pet in the corner", "Hide in the kitchen", "Text under the table", "Plan a graceful escape"] },
    { template: "What is the secret thing [name] is scared to try?", options: ["Something adventurous and physical", "Putting their art out there", "Being fully honest with someone", "A big life change"] },
    { template: "What does [name] secretly do when complimented on their outfit?", options: ["Immediately tell you the price", "Deflect with a joke", "Beam and pretend not to", "Explain the whole backstory"] },
    { template: "What is [name]'s hidden habit when they're nervous?", options: ["Fidget with something in reach", "Crack the same joke", "Overtalk to fill silence", "Go completely still"] },
    { template: "What does [name] secretly do to feel better instantly?", options: ["Buy one small treat", "Text a specific friend", "Put on a comfort playlist", "Take a hot shower"] },
    { template: "What is the small thing [name] secretly lies about age-wise?", options: ["Their bedtime", "How much they nap", "What they find fun now", "How out of touch they feel"] },
    { template: "What does [name] secretly do when everyone else is watching a movie?", options: ["Scroll their phone the whole time", "Fall asleep halfway", "Ask what's happening constantly", "Narrate their predictions"] },
    { template: "What is [name]'s guiltiest habit at a buffet?", options: ["Overfilling the first plate", "Guarding the good dish", "Trying everything twice", "Sneaking dessert first"] },
    { template: "What does [name] secretly keep meaning to fix but never does?", options: ["A tiny broken thing at home", "A relationship they've neglected", "A bad habit they know about", "A password they always forget"] },
    { template: "What is the secret thing [name] envies in others?", options: ["Their effortless confidence", "How easily they relax", "Their social ease", "How free they seem"] },
    { template: "What does [name] secretly do when they can't find something?", options: ["Blame everyone but themselves", "Look in the same spot repeatedly", "Give up and buy a new one", "Find it exactly where they left it"] },
    { template: "What is [name]'s hidden habit with new gadgets?", options: ["Never reads the manual", "Watches setup videos obsessively", "Presses everything to learn", "Ignores half the features"] },
    { template: "What does [name] secretly do when they're proud of a text they sent?", options: ["Reread it a few times", "Screenshot it to save", "Wait eagerly for the reply", "Feel smug about the wording"] },
    { template: "What is the secret indulgence [name] hides from their diet?", options: ["A midnight sweet treat", "A drink they pretend to skip", "Second helpings in private", "A whole snack in one sitting"] },
    { template: "What does [name] secretly do when a friend is late?", options: ["Draft a passive-aggressive text", "Pretend it's fine but stew", "Enjoy the extra alone time", "Start planning a comeback joke"] },
    { template: "What is [name]'s hidden habit when watching sports or a game?", options: ["Yell at the screen", "Get weirdly superstitious", "Explain rules nobody asked about", "Only care about the snacks"] },
    { template: "What does [name] secretly do to look busy?", options: ["Carry papers around", "Type fast at nothing", "Walk with purpose everywhere", "Frown at a blank screen"] },
    { template: "What is the secret thing [name] does with their morning?", options: ["Snooze five times", "Scroll before getting up", "Sit in silence with coffee", "Rush and skip everything"] },
    { template: "What does [name] secretly do when they lose a game?", options: ["Blame the setup or luck", "Demand a rematch instantly", "Sulk quietly for a bit", "Pretend they didn't care"] },
    { template: "What is [name]'s guilty habit with self-checkout?", options: ["Panic when it beeps wrong", "Bag way too slowly", "Avoid it out of dread", "Feel smug beating the line"] },
    { template: "What does [name] secretly do when they smell something burning?", options: ["Assume it's someone else", "Deny it was them", "Blast a candle to cover it", "Quietly open every window"] },
    { template: "What is the secret way [name] avoids chores?", options: ["Suddenly get very busy", "Do a smaller task instead", "Wait for someone else to crack", "Promise to do it tomorrow"] },
    { template: "What does [name] secretly do when someone tells a long story?", options: ["Zone out but nod along", "Wait for their turn to talk", "Plan their exit", "Genuinely get lost halfway"] },
    { template: "What is [name]'s hidden habit at the grocery store?", options: ["Snack before paying", "Buy things not on the list", "Judge other people's carts", "Take forever choosing produce"] },
    { template: "What does [name] secretly do when they're the last one awake?", options: ["Raid the whole kitchen", "Watch something guilty", "Sit in peaceful silence", "Do the thing they'd never do watched"] },
    { template: "What is the secret thing [name] worries about at 3am?", options: ["A choice they can't undo", "Money and the future", "Something awkward from ages ago", "Whether they locked the door"] },
    { template: "What does [name] secretly do when a trend takes over?", options: ["Pretend to hate it, then love it", "Try it in secret first", "Refuse on principle", "Jump in but deny caring"] },
    { template: "What is [name]'s guiltiest habit with a group chat?", options: ["Mutes it and never checks", "Reacts but never replies", "Reads at 2am, replies at noon", "Leaves people on delivered"] },
    { template: "What does [name] secretly do when they can't stop thinking of a song?", options: ["Play it on loop to exhaust it", "Sing it under their breath all day", "Force it onto everyone else", "Suffer through it silently"] },
    { template: "What is the secret talent [name] wishes they could show off?", options: ["A hidden creative gift", "A physical stunt", "A brainy party trick", "An impression of someone famous"] },
    { template: "What does [name] secretly do when they see their name in a group photo?", options: ["Judge only their own face", "Untag if it's bad", "Save it despite everything", "Scan for who looks worse"] },
    { template: "What is [name]'s hidden habit with expiration dates?", options: ["Ignores them completely", "Panics the day before", "Smells everything to decide", "Tosses things way too early"] },
    { template: "What does [name] secretly do when someone borrows their stuff?", options: ["Track it obsessively", "Never expect it back", "Drop hints to get it returned", "Pretend it's fine while worrying"] },
    { template: "What is the secret way [name] copes with awkward silence?", options: ["Comment on the weather", "Pull out their phone", "Ask a random question", "Just let it be awkward"] },
    { template: "What does [name] secretly do before an important message goes out?", options: ["Read it aloud to themselves", "Send it to a friend first", "Rewrite it a dozen times", "Hover over send forever"] },
    { template: "What is [name]'s guilty habit with online reviews?", options: ["Reads every one before buying", "Trusts only the bad ones", "Ignores them and regrets it", "Writes long ones nobody reads"] },
    { template: "What does [name] secretly do when they walk past a mirror?", options: ["Sneak a full check every time", "Fix one specific thing", "Avoid looking on bad days", "Strike a tiny pose"] },
    { template: "What is the secret thing [name] does when praised publicly?", options: ["Turn bright red", "Make a self-deprecating joke", "Secretly replay it for days", "Shift credit to someone else"] },
    { template: "What does [name] secretly do with a to-do list?", options: ["Add finished tasks just to cross them off", "Rewrite it instead of doing it", "Lose it and start over", "Ignore it entirely by noon"] },
    { template: "What is [name]'s hidden habit when they get a package?", options: ["Rip it open in the doorway", "Save the box for no reason", "Forget they even ordered it", "Track it obsessively for days"] },
    { template: "What does [name] secretly do when they don't know an answer?", options: ["Confidently make something up", "Change the subject smoothly", "Say let me get back to you", "Google it under the table"] },
    { template: "What is the secret snack [name] hides from housemates?", options: ["A special treat with their name on it", "Something in a decoy container", "A stash at the back of the shelf", "The good stuff behind the boring stuff"] },
    { template: "What does [name] secretly do when they feel behind in life?", options: ["Compare and spiral quietly", "Make a big new plan", "Distract themselves entirely", "Pretend they're right on track"] },
    { template: "What is [name]'s guilty habit with their alarm?", options: ["Sets ten and ignores nine", "Snoozes into oblivion", "Turns it off in their sleep", "Panics when it doesn't go off"] },
    { template: "What does [name] secretly do when a friend gets good news?", options: ["Feel a tiny pang first, then joy", "Overcelebrate to seem happy", "Get genuinely thrilled instantly", "Quietly compare to their own life"] },
    { template: "What is the secret thing [name] does when nobody replies to their message?", options: ["Assume the worst immediately", "Reread it for what went wrong", "Play it cool but check hourly", "Send a follow-up they regret"] },
    { template: "What does [name] secretly do with a movie they don't get?", options: ["Nod like they understood", "Look up the ending after", "Pretend it was too deep", "Admit they were lost the whole time"] },
    { template: "What is [name]'s hidden habit when they cook for others?", options: ["Panic-clean the whole kitchen", "Downplay how hard they tried", "Fish for compliments", "Apologize before anyone tastes it"] },
    { template: "What does [name] secretly do when they win at something small?", options: ["Celebrate way too hard", "Play it cool but glow inside", "Bring it up for weeks", "Immediately want to go again"] },
    { template: "What is the secret way [name] reacts to horror content?", options: ["Watches through their fingers", "Pretends they're not scared", "Sleeps with the light on after", "Laughs to hide the fear"] },
    { template: "What does [name] secretly do when they get a haircut they hate?", options: ["Pretend to love it", "Avoid mirrors for a week", "Wear a hat until it grows", "Tip anyway and cry later"] },
    { template: "What is [name]'s guilty habit with borrowed books or media?", options: ["Never returns them", "Dog-ears every page", "Forgets who lent them", "Keeps them for years guiltily"] },
    { template: "What does [name] secretly do when a joke of theirs flops?", options: ["Double down and explain it", "Pretend they didn't say it", "Laugh it off, dying inside", "Blame the crowd"] },
    { template: "What is the secret comfort [name] returns to when stressed?", options: ["A childhood movie", "One specific meal", "A place that feels safe", "A song from years ago"] },
    { template: "What does [name] secretly do when they can't pronounce a word?", options: ["Avoid saying it entirely", "Mumble through it fast", "Confidently guess and hope", "Change the whole sentence"] },
    { template: "What is [name]'s hidden habit with unfinished projects?", options: ["Starts five, finishes none", "Hides them out of shame", "Swears they'll return to them", "Abandons and starts fresh"] },
    { template: "What does [name] secretly do when praised for something easy?", options: ["Milk it for all it's worth", "Feel like a bit of a fraud", "Accept it graciously anyway", "Confess it was actually simple"] },
    { template: "What is the secret thing [name] does at a restaurant?", options: ["Order the same safe thing", "Judge the menu design", "Eye everyone else's plates", "Overthink the whole order"] },
    { template: "What does [name] secretly do when they're overwhelmed?", options: ["Shut down and go quiet", "Clean instead of coping", "Make a plan to feel control", "Pretend everything is fine"] },
    { template: "What is [name]'s guilty habit with old clothes?", options: ["Keeps everything just in case", "Wears the same five things", "Hoards a lucky item", "Never actually donates the bag"] },
    { template: "What does [name] secretly do when someone sends a voice note?", options: ["Dread listening to it", "Wait until totally alone", "Read the transcript instead", "Reply by text out of spite"] },
    { template: "What is the secret way [name] handles a compliment on their work?", options: ["Immediately point out the flaws", "Save the message forever", "Deflect but glow inside", "Credit luck or others"] },
    { template: "What does [name] secretly do when a plan requires a phone call?", options: ["Find any way to text instead", "Rehearse the whole thing", "Ask someone else to call", "Put it off for days"] },
    { template: "What is [name]'s hidden habit with their reflection in windows?", options: ["Checks it every single time", "Pretends they weren't looking", "Fixes their hair in it", "Avoids it entirely"] },
    { template: "What does [name] secretly do when they oversleep?", options: ["Blame the alarm forever", "Skip breakfast and sprint", "Pretend they meant to", "Panic-clean their appearance"] },
    { template: "What is the secret thing [name] does when they get flustered?", options: ["Laugh at nothing", "Talk in circles", "Suddenly need to leave", "Blush and hope it passes"] },
    { template: "What does [name] secretly do when nobody claims the last slice?", options: ["Take it and deny wanting it", "Offer it around, hoping for a no", "Sneak it when no one's looking", "Cut it in half to seem fair"] },
    { template: "What is [name]'s guilty habit with their browser tabs?", options: ["Keeps forty open at once", "Never closes anything", "Loses track of them all", "Bookmarks and forgets forever"] },
    { template: "What does [name] secretly do when they hear their voice recorded?", options: ["Cringe and refuse to listen", "Insist that's not how they sound", "Laugh at how weird it is", "Delete it immediately"] },
    { template: "What is the secret thing [name] does when they're the passenger?", options: ["Slam an imaginary brake", "Backseat-navigate constantly", "Control the music entirely", "Nap the whole way"] },
    { template: "What does [name] secretly do when they finish a great book or show?", options: ["Sit in silence, a little empty", "Immediately need to talk about it", "Start it all over again", "Refuse to start anything new for days"] },
    { template: "What is [name]'s hidden habit with sticky notes or reminders?", options: ["Covers everything in them", "Ignores every single one", "Loses them instantly", "Writes them but never looks again"] },
    { template: "What does [name] secretly do when a stranger waves at them?", options: ["Wave back before checking", "Look behind them in panic", "Freeze and overthink it", "Pretend to check their phone"] },
    { template: "What is the secret thing [name] rehearses in the shower?", options: ["A dramatic monologue", "An argument they'll never have", "A future acceptance speech", "The perfect comeback"] },
    { template: "What does [name] secretly do when they can't decide what to watch?", options: ["Scroll for an hour, watch nothing", "Rewatch an old favorite", "Fall asleep browsing", "Let someone else choose"] },
    { template: "What is [name]'s guilty habit with their savings?", options: ["Raids it for treats", "Forgets it exists", "Guards it obsessively", "Moves it around to feel richer"] },
    { template: "What does [name] secretly do when they get a wrong-number text?", options: ["Reply just to be nice", "Ignore it entirely", "Mess with them a little", "Overthink whether to answer"] },
    { template: "What is the secret thing [name] does when they enter an empty house?", options: ["Announce they're home to no one", "Check every room just in case", "Blast music instantly", "Relish the total silence"] },
    { template: "What does [name] secretly do when a waiter says enjoy your meal?", options: ["Accidentally say you too", "Freeze and mumble thanks", "Nod without a word", "Overthink the reply for hours"] },
    { template: "What is [name]'s hidden habit when they find money in an old pocket?", options: ["Feel like they won the lottery", "Immediately spend it", "Forget it again instantly", "Save it as lucky money"] },
    { template: "What does [name] secretly do when the doorbell rings unexpectedly?", options: ["Freeze and pretend to be out", "Panic-tidy the entryway", "Peek through the window first", "Ignore it entirely"] },
    { template: "What is the secret thing [name] does when they can't find their phone?", options: ["Call it from another phone", "Panic and retrace every step", "Realize it was in their hand", "Assume the worst immediately"] },
    { template: "What does [name] secretly do when a song they hate comes on?", options: ["Secretly know all the words", "Complain but not skip it", "Skip it dramatically", "Pretend not to react at all"] },
    { template: "What is [name]'s guilty habit when they open the fridge?", options: ["Stare with the door open", "Reopen it hoping for new food", "Snack standing right there", "Rearrange nothing but pretend to look"] },
    { template: "What does [name] secretly do when they walk into a spiderweb?", options: ["Flail dramatically for a full minute", "Pretend it didn't happen", "Feel it for the rest of the day", "Refuse to walk that path again"] },
    { template: "What is the secret thing [name] does before a big deadline?", options: ["Suddenly clean everything", "Panic-plan instead of starting", "Convince themselves there's time", "Work in one frantic burst"] },
    { template: "What does [name] secretly do when they get a like from a crush?", options: ["Overanalyze what it means", "Screenshot it for a friend", "Play it impossibly cool", "Rewatch the notification"] },
    { template: "What is [name]'s hidden habit when they hear a good piece of gossip?", options: ["Act uninterested while dying to know", "Immediately need more details", "Swear not to share, then share", "Pretend they already knew"] },
  ],
  preferences: [
    { template: "What's [name]'s dream vacation destination?", options: ["A secluded tropical island", "A bustling city like Tokyo", "A European countryside villa", "An African safari adventure"] },
    { template: "What would [name] eat for their last meal?", options: ["A perfectly grilled steak dinner", "Homemade comfort food from childhood", "An extravagant sushi omakase", "A massive pizza with everything on it"] },
    { template: "What superpower would [name] choose?", options: ["Teleportation", "Reading minds", "Time travel", "Invisibility"] },
    { template: "What's [name]'s ideal weekend morning?", options: ["Sleeping in until noon", "An early workout followed by brunch", "Coffee and a good book on the couch", "Cooking an elaborate breakfast"] },
    { template: "What era would [name] want to live in?", options: ["The Roaring 1920s", "Ancient Rome at its peak", "The far future, year 3000", "The 1980s, peak pop culture"] },
    { template: "What animal would [name] want as an exotic pet?", options: ["A baby penguin", "A red panda", "A miniature pig", "A parrot that can hold conversations"] },
    { template: "What's [name]'s go-to karaoke song?", options: ["A classic power ballad", "The latest pop hit", "An old-school hip-hop anthem", "Something absolutely ridiculous for laughs"] },
    { template: "Where would [name] want to live if money was no object?", options: ["A penthouse in Manhattan", "A beachfront villa in Zanzibar", "A cozy cabin in the Swiss Alps", "A modern home in Kyoto, Japan"] },
    { template: "What would [name] binge-watch on a rainy day?", options: ["A true crime documentary series", "A classic sitcom from start to finish", "An intense thriller or sci-fi show", "A reality TV competition"] },
    { template: "What cuisine does [name] secretly crave the most?", options: ["Spicy Thai street food", "Rich Italian pasta dishes", "Japanese ramen at 2 AM", "Mexican tacos with all the fixings"] },
    { template: "What car would [name] drive in their fantasy garage?", options: ["A matte black sports car", "A vintage convertible", "A fully loaded luxury SUV", "An electric hypercar"] },
    { template: "What skill would [name] master instantly if they could?", options: ["Playing piano like a concert virtuoso", "Speaking every language fluently", "Professional-level cooking", "Expert martial arts"] },
    { template: "What's [name]'s ideal date night?", options: ["A candlelit dinner at a rooftop restaurant", "A fun adventure like go-karting or hiking", "A cozy movie night with snacks at home", "A spontaneous road trip to somewhere new"] },
    { template: "What would [name] want their dream job title to be?", options: ["Chief Vibes Officer", "Professional World Traveler", "Creative Director of Everything", "Retired at 35"] },
    { template: "What type of music does [name] listen to when nobody is around?", options: ["Emotional sad songs", "Guilty-pleasure pop from the 2000s", "Hardcore rap or metal", "Classical or jazz instrumentals"] },
    { template: "What season does [name] feel most like themselves in?", options: ["Summer, warm and energized", "Autumn, cozy and reflective", "Winter, quiet and contemplative", "Spring, optimistic and fresh"] },
    { template: "What's [name]'s ideal living situation?", options: ["A big house with lots of space and a yard", "A sleek apartment in the heart of a city", "A small, cozy place with just the essentials", "A farmhouse or homestead far from everything"] },
    { template: "What would [name] choose as their signature cocktail or drink?", options: ["Something classic and strong like an old fashioned", "A fancy, well-crafted cocktail with a story", "Beer, wine, or something simple and no-fuss", "They'd skip alcohol and have a really good mocktail"] },
    { template: "What type of book does [name] gravitate toward?", options: ["Fiction that makes them feel something deep", "Self-improvement and business strategy", "Fantasy or sci-fi world-building", "True stories, biographies, or memoirs"] },
    { template: "What does [name]'s ideal morning routine look like?", options: ["Meditation, journaling, a structured start", "Slow coffee, scrolling, easing into the day", "A workout to get the blood flowing", "Sleeping until the last possible minute then rushing"] },
    { template: "If [name] could have dinner with anyone alive or dead, who would it be?", options: ["A historical figure they've always admired", "A celebrity or artist they're obsessed with", "A deceased family member they miss", "A visionary entrepreneur or world leader"] },
    { template: "What's [name]'s ideal way to spend a million dollars?", options: ["Real estate and investments", "Travel the entire world for a year", "Start a business or creative project", "Set up their family and donate the rest"] },
    { template: "What phone app does [name] spend the most time on?", options: ["A social media platform", "A video streaming app", "A messaging or group chat app", "A game or puzzle app"] },
    { template: "What is [name]'s comfort movie, the one they'll never skip?", options: ["A childhood animated movie", "A classic rom-com they know every line to", "A specific action or adventure film", "Something obscure that only they seem to love"] },
    { template: "What vibe does [name]'s dream home have?", options: ["Modern minimalist with clean lines", "Warm and eclectic with collected treasures", "Industrial loft with exposed brick", "Coastal or tropical, open and breezy"] },
    { template: "How does [name] prefer to travel?", options: ["Planned itinerary with everything booked", "Spontaneous with just a one-way ticket", "Luxury all the way, five-star everything", "Backpacker style, rough it for the experience"] },
    { template: "What's [name]'s ideal pet?", options: ["A loyal, big dog they can adventure with", "A chill cat that matches their energy", "Something exotic and unique", "No pets, they prefer the freedom"] },
    { template: "What social media platform best represents [name]'s personality?", options: ["Twitter/X, quick takes and opinions", "Instagram, curated aesthetics and visuals", "TikTok, funny and always on trends", "They barely use social media at all"] },
    { template: "What's [name]'s go-to outfit when they want to look their best?", options: ["All black, sleek and timeless", "Something colorful and expressive", "Smart casual, effortlessly put together", "Comfort first, style second, always"] },
    { template: "What would [name] choose as their retirement plan?", options: ["Beach house, zero responsibilities", "Traveling continuously with no home base", "Building a passion project or creative space", "A quiet life with a garden and daily routine"] },
    { template: "What type of workout does [name] actually enjoy?", options: ["Running or solo cardio", "Weights and strength training", "Team sports or group fitness classes", "They actively avoid working out"] },
    { template: "What's [name]'s dream concert to attend?", options: ["A massive stadium show by their all-time favorite artist", "An intimate, acoustic set in a small venue", "A legendary festival like Coachella or Glastonbury", "A throwback tour of a band from their childhood"] },
    { template: "What kind of vacation does [name] prefer?", options: ["Beach resort, do nothing for a week", "Cultural exploration in a new city", "Adventure trip with hiking, diving, or thrills", "A road trip with friends and zero plans"] },
    { template: "What aesthetic describes [name]'s digital life?", options: ["Organized folders and clean inbox", "Chaos: 2000 unread emails, screenshots everywhere", "Dark mode everything, minimal notifications", "Curated and aesthetic, they care how things look"] },
    { template: "What's [name]'s preferred way to celebrate their birthday?", options: ["A big party with all their people", "A quiet dinner with a few close friends", "Solo self-care day, treating themselves", "They don't like making a big deal of it at all"] },
    { template: "What talent show category would [name] enter?", options: ["Singing or musical performance", "Comedy or stand-up", "Dance routine", "A hidden nerdy talent like speed-solving or trivia"] },
    { template: "What's [name]'s definition of a perfect Sunday?", options: ["Brunch and then nothing else planned", "Outdoors, nature, and fresh air", "A full day of creative projects or hobbies", "Recovering from Saturday with zero movement"] },
    { template: "What TV genre is [name] drawn to most?", options: ["Drama with complex characters", "Comedy that makes them laugh out loud", "Mystery and thriller that keeps them guessing", "Documentary and real-life stories"] },
    { template: "If [name] opened a business, what would it be?", options: ["A restaurant or coffee shop", "A creative studio or agency", "A tech startup or app", "A boutique or curated retail store"] },
    { template: "What language would [name] most want to learn fluently?", options: ["French, for the romance and culture", "Japanese, for the art and tech", "Arabic, for the depth and heritage", "Spanish, for the practicality and travel"] },
    { template: "What childhood snack does [name] still secretly love?", options: ["Something sugary and colorful", "A salty crunchy chip or cracker", "A frozen treat or ice cream bar", "Something their mom or grandma specifically made"] },
    { template: "What would [name] choose as their theme song?", options: ["Something upbeat and energizing", "A moody, atmospheric track", "A classic rock anthem", "An R&B or soul song with feeling"] },
    { template: "How does [name] prefer to relax after a stressful week?", options: ["Total isolation, phone off, disappear", "Going out with friends and forgetting about it", "A creative outlet like cooking, art, or music", "Binge-watching something mindless"] },
    { template: "What's [name]'s stance on breakfast?", options: ["Most important meal, they never skip it", "Just coffee until noon", "Brunch is the only valid version of breakfast", "They eat whatever is around with no routine"] },
    { template: "What does [name] collect or wish they could collect?", options: ["Books, vinyl, or media of some kind", "Sneakers, fashion, or accessories", "Art, prints, or photography", "Experiences and memories, not things"] },
    { template: "What's [name]'s favorite type of weather?", options: ["Sunny and hot, beach weather", "Cool and overcast, hoodie weather", "Rainy and dramatic, cozy-inside weather", "Crisp and cold, winter-walk weather"] },
    { template: "How would [name] furnish a room with unlimited budget?", options: ["Mid-century modern, everything curated", "Maximalist, every surface tells a story", "Minimalist, almost empty, clean space", "Tech-forward with smart everything"] },
    { template: "What kind of party does [name] prefer?", options: ["Loud, crowded, energetic club night", "A chill house party with good music", "A game night or activity-based hangout", "An intimate dinner party with conversation"] },
    { template: "What's [name]'s ideal weekend getaway?", options: ["A cabin in the mountains", "A boutique hotel in a walkable city", "A beach rental with ocean views", "Wherever their friends suggest, they're easy"] },
    { template: "If [name] could eat one meal forever, what cuisine would it be?", options: ["Italian, comfort in every bite", "Japanese, the perfect balance", "Mexican, bold and flavorful always", "Indian, complexity and spice for days"] },
    { template: "What's [name]'s approach to gift giving?", options: ["Thoughtful and personalized, weeks of thought", "Generous budget, luxury item every time", "Experiential, tickets or trips over things", "Last minute but somehow always good"] },
    { template: "What fictional world would [name] live in?", options: ["Hogwarts or a magical universe", "A sci-fi world with space travel", "A period drama world with estates and balls", "A Studio Ghibli world, peaceful and whimsical"] },
    { template: "What time of day is [name] at their best?", options: ["Early morning, they're a sunrise person", "Late morning to afternoon, peak productivity", "Evening, they come alive at night", "Past midnight, they're a true night owl"] },
    { template: "What does [name] do first when they wake up?", options: ["Check their phone immediately", "Use the bathroom and avoid screens for a bit", "Hit snooze at least twice", "Lie in bed thinking about the day ahead"] },
    { template: "What style icon does [name] secretly admire?", options: ["Someone classic and timeless, old Hollywood", "Someone bold and experimental with fashion", "Someone effortlessly casual and cool", "They don't follow fashion trends at all"] },
    { template: "What kind of neighborhood does [name] dream of living in?", options: ["Walkable, with cafes and bookshops nearby", "Quiet suburban with trees and space", "Urban high-rise with a skyline view", "Rural, remote, as far from people as possible"] },
    { template: "What's [name]'s relationship with cooking?", options: ["They love it and it's genuinely a hobby", "They can cook but rarely bother", "They survive on takeout and simple meals", "They want to learn but haven't committed"] },
    { template: "What museum or exhibit would [name] never leave?", options: ["Art, classic and contemporary", "Science and technology, interactive exhibits", "History and anthropology, learning about civilizations", "None, museums aren't their thing"] },
    { template: "What's [name]'s dream creative project?", options: ["Writing and publishing a book", "Starting a YouTube channel or podcast", "Creating a fashion or design brand", "Making a short film or documentary"] },
    { template: "How does [name] feel about flying?", options: ["Loves it, window seat every time", "Tolerates it but prefers other travel", "Nervous flyer, white knuckles on takeoff", "Would drive or take a train instead every time"] },
    { template: "Window seat or aisle seat for [name]?", options: ["Window, for the view and the wall to lean on", "Aisle, for the legroom and freedom", "Middle, they're a saint who doesn't care", "Whatever's cheapest, they don't mind"] },
    { template: "Coffee or tea for [name]?", options: ["Coffee, they can't function without it", "Tea, calm and civilized", "Both, depending on the mood", "Neither, they run on pure chaos"] },
    { template: "How does [name] take their coffee?", options: ["Black, no nonsense", "Sweet and creamy, basically dessert", "A fancy specialty order every time", "Iced, no matter the season"] },
    { template: "Sweet or savory for [name]?", options: ["Sweet tooth all the way", "Savory, they'd skip dessert", "Both at once, weird combos", "Depends entirely on their mood"] },
    { template: "Beach or mountains for [name]'s ideal trip?", options: ["Beach, sun and salt water", "Mountains, cool air and quiet", "Both, they want a bit of everything", "Neither, a city trip every time"] },
    { template: "Cats or dogs for [name]?", options: ["Dog person, loyal and playful", "Cat person, independent and chill", "Both, they love all animals", "Neither, they prefer no pets"] },
    { template: "Is [name] an early bird or a night owl?", options: ["Early bird, up with the sun", "Night owl, alive after midnight", "Neither, chronically tired all day", "Depends on their sleep debt"] },
    { template: "Does [name] prefer texting or calling?", options: ["Texting, calls give them anxiety", "Calling, it's faster and warmer", "Voice notes as a compromise", "In person or nothing"] },
    { template: "Is [name] a planner or spontaneous?", options: ["A planner, everything scheduled", "Spontaneous, decides last minute", "A planner who wishes they were spontaneous", "Chaotic, no plan and no worries"] },
    { template: "Movies at home or in the theater for [name]?", options: ["Theater, the full big-screen experience", "Home, pajamas and pause button", "Theater for blockbusters, home for the rest", "They fall asleep either way"] },
    { template: "Book, audiobook, or the movie adaptation for [name]?", options: ["The book, always the book", "Audiobook, they multitask through it", "Just the movie, they don't read much", "All three if they love the story"] },
    { template: "Is [name] a saver or a spender?", options: ["A saver, watches every dollar", "A spender, treats themselves often", "A saver who splurges impulsively", "Depends what payday looks like"] },
    { template: "What's [name]'s go-to takeout order?", options: ["Pizza, the eternal answer", "Something spicy and saucy", "Sushi or something fancy", "The same 'usual' every single time"] },
    { template: "What's [name]'s spice tolerance?", options: ["Bring the heat, the spicier the better", "Medium, a pleasant tingle", "Mild, they're a lightweight", "Zero, plain and safe"] },
    { template: "What's [name]'s ideal Friday night?", options: ["Out with friends, energy up", "On the couch, fully checked out", "A nice dinner and low-key fun", "Whatever's spontaneous and unplanned"] },
    { template: "What decade's music does [name] love most?", options: ["The 80s, synths and anthems", "The 90s and 2000s throwbacks", "Whatever's charting right now", "Older classics from before their time"] },
    { template: "What would [name]'s dream tattoo be?", options: ["Something small and meaningful", "A big, bold statement piece", "A tribute to a person or place", "They'd never actually get one"] },
    { template: "What's [name]'s ideal road trip length?", options: ["A quick day trip, there and back", "A long weekend getaway", "A weeks-long cross-country epic", "They'd rather just fly there"] },
    { template: "Streaming or owning music and movies for [name]?", options: ["Streaming everything, no clutter", "They still love physical copies", "A mix, they collect favorites", "They pirate and won't admit it"] },
    { template: "What instrument would [name] most love to play?", options: ["Piano, elegant and versatile", "Guitar, cool and portable", "Drums, loud and cathartic", "Something unusual and unexpected"] },
    { template: "How does [name] like to wake up?", options: ["Slowly, easing into the day", "Blaring alarm and straight up", "Natural light, no alarm at all", "After hitting snooze a dozen times"] },
    { template: "What would [name] happily splurge on?", options: ["Travel and experiences", "Good food and dining out", "Tech and gadgets", "Clothes and appearance"] },
    { template: "What would [name] never spend money on?", options: ["Expensive coffee or drinks", "Designer labels and brands", "Gym memberships they won't use", "Anything trendy or overhyped"] },
    { template: "What kind of comedy makes [name] laugh hardest?", options: ["Dry, witty, deadpan humor", "Absurd, chaotic slapstick", "Dark and a little inappropriate", "Wholesome, feel-good silliness"] },
    { template: "How much sleep does [name] actually need?", options: ["A solid eight or they're useless", "Five hours and they're fine", "Ten if they can get away with it", "It varies wildly, no pattern"] },
    { template: "Sneakers or dress shoes for [name]?", options: ["Sneakers, comfort every time", "Dress shoes, always polished", "Boots, their real signature", "Barefoot or slides if they could"] },
    { template: "What's [name]'s ideal number of close friends?", options: ["A tight circle of two or three", "A big, lively friend group", "One ride-or-die best friend", "They keep it loose and open"] },
    { template: "How does [name] spend a totally free day off?", options: ["Adventuring out and doing something new", "Zero plans, pure rest and rot", "Catching up on chores and errands", "Diving into a hobby for hours"] },
    { template: "What weather does [name] love to sleep in?", options: ["Rain drumming on the window", "Cold enough for heavy blankets", "A thunderstorm, oddly cozy", "Warm and breezy with the window open"] },
    { template: "What's [name]'s ideal celebration for a big win?", options: ["A big party with everyone", "A quiet dinner with their favorite people", "Treating themselves to something nice", "Immediately setting the next goal"] },
    { template: "What's [name]'s favorite holiday?", options: ["The winter holidays, cozy and festive", "Their own birthday, obviously", "Halloween, costumes and chaos", "Any long weekend counts"] },
    { template: "What dessert would [name] always choose?", options: ["Anything chocolate", "Ice cream in any form", "A warm baked good, fresh from the oven", "Something fruity and light"] },
    { template: "What's [name]'s ideal home temperature?", options: ["Cold, blankets and a hoodie", "Warm and toasty always", "Cool for sleeping, warm for lounging", "They're always fighting someone over it"] },
    { template: "What's [name]'s dream kitchen upgrade?", options: ["A top-tier espresso machine", "A massive island for entertaining", "Every gadget imaginable", "They don't cook, so nothing"] },
    { template: "How does [name] organize their living space?", options: ["Minimal, everything in its place", "Cozy clutter with a system only they get", "Aesthetic first, function second", "Organized chaos, somehow it works"] },
    { template: "What social setting is [name] most comfortable in?", options: ["A big loud crowd, full energy", "A small group of close friends", "One-on-one deep conversation", "Solo, honestly, and content"] },
    { template: "What themed party would [name] throw?", options: ["A glamorous dress-up affair", "A cozy game or movie night", "A wild costume party", "A chill dinner party with great food"] },
    { template: "What time of day does [name] feel most creative?", options: ["Early morning with fresh eyes", "Midday in full flow", "Late at night when it's quiet", "Randomly, never on schedule"] },
    { template: "What non-alcoholic drink is [name]'s go-to?", options: ["Fancy coffee, no question", "A specific soda they're loyal to", "Tea, hot or iced", "Just water, they're boringly hydrated"] },
    { template: "How does [name] like their eggs?", options: ["Scrambled and simple", "Fried with a runny yolk", "An elaborate omelette", "They don't eat eggs at all"] },
    { template: "What gift would make [name] happiest to receive?", options: ["Something thoughtful and personal", "An experience or a trip", "Something practical they actually need", "Cash, honestly, no pretending"] },
    { template: "What's [name]'s favorite movie genre?", options: ["Action and adventure", "Comedy above all", "Horror and thrillers", "Drama that makes them feel things"] },
    { template: "What would [name]'s dream home location be?", options: ["A buzzing city center", "A quiet spot near nature", "By the ocean, always", "Somewhere remote and off-grid"] },
    { template: "What's [name]'s ideal pizza topping?", options: ["Classic pepperoni", "Loaded with veggies", "The controversial pineapple", "Just cheese, keep it pure"] },
    { template: "How does [name] prefer to spend a rainy afternoon?", options: ["Curled up with a movie or book", "Baking or cooking something warm", "A productive deep-clean", "Napping without any guilt"] },
    { template: "What kind of hotel does [name] prefer?", options: ["Luxury, spare no expense", "A charming boutique with character", "Clean and budget-friendly is fine", "A unique stay like a cabin or hostel"] },
    { template: "What's [name]'s dream way to see a new city?", options: ["Wandering with no map, getting lost", "A packed itinerary of every sight", "Eating their way through it", "Following the locals off the tourist path"] },
    { template: "What kind of art speaks to [name]?", options: ["Bold, colorful, and modern", "Classic and timeless", "Weird, abstract, and thought-provoking", "Photography and real moments"] },
    { template: "What's [name]'s comfort TV show they rewatch?", options: ["A cozy sitcom they know by heart", "A dramatic series with all the feels", "A reality show for background noise", "An animated show from their childhood"] },
    { template: "What's [name]'s ideal way to exercise?", options: ["Lifting and building strength", "Running or cardio to clear their head", "A fun class or team sport", "A long walk that barely counts"] },
    { template: "What would [name] choose for a dream day trip?", options: ["A hike with a stunning view", "A day at a museum or gallery", "A food tour through a new town", "A lazy beach or lake day"] },
    { template: "What's [name]'s signature scent or vibe?", options: ["Fresh, clean, and crisp", "Warm, cozy, and inviting", "Bold and unforgettable", "They swear they don't have one"] },
    { template: "What's [name]'s dream pet if there were no limits?", options: ["A big fluffy dog", "A majestic horse", "Something exotic like a fox or owl", "A tiny pocket-sized companion"] },
    { template: "What kind of vacation pace suits [name]?", options: ["Go-go-go, see everything", "Slow mornings, no alarms", "A balance of activity and rest", "Whatever the group decides"] },
    { template: "What would be [name]'s ideal creative hobby?", options: ["Painting or drawing", "Writing or journaling", "Photography or filmmaking", "Music, playing or producing"] },
    { template: "What's [name]'s dream mode of transport?", options: ["A sleek fast car", "A motorcycle for the thrill", "A boat or yacht life", "They'd take a train and read the whole way"] },
    { template: "What kind of restaurant does [name] gravitate to?", options: ["A trendy new spot everyone's posting", "A cozy hole-in-the-wall gem", "Fine dining for special occasions", "The same reliable favorite every time"] },
    { template: "What's [name]'s ideal soundtrack for a long drive?", options: ["Sing-at-the-top-of-their-lungs hits", "Chill lo-fi or acoustic vibes", "A gripping podcast instead of music", "Nostalgic throwbacks from the past"] },
    { template: "What's [name]'s dream skill to show off at a party?", options: ["Playing an instrument on the spot", "A killer dance move", "Card tricks or sleight of hand", "Telling a story that owns the room"] },
    { template: "What kind of book does [name] never finish?", options: ["Dense non-fiction they meant to learn from", "A trendy bestseller everyone hyped", "A self-help book they lost steam on", "Any of the five they started at once"] },
    { template: "What's [name]'s ideal breakfast?", options: ["A big savory spread", "Something sweet like pancakes", "Just coffee and vibes", "Whatever's fast, on the way out"] },
    { template: "What would [name] pick for a night out?", options: ["Dancing until late", "A live show or concert", "A quiet bar for good conversation", "Dinner then straight home"] },
    { template: "What's [name]'s favorite kind of weather overall?", options: ["Bright and sunny", "Cool, crisp, and cloudy", "Cozy and rainy", "Snowy and magical"] },
    { template: "What phone screen aesthetic does [name] have?", options: ["Perfectly organized apps and folders", "Chaos, apps everywhere, no order", "A gorgeous curated wallpaper setup", "Notifications and red badges galore"] },
    { template: "What would [name]'s dream home feature be?", options: ["A huge cozy reading nook", "A home theater or gaming setup", "A dreamy kitchen for cooking", "A private outdoor garden or patio"] },
    { template: "What kind of shows does [name] binge?", options: ["Gripping crime and mysteries", "Reality drama, guilty pleasure", "Comfort comedies on repeat", "Epic fantasy or sci-fi sagas"] },
    { template: "What's [name]'s ideal way to unwind at night?", options: ["A hot bath or long shower", "Scrolling in bed for too long", "Reading until they drift off", "A show and a snack"] },
    { template: "What souvenir does [name] always bring home from a trip?", options: ["A fridge magnet, classic", "Local snacks and treats", "A postcard or photo print", "Nothing, memories are enough"] },
    { template: "What's [name]'s dream celebrity dinner guest?", options: ["A hilarious comedian", "A brilliant scientist or thinker", "A music legend", "An icon from their childhood"] },
    { template: "What's [name]'s go-to comfort activity when sick?", options: ["Sleeping the whole day away", "Bingeing familiar shows", "Being fully babied by someone", "Powering through and ignoring it"] },
    { template: "What kind of playlist does [name] make?", options: ["A hyper-specific mood playlist", "One giant chaotic mix of everything", "Carefully ordered like a story", "They just hit shuffle on everything"] },
    { template: "What's [name]'s dream weekend activity with friends?", options: ["A big group adventure or trip", "A cozy game or movie night in", "Trying a new restaurant or spot", "Doing absolutely nothing together"] },
    { template: "What kind of shoes fill [name]'s closet?", options: ["Endless sneakers", "Boots for every season", "Heels or dress shoes for events", "The same two comfy pairs on rotation"] },
    { template: "What's [name]'s ideal amount of alone time per week?", options: ["Tons, they need to recharge solo", "A little, but they crave people", "A perfect balance of both", "Barely any, they hate being alone"] },
    { template: "What would [name] order at a coffee shop?", options: ["Plain black coffee", "An over-the-top sweet blended drink", "A classic latte or cappuccino", "Tea or a hot chocolate instead"] },
    { template: "What's [name]'s dream car vibe?", options: ["Sleek, fast, and flashy", "Rugged and adventure-ready", "Practical and reliable", "Vintage and full of character"] },
    { template: "What would [name] do with a free afternoon in a new city?", options: ["Hit every famous landmark", "Find the best local food", "Wander with no plan at all", "Relax at a cafe and people-watch"] },
    { template: "What's [name]'s favorite way to celebrate small wins?", options: ["A treat like a snack or coffee", "Telling someone right away", "A quiet moment of self-satisfaction", "Rewarding themselves with a purchase"] },
    { template: "What kind of music does [name] play to get pumped up?", options: ["Loud hype rap or hip-hop", "Rock anthems", "High-energy pop or dance", "Aggressive metal or EDM"] },
    { template: "What's [name]'s dream way to spend New Year's Eve?", options: ["A huge party counting down", "A quiet night in with close people", "Somewhere new and adventurous", "Asleep before midnight, honestly"] },
    { template: "What's [name]'s ideal seat at a restaurant?", options: ["A cozy corner booth", "Right by the window", "Facing the door, always", "Anywhere quiet and out of the way"] },
    { template: "What does [name] always overpack for a trip?", options: ["Way too many outfit options", "Every possible charger and gadget", "Snacks for a small army", "Just-in-case items they never use"] },
    { template: "What's [name]'s dream way to spend a birthday?", options: ["Surrounded by everyone they love", "A quiet, intimate celebration", "A solo trip to treat themselves", "Ignoring it entirely, no fuss"] },
    { template: "What kind of gift is [name] amazing at giving?", options: ["Deeply thoughtful and personal ones", "Extravagant, budget-be-damned gifts", "Practical things people actually need", "Funny, inside-joke presents"] },
    { template: "What's [name]'s favorite kind of night sky?", options: ["A sky full of stars in the countryside", "A glowing city skyline at night", "A dramatic sunset fading out", "A full moon that stops them in their tracks"] },
    { template: "What's [name]'s ideal reading spot?", options: ["A sunny window seat", "In bed, all cozy", "A cafe with background buzz", "Outside in nature somewhere"] },
    { template: "What kind of documentary would [name] watch?", options: ["True crime, always", "Nature and the natural world", "Music or a famous artist", "Something about food or travel"] },
    { template: "What's [name]'s dream skill to wake up already having?", options: ["Fluency in several languages", "Playing any instrument perfectly", "Cooking like a professional chef", "Drawing or painting beautifully"] },
    { template: "What snack does [name] always keep stocked?", options: ["Chips or something crunchy", "Chocolate or candy", "Fruit or something healthy-ish", "Whatever's on sale, no loyalty"] },
    { template: "What's [name]'s ideal weekend morning ritual?", options: ["Slow coffee and no rush", "A workout to start strong", "Sleeping in as long as possible", "A big proper breakfast"] },
    { template: "What's [name]'s dream festival or event to attend?", options: ["A huge music festival", "A food and drink festival", "A film or arts festival", "A cultural celebration abroad"] },
    { template: "What kind of movie night does [name] prefer?", options: ["A tense edge-of-your-seat thriller", "A feel-good comfort rewatch", "A tearjerker to cry it out", "Something so bad it's good"] },
    { template: "What's [name]'s ideal way to travel long distance?", options: ["Flying, get it over with fast", "A scenic train ride", "A road trip with stops along the way", "A cruise, floating and relaxed"] },
    { template: "What would [name] pick for a lazy Sunday?", options: ["Brunch then a nap", "A movie marathon", "A slow walk somewhere pretty", "Prepping for the week ahead"] },
    { template: "What's [name]'s favorite genre of music to work to?", options: ["Lo-fi or ambient background", "Upbeat pop to stay energized", "Classical or instrumental focus music", "Total silence, no music at all"] },
    { template: "What's [name]'s dream item to splurge on someday?", options: ["A dream home", "A dream car", "A once-in-a-lifetime trip", "A wardrobe glow-up"] },
    { template: "What's [name]'s comfort meal after a long day?", options: ["Pasta or noodles", "A big juicy burger", "Something warm and soupy", "Breakfast food for dinner"] },
    { template: "What kind of chair does [name] fight for?", options: ["The comfiest spot on the couch", "The one closest to an outlet", "The window seat, always", "Wherever they can put their feet up"] },
    { template: "What's [name]'s ideal amount of social plans per week?", options: ["Something almost every night", "A couple of solid hangouts", "One is plenty, then rest", "As few as socially acceptable"] },
    { template: "What would [name]'s dream backyard have?", options: ["A pool for lazy summer days", "A firepit for cozy nights", "A big garden to grow things", "A hammock and total quiet"] },
    { template: "What's [name]'s favorite way to remember a trip?", options: ["A camera roll full of photos", "A journal of the whole thing", "A small keepsake or souvenir", "Just the memories, no clutter"] },
    { template: "What's [name]'s ideal karaoke energy?", options: ["Center stage, owning it", "A crowd-pleaser everyone joins", "A joke song for pure laughs", "Hiding in the back, never singing"] },
    { template: "What kind of nightlife does [name] enjoy?", options: ["Loud clubs and dancing", "Cozy bars with good drinks", "Live music venues", "None, they're in bed by ten"] },
    { template: "What's [name]'s dream way to spend a windfall of free time?", options: ["Travel somewhere far away", "Finally learn a new skill", "Rest and do absolutely nothing", "Start a passion project"] },
    { template: "What's [name]'s ideal comfort drink on a cold day?", options: ["Hot chocolate with everything on top", "A strong hot coffee", "Herbal tea to warm up", "Mulled cider or something seasonal"] },
    { template: "What kind of art would [name] hang in their home?", options: ["Big bold statement pieces", "Personal photos and memories", "Quirky, unexpected finds", "Calm, minimalist prints"] },
    { template: "What's [name]'s go-to way to treat themselves?", options: ["A great meal out", "A shopping spree", "A spa or self-care day", "A whole day off doing nothing"] },
    { template: "What's [name]'s dream way to spend a snow day?", options: ["Outside playing in it", "Inside cozy by a window", "Baking and hot drinks all day", "Working through it, snow won't stop them"] },
    { template: "What's [name]'s favorite kind of scenery?", options: ["Rolling mountains", "Endless ocean", "A vibrant cityscape", "Quiet forests and greenery"] },
    { template: "What's [name]'s ideal work-from-home setup?", options: ["A perfectly organized desk", "The couch or bed, comfort first", "A cafe for the buzz", "Rotating spots, they can't sit still"] },
    { template: "What's [name]'s dream way to end a perfect day?", options: ["A quiet moment alone to reflect", "Good conversation with someone they love", "Falling asleep to a show", "Journaling and winding down slowly"] },
    { template: "What's [name]'s ideal amount of luggage for a week away?", options: ["A single carry-on, expertly packed", "A giant checked bag, just in case", "Two bags minimum, options matter", "Whatever, they'll figure it out there"] },
    { template: "What's [name]'s dream concert seat?", options: ["Front row, right at the stage", "The pit, in the thick of it", "A comfy seated view up top", "Anywhere with a clear screen"] },
    { template: "What's [name]'s favorite thing to do at a bookstore?", options: ["Browse for hours with no goal", "Beeline to one specific section", "Sit and read without buying", "Grab a coffee and people-watch"] },
    { template: "What's [name]'s ideal way to spend a heatwave?", options: ["At the pool or beach", "Blasting AC indoors", "Chasing ice cream and cold drinks", "Complaining about it constantly"] },
    { template: "What's [name]'s dream evening in?", options: ["Cooking something elaborate", "A movie and takeout", "A long bath and a book", "Gaming or a hobby for hours"] },
    { template: "What's [name]'s favorite airport ritual?", options: ["Arriving hours early to relax", "Cutting it dangerously close", "A treat-yourself meal or snack", "Browsing every shop out of boredom"] },
    { template: "What is [name]'s ideal way to spend a rainy day?", options: ["Curled up with a book", "A movie marathon under blankets", "Baking something warm", "Napping without any guilt"] },
    { template: "What kind of music does [name] secretly love most?", options: ["Old-school throwbacks", "Something soft and moody", "High-energy dance hits", "Whatever is nostalgic to them"] },
    { template: "What would [name] pick for the perfect breakfast?", options: ["A big savory fry-up", "Something sweet like pancakes", "Just coffee and quiet", "A grab-and-go pastry"] },
    { template: "What is [name]'s dream way to travel?", options: ["Slow road trips with no plan", "Luxury and total comfort", "Backpacking on a budget", "First-class straight to a resort"] },
    { template: "What is [name]'s go-to comfort movie?", options: ["A feel-good classic", "A childhood animated favorite", "A cheesy romantic comedy", "An action blockbuster"] },
    { template: "What season does [name] love the most?", options: ["Cozy autumn", "Bright summer", "Crisp winter", "Fresh spring"] },
    { template: "What kind of home does [name] dream about?", options: ["A cabin in the woods", "A sleek city apartment", "A beach house by the water", "A cozy cottage in the country"] },
    { template: "What would be [name]'s perfect pet?", options: ["A loyal dog", "An independent cat", "Something small and low-key", "No pet, too much work"] },
    { template: "What is [name]'s favorite way to unwind after work?", options: ["A long shower or bath", "Zoning out to a show", "A walk to clear their head", "Doing absolutely nothing"] },
    { template: "What kind of coffee order screams [name]?", options: ["Straight black, no fuss", "Something sweet and blended", "A fancy specialty drink", "Tea, actually, not coffee"] },
    { template: "What is [name]'s ideal Friday night?", options: ["Out dancing with friends", "Cozy night in alone", "A nice dinner somewhere new", "Whatever is most spontaneous"] },
    { template: "What kind of book would [name] never put down?", options: ["A gripping thriller", "A sweeping romance", "A mind-bending sci-fi", "A real-life memoir"] },
    { template: "What is [name]'s dream job if money didn't matter?", options: ["A traveling photographer", "Running a cozy little shop", "A full-time artist", "Something helping people directly"] },
    { template: "What food could [name] eat every single day?", options: ["Pizza in any form", "A perfect bowl of noodles", "Fresh bread and cheese", "Anything with lots of spice"] },
    { template: "What is [name]'s ideal weekend morning?", options: ["Sleeping in until noon", "Up early for a quiet coffee", "A big lazy brunch", "Straight into an activity"] },
    { template: "What kind of party does [name] actually enjoy?", options: ["A big loud celebration", "A small dinner with close friends", "A chill game night", "Any party with great food"] },
    { template: "What is [name]'s dream travel companion?", options: ["Their best friend", "A partner they adore", "A small tight group", "Themselves, solo and free"] },
    { template: "What would [name] splurge on without hesitation?", options: ["A once-in-a-lifetime trip", "The best version of their hobby gear", "An unforgettable meal", "Something for their home"] },
    { template: "What is [name]'s favorite kind of weather?", options: ["Warm and sunny", "Cool and cloudy", "A dramatic thunderstorm", "Crisp and snowy"] },
    { template: "What is [name]'s ideal way to celebrate a win?", options: ["A big night out", "A quiet treat to themselves", "Sharing it with loved ones", "Straight to the next goal"] },
    { template: "What kind of vacation would drain [name] the most?", options: ["A jam-packed sightseeing tour", "A do-nothing beach week", "A rugged camping trip", "A chaotic group getaway"] },
    { template: "What is [name]'s dream dinner guest?", options: ["A historical legend", "Their favorite artist", "A brilliant scientist", "A comedian to keep it fun"] },
    { template: "What is [name]'s favorite genre of movie?", options: ["Heart-pounding thrillers", "Laugh-out-loud comedies", "Sweeping dramas", "Escapist fantasy"] },
    { template: "What is [name]'s ideal amount of alone time?", options: ["As much as possible", "A little every day", "Only when they're drained", "Barely any, they crave people"] },
    { template: "What kind of gift does [name] love to receive?", options: ["Something deeply thoughtful", "An experience to share", "Something practical they'd use", "A total surprise"] },
    { template: "What is [name]'s go-to karaoke song?", options: ["A power ballad", "A crowd-pleasing throwback", "Something no one expects", "They'd rather not, thanks"] },
    { template: "What kind of restaurant does [name] pick nine times out of ten?", options: ["A cozy hole-in-the-wall", "Somewhere trendy and new", "A reliable old favorite", "Anywhere with big portions"] },
    { template: "What is [name]'s dream skill to master?", options: ["Playing an instrument", "Speaking a new language", "Cooking like a chef", "Something artistic"] },
    { template: "What is [name]'s ideal temperature setting?", options: ["Cool enough for a blanket", "Warm and toasty", "Fresh air, windows open", "As long as it's not hot"] },
    { template: "What would [name] choose for a dream car?", options: ["Something fast and flashy", "A rugged off-roader", "A cozy reliable classic", "They'd rather not drive at all"] },
    { template: "What is [name]'s favorite way to start the day?", options: ["Slow with coffee and calm", "Straight into a workout", "Hitting snooze repeatedly", "Getting out the door fast"] },
    { template: "What kind of hobby suits [name] best?", options: ["Something creative with their hands", "Something active and physical", "Something quiet and solo", "Something social and fun"] },
    { template: "What is [name]'s dream way to spend a birthday?", options: ["A big surprise celebration", "A quiet day doing what they love", "A trip somewhere special", "Low-key with a few people"] },
    { template: "What is [name]'s ideal night's sleep setup?", options: ["Pitch black and silent", "A fan or white noise", "Cool room, heavy blanket", "Falling asleep to a show"] },
    { template: "What kind of drink does [name] order at a bar?", options: ["A classic cocktail", "Just a cold beer", "Something fruity and fun", "A soda, they don't drink"] },
    { template: "What is [name]'s favorite kind of scenery?", options: ["The ocean at sunset", "Mountains and pine forests", "A buzzing city skyline", "Rolling green countryside"] },
    { template: "What would [name] pick as their signature dish to cook?", options: ["A big comforting pasta", "Something spicy and bold", "A perfect breakfast spread", "Dessert, always dessert"] },
    { template: "What is [name]'s dream way to spend a windfall?", options: ["Travel the world", "Pay off everything and relax", "Invest it wisely", "Treat everyone they love"] },
    { template: "What kind of clothing does [name] feel best in?", options: ["Cozy and casual", "Sharp and put-together", "Bold and expressive", "Whatever is comfiest"] },
    { template: "What is [name]'s ideal way to consume a story?", options: ["A good old-fashioned book", "Bingeing a series", "An immersive audiobook", "A film that says it all"] },
    { template: "What is [name]'s favorite kind of dessert?", options: ["Rich and chocolatey", "Light and fruity", "Warm and gooey", "Cold like ice cream"] },
    { template: "What is [name]'s dream place to live one day?", options: ["A vibrant big city", "A quiet coastal town", "Somewhere out in nature", "Wherever the people they love are"] },
    { template: "What is [name]'s go-to way to procrastinate pleasantly?", options: ["A long scroll session", "A snack and a show", "A spontaneous nap", "Reorganizing something"] },
    { template: "What kind of art would [name] hang on their wall?", options: ["Bold and colorful", "Minimal and clean", "Dark and moody", "Anything with a story"] },
    { template: "What is [name]'s ideal group size for a hangout?", options: ["Just one close friend", "A cozy handful", "The whole big crew", "Depends on their energy"] },
    { template: "What would [name] want as a superpower for daily life?", options: ["Never needing sleep", "Instant teleporting to work", "Perfect memory", "Always finding parking"] },
    { template: "What is [name]'s favorite comfort food?", options: ["Warm mac and cheese", "A hearty bowl of soup", "Fries with everything", "Whatever their mom made"] },
    { template: "What is [name]'s dream way to see the world?", options: ["A long slow train journey", "A cruise to many ports", "A spontaneous road trip", "One country at a time, deeply"] },
    { template: "What kind of morning drink does [name] rely on?", options: ["Strong coffee, no debate", "A soothing cup of tea", "A cold energy drink", "Just water, surprisingly"] },
    { template: "What is [name]'s ideal way to decorate a space?", options: ["Warm and full of memories", "Sleek and minimal", "Plants absolutely everywhere", "Cozy and a little cluttered"] },
    { template: "What is [name]'s favorite type of gathering?", options: ["A long lazy dinner party", "An outdoor barbecue", "A game or trivia night", "A spontaneous meetup"] },
    { template: "What would [name] choose for a perfect quiet evening?", options: ["Reading by soft light", "A long bath and music", "Journaling their thoughts", "Watching the sunset"] },
    { template: "What kind of shoes does [name] live in?", options: ["Comfy sneakers", "Sharp boots", "Sandals whenever possible", "Whatever slips on fastest"] },
    { template: "What is [name]'s dream creative outlet?", options: ["Writing stories", "Painting or drawing", "Making music", "Photography"] },
    { template: "What is [name]'s ideal way to eat a meal?", options: ["Slowly, savoring every bite", "Fast, they're always hungry", "In front of a screen", "Shared, family style"] },
    { template: "What is [name]'s favorite kind of nostalgia?", options: ["Music from their teens", "Old shows and movies", "Childhood snacks and treats", "Photos from years ago"] },
    { template: "What would [name] pick for a dream neighborhood?", options: ["Walkable with cafes everywhere", "Quiet and tucked away", "Right by the water", "Full of energy and nightlife"] },
    { template: "What is [name]'s go-to snack of choice?", options: ["Something salty and crunchy", "Something sweet", "A healthy handful of nuts", "Whatever is in reach"] },
    { template: "What is [name]'s ideal way to celebrate the new year?", options: ["A wild countdown party", "A quiet reset at home", "Somewhere new and exciting", "Asleep before midnight"] },
    { template: "What kind of workout does [name] actually enjoy?", options: ["A long peaceful walk", "Something intense and sweaty", "A team sport", "None, honestly"] },
    { template: "What is [name]'s favorite way to learn something new?", options: ["Diving in and figuring it out", "Watching someone else first", "Reading all about it", "Being taught step by step"] },
    { template: "What would [name] want their dream kitchen to have?", options: ["Endless counter space", "The fanciest coffee machine", "A huge pantry of snacks", "A window with a great view"] },
    { template: "What is [name]'s ideal way to spend a day off?", options: ["Completely unplanned", "Ticking off a fun to-do list", "Out exploring somewhere", "Recharging in total peace"] },
    { template: "What kind of scent does [name] love in a space?", options: ["Fresh and clean", "Warm and vanilla-like", "Earthy and woody", "Whatever smells like baking"] },
    { template: "What is [name]'s dream way to enjoy nature?", options: ["A hike to a big view", "Lounging by a lake", "A quiet forest walk", "Stargazing far from lights"] },
    { template: "What is [name]'s favorite kind of comedy?", options: ["Clever and witty", "Silly and slapstick", "Dark and dry", "Awkward and cringe"] },
    { template: "What would [name] pick for the ultimate cozy setup?", options: ["Blankets and a warm drink", "A crackling fire", "Rain sounds and a book", "Soft light and a good show"] },
    { template: "What is [name]'s ideal pace of life?", options: ["Slow and intentional", "Busy and full", "Somewhere in the middle", "It depends on the week"] },
    { template: "What kind of trip would [name] plan first?", options: ["A big bucket-list adventure", "A relaxing beach escape", "A cultural city break", "A cozy trip close to home"] },
    { template: "What is [name]'s go-to order at a coffee shop?", options: ["The same thing every time", "Whatever is seasonal", "The strongest thing available", "A sweet treat over the drink"] },
    { template: "What is [name]'s favorite way to keep memories?", options: ["Photos on their phone", "A physical journal", "Little keepsakes and objects", "Just in their head"] },
    { template: "What would [name] choose as a dream weekend activity?", options: ["A farmers market wander", "A day trip somewhere new", "A big project at home", "Doing nothing at all"] },
    { template: "What kind of music helps [name] focus?", options: ["Something with no lyrics", "Their favorite familiar album", "Total silence, actually", "Ambient background noise"] },
    { template: "What is [name]'s ideal way to eat pizza?", options: ["Fresh and hot from the box", "Cold the next morning", "Loaded with toppings", "Plain cheese, simple is best"] },
    { template: "What is [name]'s dream way to spend a long flight?", options: ["Movies back to back", "Sleeping the whole way", "Reading a great book", "Chatting or people-watching"] },
    { template: "What kind of celebration food does [name] crave?", options: ["A big slice of cake", "Endless finger foods", "A proper sit-down feast", "Whatever is being grilled"] },
    { template: "What is [name]'s favorite kind of quiet ritual?", options: ["Morning coffee alone", "An evening walk", "Reading before bed", "Tidying up their space"] },
    { template: "What would [name] pick for a dream backyard?", options: ["A hammock and shade", "A firepit for gatherings", "A garden to grow things", "A pool for hot days"] },
    { template: "What is [name]'s go-to way to relax on vacation?", options: ["Lounging by the water", "Exploring every corner", "Eating their way through it", "Napping without a schedule"] },
    { template: "What kind of night owl or early bird is [name]?", options: ["Total night owl", "Cheerful early bird", "Neither, just tired", "Whatever the day demands"] },
    { template: "What is [name]'s favorite kind of playlist?", options: ["One big shuffle of everything", "A carefully curated mood", "The same songs on repeat", "Whatever the algorithm picks"] },
    { template: "What would [name] want at their dream picnic?", options: ["A spread of little snacks", "A bottle of something nice", "A shady spot by a tree", "Good company above all"] },
    { template: "What is [name]'s ideal way to handle chores?", options: ["Blast music and power through", "Do a little each day", "Marathon it all at once", "Put it off as long as possible"] },
    { template: "What kind of screen time does [name] prefer?", options: ["A long immersive series", "Short funny clips", "A great film", "A cozy comfort rewatch"] },
    { template: "What is [name]'s dream way to enjoy a holiday?", options: ["Surrounded by family", "Somewhere far and new", "Quiet and low-key", "Full of food and tradition"] },
    { template: "What would [name] choose for a perfect Sunday?", options: ["A slow reset day", "One last fun adventure", "Prepping for the week ahead", "Sleeping and snacking"] },
    { template: "What is [name]'s favorite kind of small treat?", options: ["A fancy coffee", "A little something sweet", "A new book or gadget", "A midday nap"] },
    { template: "What kind of movie night does [name] love?", options: ["A themed marathon", "One perfect classic", "Whatever everyone agrees on", "A brand new release"] },
    { template: "What is [name]'s ideal way to travel light?", options: ["One bag, no checked luggage", "They always overpack anyway", "Buy what they need there", "A capsule of essentials"] },
    { template: "What would [name] want in a dream reading nook?", options: ["A big comfy chair", "A window with light", "Shelves stacked with books", "A soft blanket and lamp"] },
    { template: "What is [name]'s go-to way to feel fancy?", options: ["A nice meal out", "Getting fully dressed up", "A luxurious bath", "A quiet expensive coffee"] },
    { template: "What kind of weekend trip suits [name]?", options: ["A cozy cabin getaway", "A quick city adventure", "A beach or lake day", "Staying home and resting"] },
    { template: "What is [name]'s favorite kind of childhood snack, still?", options: ["Something crunchy and salty", "A sugary classic", "A specific cereal", "A nostalgic drink"] },
    { template: "What would [name] pick as the perfect ambiance?", options: ["Candlelight and calm", "Bright and energizing", "Cozy and dim", "Fresh air and daylight"] },
    { template: "What is [name]'s dream way to spend an unexpected free hour?", options: ["A quick nap", "A walk outside", "A guilty scroll", "One small productive win"] },
    { template: "What kind of themed night would [name] host?", options: ["A movie marathon night", "A cook-together dinner", "A game and trivia night", "A cozy craft or hobby night"] },
    { template: "What is [name]'s favorite way to cool off in summer?", options: ["A cold drink in the shade", "A dip in the water", "Cranking the fan indoors", "An ice cream run"] },
    { template: "What would [name] choose as a dream desk setup?", options: ["Minimal and tidy", "Cozy with plants and mugs", "Multiple screens and tech", "Whatever fits in a corner"] },
    { template: "What is [name]'s ideal kind of weekend morning drink?", options: ["A slow pour-over coffee", "A big glass of juice", "A comforting tea", "A smoothie on the go"] },
    { template: "What kind of small daily luxury does [name] love?", options: ["A great cup of coffee", "A few quiet minutes alone", "A nice-smelling candle", "A cozy pair of socks"] },
    { template: "What is [name]'s dream way to spend a snow day?", options: ["Warm inside with cocoa", "Out playing in it", "Catching up on shows", "Sleeping the whole day"] },
    { template: "What would [name] pick for a comfort meal on a bad day?", options: ["Warm noodles or soup", "Greasy takeout", "Buttery toast and tea", "Ice cream, straight up"] },
    { template: "What is [name]'s favorite way to end a great day?", options: ["A long satisfied stretch and bed", "Reflecting on the good parts", "One last treat", "Talking it over with someone"] },
    { template: "What kind of playlist does [name] make for a road trip?", options: ["Nonstop singalong hits", "A nostalgic throwback mix", "Something mellow for the miles", "Whatever plays on shuffle"] },
    { template: "What is [name]'s ideal way to explore a new city?", options: ["Wander with no plan", "Hit every famous spot", "Follow the food", "Find the quiet local corners"] },
    { template: "What would [name] want most in a dream bedroom?", options: ["The comfiest possible bed", "Blackout curtains", "A cozy reading corner", "A view out the window"] },
    { template: "What is [name]'s go-to feel-good activity?", options: ["Cranking up music and dancing", "A long walk outside", "Calling a good friend", "A cozy show and snacks"] },
    { template: "What kind of dessert would [name] never share?", options: ["The last bite of cake", "Their favorite ice cream", "A warm fresh cookie", "Anything with chocolate"] },
    { template: "What is [name]'s dream way to spend money on themselves?", options: ["An experience to remember", "A cozy home upgrade", "Their favorite hobby", "A little bit of everything"] },
    { template: "What would [name] choose as the perfect background sound?", options: ["Gentle rain", "A crackling fire", "Ocean waves", "Total silence"] },
    { template: "What is [name]'s ideal kind of weekend outing?", options: ["A market or fair", "A hike in nature", "A museum or gallery", "A cozy cafe crawl"] },
    { template: "What kind of comfort show does [name] rewatch endlessly?", options: ["A cozy sitcom", "A childhood cartoon", "A cooking or baking show", "A familiar drama"] },
    { template: "What is [name]'s favorite kind of spontaneous plan?", options: ["A last-minute road trip", "An impromptu dinner out", "A surprise movie", "Anything, as long as it's easy"] },
    { template: "What would [name] want for the perfect lazy breakfast?", options: ["Pancakes and syrup", "Eggs and toast in bed", "Just coffee and a pastry", "Leftovers, honestly"] },
    { template: "What is [name]'s dream way to display their personality at home?", options: ["Photos and memories everywhere", "Art on every wall", "Books stacked in every room", "Plants filling every corner"] },
    { template: "What kind of evening walk does [name] love?", options: ["A quiet neighborhood loop", "A busy city stroll", "A path by the water", "A trail into nature"] },
    { template: "What is [name]'s ideal comfort drink at night?", options: ["A warm cup of tea", "Hot chocolate", "A glass of wine", "Just water, they're boring"] },
    { template: "What would [name] pick as a dream creative project?", options: ["Writing a whole book", "Painting a big canvas", "Building something with their hands", "Making a short film"] },
    { template: "What is [name]'s favorite kind of weekend indulgence?", options: ["Sleeping in shamelessly", "A big brunch out", "A movie marathon", "A little shopping trip"] },
    { template: "What kind of atmosphere does [name] work best in?", options: ["A quiet library hush", "A buzzing coffee shop", "Total silence at home", "Music blasting"] },
    { template: "What is [name]'s dream way to enjoy the ocean?", options: ["Swimming in the waves", "Lounging on the sand", "Watching from the shore", "A boat out on the water"] },
    { template: "What would [name] want in a perfect care package?", options: ["Their favorite snacks", "Something cozy to wear", "A heartfelt note", "A little bit of everything"] },
    { template: "What is [name]'s ideal way to close out the weekend?", options: ["A calm reset routine", "One last adventure", "Meal prep and planning", "Collapsing into bed early"] },
    { template: "What kind of collection would [name] love to build?", options: ["Books they adore", "Records or music", "Little travel souvenirs", "Art or prints"] },
    { template: "What is [name]'s go-to feel-cozy accessory?", options: ["A giant soft blanket", "Warm fuzzy socks", "An oversized hoodie", "A favorite mug"] },
    { template: "What would [name] pick for a dream celebration meal?", options: ["A steakhouse dinner", "A sushi feast", "Endless comfort food", "A homemade family spread"] },
    { template: "What is [name]'s favorite kind of quiet Sunday activity?", options: ["Reading in the sun", "A slow cooking project", "Tidying and resetting", "A long aimless nap"] },
    { template: "What kind of getaway recharges [name] the most?", options: ["A silent nature retreat", "A lively city trip", "A beach with zero plans", "A cozy stay somewhere new"] },
    { template: "What is [name]'s dream way to enjoy the morning light?", options: ["Coffee by a big window", "A walk as the sun rises", "Still asleep, honestly", "Journaling in the quiet"] },
    { template: "What would [name] choose as a comfort rewatch on a sick day?", options: ["A gentle familiar sitcom", "A childhood favorite film", "A cozy period drama", "Nothing, just sleep"] },
    { template: "What is [name]'s ideal kind of snowy evening?", options: ["Watching it fall with cocoa", "A movie under blankets", "A cozy early night", "Out in the fresh snow"] },
    { template: "What kind of playlist gets [name] through a workout?", options: ["High-energy hype tracks", "A steady motivating beat", "Their favorite old bangers", "A podcast instead"] },
    { template: "What is [name]'s favorite way to treat a friend?", options: ["Cooking them a meal", "Buying the coffee", "A thoughtful little gift", "Just showing up for them"] },
    { template: "What would [name] want most on a lazy holiday morning?", options: ["No alarm at all", "A warm slow breakfast", "Cozy time with loved ones", "The house to themselves"] },
    { template: "What is [name]'s ideal way to enjoy a good book?", options: ["In one long sitting", "A chapter each night", "Outside in the sun", "Curled up in bed"] },
    { template: "What kind of night does [name] secretly prefer?", options: ["A quiet one at home", "A big memorable night out", "Something small with close friends", "Whatever needs zero planning"] },
    { template: "What is [name]'s dream comfort combo for a movie?", options: ["Popcorn and a soft blanket", "Snacks piled high", "A warm drink and dim lights", "Someone to watch it with"] },
    { template: "What would [name] pick as the perfect little escape?", options: ["A quiet cafe corner", "A walk in the park", "A drive with music", "A locked door and a nap"] },
    { template: "What is [name]'s favorite kind of celebration?", options: ["A surprise thrown for them", "A calm intimate gathering", "A big lively bash", "Just being remembered at all"] },
    { template: "What kind of morning routine does [name] dream of?", options: ["Slow, calm, and unhurried", "Efficient and productive", "A workout to start strong", "Rolling out the door on time"] },
    { template: "What is [name]'s go-to comfort activity when sad?", options: ["A familiar comfort show", "A long hot shower", "Talking to someone close", "Sleeping it off"] },
    { template: "What would [name] want in a dream reading day?", options: ["Rain outside, tea inside", "A whole series to devour", "A cozy blanket fort", "No interruptions at all"] },
    { template: "What is [name]'s ideal way to enjoy dessert?", options: ["Slowly, savoring every bite", "Shared off someone's plate", "A giant portion all to themselves", "Right before the meal"] },
    { template: "What kind of small purchase makes [name] happiest?", options: ["A new book or notebook", "A fancy snack", "A cozy home item", "A little tech gadget"] },
    { template: "What is [name]'s dream way to spend a quiet afternoon?", options: ["A nap in the sun", "A project they love", "A slow cup of coffee and a book", "A wander with no destination"] },
    { template: "What would [name] choose for a comfort playlist mood?", options: ["Warm nostalgic classics", "Soft rainy-day songs", "Upbeat feel-good tunes", "Slow acoustic calm"] },
    { template: "What is [name]'s favorite kind of weekend reset?", options: ["A deep clean of their space", "A long relaxing bath", "A day fully unplugged", "Meal prep and organizing"] },
    { template: "What kind of dream trip would [name] save up for?", options: ["A far-off bucket-list place", "A luxury resort escape", "A long slow world tour", "A cozy return to a favorite spot"] },
    { template: "What is [name]'s ideal way to enjoy a warm drink?", options: ["Slowly by a window", "On a cold walk outside", "In bed under blankets", "While reading something good"] },
    { template: "What would [name] pick as their comfort genre of music?", options: ["Mellow acoustic", "Nostalgic pop", "Smooth jazz or soul", "Soft indie"] },
    { template: "What is [name]'s dream kind of low-key celebration?", options: ["A cozy dinner at home", "A small toast with friends", "A quiet day doing their favorite thing", "A relaxed picnic outside"] },
    { template: "What kind of view would [name] want from their window?", options: ["The ocean stretching out", "A green forest", "A glittering city", "A peaceful garden"] },
    { template: "What is [name]'s favorite way to make a house feel like home?", options: ["Warm lighting everywhere", "Photos of people they love", "A kitchen that smells good", "Soft textures and blankets"] },
    { template: "What would [name] choose for the perfect cozy drink and snack?", options: ["Coffee and a pastry", "Tea and biscuits", "Cocoa and cookies", "Wine and cheese"] },
    { template: "What is [name]'s ideal way to spend a slow evening?", options: ["A film and a full couch", "A hobby they love", "A long relaxed dinner", "Early to bed, guilt-free"] },
    { template: "What kind of surprise would delight [name] most?", options: ["A thoughtful little gift", "A spontaneous trip", "A favorite meal made for them", "A visit from someone they miss"] },
    { template: "What is [name]'s go-to way to feel refreshed?", options: ["A cold splash of water", "A quick brisk walk", "A power nap", "A change of scenery"] },
    { template: "What would [name] want most for a dream staycation?", options: ["No plans whatsoever", "A cozy home makeover", "A marathon of shows", "Ordering all their favorite food"] },
    { template: "What is [name]'s favorite kind of comfort noise?", options: ["Rain on the window", "A distant hum of a fan", "The kitchen while someone cooks", "Total quiet"] },
    { template: "What kind of little ritual grounds [name]?", options: ["Their morning coffee", "A tidy-up before bed", "A daily walk", "A few quiet minutes alone"] },
    { template: "What is [name]'s dream way to enjoy a long weekend?", options: ["A getaway somewhere new", "Total rest at home", "Knocking out a fun project", "A mix of adventure and rest"] },
    { template: "What would [name] pick as a perfect solo date?", options: ["A movie alone", "A quiet cafe and a book", "A long walk with music", "A treat-yourself shopping trip"] },
    { template: "What is [name]'s favorite kind of weather to sleep in?", options: ["A steady rainstorm", "A cool crisp night", "A cozy snowfall", "A warm breeze through the window"] },
    { template: "What kind of comfort meal does [name] crave when homesick?", options: ["A dish from their childhood", "Something their family made", "A local favorite from home", "Anything warm and familiar"] },
    { template: "What is [name]'s ideal way to wind down before sleep?", options: ["Reading a few pages", "A calming show", "A little stretching", "Scrolling until their eyes close"] },
    { template: "What would [name] choose as the ultimate cozy drink season?", options: ["Autumn spiced everything", "Winter hot cocoa", "Iced coffee summer", "Fresh spring teas"] },
    { template: "What is [name]'s dream kind of little getaway from routine?", options: ["A day trip to the coast", "A quiet forest walk", "A new neighborhood to explore", "A cozy afternoon at a cafe"] },
    { template: "What kind of movie always makes [name]'s night?", options: ["A feel-good comedy", "An epic adventure", "A cozy romance", "A gripping mystery"] },
    { template: "What is [name]'s favorite way to savor a day off?", options: ["Doing absolutely nothing", "One small joyful outing", "Catching up on rest", "A treat they never make time for"] },
    { template: "What would [name] want for a dream cozy corner?", options: ["A window seat with cushions", "A big chair by a lamp", "A blanket nest on the floor", "A hammock indoors"] },
    { template: "What is [name]'s ideal way to spend a gift card?", options: ["Save it forever, never use it", "Spend it the same day", "On something they'd never buy themselves", "Split it into little treats"] },
    { template: "What kind of weekend breakfast does [name] dream about?", options: ["A stack of fluffy pancakes", "A big greasy plate of everything", "Fresh pastries and coffee", "Something light and healthy"] },
    { template: "What is [name]'s favorite way to spend a quiet hour outdoors?", options: ["Reading on a bench", "A slow aimless stroll", "Sitting by the water", "People-watching at a cafe"] },
    { template: "What would [name] choose for a dream music setup at home?", options: ["A record player and vinyl", "Speakers in every room", "Just good headphones", "A cozy corner and a guitar"] },
    { template: "What is [name]'s go-to way to treat themselves after a long week?", options: ["A big comforting meal", "A long lazy lie-in", "A little shopping spree", "A full pampering evening"] },
    { template: "What kind of scenery would [name] want on a long drive?", options: ["Endless open coastline", "Winding mountain roads", "Golden countryside fields", "A glittering skyline at night"] },
    { template: "What is [name]'s dream way to enjoy a fresh cup of coffee?", options: ["On a quiet porch at sunrise", "Curled up with a book", "On a brisk morning walk", "Slowly, before anyone else is up"] },
    { template: "What would [name] pick as the perfect comfort-food night?", options: ["Homemade pizza from scratch", "A big pot of pasta", "Takeout and a movie", "Breakfast for dinner"] },
  ],
  hypothetical: [
    { template: "What would [name] do if they won one million dollars?", options: ["Invest it all and live off the returns", "Quit their job and travel the world", "Buy a dream house and set up family", "Start a business they've been dreaming about"] },
    { template: "If [name] could live anywhere in the world, where?", options: ["A warm coastal city with great food", "A major global city like London or New York", "A small town in the countryside somewhere peaceful", "A culturally rich city like Istanbul or Marrakech"] },
    { template: "What would [name] do if they found out their partner was cheating?", options: ["Confront them immediately and end it", "Gather evidence first, then confront calmly", "Try to understand why before deciding anything", "Leave without saying a word and ghost them"] },
    { template: "If [name] could swap lives with someone for a month, who?", options: ["A famous musician or artist", "A world leader or CEO", "Someone living a completely simple life off the grid", "Their best friend, to see life from their eyes"] },
    { template: "What would [name] do during a zombie apocalypse?", options: ["Lead a group and build a fortress", "Go solo and trust nobody", "Find the scientists and help find a cure", "They'd honestly not make it past day one"] },
    { template: "If [name] discovered they had 24 hours left to live, what would they do?", options: ["Spend every second with family and loved ones", "Do something wild they've always been afraid to do", "Write letters and record messages for people they love", "Eat their favorite meal and be at peace alone"] },
    { template: "What would [name] do if they could be invisible for a day?", options: ["Spy on people to hear what they really think of them", "Rob a bank or do something they'd never get away with", "Go somewhere restricted like the White House or Area 51", "Just enjoy the freedom of being completely unnoticed"] },
    { template: "If [name] had to choose between fame and wealth, which?", options: ["Fame, they want to be known and remembered", "Wealth, money buys freedom and privacy", "Neither, they'd choose peace and love", "Fame first, then they'd leverage it for wealth"] },
    { template: "What would [name] do if they could time travel once?", options: ["Go to the future to see how their life turns out", "Go back and fix one major regret", "Witness a major historical event in person", "Go back and give their younger self advice"] },
    { template: "If [name] had to survive alone on a deserted island, what one item would they bring?", options: ["A knife or multi-tool for survival", "A satellite phone to call for rescue eventually", "A journal to document everything", "A lighter, because fire solves most problems"] },
    { template: "What would [name] do if they woke up 10 years in the past?", options: ["Make all the right financial moves", "Find their current friends and loved ones earlier", "Avoid specific mistakes and relationships", "Try to enjoy being young again without changing anything"] },
    { template: "If [name] could read minds for a day, whose mind would they read?", options: ["Their crush or partner", "Their boss or a mentor", "Their best friend", "A world leader or powerful figure"] },
    { template: "What would [name] do if they found a briefcase with one million in cash?", options: ["Keep it, no questions asked", "Try to return it to the rightful owner", "Keep some and donate the rest", "Turn it in to the police and hope for a reward"] },
    { template: "If [name] had to live in a TV show universe, which?", options: ["A sitcom where nothing bad ever really happens", "A fantasy or sci-fi world with adventure", "A drama where everything is high-stakes and intense", "A reality show where their life is the content"] },
    { template: "What would [name] do if they could change one law?", options: ["Make education completely free at every level", "Legalize something currently restricted", "Create a universal basic income for everyone", "Change a law that personally affects their life"] },
    { template: "If [name] had to give up one sense permanently, which?", options: ["Smell, they could live without it", "Taste, for the greater good of healthy eating", "Touch, it would be hard but survivable", "They'd never choose, they'd rather face any other consequence"] },
    { template: "What would [name] do if offered a pill that stops aging at their current age?", options: ["Take it immediately, staying young forever", "Think about it carefully for years before deciding", "Refuse it, aging is part of life", "Only take it if someone they love takes it too"] },
    { template: "If [name] could master any extreme sport overnight, which?", options: ["Surfing the biggest waves in the world", "Free solo rock climbing", "Skydiving and base jumping", "Formula One racing"] },
    { template: "What would [name] choose: always know the truth or always get away with lies?", options: ["Always know the truth, knowledge is power", "Always get away with lies, useful but dangerous", "The truth, even when it hurts", "Lies, because some truths are better left hidden"] },
    { template: "If [name] could erase one memory, what kind would it be?", options: ["An embarrassing moment that still haunts them", "A painful breakup or rejection", "Something they saw or witnessed that scarred them", "They wouldn't erase anything, memories make them who they are"] },
    { template: "What would [name] do with a pause button for time?", options: ["Sleep as long as they want without losing time", "Cheat on every exam and deadline forever", "Freeze awkward moments and think of the perfect response", "Travel the world while time stands still"] },
    { template: "If [name] had to commit to one hobby for the rest of their life, what?", options: ["A musical instrument they'd master", "A physical sport or martial art", "Cooking and becoming a true chef", "Writing or some form of creative expression"] },
    { template: "What would [name] do if they found out we live in a simulation?", options: ["Try to find the cheat codes immediately", "Freak out and have an existential crisis", "Live exactly the same way, doesn't change anything", "Start testing the boundaries of reality"] },
    { template: "If [name] could only eat one meal for every meal forever, what?", options: ["Breakfast food, versatile and comforting", "A fully loaded burrito or wrap", "Rice with a rotating curry or stew", "Pasta in any form, it never gets old"] },
    { template: "What would [name] do if they could talk to animals?", options: ["Have deep conversations with their pet", "Become the world's greatest veterinarian", "Start a YouTube channel translating animal thoughts", "Ask a random pigeon what it has seen in this city"] },
    { template: "If [name] had to pick a career from a completely different field, what?", options: ["Something in the arts, music, writing, or film", "Something in science, research, or medicine", "Something in sports, athletics, or coaching", "Something in food, hospitality, or travel"] },
    { template: "What would [name] do if they found their doppelganger?", options: ["Become best friends immediately", "Be deeply unsettled and avoid them", "Use them for an elaborate scheme or prank", "Take a photo and post it everywhere"] },
    { template: "If [name] could bring back one extinct species, which?", options: ["The dodo, because they were harmless and cute", "A woolly mammoth, for the spectacle", "The T-rex, just to see it once from a safe distance", "The Tasmanian tiger, recently extinct and deserving a second chance"] },
    { template: "What would [name] do if they were president for a day?", options: ["Implement a policy they've always wanted", "Read all the classified files and secrets", "Pardon someone or fix a specific injustice", "Throw a party at the presidential residence"] },
    { template: "If [name] could know the answer to one question about the universe, what?", options: ["Is there life on other planets?", "What happens after death?", "Are we in a simulation?", "What is the full truth about human consciousness?"] },
    { template: "What would [name] do if they received a mystery package with no return address?", options: ["Open it immediately, curiosity always wins", "Inspect it carefully then open it", "Have someone else open it while they watch from a distance", "Not open it at all, too suspicious"] },
    { template: "If [name] could relive one year of their life, which?", options: ["A carefree childhood year", "Their best year of friendships and social life", "A year where everything was going right career-wise", "The most recent year, to fix recent mistakes"] },
    { template: "What would [name] do if the internet went down permanently?", options: ["Thrive, they'd finally read all those books", "Struggle hard, they're extremely online", "Become a community organizer in the new world", "Honestly have no idea how they'd survive"] },
    { template: "If [name] could have any fictional gadget, which?", options: ["A time-turner from Harry Potter", "A lightsaber from Star Wars", "Iron Man's suit", "A teleportation device from Star Trek"] },
    { template: "What would [name] do if they found out they had a secret sibling?", options: ["Track them down immediately and meet them", "Be shocked but curious and proceed carefully", "Be upset that their family kept a secret", "Welcome them with open arms, more family is great"] },
    { template: "If [name] could live as any animal for a week, which?", options: ["A bird, to experience true flight", "A dolphin, to explore the ocean", "A house cat, to do nothing and be loved for it", "A wolf, to run wild in a pack"] },
    { template: "What would [name] do if they suddenly became famous overnight?", options: ["Embrace it and build a brand", "Hide from public attention immediately", "Use the platform to promote something meaningful", "Enjoy it briefly then try to fade back to normal life"] },
    { template: "If [name] could uninvent one thing, what would it be?", options: ["Social media, the world was better without it", "Nuclear weapons, for obvious reasons", "Alarm clocks, let people sleep naturally", "Fast fashion, for the planet's sake"] },
    { template: "What would [name] do if they could clone themselves?", options: ["Send the clone to work while they relax", "Use the clone for errands and chores", "Compete with the clone to see who's better", "Be terrified and immediately shut it down"] },
    { template: "If [name] could guarantee one thing for their future, what?", options: ["Financial security for life", "A deeply fulfilling relationship", "Perfect health into old age", "A career they're truly passionate about"] },
    { template: "What would [name] do with a machine that shows alternate life paths?", options: ["Watch every major decision's alternate outcome", "Only look at one specific moment they've always wondered about", "Refuse to look, the present is what matters", "Watch it once then destroy the machine"] },
    { template: "If [name] could spend a day with any version of themselves, which?", options: ["Themselves at 8 years old, to remember innocence", "Themselves at 80, to get life advice", "Themselves in a parallel universe", "Themselves one year from now, to see what's coming"] },
    { template: "What would [name] do if gravity turned off for 10 minutes?", options: ["Panic and hold onto something", "Enjoy it and try to fly around", "Grab their phone and record everything", "Try to rescue people and pets floating away"] },
    { template: "If [name] could add 3 hours to each day that only they experience, what would they do?", options: ["Sleep, finally get enough rest", "Work on a passion project no one knows about", "Exercise and take care of themselves properly", "Read, learn, and develop new skills"] },
    { template: "What would [name] choose: perfect memory or ability to forget anything on command?", options: ["Perfect memory, never lose a moment", "Forget on command, some things are worth erasing", "Perfect memory, it would make them unstoppable", "Forget on command, peace of mind is priceless"] },
    { template: "If [name] woke up as the opposite gender for a day, what would they do first?", options: ["Look in the mirror for a very long time", "Call their friends and see their reaction", "Experience daily life from the other side", "Go out and see how differently they're treated"] },
    { template: "What would [name] do if they could speak every language in the world?", options: ["Travel everywhere and talk to everyone", "Become a diplomat or international negotiator", "Eavesdrop on every conversation around them", "Use it to get a ridiculously high-paying job"] },
    { template: "If [name] could redesign the school system, what would they change?", options: ["Make it about practical life skills instead", "Let students choose their own curriculum", "Remove grades and focus on project-based learning", "Make it shorter, four days a week maximum"] },
    { template: "What would [name] do if they were the last person on Earth?", options: ["Explore the world's greatest buildings and places alone", "Cry, then figure out survival basics", "Write everything down in case someone finds it later", "Find the best house, stock it up, and wait"] },
    { template: "If [name] could abolish one social norm, which?", options: ["The pressure to always be productive", "Small talk with people you don't care about", "The expectation to have kids", "Working 40+ hours a week as the default"] },
    { template: "What would [name] do if offered a one-way ticket to Mars?", options: ["Go immediately, ultimate adventure", "Refuse, Earth is home no matter what", "Consider it seriously if they could bring one person", "Only if the colony had good internet and coffee"] },
    { template: "If [name] could implant one skill directly into their brain, which?", options: ["Coding and software development", "Playing every musical instrument", "Fluency in ten languages", "Advanced mathematics and physics"] },
    { template: "What would [name] do if they learned they were royalty?", options: ["Accept the title and live lavishly", "Use the power and wealth to do good", "Renounce it and keep their normal life", "Move to the country and become a media sensation"] },
    { template: "If [name] could have a conversation with their future child, what would they ask?", options: ["Are you happy? Did I do a good job?", "What do you wish I had done differently?", "What's the world like when you're growing up?", "Tell me everything about who you are"] },
    { template: "What would [name] do if they had a magic 'undo' button for real life?", options: ["Use it constantly for every small mistake", "Save it for only the most devastating moment", "Never use it, mistakes are part of growth", "Use it to undo every argument or hurtful thing they've said"] },
    { template: "If [name] could pick their own cause of death, what would it be?", options: ["Peacefully in their sleep at a very old age", "Doing something thrilling and dying happy", "Saving someone else's life heroically", "They'd pick immortality instead"] },
    { template: "What would [name] do if they found a door to a parallel universe?", options: ["Walk through it without hesitation", "Observe first, go through later", "Tell someone about it before going in", "Lock it and walk away, some doors should stay closed"] },
    { template: "If [name] had to pick one age to stay forever, which?", options: ["25, young, healthy, and full of potential", "30, old enough to know things, young enough to enjoy them", "18, before adult responsibilities hit", "40, established, confident, and in their prime"] },
    { template: "What would [name] do if they could become an expert in any field overnight?", options: ["Medicine, to save lives and understand the body", "Law, to navigate any situation and protect people", "Finance, to build wealth and never worry about money", "Art or music, to express themselves at the highest level"] },
    { template: "If [name] could make one phone call to anyone in history, who?", options: ["A grandparent or ancestor they never met", "A historical figure they admire", "Their future self, 30 years from now", "Someone famous who died young, to warn them"] },
    { template: "If [name] found a genie's lamp, what's their first wish?", options: ["Unlimited money, obviously", "Infinite wishes, gaming the system", "Health and long life for loved ones", "The power to make anyone happy"] },
    { template: "Would [name] rather be able to fly or breathe underwater?", options: ["Fly, the ultimate freedom", "Breathe underwater, explore the deep", "Fly, they'd never pay for travel again", "Underwater, fewer people down there"] },
    { template: "Would [name] rather see the future or change the past?", options: ["See the future, to prepare", "Change the past, to fix regrets", "See the future, but never act on it", "Neither, they'd rather not know"] },
    { template: "If [name] could control one element, which?", options: ["Fire, for the drama", "Water, calm and powerful", "Wind, for the freedom", "Earth, steady and grounding"] },
    { template: "If [name] could have any animal's ability, which?", options: ["A bird's flight", "A cat's nine lives", "A cheetah's speed", "A chameleon's blend-in camouflage"] },
    { template: "Would [name] rather never sleep again or never eat again?", options: ["Never sleep, so much free time", "Never eat, no more food costs", "Never sleep, but they'd miss dreaming", "Neither, both sound like torture"] },
    { template: "If [name] could live inside any video game, which kind?", options: ["An open-world adventure", "A cozy life-simulation game", "A high-stakes battle royale", "A puzzle world with no danger"] },
    { template: "If [name] had a button that paid them but shortened a stranger's day by an hour, would they press it?", options: ["Never, that's not worth it", "Once, out of pure curiosity", "Only if they really needed the money", "Repeatedly, and feel a little guilty"] },
    { template: "Would [name] rather know the date of their death or never know?", options: ["Know it, to plan their life fully", "Never know, ignorance is bliss", "Know the year but not the day", "They'd want to know but regret asking"] },
    { template: "If [name] could reset one relationship in their life, which?", options: ["A friendship that fell apart", "A family relationship", "A romantic one that ended badly", "None, they'd leave the past alone"] },
    { template: "If [name] could instantly master any language, which?", options: ["Something practical and widely spoken", "A language tied to their heritage", "The hardest one, just to say they did", "Every language at once, cheating a little"] },
    { template: "Would [name] rather be immortal but alone, or mortal with loved ones?", options: ["Mortal, love is the point", "Immortal, they'd find new people", "Mortal, immortality sounds exhausting", "Immortal, but they'd hate outliving everyone"] },
    { template: "If [name] could control the weather, what would they make it do?", options: ["Endless sunny days", "Rain whenever they want to stay in", "Snow for a permanent winter wonderland", "Perfect weather for everyone, always"] },
    { template: "If [name] could freeze time for everyone but themselves, what would they do first?", options: ["Catch up on sleep and rest", "Pull off harmless pranks", "Get all their work done instantly", "Just enjoy the eerie silence"] },
    { template: "Would [name] rather have unlimited money or unlimited time?", options: ["Money, freedom to do anything", "Time, the one thing you can't buy", "Money, they'd buy back their time", "Time, money comes and goes"] },
    { template: "If [name] could relive their childhood with their adult mind, would they?", options: ["Yes, do everything differently", "No, let the past stay the past", "Only to appreciate it more this time", "Yes, but it would break their heart"] },
    { template: "If [name] could shrink to ant size or grow to giant size, which?", options: ["Tiny, to sneak anywhere", "Giant, to see everything", "Tiny, the world would be an adventure", "Neither, that sounds terrifying"] },
    { template: "If [name] could have one superpower for just one hour, what would they use it for?", options: ["Fly around and take it all in", "Read everyone's minds nearby", "Freeze time and rest", "Teleport somewhere far away"] },
    { template: "If [name] could keep only one memory forever, which kind would it be?", options: ["A moment with family", "Their proudest achievement", "A perfect day they never forgot", "A first with someone they loved"] },
    { template: "If [name] could swap talents with anyone for a day, who?", options: ["A world-class musician", "A star athlete", "A brilliant chef", "A charismatic performer"] },
    { template: "If [name] could rule the world for one year, what would they change first?", options: ["End poverty and inequality", "Fix the environment", "Reform education everywhere", "Mandate a four-day work week"] },
    { template: "Would [name] rather be able to teleport but only to random places, or fly slowly?", options: ["Random teleport, the adventure of it", "Fly slowly, at least they'd control it", "Random teleport, chaos is fun", "Fly, they hate uncertainty"] },
    { template: "If [name] could remove one human need forever, which?", options: ["The need for sleep", "The need to eat", "The need for money", "The need for approval from others"] },
    { template: "If [name] had a remote that controlled real life, what button would they use most?", options: ["Fast-forward through boring parts", "Pause to catch their breath", "Rewind to redo mistakes", "Mute certain people"] },
    { template: "If [name] discovered they could talk to their pet for one day, what would they ask?", options: ["'Do you actually love me?'", "'What do you do when I'm gone?'", "'Why do you do that weird thing?'", "'Are you happy here with me?'"] },
    { template: "If [name] could witness one moment in their own future, which?", options: ["Their wedding day", "Where they'll be in ten years", "Their biggest future success", "Nothing, spoilers ruin everything"] },
    { template: "Would [name] rather be the funniest or the smartest person in every room?", options: ["Funniest, they'd own every room", "Smartest, knowledge is power", "Funniest, but secretly want smartest", "Smartest, but they'd hide it"] },
    { template: "If [name] could delete one invention from history, which?", options: ["Social media", "The alarm clock", "Nuclear weapons", "Fast fashion"] },
    { template: "If [name] found a note with tomorrow's news, what would they check first?", options: ["Lottery numbers, immediately", "Whether anything bad happens to loved ones", "Big world events", "They'd be too scared to read it"] },
    { template: "If [name] could instantly be an expert at one job, which?", options: ["Doctor or surgeon", "Pilot", "Chef", "Lawyer"] },
    { template: "Would [name] rather live 100 years in the past or 100 years in the future?", options: ["The future, to see what's coming", "The past, simpler times", "The future, they're curious", "Neither, they like right now"] },
    { template: "If [name] could make one food have zero consequences to eat forever, which?", options: ["Pizza, endlessly", "Dessert of every kind", "Fast food, guilt-free", "Their one specific weakness"] },
    { template: "If [name] woke up as the most powerful person in the world, what would they do first?", options: ["Fix one huge global problem", "Make sure their people are set for life", "Lay low and not abuse it", "Panic about the responsibility"] },
    { template: "If [name] could have dinner with their future self, what would they want to hear?", options: ["'You made the right choices'", "'Stop worrying, it works out'", "'Here's what to avoid'", "'Enjoy it, it goes fast'"] },
    { template: "If [name] could instantly relocate anywhere for free right now, where would they go?", options: ["A beach somewhere warm", "A big exciting city", "Back home to family", "Somewhere completely new and random"] },
    { template: "Would [name] rather have a rewind button or a pause button for life?", options: ["Rewind, to fix every misstep", "Pause, to rest and think", "Rewind, but they'd overuse it", "Pause, life moves too fast"] },
    { template: "If [name] could be guaranteed success in one area of life, which?", options: ["Career and ambition", "Love and relationships", "Health and longevity", "Wealth and security"] },
    { template: "If [name] found out magic was real, what would they learn first?", options: ["Teleportation, to skip commutes", "Healing, to help people", "Mind reading, to know the truth", "Conjuring money out of thin air"] },
    { template: "If [name] could send one message to the entire world at once, what would it say?", options: ["Something hopeful and uplifting", "A warning about the future", "A joke to make everyone laugh", "Just 'be kind to each other'"] },
    { template: "If [name] could trade lives with a celebrity for a week, what would they do with the fame?", options: ["Live it up to the fullest", "Use the platform for good", "Try to stay out of the spotlight", "Cause a little harmless chaos"] },
    { template: "Would [name] rather never feel physical pain or never feel sadness?", options: ["Never feel sadness, emotions hurt more", "Never feel pain, that's practical", "Never feel sadness, but they'd miss the depth", "Neither, both are part of being human"] },
    { template: "If [name] could instantly finish any project in the world, which?", options: ["A cure for a major disease", "A book or piece of art of their own", "A giant infrastructure fix", "Their own long-abandoned side project"] },
    { template: "If [name] had a real crystal ball for one question, what would they ask?", options: ["'Will I be happy?'", "'Who should I trust?'", "'Am I on the right path?'", "'How does it all end?'"] },
    { template: "If [name] could relive one vacation, which kind would it be?", options: ["A beach paradise trip", "An unforgettable city adventure", "A trip with people no longer around", "The first big trip they ever took"] },
    { template: "If [name] could have any mythical creature as a companion, which?", options: ["A dragon", "A phoenix", "A unicorn", "A tiny, mischievous fairy"] },
    { template: "If [name] could instantly heal one thing in the world, what would it be?", options: ["A specific person's illness", "The planet's environment", "Division between people", "Their own struggles first"] },
    { template: "Would [name] rather always be slightly overdressed or slightly underdressed?", options: ["Overdressed, better safe than sorry", "Underdressed, comfort wins", "Overdressed, they love an excuse to dress up", "Underdressed, less pressure that way"] },
    { template: "If [name] could bottle one feeling to relive forever, which?", options: ["The rush of falling in love", "The calm after finishing something big", "The joy of a perfect day with friends", "The peace of a quiet morning"] },
    { template: "If [name] could give everyone in the world one gift, what would it be?", options: ["A day of pure rest", "Enough money to never worry", "The ability to understand each other", "A single moment of genuine joy"] },
    { template: "If [name] could turn any hobby into their full-time job, which?", options: ["Gaming or streaming", "Traveling and blogging", "Cooking or baking", "Art, music, or writing"] },
    { template: "If [name] had to give up their phone or their car for a year, which?", options: ["Give up the car, phone is life", "Give up the phone, freedom of the road", "The car, they'd figure out transit", "The phone, but it would be painful"] },
    { template: "If [name] could master a fear instantly, which one would they conquer?", options: ["Public speaking", "Heights", "Failure and rejection", "Being truly vulnerable"] },
    { template: "If [name] could witness any historical event live, which?", options: ["A moon landing or space milestone", "A legendary concert or performance", "A pivotal moment in history", "The distant past, ancient civilizations"] },
    { template: "If [name] could give their younger self one item, what would it be?", options: ["A note with one piece of advice", "Money to invest early", "A book that changed them", "A hug, honestly"] },
    { template: "If [name] could instantly get anywhere in a city with no traffic, what would they do more of?", options: ["See friends way more often", "Explore new spots constantly", "Say yes to more spontaneous plans", "Sleep in and stress less"] },
    { template: "Would [name] rather be famous for their talent or anonymous but wealthy?", options: ["Famous, recognition means everything", "Anonymous and rich, peace and freedom", "Famous, but they'd hate the attention", "Anonymous, they value their privacy"] },
    { template: "If [name] could plant one idea in everyone's mind, what would it be?", options: ["To slow down and be present", "To be kinder to strangers", "To chase their dreams fearlessly", "To take care of the planet"] },
    { template: "If [name] could experience one day as someone in a completely different life, whose?", options: ["A billionaire, for the extravagance", "A monk, for the peace", "A world traveler with no home", "A famous artist mid-creation"] },
    { template: "If [name] could bring one fictional technology to life, which?", options: ["Teleportation pads", "A holodeck or virtual reality world", "Flying cars", "A universal healing device"] },
    { template: "If [name] could have a personal theme that plays when they enter a room, what vibe?", options: ["Epic and heroic", "Smooth and mysterious", "Fun and goofy", "Dramatic and over-the-top"] },
    { template: "If [name] could instantly know the answer to any mystery, which?", options: ["A famous unsolved case", "What's really out in space", "A secret about their own family", "What happens after we die"] },
    { template: "If [name] found a door that led anywhere they imagined, where would they go daily?", options: ["A tropical beach, every morning", "A cozy cabin to escape and rest", "A different world city each day", "Right back to bed, honestly"] },
    { template: "If [name] could gift one person unlimited happiness, who would they choose?", options: ["A parent or grandparent", "Their best friend", "A sibling", "Themselves, for once"] },
    { template: "Would [name] rather relive their best day on loop or experience a new day forever?", options: ["New days, variety is the spice of life", "Best day on loop, why mess with perfection", "New days, but they'd miss that one", "Best day, they'd never get bored of it"] },
    { template: "If [name] could remove one word from everyone's vocabulary, which?", options: ["'Whatever', dismissively", "'Can't', to kill excuses", "'Busy', as a fake excuse", "A specific word that annoys them"] },
    { template: "If [name] could give up one modern convenience forever, which?", options: ["Social media, easily", "Streaming and TV", "Fast food and delivery", "Nothing, they're too dependent"] },
    { template: "If [name] could instantly transport a loved one to them right now, who?", options: ["A family member far away", "A friend they've lost touch with", "Someone no longer around", "Whoever they miss most today"] },
    { template: "If [name] could make one dream from last night real, would they?", options: ["Yes, chaos and all", "Only the good ones", "No, dreams should stay dreams", "They never remember their dreams anyway"] },
    { template: "If [name] could add one hour to a specific part of every day, which?", options: ["More sleep in the morning", "More free time at night", "A longer lunch break", "An extra hour with people they love"] },
    { template: "If [name] could have any view from their bedroom window, what would it be?", options: ["A sweeping ocean horizon", "A glittering city skyline", "Green mountains and forest", "A quiet garden in bloom"] },
    { template: "If [name] could instantly become fluent in a skill their partner or friend has, which?", options: ["Their cooking ability", "Their confidence with people", "Their creative talent", "Their discipline and drive"] },
    { template: "If [name] could send a care package to their past self during a hard time, what's inside?", options: ["A reassuring letter", "Their favorite comfort things", "Money to ease the stress", "Proof that it gets better"] },
    { template: "If [name] could turn invisible only in embarrassing moments, would they use it?", options: ["Constantly, to dodge every awkward second", "Only in true disasters", "No, they'd own the cringe", "They'd forget they even had it"] },
    { template: "If [name] could guarantee one trait for their future kids, which?", options: ["Kindness above all", "Confidence and resilience", "Intelligence and curiosity", "Happiness, simply"] },
    { template: "If [name] could freeze one age of a loved one forever, would they?", options: ["Yes, at a happy healthy age", "No, growing older together is the point", "Only if the loved one agreed", "It's too heavy a choice to make"] },
    { template: "If [name] could summon any meal instantly, what would appear most often?", options: ["Their ultimate comfort dish", "A different cuisine every time", "Whatever's fastest and easiest", "Dessert, let's be honest"] },
    { template: "If [name] could experience one extreme adventure risk-free, which?", options: ["Skydiving from way up high", "Deep-sea diving with sharks", "Climbing a massive mountain", "Space travel to orbit"] },
    { template: "If [name] could permanently silence one type of noise in the world, which?", options: ["Loud chewing and slurping", "Car alarms and honking", "Notification pings everywhere", "People talking during movies"] },
    { template: "If [name] could gift themselves one full guilt-free day, how would they spend it?", options: ["Sleeping and doing nothing", "An adventure they've been putting off", "Pampering and self-care", "Quality time with someone they love"] },
    { template: "If [name] could ask their pet one question and get an honest answer, what?", options: ["'What are you dreaming about?'", "'Do you know how much I love you?'", "'Why are you scared of that thing?'", "'What did you break while I was out?'"] },
    { template: "If [name] could relive one conversation, which kind?", options: ["A last talk with someone they lost", "A first conversation with someone special", "One where they'd finally say the right thing", "A hilarious one that still makes them laugh"] },
    { template: "If [name] could instantly transport to any point in their favorite show or movie, where?", options: ["Into the cozy safe setting", "Right into the biggest adventure", "The moment before the happy ending", "The world, but as a background extra"] },
    { template: "If [name] could give one part of their day to someone who needs it more, which?", options: ["An hour of their rest", "Their commute time", "Their free evening", "They'd give it all, honestly"] },
    { template: "If [name] could taste any famous dish in the world tonight, which?", options: ["A meal from a legendary restaurant", "Street food from a far-off country", "A grandmother's secret family recipe", "Whatever's viral and hyped right now"] },
    { template: "If [name] had a magic notebook where anything written came true, what's the first entry?", options: ["A fortune for their family", "World peace, no catches", "A cure for something painful", "Their own biggest dream, spelled out"] },
    { template: "If [name] could witness one thing about the future of humanity, what?", options: ["Whether we make it to the stars", "Whether we fix the planet in time", "What everyday life looks like", "Whether people are happier or not"] },
    { template: "If [name] could relive being a kid for one summer, what would they do?", options: ["Play outside until dark, no phone", "Soak up time with family", "Redo it with zero worries this time", "Appreciate how simple it all was"] },
    { template: "If [name] could hand out one free pass to break any rule, to whom?", options: ["A struggling stranger who needs a break", "Their best friend", "A family member", "Themselves, they've earned it"] },
    { template: "If [name] could design their own holiday, what would it celebrate?", options: ["A national day of rest and naps", "Random acts of kindness", "Good food and gathering", "Doing absolutely nothing productive"] },
    { template: "If [name] could keep one age forever but everyone else aged normally, would they?", options: ["Yes, stay young and watch time pass", "No, they'd never want to outlast loved ones", "Only if it could be undone later", "It sounds lonely, so probably not"] },
    { template: "If [name] could relive the moment they met their best friend, would they?", options: ["Yes, to feel that spark again", "No, they'd rather make new memories", "Only to appreciate it more", "Yes, and they'd do nothing differently"] },
    { template: "If [name] could instantly clear one thing from their to-do list forever, what?", options: ["Laundry and chores", "Taxes and paperwork", "Replying to messages", "Cooking every single meal"] },
    { template: "If [name] could grant one wish to a total stranger, what would it be?", options: ["Whatever they needed most", "A little unexpected money", "A moment of pure joy", "The confidence to chase their dream"] },
    { template: "If [name] could relive their happiest memory in full sensory detail, which era?", options: ["A childhood moment", "A wild night with friends", "A quiet moment of achievement", "A first with someone they loved"] },
    { template: "If [name] could add one law that everyone had to follow, what would it be?", options: ["Be honest, always", "Take care of the planet", "Treat service workers with respect", "Everyone gets proper rest"] },
    { template: "If [name] could unlock one door in their own mind, what would they hope to find?", options: ["Forgotten happy memories", "The root of an old fear", "Untapped creativity", "Peace and quiet, finally"] },
    { template: "If [name] could send their consciousness anywhere for one hour, where?", options: ["Into space to see Earth from above", "Into the deep ocean", "Into a loved one's day to be near them", "Into a peaceful place from their past"] },
    { template: "If [name] could permanently gain one personality trait, which?", options: ["Endless patience", "Unshakeable confidence", "Total discipline", "Effortless charm"] },
    { template: "If [name] could relive the last day of an old chapter of their life, which?", options: ["The last day of school", "The last day in a childhood home", "The last day of a job they loved", "The last day with someone before goodbye"] },
    { template: "If [name] could ask the universe for one guarantee, what would it be?", options: ["That their loved ones stay safe", "That everything works out fine", "That they find their purpose", "That they're not wasting their life"] },
    { template: "If [name] could instantly download one book's entire knowledge, which kind?", options: ["Every survival skill", "How to master money", "The secrets of human psychology", "How the universe actually works"] },
    { template: "If [name] could turn one daydream into reality, which?", options: ["Quitting to travel forever", "Living in their dream home", "Becoming great at their passion", "A quiet life with total freedom"] },
    { template: "If [name] could experience zero gravity for a full day, what would they do?", options: ["Flip and float around endlessly", "Try to eat and drink the messy way", "Just relax, weightless and calm", "Film every second of it"] },
    { template: "If [name] could hear one honest sentence from anyone alive, whose would it be?", options: ["A crush or partner", "A parent", "A friend they're unsure about", "Someone they've lost touch with"] },
    { template: "If [name] could relive their proudest moment, which comes to mind?", options: ["A big personal achievement", "A time they helped someone", "Overcoming a huge obstacle", "A moment that made family proud"] },
    { template: "If [name] could gain one hour of pure focus on demand, when would they cash it in?", options: ["During work crunch time", "For a creative passion project", "To finally organize their life", "To have a hard conversation well"] },
    { template: "If [name] could magically be great at one social skill, which?", options: ["Small talk with anyone", "Reading a room instantly", "Telling captivating stories", "Saying no without guilt"] },
    { template: "If [name] could relive one ordinary day that turned out to matter, would they know it at the time?", options: ["No, the best days sneak up quietly", "Yes, they always feel the big ones", "They'd want to be told to savor it", "They'd rather not know and just live it"] },
    { template: "If [name] could bring one comfort from childhood into adulthood, what?", options: ["A worry-free mind", "Long lazy summers", "That specific home-cooked meal", "The feeling of being taken care of"] },
    { template: "If [name] could see a highlight reel of their life so far, what would they hope dominates it?", options: ["Adventures and travel", "Moments with loved ones", "Their proudest wins", "Ordinary happy days"] },
    { template: "If [name] could magically fix one thing about their daily commute or routine, what?", options: ["Delete the commute entirely", "Never wait in a line again", "Always have perfect timing", "More sleep before it all starts"] },
    { template: "If [name] could plant one seed today that grows into anything, what would it become?", options: ["A thriving business or dream", "A lifelong friendship", "A skill mastered over years", "A peaceful place to call home"] },
    { template: "If [name] could gift the world one extra day off, what would they name it?", options: ["National Nap Day", "Do-Nothing Day", "Reconnect-with-Loved-Ones Day", "Try-Something-New Day"] },
    { template: "If [name] could keep one thing exactly as it is right now forever, what would they freeze?", options: ["A relationship at its best", "Their current health and energy", "A season of life they love", "A specific person, unchanged"] },
    { template: "If [name] found a wallet full of cash, what would they do?", options: ["Track down the owner no matter what", "Turn it in and hope for the best", "Keep it and feel guilty forever", "Split the difference somehow"] },
    { template: "If [name] could relive one year of their life, which would it be?", options: ["Their best year ever", "A year they'd do differently", "Their childhood", "None, they'd rather move forward"] },
    { template: "If [name] won the lottery tomorrow, what is the first thing they'd do?", options: ["Quit everything immediately", "Tell almost no one", "Pay off everyone they love", "Book a flight somewhere far"] },
    { template: "If [name] could have dinner with anyone alive, who would it be?", options: ["A world leader", "Their favorite celebrity", "A brilliant scientist", "Someone they've lost touch with"] },
    { template: "If [name] had to survive a week in the wild, how would they do?", options: ["Thrive like a natural", "Struggle but make it", "Give up on day two", "Somehow find a shortcut home"] },
    { template: "If [name] could master any skill instantly, what would they choose?", options: ["Playing any instrument", "Speaking every language", "Reading people perfectly", "Fixing anything broken"] },
    { template: "If [name] could time travel, where would they go first?", options: ["Far into the future", "Ancient history", "Their own past", "Just a few years back"] },
    { template: "If [name] had one day left, how would they spend it?", options: ["Surrounded by everyone they love", "Doing something wild and bold", "Quietly, at peace", "Eating everything they ever wanted"] },
    { template: "If [name] could swap lives with anyone for a day, who would it be?", options: ["A famous celebrity", "A world leader", "A close friend", "Someone with a totally different life"] },
    { template: "If [name] had to give up one sense, which would go?", options: ["Smell, without hesitation", "Taste, reluctantly", "Hearing", "None, impossible choice"] },
    { template: "If [name] could live anywhere in the world, where would it be?", options: ["A sunny beach town", "A bustling world city", "A quiet mountain village", "Somewhere brand new every year"] },
    { template: "If [name] found a genie, what would their first wish be?", options: ["Unlimited money", "Endless free time", "To help everyone they love", "More wishes, obviously"] },
    { template: "If [name] could erase one bad memory, would they?", options: ["Yes, without a second thought", "No, it made them who they are", "Only the very worst one", "They'd think about it for a while"] },
    { template: "If [name] had to eat one cuisine forever, which would it be?", options: ["Italian, always", "Something spicy and bold", "Comfort food from home", "The one with the most variety"] },
    { template: "If [name] could be famous for one thing, what would it be?", options: ["A brilliant invention", "An amazing talent", "Doing genuine good", "They'd rather stay unknown"] },
    { template: "If [name] had to choose between wealth and adventure, which wins?", options: ["Wealth for security", "Adventure every time", "A little of both", "Whatever comes first"] },
    { template: "If [name] could read one person's mind, whose would it be?", options: ["Their crush or partner", "Their boss", "A stranger who fascinates them", "Nobody, too risky"] },
    { template: "If [name] were stranded on an island, what one item would they bring?", options: ["A knife for survival", "A book to stay sane", "A photo of loved ones", "Something wildly impractical"] },
    { template: "If [name] could freeze time whenever they wanted, how would they use it?", options: ["Catch up on endless sleep", "Get ahead on everything", "Explore the frozen world", "Just enjoy a bit of peace"] },
    { template: "If [name] had to publicly confess one secret, what would it be?", options: ["A harmless embarrassing one", "A deeper truth about themselves", "Something about a friend", "They'd flee the country first"] },
    { template: "If [name] could bring back any past era, which would they pick?", options: ["A glamorous decade", "A simpler, slower time", "A time of great invention", "None, the present is best"] },
    { template: "If [name] could instantly be an expert in one field, which?", options: ["Medicine, to help people", "Money and investing", "Art and creativity", "Technology and the future"] },
    { template: "If [name] had to choose fame or fortune, which would they take?", options: ["Fortune, quietly", "Fame, for the spotlight", "Neither, thanks", "Both or nothing"] },
    { template: "If [name] could send a message to their past self, what would it say?", options: ["Slow down and enjoy it", "Don't be so afraid", "Trust yourself more", "It all works out, promise"] },
    { template: "If [name] found out the world ended in a month, how would they react?", options: ["Live it up with no regrets", "Spend it all with loved ones", "Try to help others cope", "Deny it and carry on"] },
    { template: "If [name] could have any animal as a companion, what would it be?", options: ["A loyal wolf", "A wise owl", "A playful dolphin", "A majestic big cat"] },
    { template: "If [name] had to pick a completely new name, what vibe would it have?", options: ["Something classic and timeless", "Something bold and unusual", "Something soft and pretty", "They'd keep their own"] },
    { template: "If [name] could solve one global problem instantly, which?", options: ["End world hunger", "Cure all disease", "Fix the climate", "End all conflict"] },
    { template: "If [name] had to live one day on repeat, which day would it be?", options: ["The happiest day of their life", "A totally ordinary good day", "A day they'd redo better", "A quiet, peaceful one"] },
    { template: "If [name] could trade talents with a friend, what would they take?", options: ["Their confidence", "Their creativity", "Their discipline", "Their easy charm"] },
    { template: "If [name] found a door to another world, would they go through?", options: ["Instantly, no hesitation", "Only after peeking first", "Never, too scary", "Only if a friend came too"] },
    { template: "If [name] had to give a speech to the whole world, what about?", options: ["Kindness and empathy", "Chasing your dreams", "Protecting the planet", "A joke to lighten the mood"] },
    { template: "If [name] could undo one decision, which would it be?", options: ["A missed opportunity", "Something they said", "A path they didn't take", "None, no regrets"] },
    { template: "If [name] had unlimited money but had to keep working, what job would they pick?", options: ["Something fun and low-stress", "A dream creative role", "Helping people directly", "The same job, honestly"] },
    { template: "If [name] could witness one historical event, which would it be?", options: ["A moment of great discovery", "A turning point in history", "The birth of something famous", "Something personal to them"] },
    { template: "If [name] had to be a character in any story, who would they be?", options: ["The brave hero", "The clever sidekick", "The wise mentor", "The mysterious stranger"] },
    { template: "If [name] could have a second life, how different would it be?", options: ["A totally wild adventure", "A calm simple existence", "The same but braver", "Somewhere far away"] },
    { template: "If [name] found a machine that grants one talent, which would they choose?", options: ["Musical genius", "Athletic greatness", "Artistic mastery", "Perfect memory"] },
    { template: "If [name] had to survive a zombie outbreak, what would their role be?", options: ["The fearless leader", "The clever planner", "The one who feeds everyone", "The first to panic"] },
    { template: "If [name] could make one rule everyone had to follow, what would it be?", options: ["Always be kind", "Never lie", "Take care of the planet", "Nap time for all"] },
    { template: "If [name] had to choose between never being cold or never being hot, which?", options: ["Never cold again", "Never hot again", "Impossible to decide", "Depends on the season"] },
    { template: "If [name] could relive their first big success, would they?", options: ["Yes, to feel it again", "No, keep moving forward", "Only to appreciate it more", "They'd rather chase a new one"] },
    { template: "If [name] discovered they had a hidden superpower, which would they want?", options: ["Flight", "Invisibility", "Super strength", "Healing others"] },
    { template: "If [name] had to spend a year completely off the grid, how would they cope?", options: ["Love the total peace", "Miss people terribly", "Find a secret way to check in", "Thrive and never come back"] },
    { template: "If [name] could ask the universe one question, what would it be?", options: ["What's my purpose", "Are we alone out here", "What happens after this", "How does it all end"] },
    { template: "If [name] had to pick a completely new career overnight, what would it be?", options: ["Something creative", "Something hands-on", "Something helping others", "Something with total freedom"] },
    { template: "If [name] could keep only one possession, what would it be?", options: ["A sentimental keepsake", "Their phone", "A favorite piece of clothing", "Something with a story"] },
    { template: "If [name] had to describe their perfect world, what would define it?", options: ["Peace and calm everywhere", "Endless adventure", "Everyone treated fairly", "No one ever lonely"] },
    { template: "If [name] could instantly heal one thing in the world, what would they choose?", options: ["A loved one's pain", "Their own past wound", "A stranger in need", "The whole world's suffering"] },
    { template: "If [name] were given a blank check with one condition, what condition would break the deal?", options: ["Hurting someone else", "Giving up their freedom", "Keeping it a lifelong secret", "Nothing, they'd take it"] },
    { template: "If [name] could pause aging at any point, what age would they pick?", options: ["Their carefree twenties", "A wise, settled age", "Right now", "They'd rather keep growing"] },
    { template: "If [name] had to trade places with a fictional villain or hero, which?", options: ["The hero, obviously", "The villain, for the drama", "Neither, too much pressure", "Whichever had more fun"] },
    { template: "If [name] could know the exact day of one future event, which?", options: ["A big life milestone", "A stroke of luck coming", "Nothing, they'd rather not", "A warning they could act on"] },
    { template: "If [name] were handed the keys to a kingdom, how would they rule?", options: ["With fairness and calm", "With bold sweeping changes", "By listening to everyone", "By quietly stepping aside"] },
    { template: "If [name] had to give up either music or movies forever, which goes?", options: ["Movies, keep the music", "Music, keep the movies", "Impossible, don't ask", "Whichever they use less"] },
    { template: "If [name] found a note predicting their future, would they read it?", options: ["Immediately, no doubt", "Burn it unopened", "Only the good parts", "Agonize before deciding"] },
    { template: "If [name] could be reincarnated as anything, what would they choose?", options: ["A soaring bird", "A wise old tree", "A pampered house pet", "A human again"] },
    { template: "If [name] had to choose one lifelong companion trait in a friend, what?", options: ["Unshakable loyalty", "Endless humor", "Deep honesty", "Calm reliability"] },
    { template: "If [name] could erase one invention from ever existing, which?", options: ["Something addictive", "A weapon", "A distraction they hate", "None, they're all useful"] },
    { template: "If [name] were the last person on Earth, what would they do first?", options: ["Explore forbidden places", "Look for any survivors", "Live in total luxury", "Sit in stunned silence"] },
    { template: "If [name] could gift one thing to everyone alive, what would it be?", options: ["A little more time", "A little more kindness", "Enough to never worry", "A good night's sleep"] },
    { template: "If [name] had to compete in any contest to win big, which would they pick?", options: ["A trivia showdown", "A cooking competition", "A talent show", "A game of pure luck"] },
    { template: "If [name] discovered a hidden room in their home, what would they hope to find?", options: ["Forgotten treasure", "A cozy secret hideaway", "Answers about the past", "Absolutely nothing scary"] },
    { template: "If [name] could speak to animals for a day, what would they ask?", options: ["What do you really think of us", "Are you happy", "What's it like out there", "Where's the best food"] },
    { template: "If [name] had to relocate to another country tomorrow, how would they feel?", options: ["Thrilled for the adventure", "Terrified but game", "Devastated to leave", "Only if they chose where"] },
    { template: "If [name] could relive one conversation, which would it be?", options: ["A last talk with someone lost", "A moment they got right", "One they'd fix this time", "A funny one, just for joy"] },
    { template: "If [name] were offered eternal youth at a cost, would they take it?", options: ["Yes, whatever the price", "No, aging is natural", "Only if loved ones came too", "They'd need to know the cost first"] },
    { template: "If [name] had to design their own holiday, what would it celebrate?", options: ["A day of total rest", "Gratitude for the little things", "Random acts of kindness", "Doing whatever you want"] },
    { template: "If [name] could instantly finish one unfinished thing, what would it be?", options: ["A project they abandoned", "A book they never wrote", "A skill half-learned", "A conversation left open"] },
    { template: "If [name] found a map to buried treasure, would they chase it?", options: ["Drop everything and go", "Research it carefully first", "Assume it's a scam", "Only with a partner in crime"] },
    { template: "If [name] had to pick a theme song for their life, what mood would it have?", options: ["Triumphant and epic", "Chill and easygoing", "Fun and playful", "Deep and reflective"] },
    { template: "If [name] could give up sleep entirely, how would they use the extra time?", options: ["Chase every hobby", "Get way ahead in life", "Enjoy the quiet nights", "They'd miss dreaming too much"] },
    { template: "If [name] were granted one do-over in a friendship, what would they change?", options: ["Speak up sooner", "Fight less over nothing", "Stay in better touch", "Nothing, it was perfect"] },
    { template: "If [name] had to trade one year of life for a dream come true, would they?", options: ["Yes, worth it", "Never, life is precious", "Only for the biggest dream", "They'd haggle the price"] },
    { template: "If [name] could witness their own future for five minutes, what would they look for?", options: ["Are they happy", "Who's beside them", "Did the risk pay off", "Nothing, spoilers ruin it"] },
    { template: "If [name] found a button that gave a random person a great day, how often would they press it?", options: ["Constantly, all day", "Now and then", "Only for people they know", "Only if they got something too"] },
    { template: "If [name] had to survive on one hobby as a job, which would they choose?", options: ["Their most creative one", "The most social one", "The one they're best at", "The most relaxing one"] },
    { template: "If [name] could rewrite one rule of the universe, what would it be?", options: ["No more aging", "You can always undo mistakes", "Kindness always rewarded", "Time moves slower on weekends"] },
    { template: "If [name] were invisible for a day, where would they go?", options: ["Somewhere they're not allowed", "A behind-the-scenes place", "To spy on a friend harmlessly", "Just to skip every line"] },
    { template: "If [name] had to mentor their younger self, what lesson comes first?", options: ["Be kinder to yourself", "Take the leap", "Stop worrying so much", "Cherish these people"] },
    { template: "If [name] could summon any historical figure for advice, who?", options: ["A great philosopher", "A bold explorer", "A brilliant artist", "A famous leader"] },
    { template: "If [name] found out dreams could come true if described out loud, what would they say?", options: ["A specific big goal", "Peace for the people they love", "An adventure they crave", "Something small and sweet"] },
    { template: "If [name] had to give up their phone or their car for a year, which goes?", options: ["The car, easily", "The phone, bravely", "Impossible to choose", "Whichever they use less"] },
    { template: "If [name] could experience one thing for the first time again, what would it be?", options: ["Falling in love", "A favorite film or book", "A place they adore", "A taste they crave"] },
    { template: "If [name] were given a week with no responsibilities, how would they spend it?", options: ["Traveling somewhere new", "Doing absolutely nothing", "Finally tackling a passion", "With the people they miss"] },
    { template: "If [name] could whisper one truth into every mind at once, what would it be?", options: ["Slow down and breathe", "You are enough", "Help each other more", "The little things matter"] },
    { template: "If [name] had to face their biggest fear to save a stranger, would they?", options: ["Yes, without thinking", "Yes, but terrified", "They'd hesitate hard", "They'd find another way"] },
    { template: "If [name] found a lamp with three wishes, what would the last one be?", options: ["Happiness for loved ones", "A wish for more wishes", "To undo a regret", "World peace, sincerely"] },
    { template: "If [name] could live inside any fictional world, which would they pick?", options: ["A magical fantasy realm", "A futuristic sci-fi city", "A cozy small-town story", "A grand adventure epic"] },
    { template: "If [name] had to choose between knowing how or when they'd die, which?", options: ["The how", "The when", "Neither, ever", "Whichever brings peace"] },
    { template: "If [name] were handed a time capsule to fill, what would go inside?", options: ["Photos of their people", "A letter to the future", "A treasured object", "A record of who they are now"] },
    { template: "If [name] could grant one wish for a total stranger, what would it be?", options: ["Whatever they need most", "A stroke of good luck", "A little more hope", "A day of pure joy"] },
    { template: "If [name] had to lose all their memories or all their money, which?", options: ["The money, no question", "The memories, painfully", "Neither, impossible", "They'd need more details"] },
    { template: "If [name] could instantly transport home from anywhere, when would they use it most?", options: ["The second a party ends", "Any awkward situation", "A long commute", "Whenever they miss their bed"] },
    { template: "If [name] were the hero of a movie, what genre would it be?", options: ["A grand epic adventure", "A heartfelt drama", "A hilarious comedy", "A clever mystery"] },
    { template: "If [name] could relive their happiest surprise, what was it?", options: ["An unexpected reunion", "A gift they never saw coming", "A door that opened suddenly", "A moment they'll never forget"] },
    { template: "If [name] had to choose one place to protect forever, which?", options: ["A wild natural wonder", "Their hometown", "A place full of memories", "Somewhere sacred to many"] },
    { template: "If [name] found they could pause a bad day and restart it, how often would they?", options: ["Almost every day", "Only the truly awful ones", "Rarely, they'd tough it out", "Never, growth needs the bad days"] },
    { template: "If [name] could gift their talent to one person, who would get it?", options: ["A struggling friend", "A stranger who needs it", "The next generation", "No one, they'd keep it"] },
    { template: "If [name] had to spend a year in complete silence, could they do it?", options: ["Easily, they'd love it", "It would break them", "Only with the right company", "They'd cheat within a week"] },
    { template: "If [name] could ask their future partner one question now, what would it be?", options: ["Are we happy together", "Where did we end up", "Was it worth the wait", "Do you regret anything"] },
    { template: "If [name] were offered a map of their whole life, would they open it?", options: ["Yes, they need to know", "No, ruins the journey", "Only the next chapter", "They'd agonize forever"] },
    { template: "If [name] could grant themselves one impossible ability, what would it be?", options: ["To never feel tired", "To understand everyone", "To be in two places at once", "To always know the right thing to say"] },
    { template: "If [name] had to trade their comfort zone for a wild dream, would they leap?", options: ["Leap without looking", "Look long, then leap", "Stay safe, sadly", "Only with a safety net"] },
    { template: "If [name] found a diary from their future self, what would they hope it said?", options: ["That everything worked out", "That they were brave", "That they were loved", "That they had no regrets"] },
    { template: "If [name] could design the perfect day for someone they love, what would it include?", options: ["Their favorite people", "Their favorite place", "A total surprise", "Zero stress at all"] },
    { template: "If [name] had to choose between a life of comfort or meaning, which?", options: ["Meaning, always", "Comfort, honestly", "A balance of both", "Whichever finds them first"] },
    { template: "If [name] could bottle one feeling to keep forever, which would it be?", options: ["Pure contentment", "The thrill of falling in love", "The calm after a storm", "Belly-laughing with friends"] },
    { template: "If [name] were granted the power to forgive one thing, what would it be?", options: ["An old betrayal", "Something they can't let go", "Themselves, finally", "A person long gone"] },
    { template: "If [name] had to spend a fortune in one day or lose it, how would they?", options: ["Buy experiences, not things", "Splurge on loved ones", "Invest in their dream", "Panic and overspend on junk"] },
    { template: "If [name] could witness the very beginning or the very end of the world, which?", options: ["The beginning, out of wonder", "The end, out of curiosity", "Neither, too heavy", "Whichever is more peaceful"] },
    { template: "If [name] found a stray key with no lock, what would they imagine it opens?", options: ["A hidden treasure", "A door to somewhere magical", "An old forgotten secret", "Nothing, they'd toss it"] },
    { template: "If [name] had to give up all screens or all sweets forever, which?", options: ["Sweets, painfully", "Screens, heroically", "Impossible to pick", "Whichever they'd miss less"] },
    { template: "If [name] could send one warning back through time, what would it be?", options: ["Don't trust that person", "Take better care of yourself", "Say yes to that chance", "Slow down, it goes fast"] },
    { template: "If [name] were offered a chance to start life over completely, would they take it?", options: ["Yes, a clean slate", "No, they earned this one", "Only to keep their memories", "They'd think about it for years"] },
    { template: "If [name] could freeze one perfect moment in amber, which would they choose?", options: ["A quiet moment of joy", "A loved one still here", "A triumphant win", "A first of something special"] },
    { template: "If [name] had to survive a year with only one book, which kind?", options: ["A giant epic saga", "A book of endless wisdom", "A funny comfort read", "A blank one to fill themselves"] },
    { template: "If [name] could see the world through one other person's eyes, whose?", options: ["A rival's, for insight", "A loved one's, for empathy", "A stranger's, for perspective", "A child's, for wonder"] },
    { template: "If [name] were handed a switch to end all their worries, would they flip it?", options: ["Instantly", "No, worries keep them sharp", "Only the pointless ones", "They'd hesitate a long time"] },
    { template: "If [name] could relive a single ordinary day exactly as it was, which would they pick?", options: ["A lazy day with family", "A perfect nothing day", "A day with someone gone", "A quiet day that felt like home"] },
    { template: "If [name] had to choose a completely fresh identity, what would change first?", options: ["Where they live", "What they do", "Who they know", "Nothing at all, deep down"] },
    { template: "If [name] could grant one prayer for a stranger tonight, what would it be?", options: ["Rest for the exhausted", "Comfort for the grieving", "Hope for the hopeless", "A break for the struggling"] },
    { template: "If [name] found a mirror showing their best possible self, how would they react?", options: ["Chase that version at once", "Feel inspired and grateful", "Feel a pang of regret", "Look away, too much pressure"] },
    { template: "If [name] had to spend eternity at one age, which would they choose?", options: ["Their most confident age", "A carefree younger one", "A wise older one", "Exactly where they are now"] },
    { template: "If [name] could keep one door from their past open forever, which?", options: ["A friendship that faded", "A path they didn't take", "A place they left behind", "A version of themselves they miss"] },
    { template: "If [name] were offered the answers to any three questions, what would they ask about?", options: ["Their own future", "The people they love", "The big mysteries of life", "Something wonderfully trivial"] },
    { template: "If [name] had to choose between endless luck or endless wisdom, which?", options: ["Luck, life gets easy", "Wisdom, life gets clear", "Impossible to decide", "A little of each"] },
    { template: "If [name] could relive the moment they felt most proud, what was it?", options: ["A hard-won achievement", "Standing up for someone", "Finishing something huge", "A quiet private victory"] },
    { template: "If [name] found a chance to meet their hero, how would it go?", options: ["Cool and composed", "A total nervous mess", "Full of prepared questions", "Speechless and starstruck"] },
    { template: "If [name] had to leave one legacy behind, what would it be?", options: ["The kindness they showed", "Something they created", "The people they raised", "A story worth telling"] },
    { template: "If [name] could visit any version of themselves, which age would they choose?", options: ["Their curious childhood", "Their bold twenties", "A future, wiser self", "A version who took the other path"] },
    { template: "If [name] were given one perfect prediction, what would they want it about?", options: ["Whether the risk pays off", "Whether they'll be okay", "Who stays in their life", "The next big surprise"] },
    { template: "If [name] had to save one thing from a burning home, what would it be?", options: ["A photo album", "A sentimental keepsake", "Their pet, obviously", "Whatever was closest"] },
    { template: "If [name] could master a fear overnight, which would they conquer?", options: ["Fear of failure", "Fear of heights or deep water", "Fear of being alone", "Fear of what others think"] },
    { template: "If [name] found a way to relive one summer, which would they pick?", options: ["A carefree childhood one", "The summer everything changed", "One with someone they miss", "The most adventurous one"] },
    { template: "If [name] had to choose their own fortune-cookie message for life, what would it say?", options: ["The best is yet to come", "Trust the journey", "Slow down and look around", "You are exactly where you need to be"] },
    { template: "If [name] could grant a single wish to their past self, what would it be?", options: ["Confidence to try", "Patience with themselves", "Courage to speak up", "Peace about the unknown"] },
    { template: "If [name] were offered a seat at any table in history, which would they take?", options: ["A great council of leaders", "A gathering of artists", "A room full of inventors", "A quiet family dinner long ago"] },
    { template: "If [name] had to relive one goodbye and do it right, which would it be?", options: ["A last goodbye to someone lost", "A friendship that ended badly", "A move they never processed", "None, they'd rather not"] },
    { template: "If [name] could unlock one memory they've forgotten, which would they choose?", options: ["Their earliest one", "A day someone described to them", "A moment that shaped them", "None, some are lost for a reason"] },
    { template: "If [name] were handed control of the weather, what would they conjure?", options: ["Endless perfect sunshine", "A dramatic thunderstorm", "Gentle snow on demand", "Whatever the day needed"] },
    { template: "If [name] had to spend a year helping one cause, which would they choose?", options: ["Feeding the hungry", "Protecting nature", "Teaching kids", "Comforting the lonely"] },
    { template: "If [name] could gift their future child one trait, what would it be?", options: ["Boundless curiosity", "Deep kindness", "Unshakable courage", "A joyful heart"] },
    { template: "If [name] found a way to slow down time on the best days, would they use it?", options: ["Every single time", "Only the truly magic ones", "No, let them pass naturally", "Only if others slowed too"] },
    { template: "If [name] had to pick one moment to feel forever, which would it be?", options: ["The peak of a great trip", "A hug that felt like home", "The relief after a hard win", "A quiet ordinary evening"] },
    { template: "If [name] could choose the very last thing they ever hear, what would it be?", options: ["A loved one's voice", "Their favorite song", "The sound of the sea", "Laughter in the room"] },
    { template: "If [name] were granted a single flawless day, how would it unfold?", options: ["No plans, pure spontaneity", "Every favorite thing at once", "Slow and deeply peaceful", "Surrounded by everyone they love"] },
    { template: "If [name] had to choose between meeting their ancestors or their descendants, which?", options: ["The ancestors, for roots", "The descendants, for hope", "Both or neither", "Whichever tells the better story"] },
    { template: "If [name] could relive one act of kindness they received, which comes to mind?", options: ["A stranger's unexpected help", "A friend showing up unasked", "A gift that meant everything", "Words that came at the right time"] },
    { template: "If [name] found a way to try any life for a week risk-free, which would they sample?", options: ["A celebrity's whirlwind life", "A quiet farm existence", "A daring explorer's path", "A completely opposite career"] },
    { template: "If [name] had to give up either surprises or certainty forever, which?", options: ["Surprises, keep the calm", "Certainty, keep the wonder", "Impossible to choose", "Whichever hurts less"] },
    { template: "If [name] could send a single photo to their younger self, which would it be?", options: ["Proof things got better", "The people who'd matter", "A place they'd end up loving", "Their own proud smile"] },
    { template: "If [name] were the author of their own story, how would the next chapter open?", options: ["With a bold new beginning", "With hard-won peace", "With an unexpected twist", "Right where they are, content"] },
    { template: "If [name] had to bet everything on one talent of theirs, which would they choose?", options: ["Their sharpest skill", "Their most creative gift", "Their way with people", "Their sheer persistence"] },
    { template: "If [name] could witness one moment of a loved one's future, which?", options: ["Their happiest day", "A proud milestone", "Proof they'll be okay", "None, they'd rather be surprised"] },
    { template: "If [name] had to choose one word to be remembered by, which?", options: ["Kind", "Brave", "Funny", "Loyal"] },
    { template: "If [name] could rewind to the start of one relationship, would they change how it began?", options: ["Yes, do it better", "No, it was perfect", "Only one small thing", "They'd let it play out again"] },
    { template: "If [name] were offered a glimpse of the road not taken, would they look?", options: ["Yes, out of pure curiosity", "No, it might sting too much", "Only a peek", "They'd want to know it worked out"] },
    { template: "If [name] had to choose a guardian to watch over them, what form would it take?", options: ["A wise old soul", "A fierce protector", "A gentle comforter", "A playful trickster"] },
    { template: "If [name] could give one gift to the version of themselves five years ago, what?", options: ["Patience", "Self-belief", "A little grace", "The knowledge it works out"] },
    { template: "If [name] had to pick the soundtrack for their proudest moment, what would swell?", options: ["A soaring orchestral theme", "A triumphant anthem", "A quiet emotional melody", "An upbeat celebration song"] },
    { template: "If [name] found a way to keep one door from closing in life, which would it be?", options: ["A dream they set aside", "A friendship drifting away", "A chance still on the table", "A version of who they could be"] },
    { template: "If [name] could trade a rainy week for a scorching one, would they?", options: ["Yes, bring the heat", "No, keep the rain", "Only for a beach trip", "Depends on their mood"] },
    { template: "If [name] had to pick one myth to be real, which would they choose?", options: ["Dragons in the sky", "Mermaids in the sea", "Magic anyone can learn", "Ghosts watching over us"] },
    { template: "If [name] could instantly grow one plant anywhere, what would it be?", options: ["A giant shade tree", "A field of wildflowers", "An endless food garden", "A single perfect rose"] },
    { template: "If [name] were handed a boat and a full tank, where would they sail?", options: ["Toward a distant island", "Along a wild coastline", "Nowhere, just to drift", "Straight into an adventure"] },
    { template: "If [name] had to name a star after something, what would it be?", options: ["A person they love", "A place that shaped them", "A dream they hold", "A private inside joke"] },
    { template: "If [name] could taste one impossible flavor, what would it be?", options: ["The color blue", "A thunderstorm", "A childhood memory", "Pure happiness"] },
    { template: "If [name] were given a key that opens any one place, where would it lead?", options: ["A famous locked archive", "Backstage anywhere", "A stranger's front door", "Their own past bedroom"] },
    { template: "If [name] could turn one everyday chore into pure fun, which would they pick?", options: ["Doing the dishes", "Folding laundry", "The morning commute", "Grocery shopping"] },
    { template: "If [name] had to spend a night in any building alone, which would they brave?", options: ["A grand old museum", "An abandoned mansion", "A towering skyscraper", "A cozy library"] },
    { template: "If [name] could adopt one made-up holiday tradition, what would it be?", options: ["A yearly do-nothing day", "A gratitude feast", "A midnight adventure", "A gift only they choose"] },
    { template: "If [name] were offered a lifetime supply of one thing, what would they pick?", options: ["Their favorite food", "Endless coffee", "New books forever", "Free travel anywhere"] },
    { template: "If [name] could relive one first day, which would it be?", options: ["A first day of freedom", "A first day somewhere new", "A first day of a dream job", "A first day they met someone special"] },
    { template: "If [name] had to choose a sidekick for a grand quest, who would it be?", options: ["Their most loyal friend", "The cleverest person they know", "The funniest one around", "A total wildcard"] },
    { template: "If [name] could leave one message carved to last a thousand years, what would it say?", options: ["Be kind to each other", "We were here and we loved", "Take care of this world", "Something to make them smile"] },
    { template: "If [name] were given the power to grant one snow day for everyone, when would they use it?", options: ["The busiest week of the year", "A random gloomy Monday", "A day everyone needs rest", "They'd save it forever"] },
    { template: "If [name] had to spend a year as a character in any decade, which era would they choose?", options: ["The roaring twenties", "A groovy retro decade", "A far-off future age", "The one they grew up in"] },
    { template: "If [name] could send one care package to their past self, what would go inside?", options: ["A reassuring letter", "Their favorite comfort snack", "A photo of good times ahead", "A little pep-talk playlist"] },
  ],
  spicy: [
    { template: "Who does [name] secretly find attractive in this friend group?", options: ["Someone everyone would expect", "Someone nobody would ever guess", "They'd never admit it even under pressure", "They genuinely don't see any of their friends that way"] },
    { template: "What's [name]'s most embarrassing romantic experience?", options: ["A first kiss that went horribly wrong", "Confessing feelings and getting rejected publicly", "Being walked in on during an intimate moment", "Sending a risky message to the wrong person entirely"] },
    { template: "What would [name] never tell their parents about?", options: ["A specific relationship or situationship", "Something that happened at a party or social event", "A financial decision that would horrify them", "A phase they went through that their parents have no idea about"] },
    { template: "What's [name]'s body count situation?", options: ["Lower than people think, they're more private", "Higher than people think, they're surprisingly experienced", "Exactly what you'd guess, no surprises", "They would literally die before answering this honestly"] },
    { template: "What's the worst thing [name] has done to someone who trusted them?", options: ["Talked about them behind their back when they shouldn't have", "Broke a promise that really mattered", "Led someone on when they knew it wasn't going anywhere", "Shared something private that was told in confidence"] },
    { template: "What toxic trait does [name] know they have but refuse to fix?", options: ["Being emotionally unavailable when it matters most", "Ghosting people instead of having hard conversations", "Always needing to be right, even at the cost of relationships", "Testing people's loyalty instead of trusting them"] },
    { template: "What's [name]'s biggest regret they never talk about?", options: ["A relationship they ended or ruined", "An opportunity they let pass out of fear", "Something they said that they can never take back", "Not being there for someone who needed them"] },
    { template: "If [name]'s search history was projected on a wall right now, what would shock everyone?", options: ["How often they look up their ex or someone specific", "The type of content they actually watch late at night", "How many symptoms they've convinced themselves they have", "Something embarrassingly specific and niche"] },
    { template: "What's the meanest thought [name] has had about someone in this room?", options: ["Something about their intelligence or decisions", "Something about their appearance or habits", "Something about their relationship or dating life", "They genuinely don't think mean things about their friends"] },
    { template: "What lie has [name] told that would ruin a friendship if it came out?", options: ["Pretending to be busy to avoid spending time with someone", "Agreeing with something they fundamentally disagree with to keep the peace", "Not telling someone the truth about a situation that affects them", "Something they said to one friend about another"] },
    { template: "What's the most selfish thing [name] has done in a relationship?", options: ["Stayed with someone they didn't love because it was comfortable", "Cheated emotionally, if not physically", "Made their partner feel crazy for being right about something", "Put their own needs first at a critical moment for the other person"] },
    { template: "How far has [name] gone with someone they shouldn't have?", options: ["A friend's ex, and they kept it secret", "A coworker or someone in their professional circle", "Someone they knew was in a relationship", "They've kept that boundary, surprisingly"] },
    { template: "What would [name] do if they could get away with it with zero consequences?", options: ["Something financially illegal but victimless", "Confront someone who wronged them, no holds barred", "Break a relationship boundary they've been curious about", "Disappear from their entire life and start fresh somewhere"] },
    { template: "What is [name] insecure about that they overcompensate for?", options: ["Their intelligence, so they always try to seem smart", "Their attractiveness, so they overfocus on appearance", "Their social status, so they name-drop or flex", "Their worthiness of love, so they people-please constantly"] },
    { template: "What's the most embarrassing thing [name] has cried about?", options: ["A movie or TV show moment that wrecked them", "A rejection that shouldn't have hit that hard", "An argument that spiraled out of control over nothing", "Being overwhelmed by something kind someone did"] },
    { template: "Who in [name]'s life do they secretly resent?", options: ["A family member who let them down", "A friend who got something they wanted", "An ex who moved on too easily", "Someone who succeeded where they failed"] },
    { template: "What would [name]'s ex say is their worst quality?", options: ["They shut down emotionally when things get hard", "They're too controlling or opinionated", "They never fully committed or stayed present", "They gave too much and then resented it"] },
    { template: "What's the most questionable thing [name] has ever done while drinking?", options: ["Texted someone they absolutely should not have", "Made a decision that took weeks to recover from", "Said something brutally honest they normally would filter", "Something they've genuinely blocked from memory"] },
    { template: "What does [name] think about at 3 AM that they'd never say out loud?", options: ["Whether their friends actually like them", "A specific person they can't get off their mind", "Whether they're on the right path in life", "Something from their past that still haunts them"] },
    { template: "What boundary has [name] crossed that they pretend they didn't?", options: ["Looked through someone's phone or private messages", "Said something in anger they can never take back", "Got involved in something that wasn't their business", "Betrayed someone's trust in a way they rationalized"] },
    { template: "What's the most uncomfortable truth [name] avoids facing?", options: ["That they're not as over someone as they pretend to be", "That a certain friendship is one-sided", "That their lifestyle isn't sustainable long-term", "That they're afraid of being truly known"] },
    { template: "What would [name] be most devastated to have exposed publicly?", options: ["Their private messages with a specific person", "Their actual financial situation", "Their real feelings about certain people in their life", "Something from their past nobody currently knows about"] },
    { template: "What's [name]'s most controversial opinion they keep to themselves?", options: ["Something about religion or spirituality", "Something about relationships or marriage that's unpopular", "A political stance that would surprise people", "A judgment about a lifestyle choice that others celebrate"] },
    { template: "What habit would [name] be mortified if their partner discovered?", options: ["How much time they spend on their phone doing nothing", "A specific type of content they consume regularly", "How long they can go without basic self-care when alone", "A financial habit that's secretly out of control"] },
    { template: "What's the biggest double standard [name] has?", options: ["Expecting honesty from others but withholding truths themselves", "Judging people for something they also do", "Wanting space but feeling hurt when others want it too", "Giving advice they'd never follow themselves"] },
    { template: "What's the darkest joke [name] has ever laughed at?", options: ["Something about death or mortality", "Something about a sensitive social topic", "Something self-deprecating that was more truth than joke", "They don't laugh at dark humor, their conscience won't allow it"] },
    { template: "If truth serum existed, what question would [name] be most afraid to answer?", options: ["Do you really love the person you're with?", "Who are you most jealous of and why?", "What's the worst thing you've ever done?", "Are you actually happy with your life right now?"] },
    { template: "What does [name] do to cope that they know isn't healthy?", options: ["Isolate and withdraw from everyone", "Overwork or stay busy to avoid feeling", "Impulse-spend money they don't have", "Use substances or habits as an emotional crutch"] },
    { template: "What's a secret [name] knows about someone else that could cause drama?", options: ["Something about a friend's relationship they shouldn't know", "Something someone confessed to them in confidence", "Something they figured out on their own by connecting dots", "They'd take it to the grave, and that's all they'll say"] },
    { template: "What emotional baggage is [name] carrying that affects every relationship?", options: ["Trust issues from being lied to or cheated on", "Abandonment wounds from someone who left", "A need for validation from never feeling enough growing up", "Fear of vulnerability from having been hurt when they were open"] },
    { template: "What's the worst text [name] has sent that they wish they could unsend?", options: ["A long emotional paragraph they sent in a moment of weakness", "Something passive-aggressive that made things worse", "A confession of feelings that was not reciprocated", "A screenshot or message they sent to the wrong person"] },
    { template: "What would [name]'s therapist know that nobody else does?", options: ["The root cause of their deepest insecurity", "A family dynamic that shaped who they are", "A pattern in their relationships they can't break", "They don't go to therapy but probably should"] },
    { template: "What persona does [name] put on that's different from who they really are?", options: ["The confident, unbothered one who actually cares too much", "The fun, easygoing one who is actually exhausted and burnt out", "The strong, independent one who actually craves connection", "The busy, productive one who actually procrastinates everything"] },
    { template: "What's the most morally gray thing [name] has done?", options: ["Kept money or something valuable they found and could have returned", "Let someone take the blame for something they did", "Stayed silent when speaking up would have been the right thing", "Manipulated a situation to get the outcome they wanted"] },
    { template: "What would [name] pay real money to make sure nobody ever finds out?", options: ["A specific night or series of events", "Their actual browsing and search habits", "Something they said about someone who trusts them", "A phase of their life they've completely rewritten in their head"] },
    { template: "What bridge has [name] burned that they secretly want to rebuild?", options: ["A friendship that fell apart over something preventable", "A family relationship they walked away from", "A romantic relationship they ended impulsively", "A professional connection they handled poorly"] },
    { template: "What emotion does [name] feel most often but never express?", options: ["Loneliness, even when surrounded by people", "Anger, at things they smile through", "Sadness, behind the humor and energy", "Jealousy, toward people they genuinely care about"] },
    { template: "What is [name] most ashamed of from their past?", options: ["How they treated someone who didn't deserve it", "A period of their life where they completely lost themselves", "A lie that got out of hand and became part of their story", "Something they did out of desperation or survival mode"] },
    { template: "What would [name]'s parents be most disappointed to learn?", options: ["Their real values don't align with how they were raised", "A relationship or connection they've kept hidden", "Their actual relationship with substances or habits", "How much they've struggled without asking for help"] },
    { template: "What petty grudge is [name] still holding onto?", options: ["Someone who embarrassed them in front of others", "A friend who chose someone else over them", "A person who never apologized for something hurtful", "An insult from years ago that they replay in their mind"] },
    { template: "What's [name]'s actual opinion of their own appearance?", options: ["They think they're attractive but don't want to seem vain", "They're genuinely insecure about specific features", "It changes daily depending on their mood", "They don't think about it as much as people assume"] },
    { template: "What would [name] confess to a stranger they'll never see again?", options: ["That they don't know what they're doing with their life", "That they still think about someone from years ago", "That they're afraid they'll never find real love", "That their happiest face often hides their hardest days"] },
    { template: "What promise has [name] broken that they feel guilty about?", options: ["A promise to themselves about who they'd become", "A promise to a friend or family member they let down", "A promise to be honest in a situation where they lied", "A promise to change a behavior they know is harmful"] },
    { template: "What conversation is [name] avoiding that they know they need to have?", options: ["A conversation about their feelings for someone", "A conversation about a problem in a friendship", "A conversation with a family member about something unresolved", "A conversation about their own mental health or wellbeing"] },
    { template: "What's the most manipulative thing [name] has knowingly done?", options: ["Used tears or emotions strategically to get their way", "Withheld information to control a situation's outcome", "Made someone feel guilty to change their behavior", "Played two people against each other to see what happens"] },
    { template: "What would make [name] question their entire identity?", options: ["Finding out a major belief they hold is completely wrong", "Losing the person they define themselves through", "Failing at the thing they've built their identity around", "Being told by multiple people that they're not who they think they are"] },
    { template: "What's [name]'s relationship with their own anger like?", options: ["They suppress it completely and it comes out sideways", "They explode and then immediately feel terrible", "They channel it productively, but it takes effort", "They rarely feel true anger, more like disappointment"] },
    { template: "What part of their personality does [name] perform for other people?", options: ["Being tougher or more resilient than they really are", "Being more easygoing and chill than they naturally are", "Being smarter or more knowledgeable than they feel", "Being happier or more positive than their actual state"] },
    { template: "What would [name]'s most brutally honest friend say about them?", options: ["They give more than they should and resent it silently", "They're afraid of being alone more than they'll ever admit", "They self-sabotage when things start going too well", "They use humor to deflect from actually dealing with things"] },
    { template: "What is [name] performing right now that they wish they could stop?", options: ["Pretending to be okay when they're clearly not", "Acting like they don't need help when they desperately do", "Faking interest in things that bore them completely", "Being agreeable when they have strong opposing opinions"] },
    { template: "What keeps [name] up at night that they've never told anyone?", options: ["A fear about their health that they haven't checked", "A worry about whether they're actually lovable", "A memory that plays on repeat and they can't shut off", "A feeling that time is running out to do what they really want"] },
    { template: "What's the cruelest thing someone has said to [name] that stuck?", options: ["Something about their appearance or body", "Something about their intelligence or capability", "Something about their personality or character", "Something that questioned whether they were loved or wanted"] },
    { template: "What would [name] admit they need more of in their life?", options: ["Genuine affection and physical touch", "Someone who truly listens and understands them", "Discipline and structure to reach their potential", "Permission to rest and not be productive all the time"] },
    { template: "What relationship has [name] outgrown but is afraid to leave?", options: ["A friendship that no longer serves them", "A romantic relationship that ran its course", "A family dynamic that's holding them back", "A professional or work situation they're too comfortable in"] },
    { template: "What has [name] sacrificed for someone who didn't deserve it?", options: ["Their time, energy, and emotional bandwidth", "Money they couldn't really afford to give", "Their own happiness and peace of mind", "An opportunity they'll never get back"] },
    { template: "What's the real reason [name]'s last relationship ended?", options: ["They weren't fully in love and finally admitted it", "Trust was broken in a way that couldn't be repaired", "They were too focused on themselves to be a good partner", "The other person outgrew them, or they outgrew the person"] },
    { template: "What unresolved issue is [name] pretending doesn't exist?", options: ["A health concern they keep putting off", "A financial situation that's slowly getting worse", "An emotional wound from childhood or family", "A friendship that's dying and neither person is addressing it"] },
    { template: "What does [name] think about when they look in the mirror honestly?", options: ["Mostly positive, they've grown to like what they see", "Critical, always finding something to fix", "It depends on the day, wildly inconsistent", "They avoid really looking, it brings up too much"] },
    { template: "What truth bomb would [name] drop if there were zero social consequences?", options: ["Their real opinion about someone close to them", "That they disagree with a popular stance in their friend group", "Something about themselves they've been hiding", "An honest assessment of where they are in life versus where they expected to be"] },
    { template: "What's the biggest lie [name] has told a partner?", options: ["That they were fine when they were falling apart", "That they didn't care when they cared deeply", "About where they were or who they were with", "That they'd already moved on from someone"] },
    { template: "Who would [name] cut out of their life if there were zero consequences?", options: ["A family member who drains them", "A friend they've outgrown", "Someone from their past they can't shake", "Honestly, no one, they'd keep them all"] },
    { template: "What has [name] never forgiven someone for?", options: ["A betrayal that changed everything", "Being abandoned when they needed help", "A cruel thing said that still stings", "A promise broken at the worst time"] },
    { template: "What's the hardest truth about [name]'s friendships?", options: ["Some are more one-sided than they admit", "They've outgrown people they won't let go of", "They're the one who reaches out every time", "They hide their real self even with friends"] },
    { template: "What relationship pattern does [name] keep repeating but won't admit?", options: ["Chasing people who can't commit", "Losing themselves in the other person", "Leaving before they can be left", "Ignoring red flags until it's too late"] },
    { template: "What would a past partner warn a new one about [name]?", options: ["They shut down when things get hard", "They need constant reassurance", "They keep score quietly", "They struggle to truly open up"] },
    { template: "What has [name] done purely for validation?", options: ["Stayed in something toxic to be wanted", "Changed themselves to fit in", "Chased attention they didn't really want", "Said yes when they desperately meant no"] },
    { template: "What friendship does [name] secretly want to end?", options: ["One that's become all take, no give", "One built on who they used to be", "One that constantly stresses them out", "One where they feel judged, not supported"] },
    { template: "What's [name]'s biggest fear about being truly known?", options: ["That people would leave if they saw it all", "That they're less interesting than they seem", "That their darkness would scare people off", "That they'd be a burden if fully honest"] },
    { template: "What moment made [name] realize they'd changed?", options: ["Reacting calmly where they once would've exploded", "Walking away from something they'd have clung to", "No longer wanting what they used to chase", "Feeling like a stranger in an old setting"] },
    { template: "What's the worst thing [name] has said in anger?", options: ["Something that hit a person's deepest insecurity", "A threat to leave they didn't mean", "A cruel truth timed to wound", "Something they can never fully take back"] },
    { template: "How does [name] really feel about a friend's big success?", options: ["Genuinely happy, no bitterness", "Proud but privately a little envious", "Motivated but quietly insecure", "It stings more than they'd ever admit"] },
    { template: "What secret standard does [name] quietly judge partners by?", options: ["How they treat people who can't help them", "Their ambition and drive", "How they handle conflict", "Whether they'd fit into their future"] },
    { template: "What would [name] confess only on their deathbed?", options: ["Who they really loved most", "A secret they carried their whole life", "A regret they never made peace with", "How proud they were of certain people"] },
    { template: "What does [name] envy most about a sibling or close friend?", options: ["How easily good things come to them", "Their confidence and self-assurance", "Their relationships or family life", "How little they seem to worry"] },
    { template: "When was [name] the red flag in a relationship?", options: ["When they were emotionally unavailable", "When they were jealous or controlling", "When they took more than they gave", "When they led someone on"] },
    { template: "What has [name] done that they still can't fully justify?", options: ["Hurt someone to protect themselves", "Walked away without an explanation", "Kept a secret that wasn't theirs to keep", "Chose the easy path over the right one"] },
    { template: "How honest is [name] with the people closest to them?", options: ["Mostly honest, but they hold back the deep stuff", "Brutally honest, sometimes too much", "They soften the truth to keep the peace", "Less honest than anyone realizes"] },
    { template: "What would [name] secretly change about a loved one?", options: ["How they handle their own problems", "How much time they give to others", "A habit that quietly drives them up the wall", "How much they listen versus talk"] },
    { template: "What's [name]'s biggest form of self-sabotage?", options: ["Blowing things up when they get too good", "Procrastinating on what matters most", "Pushing people away when they get close", "Talking themselves out of every chance"] },
    { template: "Who does [name] think about that they know they shouldn't?", options: ["An ex they never fully got over", "Someone unavailable or taken", "A friend they secretly caught feelings for", "A version of a person that doesn't exist anymore"] },
    { template: "What version of themselves is [name] most ashamed of?", options: ["Who they were during their lowest point", "How they treated people back then", "The person they became to survive something", "The one who gave up too easily"] },
    { template: "What does [name] hide even from their closest friends?", options: ["How much they're actually struggling", "A part of their past they've rewritten", "How lonely they feel sometimes", "How insecure they really are"] },
    { template: "What lie does [name] tell themselves most often?", options: ["'I'm fine, I don't need anyone'", "'I'll deal with it later'", "'It doesn't bother me'", "'I'm happy with where I am'"] },
    { template: "What is [name] the most defensive about?", options: ["Their life choices and direction", "How they handle their relationships", "Their past mistakes", "Whether they're actually happy"] },
    { template: "What has [name] done that would change how people see them?", options: ["A decision made purely out of fear", "A betrayal they've never confessed", "Something desperate during a hard time", "A side of themselves they keep hidden"] },
    { template: "How does [name] really feel about where they are in life?", options: ["Proud but afraid it won't last", "Behind where they expected to be", "Content but quietly restless", "Lost and pretending they're not"] },
    { template: "What relationship would [name] redo entirely if they could?", options: ["The one they ruined themselves", "The one they stayed in too long", "The one they ended too soon", "The one they never had the courage to start"] },
    { template: "What does [name] wish they could take back the most?", options: ["Words said in a moment of anger", "A goodbye they never gave properly", "Trust they gave to the wrong person", "Time wasted on the wrong things"] },
    { template: "What's the most uncomfortable thing [name] knows about themselves?", options: ["That they can be selfish when scared", "That they crave approval more than they admit", "That they hurt people to feel in control", "That they're afraid of being ordinary"] },
    { template: "What does [name] resent about a parent but never says?", options: ["The pressure and expectations they carried", "The affection they didn't get enough of", "The comparisons to someone else", "A wound from childhood still unhealed"] },
    { template: "What breaks [name]'s heart that they never talk about?", options: ["Drifting from someone they used to be close to", "Watching a loved one struggle helplessly", "A dream they quietly let die", "How fast time is slipping away"] },
    { template: "What goodbye does [name] never got to say?", options: ["To someone who passed too soon", "To a friend who just disappeared", "To a relationship that ended abruptly", "To a version of their life that's gone"] },
    { template: "What is [name] avoiding facing about their future?", options: ["Whether their current path is right", "A big decision they keep postponing", "That they need to make a hard change", "Fears about getting older"] },
    { template: "What's the most selfish choice [name] has made recently?", options: ["Prioritizing themselves over someone's needs", "Backing out of a commitment last minute", "Keeping quiet when honesty would've cost them", "Taking more than their fair share"] },
    { template: "What does [name] pretend not to notice about themselves?", options: ["That they push people away first", "That they seek out drama they claim to hate", "That they never really rest or slow down", "That they're harder on themselves than anyone"] },
    { template: "What's the harshest thing [name] believes but would never say out loud?", options: ["About a friend's life choices", "About a family member's behavior", "About someone's relationship", "About the direction of their whole friend group"] },
    { template: "What would devastate [name] to hear a loved one say?", options: ["'You've changed, and not for the better'", "'I don't think you really know me'", "'I needed you and you weren't there'", "'I'm disappointed in who you became'"] },
    { template: "What's the pettiest reason [name] has ended a friendship?", options: ["Feeling consistently second-choice", "One unforgivable comment", "Growing tired of always being the giver", "A slight they never fully explained"] },
    { template: "What does [name] do that they'd be ashamed for their partner to see?", options: ["How they act when they're truly alone", "How they talk when they're really upset", "A habit they hide completely", "How much they overthink the relationship"] },
    { template: "What's [name]'s most guarded secret about their past?", options: ["A relationship no one knew about", "A time they hit rock bottom", "Something they did they're not proud of", "A version of themselves they buried"] },
    { template: "What emotion does [name] mask with humor the most?", options: ["Deep sadness underneath the jokes", "Anger they don't feel safe showing", "Fear of not being enough", "Loneliness they won't name"] },
    { template: "What's the hardest apology [name] still owes someone?", options: ["To a friend they let down", "To a family member they hurt", "To an ex they treated badly", "To themselves, honestly"] },
    { template: "What does [name] secretly believe they deserve but won't ask for?", options: ["More love and affection", "Recognition for how hard they try", "Rest without guilt", "To put themselves first for once"] },
    { template: "What's the most honest thing [name] has never admitted about a friendship?", options: ["That it's become an obligation", "That they envy that friend", "That they've felt replaced", "That they'd struggle without it"] },
    { template: "What does [name] fear people would think if they knew the real them?", options: ["That they're too much to handle", "That they're not who they seem", "That they're secretly falling apart", "That they're colder than they let on"] },
    { template: "What's the darkest thought [name] has had about their own life?", options: ["That they're running out of time", "That they've disappointed everyone", "That they're not living their real life", "That no one truly knows them"] },
    { template: "What would [name] never want a partner to read?", options: ["Old messages with someone else", "Their unfiltered private thoughts", "What they wrote during a low point", "Their honest doubts about the relationship"] },
    { template: "What's the biggest gap between how [name] seems and how they feel?", options: ["Confident outside, anxious inside", "Happy outside, exhausted inside", "Strong outside, fragile inside", "Social outside, lonely inside"] },
    { template: "What relationship truth is [name] avoiding right now?", options: ["That they've been settling", "That the spark has faded", "That they want different things", "That they're staying out of fear"] },
    { template: "What's the meanest thing [name] has done and gotten away with?", options: ["Quietly turned people against someone", "Said something calculated to wound", "Let someone else take the fall", "Withheld the truth to keep the upper hand"] },
    { template: "What does [name] envy in the person they compare themselves to most?", options: ["Their confidence and ease", "Their success and status", "Their relationships and support", "How happy they always seem"] },
    { template: "What's the loneliest [name] has ever felt, that they never told anyone?", options: ["Surrounded by people who didn't know them", "During a relationship, not a breakup", "Right when things looked perfect from outside", "In a moment they were supposed to be celebrating"] },
    { template: "What does [name] regret not saying to someone?", options: ["'I love you', before it was too late", "'I'm sorry', when it mattered most", "'I forgive you', to let it go", "'Please stay', when they left"] },
    { template: "What's the harshest judgment [name] holds about their own choices?", options: ["That they played it too safe", "That they hurt people to protect themselves", "That they wasted years on the wrong things", "That they keep repeating old mistakes"] },
    { template: "What would [name] confess if they knew they'd be forgiven?", options: ["A lie they told someone they love", "A jealousy they've hidden for years", "A boundary they crossed", "How they really feel about someone close"] },
    { template: "What's [name]'s most uncomfortable relationship with the truth?", options: ["They lie to avoid conflict", "They hide feelings to seem unbothered", "They bend the truth to protect people", "They struggle to even be honest with themselves"] },
    { template: "What secret does [name] carry that affects how they love?", options: ["A betrayal that broke their trust", "A fear of being abandoned again", "A belief they're not truly lovable", "A wound they've never let heal"] },
    { template: "What's the hardest thing for [name] to admit about their family?", options: ["That the relationship is complicated", "That they're still hurt by the past", "That they keep their distance on purpose", "That they crave their approval anyway"] },
    { template: "What does [name] do to sabotage things going too well?", options: ["Pick a fight out of nowhere", "Convince themselves it won't last", "Emotionally check out preemptively", "Find a flaw to focus on"] },
    { template: "What's the most honest answer [name] would give about their happiness?", options: ["Happier than before, but not fully there", "Faking it more than they let on", "Content in the small things, lost in the big ones", "Genuinely good, and afraid to jinx it"] },
    { template: "What would [name] be terrified to say to their closest friend?", options: ["That they've felt taken for granted", "That they're secretly struggling", "That they've grown apart", "That they need more from the friendship"] },
    { template: "What's the deepest insecurity [name] hides behind a joke?", options: ["That they're not smart enough", "That they're not attractive enough", "That they're not truly wanted", "That they're falling behind everyone"] },
    { template: "What choice does [name] quietly regret every day?", options: ["A relationship they let go of", "A path they didn't take", "A person they didn't fight for", "A version of themselves they abandoned"] },
    { template: "What's the truth [name] would tell an ex if there were no consequences?", options: ["'You hurt me more than you know'", "'I still think about you sometimes'", "'I was wrong, and I'm sorry'", "'I dodged something by leaving'"] },
    { template: "What does [name] resent themselves for the most?", options: ["Not standing up for themselves sooner", "Letting fear make their decisions", "Hurting people who didn't deserve it", "Wasting time being someone they weren't"] },
    { template: "What's the one thing [name] hopes no one ever brings up?", options: ["An embarrassing chapter of their past", "A relationship that ended badly", "A mistake with lasting consequences", "A side of themselves they've hidden"] },
    { template: "What's the most vulnerable thing [name] rarely lets anyone see?", options: ["Them crying or falling apart", "Them asking for help", "Them admitting they were wrong", "Them saying they're scared"] },
    { template: "What's the honest reason [name] keeps some people at a distance?", options: ["They've been burned before", "They're afraid of being truly seen", "They don't trust easily anymore", "They protect their peace above all"] },
    { template: "What does [name] pretend to be over but still quietly grieves?", options: ["A relationship that shaped them", "A friendship that faded", "A dream that didn't happen", "A version of their life that changed"] },
    { template: "What's [name]'s most private fear about their relationships?", options: ["Being left once someone really knows them", "Never finding someone who stays", "Loving harder than they're loved", "Ending up alone"] },
    { template: "What would [name] admit only in the dark to someone they trust?", options: ["How scared they are of the future", "How much they doubt themselves", "How badly they want to be chosen", "How tired they are of holding it together"] },
    { template: "What's the least flattering thing that's completely true about [name]?", options: ["They can be quietly jealous", "They avoid what they should face", "They put up walls too fast", "They need more validation than they admit"] },
    { template: "What does [name] wish they could stop caring about?", options: ["What everyone else thinks of them", "Comparing their life to others", "Being liked by everyone", "An ex or old relationship"] },
    { template: "What's the hardest chapter of [name]'s life they never discuss?", options: ["A period of real loss", "A time they lost themselves completely", "A relationship that broke them", "A struggle they faced totally alone"] },
    { template: "What truth about themselves is [name] still not ready to face?", options: ["That they need to make a big change", "That they're not as okay as they act", "That they've been settling for less", "That they're the pattern in their own problems"] },
    { template: "What's the boldest confession [name] has locked away?", options: ["Feelings for someone they can't have", "A secret that would shift everything", "How they truly feel about their situation", "A dream they're afraid to say out loud"] },
    { template: "What does [name] secretly hope people never figure out?", options: ["How much they overthink everything", "How insecure they really are", "How different they are behind closed doors", "How much they crave connection"] },
    { template: "What's the most brutally honest thing [name] would say about their own love life?", options: ["They keep choosing the wrong people", "They're afraid to be fully seen", "They give too much and get too little", "They're lonelier than they let on"] },
    { template: "What guilt does [name] carry that no one knows about?", options: ["Hurting someone who trusted them", "Not being there when it counted", "A lie that spiraled out of control", "Walking away without an explanation"] },
    { template: "What's the honest state of [name]'s hardest relationship right now?", options: ["Hanging on by a thread", "Better in public than in private", "Quietly falling apart", "Complicated but worth fighting for"] },
    { template: "What does [name] most fear people would say about them behind their back?", options: ["That they've changed, and not for the better", "That they're fake or two-faced", "That they're difficult to be around", "That they're not who they pretend to be"] },
    { template: "What's the truth [name] softens the most for other people?", options: ["How they really feel about someone's choices", "That they're hurt when they say they're fine", "That they disagree but stay quiet", "That they've reached their limit"] },
    { template: "What would [name] never forgive themselves for?", options: ["Hurting someone irreparably", "Missing a last chance with someone", "Giving up on a dream too soon", "Becoming the thing they feared"] },
    { template: "What's the loneliest truth about [name]'s inner life?", options: ["No one sees how hard they're working to be okay", "They feel unknown even when surrounded", "They carry more than they ever show", "They comfort everyone but have no one for themselves"] },
    { template: "What does [name] secretly need to hear but never asks for?", options: ["'I'm proud of you'", "'You're enough, just as you are'", "'It's okay to not be okay'", "'I'm not going anywhere'"] },
    { template: "What's the hardest thing for [name] to be honest about with a partner?", options: ["What they actually need", "When they're not okay", "A doubt they've been sitting on", "That they were wrong"] },
    { template: "What's the most revealing thing about [name]'s reaction to conflict?", options: ["They shut down and go silent", "They lash out then regret it", "They over-apologize to end it fast", "They disappear rather than face it"] },
    { template: "What does [name] envy about people who seem carefree?", options: ["Their ability to not overthink", "Their comfort in their own skin", "How lightly they carry problems", "Their freedom from other people's opinions"] },
    { template: "What's the truest thing [name] would write in an anonymous diary entry today?", options: ["'I'm more tired than I let on'", "'I miss who I used to be'", "'I'm scared I'm on the wrong path'", "'I just want to feel understood'"] },
    { template: "What's the last thing [name] would ever want read aloud?", options: ["A message they sent in a weak moment", "Their honest thoughts about a friend", "A confession they've never made", "Their private fears about themselves"] },
    { template: "What does [name] hold against a family member that they've never voiced?", options: ["A comparison that always stung", "A time they weren't protected", "Conditional love that shaped them", "A wound that never got an apology"] },
    { template: "What's the most honest reason [name] holds back in relationships?", options: ["Fear of getting hurt again", "Fear of being too much", "Fear of not being chosen", "Fear of losing themselves"] },
    { template: "What's the version of the truth [name] tells versus the real one?", options: ["'I'm busy' really means 'I'm avoiding it'", "'I'm fine' really means 'I'm not'", "'It's whatever' really means 'it hurts'", "'I don't mind' really means 'I do'"] },
    { template: "What does [name] secretly wish they'd done differently in their last relationship?", options: ["Communicated instead of shutting down", "Left sooner than they did", "Fought harder to make it work", "Been more honest about their needs"] },
    { template: "What's the most private way [name] copes when everything feels heavy?", options: ["Isolating so no one sees the crack", "Keeping busy to outrun the feeling", "Crying alone where no one hears", "Pretending online that it's all fine"] },
    { template: "What does [name] most fear is true about themselves?", options: ["That they're hard to love", "That they'll never truly change", "That they push people away", "That they're not living up to their potential"] },
    { template: "What's the truth [name] would only share at 3 AM with someone they trust?", options: ["Who still lives in their head", "What they're really afraid of", "What they'd change if they could start over", "How much they've been holding in"] },
    { template: "What does [name] quietly grieve about growing up?", options: ["Friendships that faded with time", "The freedom of having no worries", "People who aren't around anymore", "The version of themselves they left behind"] },
    { template: "What would [name] confess if the whole room promised not to judge?", options: ["Who they actually have feelings for", "A secret they've never told a soul", "What they really think of someone here", "How much they're struggling right now"] },
    { template: "What's the hardest truth [name] has learned about themselves?", options: ["That they can be their own worst enemy", "That they seek out what hurts them", "That they hide instead of healing", "That they need people more than they admit"] },
    { template: "What does [name] regret about how they handled a friendship?", options: ["Letting it fade without a fight", "Saying something they can't take back", "Being distant when their friend needed them", "Taking the friendship for granted"] },
    { template: "What's the most honest thing [name] feels about their own worth?", options: ["It depends way too much on others", "They're still learning to believe in it", "They fake certainty they don't feel", "It's stronger than it used to be"] },
    { template: "What relationship does [name] stay in mostly out of fear?", options: ["A romantic one they've outgrown", "A friendship built on history alone", "A family tie that drains them", "A comfortable rut they can't leave"] },
    { template: "What would surprise people most about [name]'s inner world?", options: ["How deeply they feel everything", "How much they doubt themselves", "How dark their humor really is", "How much they crave to be known"] },
    { template: "What's the truth [name] avoids by staying busy?", options: ["That they're not truly happy", "That they're lonely", "That they're avoiding a decision", "That they need to slow down and feel it"] },
    { template: "What does [name] wish they could apologize for without it being weird?", options: ["Pulling away when someone got close", "Something they said years ago", "Not showing up when it counted", "Being colder than they meant to be"] },
    { template: "What's the most vulnerable thing [name] believes about love?", options: ["That they're scared they'll never find it", "That they love harder than they're loved", "That they don't fully believe they deserve it", "That they'd give up almost anything for it"] },
    { template: "What's the honest reason [name] hasn't let go of something?", options: ["It's tied to who they used to be", "Letting go feels like admitting defeat", "They're not ready to face the loss", "A small part still hopes it comes back"] },
    { template: "What's the deepest fear [name] has about their friendships lasting?", options: ["That people will drift once life gets busy", "That they'll be the one left behind", "That the closeness was never mutual", "That they'll grow apart and not notice"] },
    { template: "What's the most honest thing [name] would admit about needing people?", options: ["They need them far more than they show", "They're terrified of depending on anyone", "They push away the ones they need most", "They'd rather struggle than ask for help"] },
    { template: "What truth would [name] whisper if they knew it stayed in this room forever?", options: ["Who they'd choose if they could", "What they'd change about their life", "The secret they've carried the longest", "How they really feel, underneath it all"] },
    { template: "What is the boldest move [name] has ever made on a crush?", options: ["Confessed out of nowhere", "Made the first move with a kiss", "Slid into their messages fearlessly", "Nothing, they always chicken out"] },
    { template: "What is [name]'s most irresistible quality?", options: ["That confident smile", "The way they hold eye contact", "Their quick, teasing wit", "A calm that draws people in"] },
    { template: "What secretly makes [name] weak in the knees?", options: ["A low, quiet voice", "Someone great with their hands", "Effortless confidence", "Being genuinely listened to"] },
    { template: "What is the flirtiest thing [name] does without realizing?", options: ["Bites their lip mid-conversation", "Leans in a little too close", "Holds eye contact too long", "Laughs at everything you say"] },
    { template: "What kind of attention does [name] secretly crave?", options: ["Being pursued relentlessly", "Slow, simmering tension", "Bold public admiration", "Quiet, undivided focus"] },
    { template: "What is [name]'s biggest weakness in someone attractive?", options: ["A sharp sense of humor", "Dangerous confidence", "A soft, caring side", "Mystery they can't crack"] },
    { template: "What would make [name] blush instantly?", options: ["An unexpected compliment", "Being caught staring", "A bold flirty line", "Someone remembering a tiny detail"] },
    { template: "What is the most daring text [name] has ever sent?", options: ["A confession at 2am", "Something they instantly regretted", "A bold invitation", "They keep it very tame"] },
    { template: "What kind of flirting works best on [name]?", options: ["Playful teasing", "Smooth confidence", "Sweet and sincere", "Slow-burning tension"] },
    { template: "What is [name]'s tell when they are attracted to someone?", options: ["They get suddenly shy", "They can't stop teasing", "They find reasons to be near", "They go unusually quiet"] },
    { template: "What is the riskiest crush [name] has ever had?", options: ["On someone completely off-limits", "On a close friend", "On someone way out of reach", "They keep those locked away"] },
    { template: "What makes [name] instantly more attractive to others?", options: ["Their easy confidence", "The way they carry themselves", "A wicked sense of humor", "How kind they are"] },
    { template: "What is [name]'s signature flirty move?", options: ["A slow smile and eye contact", "A well-timed tease", "A light touch on the arm", "Genuine, focused attention"] },
    { template: "What would [name] do if a stranger boldly flirted with them?", options: ["Flirt right back with ease", "Get flustered and shy", "Play it cool but secretly love it", "Shut it down politely"] },
    { template: "What is the boldest thing [name] has done to get someone's attention?", options: ["Made a dramatic first move", "Dressed to absolutely stun", "Engineered a run-in", "Nothing, they wait to be noticed"] },
    { template: "What secretly turns [name]'s head every time?", options: ["Confidence without arrogance", "A great laugh", "Someone good with words", "Quiet intensity"] },
    { template: "What is [name] like when they have a serious crush?", options: ["A giddy, obvious mess", "Cool and mysterious", "Bold and forward", "Nervous and overthinking"] },
    { template: "What is the most forward thing [name] has whispered to someone?", options: ["A daring little confession", "A bold invitation", "Something to make them blush", "They keep their cards close"] },
    { template: "What draws people to [name] the fastest?", options: ["Their magnetic energy", "That confident smile", "How easy they are to talk to", "A hint of mystery"] },
    { template: "What is [name]'s reaction to being called attractive to their face?", options: ["Owns it with a grin", "Deflects and blushes", "Fires a bold line back", "Gets adorably flustered"] },
    { template: "What kind of tension does [name] secretly love?", options: ["The will-they-won't-they kind", "Playful banter that builds", "A slow, quiet pull", "Bold, undeniable chemistry"] },
    { template: "What is the most spontaneous romantic thing [name] would do?", options: ["Kiss someone in the rain", "Book a surprise getaway", "Confess feelings on the spot", "Dance in the middle of nowhere"] },
    { template: "What is [name]'s biggest giveaway that they like someone?", options: ["Constant not-so-subtle glances", "Suddenly funnier around them", "Finding excuses to text", "Getting weirdly nervous"] },
    { template: "What would [name] do on a dare to kiss someone?", options: ["Go for it without blinking", "Blush and hesitate", "Make it a whole moment", "Refuse and change the subject"] },
    { template: "What is the most charming thing about [name] up close?", options: ["Their eyes when they smile", "The way they say your name", "That confident calm", "How present they are"] },
    { template: "What kind of flirt is [name], deep down?", options: ["A bold, direct one", "A shy, subtle one", "A playful tease", "A smooth, effortless one"] },
    { template: "What is [name]'s most daring dating-app move?", options: ["A bold, unforgettable opener", "A confident first-move invite", "A cheeky joke to break the ice", "They never message first"] },
    { template: "What makes [name] catch a spark with someone new?", options: ["Instant banter that clicks", "A look that lingers", "Shared wicked humor", "An easy, magnetic vibe"] },
    { template: "What is the boldest outfit choice [name] has made to impress?", options: ["Something daringly eye-catching", "Their sharpest look ever", "A total transformation", "They keep it classic"] },
    { template: "What does [name] do when the chemistry is undeniable?", options: ["Leans right into it", "Plays it cool to build tension", "Gets nervous and giddy", "Makes the first bold move"] },
    { template: "What is [name]'s secret weapon when they want someone?", options: ["Unshakable confidence", "Killer eye contact", "Perfectly timed teasing", "Making them feel like the only one"] },
    { template: "What would make [name] fall for someone fast?", options: ["A bold, confident chase", "Someone who matches their wit", "A slow, sincere pursuit", "Chemistry they can't explain"] },
    { template: "What is the flirtiest compliment [name] loves to receive?", options: ["That their smile is dangerous", "That they're impossible to ignore", "That they have magnetic energy", "That they light up a room"] },
    { template: "What is [name] like on a first date they're really into?", options: ["Turning on all their charm", "Nervous but glowing", "Bold and a little flirty", "Sweet and totally genuine"] },
    { template: "What is [name]'s reaction to a surprise kiss?", options: ["Melts and leans in", "Freezes then grins", "Kisses right back boldly", "Blushes for an hour"] },
    { template: "What is the boldest way [name] has shot their shot?", options: ["A direct confession", "A daring invitation", "A move nobody saw coming", "They've never dared to"] },
    { template: "What quality in a person makes [name] lose their cool?", options: ["Sharp, quick wit", "Effortless confidence", "A soft, tender side", "Bold, unapologetic honesty"] },
    { template: "What is [name]'s most magnetic feature in a crowd?", options: ["Their confident presence", "A laugh you can hear across the room", "The way they light up talking", "A quiet, intriguing calm"] },
    { template: "What would [name] do if their crush confessed first?", options: ["Play it cool, then celebrate", "Get giddy and shy", "Confess right back boldly", "Barely believe it's real"] },
    { template: "What is the cheekiest thing [name] has done to flirt?", options: ["A daring wink across the room", "A bold, teasing note", "A too-forward compliment", "Stealing a bite off their plate"] },
    { template: "What makes [name] instantly intrigued by someone?", options: ["A little bit of mystery", "Bold self-assurance", "A clever comeback", "An unexpected soft side"] },
    { template: "What is [name] like when they're the one being pursued?", options: ["Secretly loves every second", "Plays hard to get", "Gets shy and awkward", "Enjoys it but stays guarded"] },
    { template: "What is [name]'s go-to look when they want to turn heads?", options: ["Sharp and confident", "Effortlessly cool", "Boldly eye-catching", "Simple but striking"] },
    { template: "What is the most flirtatious thing [name] does with their eyes?", options: ["A slow, deliberate glance", "Holding eye contact too long", "A playful wink", "Looking away and back"] },
    { template: "What kind of admirer would fluster [name] the most?", options: ["A bold, direct one", "A smooth, mysterious one", "A sweet, persistent one", "A funny, teasing one"] },
    { template: "What is [name]'s reaction to catching someone checking them out?", options: ["Holds the gaze confidently", "Looks away, secretly thrilled", "Flashes a knowing smile", "Pretends not to notice"] },
    { template: "What would [name] do to make a memorable first impression?", options: ["Lead with bold charm", "Drop a perfect line", "Dress to leave a mark", "Just be effortlessly themselves"] },
    { template: "What is the daring thing [name] secretly wishes they'd say to a crush?", options: ["I've liked you for ages", "Let's get out of here", "You have no idea, do you", "You're all I think about"] },
    { template: "What is [name]'s biggest weakness when someone flirts back?", options: ["They completely lose their cool", "They get bolder and bolder", "They turn shy instantly", "They can't stop smiling"] },
    { template: "What kind of chemistry does [name] chase?", options: ["The instant, electric kind", "The slow-building kind", "The banter-fueled kind", "The deep, quiet kind"] },
    { template: "What is the most confident thing [name] has done in dating?", options: ["Asked someone out cold", "Made the first move first", "Owned a bold outfit", "Shut down someone who wasn't worth it"] },
    { template: "What would make [name] flirt back the hardest?", options: ["Being matched in wit", "A bold, confident approach", "Genuine interest in them", "A little playful challenge"] },
    { template: "What is [name]'s tell that the flirting is working?", options: ["They get louder and funnier", "They go quiet and shy", "They lean way in", "They start teasing right back"] },
    { template: "What is the riskiest text [name] would send at midnight?", options: ["A bold confession", "An invitation to come over", "Something too honest", "A very tame goodnight"] },
    { template: "What makes [name] the most nervous around someone they like?", options: ["Saying the wrong thing", "Being too obvious", "Losing their usual cool", "Any moment of silence"] },
    { template: "What is [name]'s idea of the perfect flirty banter?", options: ["Fast, witty back-and-forth", "Teasing with a soft edge", "Bold lines that land", "Playful challenges"] },
    { template: "What would [name] do if two people were interested in them at once?", options: ["Enjoy the attention shamelessly", "Panic and overthink it", "Follow their gut fast", "Feel guilty and go slow"] },
    { template: "What is the boldest compliment [name] has ever given?", options: ["That someone stole their breath", "That they can't stop staring", "A line too smooth to be real", "They keep compliments shy"] },
    { template: "What is [name] secretly a sucker for?", options: ["Someone who chases confidently", "A slow, lingering look", "Being someone's obvious favorite", "A voice that gets them"] },
    { template: "What is [name]'s move when they want to close the distance?", options: ["A bold, direct step", "A slow, teasing lean-in", "A perfectly timed line", "They wait for the other to move"] },
    { template: "What kind of flirt makes [name] roll their eyes but secretly love it?", options: ["A cheesy pickup line", "Over-the-top confidence", "Relentless teasing", "Grand dramatic gestures"] },
    { template: "What is the most head-turning thing about [name]?", options: ["Their confidence", "That killer smile", "How they command a room", "A magnetic, easy charm"] },
    { template: "What would [name] do on a spontaneous date night?", options: ["Chase the most thrilling idea", "Keep it cozy and close", "Let the other person lead", "Turn it into an adventure"] },
    { template: "What is [name]'s biggest flirting fail?", options: ["A line that fell flat", "Getting caught mid-stare", "Overthinking into silence", "Laughing way too hard"] },
    { template: "What is the boldest place [name] has flirted with someone?", options: ["Right in front of friends", "Somewhere they shouldn't have", "Across a crowded room", "They keep it low-key"] },
    { template: "What makes [name] feel most desired?", options: ["Being pursued with real effort", "A look that says it all", "Being bragged about", "Undivided attention"] },
    { template: "What is [name]'s reaction to a slow dance with someone they like?", options: ["Pulls them closer", "Turns to blushing mush", "Leads with confidence", "Barely breathes the whole time"] },
    { template: "What would make [name] chase someone relentlessly?", options: ["A challenge they can't resist", "Undeniable chemistry", "A little mystery", "Being matched in every way"] },
    { template: "What is the boldest thing [name] would whisper on a date?", options: ["Something to make them shiver", "A daring little secret", "That they can't wait to see them again", "They stay smooth and vague"] },
    { template: "What is [name] like when the tension finally breaks?", options: ["All in, no hesitation", "Giddy and grinning", "Bold and sure", "Nervous but thrilled"] },
    { template: "What secretly makes [name] fall harder?", options: ["Being truly seen", "A confident chase", "Effortless chemistry", "Someone who keeps them guessing"] },
    { template: "What is [name]'s reaction to being someone's obvious crush?", options: ["Basks in it entirely", "Gets shy but loves it", "Plays coy on purpose", "Flirts right back"] },
    { template: "What would [name] do to keep a spark alive?", options: ["Keep the flirting going", "Plan bold surprises", "Never stop the banter", "Keep the mystery"] },
    { template: "What is the most confident thing [name] has ever worn?", options: ["A daringly bold outfit", "Their most striking look", "Something completely their own", "Confidence itself, honestly"] },
    { template: "What is [name]'s idea of an irresistible date?", options: ["Full of thrilling risk", "Slow and intimate", "Packed with playful banter", "Deep and revealing"] },
    { template: "What is [name]'s biggest tell they've got a secret crush?", options: ["They can't stop mentioning them", "They light up at their name", "They get oddly nervous", "They deny it way too hard"] },
    { template: "What would [name] do if their crush walked in right now?", options: ["Play it impossibly cool", "Get flustered instantly", "Turn on the charm", "Find any excuse to talk to them"] },
    { template: "What is the smoothest thing [name] has ever pulled off?", options: ["A flawless first move", "A line that actually landed", "A perfectly timed save", "Nothing, they're a mess"] },
    { template: "What makes [name] the most flirty they ever get?", options: ["A drink and good company", "Undeniable chemistry", "Being teased first", "Feeling truly confident"] },
    { template: "What is [name]'s reaction to a bold confession?", options: ["Meets it head on", "Melts on the spot", "Gets shy and quiet", "Fires back something bolder"] },
    { template: "What would [name] do if sparks flew with a friend?", options: ["Lean in and see", "Panic about the friendship", "Tease it out slowly", "Confess and hope"] },
    { template: "What is the daring thing [name] does when they want a kiss?", options: ["Leans in and waits", "Says it outright", "Drops an obvious hint", "Makes the whole first move"] },
    { template: "What makes [name] absolutely swoon?", options: ["A grand romantic gesture", "A quiet, knowing look", "Being someone's whole focus", "A voice that melts them"] },
    { template: "What is [name]'s boldest form of eye contact?", options: ["A long, unbroken gaze", "A slow look up and down", "A playful wink", "Locking eyes across the room"] },
    { template: "What would make [name] break their cool exterior?", options: ["The right bold line", "Being caught off guard", "A confession they didn't expect", "Chemistry too strong to hide"] },
    { template: "What is [name]'s reaction to a flirty stranger buying them a drink?", options: ["Raises a glass with a grin", "Blushes and looks away", "Sends a bold one back", "Politely declines"] },
    { template: "What is the most spontaneous thing [name] would do for a spark?", options: ["Kiss them mid-sentence", "Whisk them off somewhere", "Confess out of nowhere", "Nothing, they overthink it"] },
    { template: "What makes [name] the object of everyone's crush?", options: ["Their confidence", "That easy charm", "A magnetic smile", "How genuine they are"] },
    { template: "What is [name] like when they finally admit a crush?", options: ["Bold and all in", "A nervous, giddy wreck", "Smooth and understated", "Adorably flustered"] },
    { template: "What would [name] do if a crush asked them to dance?", options: ["Take their hand instantly", "Turn red and stammer yes", "Lead with total confidence", "Pretend to be too cool, then cave"] },
    { template: "What is the most flirtatious message [name] has left on read?", options: ["A bold one they weren't ready for", "One too forward to answer", "A confession they froze at", "They never leave those on read"] },
    { template: "What secretly makes [name] the boldest version of themselves?", options: ["A little liquid courage", "The right kind of attention", "Being wanted first", "Undeniable chemistry"] },
    { template: "What is [name]'s move when they want to be noticed?", options: ["Command the room quietly", "Turn up the charm", "Wear something bold", "Make them laugh first"] },
    { template: "What would [name] do if their crush touched their arm?", options: ["Lean in a little closer", "Freeze and forget words", "Touch right back", "Grin and hold the moment"] },
    { template: "What is [name]'s most irresistible habit?", options: ["The way they say your name", "That slow, easy smile", "How they hold your gaze", "Making you feel like the only one"] },
    { template: "What is the boldest confession [name] has held back?", options: ["That they've always liked someone", "That one night meant everything", "That they never stopped caring", "They keep those buried deep"] },
    { template: "What would make [name] flirt with total confidence?", options: ["Knowing it's mutual", "A drink and the right vibe", "Being pursued first", "Feeling completely themselves"] },
    { template: "What is [name]'s reaction to a rival for someone's attention?", options: ["Turns up the charm to win", "Backs off gracefully", "Gets quietly competitive", "Pretends not to care at all"] },
    { template: "What is the flirtiest thing [name] has said with a straight face?", options: ["A line too smooth to be casual", "A bold, teasing dare", "Something that made them blush", "They can't keep a straight face"] },
    { template: "What makes [name] feel most confident when flirting?", options: ["Knowing they look good", "Sharp banter flowing", "A clear green light", "Being genuinely into someone"] },
    { template: "What would [name] do if the mood turned romantic fast?", options: ["Roll with it boldly", "Get nervous and giddy", "Slow it down to savor it", "Take the lead entirely"] },
    { template: "What is [name]'s secret to keeping someone interested?", options: ["A little mystery", "Nonstop playful banter", "Making them feel special", "Being unforgettable themselves"] },
    { template: "What is [name] like the moment they realize the feeling is mutual?", options: ["Bold and unstoppable", "Grinning like a fool", "Smooth on the outside, chaos inside", "Suddenly shy"] },
    { template: "What would make [name] blush harder than anything?", options: ["Being called irresistible", "A bold public flirt", "Being caught daydreaming about someone", "A too-honest compliment"] },
    { template: "What is the daring thing [name] would do on a rooftop date?", options: ["Steal a kiss under the stars", "Confess how they feel", "Dance with no music", "Just soak in the moment"] },
    { template: "What is [name]'s flirtiest reaction to a compliment?", options: ["A bold thanks and a wink", "A shy, glowing smile", "An even bigger one back", "Pretending to brush it off"] },
    { template: "What would [name] do if left alone with their crush?", options: ["Make the most of every second", "Turn into a nervous wreck", "Steer it somewhere flirty", "Play it cool and casual"] },
    { template: "What is the boldest way [name] has ended a date?", options: ["A confident goodnight kiss", "A daring invitation for more", "A line they'd been saving", "A shy wave and a bolt"] },
    { template: "What makes [name] the most magnetic when they walk in?", options: ["Their undeniable confidence", "A look that says everything", "That easy, warm smile", "An air of quiet mystery"] },
    { template: "What is [name]'s reaction to slow, lingering eye contact?", options: ["Holds it and raises the stakes", "Looks away, heart racing", "Smirks and leans in", "Completely melts"] },
    { template: "What would [name] do to win over someone playing hard to get?", options: ["Match their energy exactly", "Chase with bold confidence", "Charm them patiently", "Give them a taste of their own game"] },
    { template: "What is the flirtiest text [name] has ever drafted but not sent?", options: ["A daring confession", "A too-forward invitation", "Something wildly honest", "They always hit send eventually"] },
    { template: "What makes [name] instantly more flirtatious?", options: ["A confident green light", "Great banter", "Feeling wanted", "The right song and mood"] },
    { template: "What is [name] like the first time they hold hands with someone new?", options: ["Bold and sure", "A giddy, nervous mess", "Smooth and easy", "Overthinking every second"] },
    { template: "What would [name] do if a crush leaned in close?", options: ["Close the gap themselves", "Freeze and blush", "Meet them halfway confidently", "Hold their breath and hope"] },
    { template: "What is [name]'s most charming reaction to being teased?", options: ["Teases twice as hard back", "Blushes and grins", "Plays it perfectly cool", "Gets adorably flustered"] },
    { template: "What secretly gives [name] butterflies every time?", options: ["A surprise compliment", "A lingering touch", "Being someone's obvious favorite", "A voice that gets to them"] },
    { template: "What is the boldest way [name] has shown interest without words?", options: ["A look that said it all", "A daring little touch", "Dressing to stun them", "Being unmistakably around a lot"] },
    { template: "What would [name] do if a crush caught them staring?", options: ["Hold the gaze boldly", "Look away, mortified", "Flash a confident smile", "Wave awkwardly and panic"] },
    { template: "What is [name]'s reaction to being someone's whole type?", options: ["Owns it with a grin", "Gets shy and thrilled", "Turns up the charm", "Barely believes it"] },
    { template: "What makes [name] the boldest flirt in the room?", options: ["A drink and confidence", "The right person watching", "Great chemistry flowing", "Feeling on top of the world"] },
    { template: "What would [name] do if sparks flew on a group trip?", options: ["Lean into it privately", "Keep it a secret game", "Flirt boldly and openly", "Panic about the group finding out"] },
    { template: "What is the most daring look [name] has given across a room?", options: ["A slow, knowing gaze", "A playful wink", "A look up and down", "A stare they couldn't hide"] },
    { template: "What is [name]'s flirtiest habit when they're really into someone?", options: ["Finding reasons to touch their arm", "Teasing them constantly", "Leaning in whenever they talk", "Locking eyes and holding it"] },
    { template: "What would [name] do if the chemistry got too intense?", options: ["Lean all the way in", "Break the tension with a joke", "Slow it down deliberately", "Get bold and make a move"] },
    { template: "What is [name]'s signature way to leave someone wanting more?", options: ["A perfectly timed exit", "A line left hanging", "A look over the shoulder", "A goodnight that lingers"] },
    { template: "What makes [name] fall for the chase?", options: ["A worthy challenge", "Bold, confident pursuit", "A hint of mystery", "Being matched at every turn"] },
    { template: "What is the boldest first move [name] would ever make?", options: ["A confident kiss", "A direct confession", "A daring invitation", "Just showing up unannounced"] },
    { template: "What is [name] like when they know someone is watching them?", options: ["Turns on the charm", "Gets a little bolder", "Pretends not to notice, secretly glowing", "Suddenly self-conscious"] },
    { template: "What would make [name] weak for someone across the bar?", options: ["A confident approach", "A smile they can't ignore", "Great eye contact", "An easy, magnetic laugh"] },
    { template: "What is [name]'s reaction to a well-timed compliment on a date?", options: ["A bold thanks and a wink", "A shy, pleased smile", "An even smoother one back", "Butterflies they can't hide"] },
    { template: "What is the flirtiest thing [name] does when nervous?", options: ["Laughs a little too much", "Teases to cover it", "Talks fast and charming", "Gets quiet and blushes"] },
    { template: "What would [name] do to signal they want a second date?", options: ["Say it outright, boldly", "Drop obvious hints", "A lingering goodbye", "Text immediately after"] },
    { template: "What makes [name] the most confident on a date?", options: ["Feeling genuinely wanted", "Sharp banter clicking", "Looking and feeling their best", "Clear mutual interest"] },
    { template: "What is [name]'s boldest reaction to a surprise flirt?", options: ["Flirts right back, unfazed", "Blushes but plays along", "Raises the stakes instantly", "Grins and holds the moment"] },
    { template: "What would [name] do if their crush complimented their smile?", options: ["Smile even bigger and hold their gaze", "Look down and blush", "Fire back a bold line", "Melt on the spot"] },
    { template: "What is the daring thing [name] secretly wants to be asked?", options: ["To get out of here together", "What they're thinking right now", "If the feeling is mutual", "To stay a little longer"] },
    { template: "What makes [name] the most irresistible on a good night?", options: ["Their unstoppable confidence", "That glowing, easy charm", "How present they are", "A boldness that draws people in"] },
    { template: "What is [name]'s move when they want to raise the tension?", options: ["A slow, deliberate look", "A teasing line left hanging", "Closing the distance a little", "A touch that lingers"] },
    { template: "What would [name] do if a date leaned in for a kiss?", options: ["Meet them without hesitation", "Freeze then melt", "Pull them closer", "Blush through the whole thing"] },
    { template: "What is [name] secretly hoping a crush will notice?", options: ["That they dressed up for them", "How much they light up around them", "Every little effort they make", "That the flirting is on purpose"] },
    { template: "What is the boldest thing [name] would do at a party to get noticed?", options: ["Own the middle of the room", "Strike up the boldest conversation", "Dress to absolutely stun", "Just wait to be approached"] },
    { template: "What makes [name] flirt back without a second thought?", options: ["Undeniable chemistry", "A confident opener", "Being teased first", "A look that lingers too long"] },
    { template: "What is [name]'s reaction to catching feelings unexpectedly?", options: ["Leans in bravely", "Panics a little first", "Plays it impossibly cool", "Gets giddy and obvious"] },
    { template: "What would [name] do on a date that's going incredibly well?", options: ["Get bolder as it goes", "Try not to grin too much", "Suggest keeping the night going", "Savor every single second"] },
    { template: "What is [name]'s most confident line when they like someone?", options: ["I've been wanting to talk to you", "You caught my eye immediately", "Let's do this again, soon", "They keep it charming and vague"] },
    { template: "What makes [name] absolutely melt on a date?", options: ["A thoughtful surprise", "A voice low and warm", "Being someone's whole focus", "A perfectly timed touch"] },
    { template: "What would [name] do if a crush saved them a seat?", options: ["Take it with a bold grin", "Blush and sit shyly", "Tease them about it", "Read way too much into it"] },
    { template: "What is the flirtiest thing [name] does in a text conversation?", options: ["Leaves a line that begs a reply", "Teases relentlessly", "Drops a bold compliment", "Keeps them guessing"] },
    { template: "What is [name] like when the flirting turns mutual?", options: ["All in, fully bold", "A grinning, giddy mess", "Smooth and sure", "Suddenly, adorably shy"] },
    { template: "What would make [name] chase after someone leaving a party?", options: ["A goodbye that felt unfinished", "One last bold line", "A number they forgot to get", "A spark too strong to ignore"] },
    { template: "What is [name]'s boldest way to break the ice with a crush?", options: ["A confident opener", "A cheeky joke", "A daring compliment", "A shared knowing look"] },
    { template: "What makes [name] the most flirtatious version of themselves?", options: ["Feeling wanted first", "The right person paying attention", "Great banter flowing", "A boost of pure confidence"] },
    { template: "What would [name] do if a crush held their gaze too long?", options: ["Hold it right back, bold", "Look away, heart pounding", "Smirk and step closer", "Completely lose their words"] },
    { template: "What is [name]'s reaction to being pursued boldly?", options: ["Loves every second of it", "Gets shy but flattered", "Chases right back", "Tests if they really mean it"] },
    { template: "What is the daring thing [name] would say to end the night perfectly?", options: ["I don't want this to end", "You should stay a while", "When can I see you again", "They let a look say it all"] },
    { template: "What makes [name] fall the hardest, the fastest?", options: ["A bold confident chase", "Chemistry that's instant", "Being truly, deeply seen", "Someone who keeps them on their toes"] },
    { template: "What would [name] do if their crush winked at them?", options: ["Wink right back, smooth", "Turn bright red instantly", "Grin and hold their stare", "Overthink it for an hour"] },
    { template: "What is [name]'s flirtiest energy in a nutshell?", options: ["Bold and unapologetic", "Sweet and shy", "Playful and teasing", "Smooth and mysterious"] },
    { template: "What is the boldest thing [name] has done to keep the spark alive?", options: ["Planned a surprise night out", "Sent a daring message", "Reignited the old banter", "Made a grand romantic gesture"] },
    { template: "What would [name] do if the chemistry was obvious to everyone?", options: ["Lean into it proudly", "Get shy about the attention", "Play it cool in public", "Flirt boldly anyway"] },
    { template: "What is [name]'s reaction to a crush remembering something small about them?", options: ["Melts entirely", "Falls a little harder", "Plays it cool while glowing", "Feels truly, deeply seen"] },
    { template: "What makes [name] impossible to ignore at a gathering?", options: ["Their magnetic confidence", "A laugh that turns heads", "An effortless charm", "A striking, bold presence"] },
    { template: "What would [name] do if someone flirted with them in front of their crush?", options: ["Use it to make them jealous", "Get flustered and awkward", "Shut it down for the crush", "Play it cool and see the reaction"] },
    { template: "What is [name]'s secret move to make a date unforgettable?", options: ["A bold spontaneous twist", "Undivided, focused attention", "Nonstop playful banter", "One perfect, daring moment"] },
    { template: "What would [name] do if a crush asked to walk them home?", options: ["Say yes without a beat", "Blush and stammer sure", "Tease them the whole way", "Play it cool but glow"] },
    { template: "What is [name]'s boldest reaction to catching a crush's eye across the room?", options: ["Raise a glass with a smile", "Look away, heart racing", "Hold it and walk over", "Wink and let them come"] },
    { template: "What makes [name] the most daring on a night out?", options: ["The right music and mood", "A confident boost of courage", "Someone worth impressing", "Great chemistry in the air"] },
    { template: "What is the flirtiest thing [name] does when they want the last word?", options: ["A teasing line and a smirk", "A wink before walking off", "A bold challenge back", "A look that says it all"] },
    { template: "What would [name] do if the tension with someone was obvious?", options: ["Name it out loud, boldly", "Let it simmer deliciously", "Break it with a joke", "Make the first move"] },
    { template: "What is [name]'s reaction to a crush saving them the last dance?", options: ["Take their hand instantly", "Blush and barely breathe", "Pull them in close", "Grin like they won the night"] },
    { template: "What makes [name] fall for a slow burn?", options: ["The delicious anticipation", "Tension that keeps building", "A pull they can't explain", "Every lingering glance"] },
    { template: "What would [name] do to make a first date memorable?", options: ["Suggest something thrilling", "Bring their boldest charm", "Keep the banter electric", "Be unforgettably themselves"] },
    { template: "What is [name]'s most confident flirting stance?", options: ["Direct and unafraid", "Smooth and mysterious", "Playful and teasing", "Warm and disarming"] },
    { template: "What would make [name] chase a spark across a whole party?", options: ["Chemistry too strong to ignore", "A look they couldn't shake", "One perfect line exchanged", "A challenge they had to answer"] },
    { template: "What is [name]'s boldest way to hint they want a kiss?", options: ["A slow lean and a pause", "Eyes dropping to their lips", "A whispered dare", "Just going for it"] },
    { template: "What makes [name] weak for a confident approach?", options: ["The nerve it takes", "Being pursued so directly", "A boldness they admire", "How rare it really is"] },
    { template: "What would [name] do if a crush called them irresistible?", options: ["Own it with a grin", "Blush and deflect", "Fire back something bolder", "Melt right on the spot"] },
    { template: "What is [name]'s flirtiest energy on a great date?", options: ["Bold and all in", "Sweet and glowing", "Teasing and playful", "Cool and magnetic"] },
    { template: "What would make [name] break the tension first?", options: ["A daring confession", "A bold, sudden move", "A perfectly timed line", "A look they couldn't hold back"] },
    { template: "What is the boldest thing [name] would text after a great first date?", options: ["I can't stop thinking about tonight", "Same time tomorrow?", "You're trouble, in the best way", "A simple, smooth let's do it again"] },
    { template: "What makes [name] the most charming when the sparks fly?", options: ["Their easy confidence", "A grin they can't hide", "Banter that never stops", "How completely present they are"] },
    { template: "What would [name] do if they and a crush were the last two awake?", options: ["Turn it into a real moment", "Get nervous and giddy", "Steer it somewhere flirty", "Savor the quiet closeness"] },
  ],
};

/* ------------------------------------------------------------------ */
/*  Game types                                                         */
/* ------------------------------------------------------------------ */
type Phase = 'setup' | 'category' | 'subject-pick' | 'pass-phone' | 'guessing' | 'reveal' | 'round-end' | 'results';

interface Player {
  name: string;
  score: number;
  correctGuesses: number;
  timesGuessedWrong: number;
}

interface RoundState {
  subjectIndex: number;
  questionIndex: number;
  subjectAnswer: number | null;
  guesses: Record<number, number>;
  revealed: boolean;
}

/* ------------------------------------------------------------------ */
/*  Shuffle utility                                                    */
/* ------------------------------------------------------------------ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
  duo?: { me: string; them: string } | null;
}

export default function GuessWhat({ onBack, onGameEnd, duo }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([{ name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }, { name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }]);
  const [category, setCategory] = useState<Category | null>(null);
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [questionCursor, setQuestionCursor] = useState(0);
  const [round, setRound] = useState<RoundState>({ subjectIndex: 0, questionIndex: 0, subjectAnswer: null, guesses: {}, revealed: false });
  const [currentGuesser, setCurrentGuesser] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [totalRoundsPerPlayer] = useState(3);
  const [subjectRoundCount, setSubjectRoundCount] = useState(0);
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);
  const [revealAnim, setRevealAnim] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const pairStats = useRef<Record<string, { correct: number; total: number }>>({});

  const totalRounds = players.length * totalRoundsPerPlayer;
  const currentQuestion = questionPool[questionCursor] || null;

  /* ---- Setup helpers ---- */
  const addPlayer = () => {
    if (players.length < 4) setPlayers(p => [...p, { name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }]);
  };
  const removePlayer = (i: number) => {
    if (players.length > 2) setPlayers(p => p.filter((_, idx) => idx !== i));
  };
  const setPlayerName = (i: number, name: string) => {
    setPlayers(p => p.map((pl, idx) => idx === i ? { ...pl, name } : pl));
  };
  const canStart = players.every(p => p.name.trim().length > 0);

  /* ---- Invited duo: skip the player-setup screen ---- */
  // Run once on mount: if the parent handed us a duo, pre-seed the two players
  // (me first, matching the default player shape) and advance past setup exactly
  // as if the user had typed both names and pressed the Start button.
  useEffect(() => {
    if (!duo) return;
    setPlayerName(0, duo.me);
    setPlayerName(1, duo.them);
    setPhase('category');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Start game ---- */
  const startGame = (cat: Category) => {
    setCategory(cat);
    const pool = shuffle(QUESTIONS[cat]);
    setQuestionPool(pool);
    setQuestionCursor(0);
    setCurrentSubjectIdx(0);
    setSubjectRoundCount(0);
    setRoundsPlayed(0);
    pairStats.current = {};
    setPlayers(ps => ps.map(p => ({ ...p, score: 0, correctGuesses: 0, timesGuessedWrong: 0 })));
    setRound({ subjectIndex: 0, questionIndex: 0, subjectAnswer: null, guesses: {}, revealed: false });
    setPhase('subject-pick');
  };

  /* ---- Subject picks answer ---- */
  const subjectPickAnswer = (optionIdx: number) => {
    sfxTap();
    setRound(r => ({ ...r, subjectAnswer: optionIdx }));
    setPhase('pass-phone');
  };

  /* ---- Start guessing round ---- */
  const startGuessing = () => {
    sfxTap();
    let g = 0;
    if (g === currentSubjectIdx) g++;
    setCurrentGuesser(g);
    setPhase('guessing');
  };

  /* ---- Player guesses ---- */
  const playerGuess = (optionIdx: number) => {
    sfxTap();
    setRound(r => ({ ...r, guesses: { ...r.guesses, [currentGuesser]: optionIdx } }));

    let next = currentGuesser + 1;
    while (next < players.length && next === currentSubjectIdx) next++;
    if (next >= players.length) {
      setTimeout(() => {
        sfxReveal();
        setRevealAnim(true);
        setPhase('reveal');
      }, 300);
    } else {
      setCurrentGuesser(next);
      setPhase('pass-phone');
    }
  };

  /* ---- Process reveal & scoring ---- */
  useEffect(() => {
    if (phase !== 'reveal' || !revealAnim) return;
    const answer = round.subjectAnswer!;
    let anyCorrect = false;

    const updatedPlayers = [...players];
    for (const [gIdxStr, guess] of Object.entries(round.guesses)) {
      const gIdx = Number(gIdxStr);
      const pairKey = [Math.min(gIdx, currentSubjectIdx), Math.max(gIdx, currentSubjectIdx)].join('-');
      if (!pairStats.current[pairKey]) pairStats.current[pairKey] = { correct: 0, total: 0 };
      pairStats.current[pairKey].total++;

      if (guess === answer) {
        sfxCorrect();
        updatedPlayers[gIdx].score += 10;
        updatedPlayers[gIdx].correctGuesses++;
        pairStats.current[pairKey].correct++;
        anyCorrect = true;
      }
    }
    if (!anyCorrect) {
      updatedPlayers[currentSubjectIdx].score += 5;
      updatedPlayers[currentSubjectIdx].timesGuessedWrong++;
    }
    setPlayers(updatedPlayers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealAnim]);

  useEffect(() => {
    if (phase === 'results') {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      const topScore = sorted[0]?.score || 0;
      const totalCorrectGuesses = players.reduce((s, p) => s + p.correctGuesses, 0);
      const totalGuesses = totalRounds * (players.length - 1);
      onGameEnd?.({ score: topScore, accuracy: totalGuesses > 0 ? totalCorrectGuesses / totalGuesses : 0, level: 1 });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Next round ---- */
  const nextRound = () => {
    sfxTap();
    setRevealAnim(false);
    const newRoundsPlayed = roundsPlayed + 1;
    setRoundsPlayed(newRoundsPlayed);

    if (newRoundsPlayed >= totalRounds) {
      setPhase('results');
      return;
    }

    const newSubjectRound = subjectRoundCount + 1;
    let newSubjectIdx = currentSubjectIdx;
    let newSubjectRoundCount = newSubjectRound;

    if (newSubjectRound >= totalRoundsPerPlayer) {
      newSubjectIdx = currentSubjectIdx + 1;
      newSubjectRoundCount = 0;
    }

    setCurrentSubjectIdx(newSubjectIdx);
    setSubjectRoundCount(newSubjectRoundCount);
    setQuestionCursor(c => c + 1);
    setRound({ subjectIndex: newSubjectIdx, questionIndex: newRoundsPlayed, subjectAnswer: null, guesses: {}, revealed: false });
    setPhase('subject-pick');
  };

  /* ---- Restart ---- */
  const restart = () => {
    setPhase('setup');
    setPlayers([{ name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }, { name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }]);
    setCategory(null);
    setQuestionPool([]);
    setQuestionCursor(0);
    setRoundsPlayed(0);
    pairStats.current = {};
  };

  /* ---- Compatibility computation ---- */
  const getCompatibility = (i: number, j: number): number => {
    const key = [Math.min(i, j), Math.max(i, j)].join('-');
    const stats = pairStats.current[key];
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.correct / stats.total) * 100);
  };

  /* ---- Styles ---- */
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '20px',
    maxWidth: 520,
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  };

  const backBtn: React.CSSProperties = {
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

  const cardStyle = (accent?: string): React.CSSProperties => ({
    background: C.card,
    border: `1px solid ${accent ? accent + '30' : C.border}`,
    borderRadius: RADIUS.lg,
    padding: 20,
    ...glass,
    transition: `all ${MOTION.fast}`,
  });

  const inputStyle: React.CSSProperties = {
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

  const optionBtn = (color: string, selected: boolean, correct?: boolean, wrong?: boolean): React.CSSProperties => ({
    background: correct ? color + '25' : wrong ? C.accent + '15' : selected ? color + '20' : C.bg,
    border: `1.5px solid ${correct ? color : wrong ? C.accent + '60' : selected ? color + '60' : C.border}`,
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

  const labelBadge = (color: string): React.CSSProperties => ({
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
          <button style={backBtn} onClick={onBack}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Guess What</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>How well do you really know each other?</p>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={16} color={C.accent} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Players ({players.length}/4)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[i], flexShrink: 0 }} />
                <input
                  style={inputStyle}
                  placeholder={`Player ${i + 1} name`}
                  value={p.name}
                  onChange={e => setPlayerName(i, e.target.value)}
                  maxLength={16}
                />
                {players.length > 2 && (
                  <button
                    style={{ ...backBtn, padding: 6 }}
                    onClick={() => removePlayer(i)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {players.length < 4 && (
            <button
              style={{ background: 'none', border: `1px dashed ${C.dim}`, borderRadius: RADIUS.md, color: C.muted, padding: '8px', width: '100%', marginTop: 10, cursor: 'pointer', fontSize: 13 }}
              onClick={addPlayer}
            >
              + Add Player
            </button>
          )}
        </div>

        <button
          style={{ ...solidBtn(C.accent), width: '100%', justifyContent: 'center', opacity: canStart ? 1 : 0.4, pointerEvents: canStart ? 'auto' : 'none', padding: '14px 24px', fontSize: 15 }}
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
          <button style={backBtn} onClick={() => setPhase('setup')}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Pick a Category</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{players.length} players, {totalRounds} rounds</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
            <button
              key={key}
              style={{ ...cardStyle(meta.color), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}
              onClick={() => startGame(key)}
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

  /* ---- SUBJECT PICKS ANSWER ---- */
  if (phase === 'subject-pick' && currentQuestion) {
    const subject = players[currentSubjectIdx];
    const questionText = currentQuestion.template.replace('[name]', subject.name);

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtn} onClick={restart}><ArrowLeft size={18} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Round {roundsPlayed + 1}/{totalRounds}</span>
              <span style={labelBadge(CATEGORY_META[category!].color)}>{CATEGORY_META[category!].label}</span>
            </div>
          </div>
        </div>

        <div style={{ background: C.border, borderRadius: RADIUS.full, height: 4, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: C.accent, height: '100%', borderRadius: RADIUS.full, width: `${((roundsPlayed) / totalRounds) * 100}%`, transition: `width ${MOTION.med}` }} />
        </div>

        <div style={{ ...cardStyle(PLAYER_COLORS[currentSubjectIdx]), marginBottom: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <Lock size={14} color={PLAYER_COLORS[currentSubjectIdx]} />
            <span style={{ fontSize: 11, fontWeight: 600, color: PLAYER_COLORS[currentSubjectIdx], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {subject.name}'s turn -- pick secretly
            </span>
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, margin: '12px 0 0' }}>{questionText}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              style={optionBtn(PLAYER_COLORS[currentSubjectIdx], false)}
              onClick={() => subjectPickAnswer(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: hoveredOption === i ? PLAYER_COLORS[currentSubjectIdx] + '30' : C.bg, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0, transition: `all ${MOTION.fast}` }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- PASS THE PHONE ---- */
  if (phase === 'pass-phone') {
    const nextPlayer = Object.keys(round.guesses).length === 0
      ? (() => { let g = 0; if (g === currentSubjectIdx) g++; return g; })()
      : currentGuesser;
    const isFirstPass = Object.keys(round.guesses).length === 0;

    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: PLAYER_COLORS[nextPlayer] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${PLAYER_COLORS[nextPlayer]}40` }}>
            <UserCircle size={40} color={PLAYER_COLORS[nextPlayer]} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Pass the phone to
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: PLAYER_COLORS[nextPlayer] }}>
              {players[nextPlayer].name}
            </h2>
            <p style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>
              {isFirstPass ? `Guess what ${players[currentSubjectIdx].name} chose` : `Your turn to guess`}
            </p>
          </div>

          {!isFirstPass && (
            <div style={{ fontSize: 12, color: C.dim }}>
              Don't peek at the screen until it's your turn!
            </div>
          )}

          <button
            style={{ ...solidBtn(PLAYER_COLORS[nextPlayer]), padding: '14px 32px', fontSize: 15 }}
            onClick={startGuessing}
          >
            I'm Ready <Eye size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- GUESSING ---- */
  if (phase === 'guessing' && currentQuestion) {
    const subject = players[currentSubjectIdx];
    const guesser = players[currentGuesser];
    const questionText = currentQuestion.template.replace('[name]', subject.name);
    const guessersRemaining = players.filter((_, i) => i !== currentSubjectIdx && !(i in round.guesses) && i !== currentGuesser).length;

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[currentGuesser] }} />
              <span style={{ fontWeight: 600, fontSize: 15, color: PLAYER_COLORS[currentGuesser] }}>{guesser.name}'s Guess</span>
              {guessersRemaining > 0 && (
                <span style={{ fontSize: 11, color: C.dim }}>({guessersRemaining} more after)</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 4px' }}>What did {subject.name} pick?</p>
          <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{questionText}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              style={optionBtn(PLAYER_COLORS[currentGuesser], false)}
              onClick={() => playerGuess(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: hoveredOption === i ? PLAYER_COLORS[currentGuesser] + '30' : C.bg, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0, transition: `all ${MOTION.fast}` }}>
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
    const subject = players[currentSubjectIdx];
    const questionText = currentQuestion.template.replace('[name]', subject.name);
    const correctIdx = round.subjectAnswer!;
    const guessEntries = Object.entries(round.guesses).map(([k, v]) => ({ playerIdx: Number(k), guess: v }));
    const correctGuessers = guessEntries.filter(g => g.guess === correctIdx);

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>The Answer Is In</span>
          </div>
        </div>

        <div style={{ ...cardStyle(PLAYER_COLORS[currentSubjectIdx]), marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 8px' }}>{questionText}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {currentQuestion.options.map((opt, i) => {
            const isCorrect = i === correctIdx;
            const guessersOnThis = guessEntries.filter(g => g.guess === i);

            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{
                  ...optionBtn(C.emerald, false, isCorrect, !isCorrect && guessersOnThis.length > 0),
                  cursor: 'default',
                  animation: isCorrect && revealAnim ? 'reveal-pulse 0.6s ease' : undefined,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: isCorrect ? C.emerald + '30' : C.bg, border: `1.5px solid ${isCorrect ? C.emerald : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isCorrect ? <Check size={14} color={C.emerald} /> : <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{String.fromCharCode(65 + i)}</span>}
                  </div>
                  <span style={{ flex: 1, fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                  {isCorrect && <span style={labelBadge(C.emerald)}>Answer</span>}
                </div>
                {guessersOnThis.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, marginLeft: 36, flexWrap: 'wrap' }}>
                    {guessersOnThis.map(g => (
                      <span key={g.playerIdx} style={{ ...labelBadge(PLAYER_COLORS[g.playerIdx]), display: 'flex', alignItems: 'center', gap: 4 }}>
                        {g.guess === correctIdx ? <Check size={10} /> : <X size={10} />}
                        {players[g.playerIdx].name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: C.muted }}>Round Scoring</div>
          {correctGuessers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {correctGuessers.map(g => (
                <div key={g.playerIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color={C.emerald} />
                  <span style={{ color: PLAYER_COLORS[g.playerIdx], fontWeight: 600 }}>{players[g.playerIdx].name}</span>
                  <span style={{ color: C.emerald, fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>+10</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} color={C.amber} />
              <span style={{ color: PLAYER_COLORS[currentSubjectIdx], fontWeight: 600 }}>{subject.name}</span>
              <span style={{ color: C.muted, fontSize: 13 }}>fooled everyone!</span>
              <span style={{ color: C.amber, fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>+5</span>
            </div>
          )}
        </div>

        <button
          style={{ ...solidBtn(C.accent), width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}
          onClick={nextRound}
        >
          {roundsPlayed + 1 >= totalRounds ? 'See Results' : 'Next Round'} <ChevronRight size={16} />
        </button>

        <style>{`
          @keyframes reveal-pulse {
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
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const soulReader = [...players].sort((a, b) => b.correctGuesses - a.correctGuesses)[0];
    const mysteryPerson = [...players].sort((a, b) => b.timesGuessedWrong - a.timesGuessedWrong)[0];

    const pairs: { i: number; j: number; pct: number }[] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({ i, j, pct: getCompatibility(i, j) });
      }
    }

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Game Over</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{CATEGORY_META[category!].label} -- {totalRounds} rounds</p>
          </div>
        </div>

        <div style={{ ...cardStyle(C.gold), marginBottom: 16, textAlign: 'center' }}>
          <Crown size={28} color={C.gold} style={{ marginBottom: 8 }} />
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: C.gold }}>{sorted[0].name}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 600 }}>{sorted[0].score} pts</p>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Final Standings</div>
          {sorted.map((p, i) => {
            const origIdx = players.indexOf(p);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: i === 0 ? C.gold : C.dim, width: 24, textAlign: 'center' }}>
                  {i + 1}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[origIdx] }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{p.score}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ ...cardStyle(C.sapphire), textAlign: 'center', padding: 16 }}>
            <Eye size={20} color={C.sapphire} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: C.sapphire, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Soul Reader</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{soulReader.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{soulReader.correctGuesses} correct guesses</div>
          </div>
          <div style={{ ...cardStyle(C.violet), textAlign: 'center', padding: 16 }}>
            <EyeOff size={20} color={C.violet} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Mystery Person</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{mysteryPerson.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Fooled others {mysteryPerson.timesGuessedWrong}x</div>
          </div>
        </div>

        {pairs.length > 0 && (
          <div style={{ ...cardStyle(), marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Heart size={16} color={C.accent} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Compatibility Scores</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pairs.sort((a, b) => b.pct - a.pct).map((pair, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: PLAYER_COLORS[pair.i], fontWeight: 600, fontSize: 13 }}>{players[pair.i].name}</span>
                    <span style={{ color: C.dim, fontSize: 11 }}>&</span>
                    <span style={{ color: PLAYER_COLORS[pair.j], fontWeight: 600, fontSize: 13 }}>{players[pair.j].name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 15, color: pair.pct >= 70 ? C.emerald : pair.pct >= 40 ? C.amber : C.accent }}>
                      {pair.pct}%
                    </span>
                  </div>
                  <div style={{ background: C.border, borderRadius: RADIUS.full, height: 5, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: RADIUS.full,
                      width: `${pair.pct}%`,
                      background: pair.pct >= 70 ? C.emerald : pair.pct >= 40 ? C.amber : C.accent,
                      transition: `width ${MOTION.slow}`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ ...solidBtn(C.dim), flex: 1, justifyContent: 'center', padding: '14px 24px' }}
            onClick={restart}
          >
            <RotateCcw size={16} /> New Game
          </button>
          <button
            style={{ ...solidBtn(C.accent), flex: 1, justifyContent: 'center', padding: '14px 24px' }}
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
