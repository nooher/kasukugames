import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { RADIUS, MOTION } from '../lib/design'
import { sfxTap, sfxReveal, sfxCorrect, sfxLevelUp } from '../lib/sfx'
import { LiveRoom, LIVE_GAMES, type LivePlayer, type LiveMsg } from '../lib/liveRoom'
import { rememberRoom, forgetRoom } from '../lib/liveRooms'

/* dark party palette (no gradients) */
const C = {
  bg: '#080c12', card: '#151d2b', card2: '#1b2536', border: '#243247',
  text: '#e8edf5', muted: '#8ea0b5', dim: '#4a5c72',
  green: '#22c55e', red: '#ef4444', amber: '#f59e0b', teal: '#14b8a6',
  blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899', orange: '#f97316',
}
const SEAT_COLORS = [C.pink, C.blue, C.green, C.purple, C.orange, C.teal, C.amber, C.red]

type Screen = 'lobby' | 'menu' | 'spin' | 'tod' | 'nhie' | 'choice' | 'trivia' | 'mlt' | 'rps' | 'hot' | 'gma' | 'ttl' | 'wc' | 'er' | 'story' | 'results'
interface GState {
  screen: Screen
  turnIdx?: number
  // shared competitive scoreboard (playerId -> points)
  scores?: Record<string, number>
  // spin
  spinNonce?: number
  spinAngle?: number
  spinning?: boolean
  landedId?: string
  // truth or dare
  askerId?: string
  targetId?: string
  kind?: 'truth' | 'dare' | null
  prompt?: string | null
  // never have i ever
  nhieCat?: string
  nhiePrompt?: string
  nhieVotes?: Record<string, 'have' | 'never'>
  nhieRevealed?: boolean
  // would-you-rather / this-or-that (shared A/B vote)
  choiceKind?: 'wyr' | 'tot'
  choiceCat?: string
  choicePrompt?: { a: string; b: string }
  choiceVotes?: Record<string, 'a' | 'b'>
  choiceRevealed?: boolean
  // trivia duel
  triviaCat?: string
  triviaRound?: number
  triviaQ?: { q: string; options: string[]; answer: number; cat: string }
  triviaVotes?: Record<string, number>
  triviaRevealed?: boolean
  // most likely to
  mltPrompt?: string
  mltVotes?: Record<string, string>
  mltRevealed?: boolean
  // rock paper scissors
  rpsPicks?: Record<string, 'r' | 'p' | 's'>
  rpsRevealed?: boolean
  rpsWins?: Record<string, number>
  rpsRound?: number
  // hot takes (agree/disagree)
  hotPrompt?: string
  hotVotes?: Record<string, 'agree' | 'disagree'>
  hotRevealed?: boolean
  // guess my answer (couples)
  gmaSubject?: string
  gmaQ?: { q: string; options: string[] }
  gmaPick?: number
  gmaGuesses?: Record<string, number>
  gmaPhase?: 'answer' | 'guess'
  gmaRevealed?: boolean
  // two truths & a lie
  ttlAsker?: string
  ttlStatements?: string[]
  ttlLie?: number
  ttlGuesses?: Record<string, number>
  ttlPhase?: 'write' | 'guess'
  ttlRevealed?: boolean
  // word chain
  wcTurnId?: string
  wcWords?: string[]
  // story builder
  storyTurnId?: string
  storyLines?: string[]
  storyDone?: boolean
  // emoji riddle
  erRiddle?: { emoji: string; answer: string }
  erSolved?: Record<string, boolean>
  erRevealed?: boolean
}

