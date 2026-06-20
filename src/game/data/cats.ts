/**
 * 3 只猫咪配置数据
 * 依据：development-design.md 5.4.1 MVP 猫咪配置
 *
 * 颜色为纯色占位，后期替换为 AI 生成猫咪精灵。
 */
import type { CatType } from '@/types'

export const CAT_TYPES: CatType[] = [
  {
    id: 'cat_mimi',
    name: '咪咪',
    personality: 'playful',
    dialogPool: [
      '喵～你又来专注啦！',
      '加油加油，我等着新猫窝呢！',
      '（伸懒腰）今天的阳光真好～',
      '快看快看，那边好像有新建筑！',
      '陪你专注，是我最喜欢的事喵～',
    ],
    moveIntervalMs: 15000,
    color: 0xffab91, // 橘粉色
    unlockCondition: { type: 'initial' },
  },
  {
    id: 'cat_doudou',
    name: '豆豆',
    personality: 'lazy',
    dialogPool: [
      '（打哈欠）又到了专注时间吗……',
      '别急别急，让我再躺一会儿……',
      'Zzz……嗯？什么？建好了？',
      '（翻了个身）你盖的房子真舒服……',
      '慢一点也没关系啦，慢慢来嘛～',
    ],
    moveIntervalMs: 25000,
    color: 0xbcaaa4, // 灰棕色
    unlockCondition: { type: 'pomodoroCount', count: 1 },
  },
  {
    id: 'cat_xuebao',
    name: '雪宝',
    personality: 'curious',
    dialogPool: [
      '哦？这边又变了呢！',
      '让我看看，让我看看！新东西！',
      '这座城市每天都在长大呀～',
      '（竖起耳朵）嗯？有新的声音！',
      '好奇好奇，下一栋会是什么建筑呢？',
    ],
    moveIntervalMs: 20000,
    color: 0xe3f2fd, // 雪白色
    unlockCondition: { type: 'level', level: 2 },
  },
]

/** 猫咪 ID → 配置 的映射 */
export const CAT_TYPE_MAP: Record<string, CatType> = Object.fromEntries(
  CAT_TYPES.map((c) => [c.id, c])
)

/** 获取猫咪配置 */
export function getCatType(id: string): CatType | undefined {
  return CAT_TYPE_MAP[id]
}
