import type { LivePlayer } from '../lib/liveRoom'
import LiveKnowYouGame, { type QuizCategory, type QuizItem } from './LiveKnowYouGame'
import { QUESTIONS, CATEGORY_META, type Category } from './GuessWhat'

// Networked (two-device) Guess What — a thin wrapper over the shared LiveKnowYouGame
// engine. GuessWhat templates reference the subject via a [name] placeholder, so
// text(subjectFirstName) substitutes it (both players see the same rendered question;
// the subject just gets the "about you" framing).

const CATS = Object.keys(QUESTIONS) as Category[]
const categories: QuizCategory[] = CATS.map(k => ({ key: k, label: CATEGORY_META[k].label, color: CATEGORY_META[k].color, desc: CATEGORY_META[k].desc }))
const bank: Record<string, QuizItem[]> = Object.fromEntries(
  CATS.map(k => [k, QUESTIONS[k].map(q => ({
    key: q.template,
    options: q.options,
    text: (name: string) => q.template.replace(/\[name\]'s/g, `${name}'s`).replace(/\[name\]/g, name),
  }))]),
)

interface Props { me: LivePlayer; code: string; isHost: boolean; onExit: () => void }

export default function GuessWhatLive(props: Props) {
  return <LiveKnowYouGame {...props} title="Guess What" accent={CATEGORY_META.relationships.color} categories={categories} bank={bank} />
}
