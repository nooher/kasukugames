import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Heart, Zap, Trophy, RotateCcw, Clock, Flame } from 'lucide-react';
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxLevelUp } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#1a2230',
  card: '#151d2b',
  border: '#1f2d3d',
  accent: '#f59e0b',
  success: '#00c97b',
  error: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  radius: 14,
  pill: 999,
  transition: '200ms ease',
} as const;

/* ------------------------------------------------------------------ */
/*  Category colors                                                    */
/* ------------------------------------------------------------------ */
const CATEGORY_COLORS: Record<Category, string> = {
  triage: '#ef4444',
  business: '#3b82f6',
  logic: '#a855f7',
  ethics: '#14b8a6',
  survival: '#f97316',
  math: '#eab308',
};

const CATEGORY_LABELS: Record<Category, string> = {
  triage: 'TRIAGE',
  business: 'BUSINESS',
  logic: 'LOGIC',
  ethics: 'ETHICS',
  survival: 'SURVIVAL',
  math: 'MATH',
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Category = 'triage' | 'business' | 'logic' | 'ethics' | 'survival' | 'math';

interface CardOption {
  label: string;
  correct: boolean;
}

interface ScenarioCard {
  prompt: string;
  options: CardOption[];
  explanation: string;
}

interface ScenarioSet {
  category: Category;
  cards: [ScenarioCard, ScenarioCard, ScenarioCard];
}

/* ------------------------------------------------------------------ */
/*  Scenario data (30+ sets)                                           */
/* ------------------------------------------------------------------ */
const SCENARIOS: ScenarioSet[] = [
  // ===== TRIAGE =====
  {
    category: 'triage',
    cards: [
      {
        prompt: 'Patient with a paper cut on their finger, mild bleeding.',
        options: [
          { label: 'Treat first', correct: false },
          { label: 'Can wait', correct: true },
        ],
        explanation: 'Paper cuts are minor and non-urgent.',
      },
      {
        prompt: 'Patient clutching chest, sweating profusely, left arm numb.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Classic signs of myocardial infarction -- immediate priority.',
      },
      {
        prompt: 'Patient with a mild headache after skipping lunch.',
        options: [
          { label: 'Treat first', correct: false },
          { label: 'Can wait', correct: true },
        ],
        explanation: 'Hunger headache resolves with food, low urgency.',
      },
    ],
  },
  {
    category: 'triage',
    cards: [
      {
        prompt: 'Child with 40.5C fever, lethargic, stiff neck, rash that does not blanch.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Non-blanching rash + fever + stiff neck suggests meningitis -- emergency.',
      },
      {
        prompt: 'Adult with a twisted ankle, can bear weight, mild swelling.',
        options: [
          { label: 'Treat first', correct: false },
          { label: 'Can wait', correct: true },
        ],
        explanation: 'Weight-bearing sprain is low priority.',
      },
      {
        prompt: 'Elderly patient with sudden confusion and slurred speech.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Sudden confusion + slurred speech = possible stroke, time-critical.',
      },
    ],
  },
  {
    category: 'triage',
    cards: [
      {
        prompt: 'Worker with a deep laceration, arterial bleeding from forearm.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Arterial bleeding can be fatal in minutes without pressure.',
      },
      {
        prompt: 'Patient with seasonal allergies, sneezing and runny nose.',
        options: [
          { label: 'Treat first', correct: false },
          { label: 'Can wait', correct: true },
        ],
        explanation: 'Allergic rhinitis is uncomfortable but not dangerous.',
      },
      {
        prompt: 'Toddler who swallowed a button battery 10 minutes ago.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Button batteries cause severe internal burns within 2 hours.',
      },
    ],
  },
  {
    category: 'triage',
    cards: [
      {
        prompt: 'Patient stung by a bee, developing hives and throat tightness.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Throat tightness after a sting signals anaphylaxis -- use epinephrine.',
      },
      {
        prompt: 'Teen with acne flare-up on their forehead.',
        options: [
          { label: 'Treat first', correct: false },
          { label: 'Can wait', correct: true },
        ],
        explanation: 'Acne is a dermatological issue, not an emergency.',
      },
      {
        prompt: 'Cyclist hit by car, conscious but cannot feel legs.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Loss of leg sensation suggests spinal injury -- immobilize immediately.',
      },
    ],
  },
  {
    category: 'triage',
    cards: [
      {
        prompt: 'Pregnant woman at 38 weeks with sudden severe abdominal pain and vaginal bleeding.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Possible placental abruption -- life-threatening for mother and baby.',
      },
      {
        prompt: 'Man with a splinter in his thumb, no infection signs.',
        options: [
          { label: 'Treat first', correct: false },
          { label: 'Can wait', correct: true },
        ],
        explanation: 'A simple splinter is minor and non-urgent.',
      },
      {
        prompt: 'Patient found unconscious, not breathing, no pulse.',
        options: [
          { label: 'Treat first', correct: true },
          { label: 'Can wait', correct: false },
        ],
        explanation: 'Cardiac arrest -- begin CPR and defibrillation immediately.',
      },
    ],
  },
  // ===== BUSINESS =====
  {
    category: 'business',
    cards: [
      {
        prompt: 'Invest $10K in a friend\'s untested restaurant idea with no business plan.',
        options: [
          { label: 'Invest', correct: false },
          { label: 'Pass', correct: true },
        ],
        explanation: 'No business plan = high risk. 60% of restaurants fail in year one.',
      },
      {
        prompt: 'Buy index funds that track the S&P 500 for long-term retirement savings.',
        options: [
          { label: 'Good move', correct: true },
          { label: 'Bad move', correct: false },
        ],
        explanation: 'Index funds offer diversified, historically reliable long-term growth.',
      },
      {
        prompt: 'Put your entire emergency fund into cryptocurrency.',
        options: [
          { label: 'Smart', correct: false },
          { label: 'Risky', correct: true },
        ],
        explanation: 'Emergency funds need liquidity and stability -- crypto has neither.',
      },
    ],
  },
  {
    category: 'business',
    cards: [
      {
        prompt: 'A startup offers 2% equity but no salary for 18 months.',
        options: [
          { label: 'Accept', correct: false },
          { label: 'Negotiate', correct: true },
        ],
        explanation: 'Equity without salary is high risk; always negotiate compensation.',
      },
      {
        prompt: 'Your competitor just cut prices 40%. Match their prices immediately?',
        options: [
          { label: 'Match prices', correct: false },
          { label: 'Differentiate value', correct: true },
        ],
        explanation: 'Price wars erode margins. Competing on value preserves profitability.',
      },
      {
        prompt: 'Lease office space for 5 years when your team is fully remote and productive.',
        options: [
          { label: 'Lease it', correct: false },
          { label: 'Stay remote', correct: true },
        ],
        explanation: 'Unnecessary overhead. Remote work saves capital for growth.',
      },
    ],
  },
  {
    category: 'business',
    cards: [
      {
        prompt: 'Revenue is flat. Your top salesperson asks for a 30% raise or they leave.',
        options: [
          { label: 'Pay the raise', correct: true },
          { label: 'Let them go', correct: false },
        ],
        explanation: 'Replacing top talent costs 2-3x their salary. Retain if possible.',
      },
      {
        prompt: 'You discover your supplier uses child labor. Your contract saves you $200K/year.',
        options: [
          { label: 'Keep the deal', correct: false },
          { label: 'Find new supplier', correct: true },
        ],
        explanation: 'Ethical sourcing protects brand and avoids legal liability.',
      },
      {
        prompt: 'Launch an MVP with 3 core features or wait 12 months for 20 features?',
        options: [
          { label: 'Launch MVP', correct: true },
          { label: 'Wait for full', correct: false },
        ],
        explanation: 'Ship early, learn fast. Perfect is the enemy of done.',
      },
    ],
  },
  {
    category: 'business',
    cards: [
      {
        prompt: 'A client owes you $50K and is 90 days overdue. They want another project.',
        options: [
          { label: 'Take new work', correct: false },
          { label: 'Collect first', correct: true },
        ],
        explanation: 'Never extend more credit to a delinquent payer.',
      },
      {
        prompt: 'Your patent expires next year. Invest in R&D for next-gen product?',
        options: [
          { label: 'Invest in R&D', correct: true },
          { label: 'Milk current product', correct: false },
        ],
        explanation: 'Innovate ahead of expiry or face commoditization.',
      },
      {
        prompt: 'Hire a brilliant engineer who openly insults colleagues in interviews.',
        options: [
          { label: 'Hire them', correct: false },
          { label: 'Pass', correct: true },
        ],
        explanation: 'Toxic talent destroys team productivity. Culture fit matters.',
      },
    ],
  },
  {
    category: 'business',
    cards: [
      {
        prompt: 'You can acquire a competitor for 2x revenue. Their tech is superior.',
        options: [
          { label: 'Acquire', correct: true },
          { label: 'Build in-house', correct: false },
        ],
        explanation: '2x revenue for superior tech is a fair acquisition price.',
      },
      {
        prompt: 'A government contract guarantees $5M but requires 18 months of bureaucracy.',
        options: [
          { label: 'Take it', correct: true },
          { label: 'Skip it', correct: false },
        ],
        explanation: 'Guaranteed revenue justifies patience with process.',
      },
      {
        prompt: 'Your co-founder wants to pivot the entire company based on one customer complaint.',
        options: [
          { label: 'Pivot now', correct: false },
          { label: 'Gather more data', correct: true },
        ],
        explanation: 'One data point is not a trend. Validate before pivoting.',
      },
    ],
  },
  // ===== LOGIC =====
  {
    category: 'logic',
    cards: [
      {
        prompt: 'All roses are flowers. Some flowers fade quickly. Therefore: all roses fade quickly.',
        options: [
          { label: 'Valid', correct: false },
          { label: 'Invalid', correct: true },
        ],
        explanation: '"Some flowers" does not necessarily include roses.',
      },
      {
        prompt: 'If it rains, the ground is wet. The ground is wet. Therefore: it rained.',
        options: [
          { label: 'Valid', correct: false },
          { label: 'Invalid', correct: true },
        ],
        explanation: 'Affirming the consequent -- sprinklers could also wet the ground.',
      },
      {
        prompt: 'No mammals are fish. A whale is a mammal. Therefore: a whale is not a fish.',
        options: [
          { label: 'Valid', correct: true },
          { label: 'Invalid', correct: false },
        ],
        explanation: 'Classic valid syllogism: no M are F, W is M, so W is not F.',
      },
    ],
  },
  {
    category: 'logic',
    cards: [
      {
        prompt: 'A card has a vowel on one side and an even number on the other. Card shows "E". Flip it?',
        options: [
          { label: 'Yes, flip', correct: true },
          { label: 'No need', correct: false },
        ],
        explanation: 'You must verify vowels have even numbers (Wason selection task).',
      },
      {
        prompt: 'Same rule. Card shows "7". Do you need to flip it?',
        options: [
          { label: 'Yes, flip', correct: true },
          { label: 'No need', correct: false },
        ],
        explanation: 'If 7 has a vowel on the back, the rule is violated.',
      },
      {
        prompt: 'Same rule. Card shows "4". Do you need to flip it?',
        options: [
          { label: 'Yes, flip', correct: false },
          { label: 'No need', correct: true },
        ],
        explanation: 'Even numbers can have anything -- the rule only constrains vowels.',
      },
    ],
  },
  {
    category: 'logic',
    cards: [
      {
        prompt: 'Three boxes: one has gold, two are empty. You pick Box 1. Host opens Box 3 (empty). Switch to Box 2?',
        options: [
          { label: 'Switch', correct: true },
          { label: 'Stay', correct: false },
        ],
        explanation: 'Monty Hall: switching gives 2/3 probability vs 1/3 for staying.',
      },
      {
        prompt: 'A bat and ball cost $1.10 total. The bat costs $1 more than the ball. Ball costs $0.10?',
        options: [
          { label: 'Yes, $0.10', correct: false },
          { label: 'No, $0.05', correct: true },
        ],
        explanation: 'If ball = $0.10, bat = $1.10, total = $1.20. Ball = $0.05, bat = $1.05.',
      },
      {
        prompt: '5 machines make 5 widgets in 5 minutes. 100 machines make 100 widgets in how long?',
        options: [
          { label: '100 minutes', correct: false },
          { label: '5 minutes', correct: true },
        ],
        explanation: 'Each machine makes 1 widget in 5 min. 100 machines = 100 widgets in 5 min.',
      },
    ],
  },
  {
    category: 'logic',
    cards: [
      {
        prompt: '"I always lie." Is this statement true?',
        options: [
          { label: 'True', correct: false },
          { label: 'Paradox', correct: true },
        ],
        explanation: 'If true, the speaker lies, so it is false -- a liar paradox.',
      },
      {
        prompt: 'All Cretans are liars (said by a Cretan). Can this be true?',
        options: [
          { label: 'Yes', correct: false },
          { label: 'No', correct: true },
        ],
        explanation: 'If all Cretans lie and a Cretan says this, it is self-refuting.',
      },
      {
        prompt: 'If A > B and B > C, can C > A?',
        options: [
          { label: 'Possible', correct: false },
          { label: 'Impossible', correct: true },
        ],
        explanation: 'Transitivity: A > B > C means A > C, so C cannot exceed A.',
      },
    ],
  },
  {
    category: 'logic',
    cards: [
      {
        prompt: 'You have two doors. One guard always lies, one always tells truth. Ask one question to find the safe door.',
        options: [
          { label: 'Ask what other guard would say', correct: true },
          { label: 'Ask which door is safe', correct: false },
        ],
        explanation: 'Asking about the other guard\'s answer always yields the wrong door -- pick the other.',
      },
      {
        prompt: 'A farmer has 17 sheep. All but 9 die. How many are left?',
        options: [
          { label: '9', correct: true },
          { label: '8', correct: false },
        ],
        explanation: '"All but 9" means 9 survive.',
      },
      {
        prompt: 'How many times can you subtract 5 from 25?',
        options: [
          { label: 'Five times', correct: false },
          { label: 'Once', correct: true },
        ],
        explanation: 'After the first subtraction it is 20, not 25. You subtract from 25 only once.',
      },
    ],
  },
  // ===== ETHICS =====
  {
    category: 'ethics',
    cards: [
      {
        prompt: 'A trolley is heading for 5 people. You can divert it to hit 1 person instead.',
        options: [
          { label: 'Divert trolley', correct: true },
          { label: 'Do nothing', correct: false },
        ],
        explanation: 'Utilitarian consensus: saving 5 at cost of 1 minimizes harm.',
      },
      {
        prompt: 'Your friend plagiarized their thesis. Report them or stay silent?',
        options: [
          { label: 'Report', correct: true },
          { label: 'Stay silent', correct: false },
        ],
        explanation: 'Academic integrity protects all students and the institution.',
      },
      {
        prompt: 'A homeless person steals bread for their starving child. Prosecute?',
        options: [
          { label: 'Prosecute', correct: false },
          { label: 'Show mercy', correct: true },
        ],
        explanation: 'Justice tempered with compassion -- address root cause, not just the act.',
      },
    ],
  },
  {
    category: 'ethics',
    cards: [
      {
        prompt: 'Your employer asks you to falsify safety reports. No one will know.',
        options: [
          { label: 'Comply', correct: false },
          { label: 'Refuse and report', correct: true },
        ],
        explanation: 'Falsified safety data endangers lives. Whistleblowing is the ethical duty.',
      },
      {
        prompt: 'You find a wallet with $500 and an ID. No cameras around.',
        options: [
          { label: 'Keep it', correct: false },
          { label: 'Return it', correct: true },
        ],
        explanation: 'Returning property is ethically right regardless of witnesses.',
      },
      {
        prompt: 'A self-driving car must choose: hit 1 pedestrian or swerve into a wall, killing the passenger.',
        options: [
          { label: 'Hit pedestrian', correct: false },
          { label: 'Protect pedestrian', correct: true },
        ],
        explanation: 'Autonomous vehicles should prioritize pedestrian safety by design ethics.',
      },
    ],
  },
  {
    category: 'ethics',
    cards: [
      {
        prompt: 'You can save 10 strangers by donating a kidney. You have 2 healthy kidneys.',
        options: [
          { label: 'Obligated to donate', correct: false },
          { label: 'Supererogatory', correct: true },
        ],
        explanation: 'Heroic acts are praiseworthy but not morally obligatory.',
      },
      {
        prompt: 'A journalist discovers a politician\'s affair. Publish or respect privacy?',
        options: [
          { label: 'Publish', correct: false },
          { label: 'Respect privacy', correct: true },
        ],
        explanation: 'Private matters unrelated to public duty deserve privacy protection.',
      },
      {
        prompt: 'A doctor has 1 dose of life-saving medicine. 2 patients need it equally. First-come-first-served?',
        options: [
          { label: 'First come', correct: true },
          { label: 'Random lottery', correct: false },
        ],
        explanation: 'FCFS is the standard triage tie-breaker when all else is equal.',
      },
    ],
  },
  {
    category: 'ethics',
    cards: [
      {
        prompt: 'You witness a colleague taking office supplies home. Report or ignore?',
        options: [
          { label: 'Report', correct: false },
          { label: 'Address privately', correct: true },
        ],
        explanation: 'Minor infractions are best handled with a direct, private conversation first.',
      },
      {
        prompt: 'A company tests cosmetics on animals. Is it ethical to buy their products?',
        options: [
          { label: 'Ethical', correct: false },
          { label: 'Unethical', correct: true },
        ],
        explanation: 'Cruelty-free alternatives exist; supporting animal testing is avoidable harm.',
      },
      {
        prompt: 'An AI system can predict crimes before they happen. Deploy it to arrest suspects?',
        options: [
          { label: 'Deploy', correct: false },
          { label: 'Do not deploy', correct: true },
        ],
        explanation: 'Pre-crime violates presumption of innocence, a cornerstone of justice.',
      },
    ],
  },
  {
    category: 'ethics',
    cards: [
      {
        prompt: 'A patient with terminal illness requests assisted dying where it is legal.',
        options: [
          { label: 'Deny request', correct: false },
          { label: 'Respect autonomy', correct: true },
        ],
        explanation: 'Where legal, patient autonomy over end-of-life decisions is paramount.',
      },
      {
        prompt: 'Your company can profit by selling user data without consent.',
        options: [
          { label: 'Sell data', correct: false },
          { label: 'Protect privacy', correct: true },
        ],
        explanation: 'Consent is foundational to ethical data practices.',
      },
      {
        prompt: 'A lifeboat holds 10 but 12 survived. Do you draw lots to decide who stays?',
        options: [
          { label: 'Draw lots', correct: true },
          { label: 'No selection', correct: false },
        ],
        explanation: 'Random selection is the fairest method when all lives are equal.',
      },
    ],
  },
  // ===== SURVIVAL =====
  {
    category: 'survival',
    cards: [
      {
        prompt: 'Lost in the desert. You find a cactus. Drink cactus water?',
        options: [
          { label: 'Drink it', correct: false },
          { label: 'Avoid it', correct: true },
        ],
        explanation: 'Most cactus juice causes vomiting, worsening dehydration.',
      },
      {
        prompt: 'Caught in a riptide at the beach. Best action?',
        options: [
          { label: 'Swim parallel to shore', correct: true },
          { label: 'Swim toward shore', correct: false },
        ],
        explanation: 'Swim parallel to escape the current, then angle toward shore.',
      },
      {
        prompt: 'Earthquake starts while indoors. Best position?',
        options: [
          { label: 'Under sturdy table', correct: true },
          { label: 'Run outside', correct: false },
        ],
        explanation: 'Drop, cover, hold. Running risks falling debris at exits.',
      },
    ],
  },
  {
    category: 'survival',
    cards: [
      {
        prompt: 'Your car breaks down in a blizzard. Stay in car or walk for help?',
        options: [
          { label: 'Stay in car', correct: true },
          { label: 'Walk for help', correct: false },
        ],
        explanation: 'Cars provide shelter and are easier for rescuers to spot.',
      },
      {
        prompt: 'You smell gas in your house. Best action?',
        options: [
          { label: 'Open windows and leave', correct: true },
          { label: 'Turn on lights to see', correct: false },
        ],
        explanation: 'Light switches can spark and ignite gas. Ventilate and evacuate.',
      },
      {
        prompt: 'Bear encounter in the woods. It is a grizzly and charges. What do you do?',
        options: [
          { label: 'Play dead', correct: true },
          { label: 'Run away', correct: false },
        ],
        explanation: 'Grizzly attacks: play dead. Running triggers pursuit instinct.',
      },
    ],
  },
  {
    category: 'survival',
    cards: [
      {
        prompt: 'Stranded at sea. You have saltwater. Drink it?',
        options: [
          { label: 'Drink it', correct: false },
          { label: 'Never drink it', correct: true },
        ],
        explanation: 'Saltwater accelerates dehydration and kidney failure.',
      },
      {
        prompt: 'Lightning storm in open field. Best posture?',
        options: [
          { label: 'Crouch low, feet together', correct: true },
          { label: 'Lie flat on ground', correct: false },
        ],
        explanation: 'Crouching minimizes height and ground contact. Lying flat increases ground current risk.',
      },
      {
        prompt: 'House fire, room filling with smoke. How do you move?',
        options: [
          { label: 'Crawl low', correct: true },
          { label: 'Stand and run', correct: false },
        ],
        explanation: 'Smoke rises. Breathable air is near the floor.',
      },
    ],
  },
  {
    category: 'survival',
    cards: [
      {
        prompt: 'You fall through ice into freezing water. First priority?',
        options: [
          { label: 'Control breathing', correct: true },
          { label: 'Swim hard', correct: false },
        ],
        explanation: 'Cold shock causes gasping. Controlling breathing prevents drowning.',
      },
      {
        prompt: 'Bitten by a snake. Should you suck out the venom?',
        options: [
          { label: 'Suck it out', correct: false },
          { label: 'Keep calm, seek help', correct: true },
        ],
        explanation: 'Suction does not work. Stay calm to slow venom spread, get to hospital.',
      },
      {
        prompt: 'Tornado warning. You are in a mobile home. Best action?',
        options: [
          { label: 'Stay inside', correct: false },
          { label: 'Evacuate to shelter', correct: true },
        ],
        explanation: 'Mobile homes offer zero tornado protection. Find a sturdy building or ditch.',
      },
    ],
  },
  {
    category: 'survival',
    cards: [
      {
        prompt: 'Lost in forest. You find a stream. Follow it upstream or downstream?',
        options: [
          { label: 'Downstream', correct: true },
          { label: 'Upstream', correct: false },
        ],
        explanation: 'Streams flow to rivers, rivers to civilization. Follow downstream.',
      },
      {
        prompt: 'Avalanche starts above you while skiing. Best move?',
        options: [
          { label: 'Ski perpendicular', correct: true },
          { label: 'Ski straight down', correct: false },
        ],
        explanation: 'Move perpendicular to the avalanche path to escape its width.',
      },
      {
        prompt: 'You are stung by a jellyfish. Apply what?',
        options: [
          { label: 'Vinegar', correct: true },
          { label: 'Fresh water', correct: false },
        ],
        explanation: 'Vinegar neutralizes nematocysts. Fresh water causes them to fire more.',
      },
    ],
  },
  // ===== MATH =====
  {
    category: 'math',
    cards: [
      {
        prompt: '17 x 6 = ?',
        options: [
          { label: '96', correct: false },
          { label: '102', correct: true },
        ],
        explanation: '17 x 6 = (10 x 6) + (7 x 6) = 60 + 42 = 102.',
      },
      {
        prompt: 'What is 15% of 240?',
        options: [
          { label: '36', correct: true },
          { label: '42', correct: false },
        ],
        explanation: '10% = 24, 5% = 12, total = 36.',
      },
      {
        prompt: 'Square root of 169?',
        options: [
          { label: '12', correct: false },
          { label: '13', correct: true },
        ],
        explanation: '13 x 13 = 169.',
      },
    ],
  },
  {
    category: 'math',
    cards: [
      {
        prompt: 'A train travels 240 km in 3 hours. Speed in km/h?',
        options: [
          { label: '80', correct: true },
          { label: '70', correct: false },
        ],
        explanation: '240 / 3 = 80 km/h.',
      },
      {
        prompt: 'If x + 7 = 23, what is x?',
        options: [
          { label: '16', correct: true },
          { label: '14', correct: false },
        ],
        explanation: '23 - 7 = 16.',
      },
      {
        prompt: '3^4 = ?',
        options: [
          { label: '81', correct: true },
          { label: '64', correct: false },
        ],
        explanation: '3 x 3 x 3 x 3 = 81.',
      },
    ],
  },
  {
    category: 'math',
    cards: [
      {
        prompt: 'You buy 3 items at $4.75 each. Total?',
        options: [
          { label: '$14.25', correct: true },
          { label: '$13.75', correct: false },
        ],
        explanation: '3 x $4.75 = $14.25.',
      },
      {
        prompt: 'What fraction is 0.375?',
        options: [
          { label: '3/8', correct: true },
          { label: '3/5', correct: false },
        ],
        explanation: '0.375 = 375/1000 = 3/8.',
      },
      {
        prompt: 'How many seconds in 2.5 hours?',
        options: [
          { label: '9000', correct: true },
          { label: '7200', correct: false },
        ],
        explanation: '2.5 x 60 x 60 = 9000 seconds.',
      },
    ],
  },
  {
    category: 'math',
    cards: [
      {
        prompt: 'A shirt costs $60 after a 25% discount. Original price?',
        options: [
          { label: '$80', correct: true },
          { label: '$75', correct: false },
        ],
        explanation: '$60 = 75% of original. $60 / 0.75 = $80.',
      },
      {
        prompt: 'What is 7! (7 factorial)?',
        options: [
          { label: '5040', correct: true },
          { label: '4320', correct: false },
        ],
        explanation: '7 x 6 x 5 x 4 x 3 x 2 x 1 = 5040.',
      },
      {
        prompt: 'Sum of interior angles of a hexagon?',
        options: [
          { label: '720', correct: true },
          { label: '1080', correct: false },
        ],
        explanation: '(6 - 2) x 180 = 720 degrees.',
      },
    ],
  },
  {
    category: 'math',
    cards: [
      {
        prompt: 'Compound interest: $1000 at 10% for 2 years. Total?',
        options: [
          { label: '$1210', correct: true },
          { label: '$1200', correct: false },
        ],
        explanation: 'Year 1: $1100. Year 2: $1100 x 1.10 = $1210.',
      },
      {
        prompt: 'A rectangle is 12 cm by 8 cm. Diagonal length?',
        options: [
          { label: '~14.4 cm', correct: true },
          { label: '~16.2 cm', correct: false },
        ],
        explanation: 'sqrt(144 + 64) = sqrt(208) ~ 14.42 cm.',
      },
      {
        prompt: 'If 2x - 5 = 3x + 1, what is x?',
        options: [
          { label: '-6', correct: true },
          { label: '6', correct: false },
        ],
        explanation: '2x - 3x = 1 + 5 => -x = 6 => x = -6.',
      },
    ],
  },
];

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

function getTimerDuration(round: number): number {
  if (round >= 20) return 3000;
  if (round >= 15) return 3500;
  if (round >= 10) return 4000;
  if (round >= 5) return 4500;
  return 5000;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

type Phase = 'ready' | 'playing' | 'feedback' | 'gameover';

export default function SplitDecision({ onBack, onGameEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [streak, setStreak] = useState(0);
  const [queue, setQueue] = useState<ScenarioSet[]>([]);
  const [current, setCurrent] = useState<ScenarioSet | null>(null);
  // Track which card index the player has answered, and which option they picked
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [timerFrac, setTimerFrac] = useState(1);
  const [showResults, setShowResults] = useState(false);

  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const timerExpiredRef = useRef(false);
  const answerTimesRef = useRef<(number | null)[]>([null, null, null]);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const vfxRafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const gameStartRef = useRef(Date.now());
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- VFX animation loop ---------- */
  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.1) return;
    const tick = () => {
      setParticles(prev => tickParticles(prev));
      setScorePops(prev => tickScorePops(prev));
      setShakeIntensity(prev => prev * 0.85);
      vfxRafRef.current = requestAnimationFrame(tick);
    };
    vfxRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(vfxRafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.1]);

  /* ---------- queue management ---------- */
  const refillQueue = useCallback(() => {
    const q = shuffle(SCENARIOS);
    setQueue(q);
    return q;
  }, []);

  const nextRound = useCallback(
    (q?: ScenarioSet[], r?: number) => {
      let working = q ?? queue;
      if (working.length === 0) {
        working = shuffle(SCENARIOS);
        setQueue(working);
      }
      const next = working[0];
      setQueue(working.slice(1));
      setCurrent(next);
      setAnswers([null, null, null]);
      answerTimesRef.current = [null, null, null];
      setTimerFrac(1);
      setShowResults(false);
      timerExpiredRef.current = false;
      setPhase('playing');

      const duration = getTimerDuration(r ?? round);
      startTimeRef.current = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const frac = Math.max(0, 1 - elapsed / duration);
        setTimerFrac(frac);
        if (frac <= 0) {
          if (!timerExpiredRef.current) {
            timerExpiredRef.current = true;
            sfxWrong();
            setPhase('feedback');
          }
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [queue, round],
  );

  /* ---------- start / restart ---------- */
  const startGame = useCallback(() => {
    sfxTap();
    correctRef.current = 0;
    attemptsRef.current = 0;
    gameStartRef.current = Date.now();
    setRound(1);
    setScore(0);
    setLives(5);
    setStreak(0);
    setShowResults(false);
    const q = refillQueue();
    nextRound(q, 1);
  }, [refillQueue, nextRound]);

  /* ---------- handle choice on a specific card ---------- */
  const handleChoice = useCallback(
    (cardIdx: number, optionIdx: number) => {
      if (phase !== 'playing' || !current) return;
      if (answers[cardIdx] !== null) return; // already answered this card

      const newAnswers = [...answers];
      newAnswers[cardIdx] = optionIdx;
      setAnswers(newAnswers);

      const newTimes = [...answerTimesRef.current];
      newTimes[cardIdx] = performance.now() - startTimeRef.current;
      answerTimesRef.current = newTimes;

      // Check if all 3 cards answered
      const allAnswered = newAnswers.every(a => a !== null);
      if (allAnswered) {
        cancelAnimationFrame(rafRef.current);
        timerExpiredRef.current = true;
        setPhase('feedback');
      }
    },
    [phase, current, answers],
  );

  /* ---------- feedback effect ---------- */
  useEffect(() => {
    if (phase !== 'feedback' || current === null) return;

    setShowResults(true);

    // Calculate results
    let roundCorrect = 0;
    let roundPoints = 0;
    let wrongCount = 0;

    current.cards.forEach((card, idx) => {
      attemptsRef.current++;
      const playerAnswer = answers[idx];
      if (playerAnswer === null) {
        // Unanswered = wrong
        wrongCount++;
        return;
      }
      const isCorrect = card.options[playerAnswer].correct;
      if (isCorrect) {
        correctRef.current++;
        roundCorrect++;
        let pts = 100;
        // Speed bonus based on answer time
        const t = answerTimesRef.current[idx];
        const duration = getTimerDuration(round);
        if (t !== null && t < duration * 0.4) {
          pts += 50;
        } else if (t !== null && t < duration * 0.7) {
          pts += 25;
        }
        roundPoints += pts;
      } else {
        wrongCount++;
      }
    });

    // Combo bonus: all 3 correct
    const allCorrect = roundCorrect === 3;
    if (allCorrect) {
      roundPoints += 100;
    }

    // Streak
    const newStreak = allCorrect ? streak + 1 : 0;
    if (newStreak >= 2) {
      roundPoints = Math.floor(roundPoints * (1 + (newStreak - 1) * 0.25));
    }
    setStreak(newStreak);

    const newScore = score + roundPoints;
    const newLives = lives - wrongCount;
    setScore(newScore);
    setLives(newLives);

    // VFX
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 200;
    const cy = rect ? rect.height / 2 : 300;

    if (roundCorrect > 0) {
      sfxCorrect();
      setParticles(prev => [...prev, ...correctBurst(cx, cy)]);
      if (roundPoints > 0) {
        setScorePops(prev => [...prev, createScorePop(cx, cy - 40, roundPoints, '#00c97b')]);
      }
    }
    if (wrongCount > 0) {
      setShakeIntensity(wrongCount * 3);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      if (newLives <= 0) {
        sfxGameOver();
        setShakeIntensity(10);
        setPhase('gameover');
      } else {
        sfxLevelUp();
        const newRound = round + 1;
        setRound(newRound);
        nextRound(undefined, newRound);
      }
    }, 2500);

    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---------- cleanup ---------- */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Report score when game ends
  useEffect(() => {
    if (phase === 'gameover') {
      const total = attemptsRef.current;
      const correct = correctRef.current;
      onGameEnd?.({
        score,
        accuracy: total > 0 ? correct / total : 0,
        level: round,
        timeMs: Date.now() - gameStartRef.current,
      });
    }
  }, [phase, score, round, onGameEnd]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  /* --- shared header --- */
  const header = (showStats: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      <button
        onClick={onBack}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          color: C.text,
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: C.transition,
        }}
      >
        <ArrowLeft size={18} />
      </button>

      {showStats && (
        <>
          <span style={{ color: C.muted, fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
            R{round}
          </span>

          {streak >= 2 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: C.accent,
              fontSize: 13,
              fontWeight: 600,
            }}>
              <Flame size={14} />
              {streak}x
            </span>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trophy size={15} color={C.accent} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{score}</span>
          </div>

          <div style={{ display: 'flex', gap: 3, marginLeft: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                fill={i < lives ? C.error : 'transparent'}
                color={i < lives ? C.error : C.border}
                style={{ transition: C.transition }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  /* --- VFX overlay --- */
  const vfxOverlay = (
    <>
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </>
  );

  /* --- READY screen --- */
  if (phase === 'ready') {
    return (
      <div ref={containerRef} style={{ ...containerStyle, ...screenShakeStyle(shakeIntensity) }}>
        {header(false)}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Zap size={56} color={C.accent} />
          <h1 style={{ color: C.text, fontSize: 26, margin: 0, fontWeight: 600 }}>
            Split Decision
          </h1>
          <p style={{ color: C.muted, fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 1.7, margin: 0 }}>
            Three scenarios appear simultaneously.
            Read fast, decide faster.
            Pick the correct response for each card before time runs out.
            All 3 right earns a combo bonus. Build streaks for multiplied scores.
            5 wrong answers and it is over.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            maxWidth: 340,
          }}>
            {(Object.keys(CATEGORY_COLORS) as Category[]).map(cat => (
              <span key={cat} style={{
                background: CATEGORY_COLORS[cat] + '22',
                color: CATEGORY_COLORS[cat],
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: C.pill,
                letterSpacing: 0.5,
              }}>
                {CATEGORY_LABELS[cat]}
              </span>
            ))}
          </div>
          <button onClick={startGame} style={primaryBtnStyle}>
            Start Game
          </button>
        </div>
        {vfxOverlay}
      </div>
    );
  }

  /* --- GAME OVER screen --- */
  if (phase === 'gameover') {
    const total = attemptsRef.current;
    const correct = correctRef.current;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div ref={containerRef} style={{ ...containerStyle, ...screenShakeStyle(shakeIntensity) }}>
        {header(false)}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <Trophy size={56} color={C.accent} />
          <h1 style={{ color: C.text, fontSize: 26, margin: 0, fontWeight: 600 }}>
            Game Over
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
            Reached round {round}
          </p>
          <p style={{ color: C.accent, fontSize: 40, fontWeight: 600, margin: 0 }}>
            {score}
          </p>
          <p style={{ color: C.muted, fontSize: 12, margin: 0, letterSpacing: 1 }}>POINTS</p>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: C.text, fontSize: 20, fontWeight: 600, margin: 0 }}>{accuracy}%</p>
              <p style={{ color: C.muted, fontSize: 11, margin: '4px 0 0' }}>Accuracy</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: C.text, fontSize: 20, fontWeight: 600, margin: 0 }}>{correct}/{total}</p>
              <p style={{ color: C.muted, fontSize: 11, margin: '4px 0 0' }}>Correct</p>
            </div>
          </div>
          <button onClick={startGame} style={{ ...primaryBtnStyle, gap: 8, display: 'flex', alignItems: 'center', marginTop: 8 }}>
            <RotateCcw size={18} />
            Play Again
          </button>
        </div>
        {vfxOverlay}
      </div>
    );
  }

  /* --- PLAYING / FEEDBACK --- */
  if (!current) return null;

  const catColor = CATEGORY_COLORS[current.category];
  const duration = getTimerDuration(round);
  const timerSeconds = (duration / 1000).toFixed(1);

  return (
    <div ref={containerRef} style={{ ...containerStyle, ...screenShakeStyle(shakeIntensity) }}>
      {header(true)}

      {/* Category badge */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <span style={{
          display: 'inline-block',
          background: catColor,
          color: '#000',
          fontWeight: 600,
          fontSize: 12,
          padding: '5px 16px',
          borderRadius: C.pill,
          letterSpacing: 1.5,
        }}>
          {CATEGORY_LABELS[current.category]}
        </span>
      </div>

      {/* Timer bar */}
      <div style={{
        height: 5,
        borderRadius: 3,
        background: C.border,
        marginBottom: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 3,
          width: `${timerFrac * 100}%`,
          background: timerFrac > 0.3 ? catColor : C.error,
          transition: phase === 'feedback' ? 'none' : 'background 200ms ease',
        }} />
      </div>

      {/* Timer text */}
      <div style={{
        textAlign: 'center',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        <Clock size={13} color={C.muted} />
        <span style={{ color: C.muted, fontSize: 12 }}>
          {timerSeconds}s window
        </span>
        {answers.filter(a => a !== null).length > 0 && phase === 'playing' && (
          <span style={{ color: C.success, fontSize: 12, marginLeft: 8 }}>
            {answers.filter(a => a !== null).length}/3 answered
          </span>
        )}
      </div>

      {/* Three scenario cards */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflowY: 'auto',
        paddingBottom: 8,
      }}>
        {current.cards.map((card, cardIdx) => {
          const playerAnswer = answers[cardIdx];
          const answered = playerAnswer !== null;
          const isFeedback = showResults;

          let correctOptIdx = -1;
          card.options.forEach((opt, oi) => {
            if (opt.correct) correctOptIdx = oi;
          });

          const isCardCorrect = answered && playerAnswer === correctOptIdx;

          return (
            <div
              key={cardIdx}
              style={{
                background: C.card,
                border: `1px solid ${isFeedback
                  ? (answered
                    ? (isCardCorrect ? C.success + '88' : C.error + '88')
                    : C.error + '88')
                  : (answered ? catColor + '44' : C.border)
                }`,
                borderRadius: C.radius,
                padding: '12px 14px',
                transition: `border-color ${C.transition}`,
              }}
            >
              {/* Card header */}
              <div style={{
                fontSize: 12,
                color: catColor,
                fontWeight: 600,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}>
                {cardIdx + 1} of 3
              </div>

              {/* Scenario prompt */}
              <p style={{
                color: C.text,
                fontSize: 13,
                lineHeight: 1.5,
                margin: '0 0 10px',
                fontWeight: 500,
              }}>
                {card.prompt}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', gap: 8 }}>
                {card.options.map((opt, optIdx) => {
                  const isSelected = playerAnswer === optIdx;
                  const isCorrectOpt = opt.correct;

                  let optBg: string = C.bg;
                  let optBorder: string = C.border;
                  let optColor: string = C.text;

                  if (isFeedback) {
                    if (isCorrectOpt) {
                      optBg = '#0a2a1e';
                      optBorder = C.success;
                      optColor = C.success;
                    } else if (isSelected && !isCorrectOpt) {
                      optBg = '#2a0a14';
                      optBorder = C.error;
                      optColor = C.error;
                    }
                  } else if (isSelected) {
                    optBg = catColor + '22';
                    optBorder = catColor;
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleChoice(cardIdx, optIdx)}
                      disabled={phase !== 'playing' || answered}
                      style={{
                        flex: 1,
                        background: optBg,
                        border: `1.5px solid ${optBorder}`,
                        borderRadius: 10,
                        padding: '8px 6px',
                        cursor: phase === 'playing' && !answered ? 'pointer' : 'default',
                        color: optColor,
                        fontSize: 12,
                        fontWeight: 600,
                        transition: `all ${C.transition}`,
                        lineHeight: 1.3,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Explanation on feedback */}
              {isFeedback && (
                <p style={{
                  color: C.muted,
                  fontSize: 11,
                  lineHeight: 1.5,
                  margin: '8px 0 0',
                  fontStyle: 'normal',
                }}>
                  {card.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {vfxOverlay}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */
const containerStyle: React.CSSProperties = {
  background: C.bg,
  minHeight: '100vh',
  padding: '16px 14px',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  maxWidth: 520,
  margin: '0 auto',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
};

const primaryBtnStyle: React.CSSProperties = {
  background: C.accent,
  color: '#000',
  border: 'none',
  borderRadius: C.pill,
  padding: '14px 36px',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  transition: C.transition,
};