const TOD_CATS = ['Mild', 'Deep', 'Couple', 'Spicy'] as const
const TRUTHS_BY_CAT: Record<string, string[]> = {
  Mild: [
    'What is your most-used emoji?', 'What small thing instantly makes your day?',
    'What is your go-to comfort food?', 'What song have you had on repeat lately?',
    'What is a talent you wish you had?', 'What is your dream travel destination?',
    'What is the last thing that made you laugh out loud?', 'What is your useless superpower?',
    'What is the weirdest thing you believed as a child?', 'What is your most-repeated catchphrase?',
    'What is the pettiest reason you have ended a conversation?', 'What is your go-to karaoke song?',
    'What is a food combination you love that others find strange?', 'What is the last thing you searched online?',
    'What is your most irrational fear?', 'What would the title of your autobiography be?',
    'What is the silliest thing you have cried about?', 'What is your dream job as a kid?',
    'What is the worst haircut you have ever had?', 'What app do you waste the most time on?',
    'What is your hidden but harmless talent?', 'What is the best gift you have ever received?',
    'What is a trend you refused to follow?', 'What is your favourite way to spend a rainy day?',
    'What is the strangest compliment you have ever received?', 'What is your ideal midnight snack?',
    'What is the most useless fact you know?', 'What is your favourite smell?',
    'What fictional place would you most want to visit?', 'What is the worst film you have secretly enjoyed?',
    'What is your most-used excuse?', 'What is the strangest dream you actually remember?',
    'What is your favourite board game?', 'What household chore do you secretly enjoy?',
    'What is your go-to order at a restaurant?', 'What is the first website you check each day?',
    'What is a skill you learned entirely from the internet?', 'What is your favourite childhood cartoon?',
    'What is the weirdest food you have ever tried?', 'What sound instantly annoys you?',
    'What is your favourite way to procrastinate?', 'What is the last thing you took a photo of?',
    'What is your favourite holiday of the year?', 'What is the most embarrassing song on your playlist?',
    'What is a word you always struggle to spell?', 'What is your favourite kind of weather?',
    'What is the best meal you have ever cooked?', 'What movie can you quote from start to finish?',
    'What is the strangest thing in your bag right now?', 'What is your favourite way to unwind after a long day?',
    'What is the silliest nickname you have ever had?', 'What hobby would you try if money were no object?',
    'What is your favourite thing to do on a lazy weekend?', 'What is the last show you binge-watched?',
    'What is your most treasured childhood toy?', 'What is a habit you are genuinely proud of?',
    'What is the funniest thing that happened to you this week?', 'What is your favourite thing about where you grew up?',
    'What is the best piece of advice you completely ignored?', 'What is your go-to dance move?',
    'What is your favourite snack while watching a film?', 'What is a place you could get lost in for hours?',
    'What is the most useless gadget you own?', 'What is your favourite way to start the morning?',
    'What is a small thing that always cheers you up?', 'What is your favourite animal and why?',
    'What is the best surprise you have ever planned for someone?', 'What is a talent your family is known for?',
    'What is your favourite thing to collect?', 'What is the most spontaneous thing you have done recently?',
    'What is your dream car?', 'What do you cook when you cannot be bothered to cook?',
    'What is the funniest text you have ever received?', 'What is your favourite childhood game?',
    'What is the strangest habit you have when no one is watching?', 'What is your favourite way to spend a public holiday?',
    'What is the one chore you will do anything to avoid?', 'What is your all-time favourite ice-cream flavour?',
  ],
  Deep: [
    'What are you most proud of this year?', 'What is a fear you rarely admit?',
    'What does your ideal life look like in five years?', 'What would you tell your younger self?',
    'When did you last feel truly at peace?', 'What are you still learning to forgive yourself for?',
    'What is something you want people to understand about you?',
    'What is a moment that quietly changed the course of your life?', 'What does success actually mean to you?',
    'What is a belief you held strongly that later changed?', 'When do you feel most like yourself?',
    'What is something you are grateful for but rarely say out loud?', 'What is a wound you are still healing from?',
    'What kind of person do you hope to become?', 'What is the hardest lesson you have had to learn?',
    'What does home feel like to you?', 'What is a risk you wish you had taken?',
    'Who has shaped you the most, and how?', 'What is a promise you made to yourself?',
    'What do you need more of in your life right now?', 'What are you afraid people will discover about you?',
    'What is something you are still figuring out about yourself?', 'What does friendship truly mean to you?',
    'What is a fear that has quietly shaped your choices?', 'What would you do if you knew you could not fail?',
    'What is a value you refuse to compromise on?', 'What is something you wish you had said to someone?',
    'What is the bravest thing you have ever done?', 'What does love look like to you now?',
    'What is a part of your past you have finally made peace with?', 'What is something you want to be remembered for?',
    'What is a question you are still searching for the answer to?', 'What does forgiveness mean to you?',
    'What is a mistake that taught you the most?', 'What is something you are quietly working towards?',
    'What does it mean to you to live a good life?', 'What is a truth about yourself you took years to accept?',
    'When did you last genuinely surprise yourself?', 'What is something you let go of that set you free?',
    'What is a fear you have already outgrown?', 'What does trust require from you?',
    'What is a moment you felt genuinely proud of who you are?', 'What is something you are learning to say no to?',
    'What do you wish more people asked you?', 'If your life were a book, what would this chapter be called?',
    'What is a comfort you turn to when things get hard?', 'What have you forgiven that once felt unforgivable?',
    'What does courage look like in your everyday life?', 'What is a dream you have quietly outgrown?',
    'What is a lesson your struggles have given you?', 'What is something you want to make more time for?',
    'What version of yourself are you proud to have left behind?', 'What does peace of mind require from you?',
    'What is a hope you are almost afraid to say aloud?', 'What small thing has changed how you see the world?',
    'What do you need to hear more often?', 'What is a boundary you finally learned to hold?',
    'What does belonging feel like to you?', 'What is a fear you are choosing to face this year?',
    'What is something you are grateful your younger self endured?', 'What is a quiet strength you did not know you had?',
  ],
  Couple: [
    'What first made you fall for me?', 'What is your favourite memory of us?',
    'What small thing I do do you secretly love?', 'If we could relive one day together, which?',
    'What is the most attractive thing about me right now?', 'What is one dream you have for us?',
    'When did you last think about me and smile?', 'What is something new you want us to try together?',
    'What is a little habit of mine you find adorable?', 'Where do you picture us in ten years?',
    'What is the moment you knew you trusted me?', 'What song reminds you of us?',
    'What is the kindest thing I have ever done for you?', 'What tradition do you want us to start?',
    'What is your favourite thing about our mornings together?', 'When do you feel closest to me?',
    'What is a small adventure you want us to take soon?', 'What do you admire most about how I handle hard days?',
    'What is a memory of us you replay the most?', 'What makes you feel most loved by me?',
    'What is something you have always wanted to tell me but never have?', 'What does our future home look like to you?',
    'What was going through your mind on our very first date?', 'What is a little ritual of ours you never want to lose?',
    'What is your favourite photo of us, and why?', 'What is something I do that always makes you feel safe?',
    'What is a place you would love to grow old with me in?', 'What is the exact moment you realised you were falling for me?',
    'What is your favourite way I show you I care?', 'What is a small win of ours you are quietly proud of?',
    'What is a dream you want us to chase together?', 'What is your favourite thing we do on a quiet night in?',
    'What is something about our story you love telling people?', 'What is a habit of ours that always makes you laugh?',
    'What is your favourite version of me?', 'What is a memory of us that always warms your heart?',
    'What is something you hope never changes about us?', 'What is your favourite thing about how we make up after a row?',
    'What is a place from our past you would love to revisit?', 'What is the sweetest thing I have ever said to you?',
    'What is a future milestone you cannot wait to reach with me?', 'What is your favourite thing about waking up next to me?',
    'What is a way I have helped you grow?', 'What is your favourite little inside joke of ours?',
    'What is something you admire about the way I love you?', 'What is a trip you dream of taking with me?',
    'What is your favourite thing we have built together?', 'What is a moment you felt truly understood by me?',
    'What is your favourite way we say sorry to each other?', 'What is something you want us to do more of?',
    'What is your favourite meal we have ever shared?', 'What lyric reminds you of how you feel about me?',
    'What is your favourite thing about our lazy weekends?', 'What is a promise you would make to us right now?',
    'What is your favourite thing I wear?', 'What is a moment with me you wish you could freeze in time?',
    'What is your favourite thing about coming home to me?', 'What is something I taught you without meaning to?',
    'What is your favourite thing we celebrate together?', 'What is a way you feel we balance each other?',
    'What is your favourite thing about the very first week we met?', 'What is your favourite thing about the way we say goodnight?',
    'What are you most looking forward to sharing with me?', 'What is a tiny moment with me that meant more than I ever said?',
  ],
  Spicy: [
    'What is your biggest turn-on?', 'What is a fantasy you have not told me?',
    'Where is the most adventurous place you would want to kiss me?', 'Which outfit of mine do you love most?',
    'What is the most romantic thing you have imagined us doing?', 'What is something bold you wish you would ask for?',
    'What is the first thing you noticed about me?', 'What is your favourite way to be kissed?',
    'What do I wear that you find irresistible?', 'What is a secret dream date you have imagined for us?',
    'What is the most attractive thing I do without realising it?', 'Where would your dream getaway with me be?',
    'What is something flirty you wish you did more often?', 'What is your favourite kind of slow, close moment with me?',
    'What compliment from me makes you melt every time?', 'What is a bold move you would love me to make?',
    'What is the most romantic setting you can picture us in?', 'What look of mine drives you a little wild?',
    'What is the most attractive quality a person can have?', 'What flirty text do you wish you had the nerve to send?',
    'What is the fastest way to make you blush?', 'What is your idea of a perfect first kiss?',
    'What small thing do I do that you find surprisingly attractive?', 'What romantic gesture have you secretly daydreamed about?',
    'What is a compliment you have been dying to give me?', 'What is your idea of the perfect date night?',
    'What is the most charming thing someone has ever done for you?', 'What outfit would you love to see me in?',
    'What song would you want playing during a slow dance with me?', 'What is the most butterflies you have ever felt?',
    'What bold thing would you whisper if no one else were around?', 'What is your favourite kind of flirting?',
    'What is a look that instantly catches your eye?', 'What is the most romantic place you can imagine being with me?',
    'What do you find irresistibly attractive about confidence?', 'What is a move you wish you were brave enough to make?',
    'What is your favourite way to be told you are wanted?', 'What is the most flattering thing anyone has said about you?',
    'What is a little thing that makes your heart race?', 'What romantic surprise would you love to receive?',
    'What is your idea of an unforgettable goodnight?', 'What compliment would leave you completely speechless?',
    'What is the most attractive thing about a great smile?', 'What dreamy getaway would you want just for two?',
    'What is your favourite way to hold someone’s attention across a room?', 'What flirtatious thing are you secretly very good at?',
    'What is the boldest compliment you would ever give me?', 'What is your idea of a perfectly romantic evening?',
    'What is the first thing that draws you to someone?', 'What slow, close moment would you love to share?',
    'What is a flirty habit you simply cannot help?', 'What is the boldest date idea you have ever imagined?',
  ],
}
const DARES_BY_CAT: Record<string, string[]> = {
  Mild: [
    'Do your best impression of the person on your right.', 'Talk in an accent for the next two rounds.',
    'Show the last photo in your camera roll.', 'Do ten jumping jacks right now.',
    'Sing one line of your favourite song.', 'Give a ten-second motivational speech.',
    'Do your happy dance for five seconds.',
    'Speak only in questions until your next turn.', 'Do your best robot dance for ten seconds.',
    'Text the third person in your contacts a single wave emoji.', 'Balance a spoon on your nose for five seconds.',
    'Do your best impression of a news reporter.', 'Say the alphabet backwards as fast as you can.',
    'Do your best slow-motion action-movie move.', 'Compliment your own reflection for ten seconds.',
    'Talk like a pirate until your next turn.', 'Hum a song and let others guess it.',
    'Do your best catwalk across the room.', 'Make up a jingle for your favourite snack.',
    'Do your best evil-villain laugh.', 'Pretend to narrate a nature documentary about the person opposite you.',
    'Do your best impression of a famous singer.', 'Speak in slow motion until your next turn.',
    'Do your best celebrity red-carpet wave.', 'Do a quick advert for the nearest object to you.',
    'Do your best superhero landing pose.', 'Talk only in rhymes until your next turn.',
    'Do your best impression of a baby learning to walk.', 'Give a dramatic weather forecast for the room.',
    'Do your best impression of your favourite animal.', 'Do five squats while singing the alphabet.',
    'Do your best runway model turn and pose.', 'Pretend you are stuck in an invisible box for ten seconds.',
    'Do your best impression of a robot running out of battery.', 'Give a tour-guide speech about the room you are in.',
    'Do your best air-guitar solo for ten seconds.', 'Say a tongue twister three times fast.',
    'Do your best impression of a cat spotting a laser.', 'Say the next thing you say in a movie-trailer voice.',
    'Do your best impression of someone waking up very late.', 'Do a ten-second stand-up comedy bit.',
    'Do your best impression of a sports commentator.', 'Balance on one foot until your next turn.',
    'Do your best impression of a melting ice-cream.', 'Give a passionate speech about your favourite snack.',
    'Do your best moonwalk.', 'Do your best impression of a phone on vibrate.',
    'Do your best dramatic slow clap.', 'Pretend to be a statue for fifteen seconds.',
    'Do your best impression of a toddler throwing a tantrum.', 'Do your best fashion-critic review of what you are wearing.',
    'Do your best impression of a wind-up toy.', 'Give a thank-you speech as if you just won an award.',
    'Do your best impression of a chicken.', 'Do your best invisible jump-rope for ten seconds.',
    'Speak only in whispers until your next turn.', 'Do your best impression of a nervous game-show contestant.',
    'Do your best dramatic faint.', 'Do your best impression of a DJ hyping up a crowd.',
    'Give a two-line poem about the person on your left.', 'Do your best impression of a grumpy old wizard.',
  ],
  Deep: [
    'Say one genuine thing you appreciate about each person here.', 'Share a goal you have never said out loud.',
    'Give a heartfelt compliment to the person on your left.', 'Describe your happiest memory in detail.',
    'Share one thing you are proud of but rarely mention.', 'Tell the group about someone who quietly changed your life.',
    'Name one fear you are working to overcome.', 'Share a piece of advice that stuck with you forever.',
    'Describe a moment you felt truly understood.', 'Say one thing you forgive yourself for today.',
    'Tell the group what you hope people remember about you.', 'Share a small act of kindness that once made your day.',
    'Share a lesson that took you years to learn.', 'Tell the group about a person you look up to and why.',
    'Name one thing you are grateful for right now.', 'Describe a moment you felt truly proud of yourself.',
    'Share a dream you are still chasing.', 'Tell the group about a book, song or film that changed you.',
    'Say one thing you would tell your younger self.', 'Share a challenge that made you stronger.',
    'Give the person on your right a piece of sincere encouragement.', 'Describe what a perfect day would look like for you.',
    'Share something you are genuinely hopeful about.', 'Tell the group one value you try to live by.',
    'Name a habit you are proud of building.', 'Share a memory that always makes you smile.',
    'Say one thing you admire about the person opposite you.', 'Describe a place where you feel completely at peace.',
    'Share a fear you have already overcome.', 'Tell the group about a small win you are proud of this week.',
    'Say one thing you are learning to accept about yourself.', 'Describe the kind of friend you try to be.',
    'Share a piece of advice you would give to anyone starting out.', 'Tell the group about a moment that restored your faith in people.',
    'Name something you appreciate about your own journey.', 'Share a goal you want to reach in the next year.',
    'Describe a person who makes you feel understood.', 'Tell the group what gives your life meaning.',
  ],
  Couple: [
    'Send a voice note saying what you love most about me.', 'Blow a kiss and hold eye contact for ten seconds.',
    'Text me three emojis that describe how you feel about me.', 'Give the screen your most charming smile.',
    'Describe our next date in one romantic sentence.', 'Say “I love you” in the most dramatic way you can.',
    'List three little things you adore about me.', 'Serenade me with one line of any love song.',
    'Recreate the moment we first met in words.', 'Give me a nickname on the spot and explain why.',
    'Describe our perfect lazy Sunday in one sentence.', 'Look at the camera and finish: “You are my favourite because…”',
    'Send me a message that will make me smile all day.', 'Plan our dream weekend in three quick words.',
    'Tell me the first thought you had about me today.', 'Describe my smile as if you were a poet.',
    'Tell me the exact moment you knew you liked me.', 'Describe our first date in one sweet sentence.',
    'Give me a compliment you have never said out loud.', 'Recreate our song by humming a few bars.',
    'Describe our future home in three words.', 'Send me a good-morning message right now.',
    'Tell me one thing you love about my laugh.', 'Describe our perfect holiday in one sentence.',
    'List three things that remind you of me.', 'Give me your best surprised-and-delighted face.',
    'Finish this sentence: “My favourite thing about us is…”', 'Describe the way I make you feel in one word.',
    'Tell me a memory of us you replay often.', 'Blow me a kiss and name your favourite date we have had.',
    'Describe our love story like a movie tagline.', 'Tell me the nickname you secretly call me in your head.',
    'Give me a heartfelt ten-second toast to us.', 'Describe your favourite thing about my personality.',
    'Text me a song that always reminds you of us.', 'Tell me what you were thinking the first time we met.',
    'Describe the perfect quiet evening with me.', 'Give me your warmest smile and say my name.',
    'Finish this: “If I could relive one day with you it would be…”', 'Tell me one dream you want us to make real.',
    'Describe me using only three adjectives.', 'Send me a message I can keep for a rainy day.',
    'Tell me your favourite thing about our mornings.', 'Give me a compliment about something I always doubt.',
    'Tell me the little habit of mine you love most.', 'Say the sweetest thing you have been meaning to tell me.',
  ],
  Spicy: [
    'Whisper something flirty to the camera.', 'Do your most confident walk.',
    'Give your best flirty wink and say my name.', 'Describe your ideal romantic evening in detail.',
    'Send me a flirty text right now.',
    'Give the camera your slowest, most charming smile.', 'Say my name the way you would to make me blush.',
    'Describe the perfect slow dance with me.', 'Whisper the compliment you have been holding back.',
    'Strike your most confident pose and hold it.', 'Tell me one bold thing you have been thinking.',
    'Describe a dreamy candlelit moment for two.', 'Give me your most flirtatious wink and a grin.',
    'Say what you would whisper if I were right beside you.', 'Describe your idea of a perfect goodnight.',
    'Give the camera your most charming look.', 'Describe your dream date with me in one bold sentence.',
    'Say a flirty pick-up line to the camera.', 'Blow a slow kiss and hold my gaze.',
    'Describe the most romantic setting you can imagine for two.', 'Whisper the boldest compliment you can think of.',
    'Give me your best “come here” smile.', 'Describe a perfect candlelit dinner for us.',
    'Say my name three ways, each more charming than the last.', 'Describe the perfect stolen kiss.',
    'Give your most confident catwalk to the camera and back.', 'Whisper what you would say to sweep someone off their feet.',
    'Describe a dreamy weekend away, just the two of us.', 'Give me your most flirtatious eyebrow raise.',
    'Describe the most romantic thing you would ever do for me.', 'Say a bold compliment you have been holding in.',
    'Describe your idea of a perfect slow-dance song.', 'Give the camera a lingering, playful smile.',
    'Describe how you would plan the most romantic surprise.', 'Whisper the flirtiest thing you are brave enough to say.',
    'Describe the perfect moonlit walk for two.', 'Give me your most confident, knowing grin.',
    'Describe the most romantic gift you could imagine giving.', 'Say something in one sentence that would make me blush.',
    'Describe your idea of an unforgettable first dance.', 'Give the camera a slow, flirty wave.',
    'Describe the dreamiest date you can picture.', 'Whisper a compliment as if I were right beside you.',
    'Describe your idea of the perfect romantic evening in.', 'Give me your boldest, most charming line yet.',
  ],
}
const NHIE_CATS = ['Party', 'Spicy', 'Deep'] as const
const NHIE_BY_CAT: Record<string, string[]> = {
  Party: [
    'Never have I ever sent a text to the wrong person.',
    'Never have I ever laughed at completely the wrong moment.',
    'Never have I ever pretended to be busy to avoid plans.',
    'Never have I ever eaten the last snack and blamed someone else.',
    'Never have I ever stayed up all night watching one more episode.',
    'Never have I ever practised a conversation in the mirror.',
    'Never have I ever googled myself.',
    'Never have I ever kept a gift I secretly disliked.',
    'Never have I ever tripped in public and pretended it was on purpose.',
    'Never have I ever forgotten someone’s name right after meeting them.',
    'Never have I ever waved back at someone who was not waving at me.',
    'Never have I ever pretended to know a song I had never heard.',
    'Never have I ever sent a screenshot to the person it was about.',
    'Never have I ever fallen asleep during a movie at the cinema.',
    'Never have I ever left a shop because I felt awkward not buying anything.',
    'Never have I ever laughed so hard that I snorted.',
    'Never have I ever pretended my phone died to end a call.',
    'Never have I ever eaten something that fell on the floor.',
    'Never have I ever said “you too” when it made no sense.',
    'Never have I ever hidden from someone I did not want to talk to.',
    'Never have I ever burnt food while distracted by my phone.',
    'Never have I ever pushed a door that clearly said pull.',
    'Never have I ever forgotten why I walked into a room.',
    'Never have I ever pretended to enjoy a gift I would never use.',
    'Never have I ever sung the wrong lyrics with total confidence.',
    'Never have I ever missed a step and pretended I meant to.',
    'Never have I ever replied to a text in my head and never actually sent it.',
    'Never have I ever taken a nap that turned into a whole night.',
    'Never have I ever lost my phone while talking on it.',
    'Never have I ever clapped when the plane landed.',
    'Never have I ever forgotten a password minutes after setting it.',
    'Never have I ever pretended to understand a joke I did not get.',
    'Never have I ever walked straight into a glass door.',
    'Never have I ever lied about my age to get a discount.',
    'Never have I ever ignored an alarm and blamed my phone.',
    'Never have I ever eaten dessert before the main meal.',
    'Never have I ever pretended to be on the phone to avoid someone.',
    'Never have I ever forgotten to unmute and talked to no one.',
    'Never have I ever laughed at completely the wrong serious moment.',
    'Never have I ever texted someone while they were in the same room.',
    'Never have I ever finished a whole packet of biscuits alone.',
    'Never have I ever pretended to like a haircut I secretly hated.',
    'Never have I ever gotten lost in my own neighbourhood.',
    'Never have I ever searched for my glasses while wearing them.',
    'Never have I ever replied to an email a month too late.',
    'Never have I ever pretended my internet cut out to leave a meeting.',
    'Never have I ever forgotten a birthday and pretended I remembered.',
    'Never have I ever tried to look busy when the boss walked by.',
    'Never have I ever eaten food straight from the fridge at midnight.',
    'Never have I ever laughed so hard that no sound came out.',
    'Never have I ever waved at a stranger thinking they were a friend.',
    'Never have I ever pretended to read the terms and conditions.',
    'Never have I ever left the house in mismatched shoes.',
    'Never have I ever forgotten what I was about to say mid-sentence.',
    'Never have I ever pretended to know where I was going while lost.',
    'Never have I ever sent a message and instantly wanted to delete it.',
    'Never have I ever dozed off during a work call.',
    'Never have I ever pretended to enjoy a spicy dish I could not handle.',
    'Never have I ever put something in a safe place and never found it again.',
    'Never have I ever tripped over nothing at all.',
    'Never have I ever eaten the free sample and left the shop.',
    'Never have I ever laughed at my own joke before finishing it.',
    'Never have I ever forgotten my own phone number.',
    'Never have I ever pretended a dead plant was still alive.',
    'Never have I ever hidden snacks so I would not have to share.',
    'Never have I ever waved goodbye and then walked the same way.',
    'Never have I ever put salt instead of sugar in a drink.',
    'Never have I ever forgotten to press send on an important message.',
    'Never have I ever pretended to be asleep to avoid a chore.',
    'Never have I ever taken a wrong turn and called it a shortcut.',
    'Never have I ever laughed at a meme in a completely silent room.',
    'Never have I ever left a voicemail I instantly regretted.',
    'Never have I ever mixed up two people’s names to their face.',
    'Never have I ever forgotten which floor I parked on.',
    'Never have I ever pretended to jog when someone drove past.',
    'Never have I ever eaten something just because it was free.',
    'Never have I ever spent ages picking a film and then fallen asleep.',
    'Never have I ever pretended to like a photo of myself I hated.',
    'Never have I ever texted “on my way” before leaving the house.',
    'Never have I ever forgotten to charge my phone before a big day.',
    'Never have I ever pretended to know a celebrity everyone was discussing.',
    'Never have I ever left a party without saying goodbye.',
    'Never have I ever worn my shirt inside out all day.',
    'Never have I ever forgotten why I opened the fridge.',
    'Never have I ever pretended my favourite team was winning.',
    'Never have I ever ordered the same thing because I could not read the menu.',
    'Never have I ever mistaken a mannequin for a real person.',
    'Never have I ever set five alarms and slept through all of them.',
    'Never have I ever pretended to take notes while actually doodling.',
  ],
  Spicy: [
    'Never have I ever stalked a crush on social media.',
    'Never have I ever re-read old messages from someone I liked.',
    'Never have I ever planned a whole future in my head after one date.',
    'Never have I ever saved a photo of someone as my favourite.',
    'Never have I ever texted an ex late at night.',
    'Never have I ever pretended to like something just to impress a crush.',
    'Never have I ever had a crush on someone in this room.',
    'Never have I ever kissed someone on a first date.',
    'Never have I ever rehearsed how to say hi to a crush.',
    'Never have I ever changed my outfit because a crush would be there.',
    'Never have I ever pretended not to see someone I liked.',
    'Never have I ever memorised a crush’s schedule.',
    'Never have I ever double-tapped an old photo by accident.',
    'Never have I ever kept a message unread to seem busy.',
    'Never have I ever daydreamed about a first date that never happened.',
    'Never have I ever asked a friend to spy on my crush for me.',
    'Never have I ever felt butterflies just from a single text.',
    'Never have I ever written a message and deleted it a dozen times.',
    'Never have I ever picked a seat just to be near someone.',
    'Never have I ever blushed and blamed it on the weather.',
    'Never have I ever crushed on someone entirely out of my league.',
    'Never have I ever replayed a compliment in my head all day.',
    'Never have I ever pretended a song was not about someone special.',
    'Never have I ever smiled at my phone in the middle of a meeting.',
    'Never have I ever practised flirting in the mirror.',
    'Never have I ever given someone a fake name to seem mysterious.',
    'Never have I ever pretended to bump into a crush “by accident”.',
    'Never have I ever kept a screenshot of a sweet message.',
    'Never have I ever liked every photo of a crush late at night.',
    'Never have I ever agreed to something just to spend time with someone.',
    'Never have I ever made a playlist for someone I liked.',
    'Never have I ever lingered somewhere hoping to run into someone.',
    'Never have I ever memorised a crush’s coffee order.',
    'Never have I ever practised a text message out loud.',
    'Never have I ever pretended to know a hobby just to impress someone.',
    'Never have I ever asked a friend to check if a crush was single.',
    'Never have I ever kept talking just to hear someone’s voice longer.',
    'Never have I ever chosen a longer route to walk past someone.',
    'Never have I ever blushed at a compliment and looked away.',
    'Never have I ever replayed a flirty moment in my head all day.',
    'Never have I ever pretended not to care while caring a lot.',
    'Never have I ever dressed up specially for a video call.',
    'Never have I ever kept a first-date detail I never told anyone.',
    'Never have I ever left a message on read to seem cool.',
    'Never have I ever laughed a little too hard at a crush’s joke.',
    'Never have I ever felt my heart skip at a single glance.',
    'Never have I ever written a compliment and never sent it.',
    'Never have I ever daydreamed about someone during a boring task.',
    'Never have I ever pretended to be casual about a date I was thrilled about.',
    'Never have I ever saved a flirty text to read again later.',
    'Never have I ever wished a slow song would never end.',
    'Never have I ever caught feelings from one good conversation.',
    'Never have I ever picked a photo carefully before sending it to a crush.',
    'Never have I ever rehearsed asking someone out.',
    'Never have I ever felt jealous over someone I never even dated.',
    'Never have I ever kept a note someone wrote me.',
    'Never have I ever pretended a compliment did not make my whole day.',
    'Never have I ever smiled at a memory in the middle of a conversation.',
    'Never have I ever changed my plans on the hope of seeing someone.',
    'Never have I ever counted the minutes until a reply.',
    'Never have I ever imagined a first dance with someone.',
    'Never have I ever pretended to be busy while waiting by my phone.',
    'Never have I ever given extra thought to a goodbye hug.',
    'Never have I ever felt shy the first time someone held my gaze.',
    'Never have I ever practised a confident hello and forgotten it instantly.',
    'Never have I ever noticed a crush’s perfume from across a room.',
    'Never have I ever replayed a voice note just to hear one line.',
    'Never have I ever pretended a love song did not hit close to home.',
    'Never have I ever kept glancing over hoping to be noticed.',
    'Never have I ever felt butterflies before pressing call.',
    'Never have I ever picked a seat with the best view of someone.',
    'Never have I ever caught myself grinning at a text and hidden it.',
  ],
  Deep: [
    'Never have I ever cried and told no one why.',
    'Never have I ever kept a big dream secret out of fear.',
    'Never have I ever forgiven someone but never forgotten.',
    'Never have I ever pretended to be okay when I really was not.',
    'Never have I ever changed a big plan to make someone else happy.',
    'Never have I ever doubted a choice long after making it.',
    'Never have I ever kept the peace by staying silent.',
    'Never have I ever outgrown a friendship and said nothing.',
    'Never have I ever held onto something I should have let go.',
    'Never have I ever felt lonely in a room full of people.',
    'Never have I ever hidden how much something hurt me.',
    'Never have I ever apologised just to end an argument.',
    'Never have I ever put someone else’s happiness before my own.',
    'Never have I ever been afraid to ask for help.',
    'Never have I ever wondered if I made the right choice years later.',
    'Never have I ever carried a regret I never spoke about.',
    'Never have I ever rebuilt myself after losing something important.',
    'Never have I ever kept smiling through a very hard week.',
    'Never have I ever stayed in a comfort zone out of fear.',
    'Never have I ever said yes when I really meant no.',
    'Never have I ever hidden a struggle to protect someone else.',
    'Never have I ever kept a worry to myself for far too long.',
    'Never have I ever pretended not to be hurt by a comment.',
    'Never have I ever let a fear talk me out of something I wanted.',
    'Never have I ever grown apart from someone I once told everything.',
    'Never have I ever kept a goal to myself in case it did not work out.',
    'Never have I ever forgiven someone who never apologised.',
    'Never have I ever felt like an impostor in my own success.',
    'Never have I ever put off a hard conversation for months.',
    'Never have I ever measured myself against someone else’s life.',
    'Never have I ever kept a promise to myself that no one knew about.',
    'Never have I ever carried guilt long after it was needed.',
    'Never have I ever pretended a goodbye did not affect me.',
    'Never have I ever chosen silence to keep a fragile peace.',
    'Never have I ever downplayed a win because I felt unworthy of it.',
    'Never have I ever second-guessed a decision I could not undo.',
    'Never have I ever hidden how tired I really was.',
    'Never have I ever let someone believe a version of me that was not true.',
    'Never have I ever mourned something no one else knew I had lost.',
    'Never have I ever kept giving after I had nothing left to give.',
    'Never have I ever feared being truly seen.',
    'Never have I ever held a grudge longer than I wanted to.',
    'Never have I ever pretended a big change did not scare me.',
    'Never have I ever kept the peace at the cost of my own voice.',
    'Never have I ever wondered if I was living someone else’s dream.',
    'Never have I ever hidden a soft heart behind a calm face.',
    'Never have I ever waited far too long to say I was sorry.',
    'Never have I ever felt homesick for a place that no longer exists.',
    'Never have I ever kept a fear from the people closest to me.',
    'Never have I ever let pride stop me from reaching out.',
    'Never have I ever quietly outgrown a version of myself.',
    'Never have I ever needed a good cry and told no one afterward.',
    'Never have I ever underestimated how strong I could be.',
    'Never have I ever kept hoping long after it made sense to.',
  ],
}
const WYR_CATS = ['Fun', 'Deep', 'Couple', 'Spicy'] as const
const WYR_BY_CAT: Record<string, { a: string; b: string }[]> = {
  Fun: [
    { a: 'Be able to fly', b: 'Be invisible' },
    { a: 'Never wait in a queue again', b: 'Never hit traffic again' },
    { a: 'Have unlimited data', b: 'Have unlimited fuel' },
    { a: 'Be a famous singer', b: 'Be a famous footballer' },
    { a: 'Always be 10 minutes early', b: 'Always have the perfect comeback' },
    { a: 'Speak every language', b: 'Talk to animals' },
    { a: 'Live by the beach', b: 'Live in the mountains' },
    { a: 'Have a photographic memory', b: 'Read minds for a day' },
    { a: 'Never feel tired again', b: 'Never feel hungry again' },
    { a: 'Teleport anywhere instantly', b: 'Pause time whenever you want' },
    { a: 'Be the funniest person in the room', b: 'Be the smartest person in the room' },
    { a: 'Always know the perfect song for the moment', b: 'Always know the perfect thing to say' },
    { a: 'Have free flights for life', b: 'Have free food for life' },
    { a: 'Own a talking pet', b: 'Own a flying car' },
    { a: 'Be able to breathe underwater', b: 'Be able to survive any climate' },
    { a: 'Win every board game', b: 'Win every dance-off' },
    { a: 'Have unlimited books', b: 'Have unlimited movies' },
    { a: 'Control the weather', b: 'Control your dreams' },
    { a: 'Be a morning legend', b: 'Be a night owl champion' },
    { a: 'Never lose your keys again', b: 'Never lose your phone again' },
    { a: 'Have a personal chef', b: 'Have a personal driver' },
    { a: 'Have super strength', b: 'Have super speed' },
    { a: 'Never get sunburnt', b: 'Never get mosquito bites' },
    { a: 'Always find money in your pocket', b: 'Always find your keys instantly' },
    { a: 'Live in a treehouse', b: 'Live on a houseboat' },
    { a: 'Have a pet dragon', b: 'Have a pet dinosaur' },
    { a: 'Teleport short distances', b: 'Fly slowly anywhere' },
    { a: 'Have unlimited phone storage', b: 'Have unlimited battery' },
    { a: 'Always win rock paper scissors', b: 'Always win a coin toss' },
    { a: 'Be a master chef', b: 'Be a master musician' },
    { a: 'Have a jetpack', b: 'Have a hoverboard' },
    { a: 'Never need sleep', b: 'Never need to eat' },
    { a: 'Have perfect memory for names', b: 'Have a perfect sense of direction' },
    { a: 'Be able to talk to plants', b: 'Be able to talk to machines' },
    { a: 'Live in a bustling city', b: 'Live on a quiet island' },
    { a: 'Have free concert tickets forever', b: 'Have free cinema tickets forever' },
    { a: 'Always know the weather exactly', b: 'Always know the fastest route' },
    { a: 'Be the best dancer in the room', b: 'Be the best singer in the room' },
    { a: 'Have a robot that cleans', b: 'Have a robot that cooks' },
    { a: 'Be able to shrink at will', b: 'Be able to grow at will' },
    { a: 'Have a wardrobe that never repeats', b: 'Have shoes that never wear out' },
    { a: 'Always have exact change', b: 'Always have full phone signal' },
    { a: 'Be able to understand babies', b: 'Be able to understand your pet' },
    { a: 'Have a house that cleans itself', b: 'Have a garden that grows itself' },
    { a: 'Never feel too hot', b: 'Never feel too cold' },
    { a: 'Be a famous author', b: 'Be a famous artist' },
    { a: 'Rewind one hour a day', b: 'Fast-forward through boring moments' },
    { a: 'Own a private cinema', b: 'Own a private arcade' },
    { a: 'Always land on your feet', b: 'Always catch anything thrown to you' },
    { a: 'Be able to breathe underwater', b: 'Be able to walk through walls' },
    { a: 'Have endless ice-cream', b: 'Have endless pizza' },
    { a: 'Be the funniest in your family', b: 'Be the wisest in your family' },
    { a: 'Have a car that never needs fuel', b: 'Have a fridge that never empties' },
    { a: 'Always guess a film’s ending', b: 'Always predict the next song' },
    { a: 'Live one week in the past', b: 'Live one week in the future' },
    { a: 'Change your hair colour instantly', b: 'Change your outfit instantly' },
    { a: 'Have a personal photographer', b: 'Have a personal comedian' },
    { a: 'Always get a great parking spot', b: 'Always get a short queue' },
    { a: 'Be able to pause an awkward moment', b: 'Be able to replay a happy one' },
    { a: 'Have a treehouse office', b: 'Have a beach office' },
    { a: 'Own a talking parrot', b: 'Own a singing canary' },
    { a: 'Always know a fun fact for the moment', b: 'Always know a joke for the moment' },
    { a: 'Be able to nap anywhere instantly', b: 'Wake up fully rested in minutes' },
  ],
  Deep: [
    { a: 'Know how you die', b: 'Know when you die' },
    { a: 'Relive your best day', b: 'Erase your worst day' },
    { a: 'Be respected', b: 'Be loved' },
    { a: 'Have more time', b: 'Have more money' },
    { a: 'Change one decision', b: 'See one moment of your future' },
    { a: 'Be famous', b: 'Be at peace' },
    { a: 'Master any skill instantly', b: 'Have unlimited second chances' },
    { a: 'Understand everyone perfectly', b: 'Be perfectly understood by everyone' },
    { a: 'Live a long ordinary life', b: 'Live a short extraordinary one' },
    { a: 'Always follow your heart', b: 'Always trust your head' },
    { a: 'Heal your past', b: 'Secure your future' },
    { a: 'Be needed', b: 'Be free' },
    { a: 'Find your purpose', b: 'Find lasting contentment' },
    { a: 'Never feel regret', b: 'Never feel fear' },
    { a: 'Leave a legacy', b: 'Live fully in the present' },
    { a: 'Have deep roots', b: 'Have endless wings' },
    { a: 'Speak your whole truth once', b: 'Keep the peace forever' },
    { a: 'Know why things happen', b: 'Simply trust that they do' },
  ],
  Couple: [
    { a: 'Travel the world together', b: 'Build a dream home together' },
    { a: 'A quiet night in', b: 'A wild night out' },
    { a: 'Forehead kisses', b: 'Long hugs' },
    { a: 'Text all day', b: 'One long call at night' },
    { a: 'Cook together', b: 'Order in and chill' },
    { a: 'Surprise gifts', b: 'Handwritten notes' },
    { a: 'Sunrise together', b: 'Sunset together' },
    { a: 'Dance in the kitchen', b: 'Sing in the car' },
    { a: 'Matching outfits', b: 'Matching tattoos' },
    { a: 'A picnic in the park', b: 'A rooftop dinner' },
    { a: 'Slow mornings in bed', b: 'Spontaneous road trips' },
    { a: 'Good-morning texts', b: 'Good-night calls' },
    { a: 'Plan every date', b: 'Keep every date a surprise' },
    { a: 'Share one big adventure a year', b: 'Share little moments every day' },
    { a: 'Read the same book together', b: 'Watch the same series together' },
    { a: 'A shared playlist', b: 'A shared photo album' },
    { a: 'Grow a garden together', b: 'Cook a feast together' },
    { a: 'Whisper inside jokes', b: 'Keep sweet little notes' },
    { a: 'Slow-dance at home', b: 'Stargaze on the roof' },
    { a: 'Rainy days indoors', b: 'Sunny days outside' },
    { a: 'Breakfast in bed', b: 'Midnight snacks together' },
  ],
  Spicy: [
    { a: 'A slow dance', b: 'A stolen kiss' },
    { a: 'A weekend away, just us', b: 'A surprise date night' },
    { a: 'Whisper it', b: 'Write it in a note' },
    { a: 'Candlelight', b: 'City lights' },
    { a: 'Hold hands in public', b: 'Steal glances across the room' },
    { a: 'A lingering goodbye', b: 'A surprise hello' },
    { a: 'A note left on the pillow', b: 'A voice note at midnight' },
    { a: 'Slow dancing barefoot', b: 'Kissing in the rain' },
    { a: 'A weekend hideaway', b: 'A night under the stars' },
    { a: 'Butterflies before a date', b: 'Comfort of a long embrace' },
    { a: 'A flirty glance', b: 'A soft whisper' },
    { a: 'Being swept off your feet', b: 'Sweeping someone off theirs' },
    { a: 'A rose left on the doorstep', b: 'A playlist made just for you' },
    { a: 'A moonlit walk', b: 'A firelit evening' },
    { a: 'Slow and romantic', b: 'Bold and spontaneous' },
  ],
}
const TOT = [
  { a: 'Coffee', b: 'Tea' }, { a: 'Beach', b: 'Mountains' }, { a: 'Morning', b: 'Night' },
  { a: 'Sweet', b: 'Savoury' }, { a: 'Call', b: 'Text' }, { a: 'City', b: 'Village' },
  { a: 'Cats', b: 'Dogs' }, { a: 'Movies', b: 'Music' }, { a: 'Summer', b: 'Rainy season' },
  { a: 'Plan ahead', b: 'Go with the flow' }, { a: 'Save', b: 'Spend' }, { a: 'Spicy', b: 'Mild' },
  { a: 'Books', b: 'Podcasts' }, { a: 'Window seat', b: 'Aisle seat' }, { a: 'Tea in a mug', b: 'Juice in a glass' },
  { a: 'Early bird', b: 'Night owl' }, { a: 'Rice', b: 'Chapati' }, { a: 'Football', b: 'Basketball' },
  { a: 'Sneakers', b: 'Sandals' }, { a: 'Comedy', b: 'Drama' }, { a: 'Sunrise', b: 'Sunset' },
  { a: 'Handwritten', b: 'Typed' }, { a: 'Adventure', b: 'Relaxation' }, { a: 'Cook at home', b: 'Eat out' },
  { a: 'Dawn walk', b: 'Evening jog' }, { a: 'Chocolate', b: 'Vanilla' }, { a: 'Road trip', b: 'Flight' },
  { a: 'Loud playlist', b: 'Quiet room' }, { a: 'Ocean', b: 'Lake' }, { a: 'Emoji', b: 'Words' },
  { a: 'Long shower', b: 'Quick shower' }, { a: 'Board games', b: 'Video games' }, { a: 'Front seat', b: 'Back seat' },
  { a: 'Ugali', b: 'Wali' }, { a: 'Bright colours', b: 'Neutral tones' }, { a: 'Big party', b: 'Small gathering' },
]

