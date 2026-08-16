/**
 * Buffalo688 rebuild — image asset registry.
 * All image URLs below are the ORIGINAL live-site CDN paths observed on
 * https://m.buffalo688.club (2026-08-15). Nothing is bundled locally; the site
 * depends on the original Buffalo688 image servers exactly like the live site.
 * Code itself is written from scratch — only the asset URLs match the original.
 */

const CDN = "https://cdn.myanmarshankoeme.com/build/assets/img/bf688";
const GCP = "https://storage.googleapis.com/spacetech2";
const CF = "https://imagedelivery.net/HPdN1Z_Ube9zTuVFQK-tGg";

export const ASSETS = {
  logo: `${CDN}/buffalo688.webp`,
  logoText: `${CDN}/buffalo_logoooo_text.webp`,
  logoNew: `${CDN}/buffalo688_new_version.webp`,
  welcomeBuffalo: `${CDN}/buffalo688_welcom_buffalo.webp`,
  promoBanner: `${CDN}/smt223_welcome1_new.webp`,
  background: `${CDN}/smt223_background.jpg`,
  noticeIcon: `${CDN}/smt223_notice_icon.png`,
  hotBadge: `${CDN}/smt223_hot.png`,
  hotGames: `${CDN}/buffalo_hot_games.webp`,
  jackpot1bn: `${CDN}/1bn.webp`,
  downloadBanner: `${CDN}/smt233_download.png`,
  banner1: `${CDN}/smt223_banner1.webp`,
  banner2: `${CDN}/smt223_banner2.webp`,
  mainBanner: `${GCP}/africanbuffalo/banners/BUFFALO688%201.avif?ignoreCache=1`,
  dailyWinsBanner: `${GCP}/bf688/BP_Daily-Wins_Season%209_Level%203_MM_MMK_750x275.webp`,
  tilePlaceholder: `${CF}/dae6345e-9f8a-471a-a361-ce0d318af400/public`,
  flags: {
    my: `${CDN}/myanmar.png`,
    en: `${CDN}/united-kingdom.png`,
    cn: `${CDN}/china.png`,
    th: `${CDN}/thailand.png`,
  },
  nav: {
    home: `${CDN}/smt223_home.png`,
    homeActive: `${CDN}/smt223_home_active.png`,
    withdraw: `${CDN}/smt223_withdraw.png`,
    withdrawActive: `${CDN}/smt223_withdraw_active.png`,
    deposit: `${CDN}/smt223_deposit.png`,
    depositActive: `${CDN}/smt223_deposit_active.png`,
    profile: `${CDN}/smt223_profile.png`,
    profileActive: `${CDN}/smt223_profile_active.png`,
  },
  hotVariants: {
    hotSlot: `${CDN}/smt223_hot_slot.png`,
    hotArcade: `${CDN}/smt223_hot_arcade.png`,
    hotFishing: `${CDN}/smt223_hot_fishing.png`,
  },
  setting: {
    icon: `${CDN}/smt223_setting_icon.png`,
    password: `${CDN}/smt223_setting_password.png`,
    banking: `${CDN}/smt223_setting_banking.png`,
    language: `${CDN}/smt223_setting_language.png`,
    logout: `${CDN}/smt223_logout_2.png`,
  },
  contact: {
    headphones: `${CDN}/smt223_contact_headphones.png`,
    telegram: `${CDN}/smt223_telegram.png`,
    viber: `${CDN}/smt223_viber.png`,
  },
  coin: `https://yy24gld.sgp1.cdn.digitaloceanspaces.com/hulk333/coin.png`,
  navLocal: {
    home: `/assets/smt223_home_c8d09979.png`,
    homeActive: `/assets/smt223_home_active_6153bac4.png`,
    withdraw: `/assets/smt223_withdraw_e66c240e.png`,
    withdrawActive: `/assets/smt223_withdraw_active_c75b93b3.png`,
    deposit: `/assets/smt223_deposit_7fdbe956.png`,
    depositActive: `/assets/smt223_deposit_active_f2278f70.png`,
    profile: `/assets/smt223_profile_9984cb9b.png`,
    profileActive: `/assets/smt223_profile_active_74c8190c.png`,
    hot: `/assets/smt223_hot_49eaf50e.png`,
    noticeIcon: `/assets/smt223_notice_icon_bc9c8520.png`,
    slot: `/assets/smt223_slot_048115ad.png`,
    arcade: `/assets/smt223_arcade_eca90013.png`,
    fishing: `/assets/smt223_fishing_3414f912.png`,
    hotSlot: `/assets/smt223_hot_slot_4741f17b.png`,
    hotArcade: `/assets/smt223_hot_arcade_c8587d4d.png`,
    hotFishing: `/assets/smt223_hot_fishing_22ff2da9.png`,
    buffalo2: `/assets/smt223_buffalo2_be06b14f.webp`,
    jili: `/assets/smt223_jili_57df79c3.webp`,
    settingIcon: `/assets/smt223_setting_icon_0fbb207d.png`,
    settingPassword: `/assets/smt223_setting_password_2b6ff676.png`,
    settingBanking: `/assets/smt223_setting_banking_1fdcef23.png`,
    settingLanguage: `/assets/smt223_setting_language_a5e4aadb.png`,
    logout: `/assets/smt223_logout_2_263ddc43.png`,
    telegram: `/assets/smt223_telegram_db56efc7.png`,
    viber: `/assets/smt223_viber_f0064c8c.png`,
    headphones: `/assets/headphones_dd6d231e.png`,
    banner1: `/assets/smt223_banner1_6e5a0883.webp`,
    banner2: `/assets/smt223_banner2_a2f4fd3d.webp`,
    welcome1: `/assets/smt223_welcome1_new_71aeea52.webp`,
    buffaloCard: `${CDN}/buffalo688_new_2_card.webp`,
    buffaloLogo: `${CDN}/buffalo688.webp`,
    bgy: `/assets/smt223_bgy_ba714003.webp`,
    galone: `/assets/smt223_galone_0e65e301.webp`,
    forest: `/assets/smt223_forest_95d71124.webp`,
    skm: `/assets/smt223_skm_19227962.webp`,
  },
  categories: {
    slot: `${CDN}/smt223_slot.png`,
    fishing: `${CDN}/smt223_fishing.png`,
    arcade: `${CDN}/smt223_arcade.png`,
    cards: `${CDN}/pok3.webp`,
    buffalo2: `${CDN}/smt223_buffalo2.webp`,
    hotSlot: `${CDN}/smt223_hot_slot.png`,
    hotFishing: `${CDN}/smt223_hot_fishing.png`,
    hotArcade: `${CDN}/smt223_hot_arcade.png`,
  },
  providers: {
    // The original site has no separate logo per provider; use one signature tile per provider.
    jili: `${CDN}/smt223_jili.webp`,
    pp: `${CDN}/pp/vs20olympgate.webp`,
    pg: `${CDN}/pgsoft/diaochan.webp`,
    fachai: `${CDN}/fachai/21009.webp`,
    jdb: `${CDN}/jdb/14092.webp`,
    spade: `${CDN}/spade/S-LT01.webp`,
    hotdog: `${CDN}/hotdog/hd-african-buffalo2.webp`,
    skm: `${CDN}/bufalo688_skm.webp`,
    bgy: `${CDN}/buffalo688_bgy.webp`,
    galone: `${CDN}/buffalo688_galone.webp`,
    forest: `${CDN}/buffalo688_forest.webp`,
  },
  hotTiles: {
    buffaloNewCard: `${CDN}/buffalo688_new_2_card.webp`,
    hotdogWin: `${CDN}/hotdog/hd-labubu-win.webp`,
    cardGame: `${CDN}/jili/216.webp`,
    arcade332: `${CDN}/332.png`,
  },
} as const;

