import { Platform, TextStyle } from 'react-native';

/**
 * Values transcribed from the Claude Design prototype (`bwd Portal App.dc.html`).
 * bwd brand colours are used only where they carry meaning: petrol = interactive,
 * red = cancellation / exam, green = positive grade movement.
 */
export const color = {
  navy: '#0B3C4C',
  coral: '#CE5E6C',
  green: '#3F7D53',
  red: '#A2404D',

  ground: '#F2F2F7',
  card: '#FFFFFF',
  rowPressed: '#F2F2F0',

  ink: '#000000',
  inkSecondary: '#8E8E93',
  inkDisabled: '#C7C7CC',
  chevron: '#C7C7CC',

  separator: 'rgba(11,60,76,.07)',
  separatorStrong: 'rgba(0,0,0,.09)',
  hairline: 'rgba(0,0,0,.08)',
  segmentTrack: 'rgba(0,0,0,.05)',
  scrim: 'rgba(11,60,76,.32)',
  tint: 'rgba(11,60,76,.06)',
  tintStrong: 'rgba(11,60,76,.09)',
} as const;

export const layout = {
  /** Horizontal inset of every grouped card. */
  gutter: 16,
  /** Inner padding of a card row. */
  rowPaddingH: 18,
  rowPaddingV: 15,
  cardRadius: 14,
  /** Vertical air between two groups. */
  groupGap: 30,
  /** Clearance so content can scroll clear of the floating tab bar. */
  tabBarClearance: 120,
} as const;

/** Tabular figures keep grade and time columns aligned. */
export const tabularNums: TextStyle = Platform.select({
  ios: { fontVariant: ['tabular-nums'] },
  default: { fontVariant: ['tabular-nums'] },
}) as TextStyle;

export const type = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.1,
    lineHeight: 38,
    color: color.ink,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: color.inkSecondary,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.3,
    color: color.ink,
  },
  secondary: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
    color: color.inkSecondary,
  },
  /** The one big number a screen is built around. */
  statValue: {
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: -1.2,
    lineHeight: 34,
    color: color.ink,
    ...tabularNums,
  },
  delta: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    ...tabularNums,
  },
} satisfies Record<string, TextStyle>;

/** Green for an improving average, red for a falling one. */
export function deltaColor(delta: number): string {
  return delta >= 0 ? color.green : color.red;
}

/** Signed, fixed-decimal delta using a real minus sign, as in the prototype. */
export function formatDelta(delta: number, digits = 2): string {
  return (delta >= 0 ? '+' : '−') + Math.abs(delta).toFixed(digits);
}

/** Insufficient grades (below 4) are called out in red. */
export function gradeColor(grade: number): string {
  return grade < 4 ? color.red : color.ink;
}
