export type Lang = 'en' | 'sw'

const LANG_KEY = 'kg_lang'

let currentLang: Lang | null = null

export function loadLang(): Lang {
  if (currentLang) return currentLang
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'en' || stored === 'sw') {
      currentLang = stored
      return stored
    }
  } catch { /* ignore */ }
  currentLang = 'en'
  return 'en'
}

export function saveLang(lang: Lang) {
  currentLang = lang
  localStorage.setItem(LANG_KEY, lang)
}

export function t(key: string): string {
  const lang = loadLang()
  const entry = TRANSLATIONS[key]
  if (!entry) return key
  return entry[lang] || entry.en || key
}

export const TRANSLATIONS: Record<string, Record<Lang, string>> = {
  olympics_of_the_mind: { en: 'Olympics of the Mind', sw: 'Olimpiki ya Akili' },
  train_compete_transcend: { en: 'Train. Compete. Transcend.', sw: 'Jizoeze. Shindana. Vuuka.' },
  disciplines: { en: 'Disciplines', sw: 'Fani' },
  cognitive_targets: { en: 'Cognitive Targets', sw: 'Malengo ya Ubongo' },
  infinite_potential: { en: 'Infinite Potential', sw: 'Uwezo Usio na Mwisho' },
  daily: { en: 'Daily', sw: 'Kila Siku' },
  ranks: { en: 'Ranks', sw: 'Daraja' },
  people: { en: 'People', sw: 'Watu' },
  shop: { en: 'Shop', sw: 'Duka' },
  daily_challenges: { en: 'Daily Challenges', sw: 'Changamoto za Leo' },
  sign_in: { en: 'Sign In', sw: 'Ingia' },
  sign_up: { en: 'Sign Up', sw: 'Jisajili' },
  join_kasukugames: { en: 'Join KasukuGames', sw: 'Jiunge na KasukuGames' },
  username: { en: 'Username', sw: 'Jina la Mtumiaji' },
  password: { en: 'Password', sw: 'Nenosiri' },
  display_name: { en: 'Display Name', sw: 'Jina la Kuonyesha' },
  display_name_optional: { en: 'Display Name (optional)', sw: 'Jina la Kuonyesha (si lazima)' },
  shared_login: { en: 'Shared login with Kasuku & Muhuri', sw: 'Akaunti ya pamoja na Kasuku & Muhuri' },
  search_placeholder: { en: 'Search games, cognitive targets...', sw: 'Tafuta mchezo, cognitive target...' },
  all: { en: 'All', sw: 'Zote' },
  leaderboard: { en: 'Leaderboard', sw: 'Ubao wa Washindi' },
  notifications: { en: 'Notifications', sw: 'Arifa' },
  no_notifications: { en: 'No new notifications', sw: 'Hakuna arifa mpya' },
  profile: { en: 'Profile', sw: 'Wasifu' },
  teams_friends: { en: 'Teams & Friends', sw: 'Timu & Marafiki' },
  your_people: { en: 'Your People', sw: 'Watu Wako' },
  add: { en: 'Add', sw: 'Ongeza' },
  add_person: { en: 'Add Person', sw: 'Ongeza Mtu' },
  relationship: { en: 'Relationship', sw: 'Uhusiano' },
  contact_method: { en: 'Contact Method', sw: 'Njia ya Kuwafikia' },
  share_photo: { en: 'Share your profile photo on invites', sw: 'Shiriki picha yako ya wasifu kwenye mwaliko' },
  party_games: { en: 'Party Games', sw: 'Michezo ya Pamoja' },
  players: { en: 'players', sw: 'wachezaji' },
  no_people_yet: { en: 'No people yet', sw: 'Hakuna watu bado' },
  add_first_person: { en: 'Add your first person', sw: 'Ongeza Mtu wa Kwanza' },
  add_loved_ones: { en: 'Add a partner, friend, sibling, or classmate', sw: 'Ongeza mpenzi, rafiki, ndugu, au mwanafunzi mwenzio' },
  choose_game_invite: { en: 'Choose a game to invite them', sw: 'Chagua mchezo wa kumtumia' },
  or_challenge_any: { en: 'Or challenge to any game', sw: 'Au changamoto ya mchezo wowote' },
  items: { en: 'Items', sw: 'Bidhaa' },
  buy_tokens: { en: 'Buy Tokens', sw: 'Nunua Sarafu' },
  history: { en: 'History', sw: 'Historia' },
  tokens: { en: 'tokens', sw: 'sarafu' },
  best_value: { en: 'Best Value', sw: 'Thamani Bora' },
  no_transactions: { en: 'No transactions yet', sw: 'Hakuna shughuli bado' },
  purchased: { en: 'Purchased', sw: 'Umenunua' },
  login_rewards: { en: 'Login Rewards', sw: 'Tuzo za Kuingia' },
  lucky_draw: { en: 'Lucky Draw', sw: 'Bahati Nasibu' },
  lucky_draw_desc: { en: 'Try your luck — up to 1,000 tokens!', sw: 'Jaribu bahati yako — hadi sarafu 1,000!' },
  streak: { en: 'streak', sw: 'mfuatano' },
  your_streak: { en: 'Your streak', sw: 'Mfuatano wako' },
  days: { en: 'days', sw: 'siku' },
  sign_in_first: { en: 'Sign in to get XP and badges from challenges', sw: 'Ingia ili upate XP na badges kutoka changamoto' },
  download: { en: 'Download', sw: 'Pakua' },
  download_kasukugames: { en: 'Download KasukuGames', sw: 'Pakua KasukuGames' },
  play_offline: { en: 'Play offline, faster experience', sw: 'Cheza offline, haraka zaidi' },
  coming_soon: { en: 'Coming Soon', sw: 'Inakuja hivi karibuni' },
  go_home: { en: 'Go Home', sw: 'Rudi Nyumbani' },
  youre_invited: { en: "You're invited", sw: 'Umealikwa' },
  invited_you_to_play: { en: 'invited you to play', sw: 'amekualika kucheza' },
  signup_and_play: { en: 'Sign up & play', sw: 'Jisajili & cheza' },
  maybe_later: { en: 'Maybe later', sw: 'Labda baadaye' },
  logout: { en: 'Log Out', sw: 'Toka' },
  badges: { en: 'Badges', sw: 'Nishani' },
  create_team: { en: 'Create Team', sw: 'Unda Timu' },
  no_team_yet: { en: "You haven't joined a team yet", sw: 'Hujajiunga na timu bado' },
  friends_count: { en: 'Friends', sw: 'Marafiki' },
  share_link: { en: 'Share your link to compete together', sw: 'Shiriki link yako na marafiki kushindana pamoja' },
  couple_challenge: { en: 'Couple Challenge — Compete with your partner', sw: 'Couple Challenge — Shindana na mpenzi wako' },
  connect: { en: 'Connect', sw: 'Unganisha' },
  loved_ones: { en: 'Loved Ones', sw: 'Wapendwa' },
  family: { en: 'Family', sw: 'Familia' },
  friends: { en: 'Friends', sw: 'Marafiki' },
  peers: { en: 'Peers', sw: 'Wenzako' },
  no_games_match: { en: 'No games match your search.', sw: 'Hakuna mchezo unaolingana na utafutaji wako.' },
  loading: { en: 'Loading...', sw: 'Inapakia...' },
  welcome_back: { en: 'Welcome back!', sw: 'Karibu tena!' },
  login_day_reward: { en: 'Day {day} — Login Reward', sw: 'Siku {day} — Tuzo ya Kuingia' },
  game_completed: { en: 'Completed {game}', sw: 'Umekamilisha {game}' },
  milestone: { en: 'Milestone: {label}', sw: 'Hatua: {label}' },
  lucky_draw_result: { en: 'Lucky draw: {label}', sw: 'Bahati nasibu: {label}' },
  total_xp: { en: 'Total XP', sw: 'Jumla XP' },
  games_played: { en: 'Games Played', sw: 'Michezo' },
  total_score: { en: 'Total Score', sw: 'Jumla Score' },
  longest_streak: { en: 'Longest Streak', sw: 'Mfuatano Mrefu' },
  language: { en: 'Language', sw: 'Lugha' },
  theme: { en: 'Theme', sw: 'Mandhari' },
  light: { en: 'Light', sw: 'Mwanga' },
  dark: { en: 'Dark', sw: 'Giza' },
  settings: { en: 'Settings', sw: 'Mipangilio' },
  their_name: { en: 'Their name', sw: 'Jina lao' },
  you: { en: 'You', sw: 'Wewe' },
  level: { en: 'Level', sw: 'Ngazi' },
  use_kasuku_or_create: { en: 'Use your Kasuku username or create new', sw: 'Tumia jina lako la Kasuku au tengeneza mpya' },
  choose_avatar: { en: 'Choose avatar', sw: 'Chagua picha' },
  create_account: { en: 'Create Account', sw: 'Tengeneza Akaunti' },
  no_account: { en: "Don't have an account?", sw: 'Huna akaunti?' },
  have_account: { en: 'Already have an account?', sw: 'Una akaunti tayari?' },
  sign_in_login: { en: 'Sign in first to add friends and loved ones', sw: 'Ingia kwanza ili kuongeza marafiki na wapendwa' },
  get_the_app: { en: 'Get the App', sw: 'Pata App' },
  ios_install: { en: 'Tap Share then "Add to Home Screen"', sw: 'Bonyeza Share kisha "Add to Home Screen"' },
  not_played_yet: { en: 'Not played yet', sw: 'Bado hamjacheza' },
  xp_to_next: { en: 'XP to next level', sw: 'XP hadi ngazi inayofuata' },
  play_daily_streak: { en: 'Play daily to grow your streak and earn XP bonus', sw: 'Cheza kila siku kupata mfuatano mrefu na XP bonus' },
  edit: { en: 'Edit', sw: 'Hariri' },
  save: { en: 'Save', sw: 'Hifadhi' },
  no_track: { en: 'No track selected', sw: 'Hakuna nyimbo' },
  select_from_library: { en: 'Choose a track from the library', sw: 'Chagua nyimbo kutoka maktaba' },
  library: { en: 'Library', sw: 'Maktaba' },
  queue: { en: 'Queue', sw: 'Foleni' },
  upload_music: { en: 'Upload your music', sw: 'Pakia muziki wako' },
  empty_queue: { en: 'No tracks in queue', sw: 'Hakuna nyimbo kwenye foleni' },
  what_will_you_play: { en: 'What will you play?', sw: 'Utacheza nini?' },
  all_games: { en: 'All Games', sw: 'Michezo Yote' },
  play_now: { en: 'Play Now', sw: 'Cheza Sasa' },
  verification_admin: { en: 'Verification Admin', sw: 'Msimamizi wa Uthibitishaji' },
  upload_photo: { en: 'Upload photo', sw: 'Pakia picha' },
  share_profile: { en: 'Share Profile', sw: 'Shiriki Wasifu' },
  copy_link: { en: 'Copy Link', sw: 'Nakili Kiungo' },
  link_copied: { en: 'Link copied!', sw: 'Kiungo kimenakiliwa!' },
  social_links: { en: 'Social Links', sw: 'Mitandao ya Kijamii' },
  whatsapp_number: { en: 'WhatsApp Number', sw: 'Nambari ya WhatsApp' },
  instagram_handle: { en: 'Instagram Handle', sw: 'Jina la Instagram' },
  tiktok_handle: { en: 'TikTok Handle', sw: 'Jina la TikTok' },
  share_via_whatsapp: { en: 'WhatsApp', sw: 'WhatsApp' },
  native_share: { en: 'Share', sw: 'Shiriki' },
}
