/**
 * 基础音效系统 —— 使用 Web Audio API 合成简单音效，无需音频文件。
 * 提供 complete / place / levelup / click 四种音效，支持静音切换。
 */

type SoundType = 'complete' | 'place' | 'levelup' | 'click'

class SoundManager {
  private ctx: AudioContext | null = null
  private muted = false

  /** 懒加载 AudioContext（需在用户交互后创建，避免浏览器自动播放策略限制） */
  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  isMuted(): boolean {
    return this.muted
  }

  /** 播放指定类型音效 */
  play(type: SoundType): void {
    if (this.muted) return
    const ctx = this.getCtx()
    if (!ctx) return

    switch (type) {
      case 'complete':
        this.playChord(ctx, [523.25, 659.25, 783.99], 0.6, 0.15)
        break
      case 'place':
        this.playTone(ctx, 440, 0.15, 0.12, 'sine')
        break
      case 'levelup':
        this.playArpeggio(ctx, [523.25, 659.25, 783.99, 1046.5], 0.12, 0.18)
        break
      case 'click':
        this.playTone(ctx, 660, 0.05, 0.08, 'triangle')
        break
    }
  }

  /** 单音 */
  private playTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    gain: number,
    type: OscillatorType = 'sine'
  ): void {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.connect(g)
    g.connect(ctx.destination)
    const now = ctx.currentTime
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(gain, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }

  /** 和弦（多音同时） */
  private playChord(ctx: AudioContext, freqs: number[], duration: number, gain: number): void {
    freqs.forEach((f) => this.playTone(ctx, f, duration, gain / freqs.length))
  }

  /** 琶音（依次播放） */
  private playArpeggio(ctx: AudioContext, freqs: number[], step: number, gain: number): void {
    freqs.forEach((f, i) => {
      const startAt = ctx.currentTime + i * step
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      osc.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0, startAt)
      g.gain.linearRampToValueAtTime(gain, startAt + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, startAt + step * 1.5)
      osc.start(startAt)
      osc.stop(startAt + step * 1.5 + 0.05)
    })
  }
}

export const soundManager = new SoundManager()
export type { SoundType }