interface TriviaQ { q: string; options: string[]; answer: number; cat: string }
const TRIVIA: TriviaQ[] = [
  // Tanzania / Africa
  { cat: 'Tanzania', q: 'What is the highest mountain in Africa?', options: ['Mt Kenya', 'Mt Kilimanjaro', 'Mt Meru', 'Rwenzori'], answer: 1 },
  { cat: 'Tanzania', q: 'What is the capital city of Tanzania?', options: ['Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza'], answer: 2 },
  { cat: 'Tanzania', q: 'Which lake is the largest in Africa?', options: ['Lake Tanganyika', 'Lake Malawi', 'Lake Victoria', 'Lake Nyasa'], answer: 2 },
  { cat: 'Tanzania', q: 'Zanzibar is famous for producing which spice?', options: ['Cinnamon', 'Cloves', 'Pepper', 'Ginger'], answer: 1 },
  { cat: 'Tanzania', q: 'The Serengeti is famous for which annual event?', options: ['The Great Migration', 'The Rift Eruption', 'The Long Rain', 'The Salt Harvest'], answer: 0 },
  { cat: 'Tanzania', q: 'What is the national language of Tanzania?', options: ['English', 'Swahili', 'Chagga', 'Sukuma'], answer: 1 },
  { cat: 'Africa', q: 'Which river is the longest in the world?', options: ['Congo', 'Zambezi', 'Nile', 'Niger'], answer: 2 },
  { cat: 'Africa', q: 'How many countries are in Africa?', options: ['48', '54', '60', '45'], answer: 1 },
  // General
  { cat: 'General', q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
  { cat: 'General', q: 'What is the largest planet in our solar system?', options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], answer: 1 },
  { cat: 'General', q: 'How many colours are in a rainbow?', options: ['5', '6', '7', '8'], answer: 2 },
  { cat: 'General', q: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], answer: 2 },
  { cat: 'General', q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { cat: 'General', q: 'What is the currency of Tanzania?', options: ['Shilling', 'Franc', 'Naira', 'Cedi'], answer: 0 },
  // Science
  { cat: 'Science', q: 'What gas do plants absorb from the air?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], answer: 2 },
  { cat: 'Science', q: 'How many bones are in the adult human body?', options: ['206', '201', '212', '198'], answer: 0 },
  { cat: 'Science', q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { cat: 'Science', q: 'What organ pumps blood through the body?', options: ['Liver', 'Heart', 'Lungs', 'Kidney'], answer: 1 },
  { cat: 'Science', q: 'What is the speed of light (approx)?', options: ['300,000 km/s', '30,000 km/s', '3,000 km/s', '3 million km/s'], answer: 0 },
  // Faith
  { cat: 'Faith', q: 'How many books are in the Christian New Testament?', options: ['27', '39', '66', '24'], answer: 0 },
  { cat: 'Faith', q: 'How many surahs are in the Quran?', options: ['99', '114', '120', '110'], answer: 1 },
  { cat: 'Faith', q: 'What is the first month of the Islamic calendar?', options: ['Ramadan', 'Muharram', 'Shawwal', 'Rajab'], answer: 1 },
  { cat: 'Faith', q: 'In the Bible, who built the ark?', options: ['Moses', 'Abraham', 'Noah', 'David'], answer: 2 },
  // Sport & Culture
  { cat: 'Sport', q: 'How many players are on a football (soccer) team on the pitch?', options: ['9', '10', '11', '12'], answer: 2 },
  { cat: 'Sport', q: 'How often are the Summer Olympics held?', options: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'], answer: 2 },
  { cat: 'Sport', q: 'Which country has won the most FIFA World Cups?', options: ['Germany', 'Brazil', 'Argentina', 'Italy'], answer: 1 },
  { cat: 'Culture', q: '"Hakuna Matata" means what?', options: ['Good morning', 'No worries', 'Thank you', 'Welcome'], answer: 1 },
  { cat: 'Culture', q: 'What does "Asante" mean in Swahili?', options: ['Hello', 'Please', 'Thank you', 'Goodbye'], answer: 2 },
  // Tanzania / Africa (more)
  { cat: 'Tanzania', q: 'What ocean lies to the east of Tanzania?', options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'], answer: 1 },
  { cat: 'Tanzania', q: 'Which national park is famous for tree-climbing lions?', options: ['Serengeti', 'Ruaha', 'Lake Manyara', 'Tarangire'], answer: 2 },
  { cat: 'Tanzania', q: 'Ngorongoro is famous for being what natural feature?', options: ['A waterfall', 'A volcanic crater', 'A desert', 'A glacier'], answer: 1 },
  { cat: 'Tanzania', q: 'In which gorge were famous early-human fossils found?', options: ['Olduvai Gorge', 'Great Rift', 'Ngorongoro', 'Serengeti'], answer: 0 },
  { cat: 'Tanzania', q: 'Which large lake forms part of Tanzania’s western border?', options: ['Lake Victoria', 'Lake Tanganyika', 'Lake Malawi', 'Lake Chad'], answer: 1 },
  { cat: 'Tanzania', q: 'What does the Swahili greeting "Karibu" mean?', options: ['Goodbye', 'Welcome', 'Sorry', 'Please'], answer: 1 },
  { cat: 'Tanzania', q: 'What does "Pole" mean in Swahili?', options: ['Congratulations', 'Sorry', 'Hurry', 'Wait'], answer: 1 },
  { cat: 'Africa', q: 'What is the largest desert in Africa?', options: ['Kalahari', 'Namib', 'Sahara', 'Sahel'], answer: 2 },
  { cat: 'Africa', q: 'Which African country has the largest population?', options: ['Egypt', 'Nigeria', 'Ethiopia', 'South Africa'], answer: 1 },
  { cat: 'Africa', q: 'The Great Pyramid of Giza is in which country?', options: ['Sudan', 'Egypt', 'Libya', 'Morocco'], answer: 1 },
  { cat: 'Africa', q: 'Which country was formerly known as Abyssinia?', options: ['Ethiopia', 'Kenya', 'Somalia', 'Eritrea'], answer: 0 },
  { cat: 'Africa', q: 'Victoria Falls sits on the border of Zambia and which country?', options: ['Zimbabwe', 'Botswana', 'Mozambique', 'Malawi'], answer: 0 },
  { cat: 'Africa', q: 'Which sea lies to the north of Egypt?', options: ['Red Sea', 'Mediterranean Sea', 'Black Sea', 'Arabian Sea'], answer: 1 },
  // General (more)
  { cat: 'General', q: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], answer: 2 },
  { cat: 'General', q: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], answer: 2 },
  { cat: 'General', q: 'What is the largest country by land area?', options: ['China', 'Canada', 'Russia', 'USA'], answer: 2 },
  { cat: 'General', q: 'How many minutes are in a full day?', options: ['1200', '1440', '1600', '2400'], answer: 1 },
  { cat: 'General', q: 'What is the tallest land animal in the world?', options: ['Elephant', 'Giraffe', 'Ostrich', 'Camel'], answer: 1 },
  { cat: 'General', q: 'How many degrees are in a right angle?', options: ['45', '90', '180', '360'], answer: 1 },
  { cat: 'General', q: 'What colour do you get by mixing blue and yellow?', options: ['Green', 'Purple', 'Orange', 'Brown'], answer: 0 },
  { cat: 'General', q: 'How many zeros are in one million?', options: ['4', '5', '6', '7'], answer: 2 },
  { cat: 'General', q: 'How many hours are in two days?', options: ['24', '36', '48', '60'], answer: 2 },
  { cat: 'General', q: 'What shape has three sides?', options: ['Square', 'Triangle', 'Circle', 'Pentagon'], answer: 1 },
  // Science (more)
  { cat: 'Science', q: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], answer: 1 },
  { cat: 'Science', q: 'What is the largest organ of the human body?', options: ['Liver', 'Skin', 'Brain', 'Lungs'], answer: 1 },
  { cat: 'Science', q: 'Which gas do humans need to breathe to survive?', options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'], answer: 2 },
  { cat: 'Science', q: 'How many legs does a spider have?', options: ['6', '8', '10', '12'], answer: 1 },
  { cat: 'Science', q: 'What is H2O commonly known as?', options: ['Salt', 'Water', 'Air', 'Sugar'], answer: 1 },
  { cat: 'Science', q: 'What force pulls objects toward the earth?', options: ['Magnetism', 'Gravity', 'Friction', 'Tension'], answer: 1 },
  { cat: 'Science', q: 'How many teeth does a healthy adult usually have?', options: ['28', '30', '32', '34'], answer: 2 },
  { cat: 'Science', q: 'What is the nearest star to Earth?', options: ['The Moon', 'The Sun', 'Sirius', 'Proxima'], answer: 1 },
  { cat: 'Science', q: 'Which is the smallest planet in our solar system?', options: ['Mars', 'Mercury', 'Venus', 'Earth'], answer: 1 },
  { cat: 'Science', q: 'What is the freezing point of water in Celsius?', options: ['-10', '0', '10', '32'], answer: 1 },
  // Faith (more)
  { cat: 'Faith', q: 'How many pillars are there in Islam?', options: ['3', '4', '5', '6'], answer: 2 },
  { cat: 'Faith', q: 'In which city is the Kaaba located?', options: ['Medina', 'Mecca', 'Jerusalem', 'Cairo'], answer: 1 },
  { cat: 'Faith', q: 'On which day did God rest according to Genesis?', options: ['Third', 'Fifth', 'Seventh', 'First'], answer: 2 },
  { cat: 'Faith', q: 'How many disciples did Jesus have according to the Bible?', options: ['10', '11', '12', '13'], answer: 2 },
  { cat: 'Faith', q: 'What is the fasting month in Islam called?', options: ['Hajj', 'Ramadan', 'Eid', 'Shawwal'], answer: 1 },
  { cat: 'Faith', q: 'In the Bible, who was swallowed by a great fish?', options: ['Jonah', 'Elijah', 'Peter', 'Paul'], answer: 0 },
  // Sport (more)
  { cat: 'Sport', q: 'How many rings are on the Olympic flag?', options: ['4', '5', '6', '7'], answer: 1 },
  { cat: 'Sport', q: 'In which sport would you perform a slam dunk?', options: ['Football', 'Basketball', 'Tennis', 'Cricket'], answer: 1 },
  { cat: 'Sport', q: 'Which country hosts the Wimbledon tennis tournament?', options: ['USA', 'France', 'England', 'Australia'], answer: 2 },
  { cat: 'Sport', q: 'How long is a standard football match (excluding stoppage)?', options: ['60 minutes', '80 minutes', '90 minutes', '120 minutes'], answer: 2 },
  { cat: 'Sport', q: 'In cricket, how many players are in a team?', options: ['9', '10', '11', '12'], answer: 2 },
  { cat: 'Sport', q: 'How many players are on a basketball team on the court?', options: ['4', '5', '6', '7'], answer: 1 },
  // Culture (more)
  { cat: 'Culture', q: 'What does "Jambo" commonly mean in Swahili?', options: ['Goodbye', 'Hello', 'Thanks', 'Yes'], answer: 1 },
  { cat: 'Culture', q: 'What does "Ndiyo" mean in Swahili?', options: ['No', 'Yes', 'Maybe', 'Later'], answer: 1 },
  { cat: 'Culture', q: 'What does "Chakula" mean in Swahili?', options: ['Water', 'Food', 'House', 'Road'], answer: 1 },
  { cat: 'Culture', q: 'What does "Rafiki" mean in Swahili?', options: ['Enemy', 'Friend', 'Family', 'Stranger'], answer: 1 },
  { cat: 'Culture', q: 'What does "Maji" mean in Swahili?', options: ['Fire', 'Water', 'Wind', 'Earth'], answer: 1 },
  { cat: 'Culture', q: 'What does "Kwaheri" mean in Swahili?', options: ['Hello', 'Welcome', 'Goodbye', 'Please'], answer: 2 },
]
const MLT = [
  'become famous one day',
  'send a text to the wrong person',
  'cry during a movie',
  'forget an anniversary',
  'become a millionaire',
  'sleep through an alarm',
  'start a business',
  'sing loudly in the shower',
  'travel the world',
  'win an argument every time',
  'eat the last slice of food',
  'get lost with GPS on',
  'laugh at the wrong moment',
  'plan the perfect surprise',
  'stay calm in a crisis',
  'adopt ten pets',
  'become a famous chef',
  'move to another country on a whim',
  'forget where they parked the car',
  'reply to a message three days late',
  'be the last one dancing at a party',
  'become a motivational speaker',
  'accidentally start a group chat war',
  'give the best advice at 2am',
  'binge a whole series in one night',
  'name their pet something ridiculous',
  'get emotional at a wedding',
  'talk their way out of a ticket',
  'go viral for something random',
  'become the family historian',
  'lose a bet and never live it down',
  'plan a trip and never book it',
  'befriend a total stranger in minutes',
  'know every lyric to every song',
  'save the day at the last second',
  'overpack for a weekend trip',
  'start a hundred hobbies and finish none',
  'become the neighbourhood legend',
  'cry laughing at their own joke',
  'run late but still look effortless',
  'adopt a stray animal on the street',
  'win a dance-off unexpectedly',
  'become everyone’s therapist friend',
  'get lost in a bookshop for hours',
  'turn a small errand into an adventure',
  'be the first to arrive and last to leave',
  'remember everyone’s birthday',
]

const HOT_TAKES = [
  'Pineapple belongs on pizza', 'Money can buy happiness', 'Long-distance relationships can work',
  'Texting is better than calling', 'Breakfast is the best meal of the day', 'Cats are better than dogs',
  'Social media does more harm than good', 'Being 10 minutes late is no big deal', 'Weddings should be small',
  'Working from home beats the office', 'Football is the greatest sport', 'You should always split the bill',
  'Reading beats watching TV', 'It is fine to reheat the same meal all week', 'Morning people have it better',
  'Voice notes are better than long texts', 'Tea is better than coffee', 'A phone should always be on silent',
  'Sequels are usually better than the original', 'Group projects are always a bad idea', 'Sandals with socks can look good',
  'The window seat is always the best seat', 'Fruit does not belong in savoury food', 'New Year resolutions are pointless',
  'Cereal is a soup', 'It is fine to skip the gym on rainy days', 'Movies are better than the books they are based on',
  'You should reply to every text within an hour', 'Public transport beats driving', 'Homemade food always beats takeaway',
  'Birthdays should stop mattering after twenty-five', 'A hot drink fixes almost anything', 'Board games ruin friendships',
  'Airport arrivals are more exciting than departures', 'Leftovers taste better the next day', 'Naps are underrated',
  'Everyone secretly likes a rainy day', 'Small talk is exhausting', 'The best snacks are the shared ones',
  'Handwriting says a lot about a person', 'A good playlist can save any road trip', 'Weekends are too short by design',
]
const GMA_QS = [
  { q: 'My ideal weekend is…', options: ['Beach & sun', 'Home & movies', 'An adventure trip', 'Out with friends'] },
  { q: 'My comfort food is…', options: ['Ugali & fish', 'Pilau', 'Chips mayai', 'Nyama choma'] },
  { q: 'My love language is…', options: ['Words', 'Quality time', 'Gifts', 'Acts of service'] },
  { q: 'On a free evening I…', options: ['Read a book', 'Watch a series', 'Call family', 'Go out'] },
  { q: 'My dream holiday is…', options: ['Zanzibar beach', 'A safari', 'A big city', 'The mountains'] },
  { q: 'My biggest pet peeve is…', options: ['Being late', 'Loud chewing', 'Messy spaces', 'Slow walkers'] },
  { q: 'I relax by…', options: ['Music', 'Sleeping', 'Cooking', 'Exercising'] },
  { q: 'My guilty pleasure is…', options: ['Sweets', 'Reality TV', 'Online shopping', 'Long naps'] },
  { q: 'My perfect morning starts with…', options: ['Coffee', 'A workout', 'A slow lie-in', 'Music'] },
  { q: 'My favourite way to travel is…', options: ['By plane', 'By road trip', 'By train', 'By boat'] },
  { q: 'The gift I love most is…', options: ['Something handmade', 'A surprise trip', 'A thoughtful book', 'Something practical'] },
  { q: 'My dream pet would be…', options: ['A loyal dog', 'A cosy cat', 'A colourful bird', 'No pets, thanks'] },
  { q: 'On a night out I prefer…', options: ['Dancing', 'A quiet dinner', 'Live music', 'Game night'] },
  { q: 'My favourite season is…', options: ['The dry season', 'The rainy season', 'Cool evenings', 'Warm afternoons'] },
  { q: 'I would rather spend money on…', options: ['Travel', 'Good food', 'Gadgets', 'Experiences'] },
  { q: 'My phone home screen is mostly…', options: ['Neat and tidy', 'Total chaos', 'One big folder', 'Endless apps'] },
  { q: 'My favourite drink is…', options: ['Chai', 'Fresh juice', 'Soda', 'Just water'] },
  { q: 'When I am stressed I…', options: ['Go quiet', 'Talk it out', 'Keep busy', 'Take a walk'] },
  { q: 'My ideal Saturday morning is…', options: ['A long run', 'Sleeping in', 'Market shopping', 'Cooking a big breakfast'] },
  { q: 'The trait I value most is…', options: ['Honesty', 'Kindness', 'Humour', 'Ambition'] },
  { q: 'My dream home would be…', options: ['By the sea', 'In the city', 'In the countryside', 'On a hill'] },
  { q: 'My favourite kind of music is…', options: ['Bongo Flava', 'Afrobeat', 'Gospel', 'Old-school classics'] },
  { q: 'My biggest weakness is…', options: ['Saying yes too much', 'Overthinking', 'Being too blunt', 'Never being on time'] },
  { q: 'My happy place is…', options: ['The beach', 'My own bed', 'A busy market', 'Anywhere with family'] },
]

const EMOJI_RIDDLES: { emoji: string; answer: string }[] = [
  { emoji: '🦁👑', answer: 'lion king' },
  { emoji: '🕷️🧍', answer: 'spider man' },
  { emoji: '❄️👸', answer: 'frozen' },
  { emoji: '🍫🏭', answer: 'chocolate factory' },
  { emoji: '🦇🧍', answer: 'batman' },
  { emoji: '🌊🐠🔍', answer: 'finding nemo' },
  { emoji: '🚢🧊💔', answer: 'titanic' },
  { emoji: '🧙⚡🤓', answer: 'harry potter' },
  { emoji: '🐝🎬', answer: 'bee movie' },
  { emoji: '🦖🏝️', answer: 'jurassic park' },
  { emoji: '🏃‍♂️🍫', answer: 'forrest gump' },
  { emoji: '☕➕🥛', answer: 'latte' },
  { emoji: '🍞🧈', answer: 'bread and butter' },
  { emoji: '🌧️➕☀️', answer: 'rainbow' },
  { emoji: '🐘🧠', answer: 'memory' },
  { emoji: '⏰🍏', answer: 'time apple' },
  { emoji: '👀🥔', answer: 'couch potato' },
  { emoji: '🔥🦊', answer: 'firefox' },
  { emoji: '🌟⚔️', answer: 'star wars' },
  { emoji: '🍕🐀', answer: 'ratatouille' },
  { emoji: '👽🚲🌙', answer: 'et' },
  { emoji: '🤖🌱', answer: 'wall-e' },
  { emoji: '🐍✈️', answer: 'snakes on a plane' },
  { emoji: '🐷🕸️', answer: 'charlottes web' },
  { emoji: '🦈🏊', answer: 'jaws' },
  { emoji: '🏠🎈🎈', answer: 'up' },
  { emoji: '👻🚫', answer: 'ghostbusters' },
  { emoji: '🐟🔍💙', answer: 'finding dory' },
  { emoji: '🚗⚡🏁', answer: 'cars' },
  { emoji: '🕶️👽🔫', answer: 'men in black' },
  { emoji: '🐘👂🪶', answer: 'dumbo' },
  { emoji: '🦌🔴👃', answer: 'rudolph' },
  { emoji: '🌙💡', answer: 'moonlight' },
  { emoji: '🧜‍♀️🌊', answer: 'the little mermaid' },
  { emoji: '🐼🥋', answer: 'kung fu panda' },
  { emoji: '🦖🌆', answer: 'godzilla' },
  { emoji: '🦸‍♀️', answer: 'wonder woman' },
  { emoji: '🃏🤡', answer: 'joker' },
  { emoji: '🌧️🐈🐕', answer: 'raining cats and dogs' },
  { emoji: '🕰️✈️', answer: 'time flies' },
  { emoji: '🧠⛈️', answer: 'brainstorm' },
  { emoji: '👁️❤️🫵', answer: 'i love you' },
  { emoji: '🐮🌙', answer: 'over the moon' },
  { emoji: '📖🐛', answer: 'bookworm' },
  { emoji: '🌻', answer: 'sunflower' },
  { emoji: '🍿', answer: 'popcorn' },
  { emoji: '🦶⚽', answer: 'football' },
  { emoji: '🌊🏄', answer: 'surfing' },
  { emoji: '🐝🍯🏠', answer: 'beehive' },
  { emoji: '🔥🚒', answer: 'fire truck' },
  { emoji: '🍳☀️', answer: 'sunny side up' },
  { emoji: '🐟🍟', answer: 'fish and chips' },
  { emoji: '🥧🍎', answer: 'apple pie' },
  { emoji: '🎃👻', answer: 'halloween' },
]

const STORY_OPENERS = [
  'Once upon a time in Bukoba, a very confused chicken decided to…',
  'It was a dark and stormy night when the pot of ugali suddenly…',
  'Nobody in the village expected the goat to…',
  'On the shores of Lake Victoria, a fisherman pulled up his net and found…',
  'The wedding was going perfectly until the DJ announced…',
  'Deep in the Serengeti, a lion woke up one morning and realised…',
  'She opened the mysterious box her grandmother left, and inside was…',
  'The bus to Dodoma broke down, so the passengers decided to…',
  'Everyone laughed at the boy who claimed his mango tree could…',
  'The power went out across the whole city, and that is when…',
  'At the busy market in Kariakoo, a mysterious vendor offered a fruit that…',
  'The daladala driver took a wrong turn and suddenly the whole bus…',
  'A parrot landed on the mayor’s window and began to reveal that…',
  'On the very first day of school, the new teacher announced that…',
  'The football match stopped when the ball rolled into a hole and…',
  'Grandmother’s old radio crackled to life at midnight and a voice said…',
  'When the rains finally came to the village, the river started to…',
  'A tourist dropped a camera on the beach, and the crab that grabbed it…',
  'The chef swore his secret recipe was safe, until the pot began to…',
  'High on the slopes of Kilimanjaro, a lost hiker discovered a door that…',
  'The whole neighbourhood gathered when the well suddenly started to…',
  'A little girl traded her marbles for a map that led straight to…',
  'The night guard heard footsteps on the roof, climbed up, and found…',
  'At the wedding feast, the cake was cut open to reveal…',
  'Nobody believed the fisherman until the fish he caught started to…',
  'The old baobab tree in the square whispered a secret that…',
  'A phone rang from inside a locked drawer, and when they opened it…',
  'The last matatu of the night refused to move until the passengers…',
  'When the schoolboy opened his lunchbox, a tiny voice inside said…',
  'The village elder unrolled an ancient map that pointed toward…',
]

const REACTIONS = ['❤️', '😂', '🔥', '😮', '👏', '💋', '🥰', '😳']

const rid = () => Math.random().toString(36).slice(2)
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

interface Props {
  me: LivePlayer
  code: string
  isHost: boolean
  onExit: () => void
  initialGame?: string
}

export default function LiveParty({ me, code, isHost, onExit, initialGame }: Props) {
  const roomRef = useRef<LiveRoom | null>(null)
  const [players, setPlayers] = useState<LivePlayer[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [g, setG] = useState<GState>({ screen: 'lobby' })
  const gRef = useRef(g); gRef.current = g
  const playersRef = useRef(players); playersRef.current = players
  // Host is COMPUTED, not fixed: the present player with the lowest id is host.
  // If the host leaves, the next player automatically takes over (migration).
  // Falls back to the initial isHost prop before the first presence sync.
  const amHost = players.length ? players[0].id === me.id : isHost
  const amHostRef = useRef(amHost); amHostRef.current = amHost
  const [floats, setFloats] = useState<{ id: string; emoji: string; x: number }[]>([])
  const [chat, setChat] = useState<{ id: string; from: string; name: string; text: string }[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const [copied, setCopied] = useState(false)
  const [showLeave, setShowLeave] = useState(false)

  const nameOf = (id?: string) => playersRef.current.find(p => p.id === id)?.name || 'Someone'

  // Remember this room so an accidental exit / refresh / dropped connection can be
  // recovered — the player can rejoin from "Your live rooms" while a mate is still in.
  const gameNameOf = (id?: string) => LIVE_GAMES.find(x => x.id === id)?.name
  useEffect(() => {
    const others = playersRef.current.filter(p => p.id !== me.id)
    rememberRoom({ code, isHost: amHost, game: initialGame, gameName: gameNameOf(initialGame), withName: others[0]?.name })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, players.length])

  // Explicit dispositions for the leave-confirm sheet.
  const keepAndExit = () => {
    const others = playersRef.current.filter(p => p.id !== me.id)
    rememberRoom({ code, isHost: amHost, game: initialGame, gameName: gameNameOf(initialGame), withName: others[0]?.name })
    setShowLeave(false); onExit()
  }
  const closeAndExit = () => {
    forgetRoom(code)
    try { roomRef.current?.send('closed', { by: me.id }) } catch { /* ignore */ }
    setShowLeave(false); onExit()
  }

  // ── authoritative state push (host only) ──
  const pushState = useCallback((next: GState) => {
    setG(next); gRef.current = next
    roomRef.current?.send('state', next)
  }, [])

  // ── connect ──
  useEffect(() => {
    const room = new LiveRoom(code, me, isHost)
    roomRef.current = room
    let prevCount = 0
    const offP = room.onPlayers(list => {
      setPlayers(list)
      if (list.length > prevCount && prevCount > 0) { try { navigator.vibrate?.(60) } catch { /* unsupported */ } }
      prevCount = list.length
      // whoever is currently host re-syncs authoritative state so joiners
      // (and a freshly-promoted host) stay caught up
      if (amHostRef.current) roomRef.current?.send('state', gRef.current)
    })
    const offS = room.onStatus(setStatus)
    const offM = room.onMessage((m: LiveMsg) => {
      if (m.from === me.id) return
      if (m.t === 'state' && !amHostRef.current) { setG(m.d); gRef.current = m.d }
      else if (m.t === 'act' && amHostRef.current) applyAction(m.from, m.d)
      else if (m.t === 'reaction') spawnFloat(m.d.emoji)
      else if (m.t === 'chat') setChat(c => [...c.slice(-40), { id: rid(), from: m.from, name: m.d.name, text: m.d.text }])
    })
    room.connect()
    return () => { offP(); offS(); offM(); room.leave() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── host: apply a guest action ──
  const applyAction = (from: string, d: any) => {
    const cur = gRef.current
    if (d.a === 'spin') doSpin()
    else if (d.a === 'toTod') startTod(cur.landedId || from)
    else if (d.a === 'kind') pushState({ ...cur, kind: d.kind, prompt: null })
    else if (d.a === 'prompt') pushState({ ...cur, prompt: d.text })
    else if (d.a === 'doneTurn') nextTurn()
    else if (d.a === 'vote') {
      const votes = { ...(cur.nhieVotes || {}), [from]: d.choice }
      pushState({ ...cur, nhieVotes: votes })
    }
    else if (d.a === 'reveal') pushState({ ...cur, nhieRevealed: true })
    else if (d.a === 'nextNhie') startNhie(cur.nhieCat || 'Party')
    else if (d.a === 'nhieCat') startNhie(d.cat)
    else if (d.a === 'choicevote') {
      const votes = { ...(cur.choiceVotes || {}), [from]: d.choice }
      pushState({ ...cur, choiceVotes: votes })
    }
    else if (d.a === 'choicereveal') pushState({ ...cur, choiceRevealed: true })
    else if (d.a === 'nextChoice') startChoice(cur.choiceKind || 'wyr', cur.choiceCat || 'Couple')
    else if (d.a === 'choiceCat') startChoice(cur.choiceKind || 'wyr', d.cat)
    else if (d.a === 'tvote') pushState({ ...cur, triviaVotes: { ...(cur.triviaVotes || {}), [from]: d.choice } })
    else if (d.a === 'treveal') revealTrivia()
    else if (d.a === 'tnext') nextTrivia()
    else if (d.a === 'tcat') startTrivia(d.cat)
    else if (d.a === 'mvote') pushState({ ...cur, mltVotes: { ...(cur.mltVotes || {}), [from]: d.target } })
    else if (d.a === 'mreveal') revealMlt()
    else if (d.a === 'mnext') nextMlt()
    else if (d.a === 'rpick') pushState({ ...cur, rpsPicks: { ...(cur.rpsPicks || {}), [from]: d.choice } })
    else if (d.a === 'rreveal') revealRps()
    else if (d.a === 'rnext') nextRps()
    else if (d.a === 'hotvote') pushState({ ...cur, hotVotes: { ...(cur.hotVotes || {}), [from]: d.choice } })
    else if (d.a === 'hotreveal') revealHot()
    else if (d.a === 'hotnext') nextHot()
    else if (d.a === 'gmaanswer') { if (from === cur.gmaSubject) pushState({ ...cur, gmaPick: d.idx, gmaPhase: 'guess' }) }
    else if (d.a === 'gmaguess') { if (from !== cur.gmaSubject) pushState({ ...cur, gmaGuesses: { ...(cur.gmaGuesses || {}), [from]: d.idx } }) }
    else if (d.a === 'gmareveal') revealGma()
    else if (d.a === 'gmanext') nextGma()
    else if (d.a === 'ttlsubmit') { if (from === cur.ttlAsker) pushState({ ...cur, ttlStatements: d.statements, ttlLie: d.lie, ttlPhase: 'guess', ttlGuesses: {} }) }
    else if (d.a === 'ttlguess') { if (from !== cur.ttlAsker) pushState({ ...cur, ttlGuesses: { ...(cur.ttlGuesses || {}), [from]: d.idx } }) }
    else if (d.a === 'ttlreveal') revealTtl()
    else if (d.a === 'ttlnext') nextTtl()
    else if (d.a === 'wcword') wcApply(from, d.word)
    else if (d.a === 'erguess') erSubmit(from, d.text)
    else if (d.a === 'ereveal') revealEr()
    else if (d.a === 'ernext') nextEr()
    else if (d.a === 'storyline') storyApply(from, d.line)
    else if (d.a === 'storyend') endStory()
    else if (d.a === 'results') pushState({ screen: 'results' })
    else if (d.a === 'resetscores') pushState({ screen: 'menu', scores: {} })
    else if (d.a === 'menu') pushState({ screen: 'menu' })
  }

  // ── host game flows (read the live roster via ref, so guest-triggered
  //    actions applied through the mount-time message handler stay correct) ──
  const ids = () => playersRef.current.map(p => p.id)
  const orderIds = ids() // for render-scope views
  const startMenu = () => pushState({ screen: 'menu' })

  const doSpin = () => {
    sfxTap()
    const order = ids()
    const n = order.length
    if (n === 0) return
    const targetIdx = Math.floor(Math.random() * n)
    const per = 360 / n
    const base = (gRef.current.spinAngle || 0)
    const angle = base + 360 * 5 + (360 - targetIdx * per)
    pushState({ screen: 'spin', spinNonce: (gRef.current.spinNonce || 0) + 1, spinAngle: angle, spinning: true, landedId: undefined })
    setTimeout(() => {
      sfxReveal()
      pushState({ ...gRef.current, spinning: false, landedId: ids()[targetIdx] })
    }, 3300)
  }

  const startTod = (targetId: string) => {
    const askerId = gRef.current.landedId && gRef.current.landedId !== targetId ? gRef.current.landedId : (me.id)
    pushState({ screen: 'tod', askerId: askerId, targetId, kind: null, prompt: null })
  }
  const nextTurn = () => {
    const cur = gRef.current
    const order = ids()
    const n = order.length
    const curAsker = cur.askerId ? order.indexOf(cur.askerId) : 0
    const nextAsker = (curAsker + 1) % Math.max(1, n)
    const nextTarget = n > 1 ? (nextAsker + 1) % n : nextAsker
    pushState({ screen: 'tod', askerId: order[nextAsker], targetId: order[nextTarget], kind: null, prompt: null })
  }
  const beginTod = () => {
    const order = ids()
    const n = order.length
    const askerIdx = Math.max(0, order.indexOf(me.id))
    const targetIdx = n > 1 ? (askerIdx + 1) % n : askerIdx
    pushState({ screen: 'tod', askerId: order[askerIdx], targetId: order[targetIdx], kind: null, prompt: null })
  }
  const startNhie = (cat = 'Party') => pushState({ screen: 'nhie', nhieCat: cat, nhiePrompt: pick(NHIE_BY_CAT[cat] || NHIE_BY_CAT.Party), nhieVotes: {}, nhieRevealed: false, scores: keepScores() })
  const startChoice = (kind: 'wyr' | 'tot', cat = 'Couple') => {
    const prompt = kind === 'wyr' ? pick(WYR_BY_CAT[cat] || WYR_BY_CAT.Couple) : pick(TOT)
    pushState({ screen: 'choice', choiceKind: kind, choiceCat: cat, choicePrompt: prompt, choiceVotes: {}, choiceRevealed: false, scores: keepScores() })
  }

  // ── shared scoreboard ──
  const keepScores = () => gRef.current.scores || {}

  // ── Trivia Duel ──
  const pickTrivia = (cat: string, avoid?: string): TriviaQ => {
    const pool = cat === 'Mixed' ? TRIVIA : TRIVIA.filter(q => q.cat === cat)
    const base = pool.filter(q => q.q !== avoid)
    const src = base.length ? base : pool
    const picked = src[Math.floor(Math.random() * src.length)]
    const order = picked.options.map((o, i) => ({ o, i })).sort(() => Math.random() - 0.5)
    return { q: picked.q, options: order.map(x => x.o), answer: order.findIndex(x => x.i === picked.answer), cat: picked.cat }
  }
  const startTrivia = (cat: string) => pushState({ screen: 'trivia', triviaCat: cat, triviaRound: 1, triviaQ: pickTrivia(cat), triviaVotes: {}, triviaRevealed: false, scores: keepScores() })
  const revealTrivia = () => {
    const cur = gRef.current; const q = cur.triviaQ; if (!q) return
    const s = { ...(cur.scores || {}) }
    for (const [pid, choice] of Object.entries(cur.triviaVotes || {})) if (choice === q.answer) s[pid] = (s[pid] || 0) + 10
    pushState({ ...cur, triviaRevealed: true, scores: s })
  }
  const nextTrivia = () => { const cur = gRef.current; pushState({ ...cur, triviaRound: (cur.triviaRound || 1) + 1, triviaQ: pickTrivia(cur.triviaCat || 'Mixed', cur.triviaQ?.q), triviaVotes: {}, triviaRevealed: false }) }

  // ── Most Likely To ──
  const startMlt = () => pushState({ screen: 'mlt', mltPrompt: pick(MLT), mltVotes: {}, mltRevealed: false, scores: keepScores() })
  const revealMlt = () => {
    const cur = gRef.current; const tally: Record<string, number> = {}
    for (const t of Object.values(cur.mltVotes || {})) tally[t] = (tally[t] || 0) + 1
    let top = ''; let max = 0
    for (const [id, n] of Object.entries(tally)) if (n > max) { max = n; top = id }
    const s = { ...(cur.scores || {}) }; if (top) s[top] = (s[top] || 0) + 5
    pushState({ ...cur, mltRevealed: true, scores: s })
  }
  const nextMlt = () => pushState({ ...gRef.current, mltPrompt: pick(MLT), mltVotes: {}, mltRevealed: false })

  // ── Rock Paper Scissors ──
  const RPS_BEATS: Record<string, string> = { r: 's', p: 'r', s: 'p' }
  const startRps = () => pushState({ screen: 'rps', rpsPicks: {}, rpsRevealed: false, rpsWins: {}, rpsRound: 1, scores: keepScores() })
  const revealRps = () => {
    const cur = gRef.current; const order = ids(); const picks = cur.rpsPicks || {}
    const wins: Record<string, number> = {}
    for (const a of order) for (const b of order) if (a !== b && picks[a] && picks[b] && RPS_BEATS[picks[a]] === picks[b]) wins[a] = (wins[a] || 0) + 1
    let max = -1; for (const id of order) max = Math.max(max, wins[id] || 0)
    const winners = order.filter(id => (wins[id] || 0) === max && max > 0)
    const rw = { ...(cur.rpsWins || {}) }; const s = { ...(cur.scores || {}) }
    if (winners.length === 1) { rw[winners[0]] = (rw[winners[0]] || 0) + 1; s[winners[0]] = (s[winners[0]] || 0) + 5 }
    pushState({ ...cur, rpsRevealed: true, rpsWins: rw, scores: s })
  }
  const nextRps = () => pushState({ ...gRef.current, rpsPicks: {}, rpsRevealed: false, rpsRound: (gRef.current.rpsRound || 1) + 1 })

  // ── Hot Takes ──
  const startHot = () => pushState({ screen: 'hot', hotPrompt: pick(HOT_TAKES), hotVotes: {}, hotRevealed: false, scores: keepScores() })
  const revealHot = () => pushState({ ...gRef.current, hotRevealed: true })
  const nextHot = () => pushState({ ...gRef.current, hotPrompt: pick(HOT_TAKES), hotVotes: {}, hotRevealed: false })

  // ── Guess My Answer (couples) ──
  const startGma = () => pushState({ screen: 'gma', gmaSubject: ids()[0] || me.id, gmaQ: pick(GMA_QS), gmaPick: undefined, gmaGuesses: {}, gmaPhase: 'answer', gmaRevealed: false, scores: keepScores() })
  const revealGma = () => {
    const cur = gRef.current; const s = { ...(cur.scores || {}) }; let matched = 0
    for (const [pid, gi] of Object.entries(cur.gmaGuesses || {})) if (gi === cur.gmaPick) { s[pid] = (s[pid] || 0) + 10; matched++ }
    if (matched === 0 && cur.gmaSubject) s[cur.gmaSubject] = (s[cur.gmaSubject] || 0) + 5
    pushState({ ...cur, gmaRevealed: true, scores: s })
  }
  const nextGma = () => { const cur = gRef.current; const order = ids(); const i = cur.gmaSubject ? order.indexOf(cur.gmaSubject) : -1; pushState({ ...cur, gmaSubject: order[(i + 1) % Math.max(1, order.length)], gmaQ: pick(GMA_QS), gmaPick: undefined, gmaGuesses: {}, gmaPhase: 'answer', gmaRevealed: false }) }

  // ── Two Truths & a Lie ──
  const startTtl = () => pushState({ screen: 'ttl', ttlAsker: ids()[0] || me.id, ttlStatements: undefined, ttlLie: undefined, ttlGuesses: {}, ttlPhase: 'write', ttlRevealed: false, scores: keepScores() })
  const revealTtl = () => {
    const cur = gRef.current; const s = { ...(cur.scores || {}) }; let fooled = 0
    for (const [pid, gi] of Object.entries(cur.ttlGuesses || {})) { if (gi === cur.ttlLie) s[pid] = (s[pid] || 0) + 10; else fooled++ }
    if (cur.ttlAsker) s[cur.ttlAsker] = (s[cur.ttlAsker] || 0) + fooled * 5
    pushState({ ...cur, ttlRevealed: true, scores: s })
  }
  const nextTtl = () => { const cur = gRef.current; const order = ids(); const i = cur.ttlAsker ? order.indexOf(cur.ttlAsker) : -1; pushState({ ...cur, ttlAsker: order[(i + 1) % Math.max(1, order.length)], ttlStatements: undefined, ttlLie: undefined, ttlGuesses: {}, ttlPhase: 'write', ttlRevealed: false }) }

  // ── Word Chain ──
  const startWc = () => pushState({ screen: 'wc', wcTurnId: ids()[0] || me.id, wcWords: [], scores: keepScores() })
  const wcApply = (from: string, word: string) => {
    const cur = gRef.current
    if (from !== cur.wcTurnId) return
    const w = cur.wcWords || []
    const clean = word.trim().toLowerCase()
    if (!/^[a-z]{2,}$/.test(clean)) return
    if (w.some(x => x === clean)) return
    const req = w.length ? w[w.length - 1].slice(-1) : ''
    if (req && clean[0] !== req) return
    const order = ids(); const i = order.indexOf(from)
    const s = { ...(cur.scores || {}) }; s[from] = (s[from] || 0) + 5
    pushState({ ...cur, wcWords: [...w, clean], wcTurnId: order[(i + 1) % Math.max(1, order.length)], scores: s })
  }

  // ── Emoji Riddle ──
  const normAns = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '')
  const startEr = () => pushState({ screen: 'er', erRiddle: pick(EMOJI_RIDDLES), erSolved: {}, erRevealed: false, scores: keepScores() })
  const erSubmit = (from: string, text: string) => {
    const cur = gRef.current
    if (!cur.erRiddle || cur.erRevealed || cur.erSolved?.[from]) return
    if (normAns(text) === normAns(cur.erRiddle.answer)) {
      const s = { ...(cur.scores || {}) }; s[from] = (s[from] || 0) + 10
      pushState({ ...cur, erSolved: { ...(cur.erSolved || {}), [from]: true }, scores: s })
    }
  }
  const revealEr = () => pushState({ ...gRef.current, erRevealed: true })
  const nextEr = () => pushState({ ...gRef.current, erRiddle: pick(EMOJI_RIDDLES), erSolved: {}, erRevealed: false })

  // ── Story Builder ──
  const startStory = () => pushState({ screen: 'story', storyTurnId: ids()[0] || me.id, storyLines: [pick(STORY_OPENERS)], storyDone: false, scores: keepScores() })
  const storyApply = (from: string, line: string) => {
    const cur = gRef.current
    if (from !== cur.storyTurnId || cur.storyDone) return
    const t = line.trim()
    if (t.length < 2) return
    const order = ids(); const i = order.indexOf(from)
    const s = { ...(cur.scores || {}) }; s[from] = (s[from] || 0) + 2
    pushState({ ...cur, storyLines: [...(cur.storyLines || []), t], storyTurnId: order[(i + 1) % Math.max(1, order.length)], scores: s })
  }
  const endStory = () => pushState({ ...gRef.current, storyDone: true })

  // ── Finish / winner celebration ──
  const goResults = () => pushState({ screen: 'results', scores: keepScores() })
  const resetScores = () => pushState({ screen: 'menu', scores: {} })

  // Host taps Start — go straight into the challenged game, or the picker.
  const launchInitial = () => {
    if (initialGame === 'spin') pushState({ screen: 'spin', spinAngle: 0, spinning: false })
    else if (initialGame === 'tod') beginTod()
    else if (initialGame === 'nhie') startNhie()
    else if (initialGame === 'wyr') startChoice('wyr')
    else if (initialGame === 'tot') startChoice('tot')
    else if (initialGame === 'trivia') startTrivia('Mixed')
    else if (initialGame === 'mlt') startMlt()
    else if (initialGame === 'rps') startRps()
    else if (initialGame === 'hot') startHot()
    else if (initialGame === 'gma') startGma()
    else if (initialGame === 'ttl') startTtl()
    else if (initialGame === 'wc') startWc()
    else if (initialGame === 'er') startEr()
    else if (initialGame === 'story') startStory()
    else startMenu()
  }

  // ── actions (host acts directly, guest sends) ──
  const act = (payload: any, hostFn: () => void) => { if (amHost) hostFn(); else roomRef.current?.send('act', payload) }

  const onSpin = () => act({ a: 'spin' }, doSpin)
  const onToTod = () => act({ a: 'toTod' }, () => startTod(gRef.current.landedId || me.id))
  const onPickKind = (kind: 'truth' | 'dare') => { sfxTap(); act({ a: 'kind', kind }, () => pushState({ ...gRef.current, kind, prompt: null })) }
  const onSendPrompt = (text: string) => { sfxCorrect(); act({ a: 'prompt', text }, () => pushState({ ...gRef.current, prompt: text })) }
  const onDoneTurn = () => { sfxLevelUp(); act({ a: 'doneTurn' }, nextTurn) }
  const onVote = (choice: 'have' | 'never') => {
    sfxTap()
    if (amHost) { const votes = { ...(gRef.current.nhieVotes || {}), [me.id]: choice }; pushState({ ...gRef.current, nhieVotes: votes }) }
    else roomRef.current?.send('act', { a: 'vote', choice })
  }
  const onReveal = () => { sfxReveal(); act({ a: 'reveal' }, () => pushState({ ...gRef.current, nhieRevealed: true })) }
  const onNextNhie = () => act({ a: 'nextNhie' }, () => startNhie(gRef.current.nhieCat || 'Party'))
  const onNhieCat = (cat: string) => act({ a: 'nhieCat', cat }, () => startNhie(cat))
  const onChoiceVote = (choice: 'a' | 'b') => {
    sfxTap()
    if (amHost) { const votes = { ...(gRef.current.choiceVotes || {}), [me.id]: choice }; pushState({ ...gRef.current, choiceVotes: votes }) }
    else roomRef.current?.send('act', { a: 'choicevote', choice })
  }
  const onChoiceReveal = () => { sfxReveal(); act({ a: 'choicereveal' }, () => pushState({ ...gRef.current, choiceRevealed: true })) }
  const onChoiceNext = () => act({ a: 'nextChoice' }, () => startChoice(gRef.current.choiceKind || 'wyr', gRef.current.choiceCat || 'Couple'))
  const onChoiceCat = (cat: string) => act({ a: 'choiceCat', cat }, () => startChoice(gRef.current.choiceKind || 'wyr', cat))
  const onTriviaVote = (choice: number) => { sfxTap(); if (amHost) pushState({ ...gRef.current, triviaVotes: { ...(gRef.current.triviaVotes || {}), [me.id]: choice } }); else roomRef.current?.send('act', { a: 'tvote', choice }) }
  const onTriviaReveal = () => { sfxReveal(); act({ a: 'treveal' }, revealTrivia) }
  const onTriviaNext = () => act({ a: 'tnext' }, nextTrivia)
  const onTriviaCat = (cat: string) => act({ a: 'tcat', cat }, () => startTrivia(cat))
  const onMltVote = (target: string) => { sfxTap(); if (amHost) pushState({ ...gRef.current, mltVotes: { ...(gRef.current.mltVotes || {}), [me.id]: target } }); else roomRef.current?.send('act', { a: 'mvote', target }) }
  const onMltReveal = () => { sfxReveal(); act({ a: 'mreveal' }, revealMlt) }
  const onMltNext = () => act({ a: 'mnext' }, nextMlt)
  const onRpsPick = (choice: 'r' | 'p' | 's') => { sfxTap(); if (amHost) pushState({ ...gRef.current, rpsPicks: { ...(gRef.current.rpsPicks || {}), [me.id]: choice } }); else roomRef.current?.send('act', { a: 'rpick', choice }) }
  const onRpsReveal = () => { sfxReveal(); act({ a: 'rreveal' }, revealRps) }
  const onRpsNext = () => act({ a: 'rnext' }, nextRps)
  const onHotVote = (choice: 'agree' | 'disagree') => { sfxTap(); if (amHost) pushState({ ...gRef.current, hotVotes: { ...(gRef.current.hotVotes || {}), [me.id]: choice } }); else roomRef.current?.send('act', { a: 'hotvote', choice }) }
  const onHotReveal = () => { sfxReveal(); act({ a: 'hotreveal' }, revealHot) }
  const onHotNext = () => act({ a: 'hotnext' }, nextHot)
  const onGmaAnswer = (idx: number) => { sfxTap(); if (amHost) { if (me.id === gRef.current.gmaSubject) pushState({ ...gRef.current, gmaPick: idx, gmaPhase: 'guess' }) } else roomRef.current?.send('act', { a: 'gmaanswer', idx }) }
  const onGmaGuess = (idx: number) => { sfxTap(); if (amHost) { if (me.id !== gRef.current.gmaSubject) pushState({ ...gRef.current, gmaGuesses: { ...(gRef.current.gmaGuesses || {}), [me.id]: idx } }) } else roomRef.current?.send('act', { a: 'gmaguess', idx }) }
  const onGmaReveal = () => { sfxReveal(); act({ a: 'gmareveal' }, revealGma) }
  const onGmaNext = () => act({ a: 'gmanext' }, nextGma)
  const onTtlSubmit = (statements: string[], lie: number) => { sfxCorrect(); if (amHost) { if (me.id === gRef.current.ttlAsker) pushState({ ...gRef.current, ttlStatements: statements, ttlLie: lie, ttlPhase: 'guess', ttlGuesses: {} }) } else roomRef.current?.send('act', { a: 'ttlsubmit', statements, lie }) }
  const onTtlGuess = (idx: number) => { sfxTap(); if (amHost) { if (me.id !== gRef.current.ttlAsker) pushState({ ...gRef.current, ttlGuesses: { ...(gRef.current.ttlGuesses || {}), [me.id]: idx } }) } else roomRef.current?.send('act', { a: 'ttlguess', idx }) }
  const onTtlReveal = () => { sfxReveal(); act({ a: 'ttlreveal' }, revealTtl) }
  const onTtlNext = () => act({ a: 'ttlnext' }, nextTtl)
  const onWcSubmit = (word: string) => { sfxCorrect(); if (amHost) wcApply(me.id, word); else roomRef.current?.send('act', { a: 'wcword', word }) }
  const onErGuess = (text: string) => { if (amHost) erSubmit(me.id, text); else roomRef.current?.send('act', { a: 'erguess', text }) }
  const onErReveal = () => { sfxReveal(); act({ a: 'ereveal' }, revealEr) }
  const onErNext = () => act({ a: 'ernext' }, nextEr)
  const onStoryLine = (line: string) => { sfxCorrect(); if (amHost) storyApply(me.id, line); else roomRef.current?.send('act', { a: 'storyline', line }) }
  const onStoryEnd = () => { sfxReveal(); act({ a: 'storyend' }, endStory) }
  const onFinish = () => { sfxLevelUp(); act({ a: 'results' }, goResults) }
  const onResetScores = () => act({ a: 'resetscores' }, resetScores)
  const onBackMenu = () => act({ a: 'menu' }, startMenu)

  // ── reactions + chat (peer broadcast) ──
  const spawnFloat = (emoji: string) => {
    const id = rid(); const x = 10 + Math.random() * 80
    setFloats(f => [...f, { id, emoji, x }])
    setTimeout(() => setFloats(f => f.filter(z => z.id !== id)), 2600)
  }
  const react = (emoji: string) => { spawnFloat(emoji); roomRef.current?.send('reaction', { emoji }) }
  const sendChat = () => {
    const text = chatText.trim(); if (!text) return
    setChat(c => [...c.slice(-40), { id: rid(), from: me.id, name: me.name, text }])
    roomRef.current?.send('chat', { name: me.name, text })
    setChatText('')
  }

  const inviteUrl = `https://games.kasuku.tz/play?room=${code}&live=1&from=${encodeURIComponent(me.name)}&u=${encodeURIComponent(me.handle)}`
  const share = async () => {
    const msg = `Join me for a LIVE game on KasukuGames! 🎮 Room ${code}\n${inviteUrl}`
    try {
      if (navigator.share) { await navigator.share({ title: 'KasukuGames Live', text: msg, url: inviteUrl }); return }
    } catch { /* fall through to copy */ }
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me for a LIVE game on KasukuGames! 🎮\n${inviteUrl}`)}`, '_blank')

  const seatColor = (id: string) => SEAT_COLORS[Math.max(0, orderIds.indexOf(id)) % SEAT_COLORS.length]
  const Avatar = ({ p, size = 44 }: { p: LivePlayer; size?: number }) => (
    p.photoUrl
      ? <img src={p.photoUrl} alt={p.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${seatColor(p.id)}` }} />
      : <div style={{ width: size, height: size, borderRadius: '50%', background: seatColor(p.id) + '22', border: `2px solid ${seatColor(p.id)}`, display: 'grid', placeItems: 'center', fontSize: size * 0.5 }}>{p.avatar || '🎮'}</div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, color: C.text, zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {/* floating reactions */}
      {floats.map(f => (
        <div key={f.id} style={{ position: 'absolute', left: `${f.x}%`, bottom: 80, fontSize: 40, pointerEvents: 'none', animation: 'kgfloat 2.5s ease-out forwards', zIndex: 50 }}>{f.emoji}</div>
      ))}
      <style>{`@keyframes kgfloat{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translateY(-320px) scale(1.4)}}
        @keyframes kgpulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setShowLeave(true)} style={ghost}>← Exit</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>LIVE ROOM</div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 3 }}>{code}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: status === 'connected' ? C.green : C.amber }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'connected' ? C.green : C.amber, animation: status !== 'connected' ? 'kgpulse 1s infinite' : 'none' }} />
          {status === 'connected' ? `${players.length} online` : status === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
        </div>
      </div>

      {/* scoreboard strip (shown once anyone has points) */}
      {g.scores && Object.keys(g.scores).length > 0 && g.screen !== 'lobby' && g.screen !== 'menu' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
          {[...players].map(p => ({ p, sc: g.scores![p.id] || 0 })).sort((a, b) => b.sc - a.sc).map(({ p, sc }, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '3px 10px 3px 4px', borderRadius: 999, background: i === 0 && sc > 0 ? C.amber + '22' : C.bg, border: `1px solid ${i === 0 && sc > 0 ? C.amber : C.border}` }}>
              {i === 0 && sc > 0 && <span style={{ fontSize: 12 }}>👑</span>}
              <Avatar p={p} size={22} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{p.id === me.id ? 'You' : p.name.split(' ')[0]}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.amber }}>{sc}</span>
            </div>
          ))}
        </div>
      )}

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column' }}>
        {g.screen === 'lobby' && (
          <Lobby players={players} me={me} isHost={amHost} onStart={launchInitial} onShare={share} onWhatsApp={shareWhatsApp} copied={copied} Avatar={Avatar} initialGame={initialGame} />
        )}
        {g.screen === 'menu' && (
          <Menu isHost={amHost} onSpinStart={() => { if (amHost) pushState({ screen: 'spin', spinAngle: 0, spinning: false }) }} onTod={() => { if (amHost) beginTod() }} onNhie={() => { if (amHost) startNhie() }} onWyr={() => { if (amHost) startChoice('wyr') }} onTot={() => { if (amHost) startChoice('tot') }} onTrivia={() => { if (amHost) startTrivia('Mixed') }} onMlt={() => { if (amHost) startMlt() }} onRps={() => { if (amHost) startRps() }} onHot={() => { if (amHost) startHot() }} onGma={() => { if (amHost) startGma() }} onTtl={() => { if (amHost) startTtl() }} onWc={() => { if (amHost) startWc() }} onEr={() => { if (amHost) startEr() }} onStory={() => { if (amHost) startStory() }} onFinish={onFinish} scores={g.scores} />
        )}
        {g.screen === 'spin' && (
          <SpinView g={g} players={players} me={me} isHost={amHost} onSpin={onSpin} onToTod={onToTod} onBack={onBackMenu} seatColor={seatColor} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'tod' && (
          <TodView g={g} me={me} isHost={amHost} nameOf={nameOf} onPickKind={onPickKind} onSendPrompt={onSendPrompt} onDone={onDoneTurn} onBack={onBackMenu} />
        )}
        {g.screen === 'nhie' && (
          <NhieView g={g} me={me} players={players} isHost={amHost} onVote={onVote} onReveal={onReveal} onNext={onNextNhie} onCat={onNhieCat} onBack={onBackMenu} Avatar={Avatar} />
        )}
        {g.screen === 'choice' && (
          <ChoiceView g={g} me={me} players={players} isHost={amHost} onVote={onChoiceVote} onReveal={onChoiceReveal} onNext={onChoiceNext} onCat={onChoiceCat} onBack={onBackMenu} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'trivia' && (
          <TriviaView g={g} me={me} players={players} isHost={amHost} onVote={onTriviaVote} onReveal={onTriviaReveal} onNext={onTriviaNext} onCat={onTriviaCat} onBack={onBackMenu} />
        )}
        {g.screen === 'mlt' && (
          <MltView g={g} me={me} players={players} isHost={amHost} onVote={onMltVote} onReveal={onMltReveal} onNext={onMltNext} onBack={onBackMenu} seatColor={seatColor} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'rps' && (
          <RpsView g={g} me={me} players={players} isHost={amHost} onPick={onRpsPick} onReveal={onRpsReveal} onNext={onRpsNext} onBack={onBackMenu} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'hot' && (
          <HotView g={g} me={me} players={players} isHost={amHost} onVote={onHotVote} onReveal={onHotReveal} onNext={onHotNext} onBack={onBackMenu} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'gma' && (
          <GmaView g={g} me={me} players={players} isHost={amHost} onAnswer={onGmaAnswer} onGuess={onGmaGuess} onReveal={onGmaReveal} onNext={onGmaNext} onBack={onBackMenu} nameOf={nameOf} />
        )}
        {g.screen === 'ttl' && (
          <TtlView g={g} me={me} players={players} isHost={amHost} onSubmit={onTtlSubmit} onGuess={onTtlGuess} onReveal={onTtlReveal} onNext={onTtlNext} onBack={onBackMenu} nameOf={nameOf} />
        )}
        {g.screen === 'wc' && (
          <WcView g={g} me={me} isHost={amHost} onSubmit={onWcSubmit} onBack={onBackMenu} nameOf={nameOf} />
        )}
        {g.screen === 'er' && (
          <ErView g={g} me={me} players={players} isHost={amHost} onGuess={onErGuess} onReveal={onErReveal} onNext={onErNext} onBack={onBackMenu} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'story' && (
          <StoryView g={g} me={me} isHost={amHost} onLine={onStoryLine} onEnd={onStoryEnd} onBack={onBackMenu} nameOf={nameOf} />
        )}
        {g.screen === 'results' && (
          <ResultsView g={g} me={me} players={players} isHost={amHost} onPlayOn={onBackMenu} onReset={onResetScores} Avatar={Avatar} nameOf={nameOf} />
        )}
      </div>

      {/* reactions + chat bar */}
      <div style={{ borderTop: `1px solid ${C.border}`, background: C.card, padding: '8px 12px' }}>
        {chatOpen && (
          <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chat.length === 0 && <div style={{ color: C.dim, fontSize: 12, textAlign: 'center' }}>Say something 💬</div>}
            {chat.map(m => <div key={m.id} style={{ fontSize: 13 }}><b style={{ color: m.from === me.id ? C.teal : C.pink }}>{m.name}:</b> {m.text}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
            {REACTIONS.map(e => <button key={e} onClick={() => react(e)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 2 }}>{e}</button>)}
          </div>
          <button onClick={() => setChatOpen(o => !o)} style={{ ...ghost, padding: '6px 10px' }}>{chatOpen ? '▾' : '💬'}</button>
        </div>
        {chatOpen && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={chatText} onChange={e => setChatText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Message…" style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '8px 12px', fontSize: 14, outline: 'none' }} />
            <button onClick={sendChat} style={solidBtn(C.teal)}>Send</button>
          </div>
        )}
      </div>

      {/* leave confirm — never drop out of a room by accident */}
      {showLeave && (() => {
        const others = players.filter((p: LivePlayer) => p.id !== me.id)
        const alone = others.length === 0
        return (
          <div onClick={() => setShowLeave(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 300 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24, maxWidth: 360, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 34, textAlign: 'center', marginBottom: 6 }}>🔴</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: 6 }}>Leave this live room?</div>
              <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 20 }}>
                {alone
                  ? "You're the last one here. Keep the room to continue later, or close it for good."
                  : `${others[0].name}${others.length > 1 ? ` and ${others.length - 1} more` : ''} still here. Keep the room and you can rejoin anytime.`}
              </div>
              <button onClick={keepAndExit} style={{ ...solidBtn(C.teal), width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginBottom: 10 }}>
                Keep room — rejoin later
              </button>
              <button onClick={closeAndExit} style={{ width: '100%', padding: '13px', borderRadius: RADIUS.md, background: 'none', border: `1px solid ${C.red}55`, color: C.red, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
                {alone ? 'Close room' : 'Leave & close room'}
              </button>
              <button onClick={() => setShowLeave(false)} style={{ ...ghost, width: '100%', justifyContent: 'center', padding: '11px' }}>Stay in room</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ── sub-views ── */
function Lobby({ players, me, isHost, onStart, onShare, onWhatsApp, copied, Avatar, initialGame }: any) {
  const others = players.filter((p: LivePlayer) => p.id !== me.id)
  const gm = LIVE_GAMES.find(x => x.id === initialGame)
  const startLabel = gm && gm.id !== 'party' ? `Start ${gm.name} ${gm.emoji}` : 'Start playing →'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 22 }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{isHost ? 'Your Live Room' : 'You joined!'}</div>
        <div style={{ color: C.muted, marginTop: 6 }}>{isHost ? 'Share the room, wait for them to join, then start.' : 'Waiting for the host to start the game…'}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {players.map((p: LivePlayer) => (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Avatar p={p} size={64} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.id === me.id ? 'You' : p.name}</div>
          </div>
        ))}
        {others.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.5 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px dashed ${C.dim}`, display: 'grid', placeItems: 'center', animation: 'kgpulse 1.4s infinite' }}>⏳</div>
            <div style={{ fontSize: 12, color: C.muted }}>Waiting…</div>
          </div>
        )}
      </div>
      {isHost && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onShare} style={{ ...solidBtn(C.blue), flex: 1 }}>{copied ? 'Copied ✓' : 'Share link'}</button>
            <button onClick={onWhatsApp} style={{ ...solidBtn(C.green), flex: 1 }}>WhatsApp</button>
          </div>
          <button onClick={onStart} disabled={players.length < 2} style={{ ...solidBtn(players.length < 2 ? C.dim : C.pink), opacity: players.length < 2 ? 0.6 : 1, padding: '14px', fontSize: 16 }}>
            {players.length < 2 ? 'Waiting for a player…' : startLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function Menu({ isHost, onSpinStart, onTod, onNhie, onWyr, onTot, onTrivia, onMlt, onRps, onHot, onGma, onTtl, onWc, onEr, onStory, onFinish, scores }: any) {
  const items = [
    { key: 'trivia', label: 'Trivia Duel', emoji: '🧠', color: C.green, fn: onTrivia },
    { key: 'ttl', label: 'Two Truths & a Lie', emoji: '🕵️', color: C.teal, fn: onTtl },
    { key: 'gma', label: 'Guess My Answer', emoji: '💘', color: C.pink, fn: onGma },
    { key: 'story', label: 'Story Builder', emoji: '📖', color: C.blue, fn: onStory },
    { key: 'er', label: 'Emoji Riddle', emoji: '🧩', color: C.purple, fn: onEr },
    { key: 'wc', label: 'Word Chain', emoji: '🔗', color: C.green, fn: onWc },
    { key: 'spin', label: 'Spin the Bottle', emoji: '🍾', color: C.pink, fn: onSpinStart },
    { key: 'tod', label: 'Truth or Dare', emoji: '🎯', color: C.purple, fn: onTod },
    { key: 'nhie', label: 'Never Have I Ever', emoji: '🙈', color: C.teal, fn: onNhie },
    { key: 'wyr', label: 'Would You Rather', emoji: '🤔', color: C.blue, fn: onWyr },
    { key: 'tot', label: 'This or That — do you match?', emoji: '💞', color: C.orange, fn: onTot },
    { key: 'hot', label: 'Hot Takes', emoji: '🌶️', color: C.red, fn: onHot },
    { key: 'mlt', label: 'Most Likely To', emoji: '👉', color: C.amber, fn: onMlt },
    { key: 'rps', label: 'Rock Paper Scissors', emoji: '✊', color: C.red, fn: onRps },
  ]
  const hasScores = scores && Object.keys(scores).length > 0
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ textAlign: 'center', color: C.muted, marginBottom: 4 }}>{isHost ? 'Pick a game — you both play it live' : 'Host is choosing a game…'}</div>
      {items.map(it => (
        <button key={it.key} onClick={() => isHost && it.fn()} disabled={!isHost} style={{ display: 'flex', alignItems: 'center', gap: 16, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${it.color}`, borderRadius: RADIUS.lg, padding: '16px 20px', color: C.text, fontSize: 17, fontWeight: 700, cursor: isHost ? 'pointer' : 'default', opacity: isHost ? 1 : 0.6, textAlign: 'left', transition: `all ${MOTION.fast}` }}>
          <span style={{ fontSize: 28 }}>{it.emoji}</span> {it.label}
        </button>
      ))}
      {isHost && hasScores && (
        <button onClick={onFinish} style={{ ...solidBtn(C.amber), padding: '14px', fontSize: 15, marginTop: 4 }}>🏁 Finish &amp; crown the winner</button>
      )}
    </div>
  )
}

function SpinView({ g, players, me, isHost, onSpin, onToTod, onBack, seatColor, Avatar, nameOf }: any) {
  const n = players.length
  const R = 120
  const landed = g.landedId
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ position: 'relative', width: 300, height: 300 }}>
        {players.map((p: LivePlayer, i: number) => {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2
          const x = 150 + R * Math.cos(a) - 26, y = 150 + R * Math.sin(a) - 26
          const isLanded = landed === p.id
          return (
            <div key={p.id} style={{ position: 'absolute', left: x, top: y, transform: isLanded ? 'scale(1.25)' : 'scale(1)', transition: 'transform .3s', filter: landed && !isLanded ? 'grayscale(.7) opacity(.5)' : 'none' }}>
              <Avatar p={p} size={52} />
              {isLanded && <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: seatColor(p.id) }}>{p.id === me.id ? 'YOU' : p.name}</div>}
            </div>
          )
        })}
        {/* bottle */}
        <div style={{ position: 'absolute', left: 150, top: 150, width: 0, height: 0, transform: `translate(-50%,-50%) rotate(${g.spinAngle || 0}deg)`, transition: g.spinning ? 'transform 3.2s cubic-bezier(.17,.67,.3,1)' : 'none' }}>
          <div style={{ position: 'absolute', left: -8, top: -96, width: 16, height: 96, background: C.amber, borderRadius: 8, boxShadow: `0 0 12px ${C.amber}` }} />
          <div style={{ position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%', background: C.card2, border: `2px solid ${C.amber}` }} />
        </div>
      </div>
      {landed ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>🍾 It landed on {landed === me.id ? 'you!' : nameOf(landed)}</div>
          {isHost ? <button onClick={onToTod} style={solidBtn(C.purple)}>Truth or Dare →</button> : <div style={{ color: C.muted }}>Host will continue…</div>}
        </div>
      ) : (
        <button onClick={onSpin} disabled={g.spinning} style={{ ...solidBtn(C.pink), padding: '14px 40px', fontSize: 18, opacity: g.spinning ? 0.6 : 1 }}>{g.spinning ? 'Spinning…' : 'SPIN 🍾'}</button>
      )}
    </div>
  )
}

