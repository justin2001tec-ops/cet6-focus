export const glassTokens = {
  compact: {
    blur: '16px',
    saturation: '128%',
    fillAlpha: 0.11,
    rimAlpha: 0.2,
    shadowAlpha: 0.14,
  },
  regular: {
    blur: '24px',
    saturation: '136%',
    fillAlpha: 0.16,
    rimAlpha: 0.22,
    shadowAlpha: 0.19,
  },
  expanded: {
    blur: '32px',
    saturation: '140%',
    fillAlpha: 0.2,
    rimAlpha: 0.26,
    shadowAlpha: 0.23,
  },
  radius: {
    reading: '26px',
    control: '16px',
    icon: '14px',
    popover: '22px',
    capsule: '999px',
  },
} as const

export type GlassVariant = 'clear' | 'regular' | 'expanded'
