import { PALETTE } from './brand'
import { supabase } from './kasuku-bridge'

// Mirror an earn/credit to the server-authoritative wallet (kg_wallet_earn is
// per-call capped). Fire-and-forget; no-ops when signed out or unprovisioned.
async function serverCredit(amount: number, reason: string): Promise<void> {
  try {
    if (!amount || amount <= 0) return
    const { data } = await supabase.auth.getUser()
    if (!data?.user?.id) return
    await supabase.rpc('kg_wallet_earn', { p_amount: Math.round(amount), p_reason: reason.slice(0, 120) })
  } catch { /* offline / not provisioned */ }
}

export interface TokenWallet {
  balance: number
  totalEarned: number
  totalSpent: number
  totalPurchased: number
  transactions: Transaction[]
}

export interface Transaction {
  id: string
  type: 'earn' | 'spend' | 'purchase'
  amount: number
  reason: string
  timestamp: number
}

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  category: 'avatar' | 'powerup' | 'cosmetic' | 'streak' | 'boost'
  icon: string
  color: string
  oneTime: boolean
}

export const SHOP: ShopItem[] = [
  { id: 'streak-shield', name: 'Streak Shield', description: 'Protect your streak for 1 day if you miss', price: 50, category: 'streak', icon: 'shield', color: PALETTE.amber, oneTime: false },
  { id: 'double-xp', name: '2x XP Boost', description: 'Double XP for 1 hour', price: 80, category: 'boost', icon: 'zap', color: PALETTE.gold, oneTime: false },
  { id: 'extra-life', name: 'Extra Life', description: 'Extra life in any game', price: 30, category: 'powerup', icon: 'heart', color: PALETTE.rose, oneTime: false },
  { id: 'time-freeze', name: 'Time Freeze', description: 'Freeze timer for 5 seconds', price: 40, category: 'powerup', icon: 'clock', color: PALETTE.teal, oneTime: false },
  { id: 'hint', name: 'Hint', description: 'Get a hint in puzzle games', price: 20, category: 'powerup', icon: 'lightbulb', color: PALETTE.violet, oneTime: false },
  { id: 'avatar-fire', name: 'Avatar: Fire', description: '🔥 Fire avatar', price: 200, category: 'avatar', icon: 'flame', color: PALETTE.orange, oneTime: true },
  { id: 'avatar-diamond', name: 'Avatar: Diamond', description: '💎 Diamond avatar', price: 500, category: 'avatar', icon: 'gem', color: PALETTE.cyan, oneTime: true },
  { id: 'avatar-crown', name: 'Avatar: Crown', description: '👑 Crown avatar', price: 1000, category: 'avatar', icon: 'crown', color: PALETTE.gold, oneTime: true },
  { id: 'card-glow', name: 'Card Glow', description: 'Your name glows on leaderboard', price: 300, category: 'cosmetic', icon: 'sparkles', color: PALETTE.fuchsia, oneTime: true },
  { id: 'team-banner', name: 'Team Banner', description: 'Custom team banner color', price: 400, category: 'cosmetic', icon: 'flag', color: PALETTE.sapphire, oneTime: true },
]

export const TOKEN_PACKS = [
  { id: 'pack-100', tokens: 100, price: 500, currency: 'TSh', label: 'Starter', bonus: 0 },
  { id: 'pack-500', tokens: 550, price: 2000, currency: 'TSh', label: 'Popular', bonus: 50 },
  { id: 'pack-1200', tokens: 1400, price: 5000, currency: 'TSh', label: 'Best Value', bonus: 200 },
  { id: 'pack-3000', tokens: 3600, price: 10000, currency: 'TSh', label: 'Pro', bonus: 600 },
]

export const TOKEN_EARN_RATES = {
  gameComplete: 5,
  gameWin: 10,
  dailyChallenge: 25,
  streakDay: 3,
  perfectScore: 50,
  newRecord: 20,
  firstTimeGame: 15,
  inviteFriend: 100,
  teamWin: 15,
  coupleChallenge: 10,
  weeklyTop10: 50,
  levelUp: 20,
  badgeEarned: 30,
  dailyLogin: 2,
  weeklyLogin7: 25,
}

const WALLET_KEY = 'kg_wallet'

export function loadWallet(): TokenWallet {
  try {
    const data = localStorage.getItem(WALLET_KEY)
    if (data) return JSON.parse(data)
  } catch {}
  return { balance: 0, totalEarned: 0, totalSpent: 0, totalPurchased: 0, transactions: [] }
}

export function saveWallet(wallet: TokenWallet) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
}

export function earnTokens(amount: number, reason: string): TokenWallet {
  const wallet = loadWallet()
  wallet.balance += amount
  wallet.totalEarned += amount
  wallet.transactions.unshift({
    id: `tx_${Date.now().toString(36)}`,
    type: 'earn',
    amount,
    reason,
    timestamp: Date.now(),
  })
  if (wallet.transactions.length > 200) wallet.transactions = wallet.transactions.slice(0, 200)
  saveWallet(wallet)
  void serverCredit(amount, reason)
  return wallet
}

export function spendTokens(amount: number, reason: string): TokenWallet | null {
  const wallet = loadWallet()
  if (wallet.balance < amount) return null
  wallet.balance -= amount
  wallet.totalSpent += amount
  wallet.transactions.unshift({
    id: `tx_${Date.now().toString(36)}`,
    type: 'spend',
    amount,
    reason,
    timestamp: Date.now(),
  })
  if (wallet.transactions.length > 200) wallet.transactions = wallet.transactions.slice(0, 200)
  saveWallet(wallet)
  return wallet
}

// (spendTokens above returns null on insufficient funds locally; the shop also
//  gates on the server via serverSpend so a forged local balance can't buy.)

export function purchaseTokens(amount: number, packLabel: string): TokenWallet {
  const wallet = loadWallet()
  wallet.balance += amount
  wallet.totalPurchased += amount
  wallet.transactions.unshift({
    id: `tx_${Date.now().toString(36)}`,
    type: 'purchase',
    amount,
    reason: `Purchased ${packLabel} pack`,
    timestamp: Date.now(),
  })
  if (wallet.transactions.length > 200) wallet.transactions = wallet.transactions.slice(0, 200)
  saveWallet(wallet)
  void serverCredit(amount, `Purchased ${packLabel} pack`)
  return wallet
}