function TodView({ g, me, isHost, nameOf, onPickKind, onSendPrompt, onDone, onBack }: any) {
  const [custom, setCustom] = useState('')
  const [tcat, setTcat] = useState<string>('Couple')
  const iAmAsker = g.askerId === me.id
  const iAmTarget = g.targetId === me.id
  const bank = g.kind === 'truth' ? TRUTHS_BY_CAT : g.kind === 'dare' ? DARES_BY_CAT : {}
  const presets = bank[tcat] || bank.Mild || []
  useEffect(() => { setCustom('') }, [g.kind, g.askerId])
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: C.muted }}>{iAmAsker ? 'Your turn to ask' : `${nameOf(g.askerId)} is asking`}</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{iAmTarget ? '💌 It’s for YOU' : `For ${nameOf(g.targetId)}`}</div>
      </div>

      {!g.prompt && !g.kind && (
        iAmAsker ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button onClick={() => onPickKind('truth')} style={{ ...solidBtn(C.blue), flex: 1, padding: 20, fontSize: 18 }}>Truth 💭</button>
            <button onClick={() => onPickKind('dare')} style={{ ...solidBtn(C.pink), flex: 1, padding: 20, fontSize: 18 }}>Dare 🔥</button>
          </div>
        ) : <div style={{ textAlign: 'center', color: C.muted, marginTop: 20, animation: 'kgpulse 1.4s infinite' }}>Waiting for {nameOf(g.askerId)} to choose…</div>
      )}

      {!g.prompt && g.kind && iAmAsker && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {TOD_CATS.map(c => (
              <button key={c} onClick={() => setTcat(c)} style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tcat === c ? (c === 'Spicy' ? C.red : C.purple) : 'transparent', color: tcat === c ? '#fff' : C.muted, border: `1px solid ${tcat === c ? (c === 'Spicy' ? C.red : C.purple) : C.border}` }}>{c === 'Spicy' ? '🌶️ ' : ''}{c}</button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>Pick one for {nameOf(g.targetId)}, or write your own:</div>
          {presets.slice(0, 6).map((p: string, i: number) => (
            <button key={i} onClick={() => onSendPrompt(p)} style={{ textAlign: 'left', background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '12px 14px', color: C.text, fontSize: 14, cursor: 'pointer' }}>{p}</button>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input value={custom} onChange={e => setCustom(e.target.value)} placeholder={`Write your own ${g.kind}…`} style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
            <button onClick={() => custom.trim() && onSendPrompt(custom.trim())} style={solidBtn(C.teal)}>Send</button>
          </div>
        </div>
      )}
      {!g.prompt && g.kind && !iAmAsker && (
        <div style={{ textAlign: 'center', color: C.muted, marginTop: 20, animation: 'kgpulse 1.4s infinite' }}>{nameOf(g.askerId)} is writing a {g.kind}…</div>
      )}

      {g.prompt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{g.kind}</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 24, fontSize: 20, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>{g.prompt}</div>
          {iAmTarget && <div style={{ color: C.pink, fontWeight: 700 }}>Your move 💫</div>}
          {(iAmTarget || iAmAsker || isHost) && (
            <button onClick={onDone} style={{ ...solidBtn(C.green), padding: '12px 32px' }}>Done ✓ — next turn</button>
          )}
        </div>
      )}
    </div>
  )
}

