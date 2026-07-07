import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ArrowLeft, Brain, ChevronRight, Trophy,
  RotateCcw, Target, Scale, Zap, BookOpen, Star,
  Shield, AlertTriangle, ThumbsUp, ThumbsDown
} from 'lucide-react'
import { COLOR, RADIUS, MOTION, solidBtn } from '../lib/design'
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxLevelUp, sfxReveal } from '../lib/sfx'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase =
  | 'menu'
  | 'topic-reveal'
  | 'debate'
  | 'round-result'
  | 'debate-summary'
  | 'final-result'

type Quality = 'strong' | 'decent' | 'weak' | 'fallacious'

interface Rebuttal {
  text: string
  quality: Quality
  logic: number
  evidence: number
  persuasion: number
  explanation: string
}

interface DebateRoundData {
  aiArgument: string
  rebuttals: Rebuttal[]
}

interface TopicData {
  title: string
  rounds: DebateRoundData[]
}

interface PlayedRound {
  roundNum: number
  aiArgument: string
  chosenRebuttal: Rebuttal
  playerSide: 'for' | 'against'
}

interface DebateRecord {
  topicTitle: string
  playerSide: 'for' | 'against'
  rounds: PlayedRound[]
  playerTotal: number
  aiTotal: number
  winner: 'player' | 'ai' | 'draw'
}

/* ------------------------------------------------------------------ */
/*  15 Debate Topics - 5 rounds each, 4 rebuttals per round           */
/* ------------------------------------------------------------------ */

