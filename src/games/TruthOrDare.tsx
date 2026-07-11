import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, Play, Flame,
  Check, SkipForward, Trophy, ChevronRight, Sparkles,
  RotateCcw, X, Users, Heart, Settings, ThumbsUp,
} from 'lucide-react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxReveal, sfxLevelUp } from '../lib/sfx';

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#080c12',
  card: '#151d2b',
  border: '#1c2940',
  text: '#e8edf5',
  muted: '#8494a7',
  dim: '#4a5d75',
  truth: '#3a86ff',
  dare: '#f43f5e',
  rafiki: '#00c97b',
  spicy: '#f43f5e',
  custom: '#7b2ff7',
  glass: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
} as const;

const AVATARS = ['🦁', '🐯', '🦊', '🐼', '🐨', '🐸', '🦋', '🐙'];

/* ------------------------------------------------------------------ */
/*  Content: 50+ truths and 50+ dares per mode                         */
/* ------------------------------------------------------------------ */
type GameMode = 'rafiki' | 'spicy' | 'custom';

const TRUTHS_RAFIKI: string[] = [
  "What's your most embarrassing autocorrect fail?",
  "What's the last lie you told?",
  "What's the weirdest food combination you secretly enjoy?",
  "Have you ever pretended to laugh at a joke you didn't get?",
  "What's the longest you've gone without showering?",
  "What's your guilty pleasure TV show?",
  "Have you ever stalked someone on social media? Who?",
  "What's the most childish thing you still do?",
  "What's the most ridiculous thing you've ever Googled?",
  "If you could swap lives with someone here for a day, who?",
  "What's the worst gift you've ever received but pretended to like?",
  "What's a song you know all the lyrics to but won't admit?",
  "Have you ever eaten food off the floor?",
  "What's your most irrational fear?",
  "What was your worst haircut ever?",
  "Have you ever re-gifted a present?",
  "What's the most embarrassing thing in your search history?",
  "What's a trend you secretly love but publicly judge?",
  "What is the dumbest thing you've ever said in public?",
  "If your life had a theme song, what would it be?",
  "What would your autobiography title be?",
  "What's the weirdest dream you've ever had?",
  "If you were a superhero, what useless power would you have?",
  "What's the most ridiculous thing you've done to avoid someone?",
  "What's the funniest thing you've witnessed but couldn't laugh at?",
  "What's the silliest thing you believed as a child?",
  "What's the most absurd excuse you've used to get out of plans?",
  "What's the worst piece of advice you've ever followed?",
  "What's the most embarrassing thing your parents caught you doing?",
  "What's the longest you've binge-watched something in one sitting?",
  "What's a skill you pretend to have but really don't?",
  "What's the most cringe thing on your social media from years ago?",
  "What's the worst thing you've done as a houseguest?",
  "If you could only eat one food forever, what would it be?",
  "What's the pettiest reason you stopped talking to someone?",
  "What habit do you have that you know is annoying?",
  "What's the most money you've wasted on something stupid?",
  "What's the most embarrassing photo on your phone right now?",
  "What's a movie everyone loves that you secretly think is terrible?",
  "Have you ever blamed someone else for something you did?",
  "What's the weirdest thing you do when you're alone?",
  "What nickname do you secretly hate?",
  "What's the most desperate thing you've done when hungry?",
  "If you had to delete every app on your phone except three, which three?",
  "What's the most over-the-top thing you've done for attention?",
  "What's something you did as a kid that still makes you cringe?",
  "Have you ever pretended to be sick to avoid something? What?",
  "What's the worst fashion choice you've ever made?",
  "Have you ever accidentally sent a message to the wrong person? What happened?",
  "What's your most controversial food opinion?",
  "What's the longest grudge you've ever held?",
  "What rule do you break on a regular basis?",
  "What's a white lie you tell almost every week?",
  "What's the most embarrassing thing you've done while sleepwalking or half-asleep?",
  "What's the weirdest thing you've ever collected?",
  "What's your least favourite chore and how do you avoid it?",
  "What's the most useless talent you have?",
  "What's a food you hated as a kid but love now?",
  "What's the worst meal you've ever cooked?",
  "What's the strangest thing you've ever said to a stranger?",
  "What's a compliment you gave that you didn't really mean?",
  "What's the last thing you searched on YouTube?",
  "What's the most embarrassing thing you've done in front of a crush?",
  "What's a weird habit you have when nobody is watching?",
  "What's the pettiest thing that has ever made you angry?",
  "What's the worst thing you've ever regifted?",
  "What's a secret talent nobody in this room knows about?",
  "What's the most childish argument you've had as an adult?",
  "What's the last thing that made you cry?",
  "What's the most embarrassing ringtone you've ever had?",
  "What's the weirdest thing you've eaten just to be polite?",
  "What's the strangest place you've ever fallen asleep?",
  "What's a lie you told to get out of school or work?",
  "What's the most embarrassing thing you've done to impress someone?",
  "What's the silliest thing you've cried about as an adult?",
  "What's the worst nickname you've ever given someone?",
  "What's the most ridiculous thing you own?",
  "What's your worst cooking disaster story?",
  "What's a game or toy you secretly still enjoy?",
  "What's the most embarrassing thing that's happened to you at school?",
  "What's the strangest compliment you've ever received?",
  "What's a small thing that instantly ruins your mood?",
  "What's the weirdest thing you believe in?",
  "What's the last photo you took and why?",
  "What's a food you could never give up?",
  "What's the most embarrassing thing you've worn in public?",
  "What's your most-used emoji and what does it say about you?",
  "What's the biggest mess you've ever made?",
  "What's a habit you picked up from your parents?",
  "What's the funniest way you've ever hurt yourself?",
  "What's the most embarrassing app on your phone right now?",
  "What's a rumour about yourself you've never corrected?",
  "What's the weirdest thing you've done to fall asleep?",
  "What's the most embarrassing thing you've done at a wedding?",
  "What's your go-to karaoke song?",
  "What's the strangest thing you've ever been afraid of?",
  "What's the most embarrassing text your parent has sent you?",
  "What's the longest you've stayed in bed doing nothing?",
  "What's a hobby you started and immediately quit?",
  "What's the worst prank you've ever pulled?",
  "What's the most embarrassing thing you've done to save money?",
  "What's a secret you've kept from your family?",
  "What's the weirdest food craving you've ever had?",
  "What's the most embarrassing thing you've said to a teacher?",
  "What's your most unpopular opinion about music?",
  "What's the last dumb thing you argued about online?",
  "What's the most embarrassing thing that's happened to you on public transport?",
  "What's a talent you wish you had?",
  "What's the most childish thing that still makes you happy?",
  "What's the worst haircut you've ever given yourself?",
  "What's a lie you've told that snowballed out of control?",
  "What's the most embarrassing thing you've done at work?",
  "What's the strangest thing in your bag or pockets right now?",
  "What's a movie that always makes you cry?",
  "What's the most embarrassing thing you've done while trying to be cool?",
  "What's the weirdest thing you've googled at 3am?",
  "What's a food combination people judge you for?",
  "What's the most embarrassing thing you've done in a group chat?",
  "What's the silliest reason you've ever ignored a text?",
  "What's the worst gift you've ever given someone?",
  "What's your biggest irrational pet peeve?",
  "What's the most embarrassing thing you've done to get free food?",
  "What's the strangest talent you'd put on a resume as a joke?",
  "What's a childhood dream job you're glad you didn't pursue?",
  "What's the most embarrassing thing you've believed from the internet?",
  "What's the weirdest way you've ever tried to save time?",
  "What's a task you always procrastinate on?",
  "What's the most embarrassing thing you've done at a family gathering?",
  "What's the last thing you laughed at until you couldn't breathe?",
  "What's a secret snack you hide from everyone?",
  "What's the most embarrassing thing you've shouted in public?",
  "What's the weirdest thing you find comforting?",
  "What's the most ridiculous argument you've had with a sibling?",
  "What's a word you always misspell?",
  "What's the most embarrassing photo you've been tagged in?",
  "What's the strangest thing you've done to win a bet?",
  "What's a fear you had as a kid that seems silly now?",
  "What's the most embarrassing thing you've done half-asleep?",
  "What's the last thing you did that you're a little proud of?",
  "What's the weirdest thing you've done to avoid small talk?",
  "What's a chore you secretly enjoy?",
  "What's the most embarrassing thing you've done in a public bathroom?",
  "What's the silliest thing you've spent way too much money on?",
  "What's the most embarrassing thing you've done at a concert?",
  "What's a random fact about yourself most people don't know?",
  "What's the strangest thing you've named — a plant, car, or object?",
  "What's the most embarrassing thing you've done trying to be healthy?",
  "What's the weirdest thing you've won?",
  "What's the last thing you did that surprised even you?",
  "What's a smell that instantly takes you back to childhood?",
  "What's the most embarrassing thing you've done in front of your whole class?",
  "What's a tiny victory you celebrated way too hard?",
  "What's the weirdest thing you've ever said in your sleep?",
  "If you could instantly master one instrument, which would it be?",
  "What's the strangest thing you've ever eaten on a dare?",
  "What's your most-used excuse when you're running late?",
  "What's the last thing you binge-ate straight from the fridge?",
  "What's a childhood snack you'd still eat every day if you could?",
  "What's the most embarrassing thing you've done at a sleepover?",
  "What's the weirdest thing you've ever kept as a souvenir?",
  "What's a phrase you overuse without realising it?",
  "What's the silliest thing that has ever made you jump in fright?",
  "What's the most useless fact you know by heart?",
  "What's the worst gift idea you've ever seriously considered?",
  "What's a chore your family always tricks you into doing?",
  "What's the most embarrassing thing you've done at a sports event?",
  "What's the last thing you danced to when nobody was watching?",
  "What's a song you're embarrassed to have on repeat?",
  "What's the weirdest thing you've ever named after yourself?",
  "What's the most childish way you've celebrated a small win?",
  "What's a food you pretend to like just to fit in?",
  "What's the strangest thing you've ever done to win an argument?",
  "What's the most embarrassing thing your phone has autocorrected recently?",
  "What's a trend you jumped on way too late?",
  "What's the clumsiest thing you've done in the last week?",
  "What's a movie you fell asleep in and never finished?",
  "What's the weirdest thing you've done to cure boredom?",
  "What's the most ridiculous thing you've argued about with a friend?",
  "What's a fear you have that makes absolutely no sense?",
  "What's the last thing you did that felt oddly satisfying?",
  "What's the most embarrassing thing you've done in a lift?",
  "What's a hobby you're secretly terrible at but love anyway?",
  "What's the weirdest compliment you've ever given a stranger?",
  "What's the most childish thing you've done to get out of trouble?",
  "What's a smell you secretly enjoy that others find weird?",
  "What's the last thing you spent way too long deciding on?",
  "What's the most embarrassing thing you've done trying to be helpful?",
  "What's a game you always cheat at just a little?",
  "What's the strangest thing you've ever been caught doing?",
  "What's the weirdest snack combination you'd defend to the end?",
  "What's the silliest reason you've ever been late somewhere?",
  "What's the most dramatic reaction you've had to a small problem?",
  "What's a word you can never pronounce correctly?",
  "What's the last thing you did that made you feel like a genius?",
  "What's the most embarrassing thing you've done in front of a mirror?",
  "What's a childhood belief you held onto way too long?",
  "What's the weirdest thing you've ever hidden from a guest?",
  "What's the most ridiculous thing you've cried laughing at?",
  "What's a talent you fake being bad at so you don't get asked to help?",
  "What's the strangest thing you've done to avoid answering the door?",
  "What's the most embarrassing thing you've done while cooking?",
  "What's a habit you swear you'll quit but never do?",
  "What's the weirdest thing you've said to a pet?",
  "What's the last thing that made you laugh at the worst possible moment?",
  "What's the most childish argument you've won?",
  "What's a food you eat in a weird order every time?",
  "What's the strangest thing you've ever done half-asleep in the morning?",
  "What's the most embarrassing photo you've accidentally sent to a group chat?",
  "What's a chore you always do wrong on purpose?",
  "What's the weirdest thing you've ever collected as a kid?",
  "What's the silliest thing you've spent an entire afternoon on?",
  "What's the most dramatic exit you've ever made from a room?",
  "What's a nickname you gave yourself that never caught on?",
  "What's the last time you got completely lost somewhere familiar?",
  "What's the most embarrassing thing you've done in a quiet room?",
  "What's a movie quote you use way too often?",
  "What's the weirdest thing you've ever done to stay warm?",
  "What's the most ridiculous thing you've ever queued for?",
  "What's a food you'd happily eat for breakfast, lunch, and dinner?",
  "What's the strangest reason you've ever laughed uncontrollably?",
  "What's the most embarrassing thing you've done in a waiting room?",
  "What's a habit of yours that annoys your closest friend?",
  "What's the weirdest dream you've had about someone here?",
  "What's the last time you talked your way out of something?",
  "What's the most childish thing you refuse to grow out of?",
  "What's a chore you'd pay someone else to do forever?",
  "What's the strangest thing you've ever worn to bed?",
  "What's the most embarrassing song on your workout playlist?",
  "What's a random skill you're weirdly proud of?",
  "What's the weirdest thing you've done to remember something?",
  "What's the silliest argument you've had with a stranger?",
  "What's the last time you completely misread a situation?",
  "What's the most embarrassing thing you've done at a restaurant?",
  "What's a food you secretly think is overrated?",
  "What's the weirdest thing you've ever done to pass time in traffic?",
  "What's the most childish way you've reacted to losing a game?",
  "What's a phrase your family always teases you for saying?",
  "What's the strangest thing you've ever done to fall asleep faster?",
  "What's the most embarrassing thing you've done in front of a neighbour?",
  "What's a hobby you picked up just to impress someone?",
  "What's the weirdest thing you've googled about yourself?",
  "What's the last time you got way too competitive over something silly?",
  "What's the most dramatic thing you've done over a minor inconvenience?",
  "What's a food you refuse to share with anyone?",
  "What's the strangest thing you've ever done when home alone?",
  "What's the most embarrassing thing you've done during a video call?",
  "What's a childhood habit you're glad nobody filmed?",
  "What's the weirdest thing you've ever apologised to?",
  "What's the silliest thing you've been genuinely scared of as an adult?",
  "What's the last time you laughed so hard you snorted?",
  "What's the most embarrassing thing you've done trying to look busy?",
  "What's a talent you wish you could trade for a different one?",
  "What's the weirdest thing you've ever done to win someone's approval?",
  "What's the most childish thing that instantly cheers you up?",
  "What's a food you eat differently than everyone else?",
  "What's the strangest thing you've said to yourself out loud?",
  "What's the most embarrassing thing you've done at the gym?",
  "What's a habit you copied from a TV character?",
  "What's the weirdest thing you've ever done to avoid a phone call?",
  "What's the last time you got caught talking to yourself?",
  "What's the most dramatic way you've ever asked for help?",
  "What's a snack you'd never admit to eating in public?",
  "What's the strangest thing you've ever done to beat the heat?",
  "What's the most embarrassing thing you've done in a library?",
  "What's a childhood fear you've completely gotten over?",
  "What's the weirdest thing you've ever done to feel productive?",
  "What's the silliest reason you've ever changed your mind?",
  "What's the last time you completely forgot why you walked into a room?",
  "What's the most embarrassing thing you've done trying to be sneaky?",
  "What's a food you'd rank far higher than everyone else would?",
  "What's the weirdest thing you've ever done to make someone laugh?",
  "What's the most childish way you've reacted to good news?",
  "What's a phrase you say that instantly ages you?",
  "What's the strangest thing you've ever done to save a few minutes?",
  "What's the most embarrassing thing you've done at a party?",
  "What's a hobby you'd try if you were guaranteed not to fail?",
  "What's the weirdest thing you've ever kept way past its use?",
  "What's the last time you got emotional over an advert?",
  "What's the most dramatic thing you've done to avoid exercise?",
  "What's a food you always order but never actually finish?",
  "What's the strangest thing you've ever done during a power cut?",
  "What's the most embarrassing thing you've done in a shop?",
  "What's a childhood toy you'd secretly still play with?",
  "What's the weirdest thing you've ever done to look confident?",
  "What's the silliest thing you've ever bragged about?",
  "What's the last time you completely embarrassed yourself in public?",
  "What's the most childish thing you've done to get the last slice of something?",
  "What's a habit you have that makes total sense only to you?",
  "What's the strangest thing you've ever done to stay awake?",
  "What's the most embarrassing thing you've done at a bus stop?",
  "What's a food you love that most people find strange?",
  "What's the weirdest thing you've ever done to celebrate alone?",
  "What's the last time you laughed at something you shouldn't have?",
  "What's the most dramatic goodbye you've ever given?",
  "What's a talent you only show off when nobody important is watching?",
  "What's the strangest thing you've ever done to fix something?",
  "What's the most embarrassing thing you've done in front of a group of kids?",
  "What's a childhood dream you've completely changed your mind about?",
  "What's the weirdest thing you've ever done just because you were curious?",
  "What's the silliest thing that has ever ruined your whole day?",
  "What's the last time you surprised yourself with how petty you could be?",
  "What's the most childish thing you still get genuinely excited about?",
];