function NhieView({ g, me, players, isHost, onVote, onReveal, onNext, onCat, onBack, Avatar }: any) {
  const votes = g.nhieVotes || {}
  const myVote = votes[me.id]
  const allVoted = players.length > 0 && players.every((p: LivePlayer) => votes[p.id])
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      {isHost && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {NHIE_CATS.map(c => (
            <button key={c} onClick={() => onCat(c)} style={{ padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: (g.nhieCat || 'Party') === c ? (c === 'Spicy' ? C.red : C.teal) : 'transparent', color: (g.nhieCat || 'Party') === c ? '#fff' : C.muted, border: `1px solid ${(g.nhieCat || 'Party') === c ? (c === 'Spicy' ? C.red : C.teal) : C.border}` }}>{c === 'Spicy' ? '🌶️ ' : ''}{c}</button>
          ))}
        </div>
      )}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 22, fontSize: 20, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>{g.nhiePrompt}</div>

      {!g.nhieRevealed ? (
        <>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onVote('have')} style={{ ...solidBtn(myVote === 'have' ? C.pink : C.card2), flex: 1, padding: 18, fontSize: 16, border: myVote === 'have' ? `2px solid ${C.pink}` : `1px solid ${C.border}` }}>I have 🙋</button>
            <button onClick={() => onVote('never')} style={{ ...solidBtn(myVote === 'never' ? C.blue : C.card2), flex: 1, padding: 18, fontSize: 16, border: myVote === 'never' ? `2px solid ${C.blue}` : `1px solid ${C.border}` }}>Never 🙅</button>
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(votes).length}/{players.length} answered</div>
          {isHost && <button onClick={onReveal} disabled={Object.keys(votes).length === 0} style={{ ...solidBtn(allVoted ? C.amber : C.dim), opacity: Object.keys(votes).length === 0 ? 0.5 : 1 }}>Reveal 👀</button>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p: LivePlayer) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '10px 14px' }}>
                <Avatar p={p} size={36} />
                <div style={{ flex: 1, fontWeight: 600 }}>{p.id === me.id ? 'You' : p.name}</div>
                <div style={{ fontWeight: 700, color: votes[p.id] === 'have' ? C.pink : C.blue }}>{votes[p.id] === 'have' ? 'I have 🙋' : votes[p.id] === 'never' ? 'Never 🙅' : '—'}</div>
              </div>
            ))}
          </div>
          {isHost && <button onClick={onNext} style={solidBtn(C.teal)}>Next one →</button>}
          {!isHost && <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next one…</div>}
        </>
      )}
    </div>
  )
}