const TOPICS: TopicData[] = [
  /* 1 ── Social media does more harm than good */
  {
    title: 'Social media does more harm than good',
    rounds: [
      {
        aiArgument: 'Social media has connected billions of people across the globe, enabling grassroots movements like the Arab Spring and Black Lives Matter. Without these platforms, marginalized voices would remain unheard by mainstream society.',
        rebuttals: [
          { text: 'While social media amplifies some voices, research from NYU shows it also amplifies misinformation at six times the rate of factual content, undermining the very democratic discourse it claims to enable.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Directly addresses the claim with specific research while acknowledging the premise.' },
          { text: 'Those movements would have happened anyway through traditional organizing. Social media just made them more visible but also more shallow and short-lived.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Reasonable counterpoint but lacks supporting evidence.' },
          { text: 'Most people use social media for cat videos, not political activism. The activism angle is overblown.', quality: 'weak', logic: 4, evidence: 3, persuasion: 4, explanation: 'Dismissive and anecdotal, fails to engage with the substance.' },
          { text: 'The people behind social media companies are billionaires who do not care about anyone, so nothing they create can be good.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 3, explanation: 'Ad hominem attack on creators rather than addressing the platform effects.' },
        ],
      },
      {
        aiArgument: 'Social media democratizes information access. A farmer in rural Kenya can access the same knowledge as a Harvard student. This unprecedented equalization of information is a net positive for humanity.',
        rebuttals: [
          { text: 'The digital divide means 2.7 billion people still lack internet access entirely, and algorithmic curation means those online receive filtered, engagement-optimized content rather than balanced knowledge.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Challenges both the access claim and the quality-of-information claim with data.' },
          { text: 'Access to information is not the same as access to quality education. Having Wikipedia open does not make someone a Harvard graduate.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Valid distinction but does not fully counter the democratization point.' },
          { text: 'People in rural areas probably do not even want all that information anyway.', quality: 'weak', logic: 3, evidence: 2, persuasion: 2, explanation: 'Patronizing assumption with no basis.' },
          { text: 'If social media were truly democratic, why did they ban the former president? They clearly pick and choose.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 4, explanation: 'Red herring that conflates content moderation with information access.' },
        ],
      },
      {
        aiArgument: 'Small businesses thrive on social media marketing. Over 200 million businesses use these platforms, and for many in developing nations, it is their only affordable advertising channel that levels the playing field against corporate giants.',
        rebuttals: [
          { text: 'While initial organic reach helped small businesses, Meta now shows business posts to only 2-5% of followers unless they pay for ads, effectively creating a pay-to-play system that disadvantages the smallest operators.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Uses platform-specific data to show the promise has been undermined.' },
          { text: 'Many small businesses report spending more time managing social media than actually running their business, suggesting the benefit is overstated.', quality: 'decent', logic: 6, evidence: 5, persuasion: 7, explanation: 'Practical observation but lacks hard data.' },
          { text: 'Big companies still dominate social media advertising budgets, so small businesses cannot really compete there either.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Partially true but ignores the niche advantages social media provides.' },
          { text: 'Social media companies are just trying to get everyone addicted so they can sell more ads. The small business angle is just propaganda.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Conspiracy framing that ignores legitimate business utility.' },
        ],
      },
      {
        aiArgument: 'Mental health concerns about social media are overblown. The APA notes that social media can reduce loneliness for isolated individuals, provide peer support communities for rare conditions, and the correlation between social media use and depression does not establish causation.',
        rebuttals: [
          { text: 'Internal Facebook research leaked in 2021 showed the company knew Instagram made body image issues worse for one in three teenage girls, yet chose profit over intervention, demonstrating that even the platforms acknowledge measurable harm.', quality: 'strong', logic: 9, evidence: 10, persuasion: 9, explanation: 'Uses the platform\'s own internal research as devastating counter-evidence.' },
          { text: 'Even if correlation is not causation, the precautionary principle suggests we should act on strong correlational evidence when children\'s wellbeing is at stake.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Solid ethical argument but does not directly refute the causation point.' },
          { text: 'Everyone knows social media is bad for mental health. You can just see it in how people behave online.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'Appeals to common sense without evidence.' },
          { text: 'The APA probably gets funding from tech companies, so their opinion cannot be trusted.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Poisoning the well without any evidence of bias.' },
        ],
      },
      {
        aiArgument: 'Ultimately, social media is a tool. Blaming social media for societal problems is like blaming the printing press for propaganda. The technology itself is neutral; it is human nature and regulatory failure that create negative outcomes, and those can be addressed without eliminating the platforms.',
        rebuttals: [
          { text: 'Unlike the printing press, social media platforms are designed with engagement-maximizing algorithms that deliberately exploit psychological vulnerabilities. The tool analogy fails because these tools are engineered to be addictive, making them fundamentally different from neutral technologies.', quality: 'strong', logic: 10, evidence: 8, persuasion: 9, explanation: 'Dismantles the core analogy by identifying the key disanalogy.' },
          { text: 'Even if we accept the tool argument, we regulate dangerous tools all the time: guns, cars, pharmaceuticals. Regulation is not elimination.', quality: 'decent', logic: 8, evidence: 6, persuasion: 7, explanation: 'Turns the analogy against itself effectively.' },
          { text: 'If it were just a tool, why are so many people addicted to it? Tools do not make people addicted.', quality: 'weak', logic: 5, evidence: 3, persuasion: 5, explanation: 'Somewhat circular reasoning.' },
          { text: 'Mark Zuckerberg himself has admitted he does not let his kids use social media, which proves even he knows it is harmful.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 5, explanation: 'Appeal to hypocrisy that does not actually prove the tool is inherently harmful.' },
        ],
      },
    ],
  },

  /* 2 ── Universal basic income should be implemented */
  {
    title: 'Universal basic income should be implemented',
    rounds: [
      {
        aiArgument: 'UBI eliminates the bureaucratic overhead of means-tested welfare. Finland\'s 2017 pilot showed recipients reported higher wellbeing and were no less likely to seek employment, disproving the laziness myth.',
        rebuttals: [
          { text: 'Finland\'s pilot was limited to 2,000 unemployed individuals over two years and found no statistically significant employment effect. Scaling from 2,000 to 5.5 million citizens involves fiscal challenges the pilot never addressed.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Challenges the evidence directly with specific methodological limitations.' },
          { text: 'Reducing bureaucracy sounds good, but UBI would require massive new tax infrastructure to fund it, potentially creating different bureaucratic burdens.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Reasonable but somewhat speculative.' },
          { text: 'If people get free money they will just stop working. That is human nature.', quality: 'weak', logic: 3, evidence: 2, persuasion: 4, explanation: 'Directly contradicted by the pilot data already presented.' },
          { text: 'UBI is just socialism rebranded. Every socialist experiment has failed, so this will too.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Guilt by association fallacy; UBI is supported across the political spectrum.' },
        ],
      },
      {
        aiArgument: 'Automation will eliminate up to 30% of current jobs by 2030 according to McKinsey. Without UBI, we face mass unemployment and social instability. UBI is not idealism but pragmatic preparation for an inevitable economic transition.',
        rebuttals: [
          { text: 'McKinsey\'s own report distinguishes between tasks automated and jobs eliminated; historically, automation has transformed roles rather than destroying them outright. The Industrial Revolution displaced 80% of agricultural workers, yet unemployment did not permanently spike because new industries emerged.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Uses historical context and corrects the cited source.' },
          { text: 'Targeted retraining programs and industry transition funds may address displacement more efficiently than blanket payments to everyone including those whose jobs are not at risk.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Proposes alternative without dismissing the problem.' },
          { text: 'Automation predictions have been wrong before. People said ATMs would eliminate bank tellers, but there are more tellers now.', quality: 'weak', logic: 5, evidence: 4, persuasion: 4, explanation: 'Cherry-picks one example against a broader trend.' },
          { text: 'The people at McKinsey are management consultants trying to sell automation services, so of course they exaggerate the threat.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Ad hominem attack on the source rather than the data.' },
        ],
      },
      {
        aiArgument: 'UBI would unleash entrepreneurship. Most people cannot take the risk of starting a business because failure means destitution. With a guaranteed floor, more people would innovate, creating the next wave of economic growth and job creation.',
        rebuttals: [
          { text: 'The Y Combinator UBI study found recipients were only marginally more likely to start businesses, and those businesses had lower survival rates. Access to capital, mentorship, and market knowledge matter more than a subsistence floor for entrepreneurship.', quality: 'strong', logic: 8, evidence: 9, persuasion: 8, explanation: 'Cites relevant experimental data to challenge the theoretical claim.' },
          { text: 'Countries with strong social safety nets like Sweden and Denmark already have high entrepreneurship rates, suggesting targeted support rather than universal payments drives innovation.', quality: 'decent', logic: 7, evidence: 7, persuasion: 6, explanation: 'Good comparative evidence but does not fully refute the point.' },
          { text: 'Most people are not entrepreneurs anyway. Giving everyone money will not suddenly make them business-savvy.', quality: 'weak', logic: 4, evidence: 3, persuasion: 4, explanation: 'Dismissive generalization.' },
          { text: 'This is just trickle-up economics, which is as flawed as trickle-down.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'False equivalence between two fundamentally different mechanisms.' },
        ],
      },
      {
        aiArgument: 'UBI recognizes the economic value of unpaid labor. Parents, caregivers, and community volunteers contribute enormously to society but receive no compensation. UBI corrects this market failure and achieves gender equity by valuing care work predominantly performed by women.',
        rebuttals: [
          { text: 'If the goal is compensating unpaid care work, targeted caregiver stipends accomplish this more efficiently and at lower cost. UBI pays the same amount to a childless investment banker as to a single mother of four, which is a blunt instrument for addressing care work inequity.', quality: 'strong', logic: 9, evidence: 7, persuasion: 9, explanation: 'Accepts the premise but shows UBI is poorly targeted for this goal.' },
          { text: 'While recognizing unpaid labor is important, UBI might inadvertently reinforce gendered care expectations by making it financially easier for women to stay home rather than enter the workforce.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Raises a genuine concern about unintended consequences.' },
          { text: 'People choose to volunteer and do care work. They do not need to be paid for it.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'Ignores the structural constraints on "choice" in care work.' },
          { text: 'This is just a feminist argument dressed up as economics. UBI should be debated on economic merits alone.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Dismisses a legitimate economic argument by labeling it ideological.' },
        ],
      },
      {
        aiArgument: 'The cost of UBI is often overstated. By consolidating existing welfare programs, implementing a modest VAT, and accounting for the economic multiplier effect of putting money directly into consumers\' hands, UBI can be revenue-neutral while reducing poverty more effectively than current patchwork systems.',
        rebuttals: [
          { text: 'The OECD modeled revenue-neutral UBI for multiple countries and found that replacing existing benefits with a flat payment would actually increase poverty among the most vulnerable, since targeted programs provide more to those who need it most. Revenue neutrality and poverty reduction are in tension, not alignment.', quality: 'strong', logic: 10, evidence: 9, persuasion: 9, explanation: 'Uses authoritative modeling to expose the fundamental trade-off.' },
          { text: 'The multiplier effect assumption relies on recipients spending locally, but in an era of global e-commerce, much of that spending may flow to international corporations rather than stimulating local economies.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Challenges one pillar of the argument thoughtfully.' },
          { text: 'Governments always underestimate costs and overestimate benefits. This would be no different.', quality: 'weak', logic: 4, evidence: 3, persuasion: 4, explanation: 'Cynical generalization without specific analysis.' },
          { text: 'If we can afford to bail out banks, we can afford UBI. End of argument.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 4, explanation: 'Whataboutism that avoids addressing the actual fiscal question.' },
        ],
      },
    ],
  },

  /* 3 ── Space exploration is worth the cost */
  {
    title: 'Space exploration is worth the cost',
    rounds: [
      {
        aiArgument: 'NASA generates $7 in economic output for every $1 invested, through technology spinoffs like memory foam, water purification systems, and satellite communications that have transformed everyday life on Earth.',
        rebuttals: [
          { text: 'The $7-to-$1 figure comes from a 1970s Chase Econometrics study and has never been replicated with modern methodology. Direct R&D investment in those same technologies without the space component would likely yield even higher returns per dollar.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Questions the source and proposes a more efficient alternative.' },
          { text: 'Many of those spinoff technologies were developed incidentally. Targeted research programs could achieve similar breakthroughs at a fraction of the cost.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Reasonable alternative but somewhat speculative.' },
          { text: 'Memory foam and water filters are nice, but they are not worth billions of dollars.', quality: 'weak', logic: 4, evidence: 3, persuasion: 3, explanation: 'Trivializes significant technologies without economic analysis.' },
          { text: 'Space agencies just inflate their economic impact numbers to justify their budgets. You cannot trust government statistics.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Conspiracy thinking that dismisses all evidence without engagement.' },
        ],
      },
      {
        aiArgument: 'Earth faces existential risks: asteroid impacts, supervolcanic eruptions, and climate tipping points. Becoming a multiplanetary species is not luxury but survival insurance. Putting all of humanity on one planet is an unacceptable single point of failure.',
        rebuttals: [
          { text: 'The probability of an extinction-level asteroid impact is roughly 1 in 600,000 per century. Meanwhile, 9 million people die annually from air pollution. Allocating space colonization budgets to immediate terrestrial threats would save orders of magnitude more lives per dollar.', quality: 'strong', logic: 9, evidence: 9, persuasion: 9, explanation: 'Uses comparative risk analysis to challenge resource allocation.' },
          { text: 'A Mars colony would remain dependent on Earth for decades. It would not be a true backup for humanity until it achieves complete self-sufficiency, which is centuries away at best.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Valid practical limitation.' },
          { text: 'We should fix Earth before trying to colonize other planets.', quality: 'weak', logic: 4, evidence: 2, persuasion: 5, explanation: 'Common sentiment but presents a false either-or choice.' },
          { text: 'Billionaires like Elon Musk just want escape pods for the rich. Space colonization is about inequality, not survival.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 4, explanation: 'Attacks motives of specific individuals rather than the argument itself.' },
        ],
      },
      {
        aiArgument: 'Space exploration inspires entire generations to pursue STEM careers. The Apollo program alone is credited with producing a generation of scientists and engineers who drove America\'s technological dominance for decades.',
        rebuttals: [
          { text: 'Post-Apollo STEM enrollment actually declined through the 1970s and 1980s. The inspiration narrative is romantic but unsupported by enrollment data. Countries without space programs, like South Korea and Singapore, have produced higher per-capita STEM graduation rates through education policy alone.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Directly contradicts the claim with enrollment data and comparative evidence.' },
          { text: 'Inspiration is valuable but difficult to quantify. Other endeavors like medical breakthroughs or environmental restoration could inspire equally while addressing more immediate needs.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Fair point but somewhat hypothetical.' },
          { text: 'Kids today are inspired by social media influencers, not astronauts. The inspiration argument is outdated.', quality: 'weak', logic: 4, evidence: 3, persuasion: 4, explanation: 'Generalization without data.' },
          { text: 'They only say that because NASA spends millions on propaganda and PR. Of course people feel inspired when they are being marketed to.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Reduces genuine human curiosity to mere marketing manipulation.' },
        ],
      },
      {
        aiArgument: 'Space-based resources could solve Earth\'s scarcity problems. A single metallic asteroid contains more platinum-group metals than have ever been mined on Earth. Space mining could eliminate resource conflicts and enable sustainable growth without further environmental destruction.',
        rebuttals: [
          { text: 'Goldman Sachs estimated that bringing asteroid resources to market would cost $2.6 billion per mission with current technology, while the influx of rare metals would crash commodity prices, destroying the economic incentive that justifies the initial investment. It is a self-defeating economic proposition.', quality: 'strong', logic: 10, evidence: 8, persuasion: 9, explanation: 'Exposes the fundamental economic paradox of space mining.' },
          { text: 'Advances in recycling and material science could reduce resource scarcity far more cheaply than space mining, which remains decades from commercial viability.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Proposes practical alternatives.' },
          { text: 'Space mining is science fiction, not science. We are not even close to doing that.', quality: 'weak', logic: 4, evidence: 3, persuasion: 3, explanation: 'Dismissive without acknowledging ongoing development.' },
          { text: 'The mining companies will just exploit space the way they exploit Earth. Capitalism ruins everything it touches.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Ideological argument that does not address feasibility or value.' },
        ],
      },
      {
        aiArgument: 'The total global space budget is approximately $100 billion annually, which is 0.1% of global GDP. Even critics must concede this is a trivial allocation for an endeavor that advances fundamental science, drives technological innovation, monitors climate change, and provides global communications infrastructure.',
        rebuttals: [
          { text: 'The percentage argument obscures opportunity cost. That same $100 billion could fund the WHO for 20 years or provide clean water to every person on Earth. When resources are scarce, even small percentages must be justified against alternatives, and many terrestrial investments show higher and more certain returns on human welfare.', quality: 'strong', logic: 9, evidence: 8, persuasion: 10, explanation: 'Reframes the percentage argument as an opportunity cost question with concrete alternatives.' },
          { text: 'The 0.1% figure includes military satellites and communications, which would exist regardless of exploration mandates. The pure exploration budget is harder to justify on utilitarian grounds.', quality: 'decent', logic: 7, evidence: 7, persuasion: 6, explanation: 'Makes an important distinction about budget composition.' },
          { text: 'That money would probably just get wasted on something else anyway if it were not spent on space.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'Defeatist reasoning that abandons cost-benefit analysis.' },
          { text: 'The government wastes far more on military spending. At least space is peaceful.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Whataboutism that avoids evaluating space spending on its own merits.' },
        ],
      },
    ],
  },

  /* 4 ── AI will create more jobs than it destroys */
  {
    title: 'AI will create more jobs than it destroys',
    rounds: [
      {
        aiArgument: 'Every major technological revolution, from the steam engine to the internet, initially displaced workers but ultimately created far more jobs than it eliminated. AI is simply the latest chapter in this consistent historical pattern.',
        rebuttals: [
          { text: 'Previous revolutions augmented human physical capabilities, still requiring human cognition. AI is fundamentally different because it directly replaces cognitive labor, which is what most modern jobs consist of. The historical pattern may not hold when the replacement targets the mind rather than the body.', quality: 'strong', logic: 10, evidence: 7, persuasion: 9, explanation: 'Identifies the critical disanalogy in the historical comparison.' },
          { text: 'The pace of AI advancement is much faster than previous revolutions, potentially not allowing enough time for labor markets to adjust organically as they did before.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Valid concern about transition speed.' },
          { text: 'That is just what tech companies say to avoid regulation.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'Dismissive without engaging the historical evidence.' },
          { text: 'The people making AI are the same ones who said social media would connect humanity. Why should we believe them now?', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Guilt by association across unrelated claims.' },
        ],
      },
      {
        aiArgument: 'AI creates entirely new job categories that did not exist before: prompt engineers, AI trainers, ethics auditors, data curators, and AI-human collaboration specialists. LinkedIn reported a 30x increase in AI-related job postings between 2020 and 2024.',
        rebuttals: [
          { text: 'The new roles are predominantly high-skill positions requiring advanced technical education, while the jobs being displaced are middle-skill roles accessible to workers without degrees. This creates a polarization effect, not net job creation, hollowing out the middle class.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Distinguishes between job counts and job accessibility.' },
          { text: 'Many of these new roles like prompt engineering may be transitional. As AI improves, it will learn to prompt itself, eliminating the very jobs it initially created.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Thoughtful observation about the temporary nature of transition jobs.' },
          { text: 'Most of those AI job postings are just regular jobs with AI added to the title for marketing.', quality: 'weak', logic: 4, evidence: 3, persuasion: 4, explanation: 'Partially true but dismissive of genuine new roles.' },
          { text: 'LinkedIn profits from job postings, so of course they inflate the numbers.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Questions the messenger rather than the data.' },
        ],
      },
      {
        aiArgument: 'AI will make workers more productive, not redundant. Lawyers using AI research tools bill more efficiently. Doctors with AI diagnostics see more patients. The pattern is augmentation: AI handles routine tasks while humans focus on higher-value work.',
        rebuttals: [
          { text: 'Increased productivity per worker is precisely what reduces the number of workers needed. If one AI-augmented lawyer can do the work of five, law firms will hire one, not five. Productivity gains historically benefit employers through headcount reduction, not workers through role elevation.', quality: 'strong', logic: 10, evidence: 7, persuasion: 9, explanation: 'Exposes the logical flaw: productivity and employment can move inversely.' },
          { text: 'The augmentation narrative assumes companies will use AI to improve service quality rather than cut costs, but market pressures typically drive the latter.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Realistic about corporate incentives.' },
          { text: 'Doctors and lawyers are elite professionals. What about cashiers and truck drivers?', quality: 'weak', logic: 5, evidence: 3, persuasion: 5, explanation: 'Valid concern but does not build a counter-argument.' },
          { text: 'This is exactly what they said about outsourcing, and we all know how that turned out for workers.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'False analogy between fundamentally different economic phenomena.' },
        ],
      },
      {
        aiArgument: 'AI will generate entirely new industries we cannot yet imagine, just as the internet created e-commerce, social media, and the gig economy. Predicting that AI will only destroy jobs is like predicting in 1990 that the internet would only automate fax machines.',
        rebuttals: [
          { text: 'The internet created new industries that still required massive human labor: content creation, customer service, logistics. AI-native industries are likely to be capital-intensive and labor-light by design, since the core innovation is replacing human cognitive work.', quality: 'strong', logic: 9, evidence: 7, persuasion: 9, explanation: 'Accepts the premise but shows why the pattern will differ.' },
          { text: 'The argument from unknown future industries is unfalsifiable. We cannot plan economic policy around industries that may or may not materialize.', quality: 'decent', logic: 8, evidence: 5, persuasion: 6, explanation: 'Valid epistemological point.' },
          { text: 'Nobody can predict the future, so this argument proves nothing either way.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Nihilistic response that abdicates analysis.' },
          { text: 'The gig economy the internet created was terrible for workers. If AI creates similar exploitative industries, that is not a win.', quality: 'fallacious', logic: 4, evidence: 4, persuasion: 5, explanation: 'Shifts goalposts from job quantity to job quality, which is a different debate.' },
        ],
      },
      {
        aiArgument: 'Human creativity, empathy, and physical dexterity remain beyond AI capabilities. Therapy, artisan crafts, caregiving, teaching, and leadership all require irreplaceable human qualities. These sectors are growing and will absorb displaced workers while AI handles routine cognitive tasks.',
        rebuttals: [
          { text: 'Care work and creative fields are already among the lowest-paid sectors precisely because society undervalues them. Flooding these sectors with displaced workers from higher-paying cognitive jobs will further depress wages, creating a future where humans can only find work in jobs that do not pay enough to live on.', quality: 'strong', logic: 10, evidence: 8, persuasion: 10, explanation: 'Devastating structural argument about wage dynamics in the remaining human sectors.' },
          { text: 'GPT-4 already passes the bar exam and medical licensing exams. The boundary of what requires irreplaceable human qualities keeps shrinking faster than predicted.', quality: 'decent', logic: 7, evidence: 7, persuasion: 7, explanation: 'Strong evidence of shrinking human advantage.' },
          { text: 'AI art generators are already replacing illustrators and graphic designers, so creativity is not safe either.', quality: 'weak', logic: 5, evidence: 5, persuasion: 5, explanation: 'Valid observation but does not build a systematic argument.' },
          { text: 'The tech industry always promises utopia and delivers dystopia. This is no different.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Cynical generalization that substitutes for analysis.' },
        ],
      },
    ],
  },

  /* 5 ── Nuclear energy is the best solution to climate change */
  {
    title: 'Nuclear energy is the best solution to climate change',
    rounds: [
      {
        aiArgument: 'Nuclear produces 12 grams of CO2 per kilowatt-hour across its lifecycle, comparable to wind and lower than solar. It provides reliable baseload power regardless of weather, solving the intermittency problem that plagues renewables.',
        rebuttals: [
          { text: 'While lifecycle emissions are low, new nuclear plants take 10-15 years to build and cost $10-20 billion each. Solar and wind can be deployed in months at a fraction of the cost. Given the urgency of the climate crisis, we need the fastest and cheapest path to decarbonization, which nuclear cannot provide.', quality: 'strong', logic: 9, evidence: 9, persuasion: 9, explanation: 'Accepts the emissions data but reframes around deployment speed and cost.' },
          { text: 'Battery storage technology is advancing rapidly and may solve intermittency faster and more cheaply than building new nuclear plants.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Reasonable alternative but somewhat speculative on timeline.' },
          { text: 'Nuclear is just too dangerous. Chernobyl and Fukushima prove that.', quality: 'weak', logic: 4, evidence: 4, persuasion: 5, explanation: 'Relies on fear without comparative risk analysis.' },
          { text: 'The nuclear industry is run by the same corporations that gave us fossil fuels. They cannot be trusted with our energy future.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Ad hominem against the industry rather than the technology.' },
        ],
      },
      {
        aiArgument: 'France generates 70% of its electricity from nuclear with one of the lowest carbon intensities in Europe at 56g CO2/kWh, compared to Germany\'s 350g after its nuclear phase-out. France proves nuclear decarbonization works at national scale.',
        rebuttals: [
          { text: 'France\'s nuclear fleet was built in the 1970s-80s under a centralized state program with costs socialized across taxpayers, a model that no democratic market economy has been able to replicate since. The recent Flamanville EPR reactor was 12 years late and 300% over budget, suggesting France\'s historical success is not reproducible.', quality: 'strong', logic: 9, evidence: 10, persuasion: 8, explanation: 'Distinguishes historical achievement from future replicability with devastating specific evidence.' },
          { text: 'Germany\'s high carbon intensity is partly because it simultaneously phased out nuclear and expanded coal, a policy choice rather than an indictment of the alternatives.', quality: 'decent', logic: 7, evidence: 7, persuasion: 6, explanation: 'Provides necessary context for the comparison.' },
          { text: 'France also has a lot of problems with aging reactors and maintenance costs.', quality: 'weak', logic: 5, evidence: 4, persuasion: 4, explanation: 'Vague criticism without specifics.' },
          { text: 'France is a small country. What works there cannot work for larger nations.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Factually wrong (France has 67 million people) and non-sequitur.' },
        ],
      },
      {
        aiArgument: 'Nuclear has the lowest death rate per unit of energy produced of any source, including wind and solar. Per TWh generated, nuclear causes 0.03 deaths compared to 0.04 for wind, 0.05 for solar, and 24.6 for coal. Fear of nuclear is statistically irrational.',
        rebuttals: [
          { text: 'Safety statistics do not capture tail risk. Nuclear may cause fewer deaths per TWh under normal operations, but a worst-case nuclear accident can render thousands of square kilometers uninhabitable for decades. Renewables have no equivalent catastrophic failure mode, which matters for infrastructure that must operate reliably for 60+ years.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Distinguishes between average risk and catastrophic tail risk.' },
          { text: 'These statistics typically exclude long-term cancer impacts from radiation exposure, which are difficult to measure and may not manifest for decades after exposure.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Raises a legitimate methodological concern.' },
          { text: 'Tell that to the people of Fukushima who had to leave their homes.', quality: 'weak', logic: 4, evidence: 4, persuasion: 5, explanation: 'Emotional appeal that does not engage with the statistical argument.' },
          { text: 'Statistics can be manipulated to say anything. The nuclear industry funds these studies.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Blanket dismissal of evidence without specific methodological critique.' },
        ],
      },
      {
        aiArgument: 'Next-generation nuclear technologies like small modular reactors and molten salt reactors address historical concerns. SMRs are factory-built, cheaper, passively safe, and can be deployed at community scale. They represent a fundamentally different technology from legacy reactors.',
        rebuttals: [
          { text: 'NuScale, the most advanced SMR company, cancelled its first US project in 2023 after costs doubled to $9.3 billion. No SMR has reached commercial operation anywhere in the world. Basing climate strategy on unproven technology when proven alternatives exist is an unacceptable gamble with our climate timeline.', quality: 'strong', logic: 9, evidence: 10, persuasion: 9, explanation: 'Uses the most recent real-world data to challenge the promise of next-gen nuclear.' },
          { text: 'Even if SMRs succeed technically, the regulatory approval process for nuclear technologies typically takes 5-10 years, during which renewables will continue their cost decline.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Practical timeline concern.' },
          { text: 'New technology always sounds good in theory but usually disappoints in practice.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'Generic skepticism without specific analysis.' },
          { text: 'They said fusion was 20 years away in 1960 and it still is. Nuclear promises are always lies.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Conflates fusion and fission, which are fundamentally different technologies.' },
        ],
      },
      {
        aiArgument: 'The IPCC itself states that most pathways to limiting warming to 1.5C require significant expansion of nuclear energy alongside renewables. Even the world\'s leading climate scientists recognize that excluding nuclear makes decarbonization harder, slower, and more expensive.',
        rebuttals: [
          { text: 'The IPCC scenarios model nuclear as one possible component, not a required one. Several IPCC pathways achieve 1.5C with nuclear phase-out compensated by greater renewable deployment and demand reduction. The IPCC does not prescribe nuclear; it models scenarios where policymakers might choose it among other options.', quality: 'strong', logic: 10, evidence: 9, persuasion: 8, explanation: 'Corrects the mischaracterization of IPCC findings with precise reading of the reports.' },
          { text: 'The question is not whether nuclear is in some models but whether it is the best use of limited capital compared to renewables plus storage, which most recent analyses favor.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Redirects to the practical investment question.' },
          { text: 'The IPCC also says we need to reduce consumption, but nobody talks about that part.', quality: 'weak', logic: 4, evidence: 4, persuasion: 4, explanation: 'Whataboutism that deflects from the nuclear question.' },
          { text: 'The IPCC is a political body, not a scientific one. Their models are designed to support whatever governments want.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Conspiracy thinking that dismisses the premier scientific body on climate.' },
        ],
      },
    ],
  },

  /* 6 ── College education should be free */
  {
    title: 'College education should be free',
    rounds: [
      {
        aiArgument: 'Countries with free higher education like Germany, Norway, and Finland consistently rank among the most innovative and productive economies. Free education is an investment that returns far more through higher tax revenue from educated workers.',
        rebuttals: [
          { text: 'These countries also have higher tax rates, smaller populations, and more selective university admission processes that limit enrollment. Germany restricts university access through tracking systems that sort students at age 10; free tuition works partly because fewer students attend. The model does not scale to a country like the US with 20 million college students.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Identifies the structural differences that make direct comparison misleading.' },
          { text: 'Correlation between free education and innovation does not prove causation. These countries were innovative before they made education free and may have other factors driving their success.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Valid methodological point.' },
          { text: 'Nothing is really free. Someone always pays for it.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Trivially true but does not engage with the policy argument.' },
          { text: 'Those are small European countries that are nothing like ours. Comparing them is meaningless.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 2, explanation: 'Exceptionalism fallacy that dismisses all comparative evidence.' },
        ],
      },
      {
        aiArgument: 'Student debt currently exceeds $1.7 trillion in the US alone. This burden delays home ownership, family formation, and entrepreneurship for an entire generation. Free college would unlock economic activity that debt currently suppresses.',
        rebuttals: [
          { text: 'Free tuition would primarily benefit students from middle and upper-class families, who attend four-year institutions at three times the rate of low-income students. The barriers keeping poor students from college are not tuition alone but K-12 preparation, living expenses, and opportunity costs of forgone wages that free tuition does not address.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Shows that free tuition is a regressive subsidy that misidentifies the barrier.' },
          { text: 'Income-based repayment plans and targeted grants for low-income students could achieve similar debt relief more efficiently than making college free for everyone.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Proposes a targeted alternative.' },
          { text: 'People should just pick cheaper schools or community colleges if they cannot afford it.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Ignores systemic issues with individual-level advice.' },
          { text: 'The banks created this crisis on purpose to enslave young people with debt. Free college would destroy their business model.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Conspiracy framing that oversimplifies a complex policy issue.' },
        ],
      },
      {
        aiArgument: 'Education is a public good, not a private commodity. An educated populace benefits everyone through better civic participation, lower crime rates, and higher social cohesion. We do not charge for K-12 because we recognize this; the arbitrary line at grade 12 is indefensible.',
        rebuttals: [
          { text: 'K-12 education provides foundational literacy and numeracy that all citizens need equally. Higher education is increasingly specialized and career-oriented, with vastly different returns by major. A philosophy degree and an engineering degree are not equally public goods, yet free tuition would subsidize both identically.', quality: 'strong', logic: 9, evidence: 7, persuasion: 8, explanation: 'Challenges the analogy by identifying what makes higher education different.' },
          { text: 'If education is a public good, vocational training and trade schools should be included too. Limiting free education to universities creates a bias against non-academic career paths.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Expands the logic to expose scope issues.' },
          { text: 'Not everything that benefits society needs to be free. Healthcare benefits society too and we do not make all of that free.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Actually supports the opposing argument more than intended.' },
          { text: 'Universities are just diploma mills now anyway. Making them free would just create more worthless degrees.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Sweeping dismissal of higher education itself.' },
        ],
      },
      {
        aiArgument: 'The private returns to a bachelor\'s degree average $1.2 million over a lifetime compared to a high school diploma. If college reliably produces this return, then financial barriers to access represent an enormous and unnecessary waste of human potential.',
        rebuttals: [
          { text: 'The $1.2 million average obscures massive variance by field, institution, and completion status. Students who start but do not finish college, who represent 40% of enrollees, face debt with no degree premium. Free tuition could increase enrollment without improving completion rates, amplifying this problem.', quality: 'strong', logic: 9, evidence: 9, persuasion: 9, explanation: 'Decomposes the average to reveal the variance risk.' },
          { text: 'If the financial returns are so high, students can fund their education through income-share agreements that require no upfront payment and align incentives with outcomes.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Proposes a market-based alternative that addresses the access problem.' },
          { text: 'That average is probably inflated by people who would have succeeded regardless of college.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Valid selection-bias concern but poorly developed.' },
          { text: 'Those statistics are from a time when degrees actually meant something. Today they are worthless.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Contradicts current labor market data showing degree premiums persist.' },
        ],
      },
      {
        aiArgument: 'The US spent $800 billion on defense in 2023. Redirecting just 10% of military spending could fund free public university for every American student. This is not a question of affordability but of national priorities and whether we value knowledge over weapons.',
        rebuttals: [
          { text: 'Budget comparisons between defense and education present a false choice, since both require sustained multi-decade commitments and cannot be traded year-to-year. More importantly, the estimated cost of free four-year public college is $80-120 billion annually, which would require 10-15% of defense spending in perpetuity, with costs growing faster than inflation as enrollment increases.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Engages the fiscal comparison seriously while showing its limitations.' },
          { text: 'Defense spending supports millions of jobs and research that have civilian applications. Cutting it has second-order economic effects that simple budget comparisons ignore.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Adds nuance to the fiscal comparison.' },
          { text: 'That would never happen politically. The military-industrial complex is too powerful.', quality: 'weak', logic: 3, evidence: 3, persuasion: 3, explanation: 'Political feasibility is relevant but does not address the policy merits.' },
          { text: 'If we did not spend so much on wars for oil, we could afford everything. The real enemy is the defense contractors.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Oversimplification and conspiracy thinking.' },
        ],
      },
    ],
  },

  /* 7 ── Privacy is more important than security */
  {
    title: 'Privacy is more important than security',
    rounds: [
      {
        aiArgument: 'Privacy is a fundamental human right enshrined in Article 12 of the Universal Declaration of Human Rights. Security measures that erode privacy undermine the very freedoms they claim to protect, creating a surveillance state incompatible with democracy.',
        rebuttals: [
          { text: 'The same Universal Declaration, in Article 3, enshrines the right to life and security of person. Rights frequently conflict, and constitutional law has always balanced them rather than declaring one absolute. The framing of privacy versus security as a binary choice ignores centuries of legal tradition that manages competing rights.', quality: 'strong', logic: 10, evidence: 8, persuasion: 8, explanation: 'Turns the human rights framework against the absolutist claim.' },
          { text: 'Without physical security, privacy becomes meaningless. You cannot enjoy privacy rights if you are dead. Security is the precondition for all other rights.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Strong logical point but somewhat reductive.' },
          { text: 'If you have nothing to hide, you have nothing to fear from surveillance.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'The classic dismissal that ignores power dynamics and scope creep.' },
          { text: 'The government has been spying on us since day one. Privacy died a long time ago, so fighting for it is pointless.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Defeatist reasoning that abandons the principle entirely.' },
        ],
      },
      {
        aiArgument: 'Mass surveillance has a chilling effect on free speech, dissent, and political organizing. Research from MIT shows that after the Snowden revelations, Wikipedia searches for terrorism-related articles dropped by 20%, demonstrating that surveillance suppresses legitimate inquiry.',
        rebuttals: [
          { text: 'The 20% decline in Wikipedia searches may reflect prudence rather than suppression, and it proves the surveillance deterrent works on potential threats too. More importantly, the study measured search behavior, not actual speech or organizing, which showed no comparable decline in political activism post-Snowden.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Questions the study\'s interpretation and scope while offering alternative reading.' },
          { text: 'Targeted surveillance based on probable cause does not create the same chilling effect as mass surveillance. The debate should be about method, not about whether security interests exist.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Draws an important distinction between surveillance types.' },
          { text: 'People who search for terrorism articles probably should be monitored anyway.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'Conflates academic research with criminal intent.' },
          { text: 'Snowden was a traitor, so anything based on his leaks is tainted and cannot be used in this argument.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Genetic fallacy that attacks the source of the information.' },
        ],
      },
      {
        aiArgument: 'History shows that surveillance powers are inevitably abused. The FBI surveilled Martin Luther King Jr., COINTELPRO targeted civil rights groups, and the NSA exceeded its legal authority repeatedly. Power without constraint always leads to overreach.',
        rebuttals: [
          { text: 'Those abuses occurred under far weaker oversight than exists today. Post-Watergate reforms created the FISA court, congressional intelligence committees, and inspector general offices specifically to prevent such abuses. Modern surveillance operates under judicial and legislative checks that did not exist during COINTELPRO.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Acknowledges the history while showing that oversight has evolved.' },
          { text: 'Every institution is subject to abuse, including privacy protections. Criminal organizations and terrorist networks exploit privacy rights to operate. The question is which abuse is more dangerous, not which system is perfect.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Reframes the abuse argument as universal.' },
          { text: 'That was a long time ago. Things are different now.', quality: 'weak', logic: 3, evidence: 2, persuasion: 2, explanation: 'Dismissive of historical patterns without evidence of structural change.' },
          { text: 'This proves the government is evil and can never be trusted with any surveillance power whatsoever.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Absolute conclusion from limited historical examples.' },
        ],
      },
      {
        aiArgument: 'Encryption backdoors demanded by governments create vulnerabilities exploited by hackers and hostile nations. The 2015 OPM breach exposed 22 million government personnel records. Weakening encryption for surveillance weakens it for everyone, including the security infrastructure itself.',
        rebuttals: [
          { text: 'The OPM breach resulted from poor system administration and outdated infrastructure, not from encryption backdoors. Conflating general cybersecurity failures with deliberate lawful access mechanisms is a category error. Well-designed lawful access can coexist with strong security, as demonstrated by the banking sector\'s compliance with financial surveillance laws.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Corrects the factual basis and provides a counter-example.' },
          { text: 'There may be technical solutions that provide lawful access without creating universal backdoors, such as key escrow systems with multi-party authorization requirements.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Explores middle-ground technical solutions.' },
          { text: 'Hackers will always find a way in regardless. Encryption does not really protect anyone anyway.', quality: 'weak', logic: 3, evidence: 2, persuasion: 2, explanation: 'Defeatist and factually wrong about encryption\'s value.' },
          { text: 'The NSA already has backdoors in everything. They just want legal cover for what they are already doing.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Conspiracy claim presented as fact.' },
        ],
      },
      {
        aiArgument: 'The erosion of privacy enables authoritarian control. China\'s social credit system, built on pervasive surveillance, demonstrates where the security-first logic inevitably leads. Once surveillance infrastructure exists, its scope always expands regardless of original intent.',
        rebuttals: [
          { text: 'Equating democracies with authoritarian regimes ignores the institutional constraints that differentiate them: independent judiciary, free press, regular elections, and constitutional protections. Democratic nations have maintained extensive security apparatus for decades without becoming China, because the surrounding institutions provide accountability that China lacks.', quality: 'strong', logic: 10, evidence: 8, persuasion: 9, explanation: 'Challenges the slippery slope by identifying the institutional safeguards.' },
          { text: 'The slope from security to authoritarianism is not automatic. It requires the failure of multiple democratic institutions simultaneously, which is different from a single policy choice about surveillance scope.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Addresses the slippery slope logic directly.' },
          { text: 'That could never happen here. We have a Constitution.', quality: 'weak', logic: 3, evidence: 3, persuasion: 3, explanation: 'Naive faith without acknowledging documented erosion of rights.' },
          { text: 'Every country says it is different from China until one day it is not. It is only a matter of time.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Unfalsifiable prediction masquerading as argument.' },
        ],
      },
    ],
  },

  /* 8 ── Voting should be mandatory */
  {
    title: 'Voting should be mandatory',
    rounds: [
      {
        aiArgument: 'Australia has had compulsory voting since 1924 and consistently achieves 90%+ turnout, producing governments with broader democratic mandates. Low turnout in voluntary systems means a minority of citizens determine outcomes for everyone.',
        rebuttals: [
          { text: 'Australia\'s high turnout includes 5-6% informal ballots, intentionally spoiled by voters who are forced to attend but refuse to choose. High turnout does not equal high engagement. Belgium, also compulsory, has seen rising invalid votes as protest. Quantity of participation does not equal quality of democratic mandate.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Challenges the claim by distinguishing turnout from meaningful participation.' },
          { text: 'Increasing turnout can be achieved through less coercive means: automatic registration, election holidays, and early voting have all boosted participation without mandates.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Proposes alternatives that preserve choice.' },
          { text: 'Forcing people to vote does not mean they will make informed choices. They might just vote randomly.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Valid concern but underdeveloped.' },
          { text: 'If the government can force you to vote, what will they force you to do next? This is tyranny.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Slippery slope fallacy equating civic duty with authoritarianism.' },
        ],
      },
      {
        aiArgument: 'Mandatory voting eliminates voter suppression because every citizen is expected to vote. Tactics like reducing polling stations in minority neighborhoods or implementing restrictive ID laws become irrelevant when non-voting carries a penalty.',
        rebuttals: [
          { text: 'Compulsory voting does not address the root causes of suppression. If registration itself is burdensome or gerrymandering dilutes minority votes, compelling attendance does not produce fair outcomes. Australia still has disparities in Indigenous voter participation despite compulsory voting because access barriers persist even when voting is mandatory.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Uses evidence from a compulsory system to show suppression persists.' },
          { text: 'Voter suppression should be addressed directly through anti-suppression laws and enforcement, not by adding another layer of government compulsion on top of a broken system.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Clear alternative approach.' },
          { text: 'People who do not want to vote probably should not be forced to make decisions for the rest of us.', quality: 'weak', logic: 4, evidence: 2, persuasion: 4, explanation: 'Elitist framing that undermines universal suffrage.' },
          { text: 'Politicians want mandatory voting only because it benefits their party. It is not about democracy at all.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Imputes motives without evidence and ignores bipartisan support in some nations.' },
        ],
      },
      {
        aiArgument: 'Voluntary voting creates a self-selection problem: the most extreme and motivated voters show up, while moderates stay home. This pulls politics toward the fringes and rewards candidates who energize bases rather than those who build consensus.',
        rebuttals: [
          { text: 'Political science research from Princeton shows that non-voters and voters hold broadly similar policy preferences. The median voter theorem suggests that even with low turnout, candidates converge on centrist positions to win competitive districts. The polarization problem stems from primary systems and media incentives, not turnout levels.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Challenges the empirical claim about voter preference differences.' },
          { text: 'If moderates are staying home, the solution might be to offer better candidates and policies that inspire participation rather than compelling attendance at uninspiring elections.', quality: 'decent', logic: 7, evidence: 4, persuasion: 7, explanation: 'Reframes the problem as supply-side rather than demand-side.' },
          { text: 'Extreme voters are just more passionate about issues. There is nothing wrong with that.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Misses the structural argument about representativeness.' },
          { text: 'Both parties are the same anyway, so it does not matter who votes or who wins.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'False equivalence that abandons democratic engagement entirely.' },
        ],
      },
      {
        aiArgument: 'Voting is a civic duty, like jury duty or taxation. We already compel citizens to participate in democratic institutions when the collective interest demands it. Voting is arguably more fundamental than jury duty, yet we mandate one and not the other.',
        rebuttals: [
          { text: 'Jury duty requires specific individuals chosen for specific cases where their presence is constitutionally necessary. Voting is a right that gains its moral authority precisely from being freely exercised. A coerced vote carries the same democratic legitimacy as a coerced confession carries legal validity, which is none.', quality: 'strong', logic: 10, evidence: 7, persuasion: 9, explanation: 'Draws a powerful analogy to coerced confessions to challenge the civic duty framing.' },
          { text: 'Taxation and jury duty both have opt-out mechanisms and exceptions. If mandatory voting included a robust "none of the above" option, the civic duty analogy would be stronger.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Partially accepts the analogy while identifying a missing component.' },
          { text: 'Jury duty is already bad enough. We should be reducing obligations, not adding new ones.', quality: 'weak', logic: 3, evidence: 2, persuasion: 4, explanation: 'Anti-civic sentiment that does not engage with the argument.' },
          { text: 'The government just wants to control everything we do. Mandatory voting is another step toward total control.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Paranoid framing disconnected from actual policy effects.' },
        ],
      },
      {
        aiArgument: 'Low voluntary turnout creates a legitimacy crisis. When presidents are elected by 25% of eligible voters, they govern with a thin mandate. Mandatory voting ensures every leader has genuine majority support, strengthening democratic legitimacy and reducing the "not my president" phenomenon.',
        rebuttals: [
          { text: 'Legitimacy derives from the consent of the governed, which requires the option to withhold consent. A president elected with 90% turnout but 51% of votes does not have a stronger mandate than one elected with 60% turnout and 55% of votes. What matters is margin of victory among those who chose to participate, not raw turnout. Forced participation manufactures the appearance of consent without its substance.', quality: 'strong', logic: 10, evidence: 7, persuasion: 10, explanation: 'Philosophical reframing that challenges the legitimacy-through-turnout assumption.' },
          { text: 'Mandatory voting might actually weaken legitimacy if citizens resent being compelled, associating voting with punishment rather than empowerment.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Raises the backlash concern.' },
          { text: 'People will always say "not my president" regardless of how many people voted.', quality: 'weak', logic: 4, evidence: 3, persuasion: 4, explanation: 'True but does not address the legitimacy argument.' },
          { text: 'Legitimacy is a made-up concept anyway. Whoever has power has power.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Nihilistic dismissal of democratic theory.' },
        ],
      },
    ],
  },

  /* 9 ── Genetic engineering of humans should be allowed */
  {
    title: 'Genetic engineering of humans should be allowed',
    rounds: [
      {
        aiArgument: 'CRISPR can eliminate devastating genetic diseases like sickle cell, cystic fibrosis, and Huntington\'s before a child is born. Prohibiting this technology condemns millions to preventable suffering. We do not ban surgery because it can be misused; the same logic applies to gene editing.',
        rebuttals: [
          { text: 'Somatic gene therapy treating existing patients is fundamentally different from germline editing of embryos, which creates heritable changes with unknown multi-generational effects. The surgery analogy fails because surgery affects one patient while germline editing affects all descendants. We can support therapeutic editing while prohibiting heritable modifications.', quality: 'strong', logic: 10, evidence: 8, persuasion: 9, explanation: 'Draws the critical distinction between somatic and germline editing.' },
          { text: 'Existing preimplantation genetic testing already allows parents to select embryos without genetic diseases, achieving similar outcomes without the risks of directly editing the genome.', quality: 'decent', logic: 7, evidence: 7, persuasion: 6, explanation: 'Proposes an existing alternative.' },
          { text: 'Playing God with human genetics is just wrong, regardless of the intentions.', quality: 'weak', logic: 3, evidence: 2, persuasion: 4, explanation: 'Appeals to nature without engagement.' },
          { text: 'Scientists cannot be trusted. Remember thalidomide? They will just create new problems.', quality: 'fallacious', logic: 2, evidence: 3, persuasion: 3, explanation: 'Guilt by association across unrelated medical developments.' },
        ],
      },
      {
        aiArgument: 'Banning genetic engineering in one country simply pushes it to less regulated jurisdictions. He Jiankui edited embryos in China precisely because Western regulations were too restrictive. A permissive but well-regulated framework is safer than prohibition that drives the science underground.',
        rebuttals: [
          { text: 'He Jiankui was arrested and imprisoned by China for violating their regulations, which were actually comparable to Western standards. The problem was not regulatory strictness but enforcement failure. His case argues for stronger enforcement, not looser rules, since the scientific community unanimously condemned his work.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Corrects the factual premise that China had lax regulations.' },
          { text: 'International coordination through bodies like the WHO can create globally consistent standards, similar to how nuclear non-proliferation treaties manage dangerous technology across borders.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Addresses the jurisdictional concern with a governance proposal.' },
          { text: 'Just because some people break the rules does not mean we should get rid of the rules.', quality: 'weak', logic: 5, evidence: 2, persuasion: 4, explanation: 'True but unsophisticated.' },
          { text: 'The real reason governments ban it is because they want to control the population. Genetic engineering threatens their power.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Conspiracy theory with no basis.' },
        ],
      },
      {
        aiArgument: 'Genetic engineering could enhance human resilience to disease, aging, and environmental threats. In an era of pandemics and climate change, enhancing our biological capacity to survive may become not optional but necessary for species survival.',
        rebuttals: [
          { text: 'We already have proven, deployable tools for pandemic preparedness and climate adaptation: vaccines, public health infrastructure, and sustainable technology. Genetic engineering for environmental resilience would take generations to propagate through the population and would arrive far too late for current threats. It is a solution on the wrong timescale.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Challenges the timeline and practicality.' },
          { text: 'Enhancement beyond disease prevention opens an ethical Pandora\'s box. Where do we draw the line between preventing cancer and engineering superior intelligence or physical ability?', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Raises the legitimate boundary problem.' },
          { text: 'We cannot even predict the weather accurately. How can we engineer genetics for future climate?', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'False comparison between weather prediction and genetics.' },
          { text: 'This sounds like eugenics dressed up in modern language. We all know where that leads.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 5, explanation: 'Reductio ad Hitlerum that conflates voluntary genetic medicine with coercive eugenics.' },
        ],
      },
      {
        aiArgument: 'Parents already select for traits through partner choice, prenatal vitamins, education, and environment. Genetic engineering is simply a more precise version of what we already accept. Drawing a moral line at the genetic level while accepting environmental enhancement is philosophically inconsistent.',
        rebuttals: [
          { text: 'The distinction is between probabilistic influence and deterministic design. Choosing a partner or providing good nutrition influences outcomes within natural variation, while direct genetic editing creates specific traits by design. This is the difference between creating conditions for a child to flourish and engineering a child to specification, which is a qualitative moral difference, not a quantitative one.', quality: 'strong', logic: 10, evidence: 7, persuasion: 9, explanation: 'Precisely identifies the moral distinction the argument tries to collapse.' },
          { text: 'Environmental interventions are reversible and adaptable; genetic modifications to germline are permanent. Permanence is a morally relevant factor when making decisions for someone who cannot consent.', quality: 'decent', logic: 8, evidence: 5, persuasion: 7, explanation: 'Strong argument about consent and reversibility.' },
          { text: 'Eating well and picking a spouse is completely different from editing DNA in a lab.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'States the intuition without explaining why they differ.' },
          { text: 'This is just a clever argument designed to make people accept designer babies. The real agenda is creating a master race.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Conspiracy and slippery slope combined.' },
        ],
      },
      {
        aiArgument: 'Restricting genetic engineering perpetuates genetic inequality. Wealthy families already access better nutrition, healthcare, and education that influence gene expression through epigenetics. Genetic engineering could actually level the playing field by giving every child equal biological potential regardless of parental wealth.',
        rebuttals: [
          { text: 'In every society with market-based healthcare, advanced treatments reach the wealthy first and the poor last, or never. Genetic engineering would follow this pattern precisely, creating a biological upper class with enhanced genomes and a natural underclass, which is a deeper and more permanent inequality than any we face today because it would be written into DNA and passed to descendants.', quality: 'strong', logic: 10, evidence: 8, persuasion: 10, explanation: 'Uses the economic access argument to show genetic engineering would worsen the problem it claims to solve.' },
          { text: 'The argument assumes genetic engineering would be universally accessible, but no advanced medical technology in history has been distributed equally. Universal genetic healthcare would require unprecedented global cooperation.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Challenges the accessibility assumption.' },
          { text: 'If we cannot even provide basic healthcare to everyone, how would we provide genetic engineering?', quality: 'weak', logic: 5, evidence: 4, persuasion: 5, explanation: 'Valid but does not build a structured argument.' },
          { text: 'The rich would just use it to make themselves even more superior. Genetic engineering is a tool of oppression.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 4, explanation: 'Assumes the worst outcome without nuance.' },
        ],
      },
    ],
  },

  /* 10 ── Cash should be eliminated in favor of digital currency */
  {
    title: 'Cash should be eliminated in favor of digital currency',
    rounds: [
      {
        aiArgument: 'Cash facilitates crime: money laundering, tax evasion, drug trafficking, and corruption all depend on untraceable physical currency. The UN estimates $2 trillion is laundered annually. Eliminating cash would make financial crime vastly more difficult and recoverable.',
        rebuttals: [
          { text: 'The largest money laundering cases in history, including HSBC\'s $881 million settlement and Danske Bank\'s $230 billion scandal, were conducted through digital banking systems, not cash. Criminal enterprises have proven adept at exploiting digital systems through shell companies, cryptocurrency, and correspondent banking. Eliminating cash penalizes the law-abiding while sophisticated criminals adapt.', quality: 'strong', logic: 9, evidence: 10, persuasion: 9, explanation: 'Devastating counter-examples from actual financial crime cases.' },
          { text: 'Cash-based crime is already declining as digital payments grow. The trend toward a cashless society is happening organically without needing forced elimination.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Points out the transition is already occurring naturally.' },
          { text: 'Privacy is more important than stopping crime. People have a right to spend money without being tracked.', quality: 'weak', logic: 5, evidence: 3, persuasion: 5, explanation: 'States a value position without engaging the crime argument.' },
          { text: 'The government just wants to track every purchase you make so they can control you.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Conspiracy framing that ignores legitimate policy motivations.' },
        ],
      },
      {
        aiArgument: 'Digital payments are more efficient, cheaper to process, and eliminate the $200 billion annual cost of printing, transporting, and securing physical currency. Sweden has already reduced cash to 1% of transactions without negative consequences.',
        rebuttals: [
          { text: 'Sweden\'s Riksbank has warned that the rapid decline of cash threatens financial inclusion. Its own 2023 report found that 800,000 Swedes struggle with digital payments, disproportionately elderly and disabled citizens. The Swedish Parliament passed legislation requiring banks to maintain cash services precisely because the cashless transition harmed vulnerable populations.', quality: 'strong', logic: 9, evidence: 10, persuasion: 8, explanation: 'Uses Sweden\'s own central bank and parliament as evidence against the Sweden example.' },
          { text: 'The cost savings from eliminating cash would largely accrue to banks and payment processors, not consumers, who would face new transaction fees.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Questions who actually benefits from the savings.' },
          { text: 'Some people just prefer cash. You cannot force everyone to change.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Preference argument without structural reasoning.' },
          { text: 'Credit card companies are behind this push because they want their transaction fees on every purchase.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'May contain a grain of truth but presented as conspiratorial motive attribution.' },
        ],
      },
      {
        aiArgument: 'Digital currency enables precise monetary policy. Central banks could implement negative interest rates, distribute stimulus payments instantly, and manage inflation more effectively. Cash undermines monetary policy by providing an escape from negative rates.',
        rebuttals: [
          { text: 'Negative interest rates penalize savers, who are disproportionately elderly and low-income. Enabling this policy by eliminating cash removes the last protection citizens have against their own government confiscating savings through policy. Monetary policy this powerful requires monetary escape valves; removing them concentrates dangerous power in central banks.', quality: 'strong', logic: 9, evidence: 7, persuasion: 9, explanation: 'Reframes the monetary policy benefit as a threat.' },
          { text: 'Stimulus distribution could be achieved through direct deposit without eliminating cash entirely. The specific policy benefits do not require the total elimination of physical currency.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Separates the useful features from the extreme measure.' },
          { text: 'Most people do not understand monetary policy, so this argument is irrelevant to them.', quality: 'weak', logic: 3, evidence: 2, persuasion: 2, explanation: 'Dismisses the argument because of public ignorance.' },
          { text: 'Central banks are run by elites who only care about helping the rich. More power for them means more inequality.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Populist framing that ignores central banks\' institutional mandates.' },
        ],
      },
      {
        aiArgument: 'In the COVID pandemic, cash was identified as a potential disease vector. Digital payments offer a contactless, hygienic alternative. As pandemics become more frequent, reducing physical contact points in daily transactions is a public health imperative.',
        rebuttals: [
          { text: 'The WHO, CDC, and European Central Bank all explicitly stated that cash does not pose a significant COVID transmission risk. Surface transmission was found to be negligible compared to aerosol transmission. The hygiene argument for cashless payments was a myth that persisted despite scientific evidence against it.', quality: 'strong', logic: 9, evidence: 10, persuasion: 8, explanation: 'Directly refutes the factual claim with authoritative sources.' },
          { text: 'Contactless card payments and mobile wallets already exist and provide hygienic alternatives without requiring the elimination of cash for those who still need it.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Shows the hygiene goal is achievable without going cashless.' },
          { text: 'Cash has been around for thousands of years and humanity survived every pandemic with it.', quality: 'weak', logic: 4, evidence: 3, persuasion: 4, explanation: 'Appeal to tradition without epidemiological reasoning.' },
          { text: 'The pandemic was manufactured to push us toward a cashless surveillance state. This was the plan all along.', quality: 'fallacious', logic: 1, evidence: 1, persuasion: 2, explanation: 'Conspiracy theory with no factual basis.' },
        ],
      },
      {
        aiArgument: 'The trend is irreversible. Cash usage has declined by 50% in most developed nations over the past decade. Resisting the cashless transition is fighting an economic tide. The question is not whether cash will disappear but whether we manage the transition thoughtfully or let it happen haphazardly.',
        rebuttals: [
          { text: 'Trends can be shaped by policy. Japan, a technologically advanced nation, maintains 50% cash usage by design because it values financial inclusion and disaster resilience. When digital infrastructure fails during earthquakes, cash economies continue functioning. The trend toward cashless is a policy choice, not an inevitability, and countries can choose differently based on their priorities.', quality: 'strong', logic: 9, evidence: 9, persuasion: 9, explanation: 'Uses Japan as a powerful counter-example that demolishes the inevitability claim.' },
          { text: 'Even if the trend continues, maintaining cash as an option for vulnerable populations costs very little relative to the financial exclusion that full elimination would cause.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Pragmatic middle ground.' },
          { text: 'Just because something is a trend does not make it good. Lots of trends are bad.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'True but generic.' },
          { text: 'The banking cartel is engineering this trend to trap everyone in their system. Follow the money.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Conspiracy narrative.' },
        ],
      },
    ],
  },

  /* 11 ── Animal testing for medical research is justified */
  {
    title: 'Animal testing for medical research is justified',
    rounds: [
      {
        aiArgument: 'Nearly every medical breakthrough of the past century, from insulin to chemotherapy to organ transplants, was developed through animal testing. The polio vaccine alone, tested on monkeys, has saved an estimated 1.5 million lives annually since its introduction.',
        rebuttals: [
          { text: 'Historical necessity does not imply current necessity. Penicillin was discovered accidentally and aspirin was used for centuries before clinical trials existed, yet we do not argue for accidental discovery as a research method. Modern alternatives like organ-on-chip technology, 3D tissue models, and computational pharmacology are achieving results that were impossible when animal testing was the only option.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Acknowledges history while arguing for technological evolution.' },
          { text: 'The fact that we relied on animal testing in the past does not mean we should continue when better alternatives are becoming available.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Clear but less developed.' },
          { text: 'Animals suffer terribly in labs. No medical breakthrough justifies that kind of cruelty.', quality: 'weak', logic: 3, evidence: 3, persuasion: 5, explanation: 'Emotional appeal that does not address the utilitarian calculation.' },
          { text: 'Scientists just enjoy experimenting on animals. They use medical research as an excuse.', quality: 'fallacious', logic: 1, evidence: 1, persuasion: 2, explanation: 'Absurd imputation of sadistic motives to researchers.' },
        ],
      },
      {
        aiArgument: 'Animal models share 85-99% of human genetic makeup. Mouse models have been instrumental in understanding cancer, Alzheimer\'s, and autoimmune diseases. No computational model can yet replicate the complexity of a living biological system with trillions of interacting cells.',
        rebuttals: [
          { text: 'Genetic similarity does not predict pharmacological response. The NIH reports that 95% of drugs that pass animal trials fail in human clinical trials, with an estimated $50 billion wasted annually on misleading animal data. If animal models were truly predictive, the failure rate would be far lower.', quality: 'strong', logic: 9, evidence: 10, persuasion: 9, explanation: 'The 95% failure rate is a devastating empirical counter to the predictive value claim.' },
          { text: 'The complexity argument cuts both ways: if animal systems are too complex for computers to model, they may also be too different from human systems to serve as reliable proxies.', quality: 'decent', logic: 8, evidence: 5, persuasion: 7, explanation: 'Turns the complexity argument against itself.' },
          { text: 'Mice are not people. Just because we share genes does not mean drugs will work the same way.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Directionally correct but unsubstantiated.' },
          { text: 'Genetic similarity means animals can feel pain just like us, which makes testing them even more immoral.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Red herring that shifts from efficacy to ethics mid-argument.' },
        ],
      },
      {
        aiArgument: 'Regulatory agencies worldwide require animal testing before human trials for safety reasons. FDA regulations mandate toxicology studies in animal models before any new drug can proceed to Phase 1 human trials. This protects human subjects from untested compounds.',
        rebuttals: [
          { text: 'The FDA Modernization Act 2.0, passed in December 2022, explicitly eliminated the federal requirement for animal testing before human trials, allowing alternatives like cell-based assays and computer modeling. Regulatory agencies are themselves acknowledging that mandatory animal testing is an outdated framework that does not serve its protective purpose.', quality: 'strong', logic: 9, evidence: 10, persuasion: 9, explanation: 'Uses the most recent legislation to directly contradict the regulatory necessity claim.' },
          { text: 'Regulations should follow the science, not the other way around. If alternatives prove safer and more predictive, regulations should be updated accordingly.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Reasonable principle but less impactful without specific evidence.' },
          { text: 'Just because the government requires it does not make it right. The government requires a lot of unnecessary things.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Anti-government sentiment without specific engagement.' },
          { text: 'The pharmaceutical industry lobbies for animal testing requirements because it creates a barrier to entry that protects their market dominance.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Conspiracy framing that ignores the genuine safety rationale.' },
        ],
      },
      {
        aiArgument: 'Alternatives to animal testing are promising but premature. Organ-on-chip can model one organ but cannot replicate systemic effects: how a drug affects the liver, heart, and kidneys simultaneously, or how it crosses the blood-brain barrier. Until alternatives achieve whole-system modeling, animal testing remains the only comprehensive safety assessment.',
        rebuttals: [
          { text: 'Multi-organ-on-chip platforms already link liver, heart, kidney, and brain compartments in a single integrated system. The Wyss Institute at Harvard demonstrated a 10-organ human body-on-chip in 2022. Meanwhile, microphysiological systems correctly predicted drug toxicity in 87% of cases versus 71% for animal models in a 2023 comparative study.', quality: 'strong', logic: 9, evidence: 10, persuasion: 8, explanation: 'Updates the technological picture with recent breakthroughs.' },
          { text: 'Animal testing also fails to capture many systemic effects in humans, as demonstrated by thalidomide which passed animal safety tests but caused birth defects in humans. Neither method is perfect, but alternatives are improving faster.', quality: 'decent', logic: 7, evidence: 7, persuasion: 7, explanation: 'Uses a famous failure case to level the comparison.' },
          { text: 'Technology advances quickly. Give it a few more years and we will not need animals at all.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Optimistic but does not address current capability gaps.' },
          { text: 'Scientists defending animal testing are just protecting their research funding and career investment in existing methods.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Attacks researcher motives rather than the scientific argument.' },
        ],
      },
      {
        aiArgument: 'The moral calculus is straightforward: if testing one thousand mice can save one million human lives, the utilitarian calculation overwhelmingly favors animal testing. We already accept that human welfare takes priority over animal welfare in agriculture, pest control, and habitat development. Medical research is the most defensible case.',
        rebuttals: [
          { text: 'The utilitarian calculation depends on animal testing actually saving those lives, which the 95% clinical trial failure rate calls into question. If most animal-derived insights do not translate to human benefit, the moral equation collapses because we are inflicting suffering for little actual gain. Additionally, utilitarian ethics does not permit unlimited harm to minorities for majority benefit; this is precisely why we abandoned involuntary human experimentation despite its potential benefits.', quality: 'strong', logic: 10, evidence: 8, persuasion: 10, explanation: 'Challenges both the empirical basis and the ethical framework.' },
          { text: 'The "we already do it in other contexts" argument is not morally compelling. We also historically accepted practices like child labor that we later recognized as wrong. Each context should be evaluated on its own merits.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Challenges the precedent argument.' },
          { text: 'Animals have feelings too. You cannot just use them as tools because you decided human lives matter more.', quality: 'weak', logic: 4, evidence: 2, persuasion: 5, explanation: 'Emotional appeal without engaging the utilitarian framework.' },
          { text: 'This is exactly how people justified experimenting on prisoners and minorities. Same logic, different victims.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 5, explanation: 'False equivalence between animal testing and human rights abuses.' },
        ],
      },
    ],
  },

  /* 12 ── Social media companies should be regulated like utilities */
  {
    title: 'Social media companies should be regulated like utilities',
    rounds: [
      {
        aiArgument: 'Social media platforms have become essential infrastructure. With 4.9 billion users globally, they are as fundamental to modern life as telephone networks were in the 20th century. When services become this pervasive, unregulated private control creates unacceptable power concentration.',
        rebuttals: [
          { text: 'Utilities provide a single, standardized service (water, electricity) with no editorial function. Social media platforms make billions of content moderation decisions daily, which is an inherently editorial function incompatible with utility regulation. You cannot simultaneously require a platform to serve everyone equally and to remove harmful content.', quality: 'strong', logic: 10, evidence: 7, persuasion: 9, explanation: 'Identifies the fundamental incompatibility between utility regulation and content curation.' },
          { text: 'The number of users alone does not make something a utility. Fashion brands and fast food chains also have billions of customers without being regulated as essential services.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Questions the premise of user count as the criterion.' },
          { text: 'People survived without social media before and can survive without it now. It is not essential.', quality: 'weak', logic: 4, evidence: 3, persuasion: 3, explanation: 'Ignores how deeply integrated these platforms have become.' },
          { text: 'Big Tech controls everything and needs to be broken up. Regulation is not enough.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 4, explanation: 'Moves the goalposts from regulation to dissolution.' },
        ],
      },
      {
        aiArgument: 'Utility regulation ensures universal access, fair pricing, and service reliability. Applied to social media, it would prevent arbitrary account bans, require algorithmic transparency, and establish due process before deplatforming, protections that current users lack entirely.',
        rebuttals: [
          { text: 'Utility customers cannot use electricity to harm others, but social media users routinely produce content that harasses, defrauds, or radicalizes. Requiring due process before every account action would make it impossible to respond to coordinated disinformation campaigns, harassment mobs, or terrorist recruitment in real time. The speed of online harm demands faster response than utility due process allows.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Shows how due process requirements would paralyze necessary content moderation.' },
          { text: 'Algorithmic transparency could be achieved through targeted transparency laws without the full overhead of utility classification.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Proposes a more targeted approach.' },
          { text: 'Private companies should be able to ban whoever they want. It is their platform.', quality: 'weak', logic: 5, evidence: 2, persuasion: 4, explanation: 'Ignores the market power concern that motivates the regulation proposal.' },
          { text: 'These companies only ban conservative voices, which proves they are biased and need to be regulated.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Partisan framing unsupported by comprehensive data.' },
        ],
      },
      {
        aiArgument: 'Without regulation, social media companies operate as unaccountable monopolies. Network effects create insurmountable barriers to entry. You cannot simply switch to a competitor when all your contacts, professional network, and digital history are locked in one platform.',
        rebuttals: [
          { text: 'The social media market has shown remarkable dynamism: MySpace to Facebook, Vine to TikTok, Twitter to Threads. TikTok grew from zero to one billion users in four years despite Facebook\'s dominance. Data portability requirements, as implemented in the EU\'s Digital Markets Act, can reduce switching costs without imposing utility regulation\'s operational constraints.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Uses market history to challenge the monopoly claim and proposes targeted alternatives.' },
          { text: 'Interoperability requirements, similar to telephone number portability, could address switching costs without full utility regulation.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Smart targeted solution.' },
          { text: 'People switched from MySpace to Facebook easily enough. If a better platform comes along, people will move.', quality: 'weak', logic: 5, evidence: 4, persuasion: 4, explanation: 'Oversimplifies how much harder switching has become with deeper platform integration.' },
          { text: 'These monopolies should be broken up like Standard Oil. Regulation just legitimizes their power.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Presents a false choice between regulation and antitrust.' },
        ],
      },
      {
        aiArgument: 'Utilities cannot discriminate between customers or content. Applying this principle to social media would protect free speech far more effectively than the First Amendment, which only restricts government censorship. Private platform censorship is the primary speech threat of our era.',
        rebuttals: [
          { text: 'The non-discrimination principle for utilities works because water and electricity are content-neutral. Forcing social media to be content-neutral would legally require platforms to host child exploitation material, terrorist propaganda, and targeted harassment without removal. Every society draws lines around speech; the question is who draws them, not whether they exist.', quality: 'strong', logic: 10, evidence: 7, persuasion: 10, explanation: 'Reduces the argument to its logical and horrifying conclusion.' },
          { text: 'Section 230 already provides a framework that balances platform discretion with user protection. Reforming 230 would be more precise than wholesale utility classification.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Points to existing regulatory framework.' },
          { text: 'Free speech has limits even in the real world. You cannot yell fire in a crowded theater.', quality: 'weak', logic: 5, evidence: 4, persuasion: 4, explanation: 'Cliche that oversimplifies the issue.' },
          { text: 'Silicon Valley liberals are the ones doing the censoring. Utility regulation would stop their political bias.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Partisan motivation attributed without evidence.' },
        ],
      },
      {
        aiArgument: 'The EU\'s Digital Services Act and Digital Markets Act demonstrate that comprehensive platform regulation is politically feasible and practically implementable. These regulations impose transparency, accountability, and user protection requirements without destroying innovation. Utility-style regulation is the next logical step.',
        rebuttals: [
          { text: 'The DSA and DMA specifically chose not to classify platforms as utilities because EU regulators recognized the fundamental differences. These acts created a new regulatory category, "gatekeepers," precisely because existing utility frameworks were inadequate. Citing them as precedent for utility regulation contradicts the regulatory philosophy that produced them.', quality: 'strong', logic: 10, evidence: 9, persuasion: 8, explanation: 'Turns the EU example against the argument by showing EU explicitly rejected utility classification.' },
          { text: 'The DSA is barely a year old and its effects are still uncertain. Using it as proof that regulation works is premature when enforcement challenges are still emerging.', quality: 'decent', logic: 6, evidence: 6, persuasion: 6, explanation: 'Valid caution about drawing conclusions too early.' },
          { text: 'Europe regulates everything. That does not mean their approach is right for everyone.', quality: 'weak', logic: 3, evidence: 2, persuasion: 3, explanation: 'Dismissive cultural generalization.' },
          { text: 'EU regulations are designed to hurt American companies and protect European competitors. It is economic warfare disguised as regulation.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Conspiracy interpretation of legitimate regulatory action.' },
        ],
      },
    ],
  },

  /* 13 ── Remote work is better than office work */
  {
    title: 'Remote work is better than office work',
    rounds: [
      {
        aiArgument: 'Stanford research found remote workers are 13% more productive than office counterparts, with fewer breaks, sick days, and distractions. The open-plan offices that dominate modern workplaces are themselves productivity killers, with studies showing they reduce face-to-face collaboration by 70%.',
        rebuttals: [
          { text: 'The Stanford study by Bloom measured call center workers doing repetitive, easily quantifiable tasks. For knowledge work requiring collaboration and creativity, Microsoft\'s 2022 study of 60,000 employees found remote work reduced cross-team communication by 25% and weakened professional networks, effects that erode innovation over time even if individual task completion improves.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Challenges the study\'s applicability with a larger, more relevant dataset.' },
          { text: 'Productivity metrics for remote work often measure output quantity, not quality. Creative and collaborative work quality is harder to measure and may suffer in remote settings.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Raises a valid measurement concern.' },
          { text: 'Some people just work better in offices. Not everyone can stay focused at home.', quality: 'weak', logic: 4, evidence: 2, persuasion: 4, explanation: 'Anecdotal and does not address the research cited.' },
          { text: 'Companies pushing return-to-office just want to justify their expensive real estate leases.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Imputes financial motives without addressing productivity data.' },
        ],
      },
      {
        aiArgument: 'Remote work eliminates an average 54-minute daily commute, returning 200+ hours annually to workers. This reclaimed time improves work-life balance, reduces stress, and increases time with family. The environmental benefit of reduced commuting is substantial: if remote-capable workers stayed home half the time, it would equal removing 10 million cars from roads.',
        rebuttals: [
          { text: 'Research from the Federal Reserve Bank of New York found that remote workers reinvest only 40% of saved commute time into work, with the rest going to leisure. Meanwhile, the boundary erosion between work and home life has increased average remote working hours by 48 minutes daily, negating commute savings. Remote workers report higher burnout rates precisely because they cannot "leave" work.', quality: 'strong', logic: 9, evidence: 9, persuasion: 9, explanation: 'Shows that commute time savings do not translate to the benefits claimed.' },
          { text: 'Commute time can be productive: reading, podcasts, mental transitions between work and home. Some workers report the commute as valuable decompression time.', quality: 'decent', logic: 6, evidence: 5, persuasion: 6, explanation: 'Offers an alternative perspective on commuting.' },
          { text: 'People will just waste that time watching TV anyway.', quality: 'weak', logic: 3, evidence: 2, persuasion: 2, explanation: 'Cynical and dismissive of worker autonomy.' },
          { text: 'Commuting is a scam designed to sell cars and gas. The whole economy is built around making people waste time.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Conspiracy framing of transportation infrastructure.' },
        ],
      },
      {
        aiArgument: 'Remote work enables companies to hire from a global talent pool rather than being limited to a single geographic area. This particularly benefits companies in expensive cities and workers in regions with limited local opportunities, creating a more meritocratic labor market.',
        rebuttals: [
          { text: 'Global hiring creates a race to the bottom on wages. When a San Francisco company can hire a developer in Nairobi at one-fifth the salary, the primary beneficiary is the corporation, not workers. This dynamic has already compressed salaries in tech, with remote workers receiving 10-20% lower offers than office-based peers for identical roles at the same companies.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Shows global hiring can harm the workers it supposedly helps.' },
          { text: 'Global hiring creates significant legal, tax, and compliance challenges that add hidden costs which may offset the talent pool benefits.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Practical limitation of the global talent model.' },
          { text: 'Time zone differences make global teams hard to manage. You end up with meetings at midnight.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Valid practical concern but not systematically argued.' },
          { text: 'Companies only want remote work so they can outsource everything to cheap labor markets and fire local workers.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Oversimplified motive attribution.' },
        ],
      },
      {
        aiArgument: 'Office culture breeds conformity, political maneuvering, and performative busyness. Remote work shifts evaluation from presence to output, rewarding actual results over face time. Introverts, neurodiverse workers, and those with disabilities thrive when freed from the social demands of office environments.',
        rebuttals: [
          { text: 'Remote work creates its own performative demands: constant Slack availability, camera-on expectations, and digital presenteeism through mouse-jiggling software. Meanwhile, informal mentorship, spontaneous knowledge transfer, and the observational learning crucial for junior employees are nearly impossible to replicate remotely. What looks like meritocracy may actually be experienced workers thriving while newcomers struggle invisibly.', quality: 'strong', logic: 9, evidence: 7, persuasion: 9, explanation: 'Shows remote work creates different but equally problematic performance theater.' },
          { text: 'Hybrid models may better serve diverse workers by offering the flexibility of remote work and the social structure of office time as needed.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Proposes a middle ground.' },
          { text: 'Office politics exist in remote work too. People just do it over Slack instead of in person.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'True but underdeveloped.' },
          { text: 'Offices were designed by extroverts to benefit extroverts. The whole system is biased against anyone different.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 3, explanation: 'Conspiratorial framing of office design history.' },
        ],
      },
      {
        aiArgument: 'The pandemic proved remote work is viable at scale. Companies that resisted it for decades adopted it overnight and survived. The return-to-office push is not about productivity but about control, real estate justification, and managerial insecurity. The genie cannot be put back in the bottle.',
        rebuttals: [
          { text: 'Pandemic remote work was an emergency measure sustained by social capital built through years of in-person relationships, accumulated institutional knowledge, and the shared crisis mentality that boosted cooperation. As that social capital depletes without in-person renewal, the long-term viability of full remote work remains unproven. Surviving a crisis is different from thriving in steady state.', quality: 'strong', logic: 10, evidence: 7, persuasion: 9, explanation: 'Identifies the hidden variable (pre-existing social capital) that made pandemic remote work succeed.' },
          { text: 'Many companies that went fully remote during the pandemic, including Zoom itself, have since implemented return-to-office policies, suggesting the pandemic experience was not as conclusive as claimed.', quality: 'decent', logic: 7, evidence: 7, persuasion: 7, explanation: 'Ironic evidence from the company that symbolized remote work.' },
          { text: 'Companies just want people back so managers can micromanage them.', quality: 'weak', logic: 3, evidence: 2, persuasion: 4, explanation: 'Reduces a complex decision to a single motive.' },
          { text: 'CEOs are old-fashioned dinosaurs who do not understand modern work. They will die out and remote work will win.', quality: 'fallacious', logic: 2, evidence: 1, persuasion: 2, explanation: 'Ad hominem generalization about leadership.' },
        ],
      },
    ],
  },

  /* 14 ── Autonomous vehicles should replace human drivers */
  {
    title: 'Autonomous vehicles should replace human drivers',
    rounds: [
      {
        aiArgument: 'Human error causes 94% of traffic accidents according to NHTSA. Autonomous vehicles do not get drunk, distracted, or drowsy. Even imperfect self-driving technology that reduces accidents by 50% would save 20,000 lives annually in the US alone.',
        rebuttals: [
          { text: 'The 94% figure includes judgment errors like following too closely, which autonomous vehicles also make, and environmental factors humans handle through contextual reasoning that AI lacks. Waymo and Cruise vehicles have caused novel accident types, including freezing at intersections and failing to recognize emergency vehicles, that human drivers do not. AV accidents may be fewer but more unpredictable and harder to adjudicate.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Challenges the statistic and introduces the problem of novel failure modes.' },
          { text: 'The 50% reduction assumption is unproven at scale. Current autonomous vehicles operate in geofenced areas with ideal conditions and still require human intervention.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Questions the extrapolation from limited deployments.' },
          { text: 'Computers crash all the time. Why would we trust them with our lives on the road?', quality: 'weak', logic: 3, evidence: 2, persuasion: 4, explanation: 'Conflates consumer software with safety-critical systems.' },
          { text: 'Self-driving cars are just a scheme by tech companies to collect surveillance data on everywhere you go.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Conspiracy motive attribution.' },
        ],
      },
      {
        aiArgument: 'Autonomous vehicles would transform mobility for the elderly, disabled, and those who cannot drive. There are 600,000 Americans with visual impairments and 50 million elderly citizens whose independence is limited by inability to drive. Self-driving technology is fundamentally about accessibility and equity.',
        rebuttals: [
          { text: 'Existing solutions like expanded public transit, ride-sharing, and paratransit services can serve mobility-limited populations at a fraction of AV development costs. Many countries with excellent public transit already provide superior mobility access for elderly and disabled citizens without autonomous vehicles. The accessibility framing conflates a luxury technology problem with an infrastructure investment problem.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Reframes the accessibility need as better served by existing solutions.' },
          { text: 'Autonomous vehicles would likely be expensive initially, limiting accessibility benefits to those who can afford the technology.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Raises the equity concern within the equity argument.' },
          { text: 'Those people have been getting around without self-driving cars for a long time. They have other options.', quality: 'weak', logic: 3, evidence: 2, persuasion: 2, explanation: 'Dismissive of real accessibility challenges.' },
          { text: 'Tech companies do not care about disabled people. They are using them as a marketing prop.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Cynical motive attribution.' },
        ],
      },
      {
        aiArgument: 'Autonomous vehicles will eliminate traffic congestion through perfect coordination. Connected AVs can drive in tight platoons at consistent speeds, increasing road capacity by 300% without building new highways. This would save the $87 billion Americans lose annually to traffic delays.',
        rebuttals: [
          { text: 'The 300% capacity increase requires near-universal AV adoption. The transition period, with mixed human and autonomous traffic, may actually worsen congestion as cautious AVs interact with aggressive human drivers. Induced demand research shows that increased road capacity historically generates more traffic rather than reducing congestion, a pattern AVs would not escape.', quality: 'strong', logic: 9, evidence: 8, persuasion: 8, explanation: 'Identifies the transition problem and induced demand paradox.' },
          { text: 'Congestion is primarily an urban problem better solved by transit investment and urban planning than by making car travel more efficient.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Proposes a more fundamental solution.' },
          { text: 'Self-driving cars will still be cars. More cars means more congestion regardless.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Partially valid but ignores coordination benefits.' },
          { text: 'The real reason they want self-driving cars is to eliminate taxi and truck driver jobs.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Conspiracy framing that ignores safety and efficiency motivations.' },
        ],
      },
      {
        aiArgument: 'The liability framework for autonomous vehicles is solvable. Product liability law already handles defective products. When an AV causes an accident, the manufacturer bears responsibility, creating stronger safety incentives than the current system where impaired or incompetent drivers face minimal accountability.',
        rebuttals: [
          { text: 'Product liability for AVs faces unprecedented complexity. When a crash involves software from one company, sensors from another, mapping data from a third, and road infrastructure maintained by a government, determining liability becomes practically impossible. The Uber autonomous vehicle fatality in 2018 resulted in charges against the safety driver, not the software, illustrating how existing frameworks fail to assign responsibility coherently.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Uses a real case to show the liability framework fails in practice.' },
          { text: 'Manufacturer liability could make AV development prohibitively expensive, as companies may avoid deployment in litigious environments.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Identifies a practical consequence of the proposed framework.' },
          { text: 'Lawyers will find a way to sue everyone involved anyway. The legal system will sort it out.', quality: 'weak', logic: 3, evidence: 2, persuasion: 2, explanation: 'Naively dismisses a serious structural challenge.' },
          { text: 'Car companies will just lobby for laws that protect them from liability. They always do.', quality: 'fallacious', logic: 3, evidence: 3, persuasion: 4, explanation: 'Assumes regulatory capture without engaging the liability question.' },
        ],
      },
      {
        aiArgument: 'Opposing autonomous vehicles because the technology is imperfect today is like opposing aviation in 1910. Every transformative technology starts with limitations. The moral imperative is to develop and deploy life-saving technology as quickly as possible, accepting that early versions will be imperfect.',
        rebuttals: [
          { text: 'Early aviation was tested in controlled environments with voluntary participants who accepted risks. Autonomous vehicles are deployed on public roads alongside non-consenting pedestrians and drivers. The aviation analogy fails because AV testing imposes risk on the public without their consent, which is an ethical violation that "move fast and break things" cannot override when the things being broken are human lives.', quality: 'strong', logic: 10, evidence: 7, persuasion: 10, explanation: 'Devastating rebuttal that identifies the consent problem missing from the aviation analogy.' },
          { text: 'Aviation development took decades of incremental testing before commercial deployment. Autonomous vehicles are being rushed to market before the technology is mature.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Challenges the pace of deployment.' },
          { text: 'Comparing cars to airplanes is apples and oranges. They are completely different technologies.', quality: 'weak', logic: 4, evidence: 2, persuasion: 3, explanation: 'Dismisses without explaining why the comparison fails.' },
          { text: 'Silicon Valley just wants to move fast and break things because they do not care about ordinary people.', quality: 'fallacious', logic: 3, evidence: 2, persuasion: 4, explanation: 'Ad hominem against the technology sector.' },
        ],
      },
    ],
  },

  /* 15 ── Traditional medicine has a place alongside modern medicine */
  {
    title: 'Traditional medicine has a place alongside modern medicine',
    rounds: [
      {
        aiArgument: 'The WHO estimates that 80% of people in developing countries rely on traditional medicine as their primary healthcare. Dismissing these systems ignores the reality that modern medicine is inaccessible to billions. Traditional medicine fills a critical healthcare gap that modern systems have failed to close.',
        rebuttals: [
          { text: 'People rely on traditional medicine primarily because they lack access to modern healthcare, not because they prefer it. When modern medicine becomes available, utilization of traditional practices declines. The 80% figure is an indictment of healthcare access inequality, not an endorsement of traditional medicine\'s efficacy. The solution is expanding modern healthcare access, not legitimizing substitutes of unproven quality.', quality: 'strong', logic: 9, evidence: 8, persuasion: 9, explanation: 'Reframes reliance as necessity rather than preference.' },
          { text: 'Integrating traditional and modern medicine could improve access in underserved regions while gradually building modern healthcare infrastructure.', quality: 'decent', logic: 7, evidence: 5, persuasion: 6, explanation: 'Pragmatic middle ground.' },
          { text: 'Traditional medicine is just unproven folk remedies. People should demand real medicine instead.', quality: 'weak', logic: 4, evidence: 3, persuasion: 3, explanation: 'Dismissive of complex healthcare realities in developing nations.' },
          { text: 'Pharmaceutical companies suppress traditional medicine because they cannot patent natural remedies and profit from them.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 4, explanation: 'Conspiracy narrative ignoring that many pharmaceuticals derive from natural compounds.' },
        ],
      },
      {
        aiArgument: 'Many modern drugs originate from traditional medicine. Aspirin comes from willow bark, artemisinin from Chinese wormwood, and morphine from opium poppies. Traditional knowledge systems are a vast, underexplored pharmacopeia that could yield future breakthroughs.',
        rebuttals: [
          { text: 'The examples cited prove the opposite of the intended point: willow bark was useful, but aspirin became transformative only after scientists isolated, purified, and standardized the active compound. The value was unlocked by modern scientific methodology, not by traditional practice. Using traditional knowledge as a lead for drug discovery is useful; using traditional preparations as medicine is skipping the rigorous testing that makes compounds safe and effective.', quality: 'strong', logic: 10, evidence: 8, persuasion: 9, explanation: 'Turns the examples against the argument by distinguishing leads from treatments.' },
          { text: 'Drug discovery from natural products has declined because high-throughput screening and computational chemistry have proven more efficient at identifying drug candidates.', quality: 'decent', logic: 7, evidence: 6, persuasion: 5, explanation: 'Challenges the ongoing relevance of ethnobotanical leads.' },
          { text: 'Just because a few traditional remedies happened to work does not mean traditional medicine as a system is valid.', quality: 'weak', logic: 5, evidence: 3, persuasion: 4, explanation: 'Directionally correct but poorly argued.' },
          { text: 'Big pharma steals traditional knowledge, patents it, and sells it back to the communities who discovered it. The whole system is exploitative.', quality: 'fallacious', logic: 3, evidence: 4, persuasion: 5, explanation: 'Contains a real concern (biopiracy) but uses it to derail the efficacy debate.' },
        ],
      },
      {
        aiArgument: 'Modern medicine excels at acute care but often fails chronic patients. Traditional practices like acupuncture, yoga, and meditation have demonstrated measurable benefits for chronic pain, stress, and mental health in randomized controlled trials published in major journals.',
        rebuttals: [
          { text: 'When traditional practices are tested rigorously, they typically perform no better than active placebos. The largest acupuncture meta-analysis, published in JAMA, found effects barely exceeding sham acupuncture, suggesting the benefit comes from the therapeutic encounter, not the specific traditional technique. Yoga and meditation are physical exercise and relaxation, which are evidence-based practices independent of any traditional medical framework.', quality: 'strong', logic: 9, evidence: 9, persuasion: 8, explanation: 'Separates evidence-based components from traditional frameworks.' },
          { text: 'Some traditional practices do show benefits, but these could be incorporated into evidence-based integrative care without endorsing the broader traditional medical systems they come from.', quality: 'decent', logic: 7, evidence: 6, persuasion: 7, explanation: 'Accepts some value while maintaining scientific standards.' },
          { text: 'If it works, it works. Who cares whether science can explain it?', quality: 'weak', logic: 3, evidence: 2, persuasion: 4, explanation: 'Anti-scientific reasoning that undermines patient safety.' },
          { text: 'Modern medicine just prescribes pills for everything because doctors are paid by pharmaceutical companies.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 4, explanation: 'Conspiracy generalization about medical practice.' },
        ],
      },
      {
        aiArgument: 'Traditional medicine treats the whole person: mind, body, and spirit. Modern medicine\'s reductionist approach treats symptoms and organs in isolation, often missing the interconnected nature of health. The biopsychosocial model that modern medicine now advocates is essentially what traditional systems have practiced for millennia.',
        rebuttals: [
          { text: 'Modern medicine\'s "reductionism" is precisely what enables it to identify specific causes and develop targeted treatments. Holistic approaches sound appealing but can mask diagnostic failures: treating the "whole person" without identifying that their fatigue is caused by thyroid cancer is not holistic care, it is missed diagnosis. Modern medicine already incorporates psychology, social work, and patient-centered care without requiring unproven theoretical frameworks.', quality: 'strong', logic: 9, evidence: 7, persuasion: 9, explanation: 'Shows how "holism" can actually be a weakness in clinical practice.' },
          { text: 'The biopsychosocial model emerged from modern psychiatric research, not from traditional medicine. Claiming traditional medicine invented it erases the scientific work that developed it.', quality: 'decent', logic: 7, evidence: 6, persuasion: 6, explanation: 'Corrects the historical claim.' },
          { text: 'Modern medicine is too focused on specialization. Nobody looks at the whole patient anymore.', quality: 'weak', logic: 4, evidence: 3, persuasion: 5, explanation: 'Contains truth but does not argue for traditional medicine specifically.' },
          { text: 'Western medicine is just arrogant. It refuses to learn from other cultures because of racism and colonialism.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 3, explanation: 'Ad hominem attack on an entire medical tradition.' },
        ],
      },
      {
        aiArgument: 'Cultural respect demands that we do not dismiss traditional medicine. For billions of people, traditional healing is inseparable from cultural identity and community. A purely biomedical approach that ignores cultural context is not only disrespectful but clinically less effective, as patients who trust their treatment adhere better and recover faster.',
        rebuttals: [
          { text: 'Cultural sensitivity is important in healthcare delivery, but it does not require accepting unproven treatments as clinically valid. Culturally competent modern medicine, where practitioners understand and respect patients\' cultural backgrounds while providing evidence-based care, achieves better outcomes than either approach alone. We can honor culture without endorsing treatments that may delay effective care or cause direct harm through contamination or drug interactions.', quality: 'strong', logic: 9, evidence: 7, persuasion: 10, explanation: 'Threads the needle between respect and evidence perfectly.' },
          { text: 'Patient trust can be built through respectful communication and shared decision-making within evidence-based medicine, without validating specific traditional treatments.', quality: 'decent', logic: 7, evidence: 5, persuasion: 7, explanation: 'Separates cultural respect from treatment endorsement.' },
          { text: 'Just because something is traditional does not make it good. Many traditions are harmful and should be abandoned.', quality: 'weak', logic: 4, evidence: 3, persuasion: 3, explanation: 'True but culturally insensitive framing that undermines persuasion.' },
          { text: 'Traditional medicine practitioners are charlatans who exploit vulnerable people. We should not respect that.', quality: 'fallacious', logic: 2, evidence: 2, persuasion: 2, explanation: 'Sweeping condemnation of millions of practitioners without nuance.' },
        ],
      },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ROUNDS_PER_DEBATE = 5
const DEBATES_PER_SESSION = 3
const AI_BASE_SCORE_PER_ROUND = 20 // AI "earns" a fixed score per round (escalating)

const QUALITY_LABELS: Record<Quality, string> = {
  strong: 'Strong Rebuttal',
  decent: 'Decent Rebuttal',
  weak: 'Weak Rebuttal',
  fallacious: 'Logical Fallacy',
}

const QUALITY_COLORS: Record<Quality, string> = {
  strong: COLOR.emerald,
  decent: COLOR.sapphire,
  weak: COLOR.amber,
  fallacious: COLOR.rose,
}

/* ------------------------------------------------------------------ */
/*  Visual palette                                                     */
/* ------------------------------------------------------------------ */

const bg = COLOR.bgDeep
const aiCardBg = '#2a2418'
const aiCardBorder = '#3d3528'
const playerCardBg = '#faf7f2'
const playerCardBorder = COLOR.border
const textDark = '#2c2418'
const textMuted = COLOR.muted
const textDim = COLOR.dim
const accentPrimary = COLOR.violet
const accentSecondary = COLOR.teal

function cardStyle(dark?: boolean): React.CSSProperties {
  return {
    background: dark ? aiCardBg : playerCardBg,
    border: `1px solid ${dark ? aiCardBorder : playerCardBorder}`,
    borderRadius: RADIUS.lg,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(20,16,10,0.06)',
  }
}

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function aiRoundScore(roundIdx: number): number {
  // AI score escalates with round number (harder as it goes)
  return AI_BASE_SCORE_PER_ROUND + roundIdx * 2
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DebateAI({
  onBack,
  onGameEnd,
}: {
  onBack: () => void
  onGameEnd?: (r: {
    score: number
    accuracy: number
    level: number
    maxScore?: number
    timeMs?: number
  }) => void
}) {
  /* ---- State ---- */
  const [phase, setPhase] = useState<Phase>('menu')
  const [debateIndex, setDebateIndex] = useState(0) // 0-2 in best-of-3
  const [roundIndex, setRoundIndex] = useState(0) // 0-4 in current debate
  const [playerSide, setPlayerSide] = useState<'for' | 'against'>('against')
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0)
  const [usedTopicIdxs, setUsedTopicIdxs] = useState<number[]>([])
  const [shuffledRebuttals, setShuffledRebuttals] = useState<Rebuttal[]>([])

  // Round-level
  const [playedRounds, setPlayedRounds] = useState<PlayedRound[]>([])

  // Debate-level
  const [debateRecords, setDebateRecords] = useState<DebateRecord[]>([])

  const [hovered, setHovered] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const startTimeRef = useRef(Date.now())

  const currentTopic = TOPICS[currentTopicIdx]
  const currentRoundData = currentTopic?.rounds[roundIndex]

  /* ---- Pick a new topic ---- */
  const pickNewTopic = useCallback(() => {
    const available = TOPICS.map((_, i) => i).filter(i => !usedTopicIdxs.includes(i))
    const idx = available.length > 0 ? pickRandom(available) : Math.floor(Math.random() * TOPICS.length)
    setCurrentTopicIdx(idx)
    setUsedTopicIdxs(prev => [...prev, idx])
    setPlayerSide(Math.random() < 0.5 ? 'for' : 'against')
    return idx
  }, [usedTopicIdxs])

  /* ---- Shuffle rebuttals when round changes ---- */
  useEffect(() => {
    if (phase === 'debate' && currentRoundData) {
      setShuffledRebuttals(shuffle(currentRoundData.rebuttals))
    }
  }, [phase, roundIndex, currentTopicIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Start a new debate ---- */
  const startDebate = useCallback(() => {
    const idx = pickNewTopic()
    setRoundIndex(0)
    setPlayedRounds([])
    // Shuffle rebuttals for the first round
    setShuffledRebuttals(shuffle(TOPICS[idx].rounds[0].rebuttals))
    sfxReveal()
    setPhase('topic-reveal')
  }, [pickNewTopic])

  const beginDebate = useCallback(() => {
    sfxTap()
    setPhase('debate')
  }, [])

  /* ---- Select a rebuttal ---- */
  const selectRebuttal = useCallback(
    (rebuttal: Rebuttal) => {
      if (!currentTopic || !currentRoundData) return
      sfxTap()

      const total = rebuttal.logic + rebuttal.evidence + rebuttal.persuasion
      if (total >= 24) sfxCorrect()
      else if (total <= 12) sfxWrong()

      const played: PlayedRound = {
        roundNum: roundIndex + 1,
        aiArgument: currentRoundData.aiArgument,
        chosenRebuttal: rebuttal,
        playerSide,
      }
      setPlayedRounds(prev => [...prev, played])
      setPhase('round-result')
    },
    [currentTopic, currentRoundData, roundIndex, playerSide]
  )

  /* ---- Advance to next round or finish debate ---- */
  const advanceRound = useCallback(() => {
    if (roundIndex < ROUNDS_PER_DEBATE - 1) {
      sfxLevelUp()
      const nextIdx = roundIndex + 1
      setRoundIndex(nextIdx)
      setShuffledRebuttals(shuffle(currentTopic.rounds[nextIdx].rebuttals))
      setPhase('debate')
    } else {
      // Debate finished
      sfxGameOver()
      const playerTotal = playedRounds.reduce(
        (sum, r) => sum + r.chosenRebuttal.logic + r.chosenRebuttal.evidence + r.chosenRebuttal.persuasion,
        0
      )
      // Include the current round (not yet in playedRounds via setState)
      // Actually it IS in playedRounds at this point via the selectRebuttal callback
      const aiTotal = Array.from({ length: ROUNDS_PER_DEBATE }, (_, i) => aiRoundScore(i)).reduce((a, b) => a + b, 0)

      const record: DebateRecord = {
        topicTitle: currentTopic.title,
        playerSide,
        rounds: [...playedRounds],
        playerTotal,
        aiTotal,
        winner: playerTotal > aiTotal ? 'player' : playerTotal < aiTotal ? 'ai' : 'draw',
      }
      setDebateRecords(prev => [...prev, record])
      setPhase('debate-summary')
    }
  }, [roundIndex, currentTopic, playedRounds, playerSide])

  /* ---- Next debate or final ---- */
  const nextDebateOrFinal = useCallback(() => {
    if (debateIndex < DEBATES_PER_SESSION - 1) {
      setDebateIndex(prev => prev + 1)
      startDebate()
    } else {
      setPhase('final-result')
    }
  }, [debateIndex, startDebate])

  /* ---- Report score at final ---- */
  useEffect(() => {
    if (phase === 'final-result') {
      const totalPlayerScore = debateRecords.reduce((s, d) => s + d.playerTotal, 0)
      const maxPossible = DEBATES_PER_SESSION * ROUNDS_PER_DEBATE * 30 // 3 dimensions * 10 max each
      const elapsed = Date.now() - startTimeRef.current
      const playerWins = debateRecords.filter(d => d.winner === 'player').length
      onGameEnd?.({
        score: totalPlayerScore,
        accuracy: totalPlayerScore / maxPossible,
        level: playerWins >= 2 ? 3 : playerWins >= 1 ? 2 : 1,
        maxScore: maxPossible,
        timeMs: elapsed,
      })
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Full reset ---- */
  const fullReset = useCallback(() => {
    setPhase('menu')
    setDebateIndex(0)
    setRoundIndex(0)
    setPlayedRounds([])
    setDebateRecords([])
    setUsedTopicIdxs([])
    setShowHistory(false)
    startTimeRef.current = Date.now()
  }, [])

  /* ---- Scoring helpers ---- */
  const playerScoreSoFar = playedRounds.reduce(
    (s, r) => s + r.chosenRebuttal.logic + r.chosenRebuttal.evidence + r.chosenRebuttal.persuasion,
    0
  )
  const aiScoreSoFar = Array.from({ length: playedRounds.length }, (_, i) => aiRoundScore(i)).reduce(
    (a, b) => a + b,
    0
  )

  const sessionPlayerWins = debateRecords.filter(d => d.winner === 'player').length
  const sessionAiWins = debateRecords.filter(d => d.winner === 'ai').length

  /* ---- Styles ---- */
  const pageStyle: React.CSSProperties = {
    padding: '40px 4vw',
    minHeight: '100vh',
    background: bg,
    maxWidth: 820,
    margin: '0 auto',
  }

  void (phase === 'menu' ? onBack : phase === 'final-result' ? fullReset : undefined)

  /* ================================================================ */
  /*  MENU                                                             */
  /* ================================================================ */
  if (phase === 'menu') {
    return (
      <div style={pageStyle}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 32,
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 68,
              height: 68,
              borderRadius: RADIUS.xl,
              background: accentPrimary + '18',
              marginBottom: 16,
            }}
          >
            <Scale size={34} color={accentPrimary} />
          </div>
          <h1
            style={{
              color: textDark,
              fontSize: 30,
              fontWeight: 700,
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
            }}
          >
            Debate AI
          </h1>
          <p
            style={{
              color: textMuted,
              fontSize: 14,
              margin: '0 auto',
              maxWidth: 460,
              lineHeight: 1.7,
            }}
          >
            Face off against an AI opponent across 3 debates. Each debate has 5 rounds of
            escalating arguments. Choose the strongest rebuttal to outscore your opponent.
            Best of 3 wins.
          </p>
        </div>

        {/* Stats preview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginBottom: 36,
          }}
        >
          {[
            { label: 'Debates', value: '3', sub: 'Best of 3' },
            { label: 'Rounds', value: '5', sub: 'Per debate' },
            { label: 'Topics', value: String(TOPICS.length), sub: 'Available' },
          ].map(s => (
            <div
              key={s.label}
              style={{
                ...cardStyle(),
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: accentPrimary, fontSize: 24, fontWeight: 700 }}>
                {s.value}
              </div>
              <div style={{ color: textDark, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                {s.label}
              </div>
              <div style={{ color: textDim, fontSize: 11, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Scoring explanation */}
        <div style={{ ...cardStyle(), padding: '20px 24px', marginBottom: 36 }}>
          <div
            style={{
              color: textDark,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Scoring Dimensions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: Brain, label: 'Logic', color: COLOR.sapphire, desc: 'Does the rebuttal address the argument\'s reasoning?' },
              { icon: BookOpen, label: 'Evidence', color: COLOR.emerald, desc: 'Does it cite relevant facts or data?' },
              { icon: Star, label: 'Persuasion', color: COLOR.amber, desc: 'Would a neutral audience find it convincing?' },
            ].map(d => {
              const Icon = d.icon
              return (
                <div key={d.label} style={{ textAlign: 'center' }}>
                  <Icon size={18} color={d.color} style={{ marginBottom: 6 }} />
                  <div style={{ color: textDark, fontSize: 12, fontWeight: 600 }}>{d.label}</div>
                  <div style={{ color: textDim, fontSize: 10, marginTop: 2, lineHeight: 1.4 }}>
                    {d.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              startTimeRef.current = Date.now()
              startDebate()
            }}
            onMouseEnter={() => setHovered('start')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(accentPrimary),
              fontSize: 15,
              padding: '12px 32px',
              transform: hovered === 'start' ? 'translateY(-1px)' : 'none',
            }}
          >
            <Zap size={16} /> Begin Session
          </button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  TOPIC REVEAL                                                     */
  /* ================================================================ */
  if (phase === 'topic-reveal') {
    const sideColor = playerSide === 'for' ? COLOR.emerald : COLOR.rose
    const sideLabel = playerSide === 'for' ? 'FOR' : 'AGAINST'
    const aiSideLabel = playerSide === 'for' ? 'AGAINST' : 'FOR'

    return (
      <div style={pageStyle}>
        {/* HUD */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
            fontSize: 12,
            fontWeight: 600,
            color: textMuted,
          }}
        >
          <span>
            Debate {debateIndex + 1} of {DEBATES_PER_SESSION}
          </span>
          <span>
            Session: You {sessionPlayerWins} - {sessionAiWins} AI
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <div
            style={{
              ...cardStyle(),
              padding: '40px 32px',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                color: textDim,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}
            >
              Debate Topic
            </div>
            <h2
              style={{
                color: textDark,
                fontSize: 22,
                fontWeight: 700,
                margin: '0 0 24px',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}
            >
              "{currentTopic.title}"
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                marginBottom: 28,
              }}
            >
              <div>
                <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Your Side
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: sideColor + '18',
                    color: sideColor,
                    padding: '6px 14px',
                    borderRadius: RADIUS.full,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {playerSide === 'for' ? (
                    <ThumbsUp size={14} />
                  ) : (
                    <ThumbsDown size={14} />
                  )}
                  {sideLabel}
                </div>
              </div>
              <div>
                <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  AI Side
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: (playerSide === 'for' ? COLOR.rose : COLOR.emerald) + '18',
                    color: playerSide === 'for' ? COLOR.rose : COLOR.emerald,
                    padding: '6px 14px',
                    borderRadius: RADIUS.full,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Brain size={14} />
                  {aiSideLabel}
                </div>
              </div>
            </div>

            <p style={{ color: textMuted, fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
              The AI will present 5 arguments {playerSide === 'for' ? 'against' : 'for'} this
              proposition, each more sophisticated than the last. Choose the strongest rebuttal
              each round.
            </p>

            <button
              onClick={beginDebate}
              onMouseEnter={() => setHovered('begin')}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...solidBtn(sideColor),
                transform: hovered === 'begin' ? 'translateY(-1px)' : 'none',
              }}
            >
              Begin Debate <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  DEBATE - AI argument + rebuttal selection                        */
  /* ================================================================ */
  if (phase === 'debate' && currentRoundData) {
    const sideColor = playerSide === 'for' ? COLOR.emerald : COLOR.rose

    return (
      <div style={pageStyle}>
        {/* HUD */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            padding: '10px 16px',
            borderRadius: RADIUS.md,
            background: playerCardBg,
            border: `1px solid ${playerCardBorder}`,
            fontSize: 12,
          }}
        >
          <div>
            <span style={{ color: textDim, fontWeight: 600 }}>Debate {debateIndex + 1}/{DEBATES_PER_SESSION}</span>
            <span style={{ color: textDim, margin: '0 8px' }}>|</span>
            <span style={{ color: textDark, fontWeight: 700 }}>Round {roundIndex + 1}/{ROUNDS_PER_DEBATE}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: sideColor, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em' }}>
              {playerSide === 'for' ? 'FOR' : 'AGAINST'}
            </span>
            <span style={{ color: textDim }}>|</span>
            <span style={{ color: COLOR.emerald, fontWeight: 600 }}>You: {playerScoreSoFar}</span>
            <span style={{ color: textDim }}>vs</span>
            <span style={{ color: COLOR.rose, fontWeight: 600 }}>AI: {aiScoreSoFar}</span>
          </div>
        </div>

        {/* Topic */}
        <div
          style={{
            color: textMuted,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 20,
            padding: '0 4px',
          }}
        >
          {currentTopic.title}
        </div>

        {/* Round progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {Array.from({ length: ROUNDS_PER_DEBATE }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i < roundIndex ? COLOR.emerald : i === roundIndex ? accentPrimary : COLOR.border,
                transition: `background ${MOTION.fast}`,
              }}
            />
          ))}
        </div>

        {/* AI Argument - dark card */}
        <div
          style={{
            ...cardStyle(true),
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: accentPrimary + '28',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={15} color={accentPrimary} />
            </div>
            <span style={{ color: '#e8e2d8', fontSize: 13, fontWeight: 700 }}>AI Opponent</span>
            <span
              style={{
                marginLeft: 'auto',
                background: accentSecondary + '25',
                color: accentSecondary,
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 10px',
                borderRadius: RADIUS.full,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Round {roundIndex + 1}
            </span>
          </div>
          <p
            style={{
              color: '#e8e2d8',
              fontSize: 14,
              lineHeight: 1.75,
              margin: 0,
              opacity: 0.92,
            }}
          >
            {currentRoundData.aiArgument}
          </p>
        </div>

        {/* Rebuttal options - lighter cards */}
        <div
          style={{
            color: textDim,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}
        >
          Choose your rebuttal
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shuffledRebuttals.map((r, i) => {
            const isHov = hovered === `reb-${i}`
            return (
              <button
                key={i}
                onClick={() => selectRebuttal(r)}
                onMouseEnter={() => setHovered(`reb-${i}`)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...cardStyle(),
                  padding: '16px 20px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transform: isHov ? 'translateY(-1px)' : 'none',
                  boxShadow: isHov
                    ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(20,16,10,0.08), 0 0 0 1px ${accentPrimary}40`
                    : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(20,16,10,0.06)',
                  transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
                }}
              >
                <div style={{ color: textDark, fontSize: 13, lineHeight: 1.65 }}>{r.text}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  ROUND RESULT                                                     */
  /* ================================================================ */
  if (phase === 'round-result' && playedRounds.length > 0) {
    const lastRound = playedRounds[playedRounds.length - 1]
    const r = lastRound.chosenRebuttal
    const roundTotal = r.logic + r.evidence + r.persuasion
    const aiRound = aiRoundScore(roundIndex)
    const qualColor = QUALITY_COLORS[r.quality]
    const sideColor = playerSide === 'for' ? COLOR.emerald : COLOR.rose

    return (
      <div style={pageStyle}>
        {/* HUD */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            padding: '10px 16px',
            borderRadius: RADIUS.md,
            background: playerCardBg,
            border: `1px solid ${playerCardBorder}`,
            fontSize: 12,
          }}
        >
          <div>
            <span style={{ color: textDark, fontWeight: 700 }}>
              Round {roundIndex + 1}/{ROUNDS_PER_DEBATE}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: sideColor, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em' }}>
              {playerSide === 'for' ? 'FOR' : 'AGAINST'}
            </span>
            <span style={{ color: textDim }}>|</span>
            <span style={{ color: COLOR.emerald, fontWeight: 600 }}>You: {playerScoreSoFar}</span>
            <span style={{ color: textDim }}>vs</span>
            <span style={{ color: COLOR.rose, fontWeight: 600 }}>AI: {aiScoreSoFar}</span>
          </div>
        </div>

        {/* Quality badge */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: qualColor + '18',
              color: qualColor,
              padding: '8px 18px',
              borderRadius: RADIUS.full,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {r.quality === 'strong' && <Shield size={14} />}
            {r.quality === 'decent' && <Target size={14} />}
            {r.quality === 'weak' && <AlertTriangle size={14} />}
            {r.quality === 'fallacious' && <AlertTriangle size={14} />}
            {QUALITY_LABELS[r.quality]}
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{ ...cardStyle(), padding: '24px', marginBottom: 20 }}>
          <div style={{ color: textDark, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            Round Score
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Logic', value: r.logic, color: COLOR.sapphire, icon: Brain },
              { label: 'Evidence', value: r.evidence, color: COLOR.emerald, icon: BookOpen },
              { label: 'Persuasion', value: r.persuasion, color: COLOR.amber, icon: Star },
            ].map(d => {
              const Icon = d.icon
              return (
                <div key={d.label} style={{ textAlign: 'center' }}>
                  <Icon size={16} color={d.color} style={{ marginBottom: 6 }} />
                  <div style={{ color: d.color, fontSize: 26, fontWeight: 700 }}>{d.value}</div>
                  <div style={{ color: textDim, fontSize: 10, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d.label}
                  </div>
                  {/* bar */}
                  <div style={{ width: '100%', height: 4, borderRadius: 2, background: COLOR.border, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${d.value * 10}%`, height: '100%', borderRadius: 2, background: d.color, transition: `width ${MOTION.slow}` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals comparison */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 24,
              padding: '14px 0',
              borderTop: `1px solid ${COLOR.border}`,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: roundTotal >= aiRound ? COLOR.emerald : textDim, fontSize: 22, fontWeight: 700 }}>
                {roundTotal}
              </div>
              <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Your Total</div>
            </div>
            <div style={{ color: textDim, fontSize: 14, fontWeight: 600 }}>vs</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: roundTotal < aiRound ? COLOR.rose : textDim, fontSize: 22, fontWeight: 700 }}>
                {aiRound}
              </div>
              <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>AI Score</div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div style={{ ...cardStyle(), padding: '18px 20px', marginBottom: 24 }}>
          <div style={{ color: textDark, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Analysis
          </div>
          <p style={{ color: textMuted, fontSize: 13, lineHeight: 1.65, margin: 0 }}>
            {r.explanation}
          </p>
        </div>

        {/* Next */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={advanceRound}
            onMouseEnter={() => setHovered('next')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(accentPrimary),
              transform: hovered === 'next' ? 'translateY(-1px)' : 'none',
            }}
          >
            {roundIndex < ROUNDS_PER_DEBATE - 1 ? 'Next Round' : 'See Debate Results'}{' '}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  DEBATE SUMMARY                                                   */
  /* ================================================================ */
  if (phase === 'debate-summary') {
    const record = debateRecords[debateRecords.length - 1]
    if (!record) return null
    const won = record.winner === 'player'
    const draw = record.winner === 'draw'
    const resultColor = won ? COLOR.emerald : draw ? COLOR.amber : COLOR.rose
    const resultLabel = won ? 'You Won This Debate' : draw ? 'Draw' : 'AI Won This Debate'

    // Dimension averages
    const dims = record.rounds.reduce(
      (acc, r) => ({
        logic: acc.logic + r.chosenRebuttal.logic,
        evidence: acc.evidence + r.chosenRebuttal.evidence,
        persuasion: acc.persuasion + r.chosenRebuttal.persuasion,
      }),
      { logic: 0, evidence: 0, persuasion: 0 }
    )
    const avgLogic = (dims.logic / record.rounds.length).toFixed(1)
    const avgEvidence = (dims.evidence / record.rounds.length).toFixed(1)
    const avgPersuasion = (dims.persuasion / record.rounds.length).toFixed(1)

    return (
      <div style={pageStyle}>
        {/* Result header */}
        <div
          style={{
            ...cardStyle(),
            padding: '32px',
            textAlign: 'center',
            marginBottom: 24,
            borderColor: resultColor + '40',
          }}
        >
          <Trophy size={28} color={resultColor} style={{ marginBottom: 12 }} />
          <div style={{ color: resultColor, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            {resultLabel}
          </div>
          <div style={{ color: textMuted, fontSize: 13, marginBottom: 16 }}>
            "{record.topicTitle}" -- You argued{' '}
            <span style={{ fontWeight: 700 }}>
              {record.playerSide === 'for' ? 'FOR' : 'AGAINST'}
            </span>
          </div>

          {/* Final score */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 32,
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ color: won ? COLOR.emerald : textDim, fontSize: 32, fontWeight: 700 }}>
                {record.playerTotal}
              </div>
              <div style={{ color: textDim, fontSize: 11, fontWeight: 600 }}>YOU</div>
            </div>
            <div style={{ color: textDim, fontSize: 16, fontWeight: 600 }}>vs</div>
            <div>
              <div style={{ color: !won && !draw ? COLOR.rose : textDim, fontSize: 32, fontWeight: 700 }}>
                {record.aiTotal}
              </div>
              <div style={{ color: textDim, fontSize: 11, fontWeight: 600 }}>AI</div>
            </div>
          </div>

          {/* Dimension averages */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Logic', avg: avgLogic, color: COLOR.sapphire },
              { label: 'Evidence', avg: avgEvidence, color: COLOR.emerald },
              { label: 'Persuasion', avg: avgPersuasion, color: COLOR.amber },
            ].map(d => (
              <div key={d.label} style={{ textAlign: 'center' }}>
                <div style={{ color: d.color, fontSize: 18, fontWeight: 700 }}>{d.avg}</div>
                <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                  avg {d.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debate history toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            background: 'none',
            border: `1px solid ${COLOR.border}`,
            borderRadius: RADIUS.md,
            padding: '10px 16px',
            color: textDark,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            marginBottom: showHistory ? 12 : 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Full Debate Transcript</span>
          <ChevronRight
            size={14}
            style={{
              transform: showHistory ? 'rotate(90deg)' : 'none',
              transition: `transform ${MOTION.fast}`,
            }}
          />
        </button>

        {showHistory && (
          <div style={{ ...cardStyle(), padding: '20px 24px', marginBottom: 24 }}>
            {record.rounds.map((r, i) => {
              const qCol = QUALITY_COLORS[r.chosenRebuttal.quality]
              return (
                <div
                  key={i}
                  style={{
                    marginBottom: i < record.rounds.length - 1 ? 20 : 0,
                    paddingBottom: i < record.rounds.length - 1 ? 20 : 0,
                    borderBottom: i < record.rounds.length - 1 ? `1px solid ${COLOR.border}` : 'none',
                  }}
                >
                  <div
                    style={{
                      color: textDim,
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 10,
                    }}
                  >
                    Round {r.roundNum}
                  </div>

                  {/* AI */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: accentPrimary + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <Brain size={11} color={accentPrimary} />
                    </div>
                    <div>
                      <div style={{ color: textDim, fontSize: 10, fontWeight: 600, marginBottom: 3 }}>
                        AI
                      </div>
                      <div style={{ color: textDark, fontSize: 12, lineHeight: 1.6, opacity: 0.85 }}>
                        {r.aiArgument}
                      </div>
                    </div>
                  </div>

                  {/* Player */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8, paddingLeft: 32 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span
                          style={{
                            color: qCol,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {QUALITY_LABELS[r.chosenRebuttal.quality]}
                        </span>
                      </div>
                      <div style={{ color: textMuted, fontSize: 12, lineHeight: 1.6 }}>
                        {r.chosenRebuttal.text}
                      </div>
                    </div>
                  </div>

                  {/* Mini scores */}
                  <div style={{ display: 'flex', gap: 14, paddingLeft: 32 }}>
                    <span style={{ color: COLOR.sapphire, fontSize: 10, fontWeight: 700 }}>
                      L:{r.chosenRebuttal.logic}
                    </span>
                    <span style={{ color: COLOR.emerald, fontSize: 10, fontWeight: 700 }}>
                      E:{r.chosenRebuttal.evidence}
                    </span>
                    <span style={{ color: COLOR.amber, fontSize: 10, fontWeight: 700 }}>
                      P:{r.chosenRebuttal.persuasion}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Session standing */}
        <div
          style={{
            ...cardStyle(),
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: COLOR.emerald, fontSize: 22, fontWeight: 700 }}>
              {sessionPlayerWins}
            </div>
            <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
              Your Wins
            </div>
          </div>
          <div style={{ color: textDim, fontSize: 14, fontWeight: 600 }}>
            of {DEBATES_PER_SESSION}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: COLOR.rose, fontSize: 22, fontWeight: 700 }}>
              {sessionAiWins}
            </div>
            <div style={{ color: textDim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
              AI Wins
            </div>
          </div>
        </div>

        {/* Next debate */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={nextDebateOrFinal}
            onMouseEnter={() => setHovered('next-debate')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(accentPrimary),
              transform: hovered === 'next-debate' ? 'translateY(-1px)' : 'none',
            }}
          >
            {debateIndex < DEBATES_PER_SESSION - 1
              ? `Start Debate ${debateIndex + 2}`
              : 'See Final Results'}{' '}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  FINAL RESULT                                                     */
  /* ================================================================ */
  if (phase === 'final-result') {
    const totalPlayerScore = debateRecords.reduce((s, d) => s + d.playerTotal, 0)
    const totalAiScore = debateRecords.reduce((s, d) => s + d.aiTotal, 0)
    const overallWon = sessionPlayerWins > sessionAiWins
    const overallDraw = sessionPlayerWins === sessionAiWins
    const resultColor = overallWon ? COLOR.emerald : overallDraw ? COLOR.amber : COLOR.rose
    const resultTitle = overallWon
      ? 'You Won the Session'
      : overallDraw
        ? 'Session Tied'
        : 'AI Won the Session'
    const resultDesc = overallWon
      ? 'Your argumentation skills proved superior across the debates.'
      : overallDraw
        ? 'An evenly matched contest. Both sides argued well.'
        : 'The AI presented stronger arguments this time. Study the transcripts and try again.'

    // Grade
    const avgScore = totalPlayerScore / (DEBATES_PER_SESSION * ROUNDS_PER_DEBATE)
    const grade =
      avgScore >= 25
        ? { letter: 'S', label: 'Master Debater', color: COLOR.gold }
        : avgScore >= 20
          ? { letter: 'A', label: 'Compelling Advocate', color: COLOR.emerald }
          : avgScore >= 15
            ? { letter: 'B', label: 'Strong Reasoner', color: COLOR.sapphire }
            : avgScore >= 10
              ? { letter: 'C', label: 'Developing Thinker', color: COLOR.amber }
              : { letter: 'D', label: 'Needs Practice', color: COLOR.rose }

    return (
      <div style={pageStyle}>
        <button
          onClick={fullReset}
          style={{
            background: 'none',
            border: 'none',
            color: textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 32,
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Menu
        </button>

        {/* Grade card */}
        <div
          style={{
            ...cardStyle(),
            padding: '36px',
            textAlign: 'center',
            marginBottom: 24,
            borderColor: grade.color + '40',
          }}
        >
          <Trophy size={32} color={resultColor} style={{ marginBottom: 12 }} />
          <div style={{ color: resultColor, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {resultTitle}
          </div>
          <div style={{ color: grade.color, fontSize: 52, fontWeight: 700, lineHeight: 1 }}>
            {grade.letter}
          </div>
          <div style={{ color: textDark, fontSize: 16, fontWeight: 700, marginTop: 8 }}>
            {grade.label}
          </div>
          <p style={{ color: textMuted, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
            {resultDesc}
          </p>
        </div>

        {/* Session stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Your Score', value: totalPlayerScore, color: COLOR.emerald },
            { label: 'AI Score', value: totalAiScore, color: COLOR.rose },
            { label: 'Debates Won', value: sessionPlayerWins, color: COLOR.emerald },
            { label: 'Debates Lost', value: sessionAiWins, color: COLOR.rose },
          ].map(s => (
            <div key={s.label} style={{ ...cardStyle(), padding: '16px 8px', textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: textDim, fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Per-debate breakdown */}
        <div style={{ ...cardStyle(), padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ color: textDark, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            Debate Breakdown
          </div>
          {debateRecords.map((d, i) => {
            const won = d.winner === 'player'
            const draw = d.winner === 'draw'
            const dColor = won ? COLOR.emerald : draw ? COLOR.amber : COLOR.rose
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: i < debateRecords.length - 1 ? `1px solid ${COLOR.border}` : 'none',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: dColor + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: dColor,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: textDark, fontSize: 13, fontWeight: 600 }}>
                    {d.topicTitle}
                  </div>
                  <div style={{ color: textDim, fontSize: 11, marginTop: 2 }}>
                    {d.playerSide === 'for' ? 'Argued FOR' : 'Argued AGAINST'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: dColor, fontSize: 13, fontWeight: 700 }}>
                    {d.playerTotal} - {d.aiTotal}
                  </div>
                  <div style={{ color: dColor, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                    {won ? 'Won' : draw ? 'Draw' : 'Lost'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={fullReset}
            onMouseEnter={() => setHovered('retry-all')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(accentPrimary),
              transform: hovered === 'retry-all' ? 'translateY(-1px)' : 'none',
            }}
          >
            <RotateCcw size={15} /> New Session
          </button>
          <button
            onClick={onBack}
            onMouseEnter={() => setHovered('exit')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(accentSecondary),
              transform: hovered === 'exit' ? 'translateY(-1px)' : 'none',
            }}
          >
            <ArrowLeft size={15} /> Exit
          </button>
        </div>
      </div>
    )
  }

  /* fallback */
  return null
}