const TRUTHS_SPICY: string[] = [
  "What's your biggest sexual fantasy you've never told anyone?",
  "Have you ever faked an orgasm? Tell us the story.",
  "What's the most scandalous thing you've done that nobody here knows about?",
  "What's the wildest place you've ever hooked up?",
  "Who in this room would you most want to see naked?",
  "What's the dirtiest text you've ever sent? Read it out loud.",
  "Have you ever had a crush on a friend's partner?",
  "What's the kinkiest thing you've ever done?",
  "What's your body count? Be honest.",
  "What's the most embarrassing thing that happened during sex?",
  "Have you ever been caught in the act? Tell the story.",
  "What's the biggest age gap you've had with someone you were with?",
  "What turns you on that you'd be embarrassed to admit?",
  "Have you ever sent or received nudes? From who?",
  "What's the worst date you've ever been on?",
  "If you could hook up with any celebrity, who and why?",
  "What's the most desperate thing you've done to get someone's attention?",
  "Have you ever cheated or been cheated on?",
  "What's one thing you want to try in bed but haven't yet?",
  "Have you ever had a one-night stand you regretted?",
  "What's the most revealing outfit you've ever worn?",
  "Have you ever lied about your relationship status to hook up with someone?",
  "What's the longest you've gone without sex while in a relationship?",
  "Describe the best kiss you've ever had in detail.",
  "Have you ever made out with someone within an hour of meeting them?",
  "What's the most money you've spent to impress a date?",
  "Have you ever stalked an ex online? How deep did you go?",
  "What's something you've done behind a partner's back?",
  "If you had to rate your kissing ability 1-10, what would you give yourself?",
  "What's the naughtiest thing you've done at a party?",
  "Have you ever used a dating app while in a relationship?",
  "What's the biggest lie you told to get laid?",
  "What's your go-to move to seduce someone?",
  "What's the most awkward morning-after experience you've had?",
  "Have you ever had a friends-with-benefits situation? How did it end?",
  "What's the most inappropriate crush you've ever had?",
  "Show the last DM you sent that you're embarrassed about.",
  "What's the wildest party story you have?",
  "Have you ever skinny-dipped? Where and with who?",
  "What's a red flag you consistently ignore in partners?",
  "What's the most risque photo on your phone right now?",
  "What's something you only do when you're drunk?",
  "Have you ever pretended to like something in bed that you actually hated?",
  "What's the most embarrassing thing you've called out during sex?",
  "What's your biggest dealbreaker that most people would find shallow?",
  "Have you ever had a dream about someone in this room? What happened?",
  "What's the worst excuse you've given for not going on a second date?",
  "Tell us about a time you were rejected in the most embarrassing way.",
  "What's the most scandalous rumor about you that's actually true?",
  "Have you ever ghosted someone? Why?",
  "What's something your ex did that you actually miss?",
  "What's the most embarrassing thing in your browser history right now?",
  "What's the first thing you notice about someone you're attracted to?",
  "What's your biggest turn-off on a first date?",
  "What's the most spontaneous romantic thing you've ever done?",
  "Who was your very first crush and what happened?",
  "What's the cheesiest pickup line that has actually worked on you?",
  "What's the most flirtatious thing you've done to get someone's number?",
  "What's your idea of a perfect romantic evening?",
  "What's the boldest thing you've ever whispered to someone?",
  "What's the most attractive personality trait in a partner for you?",
  "Have you ever had a secret crush on someone here?",
  "What's the most romantic gift you've ever given?",
  "What's the longest you've stayed up talking to someone you liked?",
  "What's your biggest flirting weakness?",
  "What's the most daring outfit you've worn to catch someone's eye?",
  "What's the sweetest thing anyone has ever said to you?",
  "What's a secret way you like to be complimented?",
  "What's the most romantic text you've ever received?",
  "What's your go-to move when you want someone to notice you?",
  "What's the most memorable date you've ever been on?",
  "What's the boldest way you've ever asked someone out?",
  "What's a physical feature you're most confident about?",
  "What's the flirtiest thing you've done over text?",
  "What's the most charming thing a stranger has ever done for you?",
  "What's your biggest weakness when someone flirts with you?",
  "What celebrity would you want to take on a dream date?",
  "What's the most romantic place you've ever visited?",
  "What's the most nervous a crush has ever made you?",
  "What's a song that instantly puts you in a flirty mood?",
  "What's the most confident you've ever felt walking into a room?",
  "What's the most daring dare you'd accept from someone you liked?",
  "What's the sweetest way someone has ever surprised you?",
  "What's your favourite thing about a good kiss?",
  "What's the most memorable compliment you've received about your looks?",
  "What's the boldest first move you've ever made?",
  "What's a secret you'd only tell someone you completely trust?",
  "What's the most romantic dream you've ever had?",
  "What's a trait that instantly makes someone more attractive to you?",
  "What's the flirtiest outfit in your wardrobe right now?",
  "What's the most spontaneous kiss you've ever had?",
  "What's your favourite pet name to be called?",
  "What's the most attractive thing someone can do in a conversation?",
  "What's the boldest thing you've done to impress a date?",
  "What's the most romantic movie scene you wish happened to you?",
  "What's a secret fantasy date you've always wanted to go on?",
  "What's the most flustered you've ever been around a crush?",
  "What's your biggest green flag in a partner?",
  "What's the most daring text you've ever been too scared to send?",
  "What's the sweetest nickname you've ever given someone?",
  "What's the most attractive quality in a person's laugh or smile?",
  "What's the boldest compliment you've ever given someone?",
  "What's the most romantic thing you'd do for someone you liked?",
  "What's a flirty habit you can't help but do?",
  "What's the most memorable slow dance you've ever had?",
  "What's your ideal way to be woken up by someone you love?",
  "What's the most confident outfit you own?",
  "What's the flirtiest thing anyone has ever said to you in person?",
  "What's the most daring place you've held someone's hand?",
  "What's a romantic gesture you find irresistible?",
  "What's the boldest thing you've whispered on a dance floor?",
  "What's your favourite way to be flirted with?",
  "What's the most romantic surprise you've ever pulled off?",
  "What's the most attractive thing about confidence to you?",
  "What's the last time your heart raced because of someone?",
  "What's the flirtiest photo you've ever posted?",
  "What's the boldest crush confession you've ever made?",
  "What's a trait you find irresistibly charming?",
  "What's the most romantic thing you've whispered to someone?",
  "What's your dream honeymoon destination?",
  "What's the most daring thing you've done on a first date?",
  "What's the sweetest way someone has flirted with you?",
  "What's the most attractive thing someone can wear?",
  "What's the boldest thing you've done to get a second date?",
  "What's your favourite kind of romantic tension?",
  "What's the most flustered a compliment has ever made you?",
  "What's the most romantic surprise you'd love to receive?",
  "What's the flirtiest dance move you have?",
  "What's the most daring thing you'd do for a dare from a crush?",
  "What's the most attractive act of kindness you've witnessed?",
  "What's the boldest way you've ever caught someone's attention?",
  "What's a secret romantic gesture you save for special people?",
  "What's the most memorable eye contact you've ever shared?",
  "What's your idea of the perfect goodnight?",
  "What's the flirtiest thing you've ever done at a party?",
  "What's the most daring outfit you'd wear on a hot date?",
  "What's the sweetest thing you'd whisper on a slow dance?",
  "What's the most romantic risk you've ever taken?",
  "What's the boldest text you've ever sent at midnight?",
  "What's the most attractive thing about a person's confidence?",
  "What's a flirty look you know you're good at?",
  "What's the most romantic place you'd love to be kissed?",
  "What's the most daring compliment you've received?",
  "What's the flirtiest game you've ever played with someone?",
  "What's the boldest crush you've ever had?",
  "What's the sweetest romantic memory you have?",
  "What's the most attractive way someone has ever said your name?",
  "What's the most daring thing you'd do to win someone over?",
  "What's the most attractive thing someone can do without even trying?",
  "Who was the last person to give you butterflies?",
  "What's your biggest turn-on in a conversation?",
  "What's the boldest thing you've ever done to get a date?",
  "What's a compliment that instantly wins you over?",
  "What's the most romantic thing you've ever imagined doing?",
  "What's your type in three words?",
  "What's the flirtiest thing you've done that actually worked?",
  "What's the most attractive outfit someone could wear on a date with you?",
  "What's the last time someone made you blush?",
  "What's your idea of the perfect first kiss?",
  "What's the boldest pickup line you'd ever use?",
  "What's a small gesture that instantly makes you swoon?",
  "What's the most flirtatious text you've ever sent?",
  "Who in your life gives you the most butterflies right now?",
  "What's the most romantic setting for a first date?",
  "What's the one quality that makes you fall for someone fast?",
  "What's the boldest way someone has ever flirted with you?",
  "What's the most attractive thing about someone who owns the room?",
  "What's a song that instantly makes you feel romantic?",
  "What's the sweetest thing you've ever done for a crush?",
  "What's the most daring outfit you've ever worn out?",
  "What's the flirtiest look you know you can pull off?",
  "What's the most memorable date you've ever daydreamed about?",
  "What's your favourite way for someone to show they like you?",
  "What's the boldest compliment you've ever given someone you liked?",
  "What's the most charming thing about someone's grin?",
  "What's the last time your heart skipped a beat?",
  "What's the most romantic gesture you'd love to receive?",
  "What's a feature you find underrated but super attractive?",
  "What's the flirtiest thing you've whispered to someone?",
  "What's the most confident you've ever felt on a date?",
  "What's the sweetest way someone has ever asked you out?",
  "What's the most daring thing you'd do to impress a crush?",
  "What's a nickname you'd love a partner to call you?",
  "What's the most romantic dream date you can imagine?",
  "What's the boldest move you've ever made on a dance floor?",
  "What's the most attractive thing someone can whisper?",
  "What's a flirty habit you can't seem to control?",
  "What's the last time you couldn't stop thinking about someone?",
  "What's the most charming thing anyone has ever said to you?",
  "What's the flirtiest outfit you'd wear to catch someone's eye?",
  "What's the sweetest surprise you'd plan for a partner?",
  "What's the most attractive thing about a good sense of humour?",
  "What's the most forward message you've ever sent late at night?",
  "What's a romantic cliche you secretly love?",
  "What's the wildest thing you'd do on a fun dare tonight?",
  "What's the flirtiest thing you've done with just eye contact?",
  "What's the most memorable slow dance you can imagine?",
  "What's the most romantic thing you'd whisper on a first date?",
  "What's something small that makes you instantly like someone more?",
  "What's the boldest crush confession you'd ever make?",
  "What's the most attractive thing someone can do at a party?",
  "What's the last person you had a crush on and never told?",
  "What's your favourite kind of flirty banter?",
  "What's the sweetest compliment you've ever received about your looks?",
  "What's the boldest outfit you'd wear on a first date?",
  "What's the flirtiest photo you'd be brave enough to post?",
  "Where's the most unexpected place you'd love a first kiss?",
  "What's the boldest way you'd let someone know you like them?",
  "What's the most attractive thing about a deep voice or a warm laugh?",
  "What's a flirty message you drafted but never sent?",
  "What's the last time someone completely charmed you?",
  "What's the most romantic thing you'd do on a spontaneous trip?",
  "What's your signature move on the dance floor?",
  "What's the sweetest thing a partner could whisper to you?",
  "How far would you go to make sure there's a second date?",
  "What's the most attractive act of confidence you've seen?",
  "What small romantic act completely melts your heart?",
  "What's the boldest compliment you've received from a stranger?",
  "What's the flirtiest thing you'd do to break the ice?",
  "What's the most unforgettable glance someone has ever given you?",
  "What's your idea of the perfect goodnight text?",
  "What kind of grand romantic gesture would sweep you off your feet?",
  "What's the last time you flirted your way into something?",
  "What's the most attractive thing about someone being kind?",
  "What would your dream confident first move look like?",
  "What's the one outfit that makes you feel most attractive?",
  "What's the sweetest date idea you've never told anyone?",
  "What's the most daring place you'd hold someone's hand?",
  "What's a trait that makes you weak at the knees?",
  "What movie romance do you wish was your real life?",
  "What's the most romantic thing you've murmured during a slow song?",
  "What's a subtle way you let someone know you're interested?",
  "What's the last time a compliment left you speechless?",
  "What's the most attractive thing about someone chasing their dreams?",
  "What's a romantic risk you'd love to be brave enough to take?",
  "What's the sweetest nickname you've ever secretly loved?",
  "What's the most daring flirty move you've pulled off?",
  "What's the flirtiest thing you'd say to start a conversation?",
  "What's the most romantic evening you can picture?",
  "What's the boldest crush you've ever had that surprised you?",
  "What's the most attractive thing about someone being confident in themselves?",
  "What's the flirtiest thing you can communicate with just a smile?",
  "What's the last time you felt an instant spark with someone?",
  "What's the most romantic word you can think of right now?",
  "What's the boldest outfit you'd wear to feel unstoppable?",
  "What's the flirtiest compliment you'd give someone here?",
  "What's the sweetest thing you'd do to make someone's day?",
  "What's the most daring thing you'd whisper on a dance floor?",
  "What quality do you value most in someone you're dating?",
  "What's a dream date scenario you replay in your mind?",
  "What's the boldest way you've ever shown interest in someone?",
  "What's the flirtiest thing about a confident walk?",
  "What's the last time you felt genuinely swept off your feet?",
  "What's the most romantic thing you'd write in a note?",
  "What's the sweetest way someone could ask for your number?",
  "What's the most daring dance you'd do with a partner?",
  "What's the most attractive thing about a genuine smile?",
  "What's a flirty habit you find charming in others?",
  "What's the boldest text you'd send to break the tension?",
  "What's the flirtiest outfit you'd wear on a summer night?",
  "What's the sweetest surprise you've ever planned for someone?",
  "What's the most romantic place you'd love to travel with someone?",
  "What's the most daring compliment you'd give a crush?",
  "What's the last time your cheeks went red because of someone?",
  "What's the most attractive thing about someone who is a great listener?",
  "What's a flirty line you wish you were brave enough to use?",
  "What's the boldest romantic gesture you've ever pulled off?",
  "What's the flirtiest way you'd say goodnight to someone special?",
  "What's the sweetest daydream you've had about a crush?",
  "What's the most daring outfit you own for a night out?",
  "What's the most romantic thing about a candlelit dinner?",
  "What's the grandest gesture you'd make to win someone's heart?",
  "What's the most captivating feature someone can have?",
  "What's a flirty moment you replay in your head?",
  "What's the last time you got nervous around someone you liked?",
  "What's the most romantic surprise you'd pull off for a partner?",
  "What's the flirtiest thing you'd do at a slow dance?",
  "What's the sweetest compliment you'd give to someone across from you?",
  "What's the most daring look you'd give to catch someone's eye?",
  "What's the most attractive thing about a spontaneous adventure?",
  "What's a romantic memory you'd love to recreate?",
  "What's the boldest thing you'd whisper to a crush?",
  "What's the flirtiest photo pose you know you can nail?",
  "What's the sweetest way you've ever been asked to dance?",
  "What's the most daring thing you'd do on a rooftop date?",
  "What's the most attractive thing about someone laughing at your jokes?",
  "What's a flirty text conversation you still remember fondly?",
  "What's the boldest crush you'd finally confess to tonight?",
  "What's the flirtiest outfit you'd wear to feel your best?",
  "What's the sweetest goodnight you can imagine?",
  "What's the most daring romantic gesture you've ever witnessed?",
  "What's the most attractive thing about someone being adventurous?",
  "What's a romantic surprise you'd love to wake up to?",
  "What's the boldest way you'd flirt without saying a word?",
  "What's the flirtiest thing you'd do to make someone smile?",
  "What tender words would you save for a quiet moment together?",
  "What's the most daring first-date idea you can dream up?",
  "What's the most attractive thing about the way someone carries themselves?",
  "What's the most romantic compliment you've ever given someone?",
  "What's the flirtiest way you've ever started a text conversation?",
  "What's the most swoon-worthy thing someone has done for you?",
  "What's the boldest thing you've ever done to catch someone's eye?",
];

