import type { Pronunciation } from '@/types'

export interface SpeechResult {
  ok: boolean
  message?: string
}

export function speakWord(word: string, pronunciation: Pronunciation, rate = 0.86): SpeechResult {
  if (!('speechSynthesis' in window)) return { ok: false, message: '当前浏览器不支持发音播放。' }
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find((voice) => voice.lang.toLowerCase() === pronunciation.toLowerCase())
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(pronunciation.slice(0, 2)))
  if (voices.length > 0 && !preferred) return { ok: false, message: '系统没有可用的对应口音声音。' }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = pronunciation
  utterance.rate = rate
  if (preferred) utterance.voice = preferred
  window.speechSynthesis.speak(utterance)
  return { ok: true }
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
