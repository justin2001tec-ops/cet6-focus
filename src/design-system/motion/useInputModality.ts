import { useEffect, useState } from 'react'

export type InputModality = 'keyboard' | 'coarse' | 'fine'

export interface InputModalityState {
  modality: InputModality
  pointerType: 'coarse' | 'fine'
  canHover: boolean
  pressScale: number
  targetSize: number
}

function readInitialState(): InputModalityState {
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
  return {
    modality: coarse ? 'coarse' : 'fine',
    pointerType: coarse ? 'coarse' : 'fine',
    canHover,
    pressScale: coarse ? 0.975 : 0.99,
    targetSize: coarse ? 44 : 34,
  }
}

export function useInputModality(): InputModalityState {
  const [state, setState] = useState<InputModalityState>(readInitialState)

  useEffect(() => {
    const coarseQuery = window.matchMedia('(pointer: coarse)')
    const hoverQuery = window.matchMedia('(hover: hover)')
    const updatePointer = (coarse: boolean, canHover: boolean, modality: InputModality = coarse ? 'coarse' : 'fine') => {
      setState({
        modality,
        pointerType: coarse ? 'coarse' : 'fine',
        canHover,
        pressScale: coarse ? 0.975 : 0.99,
        targetSize: coarse ? 44 : 34,
      })
    }
    const onPointerDown = (event: PointerEvent) => {
      const coarse = event.pointerType === 'touch' || event.pointerType === 'pen'
      updatePointer(coarse, coarse ? false : hoverQuery.matches, coarse ? 'coarse' : 'fine')
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
        setState((current) => ({ ...current, modality: 'keyboard' }))
      }
    }
    const onMediaChange = () => updatePointer(coarseQuery.matches, hoverQuery.matches)
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    coarseQuery.addEventListener('change', onMediaChange)
    hoverQuery.addEventListener('change', onMediaChange)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      coarseQuery.removeEventListener('change', onMediaChange)
      hoverQuery.removeEventListener('change', onMediaChange)
    }
  }, [])

  return state
}
