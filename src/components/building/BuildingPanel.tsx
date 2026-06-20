/**
 * 建筑面板组件
 * 依据：development-design.md 5.3 建筑系统、6.3 建筑放置流程
 *
 * 功能：
 * - 分类筛选（自然/道路/住宅/商业/设施/装饰/地标）
 * - 建筑列表（显示名称、燃料消耗、解锁状态）
 * - 选中建筑进入放置模式
 * - 选中道路进入铺路模式（道路作为地形铺设）
 */
import { useState } from 'react'
import type { BuildingCategory, BuildingType, RoadType } from '@/types'
import { BUILDING_CATEGORIES } from '@/types'
import { BUILDING_TYPES } from '@/game/data/buildings'
import { ROAD_TYPES } from '@/game/data/roads'
import { useProgressStore } from '@/store/progressStore'
import { useSound } from '@/hooks/useSound'

interface BuildingPanelProps {
  selectedBuildingType: string | null
  onSelect: (typeId: string | null) => void
  /** 当前选中的道路类型 ID（铺路模式） */
  selectedRoadType?: string | null
  /** 选择道路类型时触发（进入铺路模式） */
  onPaveSelect?: (roadTypeId: string | null) => void
}

export default function BuildingPanel({
  selectedBuildingType,
  onSelect,
  selectedRoadType,
  onPaveSelect,
}: BuildingPanelProps) {
  const [activeCategory, setActiveCategory] = useState<BuildingCategory | 'all'>('all')
  const level = useProgressStore((s) => s.level)
  const fuel = useProgressStore((s) => s.fuel)
  const { play } = useSound()

  const isRoadCategory = activeCategory === 'road'

  const filteredBuildings =
    activeCategory === 'all'
      ? BUILDING_TYPES
      : BUILDING_TYPES.filter((b) => b.category === activeCategory)

  const handleSelectBuilding = (typeId: string) => {
    play('click')
    // 选择建筑时清空道路选择（互斥）
    if (selectedRoadType && onPaveSelect) {
      onPaveSelect(null)
    }
    onSelect(selectedBuildingType === typeId ? null : typeId)
  }

  const handleSelectRoad = (roadTypeId: string) => {
    play('click')
    // 选择道路时清空建筑选择（互斥）
    if (selectedBuildingType) {
      onSelect(null)
    }
    onPaveSelect?.(selectedRoadType === roadTypeId ? null : roadTypeId)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="font-display text-lg text-text-primary">建筑</h2>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⛽</span>
          <span className="font-bold text-accent-orange">{fuel}</span>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-1.5 border-b border-border-subtle px-3 py-2">
        <CategoryChip
          label="全部"
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {BUILDING_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.key}
            label={`${cat.icon} ${cat.label}`}
            active={activeCategory === cat.key}
            onClick={() => setActiveCategory(cat.key)}
          />
        ))}
      </div>

      {/* 列表区域 */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <div className="grid grid-cols-2 gap-2">
          {isRoadCategory
            ? ROAD_TYPES.map((road) => (
                <RoadCard
                  key={road.id}
                  road={road}
                  isUnlocked={level >= road.unlockLevel}
                  canAfford={fuel >= road.cost.fuel}
                  isSelected={selectedRoadType === road.id}
                  onClick={() => handleSelectRoad(road.id)}
                />
              ))
            : filteredBuildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  isUnlocked={level >= building.unlockLevel}
                  canAfford={fuel >= building.cost.fuel}
                  isSelected={selectedBuildingType === building.id}
                  onClick={() => handleSelectBuilding(building.id)}
                />
              ))}
        </div>
      </div>

      {/* 放置/铺路提示 */}
      {(selectedBuildingType || selectedRoadType) && (
        <div className="border-t border-border-subtle px-4 py-2.5">
          <p className="text-xs text-text-secondary">
            {selectedRoadType
              ? '点击地图铺设道路 · 再次点击取消选择'
              : '点击地图放置建筑 · 再次点击取消选择'}
          </p>
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-accent-orange text-white'
          : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )
}

function BuildingCard({
  building,
  isUnlocked,
  canAfford,
  isSelected,
  onClick,
}: {
  building: BuildingType
  isUnlocked: boolean
  canAfford: boolean
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      className={`relative flex flex-col items-center rounded-xl border p-3 transition-all ${
        isSelected
          ? 'border-accent-orange bg-accent-orange/10'
          : isUnlocked
            ? 'border-border-subtle bg-bg-card hover:border-accent-orange/50 hover:bg-bg-card-hover'
            : 'cursor-not-allowed border-border-subtle bg-bg-card/50 opacity-50'
      }`}
    >
      {/* 建筑颜色占位 */}
      <div
        className="mb-2 h-8 w-8 rounded-lg"
        style={{ backgroundColor: `#${building.color.toString(16).padStart(6, '0')}` }}
      />

      <span className="text-center text-xs font-medium text-text-primary">{building.name}</span>

      <div className="mt-1 flex items-center gap-1">
        {building.cost.fuel > 0 ? (
          <>
            <span className="text-[10px]">⛽</span>
            <span
              className={`text-[10px] font-bold ${
                isUnlocked && !canAfford ? 'text-red-400' : 'text-accent-orange'
              }`}
            >
              {building.cost.fuel}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-text-dim">免费</span>
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="rounded-full bg-bg-deep/80 px-2 py-0.5 text-[10px] text-text-dim">
            Lv.{building.unlockLevel}
          </span>
        </div>
      )}
    </button>
  )
}

function RoadCard({
  road,
  isUnlocked,
  canAfford,
  isSelected,
  onClick,
}: {
  road: RoadType
  isUnlocked: boolean
  canAfford: boolean
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      className={`relative flex flex-col items-center rounded-xl border p-3 transition-all ${
        isSelected
          ? 'border-accent-mint bg-accent-mint/10'
          : isUnlocked
            ? 'border-border-subtle bg-bg-card hover:border-accent-mint/50 hover:bg-bg-card-hover'
            : 'cursor-not-allowed border-border-subtle bg-bg-card/50 opacity-50'
      }`}
    >
      {/* 道路颜色占位（扁平条状，模拟路面） */}
      <div
        className="mb-2 h-3 w-10 rounded-full"
        style={{ backgroundColor: `#${road.color.toString(16).padStart(6, '0')}` }}
      />

      <span className="text-center text-xs font-medium text-text-primary">{road.name}</span>

      <div className="mt-1 flex items-center gap-1">
        {road.cost.fuel > 0 ? (
          <>
            <span className="text-[10px]">⛽</span>
            <span
              className={`text-[10px] font-bold ${
                isUnlocked && !canAfford ? 'text-red-400' : 'text-accent-orange'
              }`}
            >
              {road.cost.fuel}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-text-dim">免费</span>
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="rounded-full bg-bg-deep/80 px-2 py-0.5 text-[10px] text-text-dim">
            Lv.{road.unlockLevel}
          </span>
        </div>
      )}
    </button>
  )
}