function ChoiceView({ g, me, players, isHost, onVote, onReveal, onNext, onCat, onBack, Avatar, nameOf }: any) {
  const votes = g.choiceVotes || {}
  const myVote = votes[me.id]
  const p = g.choicePrompt || { a: '', b: '' }
  const isWyr = g.choiceKind === 'wyr'
  const matched = g.choiceKind === 'tot' && players.length === 2 && players.every((pl: LivePlayer) => votes[pl.id]) &&
    votes[players[0].id] === votes[players[1].id]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      {isWyr && isHost && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {WYR_CATS.map(c => (
            <button key={c} onClick={() => onCat(c)} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: (g.choiceCat || 'Couple') === c ? (c === 'Spicy' ? C.red : C.blue) : 'transparent', color: (g.choiceCat || 'Couple') === c ? '#fff' : C.muted, border: `1px solid ${(g.choiceCat || 'Couple') === c ? (c === 'Spicy' ? C.red : C.blue) : C.border}` }}>{c === 'Spicy' ? '🌶️ ' : ''}{c}</button>
          ))}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{isWyr ? 'Would you rather…' : 'This or that — do you match?'}</div>

      {!g.choiceRevealed ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['a', 'b'] as const).map((k, i) => (
              <button key={k} onClick={() => onVote(k)} style={{
                background: myVote === k ? (i === 0 ? C.blue : C.orange) : C.card,
                border: myVote === k ? `2px solid ${i === 0 ? C.blue : C.orange}` : `1px solid ${C.border}`,
                borderRadius: RADIUS.lg, padding: '22px 20px', color: C.text, fontSize: 18, fontWeight: 700, cursor: 'pointer', textAlign: 'center', transition: `all ${MOTION.fast}`,
              }}>{p[k]}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(votes).length}/{players.length} answered</div>
          {isHost && <button onClick={onReveal} disabled={Object.keys(votes).length === 0} style={{ ...solidBtn(Object.keys(votes).length ? C.amber : C.dim), opacity: Object.keys(votes).length ? 1 : 0.5 }}>Reveal 👀</button>}
          {!isHost && <div style={{ textAlign: 'center', color: C.dim, fontSize: 12 }}>Host reveals when everyone's in</div>}
        </>
      ) : (
        <>
          {g.choiceKind === 'tot' && players.length === 2 && (
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: matched ? C.pink : C.blue }}>{matched ? 'You match! 💞' : 'Opposites attract 😄'}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((pl: LivePlayer) => (
              <div key={pl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '10px 14px' }}>
                <Avatar p={pl} size={34} />
                <div style={{ flex: 1, fontWeight: 600 }}>{pl.id === me.id ? 'You' : (nameOf?.(pl.id) || pl.name)}</div>
                <div style={{ fontWeight: 700, color: votes[pl.id] === 'a' ? C.blue : C.orange }}>{votes[pl.id] ? p[votes[pl.id] as 'a' | 'b'] : '—'}</div>
              </div>
            ))}
          </div>
          {isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next one →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next one…</div>}
        </>
      )}
    </div>
  )
}

