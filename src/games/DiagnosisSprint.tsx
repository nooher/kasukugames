import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft, Stethoscope, Clock, Target, Trophy,
  ChevronRight, RotateCcw, Heart, Activity,
  CheckCircle2, XCircle, BarChart3, DollarSign,
  FileText, Zap, AlertTriangle, Lock, Unlock,
  Search, Microscope, Radio, Scan, Syringe, Thermometer
} from 'lucide-react'
import { COLOR, RADIUS, MOTION, solidBtn, SHADOW, GLASS } from '../lib/design'
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver } from '../lib/sfx'
import {
  type Particle, type ScorePop, correctBurst, wrongBurst,
  confettiBurst, tickParticles, renderParticleStyle,
  createScorePop, tickScorePops, scorePopStyle, screenShakeStyle
} from '../lib/vfx'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Difficulty = 'intern' | 'resident' | 'attending'

type TestKey =
  | 'vitals' | 'cbc' | 'cmp' | 'urinalysis' | 'cxr'
  | 'ct' | 'mri' | 'ecg' | 'blood_culture' | 'lumbar_puncture'

interface TestDef {
  key: TestKey
  label: string
  cost: number
  icon: typeof Stethoscope
}

interface PatientCase {
  id: number
  age: number
  sex: 'M' | 'F'
  chiefComplaint: string
  history: string
  testResults: Partial<Record<TestKey, string>>
  correctDiagnosis: string
  distractors: string[]
  explanation: string
  /** Harder variants for attending-level atypical presentations */
  atypicalComplaint?: string
  atypicalHistory?: string
}

interface OrderedTest {
  key: TestKey
  result: string
  cost: number
}

interface CaseResult {
  caseId: number
  correct: boolean
  timeMs: number
  moneySpent: number
  selectedDiagnosis: string
  correctDiagnosis: string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BG = '#f5f0e8'
const CARD_BG = '#ffffff'
const BORDER = '#e8e0d4'
const TEXT = '#2c2418'
const MUTED = '#8a7e6e'
const DIM = '#b5a997'
const ACCENT = '#3b7a57'
const _ACCENT_LIGHT = '#4a9468'; void _ACCENT_LIGHT
const BLUE = '#2d6a8f'
const RED = '#b54a3a'
const GOLD = '#c9a96e'

const TESTS: TestDef[] = [
  { key: 'vitals',         label: 'Basic Vitals',       cost: 50,   icon: Thermometer },
  { key: 'cbc',            label: 'Blood Panel (CBC)',   cost: 150,  icon: Microscope },
  { key: 'cmp',            label: 'Metabolic Panel',     cost: 200,  icon: Search },
  { key: 'urinalysis',     label: 'Urinalysis',          cost: 75,   icon: Syringe },
  { key: 'cxr',            label: 'Chest X-ray',         cost: 300,  icon: Scan },
  { key: 'ct',             label: 'CT Scan',             cost: 800,  icon: Radio },
  { key: 'mri',            label: 'MRI',                 cost: 1200, icon: Scan },
  { key: 'ecg',            label: 'ECG',                 cost: 200,  icon: Activity },
  { key: 'blood_culture',  label: 'Blood Culture',       cost: 250,  icon: Microscope },
  { key: 'lumbar_puncture', label: 'Lumbar Puncture',    cost: 500,  icon: Syringe },
]

const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string
  casesPerGame: number
  budget: number
  timePerCase: number
  description: string
}> = {
  intern: {
    label: 'Intern',
    casesPerGame: 5,
    budget: 5000,
    timePerCase: 90_000,
    description: 'Obvious presentations, generous budget, more time.',
  },
  resident: {
    label: 'Resident',
    casesPerGame: 6,
    budget: 5000,
    timePerCase: 60_000,
    description: 'Subtler presentations, moderate budget.',
  },
  attending: {
    label: 'Attending',
    casesPerGame: 8,
    budget: 5000,
    timePerCase: 45_000,
    description: 'Atypical presentations, tight budget, less time.',
  },
}

/* ------------------------------------------------------------------ */
/*  20 Patient Cases                                                   */
/* ------------------------------------------------------------------ */