const DARES_RAFIKI: string[] = [
  "Do 10 jumping jacks right now.",
  "Let the group pick your profile picture for the next 24 hours.",
  "Speak in a British accent for the next 2 rounds.",
  "Show the last photo in your camera roll.",
  "Do your best robot dance for 15 seconds.",
  "Let someone draw on your hand with a pen.",
  "Call a friend and sing 'Happy Birthday' to them.",
  "Keep a straight face while everyone tries to make you laugh for 30 seconds.",
  "Show the group your screen time report.",
  "Imitate the person on your right until your next turn.",
  "Talk without closing your mouth for the next minute.",
  "Do your best animal impression — group picks the animal.",
  "Let the group send one text from your phone.",
  "Eat a spoonful of a condiment chosen by the group.",
  "Wear your shirt inside out for the next 3 rounds.",
  "Do a dramatic reading of your last sent text message.",
  "Hold an ice cube in your hand until it melts.",
  "Do your best impression of a celebrity — everyone guesses who.",
  "Speak in an accent for the next 3 rounds.",
  "Make up a 30-second rap about the person on your left.",
  "Act out the last emoji you sent — everyone guesses.",
  "Narrate everything you do in third person for 2 rounds.",
  "Do a dramatic soap opera scene by yourself — include the crying.",
  "Try to juggle any 3 items. You have 30 seconds.",
  "Pretend you're a news anchor reporting on this game.",
  "Sing everything you say for the next round.",
  "Do 20 seconds of your best dance.",
  "Try to lick your own elbow for 15 seconds.",
  "Make the ugliest face you can and hold it for 10 seconds.",
  "Invent a new handshake with the person across from you.",
  "Talk to your hand like it's a puppet for 30 seconds.",
  "Stand up and do the chicken dance right now.",
  "Let someone tickle you for 10 seconds.",
  "Post an embarrassing childhood photo on your story (or show the group).",
  "Do the worm (or attempt it) on the floor.",
  "Do your best impression of a baby learning to walk.",
  "Stack as many things on your head as you can in 20 seconds.",
  "Speak only in questions for the next 2 rounds.",
  "Do a fashion walk across the room using only items in this room as props.",
  "Let someone style your hair however they want — keep it for 3 rounds.",
  "Eat something without using your hands.",
  "Balance a book on your head and walk across the room.",
  "Do your best beatbox for 20 seconds.",
  "Talk in slow motion for the next 2 rounds.",
  "Let the person to your right draw on your face with a washable marker.",
  "Do 15 seconds of your best moonwalk.",
  "Pretend to be a waiter and take everyone's fake food orders.",
  "Do push-ups until it's your turn again (or as many as you can).",
  "Call a random contact and tell them a joke — put it on speaker.",
  "Speak in song lyrics only for the next 2 rounds.",
  "Act like you just won an Oscar — give your acceptance speech.",
  "Let the group assign you a new name for the rest of the game.",
  "Do your best impression of a toddler throwing a tantrum.",
  "Speak in rhyme for the next 2 rounds.",
  "Do 10 squats while singing your favourite song.",
  "Let someone draw a moustache on your face with a washable marker.",
  "Do your best evil villain laugh for 15 seconds.",
  "Pretend to be a tour guide showing the group around this room.",
  "Balance a spoon on your nose for 20 seconds.",
  "Do your best impression of the person across from you.",
  "Talk in a whisper for the next 2 rounds.",
  "Do your best catwalk strut across the room and back.",
  "Act out your morning routine in fast-forward.",
  "Pretend to be a robot that is running out of battery.",
  "Do your best impression of a sports commentator narrating the game.",
  "Hop on one foot until it's your turn again.",
  "Do your best impression of an old person complaining.",
  "Sing the alphabet like it's a dramatic opera.",
  "Let the group give you a 30-second dance challenge.",
  "Do your best impression of a cat trying to get attention.",
  "Pretend you're stuck in an invisible box for 30 seconds.",
  "Do your best superhero landing pose and hold it.",
  "Talk like a pirate for the next 2 rounds.",
  "Do your best impression of a weather reporter in a storm.",
  "Act out a scene from your favourite movie by yourself.",
  "Do 15 seconds of your best air guitar solo.",
  "Let someone pick an accent for you to use until your next turn.",
  "Do your best impression of a dog seeing its owner after a long day.",
  "Pretend to interview the person on your right like a talk show host.",
  "Do your best slow-motion action movie scene.",
  "Wear your socks on your hands for the next 3 rounds.",
  "Do your best impression of a nervous person on a first date.",
  "Balance on one leg with your eyes closed for 20 seconds.",
  "Do your best impression of a magician revealing a trick.",
  "Speak only in movie quotes for the next round.",
  "Do your best runway pose every time it's your turn.",
  "Act out how you'd react if you won the lottery.",
  "Do your best impression of a GPS giving directions.",
  "Do a dramatic reenactment of tripping and falling in slow motion.",
  "Pretend to be a mime trapped behind glass for 30 seconds.",
  "Do your best impression of someone who just woke up.",
  "Sing your name and one fun fact about yourself.",
  "Do your best impression of a ghost trying to scare someone.",
  "Act like you're teaching a class about something silly.",
  "Do your best impression of a baby bird learning to fly.",
  "Talk with an imaginary accent nobody can identify.",
  "Do a dramatic slow clap for the last person's answer.",
  "Pretend to be a statue for the next 30 seconds — no moving.",
  "Do your best impression of a race car driver.",
  "Act out your favourite emoji and let the group guess it.",
  "Do your best impression of a very dramatic soap opera villain.",
  "Give a passionate 20-second speech about your favourite snack.",
  "Do your best impression of a penguin walking across the room.",
  "Pretend the floor is lava and cross the room without touching it.",
  "Do your best impression of a DJ hyping up a crowd.",
  "Act out a commercial for a random object in the room.",
  "Do your best impression of someone who has had too much coffee.",
  "Speak in the third person about yourself for 2 rounds.",
  "Do your best impression of a cartoon character of the group's choice.",
  "Pretend to be a phone that keeps buttdialing everyone.",
  "Do your best impression of a nature documentary narrator watching the group.",
  "Act like you're on a rollercoaster for 20 seconds.",
  "Do your best impression of a grumpy customer.",
  "Give the group a dramatic weather forecast for tomorrow.",
  "Do your best impression of a superhero saving the day.",
  "Act out how you look when you dance alone at home.",
  "Do your best impression of a chicken laying an egg.",
  "Pretend to be a news reporter interviewing yourself.",
  "Do your best impression of a snail crossing the room.",
  "Talk like a cowboy for the next 2 rounds.",
  "Do your best impression of someone stuck in slow motion.",
  "Act out an entire day at the beach in 30 seconds.",
  "Do your best impression of a diva who lost their spotlight.",
  "Pretend to be a lion tamer at the circus.",
  "Do your best impression of a very sleepy person trying to stay awake.",
  "Give an inspiring motivational speech to a houseplant.",
  "Do your best impression of a fashion model who forgot how to walk.",
  "Act out a scene where you meet your favourite celebrity.",
  "Do your best impression of a bee buzzing around flowers.",
  "Pretend to be a game show host announcing the next round.",
  "Do your best impression of a very dramatic movie trailer voice.",
  "Act out getting ready for a big night out in fast-forward.",
  "Do your best impression of a frog hopping around the room.",
  "Give the group a cooking show demonstration with imaginary food.",
  "Do your best impression of a superhero who is afraid of heights.",
  "Act like you're walking against a very strong wind.",
  "Do your best impression of a rockstar signing autographs.",
  "Pretend to be a very serious detective solving a mystery in this room.",
  "Do your best impression of a person seeing snow for the first time.",
  "Act out how a baby reacts to eating a lemon.",
  "Do your best impression of an astronaut floating in space.",
  "Give a dramatic apology to an inanimate object of your choice.",
  "Do your best impression of a proud parent at a graduation.",
  "Act out a silent movie scene with lots of expression.",
  "Do your best impression of a butterfly emerging from a cocoon.",
  "Pretend to host a fake awards show and hand out silly trophies.",
  "Do your best impression of someone who just stepped on a lego.",
  "Act out your reaction to the best surprise party ever.",
  "Do your best impression of a very enthusiastic fitness instructor.",
  "Give a 20-second TED talk about why cereal is or isn't a soup.",
  "Balance a shoe on your foot and flick it into the air — try to catch it.",
  "Do your best slow-motion victory celebration.",
  "Speak in rhyming couplets until your next turn.",
  "Do 12 star jumps while shouting your favourite word.",
  "Act out brushing your teeth like it is the most dramatic moment of your life.",
  "Do an impression of your phone ringing and answering yourself.",
  "Give a two-minute lecture on why socks disappear in the wash.",
  "Do your best impression of a malfunctioning robot vacuum.",
  "Pretend to be a weather balloon slowly deflating.",
  "Do a dramatic reading of the nearest food label.",
  "Hop around the room like a kangaroo for 20 seconds.",
  "Do your best impression of a squirrel hiding a nut.",
  "Give an inspiring pep talk to an empty chair.",
  "Do the floss dance for 15 seconds.",
  "Act out trying to parallel park an invisible car.",
  "Do your best impression of a llama chewing.",
  "Pretend to be a fountain in a fancy hotel lobby.",
  "Do a dramatic runway turn and pose at the end of the room.",
  "Act like you are stuck to the floor by invisible glue for 20 seconds.",
  "Do your best impression of a referee making a big call.",
  "Give a passionate speech about your favourite condiment.",
  "Do your best impression of a cat knocking things off a table.",
  "Pretend to conduct an invisible orchestra dramatically.",
  "Do your best impression of a leaf falling from a tree.",
  "Act out sneaking past a sleeping dragon.",
  "Do your best impression of a very slow escalator.",
  "Give a dramatic monologue as if you are the last biscuit in the tin.",
  "Do your best impression of a hamster on a wheel.",
  "Pretend to be a broken windup toy winding down.",
  "Do a dramatic reenactment of your last sneeze.",
  "Act like you are teaching a fish to swim.",
  "Do your best impression of a proud rooster at sunrise.",
  "Give a tour of your imaginary mansion for 30 seconds.",
  "Do your best impression of a jelly on a plate in an earthquake.",
  "Pretend to be a superhero whose only power is folding laundry.",
  "Do your best impression of a ceiling fan on full speed.",
  "Act out arriving fashionably late to your own party.",
  "Do your best impression of a very shy volcano.",
  "Give a heartfelt thank-you speech to your left shoe.",
  "Do your best impression of a dolphin doing tricks.",
  "Pretend to be a spy sneaking through laser beams to reach the door.",
  "Do your best impression of a kettle coming to the boil.",
  "Act like you are a mannequin coming to life for the first time.",
  "Do your best impression of a bouncy castle losing air.",
  "Give a dramatic farewell to the person on your left as if boarding a ship.",
  "Do your best impression of a chameleon changing colours.",
  "Pretend to be a very dramatic butler announcing dinner.",
  "Do your best impression of a jellyfish drifting in the ocean.",
  "Act out winning a staring contest with an imaginary owl.",
  "Do your best impression of a windscreen wiper in heavy rain.",
  "Give a two-minute review of the chair you are sitting on.",
  "Do your best impression of a peacock showing off its feathers.",
  "Pretend to be an ice cube melting in the sun in slow motion.",
  "Do your best impression of a very enthusiastic weather vane.",
  "Act like you are a firework going off in slow motion.",
  "Do your best impression of a grandfather clock striking noon.",
  "Give a passionate argument for why pineapple belongs on pizza.",
  "Do your best impression of a caterpillar becoming a butterfly.",
  "Pretend to be a very tired ghost who cannot be bothered to haunt.",
  "Do your best impression of a race horse crossing the finish line.",
  "Act out trying to catch a fly that keeps escaping.",
  "Do your best impression of a submarine surfacing.",
  "Give a dramatic weather report using only hand gestures.",
  "Do your best impression of a spinning top slowing down.",
  "Pretend to be a very serious yoga instructor with impossible poses.",
  "Do your best impression of a helicopter taking off.",
  "Act like you are a marionette controlled by invisible strings.",
  "Do your best impression of a toaster popping toast.",
  "Give an emotional goodbye to your imaginary pet rock.",
  "Do your best impression of a flamingo standing on one leg.",
  "Pretend to be a traffic light and direct the room for 30 seconds.",
  "Do your best impression of a paper airplane in flight.",
  "Act out a dramatic slow clap that builds to a standing ovation.",
  "Do your best impression of a very picky food critic tasting air.",
  "Give a motivational speech to the room as if before a big match.",
  "Do your best impression of a sprinkler watering a lawn.",
  "Pretend to be a magician whose tricks keep going wrong.",
  "Do your best impression of a very sleepy sloth reaching for a snack.",
  "Act like you are walking on the moon for 20 seconds.",
  "Do your best impression of a very dramatic opera singer hitting a high note.",
  "Give a tour of an imaginary museum dedicated to spoons.",
  "Do your best impression of a jack-in-the-box popping up.",
  "Pretend to be a robot learning to laugh for the first time.",
  "Do your best impression of a duck waddling to the pond.",
  "Act out reeling in an enormous imaginary fish.",
  "Do your best impression of a spinning ballerina in a music box.",
  "Give a dramatic acceptance speech for winning best snacker.",
  "Do your best impression of a very confused GPS recalculating.",
  "Pretend to be a superhero landing after a very long flight.",
  "Do your best impression of a cuckoo clock at midday.",
  "Act like you are ice skating across the room in slow motion.",
  "Do your best impression of a very dramatic soup being stirred.",
  "Give a heartfelt toast to the snacks you plan to eat later.",
  "Do your best impression of a kite caught in a strong wind.",
  "Pretend to be a very polite robot apologising for everything.",
  "Do your best impression of a turtle winning a race.",
  "Act out an intense thumb war with yourself.",
  "Do your best impression of a very dramatic candle flickering.",
  "Give a two-minute presentation on the history of your left sock.",
  "Do your best impression of a bee that has forgotten where the hive is.",
  "Pretend to be a very fancy fountain pen writing a love letter.",
  "Do your best impression of a rollercoaster going up the first hill.",
  "Act like you are a superhero whose cape keeps getting in the way.",
  "Do your best impression of a very serious chess grandmaster.",
  "Give a dramatic play-by-play of someone tying their shoelaces.",
  "Do your best impression of a very bouncy trampoline.",
  "Pretend to be a lighthouse guiding ships for 30 seconds.",
  "Do your best impression of a very grumpy alarm clock.",
  "Act out being a superhero whose power is making toast appear.",
  "Do your best impression of a very dramatic feather floating down.",
  "Give an enthusiastic sales pitch for a completely ordinary rock.",
  "Do your best impression of a very wobbly newborn giraffe.",
  "Pretend to be an astronaut planting a flag on a new planet.",
  "Do your best impression of a very dramatic sunrise.",
  "Act like you are a robot dancing at a disco.",
  "Do your best impression of a very slow-motion high five with yourself.",
  "Give a heartfelt eulogy for a snack you finished too quickly.",
  "Do your best impression of a very determined ant carrying a crumb.",
  "Pretend to be a very dramatic curtain opening for a big show.",
  "Do your best impression of a spinning washing machine.",
  "Act out an epic battle with an imaginary mosquito.",
  "Do your best impression of a very proud peacock strutting.",
  "Give a passionate speech about the best type of biscuit for dunking.",
  "Do your best impression of a very confused robot dancing to no music.",
  "Pretend to be a superhero rescuing a cat from an imaginary tree.",
  "Do your best impression of a very dramatic paper being crumpled.",
  "Act like you are surfing an enormous imaginary wave.",
  "Do your best impression of a very sleepy lighthouse keeper.",
  "Give a grand tour of the room as if it were a five-star resort.",
  "Do your best impression of a very energetic popcorn kernel popping.",
  "Pretend to be a very serious librarian shushing the whole room.",
  "Do your best impression of a very dramatic elevator arriving.",
  "Act out trying to blow up the world's most stubborn balloon.",
  "Do your best impression of a very fancy swan gliding on a lake.",
  "Give an inspiring locker-room speech to a team of houseplants.",
  "Do your best impression of a very dramatic revolving door.",
  "Pretend to be a robot chef presenting an imaginary five-course meal.",
  "Do your best impression of a very excited puppy chasing its tail.",
  "Act like you are tiptoeing across a floor of imaginary bubble wrap.",
  "Do your best impression of a very dramatic paper boat sailing.",
  "Give a passionate speech defending your favourite ice cream flavour.",
  "Do your best impression of a very confident cat walking a runway.",
  "Pretend to be a weather reporter caught in a surprise snowstorm.",
  "Do your best impression of a very dramatic bubble slowly rising.",
  "Act out an intense slow-motion race with the person on your right.",
  "Do your best impression of a very sleepy owl trying to stay awake.",
  "Give a two-minute tour of your imaginary rooftop garden.",
  "Do your best impression of a very dramatic spinning coin landing.",
  "Pretend to be a superhero whose only weakness is tickly feet.",
  "Do your best impression of a very proud chef tasting their own soup.",
];

