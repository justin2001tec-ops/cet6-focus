/**
 * Stable import surface for background settings and the app provider.
 *
 * The v1.2 scene catalog lives in lib/background-scenes so its visual
 * metadata can be shared by the immersive home and the settings screen.
 */
export {
  backgrounds,
  chooseBackground,
} from '@/lib/background-scenes'
export type { BackgroundScene as Background } from '@/lib/background-scenes'