const ALL_CASES: PatientCase[] = [
  /* 1 — Pneumonia */
  {
    id: 1, age: 68, sex: 'F',
    chiefComplaint: 'Productive cough with yellow-green sputum for 5 days, worsening shortness of breath, and fever.',
    history: 'COPD on home oxygen, 40-pack-year smoking history, flu-like symptoms 1 week ago.',
    testResults: {
      vitals: 'Temp 39.1C, HR 108, BP 128/78, RR 26, SpO2 89% on room air.',
      cbc: 'WBC 18,200 (87% neutrophils, 6% bands). Hgb 13.1, Plt 245k.',
      cmp: 'Na 137, K 3.9, Cr 1.0, BUN 18, Glucose 142. Liver function normal.',
      cxr: 'Right lower lobe consolidation with air bronchograms. No pleural effusion.',
      ct: 'Confirmed right lower lobe consolidation. No masses or PE.',
      ecg: 'Sinus tachycardia at 108. No ST changes.',
      blood_culture: 'Pending (preliminary: Gram-positive diplococci in 1/2 bottles).',
    },
    correctDiagnosis: 'Community-Acquired Pneumonia',
    distractors: ['COPD Exacerbation', 'Pulmonary Embolism', 'Lung Carcinoma', 'Tuberculosis'],
    explanation: 'Consolidation on CXR with air bronchograms, elevated WBC with left shift, productive cough and fever in an elderly patient with COPD are classic for community-acquired pneumonia. Gram-positive diplococci suggest S. pneumoniae.',
    atypicalComplaint: 'Confusion and decreased appetite for 3 days, family says she has been more lethargic.',
    atypicalHistory: 'COPD, lives alone, found lethargic by neighbor.',
  },
  /* 2 — UTI (Pyelonephritis) */
  {
    id: 2, age: 34, sex: 'F',
    chiefComplaint: 'Burning with urination, right flank pain, and fever for 2 days.',
    history: 'History of recurrent UTIs, recently completed antibiotics for cystitis 3 weeks ago. Sexually active.',
    testResults: {
      vitals: 'Temp 38.8C, HR 102, BP 118/72, RR 18, SpO2 98%.',
      cbc: 'WBC 15,800 (82% neutrophils). Hgb 12.4, Plt 310k.',
      cmp: 'Na 139, K 4.0, Cr 1.1, BUN 16. Glucose 94.',
      urinalysis: 'Positive nitrites, positive leukocyte esterase, >50 WBC/hpf, moderate bacteria, WBC casts present.',
      blood_culture: 'No growth at 24 hours.',
      ct: 'Right kidney mildly enlarged with perinephric fat stranding. No hydronephrosis or stones.',
    },
    correctDiagnosis: 'Urinary Tract Infection (Pyelonephritis)',
    distractors: ['Lower UTI (Cystitis)', 'Kidney Stones', 'Appendicitis', 'Ovarian Torsion'],
    explanation: 'WBC casts on urinalysis are pathognomonic for pyelonephritis. Flank pain, fever, elevated WBC, and positive urine with bacteria all point to upper urinary tract infection. Perinephric stranding on CT confirms renal involvement.',
  },
  /* 3 — Appendicitis */
  {
    id: 3, age: 22, sex: 'M',
    chiefComplaint: 'Abdominal pain that started around the belly button 12 hours ago, now localized to the right lower quadrant. Nausea, one episode of vomiting.',
    history: 'No prior surgeries, no medications. Ate dinner normally last night.',
    testResults: {
      vitals: 'Temp 38.2C, HR 96, BP 124/76, RR 16, SpO2 99%.',
      cbc: 'WBC 14,500 (85% neutrophils, 5% bands). Hgb 14.8, Plt 260k.',
      cmp: 'Na 140, K 4.1, Cr 0.9, BUN 14. Lipase normal. Glucose 102.',
      urinalysis: 'Trace blood, otherwise normal. No WBCs, no bacteria.',
      ct: 'Dilated appendix (11mm) with periappendiceal fat stranding and appendicolith. No free air.',
      cxr: 'Clear lungs bilaterally. No free air under diaphragm.',
    },
    correctDiagnosis: 'Acute Appendicitis',
    distractors: ['Mesenteric Lymphadenitis', 'Crohn Disease', 'Right Ureteral Stone', 'Meckel Diverticulitis'],
    explanation: 'Classic migration of periumbilical pain to RLQ (visceral to somatic), elevated WBC with left shift, and CT showing dilated appendix with fat stranding and appendicolith confirm acute appendicitis.',
    atypicalComplaint: 'Diffuse abdominal discomfort and diarrhea for one day.',
  },
  /* 4 — Myocardial Infarction */
  {
    id: 4, age: 62, sex: 'M',
    chiefComplaint: 'Crushing substernal chest pain radiating to the left arm and jaw for 45 minutes. Diaphoresis and nausea.',
    history: 'Hypertension, type 2 diabetes, hyperlipidemia, 30-pack-year smoking history. Family history of MI (father at age 55).',
    testResults: {
      vitals: 'Temp 37.0C, HR 110, BP 92/58, RR 22, SpO2 93%.',
      ecg: 'ST elevation in leads II, III, aVF (3-4mm). Reciprocal ST depression in I, aVL. Normal sinus rhythm.',
      cbc: 'WBC 11,200. Hgb 14.0, Plt 230k.',
      cmp: 'Na 138, K 4.5, Cr 1.2, BUN 22. Glucose 218. Troponin I: 8.4 ng/mL (normal <0.04).',
      cxr: 'Mild pulmonary vascular congestion. Heart size upper limits of normal.',
      ct: 'Not indicated. (No PE protocol performed.)',
    },
    correctDiagnosis: 'Acute Myocardial Infarction (STEMI)',
    distractors: ['Aortic Dissection', 'Acute Pericarditis', 'Pulmonary Embolism', 'Esophageal Rupture'],
    explanation: 'ST elevation in inferior leads (II, III, aVF) with reciprocal changes, markedly elevated troponin, classic risk factors, and hemodynamic compromise confirm an acute inferior STEMI. Requires emergent cardiac catheterization.',
    atypicalComplaint: 'Epigastric discomfort and feeling of indigestion with mild nausea for 2 hours.',
  },
  /* 5 — Stroke (Ischemic) */
  {
    id: 5, age: 71, sex: 'M',
    chiefComplaint: 'Sudden onset right-sided weakness and slurred speech. Wife says it started about 90 minutes ago while watching television.',
    history: 'Atrial fibrillation (not on anticoagulation), hypertension, prior TIA 2 years ago.',
    testResults: {
      vitals: 'Temp 37.2C, HR 88 irregular, BP 186/102, RR 16, SpO2 97%.',
      ecg: 'Atrial fibrillation with ventricular rate 88. No acute ST changes.',
      cbc: 'WBC 8,400. Hgb 13.5, Plt 195k. INR 1.0.',
      cmp: 'Na 141, K 4.2, Cr 1.0, BUN 18. Glucose 128.',
      ct: 'No acute hemorrhage. Early hypodensity in left MCA territory. Dense MCA sign on left.',
      mri: 'Acute infarct in left MCA territory involving frontal and parietal cortex. DWI-positive.',
    },
    correctDiagnosis: 'Acute Ischemic Stroke',
    distractors: ['Hemorrhagic Stroke', 'Bell Palsy', 'Hypoglycemia', 'Brain Tumor'],
    explanation: 'Acute onset focal neurological deficit (right hemiparesis, dysarthria) in a patient with atrial fibrillation is classic for cardioembolic ischemic stroke. CT rules out hemorrhage; MRI confirms acute infarction in left MCA territory within the tPA window.',
  },
  /* 6 — Diabetic Ketoacidosis */
  {
    id: 6, age: 28, sex: 'F',
    chiefComplaint: 'Nausea, vomiting, abdominal pain, and confusion. Roommate says patient has been drinking excessive water and urinating frequently for several days.',
    history: 'Type 1 diabetes, insulin pump user. Recent upper respiratory infection. Pump malfunction suspected.',
    testResults: {
      vitals: 'Temp 37.8C, HR 125, BP 98/60, RR 32 (deep, rapid — Kussmaul), SpO2 99%.',
      cbc: 'WBC 16,500 (stress response). Hgb 15.2 (hemoconcentration), Plt 280k.',
      cmp: 'Na 131, K 5.8, Cl 96, HCO3 8, BUN 32, Cr 1.6, Glucose 486 mg/dL. Anion gap: 27. pH 7.12, pCO2 18.',
      urinalysis: 'Large ketones, 3+ glucose. No WBCs or bacteria.',
      ecg: 'Sinus tachycardia at 125. Peaked T waves (hyperkalemia).',
      cxr: 'Clear lungs. No infiltrates.',
    },
    correctDiagnosis: 'Diabetic Ketoacidosis',
    distractors: ['Hyperosmolar Hyperglycemic State', 'Alcoholic Ketoacidosis', 'Lactic Acidosis', 'Sepsis'],
    explanation: 'Classic DKA triad: hyperglycemia (486), metabolic acidosis (pH 7.12, HCO3 8), and ketonuria. High anion gap (27), Kussmaul breathing, and dehydration. Type 1 diabetic with pump malfunction is a common precipitant.',
  },
  /* 7 — Bacterial Meningitis */
  {
    id: 7, age: 19, sex: 'M',
    chiefComplaint: 'Severe headache, high fever, stiff neck, and a rash that appeared a few hours ago. Photophobia and confusion.',
    history: 'College freshman living in a dormitory. Up to date on vaccines except meningococcal booster. No significant past medical history.',
    testResults: {
      vitals: 'Temp 39.6C, HR 118, BP 96/58, RR 22, SpO2 96%.',
      cbc: 'WBC 22,400 (92% neutrophils, 4% bands). Hgb 13.8, Plt 140k (dropping).',
      cmp: 'Na 134, K 4.4, Cr 1.3, BUN 24, Glucose 68 (low). Lactate 4.2.',
      lumbar_puncture: 'Opening pressure 32 cmH2O. WBC 2,200 (95% PMNs). Protein 280 mg/dL. Glucose 18 mg/dL (serum 68). Gram stain: Gram-negative diplococci.',
      blood_culture: 'Preliminary: Gram-negative diplococci (N. meningitidis).',
      ct: 'No mass lesion, no hydrocephalus. Mild meningeal enhancement.',
    },
    correctDiagnosis: 'Bacterial Meningitis',
    distractors: ['Viral Meningitis', 'Subarachnoid Hemorrhage', 'Encephalitis', 'Rocky Mountain Spotted Fever'],
    explanation: 'Classic bacterial meningitis: CSF showing high WBC (neutrophilic), very low glucose, high protein, and Gram-negative diplococci (N. meningitidis). Petechial rash with meningococcemia. College dorm setting is a risk factor.',
    atypicalComplaint: 'Confusion and irritability with a low-grade fever. No headache complaint.',
  },
  /* 8 — Pulmonary Embolism */
  {
    id: 8, age: 45, sex: 'F',
    chiefComplaint: 'Sudden onset sharp chest pain on the right side, worse with deep breaths. Shortness of breath. Mild hemoptysis.',
    history: 'Oral contraceptive use, 8-hour car trip 4 days ago. BMI 32. No prior VTE.',
    testResults: {
      vitals: 'Temp 37.4C, HR 115, BP 108/72, RR 28, SpO2 90% on room air.',
      ecg: 'Sinus tachycardia. S1Q3T3 pattern. Right axis deviation.',
      cbc: 'WBC 9,800. Hgb 13.2, Plt 265k. D-dimer: 4,200 ng/mL (markedly elevated).',
      cmp: 'Na 140, K 3.8, Cr 0.8, BUN 12. Troponin 0.18 (mildly elevated). BNP 420.',
      cxr: 'Hampton hump in right lower lobe. Westermark sign (oligemia) right lower zone.',
      ct: 'CT pulmonary angiogram: Large saddle embolus at main pulmonary artery bifurcation with extension into bilateral lower lobe arteries. RV dilation (RV/LV ratio 1.4).',
    },
    correctDiagnosis: 'Pulmonary Embolism',
    distractors: ['Pneumonia', 'Pneumothorax', 'Myocardial Infarction', 'Pleuritis'],
    explanation: 'Saddle PE with RV strain: pleuritic chest pain, tachycardia, hypoxia, S1Q3T3 on ECG, markedly elevated D-dimer, and CT confirming bilateral PE with RV dilation. OCP use and prolonged travel are major risk factors. Elevated troponin and BNP indicate RV strain (submassive PE).',
  },
  /* 9 — Cellulitis */
  {
    id: 9, age: 55, sex: 'M',
    chiefComplaint: 'Red, swollen, painful left lower leg for 3 days, getting worse. Feels warm to the touch. Mild fever.',
    history: 'Type 2 diabetes (poorly controlled, HbA1c 9.2%), peripheral edema, tinea pedis on both feet. Small cut on left shin 5 days ago.',
    testResults: {
      vitals: 'Temp 38.4C, HR 92, BP 138/84, RR 16, SpO2 98%.',
      cbc: 'WBC 13,600 (78% neutrophils). Hgb 12.8, Plt 320k.',
      cmp: 'Na 138, K 4.3, Cr 1.1, BUN 20. Glucose 248. HbA1c 9.2%.',
      blood_culture: 'No growth at 48 hours.',
      urinalysis: 'Trace glucose, otherwise normal.',
      cxr: 'Normal. No cardiopulmonary disease.',
    },
    correctDiagnosis: 'Cellulitis',
    distractors: ['Deep Vein Thrombosis', 'Necrotizing Fasciitis', 'Gout', 'Venous Stasis Dermatitis'],
    explanation: 'Unilateral spreading erythema, warmth, swelling with clear borders, fever, and leukocytosis after a skin break in a diabetic patient is classic cellulitis. Tinea pedis provides the portal of entry. Absence of crepitus, bullae, or extreme pain helps rule out necrotizing fasciitis.',
    atypicalComplaint: 'Mild redness on shin that the patient did not think was serious, presenting now with fever.',
  },
  /* 10 — Fracture (Hip) */
  {
    id: 10, age: 78, sex: 'F',
    chiefComplaint: 'Unable to bear weight on left leg after a fall in the bathroom this morning. Severe left hip pain.',
    history: 'Osteoporosis (not on treatment), prior vertebral compression fracture 3 years ago, takes calcium and vitamin D. Lives alone.',
    testResults: {
      vitals: 'Temp 36.8C, HR 88, BP 142/78, RR 16, SpO2 97%. Pain 8/10.',
      cbc: 'WBC 8,200. Hgb 11.4, Plt 210k.',
      cmp: 'Na 139, K 4.0, Cr 0.9, BUN 16. Calcium 8.8, Albumin 3.4. Glucose 105.',
      cxr: 'No acute cardiopulmonary process. Mild kyphosis.',
      ct: 'Left femoral neck fracture, displaced, Garden type III. No pelvic ring disruption.',
      ecg: 'Normal sinus rhythm. No acute changes. (Pre-operative clearance).',
    },
    correctDiagnosis: 'Hip Fracture',
    distractors: ['Hip Dislocation', 'Pelvic Fracture', 'Avascular Necrosis', 'Septic Joint'],
    explanation: 'Displaced femoral neck fracture (Garden III) in an elderly osteoporotic woman after a ground-level fall. Shortened and externally rotated limb on exam. CT confirms the fracture. Requires surgical fixation (hemiarthroplasty for displaced femoral neck fractures in elderly).',
  },
  /* 11 — Asthma Exacerbation */
  {
    id: 11, age: 24, sex: 'F',
    chiefComplaint: 'Progressively worsening shortness of breath and wheezing for the past 6 hours. Cannot speak in full sentences. Used rescue inhaler 8 times today without relief.',
    history: 'Asthma since childhood (moderate persistent), ran out of controller inhaler 2 weeks ago. Recent upper respiratory infection. Allergic to cats, was visiting a friend with cats yesterday.',
    testResults: {
      vitals: 'Temp 37.0C, HR 128, BP 130/82, RR 34, SpO2 87% on room air. Peak flow 110 L/min (predicted 420).',
      cbc: 'WBC 12,200 (8% eosinophils). Hgb 13.6, Plt 290k.',
      cmp: 'Na 140, K 3.6, Cr 0.7, BUN 10. Glucose 138. Lactate 1.8.',
      cxr: 'Hyperinflated lungs bilaterally. No consolidation, no pneumothorax.',
      ecg: 'Sinus tachycardia. Right axis deviation. No ST changes.',
      blood_culture: 'Not indicated / Not ordered.',
    },
    correctDiagnosis: 'Severe Asthma Exacerbation',
    distractors: ['Anaphylaxis', 'Pneumothorax', 'Foreign Body Aspiration', 'Heart Failure'],
    explanation: 'Severe exacerbation: peak flow <25% predicted, accessory muscle use, inability to speak in sentences, SpO2 <90%, and tachycardia. Cat allergen exposure and loss of controller medication are precipitants. Eosinophilia on CBC supports allergic/asthmatic etiology. Requires aggressive bronchodilator therapy and systemic steroids.',
  },
  /* 12 — GI Bleed (Upper) */
  {
    id: 12, age: 58, sex: 'M',
    chiefComplaint: 'Vomiting dark, coffee-ground material twice today. Black, tarry stools for 2 days. Feeling dizzy and lightheaded.',
    history: 'Daily NSAID use for chronic back pain (ibuprofen 800mg TID). Chronic alcohol use (4-5 beers daily). No prior endoscopy. H. pylori status unknown.',
    testResults: {
      vitals: 'Temp 36.9C, HR 112, BP 94/62 (orthostatic: drops 25 mmHg on standing), RR 20, SpO2 97%.',
      cbc: 'WBC 9,800. Hgb 7.2 (baseline unknown), MCV 82, Plt 195k.',
      cmp: 'Na 136, K 3.5, Cr 1.4, BUN 48 (elevated BUN/Cr ratio = 34). Glucose 118. Albumin 3.0.',
      ecg: 'Sinus tachycardia. No ST changes.',
      urinalysis: 'Concentrated, SG 1.035. Otherwise normal.',
      cxr: 'No free air. No acute process.',
    },
    correctDiagnosis: 'Upper GI Bleed',
    distractors: ['Lower GI Bleed', 'Esophageal Varices', 'Gastric Cancer', 'Aortoenteric Fistula'],
    explanation: 'Coffee-ground emesis and melena with hemodynamic instability (tachycardia, orthostatic hypotension) indicate significant upper GI hemorrhage. Elevated BUN/Cr ratio (>20) is classic for upper GI bleed (digested blood absorbed as protein). NSAID use is the most likely cause (peptic ulcer). Requires urgent endoscopy.',
  },
  /* 13 — Pancreatitis */
  {
    id: 13, age: 48, sex: 'M',
    chiefComplaint: 'Severe, constant epigastric pain radiating straight through to the back for 8 hours. Worse with eating. Nausea and vomiting.',
    history: 'Heavy alcohol use (1 pint of whiskey daily for 15 years). Prior episode of similar pain 2 years ago that resolved. No gallstone history.',
    testResults: {
      vitals: 'Temp 38.1C, HR 105, BP 115/70, RR 20, SpO2 96%.',
      cbc: 'WBC 14,800 (80% neutrophils). Hgb 14.2, Plt 240k.',
      cmp: 'Na 135, K 3.7, Cr 1.0, BUN 18. Glucose 210. Calcium 7.8 (low). AST 48, ALT 35. Lipase 1,840 U/L (normal <60). Amylase 620.',
      ct: 'Diffuse pancreatic edema with peripancreatic fat stranding and small peripancreatic fluid collection. No necrosis. No gallstones. No biliary dilation.',
      cxr: 'Small left pleural effusion. No consolidation.',
      urinalysis: 'Concentrated. No abnormalities.',
    },
    correctDiagnosis: 'Acute Pancreatitis',
    distractors: ['Peptic Ulcer Perforation', 'Cholecystitis', 'Mesenteric Ischemia', 'Abdominal Aortic Aneurysm'],
    explanation: 'Acute pancreatitis diagnosed by 2 of 3 criteria: characteristic epigastric pain radiating to back, lipase >3x upper limit of normal (1840), and CT findings of pancreatic edema. Alcohol is the cause here. Low calcium is a marker of severity (Ranson criteria).',
  },
  /* 14 — Deep Vein Thrombosis */
  {
    id: 14, age: 38, sex: 'F',
    chiefComplaint: 'Painful swelling of the left calf and thigh for 3 days, progressively worsening. Leg feels heavy and warm.',
    history: 'Started oral contraceptives 4 months ago. BMI 34. Desk job with minimal physical activity. Family history: mother had PE at age 50.',
    testResults: {
      vitals: 'Temp 37.2C, HR 82, BP 128/76, RR 14, SpO2 99%.',
      cbc: 'WBC 7,800. Hgb 13.0, Plt 275k. D-dimer: 2,800 ng/mL (elevated).',
      cmp: 'Na 140, K 4.1, Cr 0.7, BUN 12. Glucose 96. All normal.',
      ecg: 'Normal sinus rhythm. No right heart strain.',
      cxr: 'Normal.',
      ct: 'Duplex ultrasound (ordered instead): Non-compressible left common femoral and popliteal veins with echogenic thrombus. Extensive ileofemoral DVT.',
    },
    correctDiagnosis: 'Deep Vein Thrombosis',
    distractors: ['Cellulitis', 'Baker Cyst Rupture', 'Lymphedema', 'Superficial Thrombophlebitis'],
    explanation: 'Unilateral leg swelling with pain, warmth, and elevated D-dimer in a woman on OCPs with positive compression ultrasound confirms extensive ileofemoral DVT. Multiple risk factors: OCPs, obesity, sedentary lifestyle, family history. Requires anticoagulation and PE monitoring.',
  },
  /* 15 — Sepsis */
  {
    id: 15, age: 72, sex: 'M',
    chiefComplaint: 'Confusion, fever, and decreased urine output. Family says he has been increasingly lethargic over 2 days.',
    history: 'Recent hospitalization for urinary retention with Foley catheter placement 10 days ago. Type 2 diabetes, benign prostatic hyperplasia, chronic kidney disease stage 3.',
    testResults: {
      vitals: 'Temp 39.4C, HR 118, BP 82/48, RR 26, SpO2 94%. MAP 59.',
      cbc: 'WBC 24,600 (15% bands). Hgb 10.8, Plt 88k (thrombocytopenia).',
      cmp: 'Na 131, K 5.4, Cr 3.8 (baseline 1.8), BUN 62. Glucose 280. Lactate 5.6 mmol/L. Bilirubin 2.4.',
      urinalysis: 'Cloudy, foul-smelling. >100 WBC/hpf, large bacteria, positive nitrites.',
      blood_culture: '2/2 bottles positive: Gram-negative rods (E. coli, preliminary).',
      ecg: 'Sinus tachycardia. Peaked T waves.',
    },
    correctDiagnosis: 'Sepsis (Urosepsis)',
    distractors: ['Acute Kidney Injury', 'Urinary Tract Infection', 'Delirium', 'Cardiogenic Shock'],
    explanation: 'Sepsis-3 criteria met: suspected infection (catheter-associated UTI) plus SOFA score >= 2 (AKI, thrombocytopenia, altered mentation, hypotension). Lactate 5.6 indicates septic shock. Positive blood cultures with E. coli confirm urosepsis. Requires aggressive fluid resuscitation, broad-spectrum antibiotics, and vasopressors.',
  },
  /* 16 — Allergic Reaction (Anaphylaxis) */
  {
    id: 16, age: 32, sex: 'M',
    chiefComplaint: 'Difficulty breathing, swelling of lips and tongue, and a diffuse itchy rash that started 20 minutes after eating shrimp at a restaurant.',
    history: 'No known allergies prior to this episode. Ate shrimp for the first time in years. Has EpiPen prescribed for bee sting allergy but did not bring it.',
    testResults: {
      vitals: 'Temp 37.0C, HR 132, BP 78/42, RR 30, SpO2 88%. Stridor audible.',
      cbc: 'WBC 8,600 (2% eosinophils, 12% basophils — reactive). Hgb 15.8 (hemoconcentration). Plt 260k.',
      cmp: 'Na 142, K 3.8, Cr 0.8, BUN 14. Glucose 162 (stress). Tryptase 48 ng/mL (normal <11.4).',
      ecg: 'Sinus tachycardia at 132. Diffuse ST depression (demand ischemia from shock).',
      cxr: 'Hyperinflated lungs. Diffuse interstitial edema. No focal consolidation.',
      blood_culture: 'Not applicable.',
    },
    correctDiagnosis: 'Anaphylaxis',
    distractors: ['Angioedema (ACE-inhibitor)', 'Severe Asthma Attack', 'Vocal Cord Dysfunction', 'Carcinoid Syndrome'],
    explanation: 'Anaphylaxis: multi-system involvement (skin: urticaria; respiratory: stridor/bronchospasm; cardiovascular: distributive shock) with temporal relationship to allergen exposure (shrimp). Elevated tryptase confirms mast cell degranulation. Requires epinephrine IM immediately.',
  },
  /* 17 — Kidney Stones (Nephrolithiasis) */
  {
    id: 17, age: 40, sex: 'M',
    chiefComplaint: 'Sudden onset severe left flank pain radiating to the groin. Colicky, comes in waves. Unable to find a comfortable position. Nausea.',
    history: 'Prior kidney stone 5 years ago (passed spontaneously). Diet high in red meat and sodium. Drinks minimal water. Family history of kidney stones.',
    testResults: {
      vitals: 'Temp 37.1C, HR 98, BP 158/92 (pain), RR 18, SpO2 99%.',
      cbc: 'WBC 9,200 (normal differential). Hgb 15.0, Plt 280k.',
      cmp: 'Na 141, K 4.0, Cr 1.0, BUN 16. Calcium 10.4 (high normal). Uric acid 8.2 (elevated). Glucose 98.',
      urinalysis: '20-50 RBC/hpf (hematuria), no WBCs, no bacteria, pH 5.2 (acidic). No casts.',
      ct: 'Non-contrast: 7mm calculus at left ureterovesical junction with mild left hydronephrosis. No perinephric stranding.',
      cxr: 'Normal.',
    },
    correctDiagnosis: 'Kidney Stones (Nephrolithiasis)',
    distractors: ['Pyelonephritis', 'Renal Infarction', 'Abdominal Aortic Aneurysm', 'Testicular Torsion'],
    explanation: 'Classic renal colic: colicky flank-to-groin pain, hematuria on UA, and CT showing 7mm UVJ stone with hydronephrosis. Prior stone history and dietary risk factors (high protein, low fluid). At 7mm, may need urological intervention (unlikely to pass spontaneously vs stones <5mm).',
  },
  /* 18 — Gallstones (Cholecystitis) */
  {
    id: 18, age: 44, sex: 'F',
    chiefComplaint: 'Right upper quadrant pain for 12 hours, constant, worse after eating fried chicken last night. Nausea and one episode of vomiting.',
    history: 'Multipara (4 children), BMI 36, family history of gallstones. Prior episodes of RUQ pain after fatty meals that self-resolved.',
    testResults: {
      vitals: 'Temp 38.3C, HR 94, BP 136/82, RR 16, SpO2 98%.',
      cbc: 'WBC 13,400 (76% neutrophils). Hgb 12.6, Plt 300k.',
      cmp: 'Na 139, K 4.0, Cr 0.7, BUN 12. AST 52, ALT 68, Alk Phos 180, T. Bilirubin 1.8. Lipase 45 (normal).',
      ct: 'RUQ ultrasound (ordered instead): Gallbladder wall thickening (6mm), pericholecystic fluid, multiple gallstones, positive sonographic Murphy sign. CBD 4mm (normal).',
      cxr: 'Normal.',
      urinalysis: 'Normal.',
    },
    correctDiagnosis: 'Acute Cholecystitis',
    distractors: ['Biliary Colic', 'Cholangitis', 'Hepatitis', 'Peptic Ulcer Disease'],
    explanation: 'Acute cholecystitis: persistent RUQ pain (>6 hours distinguishes from biliary colic), fever, leukocytosis, and ultrasound showing gallbladder wall thickening, pericholecystic fluid, and positive Murphy sign. Classic "4 F" risk factors (female, forty, fertile, fat). Normal lipase excludes pancreatitis. Requires cholecystectomy.',
  },
  /* 19 — Heart Failure (Acute Decompensated) */
  {
    id: 19, age: 66, sex: 'M',
    chiefComplaint: 'Progressively worsening shortness of breath over 1 week, now unable to lie flat. Wakes up at night gasping for air. Legs are very swollen.',
    history: 'Known heart failure with reduced ejection fraction (EF 25%), ischemic cardiomyopathy. Ran out of furosemide 10 days ago. Ate salty foods over the holiday weekend.',
    testResults: {
      vitals: 'Temp 36.8C, HR 104, BP 162/96, RR 28, SpO2 86% on room air.',
      cbc: 'WBC 7,600. Hgb 11.8 (dilutional anemia), Plt 210k.',
      cmp: 'Na 128 (dilutional hyponatremia), K 4.8, Cr 2.0 (baseline 1.4), BUN 42. BNP 2,800 pg/mL (markedly elevated). Glucose 132.',
      ecg: 'Sinus tachycardia. Old Q waves in V1-V4. Low voltage. LBBB (old).',
      cxr: 'Cardiomegaly, bilateral pleural effusions, bilateral pulmonary edema (bat-wing pattern), cephalization of pulmonary vessels.',
      ct: 'Not indicated for decompensated HF.',
    },
    correctDiagnosis: 'Acute Decompensated Heart Failure',
    distractors: ['Pneumonia', 'COPD Exacerbation', 'Pulmonary Embolism', 'Nephrotic Syndrome'],
    explanation: 'Classic decompensated HF: orthopnea, PND, bilateral edema, elevated JVP, markedly elevated BNP (2800), CXR with pulmonary edema and cardiomegaly. Precipitant: medication non-compliance and dietary indiscretion. Dilutional hyponatremia and worsening renal function indicate volume overload.',
  },
  /* 20 — Thyroid Storm */
  {
    id: 20, age: 36, sex: 'F',
    chiefComplaint: 'High fever, racing heart, agitation, and confusion. Brought in by family who say she has been increasingly restless, sweaty, and tremulous for 2 days.',
    history: 'Known Graves disease, stopped methimazole 3 weeks ago because of side effects. Recent dental abscess treated with extraction 4 days ago.',
    testResults: {
      vitals: 'Temp 40.2C, HR 168 (atrial fibrillation with RVR), BP 170/60 (wide pulse pressure), RR 28, SpO2 95%.',
      cbc: 'WBC 14,200 (normal differential). Hgb 12.0, Plt 250k.',
      cmp: 'Na 136, K 3.4, Cr 0.9, BUN 22. Glucose 220. Calcium 11.2 (high). AST 88, ALT 72 (hepatic dysfunction). T. Bilirubin 2.1.',
      ecg: 'Atrial fibrillation with ventricular rate 168. No ST elevation. Diffuse ST depression.',
      cxr: 'Mild pulmonary edema. High-output heart failure pattern.',
      blood_culture: 'No growth at 24 hours.',
    },
    correctDiagnosis: 'Thyroid Storm',
    distractors: ['Sepsis', 'Pheochromocytoma', 'Serotonin Syndrome', 'Malignant Hyperthermia'],
    explanation: 'Thyroid storm (Burch-Wartofsky score >45): hyperthermia (40.2C), tachycardia with A-fib, altered mental status, GI/hepatic dysfunction, and precipitating event (infection/dental procedure) in a patient with known Graves who stopped antithyroid medication. Wide pulse pressure and high-output HF are characteristic. Requires PTU, beta-blockers, steroids, and iodine.',
    atypicalComplaint: 'Abdominal pain and jaundice with mild confusion, brought in by ambulance.',
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickCases(count: number): PatientCase[] {
  return shuffle(ALL_CASES).slice(0, count)
}

function buildDiagnosisOptions(c: PatientCase): string[] {
  return shuffle([c.correctDiagnosis, ...c.distractors])
}

function formatMoney(n: number): string {
  return '$' + n.toLocaleString()
}

function formatTimer(ms: number): string {
  const s = Math.ceil(ms / 1000)
  return s + 's'
}

/* ------------------------------------------------------------------ */
/*  Style helpers                                                      */
/* ------------------------------------------------------------------ */

const cardStyle = (accent?: string): React.CSSProperties => ({
  background: CARD_BG,
  border: `1px solid ${accent ? accent + '30' : BORDER}`,
  borderRadius: 20,
  boxShadow: [GLASS.highlight, GLASS.edge, SHADOW.md].join(', '),
})

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 12px',
  borderRadius: RADIUS.full,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type Phase = 'menu' | 'playing' | 'review' | 'results'

export default function DiagnosisSprint({
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
  /* state */
  const [phase, setPhase] = useState<Phase>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('resident')
  const [cases, setCases] = useState<PatientCase[]>([])
  const [caseIdx, setCaseIdx] = useState(0)
  const [budget, setBudget] = useState(5000)
  const [orderedTests, setOrderedTests] = useState<OrderedTest[]>([])
  const [diagnosisOptions, setDiagnosisOptions] = useState<string[]>([])
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null)
  const [caseResults, setCaseResults] = useState<CaseResult[]>([])
  const [timeLeft, setTimeLeft] = useState(60_000)
  const [score, setScore] = useState(0)
  const [hoveredOption, setHoveredOption] = useState<number | null>(null)
  const [hoveredTest, setHoveredTest] = useState<TestKey | null>(null)
  const [showDiagnosePanel, setShowDiagnosePanel] = useState(false)

  /* refs */
  const roundStartRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const moneySpentThisCaseRef = useRef(0)

  /* vfx */
  const [particles, setParticles] = useState<Particle[]>([])
  const [scorePops, setScorePops] = useState<ScorePop[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)

  const config = DIFFICULTY_CONFIG[difficulty]
  const currentCase = cases[caseIdx]

  /* ---- timer ---- */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /* ---- start game ---- */
  const startGame = useCallback(() => {
    sfxTap()
    const picked = pickCases(config.casesPerGame)
    setCases(picked)
    setCaseIdx(0)
    setBudget(config.budget)
    setOrderedTests([])
    setDiagnosisOptions(buildDiagnosisOptions(picked[0]))
    setTimeLeft(config.timePerCase)
    setSelectedDiagnosis(null)
    setCaseResults([])
    setScore(0)
    setShowDiagnosePanel(false)
    moneySpentThisCaseRef.current = 0
    roundStartRef.current = Date.now()
    setPhase('playing')
  }, [config])

  /* ---- order a test ---- */
  const orderTest = useCallback((test: TestDef) => {
    if (phase !== 'playing' || !currentCase) return
    if (orderedTests.some(t => t.key === test.key)) return
    if (budget < test.cost) return
    sfxTap()
    const result = currentCase.testResults[test.key]
    if (!result) return
    setBudget(prev => prev - test.cost)
    moneySpentThisCaseRef.current += test.cost
    setOrderedTests(prev => [...prev, { key: test.key, result, cost: test.cost }])
  }, [phase, currentCase, orderedTests, budget])

  /* ---- submit diagnosis ---- */
  const submitDiagnosis = useCallback((diagnosis: string) => {
    if (phase !== 'playing' || !currentCase) return
    clearTimer()
    const elapsed = Date.now() - roundStartRef.current
    const isCorrect = diagnosis === currentCase.correctDiagnosis

    if (isCorrect) sfxCorrect()
    else sfxWrong()

    /* scoring */
    let pts = 0
    if (isCorrect) {
      pts += 500
      /* efficiency bonus: up to 300 pts based on budget saved this case */
      const maxBudgetPerCase = config.budget / config.casesPerGame
      const saved = Math.max(0, maxBudgetPerCase - moneySpentThisCaseRef.current)
      const efficiencyBonus = Math.round((saved / maxBudgetPerCase) * 300)
      pts += efficiencyBonus
      /* speed bonus: up to 200 pts */
      const timeRatio = Math.max(0, (config.timePerCase - elapsed) / config.timePerCase)
      const speedBonus = Math.round(timeRatio * 200)
      pts += speedBonus
    } else {
      pts = -100
    }
    setScore(prev => Math.max(0, prev + pts))

    /* vfx */
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 3
      if (isCorrect) {
        setParticles(prev => [...prev, ...correctBurst(cx, cy)])
        setScorePops(prev => [...prev, createScorePop(cx, cy - 40, pts, ACCENT)])
      } else {
        setParticles(prev => [...prev, ...wrongBurst(cx, cy)])
        setShakeIntensity(3)
        setScorePops(prev => [...prev, createScorePop(cx, cy - 40, pts, RED)])
      }
    }

    setSelectedDiagnosis(diagnosis)
    setCaseResults(prev => [...prev, {
      caseId: currentCase.id,
      correct: isCorrect,
      timeMs: Math.min(elapsed, config.timePerCase),
      moneySpent: moneySpentThisCaseRef.current,
      selectedDiagnosis: diagnosis,
      correctDiagnosis: currentCase.correctDiagnosis,
    }])
    setPhase('review')
  }, [phase, currentCase, clearTimer, config])

  /* ---- time's up ---- */
  const handleTimeUp = useCallback(() => {
    if (phase !== 'playing' || !currentCase) return
    clearTimer()
    sfxWrong()
    const elapsed = config.timePerCase
    setScore(prev => Math.max(0, prev - 100))
    setSelectedDiagnosis(null)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setParticles(prev => [...prev, ...wrongBurst(rect.width / 2, rect.height / 3)])
      setShakeIntensity(3)
    }
    setCaseResults(prev => [...prev, {
      caseId: currentCase.id,
      correct: false,
      timeMs: elapsed,
      moneySpent: moneySpentThisCaseRef.current,
      selectedDiagnosis: '(Time expired)',
      correctDiagnosis: currentCase.correctDiagnosis,
    }])
    setPhase('review')
  }, [phase, currentCase, clearTimer, config])

  /* ---- next case ---- */
  const nextCase = useCallback(() => {
    const nextIdx = caseIdx + 1
    if (nextIdx >= cases.length) {
      sfxGameOver()
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const correctCount = caseResults.filter(r => r.correct).length + 0 // already in caseResults
        if (correctCount / cases.length >= 0.5) {
          setParticles(prev => [...prev, ...confettiBurst(rect.width / 2, rect.height / 3)])
        }
      }
      setPhase('results')
      return
    }
    sfxTap()
    setCaseIdx(nextIdx)
    setOrderedTests([])
    setDiagnosisOptions(buildDiagnosisOptions(cases[nextIdx]))
    setTimeLeft(config.timePerCase)
    setSelectedDiagnosis(null)
    setShowDiagnosePanel(false)
    moneySpentThisCaseRef.current = 0
    roundStartRef.current = Date.now()
    setPhase('playing')
  }, [caseIdx, cases, caseResults, config])

  /* ---- effects ---- */

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    clearTimer()
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          clearTimer()
          setTimeout(() => handleTimeUp(), 0)
          return 0
        }
        return prev - 100
      })
    }, 100)
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, caseIdx])

  // Particle animation loop
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

  // Report score on results
  useEffect(() => {
    if (phase === 'results') {
      const totalMs = caseResults.reduce((s, r) => s + r.timeMs, 0)
      const correctCount = caseResults.filter(r => r.correct).length
      const diffLevel = difficulty === 'intern' ? 1 : difficulty === 'resident' ? 2 : 3
      onGameEnd?.({
        score,
        accuracy: caseResults.length > 0 ? correctCount / caseResults.length : 0,
        level: diffLevel,
        maxScore: cases.length * 1000,
        timeMs: totalMs,
      })
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- derived ---- */
  const totalCorrect = caseResults.filter(r => r.correct).length
  const accuracy = caseResults.length > 0 ? Math.round((totalCorrect / caseResults.length) * 100) : 0
  const avgTime = caseResults.length > 0 ? caseResults.reduce((s, r) => s + r.timeMs, 0) / caseResults.length : 0
  const totalSpent = caseResults.reduce((s, r) => s + r.moneySpent, 0)

  /* ================================================================ */
  /*  MENU SCREEN                                                      */
  /* ================================================================ */
  if (phase === 'menu') {
    return (
      <div ref={containerRef} style={{ minHeight: '100vh', background: BG, padding: '40px 4vw', position: 'relative', overflow: 'hidden' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 48, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          {/* icon */}
          <div style={{
            width: 80, height: 80, borderRadius: RADIUS.xl, margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: ACCENT + '18', border: `1px solid ${ACCENT}30`,
            boxShadow: SHADOW.glow(ACCENT),
          }}>
            <Stethoscope size={36} color={ACCENT} />
          </div>

          <h1 style={{ color: TEXT, fontSize: 32, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Diagnosis Sprint
          </h1>
          <p style={{ color: MUTED, fontSize: 14, margin: '0 0 36px', lineHeight: 1.6 }}>
            You are the doctor. Read the patient case, order diagnostic tests within your budget,
            interpret the results, and make the correct diagnosis before time runs out.
          </p>

          {/* how it works */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[
              { icon: <FileText size={18} />, label: 'Read Case', sub: 'Patient presentation' },
              { icon: <Search size={18} />, label: 'Order Tests', sub: 'Spend wisely' },
              { icon: <Target size={18} />, label: 'Diagnose', sub: 'Pick the answer' },
            ].map((item, i) => (
              <div key={i} style={{ ...cardStyle(), padding: '16px 12px' }}>
                <div style={{ color: ACCENT, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                <div style={{ color: DIM, fontSize: 11, marginTop: 2 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* difficulty selection */}
          <div style={{ ...cardStyle(), padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ color: MUTED, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
              Select Difficulty
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => {
                const cfg = DIFFICULTY_CONFIG[d]
                const isSelected = difficulty === d
                return (
                  <button
                    key={d}
                    onClick={() => { sfxTap(); setDifficulty(d) }}
                    style={{
                      background: isSelected ? ACCENT + '12' : 'transparent',
                      border: `1.5px solid ${isSelected ? ACCENT : BORDER}`,
                      borderRadius: RADIUS.md,
                      padding: '14px 18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: 'left' as const,
                      transition: `all ${MOTION.fast}`,
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: RADIUS.full,
                      border: `2px solid ${isSelected ? ACCENT : DIM}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && <div style={{ width: 10, height: 10, borderRadius: RADIUS.full, background: ACCENT }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{cfg.label}</div>
                      <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{cfg.description}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                      <div style={{ color: DIM, fontSize: 11 }}>{cfg.casesPerGame} cases</div>
                      <div style={{ color: DIM, fontSize: 11 }}>{cfg.timePerCase / 1000}s each</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* budget info */}
          <div style={{ ...cardStyle(), padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} color={ACCENT} />
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>Starting Budget</span>
            </div>
            <span style={{ color: ACCENT, fontSize: 18, fontWeight: 700, ...({ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties) }}>
              {formatMoney(config.budget)}
            </span>
          </div>

          <button onClick={startGame} style={{ ...solidBtn(ACCENT), padding: '14px 36px', fontSize: 16 }}>
            <Zap size={18} /> Begin Sprint
          </button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  PLAYING / REVIEW                                                 */
  /* ================================================================ */
  if ((phase === 'playing' || phase === 'review') && currentCase) {
    const timerPercent = (timeLeft / config.timePerCase) * 100
    const timerColor = timerPercent > 50 ? ACCENT : timerPercent > 25 ? GOLD : RED
    const budgetPercent = (budget / config.budget) * 100
    const budgetColor = budgetPercent > 50 ? ACCENT : budgetPercent > 25 ? GOLD : RED

    /* build patient display - use atypical for attending */
    const complaint = difficulty === 'attending' && currentCase.atypicalComplaint
      ? currentCase.atypicalComplaint
      : currentCase.chiefComplaint
    const history = difficulty === 'attending' && currentCase.atypicalHistory
      ? currentCase.atypicalHistory
      : currentCase.history

    /* which tests are available for this case */
    const availableTests = TESTS.filter(t => currentCase.testResults[t.key] !== undefined)

    return (
      <div ref={containerRef} style={{
        minHeight: '100vh', background: BG, padding: '24px 4vw 40px',
        position: 'relative', overflow: 'hidden',
        ...screenShakeStyle(shakeIntensity),
      }}>
        {/* ─── HUD ─── */}
        <div style={{
          maxWidth: 900, margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap' as const, gap: 10,
        }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}
          >
            <ArrowLeft size={14} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
            {/* difficulty badge */}
            <span style={{
              ...pillStyle,
              background: BLUE + '15',
              color: BLUE,
              border: `1px solid ${BLUE}25`,
            }}>
              {config.label}
            </span>

            {/* case counter */}
            <span style={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>
              Case {caseIdx + 1}/{cases.length}
            </span>

            {/* budget */}
            <span style={{
              ...pillStyle,
              background: budgetColor + '15',
              color: budgetColor,
              border: `1px solid ${budgetColor}25`,
            }}>
              <DollarSign size={12} /> {formatMoney(budget)}
            </span>

            {/* score */}
            <span style={{ color: TEXT, fontSize: 14, fontWeight: 700, ...({ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties) }}>
              {score} pts
            </span>
          </div>
        </div>

        {/* ─── progress bar ─── */}
        <div style={{ maxWidth: 900, margin: '0 auto 12px', height: 3, background: BORDER, borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2, background: ACCENT,
            width: `${((caseIdx + (phase === 'review' ? 1 : 0)) / cases.length) * 100}%`,
            transition: `width ${MOTION.fast}`,
          }} />
        </div>

        {/* ─── timer bar ─── */}
        {phase === 'playing' && (
          <div style={{ maxWidth: 900, margin: '0 auto 16px', height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: timerColor,
              width: `${timerPercent}%`,
              transition: 'width 100ms linear, background 300ms ease',
              boxShadow: timerPercent < 25 ? `0 0 8px ${timerColor}60` : 'none',
            }} />
          </div>
        )}

        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* ─── timer display ─── */}
          {phase === 'playing' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <span style={{
                color: timerColor,
                fontSize: 15,
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
                ...({ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties),
              }}>
                <Clock size={14} /> {formatTimer(timeLeft)}
              </span>
            </div>
          )}

          {/* ─── two-column layout ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
            {/* LEFT: patient case + test results */}
            <div>
              {/* patient header */}
              <div style={{ ...cardStyle(), padding: '20px 24px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: RADIUS.full,
                    background: BLUE + '15', border: `1px solid ${BLUE}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: BLUE, fontSize: 14, fontWeight: 700,
                  }}>
                    {currentCase.age}{currentCase.sex}
                  </div>
                  <div>
                    <div style={{ color: TEXT, fontSize: 15, fontWeight: 600 }}>
                      Patient: {currentCase.age}-year-old {currentCase.sex === 'M' ? 'male' : 'female'}
                    </div>
                    <div style={{ color: MUTED, fontSize: 11, marginTop: 1 }}>
                      Emergency Department Presentation
                    </div>
                  </div>
                </div>

                <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  Chief Complaint
                </div>
                <p style={{ color: TEXT, fontSize: 14, lineHeight: 1.65, margin: '0 0 14px', fontWeight: 500 }}>
                  {complaint}
                </p>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Heart size={14} color={COLOR.rose} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <span style={{ color: COLOR.rose, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>HISTORY </span>
                    <span style={{ color: MUTED, fontSize: 13 }}>{history}</span>
                  </div>
                </div>
              </div>

              {/* ordered test results */}
              {orderedTests.length > 0 && (
                <div style={{ ...cardStyle(), padding: '16px 20px', marginBottom: 12 }}>
                  <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Test Results ({orderedTests.length} ordered)
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {orderedTests.map(t => {
                      const def = TESTS.find(td => td.key === t.key)!
                      return (
                        <div key={t.key} style={{
                          padding: '12px 14px',
                          background: BG,
                          borderRadius: RADIUS.sm,
                          border: `1px solid ${BORDER}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: BLUE, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <def.icon size={13} /> {def.label}
                            </span>
                            <span style={{ color: DIM, fontSize: 11 }}>{formatMoney(t.cost)}</span>
                          </div>
                          <p style={{ color: TEXT, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                            {t.result}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* medical explanation in review */}
              {phase === 'review' && (
                <div style={{
                  ...cardStyle(selectedDiagnosis === currentCase.correctDiagnosis ? ACCENT : RED),
                  padding: '18px 22px', marginBottom: 12,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                    color: selectedDiagnosis === currentCase.correctDiagnosis ? ACCENT : RED,
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {selectedDiagnosis === currentCase.correctDiagnosis
                      ? <><CheckCircle2 size={18} /> Correct Diagnosis</>
                      : <><XCircle size={18} /> Incorrect</>
                    }
                  </div>
                  {selectedDiagnosis !== currentCase.correctDiagnosis && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>Your answer: </span>
                      <span style={{ color: RED, fontSize: 13 }}>{selectedDiagnosis || '(Time expired)'}</span>
                      <br />
                      <span style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>Correct answer: </span>
                      <span style={{ color: ACCENT, fontSize: 13, fontWeight: 600 }}>{currentCase.correctDiagnosis}</span>
                    </div>
                  )}
                  <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                    Explanation
                  </div>
                  <p style={{ color: TEXT, fontSize: 13, lineHeight: 1.65, margin: 0 }}>
                    {currentCase.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: test ordering panel / diagnosis panel */}
            <div>
              {phase === 'playing' && !showDiagnosePanel && (
                <div style={{ ...cardStyle(), padding: '16px 18px', marginBottom: 12 }}>
                  <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Order Diagnostic Tests
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {availableTests.map(test => {
                      const ordered = orderedTests.some(t => t.key === test.key)
                      const canAfford = budget >= test.cost
                      const isHovered = hoveredTest === test.key && !ordered
                      return (
                        <button
                          key={test.key}
                          onClick={() => orderTest(test)}
                          onMouseEnter={() => setHoveredTest(test.key)}
                          onMouseLeave={() => setHoveredTest(null)}
                          disabled={ordered || !canAfford}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px',
                            background: ordered ? ACCENT + '08' : isHovered ? ACCENT + '06' : 'transparent',
                            border: `1px solid ${ordered ? ACCENT + '30' : BORDER}`,
                            borderRadius: RADIUS.sm,
                            cursor: ordered || !canAfford ? 'default' : 'pointer',
                            opacity: !canAfford && !ordered ? 0.4 : 1,
                            transition: `all ${MOTION.fast}`,
                            textAlign: 'left' as const,
                          }}
                        >
                          {ordered
                            ? <CheckCircle2 size={14} color={ACCENT} />
                            : canAfford
                              ? <Unlock size={14} color={MUTED} />
                              : <Lock size={14} color={DIM} />
                          }
                          <span style={{ flex: 1, color: ordered ? ACCENT : TEXT, fontSize: 12, fontWeight: 600 }}>
                            {test.label}
                          </span>
                          <span style={{ color: ordered ? ACCENT : MUTED, fontSize: 11, fontWeight: 600, ...({ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties) }}>
                            {formatMoney(test.cost)}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 14, padding: '10px 0 0', borderTop: `1px solid ${BORDER}` }}>
                    <button
                      onClick={() => setShowDiagnosePanel(true)}
                      style={{ ...solidBtn(BLUE), padding: '10px 20px', fontSize: 13, width: '100%', justifyContent: 'center' }}
                    >
                      <Target size={16} /> Ready to Diagnose
                    </button>
                  </div>
                </div>
              )}

              {/* Diagnosis panel */}
              {(phase === 'playing' && showDiagnosePanel) && (
                <div style={{ ...cardStyle(BLUE), padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ color: BLUE, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                      Select Your Diagnosis
                    </div>
                    <button
                      onClick={() => setShowDiagnosePanel(false)}
                      style={{
                        background: 'none', border: `1px solid ${BORDER}`,
                        borderRadius: RADIUS.sm, padding: '4px 10px',
                        color: MUTED, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Back to tests
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {diagnosisOptions.map((opt, i) => {
                      const isHovered = hoveredOption === i
                      return (
                        <button
                          key={i}
                          onClick={() => submitDiagnosis(opt)}
                          onMouseEnter={() => setHoveredOption(i)}
                          onMouseLeave={() => setHoveredOption(null)}
                          style={{
                            background: isHovered ? ACCENT + '08' : CARD_BG,
                            border: `1.5px solid ${isHovered ? ACCENT : BORDER}`,
                            borderRadius: RADIUS.md,
                            padding: '12px 14px',
                            color: TEXT,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left' as const,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            transition: `all ${MOTION.fast}`,
                            transform: isHovered ? 'translateY(-1px)' : 'none',
                            boxShadow: isHovered ? SHADOW.md : 'none',
                          }}
                        >
                          <span style={{
                            width: 24, height: 24, borderRadius: RADIUS.sm,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isHovered ? ACCENT + '15' : BG,
                            color: isHovered ? ACCENT : MUTED,
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span style={{ flex: 1 }}>{opt}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* review diagnosis options (show which was correct) */}
              {phase === 'review' && (
                <div style={{ ...cardStyle(), padding: '16px 18px', marginBottom: 12 }}>
                  <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Diagnosis Options
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {diagnosisOptions.map((opt, i) => {
                      const isCorrectAnswer = opt === currentCase.correctDiagnosis
                      const isSelected = opt === selectedDiagnosis

                      let bg = 'transparent'
                      let border = BORDER
                      let color = TEXT
                      let icon = null

                      if (isCorrectAnswer) {
                        bg = ACCENT + '10'
                        border = ACCENT + '40'
                        color = ACCENT
                        icon = <CheckCircle2 size={16} color={ACCENT} />
                      } else if (isSelected && !isCorrectAnswer) {
                        bg = RED + '10'
                        border = RED + '40'
                        color = RED
                        icon = <XCircle size={16} color={RED} />
                      }

                      return (
                        <div key={i} style={{
                          background: bg,
                          border: `1.5px solid ${border}`,
                          borderRadius: RADIUS.md,
                          padding: '12px 14px',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: RADIUS.sm,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isCorrectAnswer ? ACCENT + '15' : isSelected ? RED + '15' : BG,
                            color: isCorrectAnswer ? ACCENT : isSelected ? RED : MUTED,
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>
                            {icon || String.fromCharCode(65 + i)}
                          </span>
                          <span style={{ flex: 1, color, fontSize: 13, fontWeight: 600 }}>{opt}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 14, padding: '10px 0 0', borderTop: `1px solid ${BORDER}` }}>
                    <button
                      onClick={nextCase}
                      style={{ ...solidBtn(ACCENT), padding: '10px 20px', fontSize: 13, width: '100%', justifyContent: 'center' }}
                    >
                      {caseIdx + 1 >= cases.length ? 'See Results' : 'Next Case'} <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* budget bar (always visible on right) */}
              <div style={{ ...cardStyle(), padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                    Budget Remaining
                  </span>
                  <span style={{ color: budgetColor, fontSize: 16, fontWeight: 700, ...({ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties) }}>
                    {formatMoney(budget)}
                  </span>
                </div>
                <div style={{ height: 6, background: BG, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: budgetColor,
                    width: `${budgetPercent}%`,
                    transition: `width ${MOTION.fast}, background ${MOTION.fast}`,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ color: DIM, fontSize: 10 }}>Spent this case: {formatMoney(moneySpentThisCaseRef.current)}</span>
                  <span style={{ color: DIM, fontSize: 10 }}>of {formatMoney(config.budget)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* particles */}
        {particles.map(p => (
          <div key={p.id} style={renderParticleStyle(p)} />
        ))}
        {scorePops.map(pop => (
          <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
        ))}
      </div>
    )
  }

  /* ================================================================ */
  /*  RESULTS SCREEN                                                   */
  /* ================================================================ */
  if (phase === 'results') {
    const grade =
      accuracy >= 90 ? { label: 'Attending-Grade', color: ACCENT, icon: <Trophy size={20} color={ACCENT} /> } :
      accuracy >= 70 ? { label: 'Resident-Level', color: BLUE, icon: <Target size={20} color={BLUE} /> } :
      accuracy >= 50 ? { label: 'Intern-Level', color: GOLD, icon: <Stethoscope size={20} color={GOLD} /> } :
      { label: 'Needs Improvement', color: RED, icon: <AlertTriangle size={20} color={RED} /> }

    return (
      <div ref={containerRef} style={{ minHeight: '100vh', background: BG, padding: '40px 4vw', position: 'relative', overflow: 'hidden' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 48, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* grade banner */}
          <div style={{ ...cardStyle(grade.color), padding: '28px 32px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: RADIUS.xl, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: grade.color + '15',
            }}>
              {grade.icon}
            </div>
            <h2 style={{ color: TEXT, fontSize: 26, fontWeight: 600, margin: '0 0 4px' }}>
              {grade.label}
            </h2>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>
              Sprint Complete -- {config.label} Difficulty
            </p>
          </div>

          {/* stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Score', value: score.toString(), color: GOLD },
              { label: 'Accuracy', value: `${accuracy}%`, color: ACCENT },
              { label: 'Avg Time', value: formatTimer(avgTime), color: BLUE },
              { label: 'Budget Used', value: formatMoney(totalSpent), color: COLOR.rose },
            ].map((stat, i) => (
              <div key={i} style={{ ...cardStyle(), padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ color: stat.color, fontSize: 22, fontWeight: 600 }}>{stat.value}</div>
                <div style={{ color: DIM, fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* summary */}
          <div style={{ ...cardStyle(), padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: MUTED, fontSize: 13 }}>
              {totalCorrect} correct out of {caseResults.length} cases
            </span>
            <span style={{ color: DIM, fontSize: 12 }}>
              Budget remaining: {formatMoney(budget)}
            </span>
          </div>

          {/* case-by-case breakdown */}
          <div style={{ ...cardStyle(), padding: '20px 24px', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart3 size={16} color={MUTED} />
              <span style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                Case Results
              </span>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {caseResults.map((r, i) => {
                const _cd = ALL_CASES.find(c => c.id === r.caseId); void _cd
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: r.correct ? ACCENT + '06' : RED + '06',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${r.correct ? ACCENT + '15' : RED + '15'}`,
                  }}>
                    <span style={{ color: DIM, fontSize: 11, fontWeight: 700, minWidth: 18 }}>#{i + 1}</span>
                    {r.correct
                      ? <CheckCircle2 size={14} color={ACCENT} />
                      : <XCircle size={14} color={RED} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.correctDiagnosis}
                      </div>
                      {!r.correct && (
                        <div style={{ color: RED, fontSize: 10, marginTop: 1 }}>
                          You chose: {r.selectedDiagnosis}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                      <div style={{ color: DIM, fontSize: 11, ...({ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties) }}>
                        {formatTimer(r.timeMs)}
                      </div>
                      <div style={{ color: DIM, fontSize: 10 }}>
                        {formatMoney(r.moneySpent)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={startGame} style={{ ...solidBtn(ACCENT), padding: '12px 28px', fontSize: 14 }}>
              <RotateCcw size={16} /> Sprint Again
            </button>
            <button onClick={() => setPhase('menu')} style={{
              ...solidBtn(CARD_BG), padding: '12px 28px', fontSize: 14, color: TEXT,
              border: `1px solid ${BORDER}`, boxShadow: SHADOW.sm,
            }}>
              Change Difficulty
            </button>
            <button onClick={onBack} style={{
              ...solidBtn(CARD_BG), padding: '12px 28px', fontSize: 14, color: TEXT,
              border: `1px solid ${BORDER}`, boxShadow: SHADOW.sm,
            }}>
              Back to Games
            </button>
          </div>
        </div>

        {/* particles */}
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