const TRIVIA_PICK_CATS = ['Mixed', 'Tanzania', 'General', 'Science', 'Faith', 'Sport']
function TriviaView({ g, me, players, isHost, onVote, onReveal, onNext, onCat, onBack }: any) {
  const q = g.triviaQ || { q: '', options: [], answer: -1, cat: '' }
  const votes = g.triviaVotes || {}
  const myVote = votes[me.id]
  const answered = Object.keys(votes).length
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      {isHost && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {TRIVIA_PICK_CATS.map(c => (
            <button key={c} onClick={() => onCat(c)} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: (g.triviaCat || 'Mixed') === c ? C.green : 'transparent', color: (g.triviaCat || 'Mixed') === c ? '#fff' : C.muted, border: `1px solid ${(g.triviaCat || 'Mixed') === c ? C.green : C.border}` }}>{c}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>🧠 Trivia · {q.cat}</span>
        <span style={{ fontSize: 11, color: C.muted }}>Round {g.triviaRound || 1}</span>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 20, fontSize: 18, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>{q.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((opt: string, i: number) => {
          const chosen = myVote === i
          const correct = g.triviaRevealed && i === q.answer
          const wrongPick = g.triviaRevealed && chosen && i !== q.answer
          const bg = correct ? C.green : wrongPick ? C.red : chosen ? C.blue : C.card2
          return (
            <button key={i} disabled={g.triviaRevealed || myVote !== undefined} onClick={() => onVote(i)} style={{
              background: bg, border: `1px solid ${correct ? C.green : wrongPick ? C.red : chosen ? C.blue : C.border}`, borderRadius: RADIUS.md, padding: '14px 16px', color: C.text, fontSize: 15, fontWeight: 600, textAlign: 'left',
              cursor: (g.triviaRevealed || myVote !== undefined) ? 'default' : 'pointer', opacity: (g.triviaRevealed && !correct && !chosen) ? 0.55 : 1,
            }}>{String.fromCharCode(65 + i)}. {opt}{correct ? '  ✓' : ''}</button>
          )
        })}
      </div>
      {!g.triviaRevealed ? (
        <>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{answered}/{players.length} answered{myVote !== undefined ? ' · locked in ✓' : ''}</div>
          {isHost && <button onClick={onReveal} disabled={!answered} style={{ ...solidBtn(answered ? C.amber : C.dim), opacity: answered ? 1 : 0.5 }}>Reveal answer 👀</button>}
        </>
      ) : (
        isHost ? <button onClick={onNext} style={solidBtn(C.green)}>Next question →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next question…</div>
      )}
    </div>
  )
}

function MltView({ g, me, players, isHost, onVote, onReveal, onNext, onBack, Avatar, nameOf }: any) {
  const votes = g.mltVotes || {}
  const myVote = votes[me.id]
  const tally: Record<string, number> = {}
  for (const t of Object.values(votes)) tally[t as string] = (tally[t as string] || 0) + 1
  const maxV = Math.max(0, ...Object.values(tally))
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>👉 Most likely to</div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{g.mltPrompt}?</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map((p: LivePlayer) => {
          const chosen = myVote === p.id
          const count = tally[p.id] || 0
          const isTop = g.mltRevealed && count > 0 && count === maxV
          return (
            <button key={p.id} disabled={g.mltRevealed || myVote !== undefined} onClick={() => onVote(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isTop ? C.amber + '22' : chosen ? C.blue + '22' : C.card, border: `1px solid ${isTop ? C.amber : chosen ? C.blue : C.border}`, borderRadius: RADIUS.md, padding: '10px 14px', cursor: (g.mltRevealed || myVote !== undefined) ? 'default' : 'pointer', color: C.text }}>
              <Avatar p={p} size={34} />
              <div style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{p.id === me.id ? 'You' : (nameOf?.(p.id) || p.name)}</div>
              {g.mltRevealed && <span style={{ fontWeight: 800, color: isTop ? C.amber : C.muted }}>{count} {count === 1 ? 'vote' : 'votes'}{isTop ? ' 👑' : ''}</span>}
            </button>
          )
        })}
      </div>
      {!g.mltRevealed ? (
        <>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(votes).length}/{players.length} voted</div>
          {isHost && <button onClick={onReveal} disabled={!Object.keys(votes).length} style={{ ...solidBtn(Object.keys(votes).length ? C.amber : C.dim), opacity: Object.keys(votes).length ? 1 : 0.5 }}>Reveal 👀</button>}
        </>
      ) : (isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next one →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next one…</div>)}
    </div>
  )
}

function RpsView({ g, me, players, isHost, onPick, onReveal, onNext, onBack, Avatar, nameOf }: any) {
  const picks = g.rpsPicks || {}
  const myPick = picks[me.id]
  const allPicked = players.length > 0 && players.every((p: LivePlayer) => picks[p.id])
  const ICON: Record<string, string> = { r: '✊', p: '✋', s: '✌️' }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>✊ Rock · Paper · Scissors — Round {g.rpsRound || 1}</div>
      {!g.rpsRevealed ? (
        <>
          <div style={{ textAlign: 'center', fontSize: 16, color: C.text }}>{myPick ? 'Locked in — waiting for others…' : 'Make your move'}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {(['r', 'p', 's'] as const).map(k => (
              <button key={k} disabled={!!myPick} onClick={() => onPick(k)} style={{ width: 90, height: 90, borderRadius: RADIUS.lg, fontSize: 38, background: myPick === k ? C.blue : C.card, border: `2px solid ${myPick === k ? C.blue : C.border}`, cursor: myPick ? 'default' : 'pointer', opacity: myPick && myPick !== k ? 0.5 : 1 }}>{ICON[k]}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(picks).length}/{players.length} ready</div>
          {isHost && <button onClick={onReveal} disabled={!Object.keys(picks).length} style={{ ...solidBtn(allPicked ? C.amber : C.dim), opacity: Object.keys(picks).length ? 1 : 0.5 }}>Reveal 👊</button>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p: LivePlayer) => {
              const wins = (g.rpsWins || {})[p.id] || 0
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '10px 14px' }}>
                  <Avatar p={p} size={34} />
                  <div style={{ flex: 1, fontWeight: 600 }}>{p.id === me.id ? 'You' : (nameOf?.(p.id) || p.name)}</div>
                  <span style={{ fontSize: 24 }}>{ICON[picks[p.id]] || '—'}</span>
                  <span style={{ fontSize: 12, color: C.amber, fontWeight: 700, width: 54, textAlign: 'right' }}>{wins} {wins === 1 ? 'win' : 'wins'}</span>
                </div>
              )
            })}
          </div>
          {isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next round →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will start the next round…</div>}
        </>
      )}
    </div>
  )
}

