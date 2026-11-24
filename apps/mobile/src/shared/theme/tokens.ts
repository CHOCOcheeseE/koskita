/** Design token "Meja belajar anak kos" (docs/03-desain.md bagian 2). */
export type ColorTokens = {
  bg: string;
  surface: string;
  ink: string;
  inkMuted: string;
  line: string;
  lineSoft: string;
  primary: string;
  onPrimary: string;
  highlight: string;
  onHighlight: string;
  statusPaid: string;
  statusPending: string;
  statusUnpaid: string;
  statusPaidSoft: string;
  statusPendingSoft: string;
  statusUnpaidSoft: string;
};

export const lightColors: ColorTokens = {
  bg: '#E9F0EC',
  surface: '#FFFFFF',
  ink: '#1A2B4C',
  inkMuted: '#4A5873',
  line: '#7D8BA3',
  lineSoft: '#D3DDD7',
  primary: '#2346A8',
  onPrimary: '#FFFFFF',
  highlight: '#F7E26B',
  onHighlight: '#1A2B4C',
  statusPaid: '#256A43',
  statusPending: '#8A5A0B',
  statusUnpaid: '#B23A2E',
  statusPaidSoft: '#DCEFE3',
  statusPendingSoft: '#F6EAD2',
  statusUnpaidSoft: '#F7DEDA',
};

export const darkColors: ColorTokens = {
  bg: '#0F1A2E',
  surface: '#18263F',
  ink: '#E6ECF5',
  inkMuted: '#A9B5CA',
  line: '#6B7E9F',
  lineSoft: '#2A3A57',
  primary: '#8FB0FF',
  onPrimary: '#0F1A2E',
  highlight: '#E8D35A',
  onHighlight: '#1A2B4C',
  statusPaid: '#6FCB95',
  statusPending: '#E9B65A',
  statusUnpaid: '#FF8A7A',
  statusPaidSoft: '#1B3A2B',
  statusPendingSoft: '#3D2F14',
  statusUnpaidSoft: '#45211E',
};

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'AtkinsonHyperlegible_400Regular',
  bodyBold: 'AtkinsonHyperlegible_700Bold',
} as const;

export const typography = {
  amountXL: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  amountL: { fontFamily: fonts.displaySemi, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const screenGutter = 20;
export const radius = { input: 10, panel: 16, sheet: 24, pill: 999 } as const;
export const touchTarget = 48;
export const motion = { fast: 150, base: 220 } as const;