/** Slot game tiles — original CDN images (JILI / Pragmatic Play / 2J) */
export const JILI_TILES: string[] = [
  `${CDN}/jili/1.webp`, `${CDN}/jili/4.webp`, `${CDN}/jili/6.webp`, `${CDN}/jili/32.webp`,
  `${CDN}/jili/40.webp`, `${CDN}/jili/42.webp`, `${CDN}/jili/47.webp`, `${CDN}/jili/60.webp`,
  `${CDN}/jili/71.webp`, `${CDN}/jili/74.webp`, `${CDN}/jili/77.webp`, `${CDN}/jili/82.webp`,
  `${CDN}/jili/102.webp`, `${CDN}/jili/103.webp`, `${CDN}/jili/109.webp`, `${CDN}/jili/118.webp`,
  `${CDN}/jili/119.webp`, `${CDN}/jili/122.webp`, `${CDN}/jili/123.webp`, `${CDN}/jili/124.webp`,
  `${CDN}/jili/125.webp`, `${CDN}/jili/128.webp`, `${CDN}/jili/132.webp`, `${CDN}/jili/139.webp`,
  `${CDN}/jili/143.webp`, `${CDN}/jili/147.webp`, `${CDN}/jili/148.webp`, `${CDN}/jili/149.webp`,
  `${CDN}/jili/150.webp`, `${CDN}/jili/173.webp`, `${CDN}/jili/182.webp`, `${CDN}/jili/212.webp`,
  `${CDN}/jili/223.webp`, `${CDN}/jili/235.webp`, `${CDN}/jili/236.webp`, `${CDN}/jili/242.webp`,
  `${CDN}/jili/259.webp`, `${CDN}/jili/263.webp`, `${CDN}/jili/289.webp`, `${CDN}/jili/300.webp`,
  `${CDN}/jili/375.webp`, `${CDN}/jili/379.webp`, `${CDN}/jili/400.webp`, `${CDN}/jili/460.webp`,
  `${CDN}/jili/517.webp`, `${CDN}/jili/523.webp`, `${CDN}/jili/531.webp`, `${CDN}/jili/542.webp`,
  `${CDN}/jili/720.webp`,
] as const;

