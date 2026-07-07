import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft, Stethoscope, Zap, Clock, Target, Trophy,
  ChevronRight, RotateCcw, Heart, Brain, Activity,
  Flame, CheckCircle2, XCircle, BarChart3
} from 'lucide-react'
import { COLOR, RADIUS, MOTION, solidBtn } from '../lib/design'
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver } from '../lib/sfx'
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx'

/* ─── types ─── */
type Category = 'Cardiology' | 'Respiratory' | 'GI' | 'Neuro' | 'Infectious' | 'Endocrine'

interface Scenario {
  id: number
  category: Category
  presentation: string
  vitals?: string
  history?: string
  correct: string
  distractors: [string, string, string]
}

interface RoundResult {
  scenarioId: number
  category: Category
  correct: boolean
  timeMs: number
  selectedAnswer: string
  correctAnswer: string
}

/* ─── constants ─── */
const BG = '#080c12'
const CARD = '#151d2b'
const BORDER = '#1c2940'
const TEXT = '#e8edf5'
const MUTED = '#8494a7'
const DIM = '#4a5d75'
const ACCENT = COLOR.emerald
const ROUNDS = 15
const TIME_LIMIT = 15_000 // ms

const CATEGORY_COLORS: Record<Category, string> = {
  Cardiology: COLOR.rose,
  Respiratory: COLOR.teal,
  GI: COLOR.amber,
  Neuro: COLOR.violet,
  Infectious: COLOR.coral,
  Endocrine: COLOR.sapphire,
}

const CATEGORY_ICONS: Record<Category, string> = {
  Cardiology: '♥',
  Respiratory: '⭕',
  GI: '●',
  Neuro: '✦',
  Infectious: '☠',
  Endocrine: '⬡',
}