const DARES_SPICY: string[] = [
  "Give a lap dance to the person on your left.",
  "Kiss the person across from you for 10 seconds.",
  "Remove an article of clothing of the group's choice.",
  "Let someone go through your DMs for 60 seconds — no deleting.",
  "Send a flirty text to your most recent contact — read it aloud.",
  "Whisper the dirtiest thing you can think of in the ear of the person to your right.",
  "Give someone in the room a hickey.",
  "Sit on someone's lap for the next 2 rounds.",
  "Do your sexiest dance for 30 seconds.",
  "Let someone body-paint a word on your stomach.",
  "Show the group your most embarrassing photo and explain the story.",
  "Lick your lips seductively while making eye contact with everyone in the room.",
  "Demonstrate your best fake moan — make it convincing.",
  "Let someone blindfold you and guess who's touching your face.",
  "Post 'I'm single and ready to mingle' on your story (or pretend to call an ex).",
  "Slow dance with someone for 30 seconds — no music.",
  "Let the group choose someone for you to spoon with for 2 minutes.",
  "Show the last person you searched for on Instagram.",
  "Serenade someone in the room with the most romantic song you know.",
  "Hold eye contact with the person across from you for 60 seconds — no laughing.",
  "Take a body shot off someone (or simulate it with water).",
  "Tell the group about your most embarrassing hookup in detail.",
  "Let someone write a Tinder bio for you — and you have to use it for 24 hours.",
  "Act out your go-to flirting technique on someone here.",
  "Send 'I had a dream about you last night' to the fifth contact in your phone.",
  "Let someone pick your outfit for the rest of the night from what's available.",
  "Give someone a 30-second shoulder massage.",
  "Play a romantic scene from a movie with someone — group picks the scene.",
  "Describe in detail the last dream you had about someone.",
  "Take a suggestive selfie and show the group (you don't have to post it).",
  "Let the group go through your search history for 30 seconds.",
  "Do your best strip-tease impression (keep it PG-13 or don't — your call).",
  "Text your ex 'thinking about you' — or show us you would if you could.",
  "Bite your lip and wink at three different people.",
  "Feed the person next to you something in the most romantic way possible.",
  "Reenact the last time you flirted with someone — use props.",
  "Let someone put their hands anywhere on you for 10 seconds (with consent).",
  "Wear someone else's shirt for the next 3 rounds.",
  "Give a dramatic marriage proposal to the person on your right — on one knee.",
  "Play 7 minutes in heaven with someone (or do a 2-minute closet dare).",
  "Write a love letter to the person across from you and read it aloud.",
  "Tell us the most NSFW thing on your phone right now — show or describe.",
  "Let someone pick a contact and you have to send them a heart emoji with no context.",
  "Recreate a famous romantic movie kiss with someone willing.",
  "Draw a tattoo on someone's body with a marker — they can't see it first.",
  "Do your best impression of what you look like during an orgasm.",
  "Pick someone and tell them the first thing you noticed about them — be honest.",
  "Suck on an ice cube seductively for 15 seconds.",
  "Let someone put lipstick on you blindfolded.",
  "Describe your most embarrassing moment in a relationship.",
  "Call your most recent ex and tell them one thing you miss about them — on speaker.",
  "Give the person to your left a compliment that would make them blush.",
  "Hold hands with the person across from you for the next 2 rounds.",
  "Whisper a compliment into the ear of the person next to you.",
  "Give the person on your right a 30-second hand massage.",
  "Stare into each other's eyes for 30 seconds without laughing.",
  "Slow dance together for one full song.",
  "Tell the other person three things you find attractive about them.",
  "Give a genuine compliment about the other person's smile.",
  "Sit back to back and try to make each other laugh without touching.",
  "Feed each other a snack with your eyes closed.",
  "Write a short flirty note and hand it to the other person to read aloud.",
  "Recreate the most romantic movie scene you both know.",
  "Give each other a nickname you'll use for the rest of the game.",
  "Whisper what you first noticed about the other person.",
  "Do a couples pose for a photo together.",
  "Give the other person your best pickup line with a straight face.",
  "Hold a playful staring contest — first to smile loses.",
  "Tell the other person your favourite thing about spending time with them.",
  "Take a fun selfie together doing your best model faces.",
  "Give each other a genuine compliment you've never said out loud.",
  "Slow dance cheek to cheek for 30 seconds.",
  "Whisper the sweetest thing you can think of to the other person.",
  "Hold both of each other's hands and share your favourite memory together.",
  "Give the other person a gentle forehead touch and a compliment.",
  "Serenade the other person with a romantic song for 20 seconds.",
  "Recreate your ideal first date in one dramatic sentence each.",
  "Give each other a piggyback ride across the room.",
  "Look into each other's eyes and describe them in three words.",
  "Tell the other person what your perfect date with them would be.",
  "Do a slow-motion movie run toward each other and hug.",
  "Whisper a secret compliment only the other person can hear.",
  "Link arms and take a romantic stroll around the room.",
  "Give each other a playful high-five that turns into holding hands.",
  "Compliment the other person's laugh and make them do it.",
  "Share a piece of chocolate and describe the taste dramatically.",
  "Do your best couples dance move together for 20 seconds.",
  "Whisper what song reminds you of the other person.",
  "Give each other a warm hug that lasts 15 seconds.",
  "Tell the other person one thing that makes them irresistible.",
  "Recreate a famous romantic proposal — take turns.",
  "Sit close and describe your dream getaway together.",
  "Give the other person a shoulder-to-shoulder lean and a compliment.",
  "Do a synchronized dance move you both invent on the spot.",
  "Whisper the most charming thing you've ever wanted to say.",
  "Hold hands and share your favourite thing about each other.",
  "Take turns giving each other a cheesy but sincere compliment.",
  "Do a slow spin together like in a romantic movie.",
  "Whisper where you'd take the other person on a dream date.",
  "Give each other a gentle high-five and hold the hand for 10 seconds.",
  "Look at each other and say your first impression out loud.",
  "Do a couples pose and hold it for a photo for 10 seconds.",
  "Tell the other person the sweetest lie to make them smile.",
  "Share your favourite romantic movie and act out one line together.",
  "Give the other person a compliment about their eyes.",
  "Do a dramatic slow-motion hug across the room.",
  "Whisper what you'd write in a love letter to the other person.",
  "Take turns describing your ideal cozy evening together.",
  "Give each other a playful wink and a compliment.",
  "Hold hands and count to ten while smiling at each other.",
  "Do your best romantic dip like at the end of a dance.",
  "Whisper the most flattering thing you can think of.",
  "Share a blanket or jacket together for the next 2 rounds.",
  "Give the other person a genuine compliment about their style.",
  "Do a couples freeze-frame pose of the group's choice.",
  "Whisper what you'd name your future pet together.",
  "Take turns saying one thing you admire about each other.",
  "Do a slow dance with no music for 20 seconds.",
  "Give each other a warm compliment while holding eye contact.",
  "Recreate a romantic scene using only exaggerated facial expressions.",
  "Whisper your favourite quality in the other person.",
  "Hold hands and share your happiest memory of the day.",
  "Give the other person a compliment that starts with the first letter of their name.",
  "Do a couples selfie doing your most dramatic romantic looks.",
  "Whisper what your perfect goodnight would be.",
  "Take turns gently booping each other's nose and giving a compliment.",
  "Do a slow, dramatic romantic movie reunion hug.",
  "Whisper the kindest thing you've been holding back.",
  "Give each other a genuine compliment about their personality.",
  "Do a couples dance move inspired by your favourite song.",
  "Whisper where you imagine your dream vacation together.",
  "Hold hands and take turns naming a star sign compliment.",
  "Give the other person your warmest smile for 15 seconds.",
  "Do a slow-motion romantic high-five that ends in a fist bump.",
  "Whisper the most romantic word you can think of.",
  "Take turns describing each other as a flavour of ice cream.",
  "Give each other a gentle hug and say one kind word.",
  "Do a couples pose recreating a famous album cover.",
  "Whisper what you'd cook for the other person on a date.",
  "Hold eye contact and share one thing you're grateful for about them.",
  "Give the other person a compliment about their voice.",
  "Do a slow, exaggerated romantic wave across the room.",
  "Whisper your idea of a perfect lazy Sunday together.",
  "Take turns giving a compliment that rhymes.",
  "Give each other a warm side-hug for 10 seconds.",
  "Do a dramatic couples pose like a movie poster.",
  "Whisper what you find most charming about the other person.",
  "Hold hands and take a slow victory lap around the room together.",
  "Give the other person a heartfelt compliment to end the round.",
  "Give the person across from you a compliment about their best feature.",
  "Slow dance together to an imaginary romantic song for 20 seconds.",
  "Whisper a sweet compliment into the ear of the person on your left.",
  "Take a dramatic couples photo pretending to be on a red carpet.",
  "Give each other a superhero name to use for the rest of the game.",
  "Hold hands and share your favourite snack of all time.",
  "Do a synchronized twirl and freeze in a fun pose.",
  "Give the other person a fist bump and then a thumbs up.",
  "Look into each other's eyes and describe them using only one word.",
  "Whisper the first thing you noticed about the person on your right.",
  "Do your most charming wink at three different people.",
  "Give a heartfelt toast to the most attractive person in the room without naming them.",
  "Do a dramatic slow-motion approach and shake hands like old friends.",
  "Tell the other person a joke and compliment their reaction.",
  "Do a couples pose imitating two characters from a cartoon.",
  "Whisper what adventure you would plan for the two of you.",
  "Share a warm back-to-back lean for ten seconds.",
  "Take turns saying one thing you find charming about each other.",
  "Lead your partner in a graceful dance dip and hold it.",
  "Whisper one thing that made you smile about the person beside you.",
  "Link arms and skip together once around the room.",
  "Give the other person a compliment using a word that rhymes with their name.",
  "Do a dramatic slow clap for how good the other person looks tonight.",
  "Share a snack and rate it out of ten with dramatic commentary.",
  "Whisper which movie character reminds you of the person across from you.",
  "Give each other a playful pretend-royalty wave and curtsey.",
  "Have a friendly staring contest — first to blink loses.",
  "Strike a superhero freeze-frame pose together.",
  "Whisper what breed of dog you would adopt together.",
  "Take turns giving a compliment that begins with the letter A.",
  "Do a joyful slow-motion airport-style reunion hug.",
  "Give the other person your brightest smile and hold it for ten seconds.",
  "Whisper the most flattering thing you can honestly say.",
  "Perform a dramatic tango step together for twenty seconds.",
  "Compliment the other person's choice of shoes with full confidence.",
  "Hold hands and count to ten out loud while grinning at each other.",
  "Whisper what you would write on a note to the person on your left.",
  "Take turns describing each other as a type of dessert.",
  "Do a synchronized romantic pose for a photo.",
  "Give the other person a compliment about their hairstyle.",
  "Whisper how you like to say goodnight to someone special.",
  "Take a couples selfie striking your most glamorous poses.",
  "Give each other a gentle pat on the back and one kind word.",
  "Sway cheek to cheek together for a slow count of twenty.",
  "Whisper the most charming line you can think of on the spot.",
  "Hold both hands and share the best gift you ever received.",
  "Give the other person a compliment about their handwriting or doodles.",
  "Do a dramatic couples pose like the cover of a romance novel.",
  "Whisper which city you would explore together first.",
  "Take turns giving each other a sincere but cheesy compliment.",
  "Give the person across from you a genuine hug and a whispered thank-you.",
  "Give each other a grand theatrical bow from across the room.",
  "Whisper one habit you find endearing about the person on your right.",
  "Hold hands and march a triumphant lap around the room together.",
  "Give the other person a compliment about their posture.",
  "Do a couples pose imitating a famous duo or team.",
  "Whisper what restaurant you would take the other person to.",
  "Take turns naming a talent you admire in each other.",
  "Give the person across from you a compliment and a friendly salute.",
  "Do a slow, exaggerated romantic bow to your partner.",
  "Whisper one compliment you were too shy to give earlier.",
  "Give the other person a heartfelt compliment about their patience.",
  "Do a couples dance inspired by a decade you both pick.",
  "Whisper how you would spend a perfect rainy afternoon together.",
  "Hold hands and take turns naming a compliment based on the current season.",
  "Give the other person a warm two-handed handshake and a kind word.",
  "Do an elaborate secret handshake you invent together.",
  "Whisper the most romantic place name you can think of.",
  "Take turns describing each other in one glowing sentence.",
  "Share a gentle hug and each say one thing you are glad about tonight.",
  "Do a couples pose pretending to be statues of famous lovers.",
  "Whisper what your ideal weekend together would look like.",
  "Hold eye contact and share one wish you have for each other.",
  "Give the other person a compliment about the way they tell stories.",
  "Do a slow, dramatic romantic reveal like the end of a makeover.",
  "Give a hidden compliment by spelling it out with your hands.",
  "Take turns gently complimenting something about each other's outfit.",
  "Clap out a short rhythm together in sync.",
  "Take a couples selfie pulling your silliest happy faces.",
  "Whisper what song you would slow dance to together.",
  "Give the person across from you a genuine compliment about their confidence.",
  "Do a graceful turn and end back to back.",
  "Whisper the nicest thing anyone could say about them.",
  "Hold hands and describe your dream double-date evening.",
  "Give the other person a heartfelt compliment about their kindness.",
  "Do a dramatic couples pose recreating a wedding photo.",
  "Whisper where you imagine the perfect first date would be.",
  "Take turns giving a compliment while doing a small bow.",
  "Give each other a gentle elbow bump and a kind word.",
  "Do a slow-motion romantic movie glance across the room.",
  "Whisper what nickname you would secretly give the other person.",
  "Hold hands and take turns naming a dream you want to chase.",
  "Give the other person a warm compliment about their energy.",
  "Do a couples pose pretending to be on a magazine cover together.",
  "Whisper the most charming thing you would say to break the ice.",
  "Take turns describing each other as a type of weather.",
  "Give each other a gentle hug and whisper one thing you appreciate.",
  "Do a slow romantic dance holding just fingertips for twenty seconds.",
  "Whisper which beach you would visit together.",
  "Give the other person a compliment about their handshake or high-five.",
  "Do a dramatic slow-motion toast to each other with imaginary drinks.",
  "Whisper the sweetest goodnight you can imagine.",
  "Hold eye contact and describe the other person in a single warm word.",
  "Give each other a playful shoulder bump and a compliment.",
  "Do a couples pose recreating a famous movie romance scene.",
  "Whisper what you would plan for a surprise date together.",
  "Take turns saying one thing that makes the other person stand out.",
  "Give the person on your left a warm compliment about their outfit.",
  "Do a slow romantic wave and blow a friendly kiss across the room.",
  "Whisper what flavour of dessert reminds you of the other person.",
  "Hold hands and each name a favourite hobby.",
  "Give the other person a heartfelt compliment about their optimism.",
  "Do a synchronized romantic pose like a pair of dancers.",
  "Whisper the most charming compliment you can invent right now.",
  "Take turns describing each other as a colour and why.",
  "Do a double fist bump and share one kind word.",
  "Do a slow dramatic romantic gaze and then a big grin.",
  "Whisper what you would name a boat you owned together.",
  "Hold hands and count to five naming a favourite colour each.",
  "Give the other person a genuine compliment about their determination.",
  "Do a couples pose recreating a classic dance photo.",
  "Whisper where you would love to watch a sunset together.",
  "Take turns giving a compliment in your most charming voice.",
  "Give each other a warm hug and share one hope for the night.",
  "Do a slow-motion romantic reunion at the door of the room.",
  "Whisper the most heartfelt thing you can say in five words.",
  "Hold hands and describe your perfect cosy movie night together.",
  "Give the other person a compliment about the way they carry themselves.",
  "Do a couples pose pretending to be on a romantic postcard.",
  "Whisper what you would write in a birthday card to each other.",
  "Take turns saying one adventurous date idea you would both enjoy.",
  "Give each other a triple high-five combo you make up.",
  "Do a slow romantic sway together for twenty seconds.",
  "Whisper the most charming secret you can safely share.",
  "Hold eye contact and give each other a nickname on the spot.",
  "Give the other person a warm compliment about their sense of humour.",
  "Do a couples pose recreating a famous romantic statue.",
  "Whisper what your dream picnic together would include.",
  "Take turns describing each other as a song title.",
  "Do a celebratory jump and a heartfelt compliment together.",
  "Do a slow, dramatic romantic bow and curtsey to each other.",
  "Whisper the kindest compliment you can think of right now.",
  "Hold hands and share your favourite moment of the game so far.",
  "Give the other person a compliment about how they light up a room.",
  "Do a couples pose pretending to pose for a fancy portrait.",
  "Whisper what you would name a cafe you opened together.",
  "Take turns saying one thing you would love to do on a date.",
  "Give each other a warm hug and one sincere goodnight wish.",
  "Do a slow romantic twirl and end holding both hands.",
  "Whisper one thing you have been meaning to say all night.",
  "Give each other a warm compliment and a gentle handshake to seal it.",
  "Do a slow romantic sway and end with a synchronized wave.",
];

