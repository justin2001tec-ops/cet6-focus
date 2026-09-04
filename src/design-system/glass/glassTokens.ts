export const glassTokens = {
  compact: {
    blur: '16px',
    saturation: '128%',
    fillAlpha: 0.14,
    rimAlpha: 0.36,
    shadowAlpha: 0.18,
    specularRadius: '46px',
    refractionEnergy: 0.46,
  },
  regular: {
    blur: '24px',
    saturation: '136%',
    fillAlpha: 0.2,
    rimAlpha: 0.46,
    shadowAlpha: 0.2,
    specularRadius: '60px',
    refractionEnergy: 0.6,
  },
  expanded: {
    blur: '32px',
    saturation: '140%',
    fillAlpha: 0.24,
    rimAlpha: 0.52,
    shadowAlpha: 0.24,
    specularRadius: '76px',
    refractionEnergy: 0.72,
  },
  radius: {
    reading: '26px',
    control: '16px',
    icon: '50%',
    popover: '22px',
    capsule: '999px',
  },
} as const

export type GlassVariant = 'clear' | 'regular' | 'expanded'