/* ─── 36 clinical scenarios ─── */
const ALL_SCENARIOS: Scenario[] = [
  // Cardiology (6)
  { id: 1, category: 'Cardiology', presentation: '58M, crushing substernal chest pain radiating to left arm, diaphoresis, nausea. ECG shows ST elevation in leads II, III, aVF.', vitals: 'BP 90/60, HR 110, SpO2 94%', history: 'Smoker, HTN, DM2', correct: 'Inferior STEMI', distractors: ['Aortic dissection', 'Pulmonary embolism', 'Acute pericarditis'] },
  { id: 2, category: 'Cardiology', presentation: '72F, progressive dyspnea, orthopnea, bilateral crackles, JVD, 3+ pitting edema. Chest X-ray shows cardiomegaly with cephalization.', vitals: 'BP 160/95, HR 105, SpO2 88%', history: 'CHF, non-compliant with meds', correct: 'Acute decompensated heart failure', distractors: ['Pneumonia', 'COPD exacerbation', 'Nephrotic syndrome'] },
  { id: 3, category: 'Cardiology', presentation: '45M, sudden-onset tearing chest pain radiating to back, unequal arm blood pressures, wide mediastinum on CXR.', vitals: 'Right arm BP 180/100, Left arm BP 140/80, HR 100', history: 'Marfan syndrome, HTN', correct: 'Aortic dissection', distractors: ['Myocardial infarction', 'Esophageal rupture', 'Tension pneumothorax'] },
  { id: 4, category: 'Cardiology', presentation: '28F, sharp pleuritic chest pain relieved by sitting forward, diffuse ST elevation with PR depression on ECG, friction rub on auscultation.', vitals: 'BP 120/75, HR 95, Temp 38.2C', history: 'Recent URI 2 weeks ago', correct: 'Acute pericarditis', distractors: ['STEMI', 'Costochondritis', 'Myocarditis'] },
  { id: 5, category: 'Cardiology', presentation: '65M, palpitations, irregularly irregular pulse, no P waves on ECG, narrow QRS complexes.', vitals: 'BP 130/85, HR 142 irregular, SpO2 96%', history: 'HTN, moderate alcohol use', correct: 'Atrial fibrillation', distractors: ['Atrial flutter', 'Supraventricular tachycardia', 'Ventricular tachycardia'] },
  { id: 6, category: 'Cardiology', presentation: '70F, exertional syncope, crescendo-decrescendo systolic murmur at right upper sternal border radiating to carotids, narrow pulse pressure.', vitals: 'BP 110/90, HR 78', history: 'Progressive dyspnea on exertion over 2 years', correct: 'Aortic stenosis', distractors: ['Mitral regurgitation', 'Hypertrophic cardiomyopathy', 'Pulmonary stenosis'] },

  // Respiratory (6)
  { id: 7, category: 'Respiratory', presentation: '55M, acute dyspnea, pleuritic chest pain, hemoptysis. Unilateral leg swelling. CT angiogram shows filling defect in right pulmonary artery.', vitals: 'BP 100/70, HR 120, SpO2 89%, RR 28', history: 'Recent long-haul flight, immobility', correct: 'Pulmonary embolism', distractors: ['Pneumonia', 'Pneumothorax', 'STEMI'] },
  { id: 8, category: 'Respiratory', presentation: '22M, sudden right-sided chest pain, dyspnea. Absent breath sounds on right, hyperresonant to percussion, tracheal deviation to left.', vitals: 'BP 85/55, HR 130, SpO2 82%, RR 32', history: 'Tall, thin build, smoker', correct: 'Tension pneumothorax', distractors: ['Simple pneumothorax', 'Hemothorax', 'Pleural effusion'] },
  { id: 9, category: 'Respiratory', presentation: '68F, productive cough with green sputum, fever, right lower lobe consolidation on CXR, bronchial breath sounds and egophony.', vitals: 'BP 125/80, HR 98, Temp 39.1C, SpO2 91%, RR 24', history: 'COPD, current smoker', correct: 'Community-acquired pneumonia', distractors: ['Lung abscess', 'TB', 'Bronchiectasis'] },
  { id: 10, category: 'Respiratory', presentation: '35F, worsening dyspnea, wheezing, accessory muscle use, cannot speak in full sentences, poor air movement bilaterally.', vitals: 'HR 125, RR 34, SpO2 87%, peak flow 25% predicted', history: 'Asthma, ran out of inhalers', correct: 'Severe asthma exacerbation', distractors: ['Anaphylaxis', 'Foreign body aspiration', 'Vocal cord dysfunction'] },
  { id: 11, category: 'Respiratory', presentation: '60M, chronic cough, weight loss 8kg over 3 months, hemoptysis, spiculated mass on CXR in right upper lobe.', vitals: 'BP 130/80, HR 82, SpO2 95%', history: '40 pack-year smoking history', correct: 'Lung carcinoma', distractors: ['Tuberculosis', 'Sarcoidosis', 'Lung abscess'] },
  { id: 12, category: 'Respiratory', presentation: '50M, progressive dyspnea, barrel chest, prolonged expiratory phase, decreased breath sounds, hyperinflated lungs on CXR with flattened diaphragms.', vitals: 'BP 135/85, HR 92, SpO2 90%, RR 22', history: '35 pack-year smoker', correct: 'COPD (emphysema)', distractors: ['Asthma', 'Interstitial lung disease', 'Congestive heart failure'] },

  // GI (6)
  { id: 13, category: 'GI', presentation: '42M, severe epigastric pain radiating to back, worse after heavy alcohol binge, nausea, vomiting. Lipase elevated >3x upper limit.', vitals: 'BP 105/70, HR 110, Temp 38.0C', history: 'Heavy alcohol use, gallstones', correct: 'Acute pancreatitis', distractors: ['Peptic ulcer perforation', 'Cholecystitis', 'Mesenteric ischemia'] },
  { id: 14, category: 'GI', presentation: '35F, RUQ pain worse after fatty meal, positive Murphy sign, gallbladder wall thickening and pericholecystic fluid on ultrasound.', vitals: 'BP 130/80, HR 95, Temp 38.5C', history: 'Obesity, OCP use, multipara', correct: 'Acute cholecystitis', distractors: ['Biliary colic', 'Hepatitis', 'Right lower lobe pneumonia'] },
  { id: 15, category: 'GI', presentation: '78M, sudden-onset severe abdominal pain out of proportion to exam, bloody diarrhea, atrial fibrillation, metabolic acidosis with elevated lactate.', vitals: 'BP 95/60, HR 110 irregular, Temp 37.8C', history: 'A-fib, prior embolic events', correct: 'Acute mesenteric ischemia', distractors: ['Ischemic colitis', 'Acute pancreatitis', 'Bowel obstruction'] },
  { id: 16, category: 'GI', presentation: '25F, RLQ pain that started periumbilically and migrated, rebound tenderness, positive psoas sign, WBC 14,000 with left shift.', vitals: 'BP 120/75, HR 100, Temp 38.3C', history: 'No prior surgeries', correct: 'Acute appendicitis', distractors: ['Ectopic pregnancy', 'Ovarian torsion', 'Mesenteric lymphadenitis'] },
  { id: 17, category: 'GI', presentation: '55M, painless jaundice, dark urine, clay-colored stools, palpable non-tender gallbladder (Courvoisier sign), weight loss 10kg in 2 months.', vitals: 'BP 125/80, HR 78', history: 'New-onset diabetes, smoker', correct: 'Pancreatic head carcinoma', distractors: ['Choledocholithiasis', 'Hepatitis', 'Cholangiocarcinoma'] },
  { id: 18, category: 'GI', presentation: '65F, large-volume hematemesis, spider angiomata, ascites, caput medusae, splenomegaly, thrombocytopenia.', vitals: 'BP 85/50, HR 125, SpO2 94%', history: 'Chronic alcoholism, known cirrhosis', correct: 'Esophageal variceal bleeding', distractors: ['Mallory-Weiss tear', 'Peptic ulcer hemorrhage', 'Gastric carcinoma'] },

  // Neuro (6)
  { id: 19, category: 'Neuro', presentation: '67M, sudden-onset right-sided weakness, facial droop, slurred speech, unable to lift right arm. Symptoms started 90 minutes ago. CT head negative for bleed.', vitals: 'BP 185/100, HR 88, SpO2 97%', history: 'A-fib, non-compliant with anticoagulation', correct: 'Acute ischemic stroke (MCA)', distractors: ['Hemorrhagic stroke', 'Bell palsy', 'Todd paralysis'] },
  { id: 20, category: 'Neuro', presentation: '52F, thunderclap headache ("worst of my life"), neck stiffness, photophobia, brief LOC. CT head shows blood in basal cisterns.', vitals: 'BP 170/95, HR 65, Temp 37.5C', history: 'Family history of aneurysms', correct: 'Subarachnoid hemorrhage', distractors: ['Migraine', 'Meningitis', 'Hypertensive encephalopathy'] },
  { id: 21, category: 'Neuro', presentation: '30F, ascending symmetric weakness starting in legs, areflexia, paresthesias in hands and feet. CSF shows albuminocytologic dissociation.', vitals: 'BP 110/70, HR 80, RR 22', history: 'Campylobacter gastroenteritis 2 weeks ago', correct: 'Guillain-Barre syndrome', distractors: ['Transverse myelitis', 'Myasthenia gravis', 'Multiple sclerosis'] },
  { id: 22, category: 'Neuro', presentation: '8M, generalized tonic-clonic seizure lasting 7 minutes, now postictal with confusion, fever. No prior seizure history.', vitals: 'Temp 40.1C, HR 130, SpO2 94%', history: 'Upper respiratory infection for 3 days', correct: 'Febrile seizure (complex)', distractors: ['Epilepsy', 'Meningitis', 'Encephalitis'] },
  { id: 23, category: 'Neuro', presentation: '45F, episodic vertigo with nausea lasting hours, unilateral tinnitus, fluctuating low-frequency hearing loss, aural fullness.', vitals: 'BP 120/78, HR 82', history: 'Recurrent episodes over past year', correct: 'Meniere disease', distractors: ['BPPV', 'Vestibular neuritis', 'Acoustic neuroma'] },
  { id: 24, category: 'Neuro', presentation: '72M, resting tremor in right hand (pill-rolling), cogwheel rigidity, bradykinesia, shuffling gait, masked facies.', vitals: 'BP 140/85 with orthostatic drop, HR 72', history: 'Progressive symptoms over 2 years', correct: 'Parkinson disease', distractors: ['Essential tremor', 'Lewy body dementia', 'Normal pressure hydrocephalus'] },

  // Infectious (6)
  { id: 25, category: 'Infectious', presentation: '20F, high fever, severe headache, petechial rash on trunk and extremities, neck stiffness, positive Kernig and Brudzinski signs. CSF: high WBC (neutrophils), low glucose, high protein.', vitals: 'BP 90/55, HR 130, Temp 39.8C', history: 'College student, dormitory', correct: 'Bacterial meningitis', distractors: ['Viral meningitis', 'Rocky Mountain spotted fever', 'Encephalitis'] },
  { id: 26, category: 'Infectious', presentation: '35M, cyclical fevers every 48 hours with rigors, chills, and diaphoresis. Peripheral smear shows ring-form trophozoites in RBCs.', vitals: 'Temp 40.2C during febrile episode, HR 115', history: 'Returned from sub-Saharan Africa 2 weeks ago', correct: 'Plasmodium falciparum malaria', distractors: ['Typhoid fever', 'Dengue fever', 'Leptospirosis'] },
  { id: 27, category: 'Infectious', presentation: '28M, night sweats, weight loss, chronic cough with hemoptysis, upper lobe cavitary lesion on CXR. AFB smear positive.', vitals: 'Temp 38.0C, HR 90, SpO2 95%', history: 'HIV positive, CD4 180, immigrant from high-burden country', correct: 'Pulmonary tuberculosis', distractors: ['Lung abscess', 'Histoplasmosis', 'Lung carcinoma'] },
  { id: 28, category: 'Infectious', presentation: '55F, dysuria, frequency, urgency, flank pain, CVA tenderness, pyuria with WBC casts, positive urine culture E. coli >100k.', vitals: 'BP 100/65, HR 105, Temp 39.5C', history: 'Diabetes, recurrent UTIs', correct: 'Acute pyelonephritis', distractors: ['Lower UTI (cystitis)', 'Nephrolithiasis', 'Renal abscess'] },
  { id: 29, category: 'Infectious', presentation: '40M, acute-onset watery diarrhea ("rice-water stools"), severe dehydration, sunken eyes, poor skin turgor, muscle cramps.', vitals: 'BP 70/40, HR 140, Temp 36.5C', history: 'Traveled to endemic area, drank untreated water', correct: 'Cholera', distractors: ['Shigellosis', 'C. difficile colitis', 'Norovirus'] },
  { id: 30, category: 'Infectious', presentation: '32F, sore throat, fever, posterior cervical lymphadenopathy, splenomegaly, fatigue. Blood smear shows atypical lymphocytes. Positive heterophile antibody test.', vitals: 'Temp 38.7C, HR 95', history: 'College student, recent new partner', correct: 'Infectious mononucleosis (EBV)', distractors: ['Streptococcal pharyngitis', 'CMV infection', 'Acute HIV infection'] },

  // Endocrine (6)
  { id: 31, category: 'Endocrine', presentation: '62M, polyuria, polydipsia, confusion, deep rapid breathing (Kussmaul), fruity breath odor, blood glucose 520 mg/dL, pH 7.1, anion gap 24.', vitals: 'BP 95/60, HR 120, RR 30', history: 'Known DM2, stopped insulin, recent pneumonia', correct: 'Diabetic ketoacidosis', distractors: ['Hyperosmolar hyperglycemic state', 'Lactic acidosis', 'Alcoholic ketoacidosis'] },
  { id: 32, category: 'Endocrine', presentation: '48F, weight gain, moon facies, buffalo hump, purple abdominal striae, proximal muscle weakness, easy bruising. Elevated 24h urine cortisol.', vitals: 'BP 155/95, HR 80, glucose 210', history: 'Irregular menses, depression', correct: 'Cushing syndrome', distractors: ['Metabolic syndrome', 'Hypothyroidism', 'Polycystic ovary syndrome'] },
  { id: 33, category: 'Endocrine', presentation: '35F, heat intolerance, weight loss despite increased appetite, tremor, exophthalmos, diffuse goiter with bruit, elevated T4 and suppressed TSH.', vitals: 'BP 140/60, HR 110, Temp 37.5C', history: 'Family history of autoimmune disease', correct: 'Graves disease', distractors: ['Toxic multinodular goiter', 'Thyroid storm', 'Subacute thyroiditis'] },
  { id: 34, category: 'Endocrine', presentation: '55M, episodic headaches, palpitations, diaphoresis, severe paroxysmal hypertension. 24h urine metanephrines markedly elevated.', vitals: 'BP 220/130 during episode, HR 125', history: 'MEN2A family history', correct: 'Pheochromocytoma', distractors: ['Essential hypertension', 'Panic disorder', 'Thyroid storm'] },
  { id: 35, category: 'Endocrine', presentation: '70F, fatigue, constipation, cold intolerance, weight gain, dry skin, periorbital edema, delayed DTRs, TSH markedly elevated, low free T4.', vitals: 'BP 110/75, HR 55, Temp 36.0C', history: 'History of Hashimoto thyroiditis', correct: 'Hypothyroidism', distractors: ['Depression', 'Anemia', 'Congestive heart failure'] },
  { id: 36, category: 'Endocrine', presentation: '28M, tall stature, large hands/feet, coarsened facial features, prognathism, visual field deficits, elevated IGF-1 and unsuppressible GH.', vitals: 'BP 145/90, HR 78, glucose 180', history: 'Shoe size increased 3 sizes in 5 years', correct: 'Acromegaly', distractors: ['Gigantism', 'Marfan syndrome', 'Hypothyroidism'] },
]