/* ------------------------------------------------------------------ */
/*  Custom questions localStorage                                      */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = 'kasuku-tod-custom';

interface CustomQuestions {
  truths: string[];
  dares: string[];
}

function loadCustom(): CustomQuestions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        truths: Array.isArray(parsed.truths) ? parsed.truths : [],
        dares: Array.isArray(parsed.dares) ? parsed.dares : [],
      };
    }
  } catch { /* ignore */ }
  return { truths: [], dares: [] };
}

function saveCustom(q: CustomQuestions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Player {
  name: string;
  avatar: string;
  completed: number;
  skipped: number;
  truthCount: number;
  dareCount: number;
  history: { type: 'truth' | 'dare'; prompt: string; done: boolean }[];
}

type Phase = 'setup' | 'spinner' | 'choose' | 'reveal' | 'vote-skip' | 'summary';

const MODE_META: Record<'rafiki' | 'spicy' | 'custom', { label: string; swLabel: string; color: string; icon: React.ReactNode; desc: string }> = {
  rafiki: { label: 'Rafiki', swLabel: 'Marafiki', color: C.rafiki, icon: <Users size={18} />, desc: 'Clean fun for friends' },
  spicy:  { label: 'Spicy',  swLabel: 'Moto',     color: C.spicy,  icon: <Heart size={18} />,  desc: 'Adults only. No limits.' },
  custom: { label: 'Custom', swLabel: 'Maalum',    color: C.custom, icon: <Settings size={18} />, desc: 'Your own questions' },
};

const ROUNDS_PER_PLAYER = 3;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function TruthOrDare({ onBack, onGameEnd, duo }: { onBack: () => void; onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void; duo?: { me: string; them: string } | null }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([
    { name: '', avatar: AVATARS[0], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] },
    { name: '', avatar: AVATARS[1], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] },
  ]);
  const [mode, setMode] = useState<GameMode>('rafiki');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [choice, setChoice] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [flipped, setFlipped] = useState(false);

  // Custom questions editor
  const [customQs, setCustomQs] = useState<CustomQuestions>(loadCustom);
  const [customTruthInput, setCustomTruthInput] = useState('');
  const [customDareInput, setCustomDareInput] = useState('');

  // Spinner state
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [spinnerDone, setSpinnerDone] = useState(false);
  const spinnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vote to skip
  const [skipVotes, setSkipVotes] = useState<Set<number>>(new Set());

  // Used pool tracking
  const usedTruths = useRef<Set<string>>(new Set());
  const usedDares = useRef<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  const totalTurns = players.length * ROUNDS_PER_PLAYER;
  const currentTurn = currentRound * players.length + currentPlayerIdx;

  /* --- Get the active content pool --- */
  const getTruthPool = useCallback((): string[] => {
    if (mode === 'rafiki') return TRUTHS_RAFIKI;
    if (mode === 'spicy') return TRUTHS_SPICY;
    return customQs.truths;
  }, [mode, customQs.truths]);

  const getDarePool = useCallback((): string[] => {
    if (mode === 'rafiki') return DARES_RAFIKI;
    if (mode === 'spicy') return DARES_SPICY;
    return customQs.dares;
  }, [mode, customQs.dares]);

  /* --- Setup helpers --- */
  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers(p => [...p, { name: '', avatar: AVATARS[p.length % AVATARS.length], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] }]);
  };

  const removePlayer = (i: number) => {
    if (players.length <= 2) return;
    setPlayers(p => p.filter((_, idx) => idx !== i));
  };

  const updateName = (i: number, name: string) => {
    setPlayers(p => p.map((pl, idx) => idx === i ? { ...pl, name } : pl));
  };

  const canStart = (() => {
    const allNamed = players.every(p => p.name.trim().length > 0);
    if (!allNamed) return false;
    if (mode === 'custom') {
      return customQs.truths.length >= 1 && customQs.dares.length >= 1;
    }
    return true;
  })();

  const startGame = () => {
    if (!canStart) return;
    sfxTap();
    usedTruths.current = new Set();
    usedDares.current = new Set();
    setPlayers(p => p.map(pl => ({ ...pl, completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] })));
    setCurrentPlayerIdx(0);
    setCurrentRound(0);
    startSpinner(0);
  };

  /* --- Spinner animation --- */
  const startSpinner = (targetIdx: number) => {
    setSpinnerDone(false);
    setPhase('spinner');
    setSpinnerIdx(0);

    let tick = 0;
    const totalTicks = 14 + Math.floor(Math.random() * 6);

    const runSpin = () => {
      tick++;
      const delay = 80 + tick * 30 + (tick > totalTicks - 4 ? tick * 40 : 0);
      setSpinnerIdx(prev => (prev + 1) % players.length);

      if (tick >= totalTicks) {
        setSpinnerIdx(targetIdx);
        setTimeout(() => {
          sfxReveal();
          setSpinnerDone(true);
        }, 300);
      } else {
        sfxTap();
        spinnerTimer.current = setTimeout(runSpin, delay);
      }
    };

    spinnerTimer.current = setTimeout(runSpin, 120);
  };

  useEffect(() => {
    return () => {
      if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    };
  }, []);

  /* --- Invited duo: skip setup, pre-seed two players, auto-start --- */
  useEffect(() => {
    if (!duo) return;
    const seeded: Player[] = [
      { name: duo.me, avatar: AVATARS[0], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] },
      { name: duo.them, avatar: AVATARS[1 % AVATARS.length], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] },
    ];
    setPlayers(seeded);
    usedTruths.current = new Set();
    usedDares.current = new Set();
    setCurrentPlayerIdx(0);
    setCurrentRound(0);
    startSpinner(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSpinnerContinue = () => {
    setPhase('choose');
  };

  /* --- Pick prompt --- */
  const pickPrompt = useCallback((type: 'truth' | 'dare') => {
    const pool = type === 'truth' ? getTruthPool() : getDarePool();
    const used = type === 'truth' ? usedTruths.current : usedDares.current;
    let available = pool.filter(p => !used.has(p));
    if (available.length === 0) {
      used.clear();
      available = [...pool];
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    used.add(picked);
    return picked;
  }, [getTruthPool, getDarePool]);

  const handleChoice = (type: 'truth' | 'dare') => {
    sfxTap();
    setChoice(type);
    setPrompt(pickPrompt(type));
    setFlipped(false);
    setSkipVotes(new Set());
    setPhase('reveal');
    setTimeout(() => { sfxReveal(); setFlipped(true); }, 50);
  };

  /* --- Vote to skip --- */
  const toggleVote = (playerIdx: number) => {
    sfxTap();
    setSkipVotes(prev => {
      const next = new Set(prev);
      if (next.has(playerIdx)) next.delete(playerIdx);
      else next.add(playerIdx);
      return next;
    });
  };

  const majorityReached = skipVotes.size > players.length / 2;

  useEffect(() => {
    if (majorityReached && phase === 'reveal') {
      const timer = setTimeout(() => {
        handleResult(false, true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [majorityReached, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- Handle result --- */
  const handleResult = (done: boolean, _wasVoteSkip = false) => {
    if (done) sfxCorrect(); else sfxWrong();
    setPlayers(p => p.map((pl, idx) => {
      if (idx !== currentPlayerIdx) return pl;
      return {
        ...pl,
        completed: pl.completed + (done ? 1 : 0),
        skipped: pl.skipped + (done ? 0 : 1),
        truthCount: pl.truthCount + (choice === 'truth' ? 1 : 0),
        dareCount: pl.dareCount + (choice === 'dare' ? 1 : 0),
        history: [...pl.history, { type: choice!, prompt, done }],
      };
    }));

    let nextPlayer = currentPlayerIdx + 1;
    let nextRound = currentRound;
    if (nextPlayer >= players.length) {
      nextPlayer = 0;
      nextRound += 1;
    }
    if (nextRound >= ROUNDS_PER_PLAYER) {
      sfxGameOver();
      setPhase('summary');
    } else {
      sfxLevelUp();
      setCurrentPlayerIdx(nextPlayer);
      setCurrentRound(nextRound);
      setChoice(null);
      setSkipVotes(new Set());
      startSpinner(nextPlayer);
    }
  };

  const resetGame = () => {
    setPhase('setup');
    setPlayers(p => p.map(pl => ({ ...pl, completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] })));
    setCurrentPlayerIdx(0);
    setCurrentRound(0);
    setChoice(null);
    setSkipVotes(new Set());
  };

  // Report score at game end
  useEffect(() => {
    if (phase === 'summary') {
      const totalCompleted = players.reduce((s, p) => s + p.completed, 0);
      const totalTurnsPlayed = players.reduce((s, p) => s + p.completed + p.skipped, 0);
      onGameEnd?.({
        score: totalCompleted,
        accuracy: totalTurnsPlayed > 0 ? totalCompleted / totalTurnsPlayed : 0,
        level: 1,
        maxScore: totalTurnsPlayed,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- Custom question helpers --- */
  const addCustomTruth = () => {
    const t = customTruthInput.trim();
    if (!t) return;
    const next = { ...customQs, truths: [...customQs.truths, t] };
    setCustomQs(next);
    saveCustom(next);
    setCustomTruthInput('');
  };

  const addCustomDare = () => {
    const d = customDareInput.trim();
    if (!d) return;
    const next = { ...customQs, dares: [...customQs.dares, d] };
    setCustomQs(next);
    saveCustom(next);
    setCustomDareInput('');
  };

  const removeCustomTruth = (i: number) => {
    const next = { ...customQs, truths: customQs.truths.filter((_, idx) => idx !== i) };
    setCustomQs(next);
    saveCustom(next);
  };

  const removeCustomDare = (i: number) => {
    const next = { ...customQs, dares: customQs.dares.filter((_, idx) => idx !== i) };
    setCustomQs(next);
    saveCustom(next);
  };

  const currentPlayer = players[currentPlayerIdx];
  const modeMeta = MODE_META[mode === 'custom' ? 'custom' : mode];
  const modeColor = modeMeta.color;

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '0 0 40px',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', padding: 4,
          transition: `color ${MOTION.snap}`,
        }}
          onMouseEnter={e => (e.currentTarget.style.color = C.text)}
          onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Truth or Dare
          </h1>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Ukweli au Changamoto</span>
        </div>
        {phase !== 'setup' && phase !== 'summary' && (
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.muted,
            background: C.card, padding: '4px 12px', borderRadius: RADIUS.full,
            border: `1px solid ${C.border}`,
          }}>
            Raundi {currentRound + 1}/{ROUNDS_PER_PLAYER}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* ============================================================ */}
        {/*  SETUP PHASE                                                  */}
        {/* ============================================================ */}
        {phase === 'setup' && (
          <div style={{ paddingTop: 24 }}>
            {/* Mode picker */}
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
              Hali — Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
              {(['rafiki', 'spicy', 'custom'] as const).map(m => {
                const meta = MODE_META[m];
                const sel = m === mode;
                return (
                  <button key={m} onClick={() => setMode(m)} style={{
                    background: sel ? meta.color + '18' : C.card,
                    border: `1px solid ${sel ? meta.color + '60' : C.border}`,
                    borderRadius: RADIUS.md,
                    padding: '14px 4px 10px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    color: sel ? meta.color : C.muted,
                    transition: `all ${MOTION.fast}`,
                    boxShadow: sel ? `0 0 20px ${meta.color}20` : C.glass,
                  }}>
                    {meta.icon}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ fontSize: 9, color: C.dim }}>{meta.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom questions editor */}
            {mode === 'custom' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                  Custom Truths ({customQs.truths.length})
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={customTruthInput}
                    onChange={e => setCustomTruthInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTruth()}
                    placeholder="Add a truth question..."
                    style={{
                      flex: 1, background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: RADIUS.md, padding: '8px 12px',
                      color: C.text, fontSize: 13, fontWeight: 500,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button onClick={addCustomTruth} style={{
                    ...solidBtn(C.truth), padding: '8px 14px', fontSize: 12,
                  }}>
                    <Plus size={14} />
                  </button>
                </div>
                {customQs.truths.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16, maxHeight: 140, overflowY: 'auto' }}>
                    {customQs.truths.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: C.card, borderRadius: RADIUS.sm,
                        padding: '6px 10px', fontSize: 12, color: C.text,
                        border: `1px solid ${C.border}`,
                      }}>
                        <Sparkles size={12} style={{ color: C.truth, flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                        <button onClick={() => removeCustomTruth(i)} style={{
                          background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex',
                        }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                  Custom Dares ({customQs.dares.length})
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={customDareInput}
                    onChange={e => setCustomDareInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomDare()}
                    placeholder="Add a dare..."
                    style={{
                      flex: 1, background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: RADIUS.md, padding: '8px 12px',
                      color: C.text, fontSize: 13, fontWeight: 500,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button onClick={addCustomDare} style={{
                    ...solidBtn(C.dare), padding: '8px 14px', fontSize: 12,
                  }}>
                    <Plus size={14} />
                  </button>
                </div>
                {customQs.dares.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                    {customQs.dares.map((d, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: C.card, borderRadius: RADIUS.sm,
                        padding: '6px 10px', fontSize: 12, color: C.text,
                        border: `1px solid ${C.border}`,
                      }}>
                        <Flame size={12} style={{ color: C.dare, flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d}</span>
                        <button onClick={() => removeCustomDare(i)} style={{
                          background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex',
                        }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {mode === 'custom' && (customQs.truths.length < 1 || customQs.dares.length < 1) && (
                  <div style={{ fontSize: 11, color: C.dare, marginTop: 8 }}>
                    Add at least 1 truth and 1 dare to play custom mode.
                  </div>
                )}
              </div>
            )}

            {/* Players */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Wachezaji — Players ({players.length}/8)
              </label>
              {players.length < 8 && (
                <button onClick={addPlayer} style={{
                  ...solidBtn(C.truth),
                  padding: '4px 12px', fontSize: 11,
                }}>
                  <Plus size={14} /> Add
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {players.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: C.card, borderRadius: RADIUS.md,
                  border: `1px solid ${C.border}`,
                  padding: '8px 12px',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24, width: 36, textAlign: 'center' }}>{p.avatar}</span>
                  <input
                    ref={i === players.length - 1 ? inputRef : undefined}
                    value={p.name}
                    onChange={e => updateName(i, e.target.value)}
                    placeholder={`Player ${i + 1}`}
                    maxLength={16}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: C.text, fontSize: 15, fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  />
                  {players.length > 2 && (
                    <button onClick={() => removePlayer(i)} style={{
                      background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
                      display: 'flex', padding: 4,
                      transition: `color ${MOTION.snap}`,
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.dare)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Start */}
            <button onClick={startGame} disabled={!canStart} style={{
              ...solidBtn(modeColor),
              width: '100%', justifyContent: 'center',
              fontSize: 16, padding: '14px 24px',
              opacity: canStart ? 1 : 0.4,
            }}>
              <Play size={18} /> Start Game
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  SPINNER PHASE                                                 */}
        {/* ============================================================ */}
        {phase === 'spinner' && (
          <div style={{
            paddingTop: 60,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'fadeSlideIn 400ms ease',
          }}>
            {/* Progress bar */}
            <div style={{
              width: '100%', height: 4, background: C.card,
              borderRadius: RADIUS.full, marginBottom: 40, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(currentTurn / totalTurns) * 100}%`,
                background: modeColor,
                borderRadius: RADIUS.full,
                transition: `width ${MOTION.med}`,
              }} />
            </div>

            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 24 }}>
              Nani anafuata? — Who's next?
            </span>

            {/* Spinner ring */}
            <div style={{
              display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
              marginBottom: 32,
            }}>
              {players.map((p, i) => {
                const isActive = spinnerIdx === i;
                const isFinal = spinnerDone && spinnerIdx === i;
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '12px 16px',
                    borderRadius: RADIUS.lg,
                    background: isActive ? (isFinal ? modeColor + '25' : C.card) : 'transparent',
                    border: `2px solid ${isActive ? (isFinal ? modeColor : C.dim) : 'transparent'}`,
                    transition: 'all 80ms ease',
                    transform: isFinal ? 'scale(1.15)' : isActive ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isFinal ? `0 0 30px ${modeColor}30` : 'none',
                  }}>
                    <span style={{ fontSize: isFinal ? 40 : 28, transition: 'font-size 200ms ease' }}>
                      {p.avatar}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: isActive ? C.text : C.dim,
                    }}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {spinnerDone && (
              <div style={{ animation: 'fadeSlideIn 300ms ease', textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600, marginBottom: 4, color: modeColor }}>
                  {currentPlayer.name}!
                </h2>
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 24, display: 'block' }}>
                  Zamu yako — Your turn
                </span>
                <div style={{
                  display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: C.dim, marginBottom: 24,
                }}>
                  <span>Raundi {currentRound + 1}/{ROUNDS_PER_PLAYER}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.dim }} />
                  <span style={{ color: modeColor }}>{modeMeta.label}</span>
                </div>

                <button onClick={handleSpinnerContinue} style={{
                  ...solidBtn(modeColor),
                  fontSize: 16, padding: '14px 36px',
                }}>
                  Chagua — Choose <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  CHOOSE TRUTH OR DARE                                         */}
        {/* ============================================================ */}
        {phase === 'choose' && (
          <div style={{
            paddingTop: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'fadeSlideIn 300ms ease',
          }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 32 }}>
              {currentPlayer.avatar} {currentPlayer.name} — chagua moja
            </span>

            <div style={{ display: 'flex', gap: 16, width: '100%' }}>
              {/* Truth */}
              <button onClick={() => handleChoice('truth')} style={{
                flex: 1,
                background: C.card,
                border: `2px solid ${C.truth}40`,
                borderRadius: RADIUS.lg,
                padding: '36px 16px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                boxShadow: C.glass,
                transition: `all ${MOTION.fast}`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.truth;
                  e.currentTarget.style.boxShadow = `0 0 30px ${C.truth}25, ${C.glass}`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.truth + '40';
                  e.currentTarget.style.boxShadow = C.glass;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: C.truth + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.truth,
                }}>
                  <Sparkles size={28} />
                </div>
                <span style={{ fontSize: 22, fontWeight: 600, color: C.truth }}>Truth</span>
                <span style={{ fontSize: 12, color: C.muted }}>Ukweli</span>
              </button>

              {/* Dare */}
              <button onClick={() => handleChoice('dare')} style={{
                flex: 1,
                background: C.card,
                border: `2px solid ${C.dare}40`,
                borderRadius: RADIUS.lg,
                padding: '36px 16px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                boxShadow: C.glass,
                transition: `all ${MOTION.fast}`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.dare;
                  e.currentTarget.style.boxShadow = `0 0 30px ${C.dare}25, ${C.glass}`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.dare + '40';
                  e.currentTarget.style.boxShadow = C.glass;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: C.dare + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.dare,
                }}>
                  <Flame size={28} />
                </div>
                <span style={{ fontSize: 22, fontWeight: 600, color: C.dare }}>Dare</span>
                <span style={{ fontSize: 12, color: C.muted }}>Changamoto</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  REVEAL                                                        */}
        {/* ============================================================ */}
        {phase === 'reveal' && (
          <div style={{
            paddingTop: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 24 }}>
              {currentPlayer.avatar} {currentPlayer.name}
            </span>

            {/* Card flip container */}
            <div style={{
              perspective: '1000px',
              width: '100%',
              marginBottom: 24,
            }}>
              <div style={{
                width: '100%',
                minHeight: 220,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: `transform 600ms cubic-bezier(.34,1.56,.64,1)`,
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
              }}>
                {/* Card back */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  minHeight: 220,
                  backfaceVisibility: 'hidden',
                  background: choice === 'truth' ? C.truth + '12' : C.dare + '12',
                  border: `2px solid ${choice === 'truth' ? C.truth : C.dare}40`,
                  borderRadius: RADIUS.xl,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: C.glass,
                  padding: 24,
                }}>
                  <span style={{ fontSize: 48, marginBottom: 8 }}>?</span>
                  <span style={{ fontSize: 14, color: C.muted }}>Inafunuliwa...</span>
                </div>

                {/* Card front (prompt) */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  minHeight: 220,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: C.card,
                  border: `2px solid ${choice === 'truth' ? C.truth : C.dare}50`,
                  borderRadius: RADIUS.xl,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 40px ${(choice === 'truth' ? C.truth : C.dare)}20, ${C.glass}`,
                  padding: 28,
                  boxSizing: 'border-box',
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 14px', borderRadius: RADIUS.full,
                    background: (choice === 'truth' ? C.truth : C.dare) + '18',
                    color: choice === 'truth' ? C.truth : C.dare,
                    fontSize: 11, fontWeight: 600,
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {choice === 'truth' ? <Sparkles size={12} /> : <Flame size={12} />}
                    {choice === 'truth' ? 'Truth' : 'Dare'}
                  </div>
                  <p style={{
                    margin: 0, fontSize: 18, fontWeight: 600,
                    lineHeight: 1.5, textAlign: 'center',
                    color: C.text,
                  }}>
                    {prompt}
                  </p>
                </div>
              </div>
            </div>

            {/* Vote to skip section */}
            {flipped && (
              <div style={{
                width: '100%', marginBottom: 16,
                animation: 'fadeSlideIn 300ms ease 100ms both',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 8, textAlign: 'center',
                }}>
                  Piga kura kuruka — Vote to skip ({skipVotes.size}/{Math.floor(players.length / 2) + 1} needed)
                </div>
                <div style={{
                  display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
                }}>
                  {players.map((p, i) => {
                    const voted = skipVotes.has(i);
                    return (
                      <button key={i} onClick={() => toggleVote(i)} style={{
                        background: voted ? C.dare + '25' : C.card,
                        border: `1px solid ${voted ? C.dare + '60' : C.border}`,
                        borderRadius: RADIUS.full,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        color: voted ? C.dare : C.muted,
                        fontSize: 11, fontWeight: 600,
                        transition: `all ${MOTION.snap}`,
                      }}>
                        <span style={{ fontSize: 14 }}>{p.avatar}</span>
                        {voted && <ThumbsUp size={10} />}
                      </button>
                    );
                  })}
                </div>
                {majorityReached && (
                  <div style={{
                    textAlign: 'center', marginTop: 8,
                    fontSize: 12, color: C.dare, fontWeight: 600,
                    animation: 'fadeSlideIn 200ms ease',
                  }}>
                    Majority voted to skip!
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            {flipped && !majorityReached && (
              <div style={{
                display: 'flex', gap: 12, width: '100%',
                animation: 'fadeSlideIn 300ms ease 200ms both',
              }}>
                <button onClick={() => handleResult(false)} style={{
                  flex: 1,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.full,
                  padding: '12px 20px',
                  color: C.muted,
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: `all ${MOTION.fast}`,
                  boxShadow: C.glass,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.dim; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >
                  <SkipForward size={16} /> Ruka — Skip
                </button>
                <button onClick={() => handleResult(true)} style={{
                  ...solidBtn(choice === 'truth' ? C.truth : C.dare),
                  flex: 1,
                  justifyContent: 'center',
                  padding: '12px 20px',
                  fontSize: 14,
                }}>
                  <Check size={16} /> Imefanyika — Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  SUMMARY                                                       */}
        {/* ============================================================ */}
        {phase === 'summary' && (() => {
          const sorted = [...players].sort((a, b) => b.completed - a.completed);
          const brave = sorted[0];
          const shy = [...players].sort((a, b) => b.skipped - a.skipped)[0];
          const truthLover = [...players].sort((a, b) => b.truthCount - a.truthCount)[0];
          const dareTaker = [...players].sort((a, b) => b.dareCount - a.dareCount)[0];
          const totalCompleted = players.reduce((s, p) => s + p.completed, 0);
          const totalSkipped = players.reduce((s, p) => s + p.skipped, 0);
          const totalAll = totalCompleted + totalSkipped;

          return (
            <div style={{ paddingTop: 32, animation: 'fadeSlideIn 400ms ease' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Trophy size={40} style={{ color: '#f59e0b', marginBottom: 8 }} />
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Mchezo Umekwisha!</h2>
                <span style={{ fontSize: 13, color: C.muted }}>Game Over</span>
              </div>

              {/* Game stats bar */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 24,
                marginBottom: 24, padding: '12px 0',
                borderTop: `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.rafiki }}>{totalCompleted}</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.dare }}>{totalSkipped}</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skipped</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.truth }}>{totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0}%</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courage</div>
                </div>
              </div>

              {/* Awards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.rafiki}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{brave.avatar}</span>
                  <div style={{ fontSize: 10, color: C.rafiki, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Jasiri Zaidi
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Most Brave</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{brave.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{brave.completed} completed</div>
                </div>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.custom}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{shy.avatar}</span>
                  <div style={{ fontSize: 10, color: C.custom, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mwenye Haya
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Most Shy</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{shy.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{shy.skipped} skipped</div>
                </div>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.truth}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{truthLover.avatar}</span>
                  <div style={{ fontSize: 10, color: C.truth, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Truth Lover
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Mpenda Ukweli</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{truthLover.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{truthLover.truthCount} truths</div>
                </div>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.dare}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{dareTaker.avatar}</span>
                  <div style={{ fontSize: 10, color: C.dare, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mshujaa
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Dare Devil</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{dareTaker.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{dareTaker.dareCount} dares</div>
                </div>
              </div>

              {/* Scoreboard */}
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block' }}>
                Matokeo — Scoreboard
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {sorted.map((p, i) => {
                  const total = p.completed + p.skipped;
                  const pct = total > 0 ? Math.round((p.completed / total) * 100) : 0;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: C.card, borderRadius: RADIUS.md,
                      border: `1px solid ${C.border}`,
                      padding: '10px 14px',
                      boxShadow: C.glass,
                    }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: i === 0 ? '#f59e0b' : C.dim,
                        width: 20, textAlign: 'center',
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 22 }}>{p.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {p.completed} done / {p.skipped} skipped / {p.truthCount}T / {p.dareCount}D
                        </div>
                        {/* Mini bar */}
                        <div style={{
                          marginTop: 4, height: 3, borderRadius: 2,
                          background: C.border, overflow: 'hidden', width: '100%',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            width: `${pct}%`,
                            background: pct >= 80 ? C.rafiki : pct >= 50 ? C.truth : C.dare,
                            transition: `width ${MOTION.med}`,
                          }} />
                        </div>
                      </div>
                      <div style={{
                        background: modeColor + '18',
                        color: modeColor,
                        borderRadius: RADIUS.full,
                        padding: '4px 10px',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* History per player */}
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block' }}>
                Historia — History
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {players.map((p, pi) => (
                  <div key={pi} style={{
                    background: C.card, borderRadius: RADIUS.lg,
                    border: `1px solid ${C.border}`,
                    padding: 14,
                    boxShadow: C.glass,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{p.avatar}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto' }}>
                        {p.completed}/{p.completed + p.skipped} done
                      </span>
                    </div>
                    {p.history.map((h, hi) => (
                      <div key={hi} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '6px 0',
                        borderTop: hi > 0 ? `1px solid ${C.border}` : 'none',
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: RADIUS.full,
                          background: (h.type === 'truth' ? C.truth : C.dare) + '18',
                          color: h.type === 'truth' ? C.truth : C.dare,
                          flexShrink: 0,
                          marginTop: 2,
                          textTransform: 'uppercase',
                        }}>
                          {h.type === 'truth' ? 'T' : 'D'}
                        </span>
                        <span style={{
                          fontSize: 12, color: h.done ? C.text : C.dim,
                          textDecoration: h.done ? 'none' : 'line-through',
                          lineHeight: 1.4, flex: 1,
                        }}>
                          {h.prompt}
                        </span>
                        {h.done ? (
                          <Check size={14} style={{ color: C.rafiki, flexShrink: 0 }} />
                        ) : (
                          <X size={14} style={{ color: C.dim, flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Play again */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onBack} style={{
                  flex: 1, background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.full, padding: '14px 20px',
                  color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: C.glass,
                  transition: `all ${MOTION.fast}`,
                }}>
                  <ArrowLeft size={16} /> Home
                </button>
                <button onClick={resetGame} style={{
                  ...solidBtn(modeColor),
                  flex: 1, justifyContent: 'center',
                  padding: '14px 20px', fontSize: 14,
                }}>
                  <RotateCcw size={16} /> Play Again
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
