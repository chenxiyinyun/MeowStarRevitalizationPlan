import { describe, it, expect } from 'vitest'
import { darkenColor } from './colors'

describe('darkenColor', () => {
  it('原色乘以 1 返回原值', () => {
    expect(darkenColor(0xff8800, 1)).toBe(0xff8800)
  })
  it('原色乘以 0.7 各通道按比例变暗', () => {
    expect(darkenColor(0xffffff, 0.7)).toBe(0xb3b3b3)
  })
  it('通道独立计算且截断为整数', () => {
    // r=0xff*0.85=217=0xd9, g=0x88*0.85=116=0x74, b=0x00
    expect(darkenColor(0xff8800, 0.85)).toBe(0xd97400)
  })
})
