import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, X, Play, Heart, Skull, Trophy, Crown, Sparkles, Users, ChevronRight, RotateCcw, Hand, Flame, Shield, PenLine, Trash2, AlertTriangle } from 'lucide-react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxReveal, sfxLevelUp } from '../lib/sfx';

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
  rose: '#f43f5e',
  emerald: '#00c97b',
  amber: '#f59e0b',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  teal: '#00b4d8',
  coral: '#ff6b6b',
  gold: '#fbbf24',
  glass: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
  glassHover: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)',
} as const;

/* ------------------------------------------------------------------ */
/*  Mode definitions                                                   */
/* ------------------------------------------------------------------ */
type Mode = 'clean' | 'spicy' | 'custom';

const MODE_META: Record<Mode, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  clean: { label: 'Clean', color: C.emerald, icon: <Shield size={18} />, description: 'Family-friendly fun for mixed groups' },
  spicy: { label: 'Spicy', color: C.rose, icon: <Flame size={18} />, description: 'Adults only — genuinely provocative' },
  custom: { label: 'Custom', color: C.violet, icon: <PenLine size={18} />, description: 'Add your own statements to the mix' },
};

const CUSTOM_STORAGE_KEY = 'kasuku-nhie-custom';

/* ------------------------------------------------------------------ */
/*  Statements — 80+ per mode                                          */
/* ------------------------------------------------------------------ */
const CLEAN_STATEMENTS: string[] = [
  'been on a plane',
  'eaten sushi',
  'pulled an all-nighter',
  'been to a concert',
  'had a pet fish',
  'gone camping',
  'broken a bone',
  'been on TV',
  'met someone famous',
  'won a trophy',
  'been to a wedding',
  'dyed my hair',
  'ridden a horse',
  'been to another country',
  'eaten an entire pizza by myself',
  'fallen asleep in class',
  'been in a food fight',
  'gone skiing or snowboarding',
  'gotten a speeding ticket',
  'sung karaoke',
  'been to a theme park',
  'stayed up for 24 hours straight',
  'read an entire book in one day',
  'lost my phone',
  'been stung by a bee',
  'cooked a meal from scratch',
  'bungee jumped',
  'gone skydiving',
  'swum with sharks',
  'climbed a mountain',
  'tried surfing',
  'traveled solo to a foreign country',
  'slept outside under the stars',
  'gone scuba diving',
  'ridden a motorcycle',
  'gone white water rafting',
  'gone zip-lining',
  'called a teacher "mom" or "dad"',
  'waved at someone who was not waving at me',
  'sent a text to the wrong person',
  'walked into a glass door',
  'tripped in public and pretended to jog',
  'laughed so hard I snorted',
  'had food stuck in my teeth all day',
  'forgotten someone\'s name right after they told me',
  'been caught talking to myself',
  'walked into the wrong bathroom',
  'tried to push a pull door in front of people',
  'worn my shirt inside out all day without noticing',
  'said goodbye to someone then walked the same direction',
  'replied "you too" when a waiter said "enjoy your meal"',
  'accidentally liked an old photo while scrolling',
  'been caught singing loudly in my car',
  'spilled a drink on someone at a party',
  'cried during a movie in the theater',
  'talked to my pet like a human',
  'pretended to text to avoid someone',
  'faked being sick to skip something',
  'eaten food off the floor',
  'let someone else take the blame',
  'forgotten my own phone number',
  'walked into a room and forgot why',
  'gotten lost in my own city',
  'worn mismatched socks on purpose',
  'binge-watched an entire series in one day',
  'done karaoke completely sober',
  'been scared by my own reflection',
  'laughed at something I should not have',
  'had a dream so good I tried to go back to sleep',
  'accidentally called someone the wrong name to their face',
  'burned food so badly the smoke alarm went off',
  'danced alone in my room for over an hour',
  'waved back at someone waving to the person behind me',
  'been the last person picked for a team',
  'cried over a commercial',
  'pretended to know a song and made up the lyrics',
  'gone an entire day without realizing I had something on my face',
  'fallen off a chair in public',
  'accidentally hit reply-all',
  'slept through an alarm for something important',
  'locked myself out of my house',
  'had my stomach growl incredibly loudly in a quiet room',
  'said something out loud I meant to say in my head',
  'thought today was a different day of the week',
  'eaten cereal for dinner more than three nights in a row',
  'ridden in a hot air balloon',
  'gotten a passport stamp in another country',
  'taken a road trip over 500 miles',
  'slept in an airport overnight',
  'missed a flight',
  'gotten seasick on a boat',
  'fed a wild animal',
  'held a snake',
  'milked a cow',
  'ridden a camel',
  'gone on a safari',
  'seen the northern lights',
  'gone stargazing far from the city',
  'ridden the same roller coaster ten times in a row',
  'gone to a drive-in movie',
  'toured a castle',
  'gotten lost on a hike',
  'planted a tree',
  'grown my own vegetables',
  'kept a houseplant alive for over a year',
  'built a sandcastle',
  'flown a kite',
  'gone sledding',
  'built a snowman',
  'had a snowball fight',
  'ice skated',
  'roller skated',
  'learned to juggle',
  'solved a Rubik\'s cube',
  'learned a magic trick',
  'played an instrument in front of people',
  'written a poem',
  'kept a journal for a whole month',
  'read the same book more than three times',
  'finished a 1000-piece puzzle',
  'painted a picture I was proud of',
  'knitted or crocheted something',
  'baked bread from scratch',
  'made homemade pasta',
  'decorated a cake',
  'burned popcorn in the microwave',
  'tried a food I could not pronounce',
  'eaten a bug on a dare',
  'eaten the last slice without asking',
  'finished an entire tub of ice cream in one sitting',
  'eaten breakfast food for dinner',
  'put pineapple on pizza',
  'dipped fries in a milkshake',
  'eaten cereal without milk',
  'secretly loved a food I claimed to hate',
  'worn the same outfit two days in a row hoping nobody noticed',
  'pretended to understand something I did not',
  'clapped when the plane landed',
  'gotten a song stuck in my head for a whole day',
  'talked in my sleep',
  'sleepwalked',
  'fallen asleep during a movie at the cinema',
  'snored so loudly I woke myself up',
  'mixed up a pair of twins',
  'forgotten a close friend\'s birthday',
  'regifted a present',
  'pretended to like a gift I hated',
  'worn clothes with the tag still on',
  'left the house in my slippers by accident',
  'gone grocery shopping hungry and overbought',
  'bought something just because it was on sale',
  'named my car',
  'talked to a plant to help it grow',
  'pretended to be on the phone to avoid small talk',
  'crossed the street to avoid someone I knew',
  'ducked behind a shelf to dodge someone',
  'hidden from someone at a party',
  'left someone on read for over a week',
  'rehearsed a text before sending it',
  'typed a long message then deleted all of it',
  'pretended my phone died to end a call',
  'fallen for an April Fools prank',
  'believed a fake fact for years',
  'argued about something then realized I was wrong',
  'gotten on the wrong bus or train',
  'gone up the down escalator by mistake',
  'pulled a muscle sneezing',
  'stubbed my toe and said words I regret',
  'walked into a lamppost while looking at my phone',
  'dropped my phone on my own face',
  'spilled coffee on myself before an important day',
  'worn two different shoes out of the house',
  'put my shirt on backwards without noticing',
  'forgotten to unmute on a video call',
  'stayed muted and said something embarrassing on a call',
  'gone back inside three times before finally leaving',
  'searched for my glasses while wearing them',
  'looked for my keys with them in my hand',
  'let a kid win at a game',
  'cheated at a board game',
  'blamed the dog for something',
  'pretended to be asleep to avoid chores',
  'shoved a mess into a closet before guests arrived',
  'rewashed clean dishes because I forgot they were clean',
  'microwaved my coffee three times and never drank it',
  'made a to-do list just to feel productive',
  'procrastinated by cleaning instead of working',
  'started a hobby and quit within a week',
  'signed up for a gym and barely went',
  'watched a tutorial and still could not do it',
  'assembled furniture with leftover screws',
  'read the instructions only after it broke',
  'fixed something with tape and hoped for the best',
  'cried happy tears at a wedding',
  'gotten emotional over a cute animal video',
  'rewatched a childhood cartoon as an adult',
  'been the only one who dressed up for an event',
  'been the only one who did not dress up',
  'shown up a day early for an appointment',
  'set five alarms and slept through all of them',
  'hit snooze more than five times in a row',
  'fallen asleep on public transport and missed my stop',
  'laughed so hard that no sound came out',
  'had the hiccups for over an hour',
  'sneezed more than ten times in a row',
  'gotten brain freeze from eating too fast',
  'bitten my tongue while eating',
  'choked on my own spit in public',
  'forgotten what I was saying mid-sentence',
  'walked into a spider web and panicked',
  'screamed at a harmless bug',
  'jumped at my own shadow',
  'refused to watch a scary movie alone',
  'slept with the lights on after a horror film',
  'checked behind the shower curtain just in case',
  'gotten a nosebleed at the worst possible time',
  'sneezed into my own hand and had nowhere to go',
  'waved at a mannequin thinking it was a person',
  'said "happy birthday" to the wrong person',
  'started laughing in a completely silent room',
  'forgotten where I parked the car',
  'left my card at a restaurant and had to go back',
  'tried to scan the wrong side of my card',
  'held a door for someone who was way too far away',
  'said "you as well" to a happy birthday',
  'lost a staring contest to a pet',
  'gotten competitive over a casual board game',
  'talked over someone and both of us went silent',
  'started a sentence and completely lost the point',
  'texted "on my way" while still in bed',
  'said I read the article when I only read the headline',
  'nodded along to a story I completely missed',
  'clapped at the end of a school play out of habit',
  'saved a seat for a whole movie for no one',
  'overpacked for a two-day trip',
  'forgotten my charger and panicked all day',
  'pretended my dead battery ended a conversation',
  'walked confidently in the wrong direction',
  'followed a stranger thinking they were my group',
  'gotten way too invested in a reality show',
  'ranked my snacks in order of preference',
  'reorganized a whole drawer to avoid a task',
  'talked myself out of going out at the last minute',
  'changed outfits five times and wore the first one',
  'practiced what I would say and then froze',
  'laughed at my own joke before finishing it',
  'used a fake name for a coffee order',
  'kept over fifty browser tabs open at once',
  'had over a thousand unread emails',
  'ignored a software update for months',
  'blamed the wifi for my own mistake',
  'rage-quit a video game',
  'stayed up way too late for just one more level',
  'googled an answer during a trivia night',
  'sent a message before I finished typing it',
  'called someone by accident from my pocket',
  'left a voicemail I immediately regretted',
  'taken over a hundred photos to get one good selfie',
  'saved a contact under a joke name and forgot who it was',
  'fallen asleep during a meeting',
  'pretended to take notes while doodling',
  'sent an email without the attachment I mentioned',
  'scheduled a meeting that could have been an email',
  'nodded in a meeting without understanding anything',
  'pretended to be busy when the boss walked by',
  'hidden in the break room to avoid a coworker',
  'used a vacation day to do absolutely nothing',
  'copied homework right before class',
  'passed a note in class',
  'gotten in trouble for talking in class',
  'raised my hand and then forgot the answer',
  'faked a stomachache to leave school early',
  'been sent to the principal\'s office',
  'had an imaginary friend as a kid',
  'thrown a tantrum in a store as a kid',
  'hidden vegetables under my plate as a kid',
  'built a blanket fort',
  'refused to eat a food because of its color',
  'cried on the first day of school',
  'followed a recipe and it looked nothing like the photo',
  'eaten something past its expiration date on purpose',
  'tasted food to check if it had gone bad',
  'eaten straight out of the pot to avoid dishes',
  'made a sandwich at two in the morning',
  'eaten dessert before dinner',
  'ordered the same thing at a restaurant every single time',
  'sent food back at a restaurant',
  'pretended a meal was homemade when it was store-bought',
  'eaten an entire bag of chips without noticing',
  'drunk milk straight from the carton',
  'double-dipped a chip at a party',
  'missed my exit because I was daydreaming',
  'driven around lost instead of asking for directions',
  'parked terribly and walked away quickly',
  'left my car running while I ran inside',
  'waved a thank you to a car that did nothing',
  'bought something and never used it',
  'kept an item in my online cart for weeks',
  'bought the exact thing I already owned',
  'hovered over the buy button for twenty minutes',
  'let my pet sleep in the bed',
  'taken more photos of my pet than of people',
  'made up a song about my pet',
  'apologized to a pet after stepping on it',
  'skipped the gym and felt guilty all day',
  'bought workout clothes and never worked out',
  'given up on a diet by lunchtime',
  'told myself I would start on Monday',
  'downloaded a fitness app and never opened it again',
  'complained about the weather no matter what it was',
  'refused to wear a coat and regretted it',
  'stayed inside all day during perfect weather',
  'eaten too much at a holiday dinner and regretted it',
  'left holiday decorations up way too long',
  'forgotten to buy a gift until the last minute',
  'wrapped a present so badly I gave up and used a bag',
  'talked to the TV during a show',
  'made a playlist and never listened to it',
  'saved a box because it might be useful someday',
  'started cleaning one thing and cleaned the whole house',
  'made my bed only when guests were coming',
  'worn clean clothes straight from the dryer',
  'forgotten why I opened the fridge',
  'stood in front of the fridge hoping new food appeared',
  'left a drink somewhere and lost it',
  'used the last of something and put the empty container back',
  'zoned out during an important conversation',
  'agreed to plans I had no intention of keeping',
  'canceled plans and felt instant relief',
  'pretended to be busy to avoid making plans',
  'said I was five minutes away while still getting dressed',
  'set a reminder and ignored it anyway',
  'renewed a subscription I never use',
  'forgotten to cancel a free trial and got charged',
  'gotten the giggles at the worst possible time',
  'called someone by the wrong name twice in a row',
  'pretended to remember someone I had completely forgotten',
  'held the elevator and regretted the small talk',
  'walked into a room full of people and immediately left',
  'sat in the wrong seat at a theater',
  'clapped at the wrong time at a performance',
  'agreed with an opinion just to end an argument',
  'thought of the perfect comeback hours too late',
  'practiced a comeback in the shower',
  'rehearsed a phone call before making it',
  'hung up before saying goodbye by accident',
  'let the phone ring out because I did not want to talk',
  'pretended not to be home',
  'turned off the lights so it looked like no one was home',
  'stayed in bed scrolling for an hour after waking up',
  'promised myself an early night and failed',
  'fallen asleep with the TV on',
  'woken up with my phone on my face',
  'checked my phone first thing in the morning',
  'gone down an internet rabbit hole at three in the morning',
  'read reviews for an hour before buying something small',
  'abandoned an online cart because shipping was too high',
  'signed up for a newsletter just for a discount',
  'let a bug outside instead of squishing it',
  'regretted a haircut immediately',
  'cut my own hair and regretted it',
  'worn a hat all day to hide a bad hair day',
  'realized too late I had something in my teeth',
  'walked around with my zipper down',
  'had toilet paper stuck to my shoe',
  'discovered a stain on my shirt hours later',
  'spat out a drink laughing',
  'burped louder than expected in public',
  'yawned so wide my jaw clicked',
  'tripped going up the stairs',
  'missed a step and played it cool',
  'slipped on a wet floor in public',
  'dropped my tray in a cafeteria',
  'knocked over a display in a store',
  'pretended a small injury did not hurt',
  'walked into furniture in the dark',
  'laughed so hard my stomach hurt',
  'cried from laughing too hard',
  'hummed a song out loud without realizing',
  'lost my voice from talking too much',
  'talked so much I forgot to eat',
  'forgotten to eat until dinner',
  'skipped breakfast and regretted it by ten',
  'eaten lunch at four in the afternoon',
  'had coffee so late I could not sleep',
  'drunk way too much soda in one sitting',
  'stayed on hold for over an hour',
  'given up on a customer service call',
  'pressed zero repeatedly to reach a human',
  'been transferred and had to explain everything again',
  'read the terms and conditions before agreeing',
  'clicked agree without reading anything',
  'forgotten a password I just created',
  'reset a password and chose the same one',
  'written a password on a sticky note',
  'used the same password for everything',
  'skipped to the end of a book to see what happens',
  'started a book and never finished it',
  'bought a book for the cover',
  'judged a movie before watching it',
  'fallen asleep during a movie everyone loved',
  'pretended to like a popular show',
  'spoiled a show for someone by accident',
  'been spoiled and pretended I did not care',
  'watched a whole series just for one character',
  'rewatched a comfort show for the tenth time',
  'danced when I thought no one was watching',
  'sung into a hairbrush like a microphone',
  'made up dance moves in the kitchen',
  'lip-synced in the mirror',
  'given myself a pep talk out loud',
  'celebrated a tiny victory way too much',
  'done a happy dance over good news',
  'talked to myself to solve a problem',
  'narrated my own actions out loud',
  'answered my own question before anyone could',
  'forgotten what I walked into a store to buy',
  'gone shopping for one thing and left with ten',
  'bought snacks and finished them in the car',
  'eaten the free samples and left',
  'asked for extra napkins I did not need',
  'taken the little shampoo bottles from a hotel',
  'kept a pen from a bank or hotel',
  'collected receipts I never looked at again',
  'kept a shopping bag full of shopping bags',
  'saved twist ties and rubber bands for no reason',
  'made a list and then lost the list',
  'wrote a reminder and forgot to read it',
  'set an alarm for the wrong time',
  'set an alarm and turned it off in my sleep',
  'woken up convinced I was late when it was the weekend',
  'panicked over a deadline that was next week',
  'procrastinated and then rushed at the last minute',
  'pulled off something at the very last second',
  'promised to do it tomorrow for a whole week',
  'started strong on a plan and quietly gave up',
  'joined a video call with my camera off to hide pajamas',
  'worn nice clothes on top and pajamas on the bottom for a call',
  'pretended to freeze on a call to avoid a question',
  'muted myself to sneeze during a meeting',
  'left a call and realized I was still sharing my screen',
  'sent a thumbs up because I did not know what to say',
  'reacted to the wrong message in a group chat',
  'left a group chat and immediately felt left out',
  'muted a group chat and missed something important',
  'read a message and forgot to reply for days',
  'typed a reply and never sent it',
  'started a text and finished it an hour later',
  'sent a message to the wrong group chat',
  'liked my own post by accident',
  'commented and then deleted it out of embarrassment',
  'posted something and deleted it minutes later',
  'closed an app and reopened it out of boredom',
  'kept opening an app expecting something new',
  'stalked my own profile to see how it looks',
  'untagged myself from an unflattering photo',
  'kept a photo I look bad in just because a friend looks good',
  'retaken a group photo because of how I looked',
  'asked to see a photo before it was posted',
  'made a weird face right as a photo was taken',
  'blinked in every single group photo',
  'photobombed a stranger\'s picture',
  'pretended to be in deep thought for a photo',
  'practiced a candid pose in the mirror',
  'used the same pose in every photo',
  'deleted hundreds of blurry photos at once',
  'kept screenshots I never looked at again',
  'had thousands of unsorted photos on my phone',
  'run out of storage at the worst moment',
  'ignored the storage full warning for months',
  'kept apps I have never once opened',
  'downloaded an app for one thing and never deleted it',
  'left my phone at one percent all day',
  'carried a charger everywhere just in case',
  'borrowed a charger and forgot to give it back',
  'used my phone until it died mid-task',
  'talked during a movie and got shushed',
  'kicked the seat in front of me by accident',
  'arrived late and climbed over a whole row',
  'saved seats and felt guilty about it',
  'sneaked snacks into a cinema',
  'laughed alone at something on my phone in public',
  'made eye contact with a stranger and looked away fast',
  'smiled at someone who was smiling at the person behind me',
  'said thanks to a machine',
  'apologized to a chair I bumped into',
  'apologized when someone else stepped on my foot',
  'held a door and got a marathon of thank-yous',
  'held the door with my foot and nearly fell',
  'done the awkward sidewalk shuffle with a stranger',
  'said the wrong greeting for the time of day',
  'answered a question that was not for me',
  'laughed at a joke a beat too late',
  'clapped when no one else did',
  'started singing happy birthday off-key and too early',
  'blown out a candle that was not on my cake',
  'made a wish on birthday candles and told everyone',
  'kept a birthday card for years',
  'forgotten my own age for a second',
  'had to count on my fingers to do simple math',
  'used a calculator for an easy sum',
  'lost track of what day it was on holiday',
  'slept in so late it felt like a new day',
  'taken a nap that lasted way too long',
  'woken up from a nap more tired than before',
  'gone to bed early and scrolled until midnight anyway',
];

