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
}

export default function GuessWhat({ onBack, onGameEnd }: Props) {
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
