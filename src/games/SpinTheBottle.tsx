import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxReveal, sfxGameOver, sfxLevelUp } from '../lib/sfx';

/* ── palette (dark party theme, no gradients) ── */
const C = {
  bg: '#080c12',
  card: '#151d2b',
  border: '#1e2a3a',
  text: '#e8edf5',
  muted: '#8899aa',
  dim: '#3a4a5c',
  glass: 'rgba(255,255,255,0.04)',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  teal: '#14b8a6',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
};

const AVATARS = ['lion', 'tiger', 'fox', 'panda', 'koala', 'frog', 'butterfly', 'octopus'] as const;
const AVATAR_EMOJI: Record<string, string> = {
  lion: '\u{1F981}', tiger: '\u{1F42F}', fox: '\u{1F98A}', panda: '\u{1F43C}',
  koala: '\u{1F428}', frog: '\u{1F438}', butterfly: '\u{1F98B}', octopus: '\u{1F419}',
};
const PLAYER_COLORS = [C.green, C.red, C.blue, C.purple, C.pink, C.orange, C.teal, C.amber];

/* ── types ── */
type GameMode = 'friends' | 'spicy' | 'custom';
type Phase = 'setup' | 'spinning' | 'challenge' | 'summary';

interface Player {
  name: string;
  avatar: typeof AVATARS[number];
  spins: number;
  skipped: number;
  completed: number;
  boldest: number;
}

interface Challenge {
  text: string;
  type: 'question' | 'dare' | 'creative' | 'relationship';
}

const MODE_META: Record<GameMode, { label: string; swLabel: string; color: string; desc: string }> = {
  friends: { label: 'Friends', swLabel: 'Marafiki', color: C.green, desc: 'Fun, clean challenges for everyone' },
  spicy: { label: 'Spicy', swLabel: 'Viungo', color: C.red, desc: 'Adults only. Intimate and bold.' },
  custom: { label: 'Custom', swLabel: 'Desturi', color: C.amber, desc: 'Your own questions and dares' },
};