const SPICY_STATEMENTS: string[] = [
  'sent a nude',
  'had a crush on my friend\'s partner',
  'been caught doing something I shouldn\'t',
  'hooked up with someone I met that day',
  'lied about my body count',
  'had a one night stand',
  'been walked in on during sex',
  'sent a text to the wrong person that was meant to be dirty',
  'kissed someone of the same gender',
  'done something sexual in a public place',
  'faked an orgasm',
  'slept with an ex after the breakup',
  'had a friends-with-benefits arrangement',
  'ghosted someone after sleeping with them',
  'been the other woman or the other man',
  'had a threesome',
  'sexted a stranger',
  'been handcuffed or tied up',
  'hooked up with a coworker',
  'been caught watching porn',
  'slept with someone to get over someone else',
  'had sex in a car',
  'used a dating app just for hookups',
  'lied about my age to someone I was interested in',
  'had a sugar daddy or sugar mama',
  'flirted my way out of a ticket',
  'kissed someone at midnight on New Year\'s who I didn\'t know',
  'gone commando to an important event',
  'drunk-texted an ex',
  'had a walk of shame',
  'skinny-dipped with strangers',
  'been in a love triangle',
  'had sex on the first date',
  'made out with someone in a bathroom',
  'been propositioned by someone much older',
  'told someone I loved them and didn\'t mean it',
  'kept a relationship secret',
  'had phone sex',
  'been to a strip club',
  'hooked up with someone whose name I didn\'t know',
  'pretended to be single when I wasn\'t',
  'had a crush on a teacher or professor',
  'role-played in the bedroom',
  'screenshotted someone\'s DMs to show my friends',
  'stalked an ex\'s new partner on social media',
  'gone back to someone I said I was done with',
  'let someone take a suggestive photo of me',
  'slid into someone\'s DMs at 2 AM',
  'been turned on at a completely inappropriate time',
  'had a fantasy about someone in this room',
  'made out with two different people in the same night',
  'been kicked out of a bar or club',
  'done a body shot',
  'woken up next to someone and not remembered how I got there',
  'cheated on a partner',
  'been cheated on and stayed',
  'had an affair with a married person',
  'told a lie to get someone into bed',
  'been caught sneaking someone out in the morning',
  'sent a spicy photo to the wrong person',
  'had sex in someone else\'s bed without them knowing',
  'been to an adult store with friends',
  'used food during intimacy',
  'been with someone more than ten years older or younger',
  'had a rebound that turned into a relationship',
  'flashed someone intentionally',
  'made a sex tape',
  'had a no-strings-attached vacation fling',
  'lied about where I was to hook up with someone',
  'had a crush on my best friend',
  'been in a relationship where the physical part was the only good part',
  'tried to make someone jealous on purpose',
  'hooked up at a house party while people were in the next room',
  'been caught making out in public by someone I knew',
  'matched with someone I know on a dating app and swiped right',
  'had a secret social media account for flirting',
  'told my friends a hookup was better than it actually was',
  'given a fake number to someone hitting on me',
  'had a situationship that lasted over six months',
  'kept dating someone just because the sex was good',
  'been so attracted to someone I couldn\'t form words',
  'used someone\'s Netflix after we stopped seeing each other',
  'practiced kissing on my hand or a pillow',
  'had a romantic dream about a friend and acted weird around them after',
  'kissed someone within an hour of meeting them',
  'had a crush on two people at the same time',
  'dated two people at once without either knowing',
  'lied on a dating profile',
  'used an old flattering photo on a dating app',
  'catfished someone as a joke',
  'swiped right on everyone just for an ego boost',
  'matched with an ex on a dating app',
  'matched with a friend\'s ex on a dating app',
  'gone on a date just for a free meal',
  'left a date early with a fake excuse',
  'had a friend call me to escape a bad date',
  'texted my friends under the table during a date',
  'rated a date out of ten to my friends afterward',
  'shown my friends someone\'s photos before a date',
  'googled a date before meeting them',
  'checked a crush\'s relationship status online',
  'unfollowed an ex and then refollowed them later',
  'kept an ex\'s hoodie after breaking up',
  'kept gifts from an ex I should have returned',
  'reread old messages from an ex',
  'cried listening to a breakup song',
  'made a playlist inspired by someone',
  'written a text to an ex and never sent it',
  'driven past a crush\'s neighborhood on purpose',
  'memorized a crush\'s schedule',
  'shown up somewhere hoping to run into someone',
  'pretended a run-in was a coincidence',
  'flirted to get a discount',
  'flirted with someone to make an ex jealous',
  'posted a photo just so one person would see it',
  'posted a story and obsessively checked who viewed it',
  'deleted a post because it got too few likes',
  'fished for compliments online',
  'had a celebrity crush for years',
  'daydreamed about a stranger on the train',
  'checked someone out and got caught',
  'used a cheesy pickup line that actually worked',
  'used a pickup line and got shut down',
  'been rejected in front of my friends',
  'confessed feelings and got friend-zoned',
  'friend-zoned someone who confessed to me',
  'pretended not to notice someone flirting with me',
  'replied to a text a week late on purpose',
  'double-texted and immediately regretted it',
  'typed and deleted a risky message ten times',
  'screenshotted a flirty text to show my friends',
  'had a group chat dedicated to my love life',
  'asked my friends to write a text for me',
  'chickened out of asking someone out',
  'had someone ask my friend if I was single',
  'given a fake name to someone at a bar',
  'pretended not to speak the language to dodge someone',
  'danced with a stranger all night',
  'lost track of my friends at a party',
  'lost my shoes at a party',
  'fallen asleep at someone else\'s place after a night out',
  'sung karaoke way too confidently after a few drinks',
  'texted way too many people in one night',
  'made questionable decisions after midnight',
  'gotten a tattoo on a whim',
  'almost got matching tattoos with someone',
  'kissed a friend and pretended it never happened',
  'caught feelings for a gym crush',
  'had a work crush I never acted on',
  'lingered by the coffee machine hoping to see someone',
  'volunteered for a task just to be near a crush',
  'laughed too hard at a crush\'s bad joke',
  'agreed with someone just because I liked them',
  'changed my music taste to impress someone',
  'pretended to like a sport to impress a date',
  'learned to cook to impress someone',
  'overdressed for a first date',
  'spent way too long picking a first-date outfit',
  'rehearsed conversation topics before a date',
  'talked about the weather for an entire nervous date',
  'ghosted someone after three great dates',
  'been ghosted and overthought it for weeks',
  'stayed friends with an ex to keep my options open',
  'kept someone on the back burner',
  'said yes to a date purely out of politeness',
  'introduced a date by the wrong name',
  'forgotten a date\'s name mid-conversation',
  'run into a date while on another date',
  'been set up on a blind date by friends',
  'exaggerated a story to sound more interesting',
  'name-dropped to impress someone',
  'pretended to have read a book to impress a date',
  'claimed to love a band I had never heard of',
  'had a diary entry about a crush discovered',
  'left a browser tab open at the worst possible time',
  'had my texts read over my shoulder',
  'been caught staring at someone across a room',
  'imagined a whole future with someone I just met',
  'analyzed a single text with my friends for an hour',
  'overanalyzed an emoji someone sent',
  'read way too much into a like',
  'assumed someone liked me and was completely wrong',
  'misread a friendly gesture as flirting',
  'gotten butterflies over a simple hello',
  'blushed so hard that people noticed',
  'lost my words in front of someone attractive',
  'tripped trying to look cool in front of a crush',
  'checked my breath before talking to someone',
  'kept mints on hand just in case of a moment',
  'rehearsed asking for a number and still fumbled it',
  'gotten a number and never called',
  'given my number and desperately hoped they would call',
  'saved a crush under a code name in my phone',
  'had a secret nickname for a crush with my friends',
  'invented a reason to text someone',
  'asked a pointless question just to start a chat',
  'liked every recent post to get noticed',
  'muted someone but still checked their profile daily',
  'kept tabs on an ex through a mutual friend',
  'felt a spark with someone I really should not have',
  'had instant chemistry with a total stranger',
  'shared an umbrella with a stranger and loved it',
  'had a summer romance that quietly fizzled out',
  'had a long-distance crush',
  'fallen for an online friend I had never met',
  'had my heart skip over a voice message',
  'replayed a compliment in my head for days',
  'kept a screenshot of a sweet message for months',
  'stalked a crush\'s public playlist for clues',
  'faked being over someone I was not over at all',
  'agreed to "just one drink" that turned into a whole night',
  'pretended a text was accidental when it was very much on purpose',
  'let a call go to voicemail to seem less available',
  'waited a strategic amount of time before replying',
  'looked up a date\'s ex out of pure curiosity',
  'compared myself to a partner\'s ex',
  'kept a conversation going just to avoid saying goodbye',
  'stayed up all night talking to someone new',
  'walked someone the long way home on purpose',
  'pretended to be lost to spend more time with someone',
  'lied about being busy to see if someone would chase',
  'made a playlist for a date and overthought every song',
  'rehearsed a breakup speech in the mirror',
  'practiced a confession and then completely froze',
  'sent a risky text and then turned my phone face down',
  'refreshed a chat waiting for the typing dots',
  'told a white lie about my weekend to seem more interesting',
  'kept an admirer around just for the attention',
  'enjoyed the chase more than the relationship',
  'kissed someone on a dare',
  'played spin the bottle',
  'played truth or dare and regretted the truth',
  'skipped truth and always picked dare',
  'had a crush on someone way out of my league',
  'flirted with a bartender for a free drink',
  'gotten a free drink sent to my table',
  'bought a stranger a drink',
  'been bought a drink and pretended not to notice',
  'winked at someone and immediately felt ridiculous',
  'left a club with someone I had just met',
  'given someone my number written on a napkin',
  'slow-danced with someone I had just met',
  'made the first move',
  'been too shy to make the first move and regretted it',
  'texted first and felt bold about it',
  'waited by the phone for a text back',
  'played it cool while completely freaking out inside',
  'pretended a date meant nothing when it meant everything',
  'caught feelings way too fast',
  'said I love you first',
  'been the first to say I love you and regretted the timing',
  'planned a whole relationship before the second date',
  'imagined introducing someone to my family too soon',
  'picked out baby names in my head over a crush',
  'stalked a crush\'s entire photo history',
  'scrolled so far back on a crush\'s profile I almost tapped like',
  'followed a crush\'s friends to see more photos',
  'memorized a crush\'s coffee order',
  'changed my route to walk past a crush more often',
  'kept flirting even though I knew it was a bad idea',
  'flirted with two people at the same party',
  'let someone think I was interested to keep the attention',
  'gave mixed signals on purpose',
  'played hard to get and overdid it',
  'pretended not to care while caring a lot',
  'acted uninterested to seem more interesting',
  'texted back instantly then pretended I was busy',
  'sent a flirty selfie and overthought it after',
  'read way too much into a good-morning text',
  'reread a flirty conversation before falling asleep',
  'fell asleep mid-text and left them hanging',
  'talked on the phone until we both fell asleep',
  'said one more thing just to hear them talk longer',
  'signed up for something boring because a crush did too',
  'joined a club to get closer to someone',
  'sat next to my crush on purpose',
  'saved a seat for someone hoping they would take it',
  'let my hand linger near someone\'s on purpose',
  'engineered an accidental touch',
  'gave someone butterflies and knew it',
  'felt my heart race when a certain name lit up my phone',
  'forgot what I was saying when they walked in',
  'agreed to something ridiculous just to impress someone',
  'dressed up nice hoping a certain someone would notice',
  'changed my outfit last minute for a specific person',
  'wore perfume or cologne for one particular person',
  'checked my reflection before a crush walked by',
  'practiced flirting in the mirror',
  'planned a smooth line and blurted something silly instead',
  'kissed someone in the rain',
  'had a movie-worthy first kiss',
  'had a truly awkward first kiss',
  'bumped teeth during a kiss',
  'missed and kissed a cheek by accident',
  'went in for a hug and it got awkward',
  'held hands for the first time and got nervous',
  'had a first date that lasted until sunrise',
  'talked for hours on a first date and lost track of time',
  'ended a date not wanting it to end',
  'planned a second date before the first one ended',
  'called a friend right after a date to replay every detail',
  'replayed a date in my head all night',
  'smiled at my phone rereading their texts',
  'set a special ringtone for one person',
  'gave someone a cute nickname',
  'doodled someone\'s name when I was bored',
  'wrote initials in a heart like a teenager',
  'kept a ticket stub from a first date',
  'pressed a flower from a bouquet someone gave me',
  'daydreamed through a whole meeting about someone',
  'got caught smiling at nothing thinking about someone',
  'told my friends about a crush before anything happened',
  'sworn my friends to secrecy about a crush',
  'begged my friends to decode what a look meant',
  'asked a mutual friend to put in a good word',
  'used a friend to find out if someone was single',
  'passed a note asking do you like me yes or no',
  'confessed a crush and immediately wanted to take it back',
  'blurted out my feelings and then went quiet',
  'got rejected and laughed it off in the moment',
  'got rejected and replayed it for weeks',
  'rejected someone as gently as I could',
  'let someone down easy and felt terrible',
  'realized too late that I had feelings for a friend',
  'wondered what if about the one that got away',
  'thought about an ex at a random moment',
  'compared everyone new to an ex',
  'kept an ex\'s number just in case',
  'almost texted an ex at midnight and stopped myself',
  'wondered if an ex ever thinks about me',
  'liked an ex\'s post and immediately unliked it',
  'kept following an ex just to watch from afar',
  'unfriended an ex only to check their profile as a guest',
  'felt a pang seeing an ex looking happy',
  'celebrated a little when an ex\'s new thing fell apart',
  'reached out to an ex when I was lonely',
  'promised to stay friends knowing it would not last',
  'run into an ex and pretended I was doing great',
  'dressed up on purpose before seeing an ex',
  'had a crush on a friend\'s sibling',
  'currently have a crush on someone playing this game',
  'developed a crush over text before meeting in person',
  'had a crush on someone I only see online',
  'fallen for someone\'s voice before seeing their face',
  'been attracted to someone the moment they laughed',
  'found an accent completely irresistible',
  'been won over by someone who could cook',
  'fallen for someone just because they were kind',
  'had my head turned by a good sense of humor',
  'flirted in a language I barely speak',
  'used a translation app to flirt with someone',
  'had a vacation crush I never told anyone about',
  'exchanged glances with a stranger across a room all night',
  'played a game of who looks away first',
  'sat closer to someone than I needed to',
  'offered my jacket to someone to seem sweet',
  'walked someone to their door and lingered',
  'planned the perfect goodnight moment in my head',
  'overthought whether to go in for a kiss',
  'sent a text and read it back a hundred times after',
  'had a committee of friends approve my text before sending',
  'drafted a bold message and sent the boring version',
  'added and removed an emoji five times before sending',
  'agonized over whether to use a heart or not',
  'sent a single letter reply and panicked',
  'double-texted and then triple-texted',
  'apologized for double-texting in the double text',
  'left a flirty voice note and cringed replaying it',
  'called instead of texting and immediately regretted it',
  'flirted through a video game',
  'let someone win a game to flirt',
  'lost a game on purpose to keep someone around',
  'made a bet with a flirty prize',
  'played footsie under a table',
  'passed secret notes during a boring event',
  'texted someone across the same room',
  'shared earbuds with someone and felt sparks',
  'fell asleep on someone\'s shoulder on purpose',
  'pretended to be cold so someone would offer a hug',
  'had a slow-burn crush that lasted years',
  'pined over someone who had no idea',
  'loved someone from afar and never said a word',
  'watched someone date other people while I stayed quiet',
  'missed my chance and always wondered',
  'confessed years later at a reunion',
  'reconnected with an old flame out of nowhere',
  'rekindled something that should have stayed in the past',
  'had a will-they-wont-they with someone for ages',
  'kept orbiting someone I could not commit to',
  'dated someone just to not be alone',
  'stayed in a relationship out of comfort',
  'ignored red flags because I liked someone',
  'made excuses for someone who did not deserve it',
  'gave too many second chances',
  'forgave something I said I never would',
  'unblocked someone I swore to never speak to again',
  'blocked and unblocked someone more than once',
  'deleted a number and then asked a friend for it again',
  'said this is the last time and meant none of it',
  'kept a situationship going with no label',
  'avoided the what are we conversation for months',
  'panicked when someone asked to define the relationship',
  'said I was fine with casual when I was not',
  'caught real feelings in something meant to be casual',
  'wanted more but pretended I was happy with less',
  'ended things because they wanted more than I did',
  'ghosted because I did not know how to say goodbye',
  'came back after ghosting like nothing happened',
  'sent a paragraph after weeks of silence',
  'kept a conversation alive out of boredom',
  'entertained a text from someone I was not into',
  'enjoyed the compliments without any real interest',
  'flirted back just because it felt nice',
  'liked being wanted more than I liked the person',
  'stayed in a chat just so my phone would buzz',
  'felt a thrill when a certain notification popped up',
  'checked my phone constantly hoping for one name',
  'set the whole day around a maybe from someone',
  'canceled plans on the chance someone else might text',
  'introduced a fling to my friends too early',
  'brought a date to a wedding after two weeks',
  'pretended a fling was more serious to my family',
  'lied to my parents about who I was seeing',
  'sneaked someone past my roommates',
  'kept a relationship off social media on purpose',
  'made a relationship official online way too fast',
  'posted a couple photo and deleted it after a fight',
  'stalked the tagged photos of someone I was seeing',
  'checked a new partner\'s following list a little too closely',
  'felt jealous over something completely harmless',
  'got jealous of an ex I had no claim to',
  'compared my relationship to ones I saw online',
  'envied a couple that turned out to be faking it',
  'kept score in a relationship',
  'brought up an old argument at the worst time',
  'won an argument just to lose the mood',
  'gave the silent treatment and cracked first',
  'apologized just to end a fight, not because I meant it',
  'texted paragraphs then said never mind',
  'planned an elaborate way to ask someone out',
  'asked someone out and immediately walked away fast',
  'wrote a love letter and never delivered it',
  'left an anonymous note for a crush',
  'sent flowers without signing my name',
  'burned a CD of songs that reminded me of someone',
  'dedicated a song to someone in secret',
  'sang a song and pictured one specific person',
  'cried to a love song thinking about someone',
  'let a whole album become about one person',
  'kept the good-morning and good-night texts going for weeks',
  'measured a relationship by how fast they replied',
  'panicked over a dry text response',
  'read a period at the end of a text as anger',
  'assumed the worst from a one-word reply',
  'spiraled over being left on read',
  'convinced myself it was over from a slow reply',
  'stared at the three dots appearing and disappearing',
  'screenshotted a mixed-signal text for a second opinion',
  'sent the wrong reaction to a heartfelt message',
  'had a crush confess to me and panicked',
  'realized someone liked me only after they gave up',
  'missed obvious flirting completely',
  'found out a friend liked me for years',
  'discovered old love letters written about me',
  'blushed reading something sweet someone wrote about me',
  'kept every compliment a crush ever gave me',
  'fell for someone right when I decided to stay single',
  'met someone great at the worst possible time',
  'wondered if a spark was mutual and never found out',
];

