import type { LivePlayer } from '../lib/liveRoom'
import LiveKnowYouGame, { type QuizCategory, type QuizItem } from './LiveKnowYouGame'
import { QUESTIONS, CATEGORY_META, type Category } from './CouplesQuiz'

// Networked (two-device) Couples Quiz — a thin wrapper over the shared LiveKnowYouGame
// engine, feeding it the full CouplesQuiz question bank + categories. Questions don't
// reference a name, so text() ignores the subject name.

const CATS = Object.keys(QUESTIONS) as Category[]
const categories: QuizCategory[] = CATS.map(k => ({ key: k, label: CATEGORY_META[k].label, color: CATEGORY_META[k].color, desc: CATEGORY_META[k].desc }))
const bank: Record<string, QuizItem[]> = Object.fromEntries(
  CATS.map(k => [k, QUESTIONS[k].map(q => ({ key: q.q, options: q.options, text: () => q.q }))]),
)

interface Props { me: LivePlayer; code: string; isHost: boolean; onExit: () => void }

export default function CouplesQuizLive(props: Props) {
  return <LiveKnowYouGame {...props} title="Couples Quiz" gameId="couples-quiz" accent={CATEGORY_META.love_language.color} categories={categories} bank={bank} />
}