/* ── challenge banks ── */
const FRIENDS_CHALLENGES: Challenge[] = [
  // questions (20+)
  { text: 'What is the most embarrassing thing that happened to you this year?', type: 'question' },
  { text: 'If you could swap lives with anyone here for a day, who would it be?', type: 'question' },
  { text: 'What is your most irrational fear?', type: 'question' },
  { text: 'What is the last lie you told?', type: 'question' },
  { text: 'If you had to delete all but 3 apps on your phone, which would you keep?', type: 'question' },
  { text: 'What is the weirdest dream you have ever had?', type: 'question' },
  { text: 'What is your guilty pleasure TV show or movie?', type: 'question' },
  { text: 'If you could have dinner with any person dead or alive, who would you pick?', type: 'question' },
  { text: 'What is the most childish thing you still do?', type: 'question' },
  { text: 'What song do you secretly sing in the shower?', type: 'question' },
  { text: 'Have you ever pretended to like a gift? What was it?', type: 'question' },
  { text: 'What is something you have never told anyone in this room?', type: 'question' },
  { text: 'What is the worst date you have ever been on?', type: 'question' },
  { text: 'If you won the lottery tomorrow, what is the first thing you would buy?', type: 'question' },
  { text: 'What is your most unpopular opinion?', type: 'question' },
  { text: 'If you could master one skill overnight, what would it be?', type: 'question' },
  { text: 'What is the dumbest thing you have ever done on a dare?', type: 'question' },
  { text: 'Who was your first celebrity crush?', type: 'question' },
  { text: 'What is your biggest pet peeve about the person to your left?', type: 'question' },
  { text: 'What would your autobiography be called?', type: 'question' },
  // dares (20+)
  { text: 'Do your best impression of someone in this room. Others guess who.', type: 'dare' },
  { text: 'Let the group go through your camera roll for 30 seconds.', type: 'dare' },
  { text: 'Send a voice note to the last person you texted saying "I miss you."', type: 'dare' },
  { text: 'Do 10 push-ups right now.', type: 'dare' },
  { text: 'Speak in an accent for the next 3 rounds.', type: 'dare' },
  { text: 'Let someone in the group post a story on your social media.', type: 'dare' },
  { text: 'Dance for 30 seconds with no music.', type: 'dare' },
  { text: 'Call a friend and sing "Happy Birthday" to them right now.', type: 'dare' },
  { text: 'Do your best runway walk across the room.', type: 'dare' },
  { text: 'Stack 5 items from the room on your head and hold for 10 seconds.', type: 'dare' },
  { text: 'Let the person to your right draw something on your hand with a pen.', type: 'dare' },
  { text: 'Eat a spoonful of something spicy or sour from the kitchen.', type: 'dare' },
  { text: 'Give a 30-second motivational speech about the person across from you.', type: 'dare' },
  { text: 'Do the worm or attempt to breakdance.', type: 'dare' },
  { text: 'Hold a plank position until the next person finishes their challenge.', type: 'dare' },
  { text: 'Let the group choose your profile picture for the next 24 hours.', type: 'dare' },
  { text: 'Recreate a famous movie scene with the person next to you.', type: 'dare' },
  { text: 'Speak without using the letter "S" for the next 2 rounds.', type: 'dare' },
  { text: 'Do your best stand-up comedy bit for 1 minute.', type: 'dare' },
  { text: 'Wear your shirt inside out for the rest of the game.', type: 'dare' },
  // creative (10+)
  { text: 'In 60 seconds, draw a portrait of the person to your right. Show everyone.', type: 'creative' },
  { text: 'Make up a rap verse about your day and perform it.', type: 'creative' },
  { text: 'Come up with a new handshake with the person across from you in 30 seconds.', type: 'creative' },
  { text: 'Invent a cocktail using 3 ingredients from the room. Name it.', type: 'creative' },
  { text: 'Write a haiku about the person who spun the bottle.', type: 'creative' },
  { text: 'Tell a 2-sentence horror story that makes everyone shiver.', type: 'creative' },
  { text: 'Create a superhero identity for yourself: name, power, weakness.', type: 'creative' },
  { text: 'Act out a commercial for an imaginary product. Sell it hard.', type: 'creative' },
  { text: 'Compose a short love poem for anyone in the room.', type: 'creative' },
  { text: 'Pitch a terrible movie idea and make it sound amazing.', type: 'creative' },
  { text: 'In 20 seconds, build something from objects around you. Present your masterpiece.', type: 'creative' },
  // relationship (10+)
  { text: 'What is your favorite memory with someone in this room?', type: 'relationship' },
  { text: 'Give a genuine compliment to every player in the room.', type: 'relationship' },
  { text: 'Who in this room would you trust with your deepest secret?', type: 'relationship' },
  { text: 'What is the nicest thing someone in this room has done for you?', type: 'relationship' },
  { text: 'If you had to be stranded on an island with one person here, who?', type: 'relationship' },
  { text: 'What quality do you admire most in the person to your left?', type: 'relationship' },
  { text: 'Who in this room do you think would make the best leader and why?', type: 'relationship' },
  { text: 'Share a time when someone in this room made you laugh the hardest.', type: 'relationship' },
  { text: 'If you could relive one moment with someone here, what would it be?', type: 'relationship' },
  { text: 'What is one thing you wish you could tell someone in this room?', type: 'relationship' },
  { text: 'Who in this room knows you best? Test them with a question.', type: 'relationship' },
  // questions (more)
  { text: 'If your life had a theme song, what would it be?', type: 'question' },
  { text: 'What is the strangest food combination you secretly enjoy?', type: 'question' },
  { text: 'What is one talent you have that would surprise everyone here?', type: 'question' },
  { text: 'If you could instantly become an expert in one thing, what would it be?', type: 'question' },
  { text: 'What is the most useless fact you know?', type: 'question' },
  { text: 'What is your go-to karaoke song?', type: 'question' },
  { text: 'If you had to eat one meal for the rest of your life, what would it be?', type: 'question' },
  { text: 'What is the most trouble you got into as a kid?', type: 'question' },
  { text: 'What fictional world would you most want to live in?', type: 'question' },
  { text: 'What is your weirdest habit?', type: 'question' },
  { text: 'If animals could talk, which one would be the rudest?', type: 'question' },
  { text: 'What is the best purchase you have ever made under 20 dollars?', type: 'question' },
  { text: 'What is your most-used emoji?', type: 'question' },
  { text: 'If you could rename yourself, what name would you choose?', type: 'question' },
  { text: 'What is a small thing that instantly makes your day better?', type: 'question' },
  { text: 'What is the worst haircut you have ever had?', type: 'question' },
  { text: 'If you could time travel, would you visit the past or the future?', type: 'question' },
  { text: 'What is your favorite way to waste an afternoon?', type: 'question' },
  { text: 'What is the pettiest reason you have ever been annoyed at someone?', type: 'question' },
  { text: 'If you could have any animal as a pet, ignoring safety, what would it be?', type: 'question' },
  { text: 'What is the most embarrassing app on your phone right now?', type: 'question' },
  { text: 'What is one thing you are weirdly competitive about?', type: 'question' },
  { text: 'If you could swap talents with someone in this room, whose would you take?', type: 'question' },
  { text: 'What is the strangest thing you have ever eaten?', type: 'question' },
  { text: 'What is a trend you never understood?', type: 'question' },
  { text: 'What is the best gift you have ever received?', type: 'question' },
  { text: 'If you had to give up either music or movies forever, which would you keep?', type: 'question' },
  { text: 'What is the last thing that made you laugh out loud?', type: 'question' },
  { text: 'What is your most treasured childhood memory?', type: 'question' },
  { text: 'If you had a warning label, what would it say?', type: 'question' },
  { text: 'What is a skill you think everyone should learn?', type: 'question' },
  { text: 'What is the boldest thing on your bucket list?', type: 'question' },
  { text: 'If you could have dinner in any country tonight, where would you go?', type: 'question' },
  { text: 'What is the silliest thing you are afraid of?', type: 'question' },
  { text: 'What would your superpower be if it could only be mildly useful?', type: 'question' },
  { text: 'What is your favorite thing about the person to your right?', type: 'question' },
  { text: 'If you could freeze time, what would you do first?', type: 'question' },
  { text: 'What is the weirdest compliment you have ever received?', type: 'question' },
  { text: 'What is one thing you always say you will do but never actually do?', type: 'question' },
  { text: 'If you were a kitchen appliance, which one would you be?', type: 'question' },
  // dares (more)
  { text: 'Talk in a robot voice until it is your turn again.', type: 'dare' },
  { text: 'Do your best impression of a baby learning to walk.', type: 'dare' },
  { text: 'Balance a spoon on your nose for 10 seconds.', type: 'dare' },
  { text: 'Text the third person in your contacts a single random emoji.', type: 'dare' },
  { text: 'Do 15 jumping jacks while counting in another language.', type: 'dare' },
  { text: 'Let the group give you a new nickname for the rest of the game.', type: 'dare' },
  { text: 'Pretend to be a news anchor and report on the room for 30 seconds.', type: 'dare' },
  { text: 'Do your best slow-motion action-movie run across the room.', type: 'dare' },
  { text: 'Sing everything you say for the next two rounds.', type: 'dare' },
  { text: 'Act like your favorite animal until your next turn.', type: 'dare' },
  { text: 'Do an impression of the person who is hosting this gathering.', type: 'dare' },
  { text: 'Try to lick your own elbow for 10 seconds.', type: 'dare' },
  { text: 'Give a dramatic reading of the last text you sent.', type: 'dare' },
  { text: 'Do a cartwheel or the closest thing you can manage.', type: 'dare' },
  { text: 'Compliment a piece of furniture as if it were a person.', type: 'dare' },
  { text: 'Hop on one foot until someone else finishes their challenge.', type: 'dare' },
  { text: 'Make up a jingle for a made-up cereal and sing it.', type: 'dare' },
  { text: 'Do your best impression of a toddler throwing a tantrum.', type: 'dare' },
  { text: 'Balance a book on your head and walk across the room.', type: 'dare' },
  { text: 'Pretend the floor is lava until your next turn.', type: 'dare' },
  { text: 'Say the alphabet backwards as fast as you can.', type: 'dare' },
  { text: 'Do your best evil villain laugh.', type: 'dare' },
  { text: 'Give the person to your left a piggyback ride, if you are able.', type: 'dare' },
  { text: 'Do your best impression of a tour guide showing off the room.', type: 'dare' },
  { text: 'Strike and hold a yoga pose for 20 seconds.', type: 'dare' },
  { text: 'Talk only in rhymes until your next turn.', type: 'dare' },
  { text: 'Do your best celebrity red-carpet pose for the group.', type: 'dare' },
  { text: 'Act out how you look first thing in the morning.', type: 'dare' },
  { text: 'Pretend to be a waiter and take everyone orders in a fancy accent.', type: 'dare' },
  { text: 'Do your best nature-documentary narrator describing the room.', type: 'dare' },
  { text: 'Do 10 squats while singing your favorite song.', type: 'dare' },
  { text: 'Mime being trapped in an invisible box for 20 seconds.', type: 'dare' },
  { text: 'Give a heartfelt thank-you speech as if you just won an award.', type: 'dare' },
  { text: 'Do your best impression of a cat knocking things off a table.', type: 'dare' },
  { text: 'Speak only in questions until your next turn.', type: 'dare' },
  { text: 'Pretend to be a robot butler serving the group for one minute.', type: 'dare' },
  { text: 'Do your best impression of someone stuck in slow motion.', type: 'dare' },
  { text: 'Balance on one leg with your eyes closed for 15 seconds.', type: 'dare' },
  { text: 'Do your best impression of a superhero landing pose.', type: 'dare' },
  { text: 'Narrate your own life like a sports commentator for 30 seconds.', type: 'dare' },
  // creative (more)
  { text: 'Invent a brand-new holiday and explain how people celebrate it.', type: 'creative' },
  { text: 'Make up a bedtime story starring the person to your left in 30 seconds.', type: 'creative' },
  { text: 'Design your dream treehouse out loud in one minute.', type: 'creative' },
  { text: 'Come up with three uses for a paperclip that are not clipping papers.', type: 'creative' },
  { text: 'Invent a new sport combining two existing ones and explain the rules.', type: 'creative' },
  { text: 'Give the room a fake weather forecast for tomorrow.', type: 'creative' },
  { text: 'Make up a conspiracy theory about a household object.', type: 'creative' },
  { text: 'Create a theme song for this gathering and hum it.', type: 'creative' },
  { text: 'Invent a new ice cream flavor and describe the taste.', type: 'creative' },
  { text: 'Describe an alien from another planet and introduce it to the group.', type: 'creative' },
  { text: 'Come up with a catchy slogan for the person across from you.', type: 'creative' },
  { text: 'Invent a secret code word for the group and use it for the next round.', type: 'creative' },
  { text: 'Describe your perfect sandwich as if it were a work of art.', type: 'creative' },
  { text: 'Make up a dance move and name it after yourself.', type: 'creative' },
  { text: 'Pitch a reality show starring everyone in this room.', type: 'creative' },
  { text: 'Invent a gadget that would make daily life easier and describe it.', type: 'creative' },
  { text: 'Create a tiny origin story for how you and the person to your right met.', type: 'creative' },
  { text: 'Come up with a brand-new emoji and describe what it means.', type: 'creative' },
  { text: 'Improvise a two-line poem about snacks.', type: 'creative' },
  { text: 'Invent a mascot for this game and describe how it looks.', type: 'creative' },
  { text: 'Give a 20-second museum tour of an imaginary painting.', type: 'creative' },
  { text: 'Make up a new word and define it for the group.', type: 'creative' },
  // relationship (more)
  { text: 'Tell the person to your right one thing you appreciate about them.', type: 'relationship' },
  { text: 'Who in this room would you call first with good news?', type: 'relationship' },
  { text: 'Share a moment when someone here helped you without being asked.', type: 'relationship' },
  { text: 'What is one thing you have learned from someone in this room?', type: 'relationship' },
  { text: 'If you could plan a trip with anyone here, where would you go together?', type: 'relationship' },
  { text: 'Tell the group about the first time you met someone in this room.', type: 'relationship' },
  { text: 'Who in this room gives the best advice?', type: 'relationship' },
  { text: 'Share a habit of someone here that you secretly admire.', type: 'relationship' },
  { text: 'What is a shared memory that always makes you smile?', type: 'relationship' },
  { text: 'Who in this room would you want on your team in a crisis?', type: 'relationship' },
  { text: 'Give the person across from you genuine encouragement for something they are working on.', type: 'relationship' },
  { text: 'What is one way someone here has made you a better person?', type: 'relationship' },
  { text: 'Who in this room is most likely to cheer you up on a bad day?', type: 'relationship' },
  { text: 'Share the funniest thing that ever happened between you and someone here.', type: 'relationship' },
  { text: 'What is something you would love to do together with the group someday?', type: 'relationship' },
  { text: 'Tell the person to your left what you think their best quality is.', type: 'relationship' },
  { text: 'Who in this room surprised you the most since you met them?', type: 'relationship' },
  { text: 'Share a small act of kindness someone here has shown you.', type: 'relationship' },
  { text: 'What tradition would you want to start with the people in this room?', type: 'relationship' },
  { text: 'Who in this room would you trust to plan your birthday?', type: 'relationship' },
  { text: 'Tell the group one thing that made you grateful for someone here this week.', type: 'relationship' },
  { text: 'What is your favorite inside joke with someone in this room?', type: 'relationship' },
  // ── expansion 2: questions ──
  { text: 'What is the weirdest thing you have ever googled?', type: 'question' },
  { text: 'If you could live in any decade, which would you pick?', type: 'question' },
  { text: 'What is the most useless talent you are proud of?', type: 'question' },
  { text: 'What is your worst cooking disaster?', type: 'question' },
  { text: 'If you could be invisible for one day, what would you do?', type: 'question' },
  { text: 'What is the strangest thing in your fridge right now?', type: 'question' },
  { text: 'What is a movie everyone loves that you cannot stand?', type: 'question' },
  { text: 'What is the longest you have gone without sleep?', type: 'question' },
  { text: 'If you could only wear one color forever, what would it be?', type: 'question' },
  { text: 'What is the most embarrassing song on your playlist?', type: 'question' },
  { text: 'What is the weirdest thing you believed as a child?', type: 'question' },
  { text: 'If you could teleport anywhere right now, where would you go?', type: 'question' },
  { text: 'What is the worst gift you have ever given someone?', type: 'question' },
  { text: 'What chore do you avoid the longest?', type: 'question' },
  { text: 'What is your most-used excuse to cancel plans?', type: 'question' },
  { text: 'If you had to survive a zombie outbreak, who here would you team up with?', type: 'question' },
  { text: 'What is the strangest place you have fallen asleep?', type: 'question' },
  { text: 'What is a word you always misspell?', type: 'question' },
  { text: 'If you could instantly learn any language, which would you choose?', type: 'question' },
  { text: 'What is the most money you have ever spent on something silly?', type: 'question' },
  { text: 'What is your least favorite household chore?', type: 'question' },
  { text: 'If you were a ghost, whose house would you haunt?', type: 'question' },
  { text: 'What is the weirdest gift you have ever received?', type: 'question' },
  { text: 'What show could you rewatch a hundred times?', type: 'question' },
  { text: 'If you had to give a speech right now, what would it be about?', type: 'question' },
  { text: 'What is the strangest thing you have ever won?', type: 'question' },
  { text: 'What is your favorite smell?', type: 'question' },
  { text: 'If you could swap ages with anyone here, who and why?', type: 'question' },
  { text: 'What is a food you refuse to eat no matter what?', type: 'question' },
  { text: 'What is the most spontaneous thing you have ever done?', type: 'question' },
  { text: 'If you could have any job for one day, what would it be?', type: 'question' },
  { text: 'What is your favorite board game or card game?', type: 'question' },
  { text: 'What is the weirdest thing you do when nobody is watching?', type: 'question' },
  { text: 'If you could make one rule everyone had to follow, what would it be?', type: 'question' },
  { text: 'What is the last photo you took on your phone?', type: 'question' },
  { text: 'What is your dream vacation destination?', type: 'question' },
  { text: 'If you could bring back one trend from the past, what would it be?', type: 'question' },
  { text: 'What is the most useless gadget you own?', type: 'question' },
  { text: 'What is your favorite childhood cartoon?', type: 'question' },
  { text: 'If you had to eat breakfast food for every meal, would you be happy?', type: 'question' },
  { text: 'What is the silliest argument you have ever had?', type: 'question' },
  { text: 'What is a hobby you have always wanted to try?', type: 'question' },
  { text: 'If you could master any instrument instantly, which would you pick?', type: 'question' },
  { text: 'What is the weirdest nickname you have ever had?', type: 'question' },
  { text: 'What is your favorite thing to do on a rainy day?', type: 'question' },
  { text: 'If you could switch places with a cartoon character, who would it be?', type: 'question' },
  { text: 'What is the strangest thing you have ever bought online?', type: 'question' },
  { text: 'What is your favorite quote or saying?', type: 'question' },
  { text: 'If you could relive one day of your life, which would you choose?', type: 'question' },
  { text: 'What is the most adventurous food you would try?', type: 'question' },
  { text: 'What is your go-to comfort meal?', type: 'question' },
  { text: 'If you had a personal theme park ride, what would it be like?', type: 'question' },
  { text: 'What is the weirdest thing you have collected?', type: 'question' },
  { text: 'What is your favorite season and why?', type: 'question' },
  { text: 'If you could have any view from your window, what would it be?', type: 'question' },
  { text: 'What is the most embarrassing thing you have said out loud by accident?', type: 'question' },
  { text: 'What is your favorite way to celebrate a win?', type: 'question' },
  { text: 'If you could trade lives with a famous athlete for a week, who?', type: 'question' },
  { text: 'What is the strangest advice you have ever received?', type: 'question' },
  { text: 'What is your favorite thing about weekends?', type: 'question' },
  { text: 'If you could design your own holiday feast, what would be on it?', type: 'question' },
  { text: 'What is the funniest thing a child has ever said to you?', type: 'question' },
  { text: 'If your pet could talk, what would it complain about?', type: 'question' },
  { text: 'What is the one snack you could never give up?', type: 'question' },
  // ── expansion 2: dares ──
  { text: 'Do your best impression of a game show host introducing the group.', type: 'dare' },
  { text: 'Speak in a whisper for the next two rounds.', type: 'dare' },
  { text: 'Do 20 jumping jacks right now.', type: 'dare' },
  { text: 'Balance a shoe on your foot and kick it into the air, then catch it.', type: 'dare' },
  { text: 'Act out your morning routine in fast forward.', type: 'dare' },
  { text: 'Do your best impression of a penguin walking across the room.', type: 'dare' },
  { text: 'Let the group pick an emoji you must use in every sentence for one round.', type: 'dare' },
  { text: 'Pretend to be a statue for 30 seconds no matter what.', type: 'dare' },
  { text: 'Do your best opera-singing voice for one sentence.', type: 'dare' },
  { text: 'Try to touch your toes without bending your knees.', type: 'dare' },
  { text: 'Do an impression of a GPS giving directions around the room.', type: 'dare' },
  { text: 'Hum a song and let the group guess it.', type: 'dare' },
  { text: 'Do your best impression of a very tired dog.', type: 'dare' },
  { text: 'Walk across the room like you are on the moon.', type: 'dare' },
  { text: 'Give a dramatic weather report using only your hands.', type: 'dare' },
  { text: 'Do your best impression of a fashion model on a runway freeze.', type: 'dare' },
  { text: 'Speak in the third person for the next two rounds.', type: 'dare' },
  { text: 'Do 10 lunges while telling a story.', type: 'dare' },
  { text: 'Pretend to interview the person to your right like a talk-show host.', type: 'dare' },
  { text: 'Do your best impression of a mime stuck in the wind.', type: 'dare' },
  { text: 'Balance a small object on the back of your hand while walking.', type: 'dare' },
  { text: 'Do your best impression of a superhero taking off to fly.', type: 'dare' },
  { text: 'Act out being a chef presenting a fancy dish.', type: 'dare' },
  { text: 'Do your best impression of a cartoon villain twirling a mustache.', type: 'dare' },
  { text: 'Speak only in compliments for the next round.', type: 'dare' },
  { text: 'Do your best robot dance for 15 seconds.', type: 'dare' },
  { text: 'Pretend you are a tour guide describing an ordinary object as a treasure.', type: 'dare' },
  { text: 'Do your best impression of a sleepy toddler refusing a nap.', type: 'dare' },
  { text: 'Hop backwards across the room.', type: 'dare' },
  { text: 'Do your best impression of a dramatic movie villain reveal.', type: 'dare' },
  { text: 'Act out riding an invisible roller coaster.', type: 'dare' },
  { text: 'Do your best impression of a very excited sports fan.', type: 'dare' },
  { text: 'Give a pep talk to an imaginary team before a big game.', type: 'dare' },
  { text: 'Do your best impression of a cat spotting a laser pointer.', type: 'dare' },
  { text: 'Pretend to be a weather vane spinning in a storm.', type: 'dare' },
  { text: 'Do your best impression of a news reporter caught in a windstorm.', type: 'dare' },
  { text: 'Walk in slow motion to the nearest wall and back.', type: 'dare' },
  { text: 'Do your best impression of a bird trying to fly for the first time.', type: 'dare' },
  { text: 'Balance on your tiptoes for 20 seconds.', type: 'dare' },
  { text: 'Do your best impression of a magician revealing a trick.', type: 'dare' },
  { text: 'Act out being a plant growing from a seed to full bloom.', type: 'dare' },
  { text: 'Do your best impression of a very dramatic soap opera gasp.', type: 'dare' },
  { text: 'Pretend to be a phone on low battery slowly powering down.', type: 'dare' },
  { text: 'Do your best impression of a chicken looking for food.', type: 'dare' },
  { text: 'Give a dramatic reading of the ingredients on the nearest snack.', type: 'dare' },
  { text: 'Do your best impression of a superhero saving the day in slow motion.', type: 'dare' },
  { text: 'Act out being stuck in slow-motion quicksand.', type: 'dare' },
  { text: 'Do your best impression of a very serious librarian shushing the room.', type: 'dare' },
  { text: 'Pretend to be a wind-up toy that slowly runs out.', type: 'dare' },
  { text: 'Do your best impression of a proud parent at a graduation.', type: 'dare' },
  { text: 'March around the room like a toy soldier.', type: 'dare' },
  { text: 'Do your best impression of a frog catching flies.', type: 'dare' },
  { text: 'Act out opening the most exciting gift of your life.', type: 'dare' },
  { text: 'Do your best impression of an old-timey silent film actor.', type: 'dare' },
  { text: 'Pretend to be a coffee machine brewing a cup.', type: 'dare' },
  { text: 'Do your best impression of a very dramatic fainting scene.', type: 'dare' },
  { text: 'Spin in a circle three times then try to walk straight.', type: 'dare' },
  { text: 'Do your best impression of a dog greeting its owner after a long day.', type: 'dare' },
  { text: 'Act out being a superhero whose only power is being polite.', type: 'dare' },
  { text: 'Do your best impression of a cat ignoring everyone in the room.', type: 'dare' },
  { text: 'Pretend to be a talent-show judge reacting to a performance.', type: 'dare' },
  { text: 'Do your best impression of a bee buzzing around flowers.', type: 'dare' },
  { text: 'Give the group a dramatic slow clap for 15 seconds.', type: 'dare' },
  { text: 'Do your best impression of a very confused robot rebooting.', type: 'dare' },
  // ── expansion 2: creative ──
  { text: 'Invent a new board game and explain how to win in 30 seconds.', type: 'creative' },
  { text: 'Make up a fake origin story for the nearest snack.', type: 'creative' },
  { text: 'Design a theme park based on this room and name the rides.', type: 'creative' },
  { text: 'Invent a new emoji for a feeling that has no word yet.', type: 'creative' },
  { text: 'Come up with a jingle for an imaginary pizza shop.', type: 'creative' },
  { text: 'Make up a fairy tale where the person to your right is the hero.', type: 'creative' },
  { text: 'Invent a brand-new dance craze and give it a name.', type: 'creative' },
  { text: 'Describe a new planet and the creatures that live there.', type: 'creative' },
  { text: 'Make up a slogan for the city or town you are in.', type: 'creative' },
  { text: 'Invent a gadget that solves the most annoying part of your day.', type: 'creative' },
  { text: 'Come up with a name and backstory for the nearest houseplant or object.', type: 'creative' },
  { text: 'Design a cereal box mascot and describe its catchphrase.', type: 'creative' },
  { text: 'Make up a two-line theme song for the group.', type: 'creative' },
  { text: 'Invent a new sandwich and give it a dramatic name.', type: 'creative' },
  { text: 'Describe your dream fort and how you would defend it.', type: 'creative' },
  { text: 'Come up with a new superhero team using everyone in the room.', type: 'creative' },
  { text: 'Invent a festival and explain the main tradition.', type: 'creative' },
  { text: 'Make up a rumor about a famous statue or landmark.', type: 'creative' },
  { text: 'Design the ultimate blanket fort in one minute out loud.', type: 'creative' },
  { text: 'Invent a new sport played entirely while sitting down.', type: 'creative' },
  { text: 'Come up with a tagline for the person across from you.', type: 'creative' },
  { text: 'Make up a bedtime story that ends with a plot twist.', type: 'creative' },
  { text: 'Invent a magical creature and describe its favorite snack.', type: 'creative' },
  { text: 'Design a treehouse for the whole group and describe one feature each.', type: 'creative' },
  { text: 'Come up with a brand name for a made-up sneaker.', type: 'creative' },
  { text: 'Make up a national anthem for an imaginary tiny country.', type: 'creative' },
  { text: 'Invent a new ice cream topping combination and name it.', type: 'creative' },
  { text: 'Describe the perfect theme song entrance for yourself.', type: 'creative' },
  { text: 'Come up with three rules for a brand-new secret club.', type: 'creative' },
  { text: 'Invent a robot companion and describe what it does.', type: 'creative' },
  { text: 'Make up a comic strip in three sentences.', type: 'creative' },
  { text: 'Design a costume for the person to your left and describe it.', type: 'creative' },
  { text: 'Invent a new word for that feeling of finding money in an old pocket.', type: 'creative' },
  { text: 'Come up with a wild excuse for being late that no one would believe.', type: 'creative' },
  { text: 'Make up a tiny musical number about doing the dishes.', type: 'creative' },
  { text: 'Invent a mythical beast that guards the fridge.', type: 'creative' },
  // ── expansion 2: relationship ──
  { text: 'Tell the group a moment when someone here made you feel truly welcome.', type: 'relationship' },
  { text: 'Who in this room would you want to road trip across the country with?', type: 'relationship' },
  { text: 'Share one thing you have always wanted to thank someone here for.', type: 'relationship' },
  { text: 'Who in this room is most likely to remember your birthday?', type: 'relationship' },
  { text: 'Describe a time someone here made an ordinary day special.', type: 'relationship' },
  { text: 'What is one lesson a person in this room taught you without trying?', type: 'relationship' },
  { text: 'Who in this room would you want beside you on a big stage?', type: 'relationship' },
  { text: 'Share your favorite quality about the person two seats away.', type: 'relationship' },
  { text: 'Who in this room always knows how to make things fun?', type: 'relationship' },
  { text: 'Tell the group about a promise someone here kept for you.', type: 'relationship' },
  { text: 'Who in this room would you trust to house-sit for a month?', type: 'relationship' },
  { text: 'Share a time someone here surprised you with their kindness.', type: 'relationship' },
  { text: 'Who in this room gives the warmest hugs?', type: 'relationship' },
  { text: 'Describe a moment when someone here believed in you.', type: 'relationship' },
  { text: 'Who in this room would you want to cook a big meal with?', type: 'relationship' },
  { text: 'Share one thing you admire about how someone here treats others.', type: 'relationship' },
  { text: 'Who in this room could you talk to for hours and never get bored?', type: 'relationship' },
  { text: 'Tell the group about a time someone here calmed you down.', type: 'relationship' },
  { text: 'Who in this room is the best at giving pep talks?', type: 'relationship' },
  { text: 'Share a small habit of someone here that makes you smile.', type: 'relationship' },
  { text: 'Who in this room would you want to build a treehouse with?', type: 'relationship' },
  { text: 'Describe the moment you knew someone here was a real friend.', type: 'relationship' },
  { text: 'Who in this room is most likely to start a spontaneous adventure?', type: 'relationship' },
  { text: 'Share one thing you hope to always keep doing with the group.', type: 'relationship' },
  { text: 'Who in this room brings out your most playful side?', type: 'relationship' },
  { text: 'Tell the person across from you what makes them easy to be around.', type: 'relationship' },
  { text: 'Who in this room would you want to be stuck in an elevator with?', type: 'relationship' },
  { text: 'Share a time when someone here made you feel proud to know them.', type: 'relationship' },
  { text: 'Who in this room gives the most honest opinions?', type: 'relationship' },
  { text: 'Describe a shared laugh with someone here you still think about.', type: 'relationship' },
  { text: 'Who in this room would you want to celebrate a huge win with?', type: 'relationship' },
  { text: 'Share one thing that makes the person to your right a great friend.', type: 'relationship' },
  { text: 'Who in this room is most likely to remember the little things?', type: 'relationship' },
  { text: 'Tell the group about a time someone here showed up when it mattered.', type: 'relationship' },
  { text: 'Who in this room makes any place feel like home?', type: 'relationship' },
  { text: 'Share a wish you have for someone in this room this year.', type: 'relationship' },
];

