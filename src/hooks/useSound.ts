import { useCallback, useEffect, useState } from 'react'
import { soundManager, type SoundType } from '@/utils/sound'

/**
 * 音效 hook：提供 play 函数与 mute 切换。
 * 静音状态持久化到 localStorage。
 */
export function useSound(): {
  play: (type: SoundType) => void
  muted: boolean
  toggleMute: () => void
} {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('meow-sound-muted') === '1'
  })

  useEffect(() => {
    soundManager.setMuted(muted)
    localStorage.setItem('meow-sound-muted', muted ? '1' : '0')
  }, [muted])

  const play = useCallback((type: SoundType) => {
    soundManager.play(type)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  return { play, muted, toggleMute }
}