export const PP_TILES: string[] = [
  `${CDN}/pp/vs20swrbon.webp`, `${CDN}/pp/vs25caishen2.webp`, `${CDN}/pp/vs20frankie.webp`,
  `${CDN}/pp/vs20starprss.webp`, `${CDN}/pp/vswaysacnd.webp`, `${CDN}/pp/vs20speark.webp`,
  `${CDN}/pp/vs20olgatssc.webp`, `${CDN}/pp/vs20procountxm.webp`, `${CDN}/pp/vs20olympgcl.webp`,
  `${CDN}/pp/vs20chestcol.webp`, `${CDN}/pp/vswaysreelbtl.webp`, `${CDN}/pp/vswayswildb.webp`,
  `${CDN}/pp/ar10plinko.webp`,
] as const;

export const OTHER_TILES: string[] = [
  `${CDN}/2j/1039.webp`, `${CDN}/2j/1048.webp`, `${CDN}/332.png`,
] as const;

export interface GameTile {
  id: string;
  name: string;
  image: string;
  provider: "JILI" | "PP" | "2J" | "HOTDOG" | "CARD";
  hot?: boolean;
  new?: boolean;
}

export const HOT_GAMES: GameTile[] = [
  { id: "african-buffalo", name: "African Buffalo", image: ASSETS.logoNew, provider: "HOTDOG", hot: true, new: true },
  { id: "card-dragon", name: "Dragon Card", image: ASSETS.hotTiles.cardGame, provider: "JILI", hot: true },
  { id: "hot-win", name: "Hot Dog Win", image: ASSETS.hotTiles.hotdogWin, provider: "HOTDOG", hot: true },
  { id: "arcade-332", name: "Arcade 332", image: ASSETS.hotTiles.arcade332, provider: "2J", hot: true },
];