/* ------------------------------------------------------------------ */
/*  Game types                                                         */
/* ------------------------------------------------------------------ */
interface Player {
  name: string;
  lives: number;
  totalLost: number;
  roundEliminated: number | null;
  responses: boolean[];
}

type Phase = 'setup' | 'playing' | 'responding' | 'roundResult' | 'results';

const MAX_ROUNDS = 20;
const MAX_LIVES = 10;

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
/*  Life dots component                                                */
/* ------------------------------------------------------------------ */
function LifeDots({ lives, max, color }: { lives: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < lives ? color : C.dim + '40',
            transition: `all ${MOTION.spring}`,
            transform: i < lives ? 'scale(1)' : 'scale(0.5)',
            opacity: i < lives ? 1 : 0.3,
            boxShadow: i < lives ? `0 0 6px ${color}60` : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Splash animation overlay                                           */
/* ------------------------------------------------------------------ */
function SplashOverlay({ color, onDone }: { color: string; onDone: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setStage(1));
    const t1 = setTimeout(() => setStage(2), 400);
    const t2 = setTimeout(() => onDone(), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* Pulsing ring */}
      <div style={{
        width: stage >= 1 ? 200 : 10,
        height: stage >= 1 ? 200 : 10,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        opacity: stage === 2 ? 0 : 0.7,
        transition: 'width 350ms cubic-bezier(.34,1.56,.64,1), height 350ms cubic-bezier(.34,1.56,.64,1), opacity 300ms ease',
      }} />
      {/* Center dot burst */}
      <div style={{
        position: 'absolute',
        width: stage >= 1 ? 60 : 0,
        height: stage >= 1 ? 60 : 0,
        borderRadius: '50%',
        background: color,
        opacity: stage === 2 ? 0 : 0.5,
        transition: 'all 300ms cubic-bezier(.34,1.56,.64,1)',
      }} />
      {/* Radiating particles */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = stage >= 1 ? 90 : 0;
        return (
          <div key={i} style={{
            position: 'absolute',
            width: 8, height: 8, borderRadius: '50%',
            background: color,
            opacity: stage === 2 ? 0 : 0.8,
            transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(${stage >= 1 ? 1 : 0})`,
            transition: 'all 400ms cubic-bezier(.34,1.56,.64,1), opacity 250ms ease',
          }} />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers for custom statements                         */
/* ------------------------------------------------------------------ */
function loadCustomStatements(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((s: unknown) => typeof s === 'string' && (s as string).trim().length > 0);
  } catch { /* ignore */ }
  return [];
}

function saveCustomStatements(stmts: string[]) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(stmts));
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Player color helper                                                */
/* ------------------------------------------------------------------ */
const PLAYER_COLORS = [C.rose, C.sapphire, C.emerald, C.amber, C.violet, C.teal, C.coral, C.gold, C.rose, C.sapphire];
function pColor(idx: number) { return PLAYER_COLORS[idx % PLAYER_COLORS.length]; }

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function NeverHaveIEver({ onBack, onGameEnd, duo }: { onBack: () => void; onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void; duo?: { me: string; them: string } | null }) {
  // Setup state
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [selectedMode, setSelectedMode] = useState<Mode>('clean');
  const [customStatements, setCustomStatements] = useState<string[]>(loadCustomStatements);
  const [customInput, setCustomInput] = useState('');

  // Game state
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [statements, setStatements] = useState<string[]>([]);
  const [currentStatement, setCurrentStatement] = useState('');
  const [responses, setResponses] = useState<Map<number, boolean>>(new Map());
  const [revealStatement, setRevealStatement] = useState(false);
  const [, setShowRoundResult] = useState(false);
  const [showSplash, setShowSplash] = useState<{ color: string } | null>(null);

  // Track per-round majority data for "Biggest Surprise" superlative
  const majorityDiffRef = useRef<Map<number, number>>(new Map());

  // Active players
  const activePlayers = useMemo(() => players.filter(p => p.lives > 0), [players]);
  const activeIndices = useMemo(() => {
    const indices: number[] = [];
    players.forEach((p, i) => { if (p.lives > 0) indices.push(i); });
    return indices;
  }, [players]);

  // Build statement pool
  const buildStatementPool = useCallback((): string[] => {
    let base: string[];
    if (selectedMode === 'clean') {
      base = [...CLEAN_STATEMENTS];
    } else if (selectedMode === 'spicy') {
      base = [...SPICY_STATEMENTS];
    } else {
      // Custom mode: custom statements mixed with clean as fallback
      base = [...customStatements, ...CLEAN_STATEMENTS];
    }
    if (selectedMode !== 'custom' && customStatements.length > 0 && selectedMode === 'clean') {
      // In clean mode, do not mix custom
    }
    return shuffle(base);
  }, [selectedMode, customStatements]);

  // Add custom statement
  const addCustomStatement = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed || customStatements.includes(trimmed)) return;
    const next = [...customStatements, trimmed];
    setCustomStatements(next);
    saveCustomStatements(next);
    setCustomInput('');
    sfxTap();
  }, [customInput, customStatements]);

  // Remove custom statement
  const removeCustomStatement = useCallback((idx: number) => {
    const next = customStatements.filter((_, i) => i !== idx);
    setCustomStatements(next);
    saveCustomStatements(next);
  }, [customStatements]);

  // Start game
  const startGame = useCallback(() => {
    const validNames = playerNames.filter(n => n.trim().length > 0);
    if (validNames.length < 2) return;
    if (selectedMode === 'custom' && customStatements.length === 0) return;
    sfxTap();

    const stmts = buildStatementPool();
    majorityDiffRef.current = new Map();

    setPlayers(validNames.map(name => ({
      name: name.trim(),
      lives: MAX_LIVES,
      totalLost: 0,
      roundEliminated: null,
      responses: [],
    })));
    setStatements(stmts);
    setRound(0);
    setPhase('playing');
  }, [playerNames, selectedMode, customStatements, buildStatementPool]);

  // Skip setup when invited as a duo: pre-seed the two players and jump
  // straight into the first playing round, exactly as if the host had typed
  // both names and pressed Start. Runs once on mount.
  useEffect(() => {
    if (!duo) return;
    const names = [duo.me, duo.them];
    const stmts = buildStatementPool();
    majorityDiffRef.current = new Map();
    setPlayers(names.map(name => ({
      name: name.trim(),
      lives: MAX_LIVES,
      totalLost: 0,
      roundEliminated: null,
      responses: [],
    })));
    setStatements(stmts);
    setRound(0);
    setPhase('playing');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Next round
  const nextRound = useCallback(() => {
    if (round >= statements.length || round >= MAX_ROUNDS || activePlayers.length <= 1) {
      setPhase('results');
      return;
    }

    setCurrentStatement(statements[round]);
    setResponses(new Map());
    setRevealStatement(false);
    setShowRoundResult(false);
    setPhase('responding');

    setTimeout(() => setRevealStatement(true), 100);
  }, [round, statements, activePlayers.length]);

  // Start first round when entering playing phase
  useEffect(() => {
    if (phase === 'playing') {
      nextRound();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle player response
  const handleResponse = useCallback((playerIndex: number, iHave: boolean) => {
    if (iHave) {
      sfxWrong();
      setShowSplash({ color: pColor(playerIndex) });
    } else {
      sfxCorrect();
    }
    setResponses(prev => {
      const next = new Map(prev);
      next.set(playerIndex, iHave);
      return next;
    });
  }, []);

  // All active players have responded
  const allResponded = useMemo(() => {
    return activeIndices.every(i => responses.has(i));
  }, [activeIndices, responses]);

  // Submit round responses
  const submitRound = useCallback(() => {
    if (!allResponded) return;
    sfxReveal();

    // Calculate majority for "Biggest Surprise"
    const activeResponses = activeIndices.map(i => responses.get(i));
    const haveCount = activeResponses.filter(r => r === true).length;
    const haventCount = activeResponses.filter(r => r === false).length;
    const majorityIsHave = haveCount >= haventCount;

    activeIndices.forEach(i => {
      const resp = responses.get(i);
      const isMinority = majorityIsHave ? resp === false : resp === true;
      // Only count as "surprise" if they are the minority AND there is a clear majority
      if (isMinority && haveCount !== haventCount) {
        majorityDiffRef.current.set(i, (majorityDiffRef.current.get(i) || 0) + 1);
      }
    });

    setPlayers(prev => {
      const next = prev.map((p, i) => {
        if (p.lives <= 0) return p;
        const resp = responses.get(i);
        const iHave = resp === true;
        const newLives = iHave ? Math.max(0, p.lives - 1) : p.lives;
        return {
          ...p,
          lives: newLives,
          totalLost: p.totalLost + (iHave ? 1 : 0),
          roundEliminated: newLives === 0 && p.roundEliminated === null ? round + 1 : p.roundEliminated,
          responses: [...p.responses, iHave],
        };
      });
      return next;
    });

    setShowRoundResult(true);
    setPhase('roundResult');
  }, [allResponded, responses, round, activeIndices]);

  // Advance to next round
  const advanceRound = useCallback(() => {
    const remaining = players.filter(p => {
      if (p.lives <= 0) return false;
      const resp = responses.get(players.indexOf(p));
      if (resp === true && p.lives === 1) return false;
      return true;
    });

    if (remaining.length <= 1 || round + 1 >= MAX_ROUNDS || round + 1 >= statements.length) {
      sfxGameOver();
      setPhase('results');
      return;
    }

    sfxLevelUp();
    setRound(r => r + 1);
    setPhase('playing');
  }, [players, responses, round, statements.length]);

  // Check after players update
  useEffect(() => {
    if (phase === 'roundResult') {
      // Handled by advanceRound
    }
  }, [players, phase]);

  // Report score at game end
  useEffect(() => {
    if (phase === 'results' && players.length > 0) {
      onGameEnd?.({
        score: round + 1,
        accuracy: 1.0,
        level: 1,
        maxScore: MAX_ROUNDS,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute superlatives for results
  const superlatives = useMemo(() => {
    if (players.length === 0) return null;

    const sorted = [...players].sort((a, b) => {
      if (a.lives !== b.lives) return b.lives - a.lives;
      return (a.roundEliminated ?? Infinity) - (b.roundEliminated ?? Infinity);
    });

    const lastStanding = sorted[0];
    const mostExperienced = [...players].sort((a, b) => b.totalLost - a.totalLost)[0];
    const mostInnocent = [...players].sort((a, b) => a.totalLost - b.totalLost)[0];
    const firstOut = [...players].filter(p => p.roundEliminated !== null).sort((a, b) => (a.roundEliminated ?? 99) - (b.roundEliminated ?? 99))[0] || null;

    // Biggest Surprise: player who most often answered differently from the majority
    let biggestSurprise: Player | null = null;
    let maxSurpriseCount = 0;
    const diffMap = majorityDiffRef.current;
    players.forEach((p, i) => {
      const count = diffMap.get(i) || 0;
      if (count > maxSurpriseCount) {
        maxSurpriseCount = count;
        biggestSurprise = p;
      }
    });

    return { lastStanding, mostExperienced, mostInnocent, firstOut, biggestSurprise, biggestSurpriseCount: maxSurpriseCount, ranking: sorted };
  }, [players]);

  // Restart
  const restart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRound(0);
    setStatements([]);
    setResponses(new Map());
    majorityDiffRef.current = new Map();
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Shared styles                                                      */
  /* ------------------------------------------------------------------ */
  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: C.glass,
    padding: 20,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
  };

  const modeColor = MODE_META[selectedMode].color;

  /* ------------------------------------------------------------------ */
  /*  SETUP PHASE                                                        */
  /* ------------------------------------------------------------------ */
  if (phase === 'setup') {
    const canStart = playerNames.filter(n => n.trim()).length >= 2 && (selectedMode !== 'custom' || customStatements.length > 0);

    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Header */}
        <div style={headerStyle}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <Hand size={22} style={{ color: C.rose }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Never Have I Ever</div>
            <div style={{ fontSize: 12, color: C.muted }}>Party game for 2-10 players</div>
          </div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Players section */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: C.sapphire }} />
              Players ({playerNames.filter(n => n.trim()).length}/10)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {playerNames.map((name, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: pColor(i),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(name || `P${i + 1}`).charAt(0).toUpperCase()}
                  </div>
                  <input
                    value={name}
                    onChange={e => {
                      const next = [...playerNames];
                      next[i] = e.target.value;
                      setPlayerNames(next);
                    }}
                    placeholder={`Player ${i + 1}`}
                    style={{
                      flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm,
                      padding: '8px 12px', color: C.text, fontSize: 14, outline: 'none',
                      transition: `border-color ${MOTION.fast}`,
                    }}
                    onFocus={e => e.target.style.borderColor = C.sapphire}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                  {playerNames.length > 2 && (
                    <button
                      onClick={() => setPlayerNames(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 4, display: 'flex' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {playerNames.length < 10 && (
              <button
                onClick={() => setPlayerNames(prev => [...prev, ''])}
                style={{
                  background: C.bg, border: `1px dashed ${C.border}`, borderRadius: RADIUS.sm,
                  padding: '8px 16px', color: C.muted, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 6, fontSize: 13, width: '100%', justifyContent: 'center',
                  transition: `all ${MOTION.fast}`,
                }}
              >
                <Plus size={14} /> Add Player
              </button>
            )}
          </div>

          {/* Mode selection */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={16} style={{ color: C.amber }} />
              Mode
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(Object.entries(MODE_META) as [Mode, typeof MODE_META[Mode]][]).map(([mode, meta]) => {
                const selected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => { setSelectedMode(mode); sfxTap(); }}
                    style={{
                      background: selected ? meta.color + '18' : C.bg,
                      border: `1px solid ${selected ? meta.color + '60' : C.border}`,
                      borderRadius: RADIUS.md,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `all ${MOTION.fast}`,
                      boxShadow: selected ? `0 0 12px ${meta.color}20` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ color: selected ? meta.color : C.dim }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: selected ? meta.color : C.text, marginBottom: 2 }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.3 }}>
                        {meta.description}
                      </div>
                    </div>
                    {selected && (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', background: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedMode === 'spicy' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                padding: '8px 12px', borderRadius: RADIUS.sm,
                background: C.rose + '10', border: `1px solid ${C.rose}25`,
              }}>
                <AlertTriangle size={14} style={{ color: C.rose, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.rose }}>Adults only. Seriously.</span>
              </div>
            )}
          </div>

          {/* Custom statements editor (visible when custom mode selected) */}
          {selectedMode === 'custom' && (
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenLine size={16} style={{ color: C.violet }} />
                Your Statements ({customStatements.length})
              </div>

              {/* Add new */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustomStatement(); }}
                  placeholder="e.g. eaten a whole cake alone"
                  style={{
                    flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm,
                    padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none',
                    transition: `border-color ${MOTION.fast}`,
                  }}
                  onFocus={e => e.target.style.borderColor = C.violet}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <button
                  onClick={addCustomStatement}
                  disabled={!customInput.trim()}
                  style={{
                    ...solidBtn(C.violet),
                    padding: '8px 14px',
                    fontSize: 12,
                    opacity: customInput.trim() ? 1 : 0.4,
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* List */}
              {customStatements.length === 0 ? (
                <div style={{ fontSize: 12, color: C.dim, textAlign: 'center', padding: '12px 0' }}>
                  No custom statements yet. Add some above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                  {customStatements.map((stmt, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: RADIUS.sm,
                      background: C.bg, border: `1px solid ${C.border}`,
                    }}>
                      <span style={{ flex: 1, fontSize: 12, color: C.text }}>{stmt}</span>
                      <button
                        onClick={() => removeCustomStatement(i)}
                        style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
                Your statements are saved locally and mixed into the deck.
              </div>
            </div>
          )}

          {/* Rules */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>How to Play</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              1. Everyone starts with 10 lives<br />
              2. A statement appears: "Never have I ever..."<br />
              3. Each player taps "I Have" if they have done it, or "I Haven't" if not<br />
              4. Players who HAVE done it lose a life<br />
              5. Reach 0 lives and you are out. Last one standing wins!
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={!canStart}
            style={{
              ...solidBtn(C.rose),
              width: '100%',
              justifyContent: 'center',
              padding: '14px 24px',
              fontSize: 16,
              opacity: canStart ? 1 : 0.4,
            }}
          >
            <Play size={18} /> Start Game
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  RESPONDING PHASE                                                   */
  /* ------------------------------------------------------------------ */
  if (phase === 'responding') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Splash overlay */}
        {showSplash && (
          <SplashOverlay color={showSplash.color} onDone={() => setShowSplash(null)} />
        )}

        {/* Header */}
        <div style={headerStyle}>
          <Hand size={20} style={{ color: C.rose }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Round {round + 1}</span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>of {Math.min(MAX_ROUNDS, statements.length)}</span>
          </div>
          <div style={{
            background: modeColor + '20', color: modeColor,
            borderRadius: RADIUS.full, padding: '4px 12px', fontSize: 11, fontWeight: 600,
          }}>
            {MODE_META[selectedMode].label}
          </div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Statement card */}
          <div style={{
            ...cardStyle,
            marginBottom: 24,
            textAlign: 'center',
            border: `1px solid ${modeColor}30`,
            transform: revealStatement ? 'translateY(0)' : 'translateY(30px)',
            opacity: revealStatement ? 1 : 0,
            transition: `transform ${MOTION.spring}, opacity ${MOTION.med}`,
          }}>
            <div style={{ fontSize: 13, color: modeColor, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Never have I ever...
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.4 }}>
              {currentStatement}
            </div>
          </div>

          {/* Player response grid */}
          <div style={{ display: 'grid', gridTemplateColumns: activePlayers.length <= 4 ? '1fr' : '1fr 1fr', gap: 10 }}>
            {players.map((player, idx) => {
              if (player.lives <= 0) return null;
              const hasResponded = responses.has(idx);
              const response = responses.get(idx);
              const pc = pColor(idx);

              return (
                <div key={idx} style={{
                  ...cardStyle,
                  padding: 14,
                  border: `1px solid ${hasResponded ? (response ? C.rose + '50' : C.emerald + '50') : C.border}`,
                  transition: `all ${MOTION.fast}`,
                }}>
                  {/* Player name + lives */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: pc,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{player.name}</div>
                      <LifeDots lives={player.lives} max={MAX_LIVES} color={pc} />
                    </div>
                  </div>

                  {/* Response buttons */}
                  {!hasResponded ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleResponse(idx, true)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: RADIUS.sm,
                          background: C.rose + '20', border: `1px solid ${C.rose}40`,
                          color: C.rose, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: `all ${MOTION.snap}`,
                        }}
                      >
                        I Have
                      </button>
                      <button
                        onClick={() => handleResponse(idx, false)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: RADIUS.sm,
                          background: C.emerald + '20', border: `1px solid ${C.emerald}40`,
                          color: C.emerald, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: `all ${MOTION.snap}`,
                        }}
                      >
                        I Haven't
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '10px 0', borderRadius: RADIUS.sm, textAlign: 'center',
                      background: response ? C.rose + '15' : C.emerald + '15',
                      color: response ? C.rose : C.emerald,
                      fontSize: 12, fontWeight: 600,
                      transition: `all ${MOTION.fast}`,
                    }}>
                      {response ? 'I Have' : 'I Haven\'t'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={submitRound}
            disabled={!allResponded}
            style={{
              ...solidBtn(C.sapphire),
              width: '100%',
              justifyContent: 'center',
              padding: '14px 24px',
              fontSize: 15,
              marginTop: 20,
              opacity: allResponded ? 1 : 0.35,
              transition: `all ${MOTION.fast}`,
            }}
          >
            <ChevronRight size={18} /> Reveal Results
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  ROUND RESULT PHASE                                                 */
  /* ------------------------------------------------------------------ */
  if (phase === 'roundResult') {
    const guiltyPlayers = Array.from(responses.entries()).filter(([_, v]) => v).map(([i]) => i);
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={headerStyle}>
          <Hand size={20} style={{ color: C.rose }} />
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Round {round + 1} Results</div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Statement recap */}
          <div style={{ ...cardStyle, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Never have I ever...</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{currentStatement}</div>
          </div>

          {/* Guilty list */}
          {guiltyPlayers.length > 0 ? (
            <div style={{ ...cardStyle, marginBottom: 16, border: `1px solid ${C.rose}30` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.rose, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Skull size={15} /> Lost a life ({guiltyPlayers.length})
              </div>
              {guiltyPlayers.map(i => {
                const p = players[i];
                const pc = pColor(i);
                const justEliminated = p.lives === 0;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: pc,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <LifeDots lives={p.lives} max={MAX_LIVES} color={pc} />
                    </div>
                    {justEliminated && (
                      <div style={{
                        background: C.rose + '20', color: C.rose, borderRadius: RADIUS.full,
                        padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      }}>
                        ELIMINATED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ ...cardStyle, marginBottom: 16, textAlign: 'center', color: C.emerald }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Everyone is innocent this round!</div>
            </div>
          )}

          {/* Safe list */}
          {activeIndices.filter(i => !responses.get(i)).length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 20, border: `1px solid ${C.emerald}30` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.emerald, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={15} /> Safe
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activeIndices.filter(i => !responses.get(i)).map(i => {
                  const pc = pColor(i);
                  return (
                    <div key={i} style={{
                      background: pc + '18', border: `1px solid ${pc}30`,
                      borderRadius: RADIUS.full, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      color: C.text,
                    }}>
                      {players[i].name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={advanceRound}
            style={{
              ...solidBtn(C.sapphire),
              width: '100%',
              justifyContent: 'center',
              padding: '14px 24px',
              fontSize: 15,
            }}
          >
            {activePlayers.filter(p => p.lives > 0).length <= 1 || round + 1 >= MAX_ROUNDS
              ? <><Trophy size={18} /> See Final Results</>
              : <><ChevronRight size={18} /> Next Round</>
            }
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  RESULTS PHASE                                                      */
  /* ------------------------------------------------------------------ */
  if (phase === 'results' && superlatives) {
    const { lastStanding, mostExperienced, mostInnocent, firstOut, biggestSurprise, biggestSurpriseCount, ranking } = superlatives;

    const awards: { label: string; icon: React.ReactNode; player: Player | null; color: string; subtitle: string }[] = [
      { label: 'Last Standing', icon: <Crown size={20} />, player: lastStanding, color: C.gold, subtitle: `${lastStanding.lives} ${lastStanding.lives === 1 ? 'life' : 'lives'} remaining` },
      { label: 'Most Experienced', icon: <Sparkles size={20} />, player: mostExperienced, color: C.rose, subtitle: `Lost ${mostExperienced.totalLost} lives` },
      { label: 'Most Innocent', icon: <Heart size={20} />, player: mostInnocent, color: C.emerald, subtitle: `Only lost ${mostInnocent.totalLost} lives` },
      { label: 'First Casualty', icon: <Skull size={20} />, player: firstOut, color: C.coral, subtitle: firstOut ? `Eliminated round ${firstOut.roundEliminated}` : 'Nobody eliminated' },
      { label: 'Biggest Surprise', icon: <AlertTriangle size={20} />, player: biggestSurprise, color: C.teal, subtitle: biggestSurprise ? `Went against the group ${biggestSurpriseCount} time${biggestSurpriseCount === 1 ? '' : 's'}` : 'Everyone agreed' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={headerStyle}>
          <Trophy size={20} style={{ color: C.gold }} />
          <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Game Over</div>
          <div style={{ fontSize: 12, color: C.muted }}>{round + 1} rounds played</div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Winner banner */}
          <div style={{
            ...cardStyle,
            marginBottom: 20,
            textAlign: 'center',
            border: `1px solid ${C.gold}40`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5), 0 0 30px ${C.gold}15`,
            padding: 28,
          }}>
            <Crown size={36} style={{ color: C.gold, marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: C.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Winner
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
              {lastStanding.name}
            </div>
            <div style={{ fontSize: 14, color: C.muted }}>
              Survived with {lastStanding.lives} {lastStanding.lives === 1 ? 'life' : 'lives'} remaining
            </div>
          </div>

          {/* Superlative awards — top row 2, second row 2, third row 1 centered */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {awards.slice(0, 4).map((award, i) => (
              <div key={i} style={{
                ...cardStyle,
                padding: 14,
                textAlign: 'center',
                border: `1px solid ${award.color}25`,
              }}>
                <div style={{ color: award.color, marginBottom: 6 }}>{award.icon}</div>
                <div style={{ fontSize: 11, color: award.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {award.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                  {award.player?.name ?? '--'}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{award.subtitle}</div>
              </div>
            ))}
          </div>
          {/* Biggest Surprise - full width */}
          <div style={{
            ...cardStyle,
            padding: 14,
            textAlign: 'center',
            border: `1px solid ${awards[4].color}25`,
            marginBottom: 20,
          }}>
            <div style={{ color: awards[4].color, marginBottom: 6 }}>{awards[4].icon}</div>
            <div style={{ fontSize: 11, color: awards[4].color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {awards[4].label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
              {awards[4].player?.name ?? '--'}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{awards[4].subtitle}</div>
          </div>

          {/* Full ranking */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Final Standings</div>
            {ranking.map((player, i) => {
              const pIdx = players.indexOf(player);
              const pc = pColor(pIdx);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: i < ranking.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: i === 0 ? C.gold : C.dim + '40',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: i === 0 ? '#000' : C.muted,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: pc,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{player.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {player.lives > 0 ? `${player.lives} lives left` : `Out round ${player.roundEliminated}`}
                      {' / '}{player.totalLost} lost
                    </div>
                  </div>
                  <LifeDots lives={player.lives} max={MAX_LIVES} color={pc} />
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={restart}
              style={{
                ...solidBtn(C.sapphire),
                flex: 1,
                justifyContent: 'center',
                padding: '14px 24px',
              }}
            >
              <RotateCcw size={16} /> Play Again
            </button>
            <button
              onClick={onBack}
              style={{
                flex: 1,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS.full,
                padding: '14px 24px',
                color: C.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: C.glass,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