const SPICY_CHALLENGES: Challenge[] = [
  // questions (20+)
  { text: 'What is your biggest turn-on that you have never told anyone?', type: 'question' },
  { text: 'Describe your most passionate kiss in detail.', type: 'question' },
  { text: 'What is the boldest place you have ever been intimate?', type: 'question' },
  { text: 'What is a fantasy you have never acted on?', type: 'question' },
  { text: 'Have you ever had a crush on someone in this room? Who?', type: 'question' },
  { text: 'What is the most attractive feature of the person to your right?', type: 'question' },
  { text: 'Describe your ideal romantic evening in three sentences.', type: 'question' },
  { text: 'What is the most daring outfit you have ever worn?', type: 'question' },
  { text: 'Have you ever sent a risky text you immediately regretted?', type: 'question' },
  { text: 'What part of your body are you most confident about?', type: 'question' },
  { text: 'Describe the most romantic gesture anyone has ever made for you.', type: 'question' },
  { text: 'What is the biggest age gap you have dated?', type: 'question' },
  { text: 'If you could kiss anyone in this room right now, who?', type: 'question' },
  { text: 'What is the most seductive thing someone has ever said to you?', type: 'question' },
  { text: 'Rate your own kissing skills from 1-10 and justify it.', type: 'question' },
  { text: 'Have you ever been caught in a compromising situation? Spill.', type: 'question' },
  { text: 'What is the shortest time you have waited before your first kiss on a date?', type: 'question' },
  { text: 'What do you wear to bed? Be honest.', type: 'question' },
  { text: 'What is the most embarrassing thing that has happened to you during intimacy?', type: 'question' },
  { text: 'Who in this room has the most attractive voice?', type: 'question' },
  { text: 'What is the naughtiest thing on your bucket list?', type: 'question' },
  // dares (20+)
  { text: 'Give the person to your left a slow 10-second neck massage.', type: 'dare' },
  { text: 'Whisper something seductive into the ear of the person across from you.', type: 'dare' },
  { text: 'Kiss the person nearest to you on the cheek for at least 3 seconds.', type: 'dare' },
  { text: 'Let someone in the room trace a word on your back with their finger. Guess it.', type: 'dare' },
  { text: 'Do your most seductive dance move for 15 seconds.', type: 'dare' },
  { text: 'Hold hands with the person to your right and look into their eyes for 30 seconds.', type: 'dare' },
  { text: 'Give a one-minute back rub to the person the group chooses.', type: 'dare' },
  { text: 'Bite your lip and wink at every player in the room one by one.', type: 'dare' },
  { text: 'Let someone blindfold you and guess who is touching your hand.', type: 'dare' },
  { text: 'Remove one article of clothing. Your choice.', type: 'dare' },
  { text: 'Give the person across from you a forehead kiss.', type: 'dare' },
  { text: 'Text your crush or partner: "I cannot stop thinking about you." Screenshot it.', type: 'dare' },
  { text: 'Do your best impression of a romantic movie confession to someone here.', type: 'dare' },
  { text: 'Sit on the lap of the person the group picks for the rest of this round.', type: 'dare' },
  { text: 'Let the person to your left feed you something while blindfolded.', type: 'dare' },
  { text: 'Slow dance with the nearest person for 20 seconds, no music.', type: 'dare' },
  { text: 'Read aloud the last flirty text you sent or received.', type: 'dare' },
  { text: 'Demonstrate your signature kiss move on your own hand.', type: 'dare' },
  { text: 'Give a sensual compliment to each person in the room.', type: 'dare' },
  { text: 'Close your eyes and let someone apply lipstick or chapstick on you.', type: 'dare' },
  { text: 'Kiss the back of the hand of the person across from you.', type: 'dare' },
  // creative (10+)
  { text: 'Write a steamy 2-line love note and read it aloud to the person the group picks.', type: 'creative' },
  { text: 'Perform a dramatic soap opera love confession scene with the nearest player.', type: 'creative' },
  { text: 'Describe your ideal partner using only sounds and gestures, no words.', type: 'creative' },
  { text: 'Recreate the spaghetti kiss scene from Lady and the Tramp with someone here (use your imagination).', type: 'creative' },
  { text: 'Narrate an imaginary romantic movie trailer starring you and the person to your right.', type: 'creative' },
  { text: 'Create a flirty pickup line on the spot and deliver it to the person across from you.', type: 'creative' },
  { text: 'Choreograph a 15-second couples dance with the nearest player. Perform it.', type: 'creative' },
  { text: 'Paint a portrait of passion using only 3 words. Explain your art.', type: 'creative' },
  { text: 'Compose a 4-line love poem about the person to your left and recite it dramatically.', type: 'creative' },
  { text: 'Act out a telenovela breakup scene, then a makeup scene, in 30 seconds.', type: 'creative' },
  // relationship (10+)
  { text: 'What is the most intimate non-physical moment you have shared with someone?', type: 'relationship' },
  { text: 'Describe the moment you knew you were deeply attracted to your last partner.', type: 'relationship' },
  { text: 'What is your love language and how do you want it expressed?', type: 'relationship' },
  { text: 'What is the most vulnerable thing a partner has ever shared with you?', type: 'relationship' },
  { text: 'Who in this room would you go on a date with if you were single?', type: 'relationship' },
  { text: 'Have you ever fallen for a close friend? What happened?', type: 'relationship' },
  { text: 'What is the most romantic thing you have ever done for someone?', type: 'relationship' },
  { text: 'Describe your first kiss in vivid detail.', type: 'relationship' },
  { text: 'What physical feature do you notice first on a potential partner?', type: 'relationship' },
  { text: 'If you had to marry someone in this room, who and why?', type: 'relationship' },
  { text: 'What is the deepest emotional connection you have ever felt?', type: 'relationship' },
  { text: 'What is the boldest thing you have ever done to get someone to notice you?', type: 'relationship' },
  // questions (more)
  { text: 'What is the first thing you notice about someone attractive?', type: 'question' },
  { text: 'What is your idea of the perfect first date?', type: 'question' },
  { text: 'What song instantly puts you in a romantic mood?', type: 'question' },
  { text: 'What is the most flattering compliment you have ever received?', type: 'question' },
  { text: 'Who is your celebrity hall pass?', type: 'question' },
  { text: 'What is your biggest green flag in a partner?', type: 'question' },
  { text: 'What is the most romantic place you have ever been?', type: 'question' },
  { text: 'Do you prefer to make the first move or be pursued?', type: 'question' },
  { text: 'What is a small gesture that instantly wins you over?', type: 'question' },
  { text: 'What is the boldest way you have ever flirted with someone?', type: 'question' },
  { text: 'What is your go-to move to catch someone attention?', type: 'question' },
  { text: 'What is the most memorable date you have ever been on?', type: 'question' },
  { text: 'What trait do you find irresistibly attractive?', type: 'question' },
  { text: 'What is your favorite kind of kiss?', type: 'question' },
  { text: 'Have you ever had a crush on a friend of a friend?', type: 'question' },
  { text: 'What is the sweetest thing a partner has ever done for you?', type: 'question' },
  { text: 'What is the most spontaneous romantic thing you have ever done?', type: 'question' },
  { text: 'What is your love language when you are falling for someone?', type: 'question' },
  { text: 'What outfit makes you feel the most confident?', type: 'question' },
  { text: 'What is the most charming thing someone can do?', type: 'question' },
  { text: 'Who in this room has the most flirtatious energy?', type: 'question' },
  { text: 'What is your biggest weakness when someone flirts with you?', type: 'question' },
  { text: 'What is the most romantic movie moment you wish happened to you?', type: 'question' },
  { text: 'What is a compliment you would love to hear more often?', type: 'question' },
  { text: 'What is your favorite way to be shown affection?', type: 'question' },
  { text: 'Have you ever had butterflies just from a text?', type: 'question' },
  { text: 'What is the boldest pickup line that has actually worked on you?', type: 'question' },
  { text: 'What is the most attractive personality trait to you?', type: 'question' },
  { text: 'If you had to describe your ideal date in one word, what would it be?', type: 'question' },
  { text: 'What is the most romantic thing you have ever said to someone?', type: 'question' },
  { text: 'What is your favorite thing about a slow dance?', type: 'question' },
  { text: 'Who in this room would you pick to be your date to a wedding?', type: 'question' },
  { text: 'What is the most daring thing you have done to impress a crush?', type: 'question' },
  { text: 'What is your definition of chemistry with someone?', type: 'question' },
  { text: 'What is the smoothest thing anyone has ever said to you?', type: 'question' },
  { text: 'What is your favorite feature about yourself?', type: 'question' },
  { text: 'What is the most romantic surprise you would love to receive?', type: 'question' },
  { text: 'Have you ever locked eyes with a stranger and felt a spark?', type: 'question' },
  { text: 'What is the most flirtatious text you have ever sent?', type: 'question' },
  { text: 'What is a quality that makes someone instantly more attractive to you?', type: 'question' },
  { text: 'What is your ideal way to spend a lazy morning with someone?', type: 'question' },
  { text: 'What is the boldest compliment you would give someone in this room?', type: 'question' },
  // dares (more)
  { text: 'Give the person to your right your most charming smile for 10 seconds.', type: 'dare' },
  { text: 'Compliment the eyes of the person across from you in a sultry voice.', type: 'dare' },
  { text: 'Do your best slow-motion hair flip.', type: 'dare' },
  { text: 'Whisper the most flattering thing you can think of to the person on your left.', type: 'dare' },
  { text: 'Give the group your best flirty wink.', type: 'dare' },
  { text: 'Serenade the nearest person with one line of a love song.', type: 'dare' },
  { text: 'Hold eye contact with the person across from you until one of you smiles.', type: 'dare' },
  { text: 'Give a dramatic compliment to the person the group chooses.', type: 'dare' },
  { text: 'Do your best impression of a smooth movie romantic.', type: 'dare' },
  { text: 'Blow a playful kiss to every person in the room.', type: 'dare' },
  { text: 'Offer the person to your right your most charming pickup line.', type: 'dare' },
  { text: 'Slow dance solo for 15 seconds like you are in a music video.', type: 'dare' },
  { text: 'Describe the person across from you using three flattering words.', type: 'dare' },
  { text: 'Give the nearest person a gentle high-five and hold their hand for 5 seconds.', type: 'dare' },
  { text: 'Do your most confident catwalk toward the person the group picks.', type: 'dare' },
  { text: 'Whisper a secret compliment to the person on your right.', type: 'dare' },
  { text: 'Give your best smoldering look to a spoon as if it were your crush.', type: 'dare' },
  { text: 'Recite a cheesy love line to the person across from you with a straight face.', type: 'dare' },
  { text: 'Gently boop the nose of the person to your left.', type: 'dare' },
  { text: 'Give a one-minute charm speech about why someone here is a catch.', type: 'dare' },
  { text: 'Do your best impression of flirting at a coffee shop.', type: 'dare' },
  { text: 'Compliment the smile of the person the group chooses.', type: 'dare' },
  { text: 'Offer an imaginary rose to the nearest person with a bow.', type: 'dare' },
  { text: 'Give the person across from you a playful shoulder nudge and a compliment.', type: 'dare' },
  { text: 'Do your best dramatic slow turn like you just noticed someone attractive.', type: 'dare' },
  { text: 'Say something flattering about the person on your right in a fake radio-DJ voice.', type: 'dare' },
  { text: 'Give your most charming laugh at everything the next person says for one round.', type: 'dare' },
  { text: 'Pretend to slide into the messages of the person across from you out loud.', type: 'dare' },
  { text: 'Do your best impression of a love-struck character noticing their crush.', type: 'dare' },
  { text: 'Give the nearest person a gentle pat on the head and a sweet compliment.', type: 'dare' },
  { text: 'Offer the group your best flirty catchphrase.', type: 'dare' },
  { text: 'Do your most graceful twirl toward the person to your left.', type: 'dare' },
  { text: 'Compliment the laugh of the person across from you.', type: 'dare' },
  { text: 'Give the person the group chooses your undivided adoring attention for 30 seconds.', type: 'dare' },
  { text: 'Do your best slow-motion wave to the person on your right.', type: 'dare' },
  { text: 'Whisper you look amazing tonight to the nearest person.', type: 'dare' },
  { text: 'Strike your most confident magazine-cover pose.', type: 'dare' },
  { text: 'Give a heartfelt toast to the most charming person in the room.', type: 'dare' },
  { text: 'Do your best impression of asking someone to dance.', type: 'dare' },
  { text: 'Give the person across from you a wink and a finger-gun.', type: 'dare' },
  { text: 'Compliment the style of the person to your left in an over-the-top way.', type: 'dare' },
  { text: 'Offer your hand to the nearest person and lead them in one slow spin.', type: 'dare' },
  // creative (more)
  { text: 'Improvise a two-line love song for the person the group picks.', type: 'creative' },
  { text: 'Invent a flirty nickname for the person across from you and explain it.', type: 'creative' },
  { text: 'Describe your dream romantic getaway in three sensory details.', type: 'creative' },
  { text: 'Write a charming one-line dating profile for the person to your right.', type: 'creative' },
  { text: 'Act out a meet-cute scene with the nearest player in 20 seconds.', type: 'creative' },
  { text: 'Compose a flirty haiku about the person the group chooses.', type: 'creative' },
  { text: 'Pitch a romance movie starring you and the person across from you.', type: 'creative' },
  { text: 'Invent a signature romantic gesture and demonstrate it in the air.', type: 'creative' },
  { text: 'Describe the perfect date night as if narrating a dreamy montage.', type: 'creative' },
  { text: 'Create a smooth pickup line using something in the room.', type: 'creative' },
  { text: 'Improvise a slow-dance ballad hum for the nearest person.', type: 'creative' },
  { text: 'Design your ideal romantic evening as a three-course menu.', type: 'creative' },
  { text: 'Give the person to your left a flattering superhero-of-love title.', type: 'creative' },
  { text: 'Write a two-line poem about first-date butterflies.', type: 'creative' },
  { text: 'Act out reuniting with a long-lost love at an airport in 20 seconds.', type: 'creative' },
  { text: 'Invent a love potion and describe what it smells and tastes like.', type: 'creative' },
  { text: 'Improvise the opening line of a romance novel about the room.', type: 'creative' },
  { text: 'Create a charming toast for an imaginary anniversary with the person across from you.', type: 'creative' },
  { text: 'Describe your idea of a perfect slow dance in vivid detail.', type: 'creative' },
  { text: 'Compose a flirty text you would send the person the group picks.', type: 'creative' },
  // relationship (more)
  { text: 'What first attracted you to your most recent crush?', type: 'relationship' },
  { text: 'What is the most romantic connection you have ever felt with someone?', type: 'relationship' },
  { text: 'What does emotional intimacy mean to you?', type: 'relationship' },
  { text: 'What is the most vulnerable thing you have shared on a date?', type: 'relationship' },
  { text: 'Who in this room would you want to slow dance with?', type: 'relationship' },
  { text: 'What is the deepest compliment someone has ever given you?', type: 'relationship' },
  { text: 'What is the most romantic gesture you would make for someone you love?', type: 'relationship' },
  { text: 'Describe the moment you first felt a spark with someone.', type: 'relationship' },
  { text: 'What do you value most in a romantic partner?', type: 'relationship' },
  { text: 'Who in this room gives off the most romantic energy?', type: 'relationship' },
  { text: 'What is a small thing that makes you feel truly cared for?', type: 'relationship' },
  { text: 'What is the most heartfelt thing you have ever told a partner?', type: 'relationship' },
  { text: 'What is your favorite memory of falling for someone?', type: 'relationship' },
  { text: 'Who in this room would you trust with your heart?', type: 'relationship' },
  { text: 'What is the most romantic surprise you have ever planned for someone?', type: 'relationship' },
  { text: 'Describe the kind of connection you hope to have one day.', type: 'relationship' },
  { text: 'What is the most attractive thing about confidence to you?', type: 'relationship' },
  { text: 'What is a moment when you felt truly seen by someone?', type: 'relationship' },
  { text: 'Who in this room would make the most charming date?', type: 'relationship' },
  { text: 'What is the sweetest way someone has shown you they care?', type: 'relationship' },
  { text: 'What is the boldest romantic risk you have ever taken?', type: 'relationship' },
  { text: 'Describe the perfect goodnight at the end of a great date.', type: 'relationship' },
  { text: 'What is one thing that makes you feel instantly close to someone?', type: 'relationship' },
  { text: 'Who in this room would you want to share a sunset with?', type: 'relationship' },
  // ── expansion 2: questions ──
  { text: 'What is the most attractive thing someone can wear?', type: 'question' },
  { text: 'What is your favorite compliment to give someone you like?', type: 'question' },
  { text: 'What is the boldest thing you have ever whispered to someone?', type: 'question' },
  { text: 'What is the most romantic text you have ever received?', type: 'question' },
  { text: 'What is your ideal way to end a perfect date?', type: 'question' },
  { text: 'What is the most charming thing about the person to your left?', type: 'question' },
  { text: 'What is a flirty habit you cannot help but notice in others?', type: 'question' },
  { text: 'What is your favorite thing about a first date?', type: 'question' },
  { text: 'What is the most attractive thing someone can say to you?', type: 'question' },
  { text: 'What is your biggest weakness when it comes to charm?', type: 'question' },
  { text: 'What is the most memorable compliment you have ever given?', type: 'question' },
  { text: 'What is your ideal way to flirt without saying a word?', type: 'question' },
  { text: 'What is the most attractive way someone can laugh?', type: 'question' },
  { text: 'What is the boldest move you have ever admired in someone else?', type: 'question' },
  { text: 'What is your favorite kind of romantic surprise?', type: 'question' },
  { text: 'What is the most charming thing about a genuine smile?', type: 'question' },
  { text: 'What is the sweetest nickname you have ever been called?', type: 'question' },
  { text: 'What is your favorite way to make someone blush?', type: 'question' },
  { text: 'What is the most attractive thing about confidence?', type: 'question' },
  { text: 'What is the boldest date idea you would love to try?', type: 'question' },
  { text: 'What is your favorite thing to notice about someone new?', type: 'question' },
  { text: 'What is the most flattering thing a stranger has ever said to you?', type: 'question' },
  { text: 'What is your idea of an irresistible personality?', type: 'question' },
  { text: 'What is the most romantic setting you can imagine?', type: 'question' },
  { text: 'What is your favorite way to be complimented?', type: 'question' },
  { text: 'What is the boldest thing you would do to impress someone here?', type: 'question' },
  { text: 'What is the most charming way to start a conversation?', type: 'question' },
  { text: 'What is your favorite thing about slow evenings with someone special?', type: 'question' },
  { text: 'What is the most attractive way someone can show they care?', type: 'question' },
  { text: 'What is your go-to charming line?', type: 'question' },
  { text: 'What is the most memorable flirt you have ever witnessed?', type: 'question' },
  { text: 'What is your favorite kind of eye contact?', type: 'question' },
  { text: 'What is the boldest compliment you have ever received?', type: 'question' },
  { text: 'What is the most romantic gesture you have ever seen in real life?', type: 'question' },
  { text: 'What is your favorite thing about butterflies before a date?', type: 'question' },
  { text: 'What is the most charming trait someone in this room has?', type: 'question' },
  { text: 'What is your ideal way to be swept off your feet?', type: 'question' },
  { text: 'What is the most attractive thing about a good sense of humor?', type: 'question' },
  { text: 'What is your favorite way to flirt over text?', type: 'question' },
  { text: 'What is the boldest outfit you would wear to turn heads?', type: 'question' },
  { text: 'What is the most romantic song you can think of right now?', type: 'question' },
  { text: 'What is your favorite thing about holding hands?', type: 'question' },
  { text: 'What is the most charming way someone has ever greeted you?', type: 'question' },
  { text: 'What is your idea of the perfect slow dance partner?', type: 'question' },
  { text: 'What is the most attractive thing about kindness?', type: 'question' },
  { text: 'What is your favorite way to show someone you are interested?', type: 'question' },
  { text: 'What is the boldest flirty dare you would accept tonight?', type: 'question' },
  { text: 'What is the most memorable date location you can dream up?', type: 'question' },
  { text: 'What is your favorite thing about a shared secret?', type: 'question' },
  { text: 'What is the most charming compliment you could give right now?', type: 'question' },
  { text: 'What is your ideal way to spend a romantic weekend?', type: 'question' },
  { text: 'What is the most attractive thing about someone who is a good listener?', type: 'question' },
  { text: 'What is your favorite way to be pursued?', type: 'question' },
  { text: 'What is the boldest thing you find attractive in a person?', type: 'question' },
  { text: 'What is the most romantic view you can picture?', type: 'question' },
  { text: 'What is your favorite thing about a lingering goodbye?', type: 'question' },
  { text: 'What is the most charming way to ask someone out?', type: 'question' },
  { text: 'What is your idea of effortless attraction?', type: 'question' },
  { text: 'What is the most attractive thing about a warm voice?', type: 'question' },
  { text: 'What is your favorite flirty compliment to receive?', type: 'question' },
  { text: 'What is the boldest romantic gesture you would make on a first date?', type: 'question' },
  { text: 'What is the most memorable thing about a great slow dance?', type: 'question' },
  { text: 'What is your favorite way to catch someone eye across a room?', type: 'question' },
  { text: 'What is the most charming thing about someone who is confident but kind?', type: 'question' },
  { text: 'What is your ideal way to be told you are attractive?', type: 'question' },
  { text: 'What is the boldest thing you would say to your crush right now?', type: 'question' },
  // ── expansion 2: dares ──
  { text: 'Give the person to your right a slow, dramatic hair flip and a smile.', type: 'dare' },
  { text: 'Compliment the smile of the person on your left in a soft voice.', type: 'dare' },
  { text: 'Do your best impression of someone falling in love at first sight.', type: 'dare' },
  { text: 'Offer the nearest person an imaginary bouquet with a dramatic bow.', type: 'dare' },
  { text: 'Give your most charming greeting to every person one by one.', type: 'dare' },
  { text: 'Whisper a sweet compliment to the person across from you.', type: 'dare' },
  { text: 'Do your best slow-motion turn as if a breeze just caught you.', type: 'dare' },
  { text: 'Give the person to your right a playful wink and a finger heart.', type: 'dare' },
  { text: 'Compliment the confidence of the person the group chooses.', type: 'dare' },
  { text: 'Do your most graceful stroll toward the nearest person.', type: 'dare' },
  { text: 'Raise an imaginary glass to toast the most charming person here.', type: 'dare' },
  { text: 'Give the person across from you three flattering words in a soft tone.', type: 'dare' },
  { text: 'Do your best impression of a smooth talker at a party.', type: 'dare' },
  { text: 'Blow a gentle kiss to the person on your left.', type: 'dare' },
  { text: 'Give your warmest smile to the person the group picks for 10 seconds.', type: 'dare' },
  { text: 'Compliment the laugh of the nearest person in a playful way.', type: 'dare' },
  { text: 'Do your best dramatic slow-motion wave to someone across the room.', type: 'dare' },
  { text: 'Offer the person to your right your most charming compliment.', type: 'dare' },
  { text: 'Give a soft round of applause for the most charming person here.', type: 'dare' },
  { text: 'Do your best impression of noticing an attractive stranger.', type: 'dare' },
  { text: 'Whisper you are wonderful to the nearest person.', type: 'dare' },
  { text: 'Give the person across from you a gentle bow and a kind word.', type: 'dare' },
  { text: 'Compliment the eyes of the person to your left in a warm voice.', type: 'dare' },
  { text: 'Do your most confident slow spin for the group.', type: 'dare' },
  { text: 'Offer an imaginary rose to the person the group chooses.', type: 'dare' },
  { text: 'Give the nearest person your best charming grin for 8 seconds.', type: 'dare' },
  { text: 'Do your best impression of a hopeless romantic sighing dreamily.', type: 'dare' },
  { text: 'Whisper a flattering secret to the person on your right.', type: 'dare' },
  { text: 'Give the person across from you a playful salute and a compliment.', type: 'dare' },
  { text: 'Do your best slow-motion hair toss and a wink.', type: 'dare' },
  { text: 'Offer your most heartfelt compliment to the nearest person.', type: 'dare' },
  { text: 'Give the group your dreamiest faraway gaze for 10 seconds.', type: 'dare' },
  { text: 'Compliment the style of the person to your right in a soft tone.', type: 'dare' },
  { text: 'Do your best impression of someone smitten at a coffee shop.', type: 'dare' },
  { text: 'Whisper you brighten the room to the nearest person.', type: 'dare' },
  { text: 'Give the person across from you a gentle nod and a sweet word.', type: 'dare' },
  { text: 'Do your most graceful twirl toward the person on your left.', type: 'dare' },
  { text: 'Offer the group your best charming catchphrase in a smooth voice.', type: 'dare' },
  { text: 'Compliment the kindness of the person the group chooses.', type: 'dare' },
  { text: 'Do your best impression of a dashing hero making an entrance.', type: 'dare' },
  { text: 'Whisper a gentle compliment to the person across from you.', type: 'dare' },
  { text: 'Give the nearest person your most charming little bow.', type: 'dare' },
  { text: 'Do your best slow-motion look over your shoulder with a smile.', type: 'dare' },
  { text: 'Offer the person to your left a flattering title of your invention.', type: 'dare' },
  { text: 'Give the group your most confident magazine pose for 10 seconds.', type: 'dare' },
  { text: 'Compliment the warmth of the nearest person in a soft voice.', type: 'dare' },
  { text: 'Do your best impression of a romantic lead gazing at the sunset.', type: 'dare' },
  { text: 'Whisper you are lovely to the person to your right.', type: 'dare' },
  { text: 'Give the person across from you a gentle wink and a compliment.', type: 'dare' },
  { text: 'Do your most graceful slow walk to the nearest wall and back.', type: 'dare' },
  { text: 'Offer an imaginary chocolate to the person the group picks with a bow.', type: 'dare' },
  { text: 'Compliment the charm of the person to your left in a playful tone.', type: 'dare' },
  { text: 'Do your best impression of blushing at a compliment.', type: 'dare' },
  { text: 'Whisper a kind word to every person in the room one by one.', type: 'dare' },
  { text: 'Give the nearest person your softest smile for 8 seconds.', type: 'dare' },
  { text: 'Do your best slow-motion dramatic hair sweep.', type: 'dare' },
  { text: 'Offer the group a heartfelt compliment about the person across from you.', type: 'dare' },
  { text: 'Give the person to your right a gentle bow and a flattering word.', type: 'dare' },
  { text: 'Do your best impression of someone charmed by a great laugh.', type: 'dare' },
  { text: 'Whisper you have a wonderful smile to the nearest person.', type: 'dare' },
  { text: 'Give the person across from you your most confident wink.', type: 'dare' },
  { text: 'Do your most graceful curtsy or bow to the group.', type: 'dare' },
  { text: 'Compliment the presence of the person the group chooses.', type: 'dare' },
  { text: 'Do your best impression of a smooth romantic making a toast.', type: 'dare' },
  { text: 'Whisper a soft compliment to the person on your left.', type: 'dare' },
  { text: 'Give the nearest person your warmest gaze and a kind word.', type: 'dare' },
  // ── expansion 2: creative ──
  { text: 'Improvise a charming toast to the person across from you.', type: 'creative' },
  { text: 'Invent a flirty superhero and describe their romantic power.', type: 'creative' },
  { text: 'Compose a two-line poem about a first-date spark.', type: 'creative' },
  { text: 'Write a smooth dating profile headline for the person to your left.', type: 'creative' },
  { text: 'Act out a charming meet-cute at a bookstore in 20 seconds.', type: 'creative' },
  { text: 'Invent a dreamy vacation for two and describe one perfect moment.', type: 'creative' },
  { text: 'Come up with a flirty name for the nearest person and explain it.', type: 'creative' },
  { text: 'Improvise a romantic movie tagline starring the group.', type: 'creative' },
  { text: 'Describe your ideal candlelit evening in three sensory words.', type: 'creative' },
  { text: 'Write a charming one-line invitation to a dream date.', type: 'creative' },
  { text: 'Compose a flirty haiku about a slow dance.', type: 'creative' },
  { text: 'Invent a signature charming wink and demonstrate it.', type: 'creative' },
  { text: 'Pitch a rom-com starring you and the person to your right.', type: 'creative' },
  { text: 'Describe a perfect rooftop date as if narrating a montage.', type: 'creative' },
  { text: 'Come up with a smooth compliment using something on the table.', type: 'creative' },
  { text: 'Improvise the first line of a love letter to the room.', type: 'creative' },
  { text: 'Design a dream date night as a three-song playlist and explain it.', type: 'creative' },
  { text: 'Give the person across from you a charming title of romance.', type: 'creative' },
  { text: 'Write a two-line poem about catching someone eye.', type: 'creative' },
  { text: 'Act out a charming reunion of two old sweethearts in 20 seconds.', type: 'creative' },
  { text: 'Invent a romantic tradition and describe how it works.', type: 'creative' },
  { text: 'Improvise a dreamy ballad hum for the person the group picks.', type: 'creative' },
  { text: 'Describe your idea of a perfect stargazing date in vivid words.', type: 'creative' },
  { text: 'Come up with a flirty fortune-cookie message for the nearest person.', type: 'creative' },
  { text: 'Write a charming radio dedication for the person to your left.', type: 'creative' },
  { text: 'Act out asking someone to dance in the most graceful way.', type: 'creative' },
  { text: 'Invent a love-themed cocktail and describe its dreamy flavor.', type: 'creative' },
  { text: 'Improvise the closing line of a romance novel about tonight.', type: 'creative' },
  { text: 'Describe the perfect goodnight at a doorstep in three details.', type: 'creative' },
  { text: 'Come up with a charming nickname for a slow dance move you invent.', type: 'creative' },
  { text: 'Write a two-line poem about a lingering glance.', type: 'creative' },
  { text: 'Act out a charming first date at a carnival in 20 seconds.', type: 'creative' },
  // ── expansion 2: relationship ──
  { text: 'What is the most charming quality you look for in a partner?', type: 'relationship' },
  { text: 'Describe the moment you felt the strongest connection with someone.', type: 'relationship' },
  { text: 'Who in this room would you want to watch a sunrise with?', type: 'relationship' },
  { text: 'What is the most romantic thing someone has ever whispered to you?', type: 'relationship' },
  { text: 'What makes you feel instantly drawn to a person?', type: 'relationship' },
  { text: 'What is the deepest compliment you could give the person to your right?', type: 'relationship' },
  { text: 'Who in this room has the most magnetic presence?', type: 'relationship' },
  { text: 'What is the most romantic memory you carry with you?', type: 'relationship' },
  { text: 'What quality makes someone unforgettable to you?', type: 'relationship' },
  { text: 'Who in this room would you want to share a quiet evening with?', type: 'relationship' },
  { text: 'What is the sweetest way someone has ever shown they were interested?', type: 'relationship' },
  { text: 'Describe the kind of romance you daydream about.', type: 'relationship' },
  { text: 'Who in this room would make the most charming dinner date?', type: 'relationship' },
  { text: 'What is one thing that makes you feel truly adored?', type: 'relationship' },
  { text: 'What is the boldest romantic gesture you would welcome?', type: 'relationship' },
  { text: 'Who in this room gives off the warmest romantic energy?', type: 'relationship' },
  { text: 'What is the most heartfelt compliment you have ever received?', type: 'relationship' },
  { text: 'Describe the moment you knew you had a crush on someone.', type: 'relationship' },
  { text: 'What makes a slow dance feel truly romantic to you?', type: 'relationship' },
  { text: 'Who in this room would you want to travel somewhere beautiful with?', type: 'relationship' },
  { text: 'What is the most charming thing a partner could plan for you?', type: 'relationship' },
  { text: 'What is one small gesture that makes you feel truly wanted?', type: 'relationship' },
  { text: 'Who in this room would you trust with a heartfelt secret?', type: 'relationship' },
  { text: 'What is the most romantic place you would love to visit?', type: 'relationship' },
  { text: 'Describe the kind of connection that makes your heart race.', type: 'relationship' },
  { text: 'Who in this room would you want beside you under the stars?', type: 'relationship' },
  { text: 'What is the most flattering way someone has ever pursued you?', type: 'relationship' },
  { text: 'What quality makes someone irresistibly charming to you?', type: 'relationship' },
  { text: 'Who in this room would you pick for a candlelit dinner?', type: 'relationship' },
  { text: 'What is the sweetest thing you would say to someone you adore?', type: 'relationship' },
  { text: 'Describe your idea of a perfect first dance.', type: 'relationship' },
  { text: 'Who in this room has the most charming laugh?', type: 'relationship' },
  { text: 'What is the most romantic surprise you would love to plan for someone?', type: 'relationship' },
  { text: 'What makes you feel a genuine spark with a person?', type: 'relationship' },
  { text: 'Who in this room would you want to share a long walk with?', type: 'relationship' },
  { text: 'What is the boldest thing you would confess to a crush tonight?', type: 'relationship' },
];