/* ─── helpers ─── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickScenarios(count: number): Scenario[] {
  return shuffle(ALL_SCENARIOS).slice(0, count)
}

function shuffleOptions(scenario: Scenario): string[] {
  return shuffle([scenario.correct, ...scenario.distractors])
}

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(1) + 's'
}

/* ─── styles ─── */
const glassCard = (accent?: string): React.CSSProperties => ({
  background: CARD,
  border: `1px solid ${accent ? accent + '30' : BORDER}`,
  borderRadius: RADIUS.lg,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
})

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: RADIUS.full,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
}

/* ─── component ─── */
type Phase = 'start' | 'playing' | 'feedback' | 'results'

export default function DiagnosisSprint({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('start')
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [results, setResults] = useState<RoundResult[]>([])
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hoveredOption, setHoveredOption] = useState<number | null>(null)
  const roundStartRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [scorePops, setScorePops] = useState<ScorePop[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const currentScenario = scenarios[currentIdx]

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startGame = useCallback(() => {
    sfxTap()
    const picked = pickScenarios(ROUNDS)
    setScenarios(picked)
    setCurrentIdx(0)
    setResults([])
    setOptions(shuffleOptions(picked[0]))
    setTimeLeft(TIME_LIMIT)
    setSelectedAnswer(null)
    roundStartRef.current = Date.now()
    setPhase('playing')
  }, [])

  // timer
  useEffect(() => {
    if (phase !== 'playing') return
    clearTimer()
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          // time's up — record as wrong
          clearTimer()
          handleAnswer(null)
          return 0
        }
        return prev - 100
      })
    }, 100)
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx])

  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.01) return
    const tick = () => {
      setParticles(prev => tickParticles(prev))
      setScorePops(prev => tickScorePops(prev))
      setShakeIntensity(prev => prev * 0.85)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.01])

  const handleAnswer = useCallback((answer: string | null) => {
    if (phase !== 'playing' || !currentScenario) return
    clearTimer()
    const elapsed = Date.now() - roundStartRef.current
    const isCorrect = answer === currentScenario.correct
    if (answer !== null) {
      if (isCorrect) sfxCorrect()
      else sfxWrong()
    } else {
      sfxWrong()
    }
    if (isCorrect && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      const timeBonus = Math.max(0, Math.round(((TIME_LIMIT - Math.min(elapsed, TIME_LIMIT)) / TIME_LIMIT) * 100))
      const pts = 50 + timeBonus
      setParticles(prev => [...prev, ...correctBurst(cx, cy)])
      setScorePops(prev => [...prev, createScorePop(cx, cy - 40, pts, '#00c97b')])
    }
    if (!isCorrect && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setParticles(prev => [...prev, ...wrongBurst(rect.width / 2, rect.height / 2)])
      setShakeIntensity(3)
    }
    setSelectedAnswer(answer)

    const result: RoundResult = {
      scenarioId: currentScenario.id,
      category: currentScenario.category,
      correct: isCorrect,
      timeMs: Math.min(elapsed, TIME_LIMIT),
      selectedAnswer: answer || '(timed out)',
      correctAnswer: currentScenario.correct,
    }
    setResults(prev => [...prev, result])
    setPhase('feedback')
  }, [phase, currentScenario, clearTimer])

  const nextRound = useCallback(() => {
    const nextIdx = currentIdx + 1
    if (nextIdx >= scenarios.length) {
      sfxGameOver()
      if (containerRef.current && totalCorrect / scenarios.length >= 0.75) {
        const rect = containerRef.current.getBoundingClientRect()
        setParticles(prev => [...prev, ...confettiBurst(rect.width / 2, rect.height / 3)])
      }
      setPhase('results')
      return
    }
    sfxTap()
    setCurrentIdx(nextIdx)
    setOptions(shuffleOptions(scenarios[nextIdx]))
    setTimeLeft(TIME_LIMIT)
    setSelectedAnswer(null)
    roundStartRef.current = Date.now()
    setPhase('playing')
  }, [currentIdx, scenarios])

  // score calculation
  const totalCorrect = results.filter(r => r.correct).length
  const accuracy = results.length > 0 ? Math.round((totalCorrect / results.length) * 100) : 0
  const avgTime = results.length > 0 ? results.reduce((s, r) => s + r.timeMs, 0) / results.length : 0
  const totalScore = results.reduce((s, r) => {
    if (!r.correct) return s
    const timeBonus = Math.max(0, Math.round(((TIME_LIMIT - r.timeMs) / TIME_LIMIT) * 100))
    return s + 50 + timeBonus // 50 base + up to 100 speed bonus
  }, 0)

  const categoryStats = (Object.keys(CATEGORY_COLORS) as Category[]).map(cat => {
    const catResults = results.filter(r => r.category === cat)
    if (catResults.length === 0) return null
    const catCorrect = catResults.filter(r => r.correct).length
    return {
      category: cat,
      total: catResults.length,
      correct: catCorrect,
      accuracy: Math.round((catCorrect / catResults.length) * 100),
      avgTime: catResults.reduce((s, r) => s + r.timeMs, 0) / catResults.length,
    }
  }).filter(Boolean) as { category: Category; total: number; correct: number; accuracy: number; avgTime: number }[]

  /* ─── START SCREEN ─── */
  if (phase === 'start') {
    return (
      <div ref={containerRef} style={{ minHeight: '100vh', background: BG, padding: '40px 4vw', position: 'relative', overflow: 'hidden' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 48, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: RADIUS.xl, margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: ACCENT + '18', border: `1px solid ${ACCENT}30`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 24px ${ACCENT}20`,
          }}>
            <Stethoscope size={36} color={ACCENT} />
          </div>

          <h1 style={{ color: TEXT, fontSize: 32, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Diagnosis Sprint
          </h1>
          <p style={{ color: DIM, fontSize: 14, margin: '0 0 32px', lineHeight: 1.6 }}>
            Clinical pattern recognition at speed. Read the case, pick the diagnosis, beat the clock.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
            {[
              { icon: <Target size={18} />, label: `${ROUNDS} Cases`, sub: 'Per sprint' },
              { icon: <Clock size={18} />, label: '15 Seconds', sub: 'Per case' },
              { icon: <Zap size={18} />, label: 'Speed Bonus', sub: 'Faster = more points' },
            ].map((item, i) => (
              <div key={i} style={{ ...glassCard(), padding: '16px 12px' }}>
                <div style={{ color: ACCENT, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>{item.label}</div>
                <div style={{ color: DIM, fontSize: 11, marginTop: 2 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ ...glassCard(), padding: '16px 20px', marginBottom: 32, textAlign: 'left' }}>
            <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
              Categories
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {(Object.keys(CATEGORY_COLORS) as Category[]).map(cat => (
                <span key={cat} style={{
                  ...pillStyle,
                  background: CATEGORY_COLORS[cat] + '18',
                  color: CATEGORY_COLORS[cat],
                  border: `1px solid ${CATEGORY_COLORS[cat]}25`,
                }}>
                  {CATEGORY_ICONS[cat]} {cat}
                </span>
              ))}
            </div>
          </div>

          <button onClick={startGame} style={{ ...solidBtn(ACCENT), padding: '14px 36px', fontSize: 16 }}>
            <Zap size={18} /> Start Sprint
          </button>
        </div>
      </div>
    )
  }

  /* ─── PLAYING / FEEDBACK ─── */
  if ((phase === 'playing' || phase === 'feedback') && currentScenario) {
    const timerPercent = (timeLeft / TIME_LIMIT) * 100
    const timerColor = timerPercent > 50 ? ACCENT : timerPercent > 25 ? COLOR.amber : COLOR.rose

    return (
      <div ref={containerRef} style={{ minHeight: '100vh', background: BG, padding: '40px 4vw', position: 'relative', overflow: 'hidden', ...screenShakeStyle(shakeIntensity) }}>
        {/* top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, maxWidth: 700, margin: '0 auto 24px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}
          >
            <ArrowLeft size={14} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>
              {currentIdx + 1} / {ROUNDS}
            </span>
            <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>
              {totalScore} pts
            </span>
          </div>
        </div>

        {/* progress bar */}
        <div style={{ maxWidth: 700, margin: '0 auto 20px', height: 3, background: BORDER, borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2, background: ACCENT,
            width: `${((currentIdx + (phase === 'feedback' ? 1 : 0)) / ROUNDS) * 100}%`,
            transition: `width ${MOTION.fast}`,
          }} />
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* timer bar */}
          {phase === 'playing' && (
            <div style={{ height: 4, background: BORDER, borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: timerColor,
                width: `${timerPercent}%`,
                transition: 'width 100ms linear, background 300ms ease',
                boxShadow: `0 0 8px ${timerColor}60`,
              }} />
            </div>
          )}

          {/* category + timer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{
              ...pillStyle,
              background: CATEGORY_COLORS[currentScenario.category] + '18',
              color: CATEGORY_COLORS[currentScenario.category],
              border: `1px solid ${CATEGORY_COLORS[currentScenario.category]}25`,
            }}>
              {CATEGORY_ICONS[currentScenario.category]} {currentScenario.category}
            </span>
            {phase === 'playing' && (
              <span style={{ color: timerColor, fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' as const }}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>

          {/* case card */}
          <div style={{ ...glassCard(), padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
              Clinical Presentation
            </div>
            <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.7, margin: '0 0 16px', fontWeight: 500 }}>
              {currentScenario.presentation}
            </p>
            {currentScenario.vitals && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <Activity size={14} color={COLOR.teal} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <span style={{ color: COLOR.teal, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>VITALS </span>
                  <span style={{ color: MUTED, fontSize: 13 }}>{currentScenario.vitals}</span>
                </div>
              </div>
            )}
            {currentScenario.history && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Heart size={14} color={COLOR.rose} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <span style={{ color: COLOR.rose, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>HISTORY </span>
                  <span style={{ color: MUTED, fontSize: 13 }}>{currentScenario.history}</span>
                </div>
              </div>
            )}
          </div>

          {/* options */}
          <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
            {options.map((opt, i) => {
              const isSelected = selectedAnswer === opt
              const isCorrectAnswer = opt === currentScenario.correct
              const showFeedback = phase === 'feedback'

              let optBg = CARD
              let optBorder = BORDER
              let optColor = TEXT
              let optIcon = null

              if (showFeedback) {
                if (isCorrectAnswer) {
                  optBg = ACCENT + '15'
                  optBorder = ACCENT + '50'
                  optColor = ACCENT
                  optIcon = <CheckCircle2 size={18} color={ACCENT} />
                } else if (isSelected && !isCorrectAnswer) {
                  optBg = COLOR.rose + '15'
                  optBorder = COLOR.rose + '50'
                  optColor = COLOR.rose
                  optIcon = <XCircle size={18} color={COLOR.rose} />
                }
              }

              const isHovered = hoveredOption === i && phase === 'playing'

              return (
                <button
                  key={i}
                  onClick={() => phase === 'playing' && handleAnswer(opt)}
                  onMouseEnter={() => setHoveredOption(i)}
                  onMouseLeave={() => setHoveredOption(null)}
                  disabled={phase === 'feedback'}
                  style={{
                    background: optBg,
                    border: `1px solid ${optBorder}`,
                    borderRadius: RADIUS.md,
                    padding: '14px 18px',
                    color: optColor,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: phase === 'playing' ? 'pointer' : 'default',
                    textAlign: 'left' as const,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: `all ${MOTION.fast}`,
                    boxShadow: isHovered
                      ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${ACCENT}40`
                      : 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.3)',
                    transform: isHovered ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: RADIUS.sm,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: showFeedback && isCorrectAnswer ? ACCENT + '20' : showFeedback && isSelected ? COLOR.rose + '20' : BORDER,
                    color: showFeedback && isCorrectAnswer ? ACCENT : showFeedback && isSelected ? COLOR.rose : DIM,
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>
                    {optIcon || String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                </button>
              )
            })}
          </div>

          {/* feedback footer */}
          {phase === 'feedback' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {results[results.length - 1]?.correct ? (
                  <span style={{ color: ACCENT, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} /> Correct
                  </span>
                ) : (
                  <span style={{ color: COLOR.rose, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XCircle size={16} /> Incorrect
                  </span>
                )}
                <span style={{ color: DIM, fontSize: 12 }}>
                  {formatTime(results[results.length - 1]?.timeMs || 0)}
                </span>
              </div>
              <button
                onClick={nextRound}
                style={{ ...solidBtn(ACCENT), padding: '10px 20px', fontSize: 13 }}
              >
                {currentIdx + 1 >= ROUNDS ? 'See Results' : 'Next Case'} <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
        {particles.map(p => (
          <div key={p.id} style={renderParticleStyle(p)} />
        ))}
        {scorePops.map(pop => (
          <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
        ))}
      </div>
    )
  }

  /* ─── RESULTS ─── */
  if (phase === 'results') {
    const grade =
      accuracy >= 90 ? { label: 'Outstanding', color: ACCENT, icon: <Trophy size={20} /> } :
      accuracy >= 75 ? { label: 'Strong', color: COLOR.teal, icon: <Target size={20} /> } :
      accuracy >= 60 ? { label: 'Developing', color: COLOR.amber, icon: <Brain size={20} /> } :
      { label: 'Keep Practicing', color: COLOR.rose, icon: <Flame size={20} /> }

    return (
      <div ref={containerRef} style={{ minHeight: '100vh', background: BG, padding: '40px 4vw', position: 'relative', overflow: 'hidden' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 48, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* grade banner */}
          <div style={{ ...glassCard(grade.color), padding: '28px 32px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: RADIUS.xl, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: grade.color + '18',
            }}>
              {grade.icon}
            </div>
            <h2 style={{ color: TEXT, fontSize: 26, fontWeight: 600, margin: '0 0 4px' }}>
              {grade.label}
            </h2>
            <p style={{ color: DIM, fontSize: 13, margin: 0 }}>Sprint Complete</p>
          </div>

          {/* stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Score', value: totalScore.toString(), color: COLOR.gold },
              { label: 'Accuracy', value: `${accuracy}%`, color: ACCENT },
              { label: 'Avg Time', value: formatTime(avgTime), color: COLOR.teal },
            ].map((stat, i) => (
              <div key={i} style={{ ...glassCard(), padding: '18px 14px', textAlign: 'center' }}>
                <div style={{ color: stat.color, fontSize: 24, fontWeight: 600 }}>{stat.value}</div>
                <div style={{ color: DIM, fontSize: 11, fontWeight: 600, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* summary row */}
          <div style={{ ...glassCard(), padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: MUTED, fontSize: 13 }}>
              {totalCorrect} correct out of {results.length} cases
            </span>
            <span style={{ color: DIM, fontSize: 12 }}>
              Best: {results.filter(r => r.correct).length > 0
                ? formatTime(Math.min(...results.filter(r => r.correct).map(r => r.timeMs)))
                : '--'}
            </span>
          </div>

          {/* category breakdown */}
          <div style={{ ...glassCard(), padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart3 size={16} color={MUTED} />
              <span style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                Category Breakdown
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {categoryStats.map(cs => (
                <div key={cs.category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    ...pillStyle,
                    background: CATEGORY_COLORS[cs.category] + '18',
                    color: CATEGORY_COLORS[cs.category],
                    border: `1px solid ${CATEGORY_COLORS[cs.category]}25`,
                    minWidth: 100, justifyContent: 'center',
                    fontSize: 10,
                  }}>
                    {cs.category}
                  </span>
                  <div style={{ flex: 1, height: 6, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: CATEGORY_COLORS[cs.category],
                      width: `${cs.accuracy}%`,
                      transition: `width ${MOTION.slow}`,
                    }} />
                  </div>
                  <span style={{ color: TEXT, fontSize: 13, fontWeight: 700, minWidth: 38, textAlign: 'right' as const }}>
                    {cs.correct}/{cs.total}
                  </span>
                  <span style={{ color: DIM, fontSize: 11, minWidth: 36, textAlign: 'right' as const }}>
                    {formatTime(cs.avgTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* round-by-round */}
          <div style={{ ...glassCard(), padding: '20px 24px', marginBottom: 32 }}>
            <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
              Round Details
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: r.correct ? ACCENT + '08' : COLOR.rose + '08',
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${r.correct ? ACCENT + '15' : COLOR.rose + '15'}`,
                }}>
                  <span style={{ color: DIM, fontSize: 11, fontWeight: 700, minWidth: 20 }}>#{i + 1}</span>
                  {r.correct
                    ? <CheckCircle2 size={14} color={ACCENT} />
                    : <XCircle size={14} color={COLOR.rose} />}
                  <span style={{ color: TEXT, fontSize: 12, fontWeight: 600, flex: 1 }}>{r.correctAnswer}</span>
                  <span style={{ color: DIM, fontSize: 11, fontVariantNumeric: 'tabular-nums' as const }}>{formatTime(r.timeMs)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={startGame} style={{ ...solidBtn(ACCENT), padding: '12px 28px', fontSize: 14 }}>
              <RotateCcw size={16} /> Sprint Again
            </button>
            <button onClick={onBack} style={{
              ...solidBtn(CARD), padding: '12px 28px', fontSize: 14,
              border: `1px solid ${BORDER}`, boxShadow: 'none',
            }}>
              Back to Games
            </button>
          </div>
        </div>
        {particles.map(p => (
          <div key={p.id} style={renderParticleStyle(p)} />
        ))}
        {scorePops.map(pop => (
          <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
        ))}
      </div>
    )
  }

  return null
}