function HotView({ g, me, players, isHost, onVote, onReveal, onNext, onBack, Avatar, nameOf }: any) {
  const votes = g.hotVotes || {}
  const myVote = votes[me.id]
  const agree = Object.values(votes).filter(v => v === 'agree').length
  const disagree = Object.values(votes).filter(v => v === 'disagree').length
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>🌶️ Hot take</div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 24, fontSize: 20, fontWeight: 700, textAlign: 'center', lineHeight: 1.4 }}>{g.hotPrompt}</div>
      {!g.hotRevealed ? (
        <>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onVote('agree')} disabled={myVote !== undefined} style={{ ...solidBtn(myVote === 'agree' ? C.green : C.card2), flex: 1, padding: 18, fontSize: 16, border: myVote === 'agree' ? `2px solid ${C.green}` : `1px solid ${C.border}` }}>Agree 👍</button>
            <button onClick={() => onVote('disagree')} disabled={myVote !== undefined} style={{ ...solidBtn(myVote === 'disagree' ? C.red : C.card2), flex: 1, padding: 18, fontSize: 16, border: myVote === 'disagree' ? `2px solid ${C.red}` : `1px solid ${C.border}` }}>Disagree 👎</button>
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(votes).length}/{players.length} answered</div>
          {isHost && <button onClick={onReveal} disabled={!Object.keys(votes).length} style={{ ...solidBtn(Object.keys(votes).length ? C.amber : C.dim), opacity: Object.keys(votes).length ? 1 : 0.5 }}>Reveal 👀</button>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
            <div style={{ flex: 1, background: C.green + '18', border: `1px solid ${C.green}`, borderRadius: RADIUS.md, padding: 14 }}><div style={{ fontSize: 26, fontWeight: 800, color: C.green }}>{agree}</div><div style={{ fontSize: 12, color: C.muted }}>Agree</div></div>
            <div style={{ flex: 1, background: C.red + '18', border: `1px solid ${C.red}`, borderRadius: RADIUS.md, padding: 14 }}><div style={{ fontSize: 26, fontWeight: 800, color: C.red }}>{disagree}</div><div style={{ fontSize: 12, color: C.muted }}>Disagree</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {players.map((p: LivePlayer) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '8px 12px' }}>
                <Avatar p={p} size={30} />
                <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{p.id === me.id ? 'You' : (nameOf?.(p.id) || p.name)}</div>
                <span style={{ fontWeight: 700 }}>{votes[p.id] === 'agree' ? '👍' : votes[p.id] === 'disagree' ? '👎' : '—'}</span>
              </div>
            ))}
          </div>
          {isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next take →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next one…</div>}
        </>
      )}
    </div>
  )
}

function GmaView({ g, me, players, isHost, onAnswer, onGuess, onReveal, onNext, onBack, nameOf }: any) {
  const subj = g.gmaSubject
  const iAmSubject = subj === me.id
  const q = g.gmaQ || { q: '', options: [] }
  const guesses = g.gmaGuesses || {}
  const myGuess = guesses[me.id]
  const subjName = iAmSubject ? 'You' : (nameOf?.(subj) || 'Someone')
  const guessers = players.filter((p: LivePlayer) => p.id !== subj)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>💘 Guess {subjName === 'You' ? 'your' : subjName + "'s"} answer</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{q.q}</div>
      </div>
      {g.gmaPhase === 'answer' ? (
        iAmSubject ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>Pick YOUR real answer (secret):</div>
            {q.options.map((o: string, i: number) => <button key={i} onClick={() => onAnswer(i)} style={{ ...solidBtn(C.card2), padding: '14px 16px', textAlign: 'left', border: `1px solid ${C.border}` }}>{o}</button>)}
          </div>
        ) : <div style={{ textAlign: 'center', color: C.muted, marginTop: 20, animation: 'kgpulse 1.4s infinite' }}>{subjName} is choosing their answer…</div>
      ) : (
        <>
          {iAmSubject ? (
            <div style={{ textAlign: 'center', color: C.muted, marginTop: 6 }}>You answered secretly. Let's see who knows you…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>What did {subjName} pick?</div>
              {q.options.map((o: string, i: number) => {
                const chosen = myGuess === i
                const correct = g.gmaRevealed && i === g.gmaPick
                const wrong = g.gmaRevealed && chosen && i !== g.gmaPick
                return <button key={i} disabled={g.gmaRevealed || myGuess !== undefined} onClick={() => onGuess(i)} style={{ background: correct ? C.green : wrong ? C.red : chosen ? C.blue : C.card2, border: `1px solid ${correct ? C.green : wrong ? C.red : chosen ? C.blue : C.border}`, borderRadius: RADIUS.md, padding: '14px 16px', color: C.text, fontSize: 15, fontWeight: 600, textAlign: 'left', cursor: (g.gmaRevealed || myGuess !== undefined) ? 'default' : 'pointer', opacity: (g.gmaRevealed && !correct && !chosen) ? 0.55 : 1 }}>{o}{correct ? '  ✓' : ''}</button>
              })}
            </div>
          )}
          {g.gmaRevealed && <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: C.pink }}>{subjName} picked “{q.options[g.gmaPick]}”</div>}
          {!g.gmaRevealed ? (
            <>
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(guesses).length}/{guessers.length} guessed</div>
              {isHost && <button onClick={onReveal} disabled={!Object.keys(guesses).length} style={{ ...solidBtn(Object.keys(guesses).length ? C.amber : C.dim), opacity: Object.keys(guesses).length ? 1 : 0.5 }}>Reveal 👀</button>}
            </>
          ) : (isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next person →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host continues…</div>)}
        </>
      )}
    </div>
  )
}

function TtlView({ g, me, players, isHost, onSubmit, onGuess, onReveal, onNext, onBack, nameOf }: any) {
  const asker = g.ttlAsker
  const iAmAsker = asker === me.id
  const askerName = iAmAsker ? 'You' : (nameOf?.(asker) || 'Someone')
  const [s0, setS0] = useState(''); const [s1, setS1] = useState(''); const [s2, setS2] = useState(''); const [lie, setLie] = useState<number | null>(null)
  useEffect(() => { setS0(''); setS1(''); setS2(''); setLie(null) }, [g.ttlAsker])
  const guesses = g.ttlGuesses || {}
  const myGuess = guesses[me.id]
  const guessers = players.filter((p: LivePlayer) => p.id !== asker)
  const ready = s0.trim() && s1.trim() && s2.trim() && lie !== null
  const setters: Array<[string, (v: string) => void]> = [[s0, setS0], [s1, setS1], [s2, setS2]]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>🕵️ Two Truths &amp; a Lie — {askerName}</div>
      {g.ttlPhase === 'write' ? (
        iAmAsker ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, color: C.muted }}>Write 3 statements about you — 2 true, 1 lie. Tap ⚑ on your lie.</div>
            {setters.map(([val, set], i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={val} onChange={e => set(e.target.value)} placeholder={`Statement ${i + 1}`} style={{ flex: 1, background: C.bg, border: `1px solid ${lie === i ? C.red : C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
                <button onClick={() => setLie(i)} title="This is the lie" style={{ background: lie === i ? C.red : C.card2, border: `1px solid ${lie === i ? C.red : C.border}`, borderRadius: RADIUS.md, color: '#fff', width: 42, height: 42, cursor: 'pointer', flexShrink: 0 }}>⚑</button>
              </div>
            ))}
            <button onClick={() => { if (ready) onSubmit([s0.trim(), s1.trim(), s2.trim()], lie) }} disabled={!ready} style={{ ...solidBtn(C.teal), opacity: ready ? 1 : 0.5 }}>Send to the room →</button>
          </div>
        ) : <div style={{ textAlign: 'center', color: C.muted, marginTop: 20, animation: 'kgpulse 1.4s infinite' }}>{askerName} is writing their statements…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>{iAmAsker ? 'Will they catch your lie?' : `Which is ${askerName}'s LIE?`}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(g.ttlStatements || []).map((st: string, i: number) => {
              const chosen = myGuess === i
              const isLie = g.ttlRevealed && i === g.ttlLie
              return <button key={i} disabled={iAmAsker || g.ttlRevealed || myGuess !== undefined} onClick={() => onGuess(i)} style={{ background: isLie ? C.red : chosen ? C.blue : C.card, border: `1px solid ${isLie ? C.red : chosen ? C.blue : C.border}`, borderRadius: RADIUS.md, padding: '14px 16px', color: C.text, fontSize: 15, fontWeight: 600, textAlign: 'left', cursor: (iAmAsker || g.ttlRevealed || myGuess !== undefined) ? 'default' : 'pointer', opacity: (g.ttlRevealed && !isLie && !chosen) ? 0.6 : 1 }}>{st}{isLie ? '  🤥 LIE' : ''}</button>
            })}
          </div>
          {!g.ttlRevealed ? (
            <>
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(guesses).length}/{guessers.length} guessed</div>
              {isHost && <button onClick={onReveal} disabled={!Object.keys(guesses).length} style={{ ...solidBtn(Object.keys(guesses).length ? C.amber : C.dim), opacity: Object.keys(guesses).length ? 1 : 0.5 }}>Reveal the lie 🤥</button>}
            </>
          ) : (isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next player →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host continues…</div>)}
        </>
      )}
    </div>
  )
}

function WcView({ g, me, onSubmit, onBack, nameOf }: any) {
  const words: string[] = g.wcWords || []
  const req = words.length ? words[words.length - 1].slice(-1) : ''
  const myTurn = g.wcTurnId === me.id
  const turnLabel = myTurn ? 'Your turn' : `${nameOf?.(g.wcTurnId) || 'Someone'}'s turn`
  const [word, setWord] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { setWord(''); setErr('') }, [g.wcTurnId, words.length])
  const submit = () => {
    const c = word.trim().toLowerCase()
    if (!/^[a-z]{2,}$/.test(c)) { setErr('Letters only, 2+ characters'); return }
    if (req && c[0] !== req) { setErr(`Must start with "${req.toUpperCase()}"`); return }
    if (words.some(x => x === c)) { setErr('That word is already used'); return }
    onSubmit(c); setWord('')
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>🔗 Word Chain</div>
      <div style={{ textAlign: 'center', fontSize: 15, color: C.text }}>{turnLabel} — {req ? <>next word starts with <b style={{ color: C.green, fontSize: 22 }}>{req.toUpperCase()}</b></> : 'say any word'}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxHeight: 170, overflowY: 'auto' }}>
        {words.map((w, i) => <span key={i} style={{ padding: '6px 12px', borderRadius: 999, background: C.card, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600 }}>{w}</span>)}
        {!words.length && <span style={{ color: C.dim, fontSize: 13 }}>The chain starts here…</span>}
      </div>
      {myTurn ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={word} onChange={e => { setWord(e.target.value); setErr('') }} onKeyDown={e => e.key === 'Enter' && submit()} placeholder={req ? `${req.toUpperCase()}…` : 'your word'} autoFocus style={{ flex: 1, background: C.bg, border: `1px solid ${err ? C.red : C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '12px 14px', fontSize: 16, outline: 'none' }} />
          <button onClick={submit} style={solidBtn(C.green)}>Send</button>
        </div>
      ) : <div style={{ textAlign: 'center', color: C.muted, animation: 'kgpulse 1.4s infinite' }}>Waiting for {nameOf?.(g.wcTurnId) || 'the next player'}…</div>}
      {err && <div style={{ textAlign: 'center', color: C.red, fontSize: 13 }}>{err}</div>}
      <div style={{ textAlign: 'center', fontSize: 11, color: C.dim }}>+5 points per valid word · no repeats</div>
    </div>
  )
}

function ErView({ g, me, players, isHost, onGuess, onReveal, onNext, onBack, Avatar, nameOf }: any) {
  const riddle = g.erRiddle || { emoji: '', answer: '' }
  const solved = g.erSolved || {}
  const iSolved = solved[me.id]
  const [guess, setGuess] = useState('')
  const [feedback, setFeedback] = useState('')
  useEffect(() => { setGuess(''); setFeedback('') }, [g.erRiddle?.emoji])
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '')
  const submit = () => {
    if (!guess.trim()) return
    setFeedback(norm(guess) === norm(riddle.answer) ? '✓ Correct!' : 'Nope — try again')
    onGuess(guess); setGuess('')
  }
  const solvedCount = Object.keys(solved).length
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>🧩 Emoji Riddle — guess the phrase</div>
      <div style={{ textAlign: 'center', fontSize: 54, padding: '18px 0' }}>{riddle.emoji}</div>
      {!g.erRevealed ? (
        <>
          {!iSolved ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={guess} onChange={e => { setGuess(e.target.value); setFeedback('') }} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Type your guess…" autoFocus style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '12px 14px', fontSize: 16, outline: 'none' }} />
              <button onClick={submit} style={solidBtn(C.purple)}>Guess</button>
            </div>
          ) : <div style={{ textAlign: 'center', color: C.green, fontWeight: 700 }}>✓ You got it! Waiting for others…</div>}
          {feedback && !iSolved && <div style={{ textAlign: 'center', color: feedback.startsWith('✓') ? C.green : C.muted, fontSize: 14 }}>{feedback}</div>}
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{solvedCount}/{players.length} solved it</div>
          {isHost && <button onClick={onReveal} style={solidBtn(C.amber)}>Reveal answer 👀</button>}
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: C.pink }}>{riddle.answer}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {players.map((p: LivePlayer) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '8px 12px' }}>
                <Avatar p={p} size={30} />
                <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{p.id === me.id ? 'You' : (nameOf?.(p.id) || p.name)}</div>
                <span>{solved[p.id] ? '✅ +10' : '—'}</span>
              </div>
            ))}
          </div>
          {isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next riddle →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host continues…</div>}
        </>
      )}
    </div>
  )
}

function ResultsView({ g, me, players, isHost, onPlayOn, onReset, Avatar, nameOf }: any) {
  const ranked = [...players].map((p: LivePlayer) => ({ p, sc: (g.scores || {})[p.id] || 0 })).sort((a, b) => b.sc - a.sc)
  const winner = ranked[0]
  useEffect(() => { try { if (winner && winner.sc > 0) sfxLevelUp() } catch { /* audio blocked */ } }, [])
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <style>{`@keyframes kgpop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        @keyframes kgrain{0%{transform:translateY(-12vh) rotate(0);opacity:1}100%{transform:translateY(112vh) rotate(360deg);opacity:.85}}`}</style>
      {winner && winner.sc > 0 && Array.from({ length: 26 }).map((_, i) => (
        <div key={i} style={{ position: 'fixed', top: 0, left: `${(i * 3.9) % 100}%`, fontSize: 18 + (i % 3) * 10, pointerEvents: 'none', zIndex: 5, animation: `kgrain ${2.6 + (i % 5) * 0.5}s linear ${(i % 8) * 0.28}s infinite` }}>{['🎉', '🏆', '✨', '👑', '⭐', '💫'][i % 6]}</div>
      ))}
      <div style={{ fontSize: 14, color: C.muted, textTransform: 'uppercase', letterSpacing: 2, zIndex: 10 }}>🏁 Final results</div>
      {winner && winner.sc > 0 && (
        <div style={{ animation: 'kgpop .6s ease-out' }}>
          <div style={{ fontSize: 56 }}>👑</div>
          <Avatar p={winner.p} size={84} />
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{winner.p.id === me.id ? 'You win!' : `${nameOf?.(winner.p.id) || winner.p.name} wins!`}</div>
          <div style={{ fontSize: 16, color: C.amber, fontWeight: 700 }}>{winner.sc} points 🎉</div>
        </div>
      )}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ranked.map(({ p, sc }, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: `1px solid ${i === 0 ? C.amber : C.border}`, borderRadius: RADIUS.md, padding: '10px 14px' }}>
            <span style={{ width: 22, fontWeight: 800, color: i === 0 ? C.amber : C.muted }}>{i + 1}</span>
            <Avatar p={p} size={34} />
            <div style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{p.id === me.id ? 'You' : (nameOf?.(p.id) || p.name)}</div>
            <span style={{ fontWeight: 800, color: C.amber }}>{sc}</span>
          </div>
        ))}
      </div>
      {isHost ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onPlayOn} style={solidBtn(C.teal)}>Keep playing →</button>
          <button onClick={onReset} style={{ ...solidBtn(C.card2), border: `1px solid ${C.border}` }}>Reset scores</button>
        </div>
      ) : <div style={{ color: C.muted }}>Host decides what's next…</div>}
    </div>
  )
}

function StoryView({ g, me, isHost, onLine, onEnd, onBack, nameOf }: any) {
  const lines: string[] = g.storyLines || []
  const myTurn = g.storyTurnId === me.id
  const [line, setLine] = useState('')
  useEffect(() => { setLine('') }, [lines.length, g.storyTurnId])
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>📖 Story Builder{g.storyDone ? ' — The End 🎬' : ''}</div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 18, maxHeight: 300, overflowY: 'auto', fontSize: 15, lineHeight: 1.6 }}>
        {lines.map((l, i) => <span key={i} style={{ color: i === 0 ? C.amber : C.text }}>{l} </span>)}
      </div>
      {!g.storyDone && (myTurn ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={line} onChange={e => setLine(e.target.value)} onKeyDown={e => e.key === 'Enter' && line.trim() && onLine(line.trim())} placeholder="Add the next line…" autoFocus style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '12px 14px', fontSize: 15, outline: 'none' }} />
          <button onClick={() => line.trim() && onLine(line.trim())} style={solidBtn(C.blue)}>Add</button>
        </div>
      ) : <div style={{ textAlign: 'center', color: C.muted, animation: 'kgpulse 1.4s infinite' }}>{nameOf?.(g.storyTurnId) || 'Someone'} is adding a line…</div>)}
      {!g.storyDone && <div style={{ textAlign: 'center', fontSize: 11, color: C.dim }}>{myTurn ? 'Your turn' : `${nameOf?.(g.storyTurnId) || 'Someone'}'s turn`} · +2 points per line</div>}
      {isHost && !g.storyDone && <button onClick={onEnd} style={{ ...solidBtn(C.card2), border: `1px solid ${C.border}` }}>The End 🎬</button>}
      {g.storyDone && isHost && <button onClick={onBack} style={solidBtn(C.teal)}>Back to games →</button>}
    </div>
  )
}

/* shared button styles */
const ghost: CSSProperties = { background: 'none', border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.muted, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }
function solidBtn(bg: string): CSSProperties {
  return { background: bg, border: 'none', borderRadius: RADIUS.md, color: '#fff', padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: `all ${MOTION.fast}` }
}
