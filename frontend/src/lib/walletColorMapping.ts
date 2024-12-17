export enum WalletColor {
  BLACK = "#16171A",
  BLUE = "#0068C9",
  LAVENDER = "#7366C5",
  LIME = "#09870E",
  NIGHT = "#222140",
  RED = "#BC1D1D",
  FUCHSIA = "#A01DA0",
  TEAL = "#087A80",
  GREEN = "#054007",
  ORANGE = "#B8580E",
}

export const RAW_WALLET_COLOR_MAPPING: Record<string, WalletColor> = {
  ONE: WalletColor.BLACK,
  TWO: WalletColor.BLUE,
  THREE: WalletColor.LAVENDER,
  FOUR: WalletColor.LIME,
  FIVE: WalletColor.NIGHT,
  SIX: WalletColor.RED,
  SEVEN: WalletColor.FUCHSIA,
  EIGHT: WalletColor.TEAL,
  NINE: WalletColor.GREEN,
  TEN: WalletColor.ORANGE,
};

export const RAW_WALLET_COLOR_TO_NUMBER_MAPPING: Record<WalletColor, string> = {
  [WalletColor.BLACK]: "ONE",
  [WalletColor.BLUE]: "TWO",
  [WalletColor.LAVENDER]: "THREE",
  [WalletColor.LIME]: "FOUR",
  [WalletColor.NIGHT]: "FIVE",
  [WalletColor.RED]: "SIX",
  [WalletColor.FUCHSIA]: "SEVEN",
  [WalletColor.TEAL]: "EIGHT",
  [WalletColor.GREEN]: "NINE",
  [WalletColor.ORANGE]: "TEN",
};