const STORAGE_KEY = 'kasuku-stb-custom';

function loadCustom(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s: unknown) => typeof s === 'string' && s.trim()) : [];
  } catch { return []; }
}

function saveCustom(items: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* ── helpers ── */
function pickRandom<T>(arr: T[], used: Set<number>): { item: T; idx: number } | null {
  const available = arr.map((item, idx) => ({ item, idx })).filter(({ idx }) => !used.has(idx));
  if (available.length === 0) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  return pick;
}

function typeLabel(t: Challenge['type']): string {
  switch (t) {
    case 'question': return 'Question';
    case 'dare': return 'Dare';
    case 'creative': return 'Creative';
    case 'relationship': return 'Relationship';
  }
}

function typeColor(t: Challenge['type']): string {
  switch (t) {
    case 'question': return C.blue;
    case 'dare': return C.red;
    case 'creative': return C.purple;
    case 'relationship': return C.pink;
  }
}

/* ── component ── */
export default function SpinTheBottle({ onBack, onGameEnd, duo }: {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
  duo?: { me: string; them: string } | null;
}) {
  const startTime = useRef(Date.now());

  /* state */
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<GameMode>('friends');
  const [players, setPlayers] = useState<Player[]>(() =>
    duo
      ? [
          { name: duo.me, avatar: AVATARS[0], spins: 0, skipped: 0, completed: 0, boldest: 0 },
          { name: duo.them, avatar: AVATARS[1], spins: 0, skipped: 0, completed: 0, boldest: 0 },
        ]
      : [
          { name: '', avatar: AVATARS[0], spins: 0, skipped: 0, completed: 0, boldest: 0 },
          { name: '', avatar: AVATARS[1], spins: 0, skipped: 0, completed: 0, boldest: 0 },
        ]
  );
  const [customItems, setCustomItems] = useState<string[]>(loadCustom);
  const [customDraft, setCustomDraft] = useState('');

  const [bottleAngle, setBottleAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<number | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [passesLeft, setPassesLeft] = useState(3);
  const [roundCount, setRoundCount] = useState(0);
  const [spinnerIdx, setSpinnerIdx] = useState(0);

  const usedFriends = useRef<Set<number>>(new Set());
  const usedSpicy = useRef<Set<number>>(new Set());
  const usedCustom = useRef<Set<number>>(new Set());
  const animFrame = useRef<number>(0);

  /* derived */
  const canStart = useMemo(() => {
    const namedPlayers = players.filter(p => p.name.trim());
    if (namedPlayers.length < 2) return false;
    if (mode === 'custom' && customItems.length === 0) return false;
    return true;
  }, [players, mode, customItems]);

  /* player management */
  const addPlayer = useCallback(() => {
    if (players.length >= 8) return;
    const usedAvatars = new Set(players.map(p => p.avatar));
    const next = AVATARS.find(a => !usedAvatars.has(a)) || AVATARS[0];
    setPlayers(prev => [...prev, { name: '', avatar: next, spins: 0, skipped: 0, completed: 0, boldest: 0 }]);
    sfxTap();
  }, [players]);

  const removePlayer = useCallback((idx: number) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter((_, i) => i !== idx));
    sfxTap();
  }, [players]);

  const updateName = useCallback((idx: number, name: string) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, name } : p));
  }, []);

  /* custom question management */
  const addCustom = useCallback(() => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    const updated = [...customItems, trimmed];
    setCustomItems(updated);
    saveCustom(updated);
    setCustomDraft('');
    sfxTap();
  }, [customDraft, customItems]);

  const removeCustom = useCallback((idx: number) => {
    const updated = customItems.filter((_, i) => i !== idx);
    setCustomItems(updated);
    saveCustom(updated);
    sfxTap();
  }, [customItems]);

  /* get challenge from pool */
  const getChallenge = useCallback((): Challenge | null => {
    if (mode === 'custom') {
      const customChallenges: Challenge[] = customItems.map(text => ({ text, type: 'dare' as const }));
      const pick = pickRandom(customChallenges, usedCustom.current);
      if (!pick) {
        usedCustom.current.clear();
        return pickRandom(customChallenges, usedCustom.current)?.item ?? null;
      }
      usedCustom.current.add(pick.idx);
      return pick.item;
    }

    const pool = mode === 'friends' ? FRIENDS_CHALLENGES : SPICY_CHALLENGES;
    const used = mode === 'friends' ? usedFriends : usedSpicy;
    const pick = pickRandom(pool, used.current);
    if (!pick) {
      used.current.clear();
      return pickRandom(pool, used.current)?.item ?? null;
    }
    used.current.add(pick.idx);
    return pick.item;
  }, [mode, customItems]);

  /* spin bottle */
  const spinBottle = useCallback(() => {
    if (isSpinning) return;
    sfxTap();
    setIsSpinning(true);
    setTargetPlayer(null);
    setCurrentChallenge(null);

    const activePlayers = players.filter(p => p.name.trim());
    const target = Math.floor(Math.random() * activePlayers.length);
    const targetAngleBase = (target / activePlayers.length) * 360;
    const extraSpins = 3 + Math.floor(Math.random() * 4);
    const finalAngle = bottleAngle + extraSpins * 360 + targetAngleBase + Math.random() * (360 / activePlayers.length);

    const duration = 3000 + Math.random() * 1500;
    const startAngle = bottleAngle;
    const startTs = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // cubic ease-out for deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (finalAngle - startAngle) * eased;
      setBottleAngle(currentAngle);

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      } else {
        setBottleAngle(finalAngle);
        setIsSpinning(false);

        const realTarget = players.findIndex(p => p.name.trim() === activePlayers[target].name);
        setTargetPlayer(realTarget);

        const challenge = getChallenge();
        setCurrentChallenge(challenge);

        setPlayers(prev => prev.map((p, i) =>
          i === realTarget ? { ...p, spins: p.spins + 1 } : p
        ));
        setRoundCount(r => r + 1);

        sfxReveal();
      }
    };

    animFrame.current = requestAnimationFrame(animate);
  }, [isSpinning, players, bottleAngle, getChallenge]);

  /* complete challenge */
  const completeChallenge = useCallback(() => {
    if (targetPlayer === null) return;
    sfxCorrect();
    setPlayers(prev => prev.map((p, i) =>
      i === targetPlayer ? { ...p, completed: p.completed + 1, boldest: p.boldest + 1 } : p
    ));
    setPhase('spinning');
    setTargetPlayer(null);
    setCurrentChallenge(null);
    setSpinnerIdx(prev => (prev + 1) % players.filter(p => p.name.trim()).length);
  }, [targetPlayer, players]);

  /* skip challenge */
  const skipChallenge = useCallback(() => {
    if (targetPlayer === null || passesLeft <= 0) return;
    sfxTap();
    setPassesLeft(p => p - 1);
    setPlayers(prev => prev.map((p, i) =>
      i === targetPlayer ? { ...p, skipped: p.skipped + 1 } : p
    ));
    setPhase('spinning');
    setTargetPlayer(null);
    setCurrentChallenge(null);
    setSpinnerIdx(prev => (prev + 1) % players.filter(p => p.name.trim()).length);
  }, [targetPlayer, passesLeft, players]);

  /* start game */
  const startGame = useCallback(() => {
    if (!canStart) return;
    sfxLevelUp();
    startTime.current = Date.now();
    setPhase('spinning');
    setRoundCount(0);
    setPassesLeft(3);
    usedFriends.current.clear();
    usedSpicy.current.clear();
    usedCustom.current.clear();
  }, [canStart]);

  /* end game */
  const endGame = useCallback(() => {
    sfxGameOver();
    setPhase('summary');
  }, []);

  /* onGameEnd effect */
  useEffect(() => {
    if (phase !== 'summary' || !onGameEnd) return;
    const totalCompleted = players.reduce((s, p) => s + p.completed, 0);
    const totalSpins = players.reduce((s, p) => s + p.spins, 0);
    const accuracy = totalSpins > 0 ? Math.round((totalCompleted / totalSpins) * 100) : 0;
    onGameEnd({
      score: totalCompleted * 10,
      accuracy,
      level: 1,
      maxScore: totalSpins * 10,
      timeMs: Date.now() - startTime.current,
    });
  }, [phase, onGameEnd, players]);

  /* cleanup */
  useEffect(() => () => { cancelAnimationFrame(animFrame.current); }, []);

  /* invited duo: skip setup and jump straight into play (players are pre-seeded above) */
  useEffect(() => {
    if (duo) startGame();
    // run once on mount; startGame/duo intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── styles ── */
  const wrap: CSSProperties = {
    minHeight: '100vh', background: C.bg, color: C.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', flexDirection: 'column',
  };
  const topBar: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
  };
  const backBtn: CSSProperties = {
    background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
    fontSize: 22, padding: 4, lineHeight: 1,
  };
  const content: CSSProperties = {
    flex: 1, padding: '20px 20px 40px', maxWidth: 600, margin: '0 auto', width: '100%',
  };

  /* ── SETUP PHASE ── */
  if (phase === 'setup') {
    return (
      <div style={wrap}>
        <div style={topBar}>
          <button style={backBtn} onClick={onBack} aria-label="Back">{'←'}</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Spin the Bottle</div>
            <div style={{ fontSize: 12, color: C.muted }}>Zungusha Chupa</div>
          </div>
        </div>
        <div style={content}>
          {/* Mode selection */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.muted }}>
              MODE / HALI
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(Object.keys(MODE_META) as GameMode[]).map(m => {
                const meta = MODE_META[m];
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => { setMode(m); sfxTap(); }}
                    style={{
                      flex: '1 1 0',
                      minWidth: 100,
                      padding: '14px 12px',
                      borderRadius: RADIUS.md,
                      border: `2px solid ${active ? meta.color : C.border}`,
                      background: active ? meta.color + '18' : C.card,
                      color: active ? meta.color : C.text,
                      cursor: 'pointer',
                      transition: `all ${MOTION.fast}`,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{meta.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Players */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.muted }}>
              PLAYERS / WACHEZAJI ({players.length}/8)
            </div>
            {players.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                background: C.card, borderRadius: RADIUS.md, padding: '10px 14px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: RADIUS.full,
                  background: PLAYER_COLORS[i] + '22',
                  border: `2px solid ${PLAYER_COLORS[i]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {AVATAR_EMOJI[p.avatar]}
                </div>
                <input
                  type="text"
                  value={p.name}
                  onChange={e => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  maxLength={20}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: C.text, fontSize: 15, padding: 0,
                  }}
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    style={{
                      background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
                      fontSize: 18, padding: 4, lineHeight: 1,
                    }}
                    aria-label="Remove"
                  >{'×'}</button>
                )}
              </div>
            ))}
            {players.length < 8 && (
              <button
                onClick={addPlayer}
                style={{
                  width: '100%', padding: '12px', borderRadius: RADIUS.md,
                  border: `1px dashed ${C.dim}`, background: 'transparent',
                  color: C.muted, cursor: 'pointer', fontSize: 14,
                  transition: `all ${MOTION.fast}`,
                }}
              >
                + Add Player
              </button>
            )}
          </div>

          {/* Custom questions (if custom mode) */}
          {mode === 'custom' && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.muted }}>
                CUSTOM QUESTIONS / MASWALI ({customItems.length})
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={customDraft}
                  onChange={e => setCustomDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()}
                  placeholder="Type a question or dare..."
                  style={{
                    flex: 1, background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: RADIUS.sm, padding: '10px 14px', color: C.text,
                    fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  onClick={addCustom}
                  style={{
                    ...solidBtn(C.amber),
                    padding: '10px 18px', borderRadius: RADIUS.sm, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, border: 'none',
                  }}
                >+</button>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {customItems.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                    padding: '8px 12px', background: C.glass, borderRadius: RADIUS.sm,
                    fontSize: 13,
                  }}>
                    <span style={{ flex: 1, color: C.text }}>{item}</span>
                    <button
                      onClick={() => removeCustom(i)}
                      style={{
                        background: 'none', border: 'none', color: C.dim,
                        cursor: 'pointer', fontSize: 16, padding: 2, lineHeight: 1,
                      }}
                    >{'×'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={!canStart}
            style={{
              ...solidBtn(MODE_META[mode].color),
              width: '100%', padding: '16px', borderRadius: RADIUS.md,
              fontSize: 16, fontWeight: 600, border: 'none', cursor: canStart ? 'pointer' : 'not-allowed',
              opacity: canStart ? 1 : 0.4,
              transition: `all ${MOTION.fast}`,
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  /* ── SPINNING / CHALLENGE PHASE ── */
  if (phase === 'spinning' || phase === 'challenge') {
    const activePlayers = players.filter(p => p.name.trim());
    const currentSpinner = activePlayers[spinnerIdx % activePlayers.length];
    const currentSpinnerGlobalIdx = players.findIndex(p => p.name === currentSpinner.name);

    return (
      <div style={wrap}>
        <div style={topBar}>
          <button style={backBtn} onClick={onBack} aria-label="Back">{'←'}</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              Round {roundCount + 1}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {currentSpinner.name} spins
              {' '}{'·'}{' '}Passes: {passesLeft}
            </div>
          </div>
          <button
            onClick={endGame}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm,
              color: C.muted, padding: '6px 14px', fontSize: 12, cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            End Game
          </button>
        </div>

        <div style={content}>
          {/* Bottle circle */}
          <div style={{ position: 'relative', width: 300, height: 300, margin: '0 auto 24px' }}>
            {/* Player positions around the circle */}
            {activePlayers.map((p, i) => {
              const angle = (i / activePlayers.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 130;
              const x = 150 + Math.cos(angle) * radius;
              const y = 150 + Math.sin(angle) * radius;
              const globalIdx = players.findIndex(pl => pl.name === p.name);
              const isTarget = targetPlayer !== null && globalIdx === targetPlayer;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x - 22, top: y - 22,
                    width: 44, height: 44,
                    borderRadius: RADIUS.full,
                    background: isTarget ? PLAYER_COLORS[globalIdx] + '33' : C.card,
                    border: `2px solid ${isTarget ? PLAYER_COLORS[globalIdx] : C.border}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    transition: `all ${MOTION.med}`,
                    boxShadow: isTarget ? `0 0 20px ${PLAYER_COLORS[globalIdx]}44` : 'none',
                    zIndex: isTarget ? 2 : 1,
                  }}
                >
                  <div style={{ fontSize: 16, lineHeight: 1 }}>{AVATAR_EMOJI[p.avatar]}</div>
                  <div style={{
                    position: 'absolute', bottom: -18, fontSize: 10, fontWeight: 600,
                    color: isTarget ? PLAYER_COLORS[globalIdx] : C.muted,
                    whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis',
                    textAlign: 'center',
                  }}>
                    {p.name}
                  </div>
                </div>
              );
            })}

            {/* SVG Bottle */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              style={{
                position: 'absolute',
                left: 110, top: 110,
                transform: `rotate(${bottleAngle}deg)`,
                transition: isSpinning ? 'none' : `transform ${MOTION.med}`,
                zIndex: 3,
              }}
            >
              {/* bottle body */}
              <rect x="34" y="30" width="12" height="32" rx="3" fill={C.teal} />
              {/* bottle neck */}
              <rect x="37" y="14" width="6" height="18" rx="2" fill={C.teal} />
              {/* bottle cap */}
              <rect x="36" y="8" width="8" height="8" rx="2" fill={PLAYER_COLORS[currentSpinnerGlobalIdx]} />
              {/* bottle base */}
              <rect x="32" y="58" width="16" height="6" rx="2" fill={C.teal} />
              {/* pointer indicator */}
              <polygon points="40,2 36,10 44,10" fill={PLAYER_COLORS[currentSpinnerGlobalIdx]} />
            </svg>
          </div>

          {/* Spin button or challenge display */}
          {!currentChallenge && !isSpinning && (
            <button
              onClick={spinBottle}
              style={{
                ...solidBtn(MODE_META[mode].color),
                display: 'block', width: '100%', maxWidth: 280, margin: '40px auto 0',
                padding: '16px 24px', borderRadius: RADIUS.lg, fontSize: 18,
                fontWeight: 700, border: 'none', cursor: 'pointer',
                transition: `all ${MOTION.fast}`,
              }}
            >
              Zungusha! -- Spin!
            </button>
          )}

          {isSpinning && (
            <div style={{
              textAlign: 'center', marginTop: 40, fontSize: 16, color: C.muted,
              fontWeight: 600,
            }}>
              Spinning...
            </div>
          )}

          {/* Challenge card */}
          {currentChallenge && targetPlayer !== null && (
            <div style={{
              marginTop: 32,
              background: C.card,
              border: `1px solid ${PLAYER_COLORS[targetPlayer]}44`,
              borderRadius: RADIUS.lg,
              padding: '24px 20px',
              animation: 'fadeIn 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: RADIUS.full,
                  background: PLAYER_COLORS[targetPlayer] + '22',
                  border: `2px solid ${PLAYER_COLORS[targetPlayer]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {AVATAR_EMOJI[players[targetPlayer].avatar]}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: PLAYER_COLORS[targetPlayer] }}>
                    {players[targetPlayer].name}
                  </div>
                  <div style={{
                    fontSize: 11, color: typeColor(currentChallenge.type),
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    {typeLabel(currentChallenge.type)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 17, lineHeight: 1.6, fontWeight: 500, marginBottom: 24, color: C.text }}>
                {currentChallenge.text}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={completeChallenge}
                  style={{
                    ...solidBtn(C.green),
                    flex: 1, padding: '14px', borderRadius: RADIUS.md,
                    fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}
                >
                  Done!
                </button>
                <button
                  onClick={skipChallenge}
                  disabled={passesLeft <= 0}
                  style={{
                    flex: 1, padding: '14px', borderRadius: RADIUS.md,
                    fontSize: 15, fontWeight: 600, border: `1px solid ${C.border}`,
                    background: C.card, color: passesLeft > 0 ? C.muted : C.dim,
                    cursor: passesLeft > 0 ? 'pointer' : 'not-allowed',
                    opacity: passesLeft > 0 ? 1 : 0.4,
                  }}
                >
                  Skip ({passesLeft})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── SUMMARY PHASE ── */
  const activePlayers = players.filter(p => p.name.trim());
  const totalCompleted = activePlayers.reduce((s, p) => s + p.completed, 0);
  const totalSkipped = activePlayers.reduce((s, p) => s + p.skipped, 0);
  const mostSpins = [...activePlayers].sort((a, b) => b.spins - a.spins)[0];
  const boldest = [...activePlayers].sort((a, b) => b.boldest - a.boldest)[0];
  const mostSkipped = [...activePlayers].sort((a, b) => b.skipped - a.skipped)[0];

  const awards: { title: string; swTitle: string; player: Player; color: string }[] = [];
  if (boldest && boldest.boldest > 0) {
    awards.push({ title: 'Boldest Player', swTitle: 'Jasiri Zaidi', player: boldest, color: C.red });
  }
  if (mostSpins && mostSpins.spins > 0) {
    awards.push({ title: 'Bottle Magnet', swTitle: 'Sumaku ya Chupa', player: mostSpins, color: C.teal });
  }
  if (mostSkipped && mostSkipped.skipped > 0) {
    awards.push({ title: 'Most Cautious', swTitle: 'Mwangalifu', player: mostSkipped, color: C.amber });
  }

  return (
    <div style={wrap}>
      <div style={topBar}>
        <button style={backBtn} onClick={onBack} aria-label="Back">{'←'}</button>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Game Over / Mwisho</div>
      </div>
      <div style={content}>
        {/* Stats overview */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28,
        }}>
          {[
            { label: 'Rounds', value: roundCount, color: C.blue },
            { label: 'Completed', value: totalCompleted, color: C.green },
            { label: 'Skipped', value: totalSkipped, color: C.amber },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.card, borderRadius: RADIUS.md, padding: '16px 12px',
              border: `1px solid ${C.border}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Awards */}
        {awards.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Awards
            </div>
            {awards.map((award, i) => {
              const globalIdx = players.findIndex(p => p.name === award.player.name);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
                  background: award.color + '0d', borderRadius: RADIUS.md,
                  padding: '14px 16px', border: `1px solid ${award.color}33`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: RADIUS.full,
                    background: award.color + '22', border: `2px solid ${award.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {AVATAR_EMOJI[award.player.avatar]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: award.color }}>
                      {award.title}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{award.swTitle}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: PLAYER_COLORS[globalIdx >= 0 ? globalIdx : 0] }}>
                    {award.player.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Player breakdown */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Player Stats / Takwimu
          </div>
          {activePlayers.map((p, i) => {
            const globalIdx = players.findIndex(pl => pl.name === p.name);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
                background: C.card, borderRadius: RADIUS.md, padding: '12px 16px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: RADIUS.full,
                  background: PLAYER_COLORS[globalIdx] + '22',
                  border: `2px solid ${PLAYER_COLORS[globalIdx]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {AVATAR_EMOJI[p.avatar]}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
                  <span>Spins: <span style={{ color: C.teal, fontWeight: 600 }}>{p.spins}</span></span>
                  <span>Done: <span style={{ color: C.green, fontWeight: 600 }}>{p.completed}</span></span>
                  <span>Skip: <span style={{ color: C.amber, fontWeight: 600 }}>{p.skipped}</span></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setPhase('setup');
              setPlayers(prev => prev.map(p => ({ ...p, spins: 0, skipped: 0, completed: 0, boldest: 0 })));
              setRoundCount(0);
              setPassesLeft(3);
              setTargetPlayer(null);
              setCurrentChallenge(null);
              setBottleAngle(0);
              setSpinnerIdx(0);
              sfxTap();
            }}
            style={{
              ...solidBtn(MODE_META[mode].color),
              flex: 1, padding: '14px', borderRadius: RADIUS.md,
              fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '14px', borderRadius: RADIUS.md,
              fontSize: 15, fontWeight: 600, border: `1px solid ${C.border}`,
              background: C.card, color: C.muted, cursor: 'pointer',
            }}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
