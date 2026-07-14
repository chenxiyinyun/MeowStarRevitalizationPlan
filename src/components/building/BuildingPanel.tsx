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
  selectedRoadType?: string | null
  onPaveSelect?: (roadTypeId: string | null) => void
  demolishMode?: boolean
  onDemolishToggle?: (enabled: boolean) => void
  moveMode?: boolean
  onMoveToggle?: (enabled: boolean) => void
}

export default function BuildingPanel({
  selectedBuildingType,
  onSelect,
  selectedRoadType,
  onPaveSelect,
  demolishMode,
  onDemolishToggle,
  moveMode,
  onMoveToggle,
}: BuildingPanelProps) {
  const [activeCategory, setActiveCategory] = useState<BuildingCategory | 'all'>('zone')
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
    if (selectedRoadType && onPaveSelect) {
      onPaveSelect(null)
    }
    if (moveMode) onMoveToggle?.(false)
    onSelect(selectedBuildingType === typeId ? null : typeId)
  }

  const handleSelectRoad = (roadTypeId: string) => {
    play('click')
    if (selectedBuildingType) {
      onSelect(null)
    }
    if (moveMode) onMoveToggle?.(false)
    onPaveSelect?.(selectedRoadType === roadTypeId ? null : roadTypeId)
  }

  const handleToggleDemolish = () => {
    play('click')
    if (!demolishMode) {
      if (selectedBuildingType) onSelect(null)
      if (selectedRoadType) onPaveSelect?.(null)
      if (moveMode) onMoveToggle?.(false)
    }
    onDemolishToggle?.(!demolishMode)
  }

  const handleToggleMove = () => {
    play('click')
    if (!moveMode) {
      if (selectedBuildingType) onSelect(null)
      if (selectedRoadType) onPaveSelect?.(null)
      if (demolishMode) onDemolishToggle?.(false)
    }
    onMoveToggle?.(!moveMode)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="wood-texture border-b-4 border-wood-dark px-3 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-cream">🏗️ 建造面板</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleMove}
              className={`px-2 py-1 text-xs font-display border-2 border-wood-dark transition-all ${
                moveMode
                  ? 'bg-blue-400 text-white shadow-button-pressed translate-y-0.5'
                  : 'bg-blue-100 text-blue-800 shadow-button hover:bg-blue-200'
              }`}
              title={moveMode ? '退出移动模式' : '移动模式'}
            >
              ↔ 移动
            </button>
            <button
              onClick={handleToggleDemolish}
              className={`px-2 py-1 text-xs font-display border-2 border-wood-dark transition-all ${
                demolishMode
                  ? 'bg-red-400 text-white shadow-button-pressed translate-y-0.5'
                  : 'bg-red-100 text-red-800 shadow-button hover:bg-red-200'
              }`}
              title={demolishMode ? '退出拆除模式' : '拆除模式'}
            >
              🔨 拆除
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b-3 border-wood-dark bg-bg-paper px-2 py-2">
        <CategoryChip
          label="📐 规划"
          active={activeCategory === 'zone'}
          onClick={() => setActiveCategory('zone')}
        />
        <CategoryChip
          label="🛤️ 道路"
          active={activeCategory === 'road'}
          onClick={() => setActiveCategory('road')}
        />
        <CategoryChip
          label="🏠 建筑"
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {BUILDING_CATEGORIES.filter(c => !['zone', 'road', 'nature', 'decoration'].includes(c.key)).map((cat) => (
          <CategoryChip
            key={cat.key}
            label={`${cat.icon}`}
            active={activeCategory === cat.key}
            onClick={() => setActiveCategory(cat.key)}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin bg-gradient-to-b from-bg-cream to-bg-paper">
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

      {(selectedBuildingType || selectedRoadType || demolishMode || moveMode) && (
        <div className="border-t-3 border-wood-dark bg-accent-yellow/20 px-3 py-2">
          <p className="text-xs font-display text-brown-dark">
            {moveMode
              ? '📦 点击建筑选中 → 点击空地移动'
              : demolishMode
                ? '🔨 点击地图上的建筑拆除，返还50%燃料'
                : selectedRoadType
                  ? '🛤️ 点击地图铺设道路'
                  : '🏗️ 点击地图放置建筑，邻路有加成'}
          </p>
          <p className="text-[10px] text-text-dim mt-1">按 ESC 键取消当前模式</p>
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
      className={`px-2 py-1 text-xs font-display border-2 border-wood-dark transition-all ${
        active
          ? 'bg-accent-orange text-white shadow-button-pressed translate-y-0.5'
          : 'bg-bg-card text-text-secondary shadow-button hover:bg-bg-card-hover'
      }`}
    >
      {label}
    </button>
  )
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    nature: '🌿',
    road: '🛤️',
    zone: '📐',
    residence: '🏠',
    commercial: '🏪',
    facility: '💡',
    decoration: '🌸',
    landmark: '🗼',
  }
  return map[category] || '🏗️'
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
  const colorHex = `#${building.color.toString(16).padStart(6, '0')}`

  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      className={`relative flex flex-col items-center p-2 border-3 transition-all ${
        isSelected
          ? 'border-accent-orange bg-accent-orange/20 shadow-button-pressed translate-y-0.5'
          : isUnlocked
            ? 'border-wood-medium bg-bg-card shadow-button hover:border-accent-orange hover:-translate-y-0.5'
            : 'cursor-not-allowed border-wood-light bg-bg-paper/50 opacity-60'
      }`}
    >
      <div
        className="mb-1.5 w-8 h-8 border-2 border-wood-dark flex items-center justify-center"
        style={{ backgroundColor: building.category === 'zone' ? `${colorHex}50` : colorHex }}
      >
        <span className="text-sm">{getCategoryEmoji(building.category)}</span>
      </div>

      <span className="text-center text-[11px] font-display text-text-primary leading-tight">{building.name}</span>

      <div className="mt-1 flex items-center gap-0.5">
        {building.cost.fuel > 0 ? (
          <>
            <span className="text-[10px]">⛽</span>
            <span
              className={`text-[10px] font-bold ${
                isUnlocked && !canAfford ? 'text-red-500' : 'text-accent-orange'
              }`}
            >
              {building.cost.fuel}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-accent-mint font-bold">免费</span>
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="bg-wood-dark px-1.5 py-0.5 text-[9px] text-white font-display rounded">
            🔒 Lv.{building.unlockLevel}
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
  const colorHex = `#${road.color.toString(16).padStart(6, '0')}`

  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      className={`relative flex flex-col items-center p-2 border-3 transition-all ${
        isSelected
          ? 'border-accent-mint bg-accent-mint/20 shadow-button-pressed translate-y-0.5'
          : isUnlocked
            ? 'border-wood-medium bg-bg-card shadow-button hover:border-accent-mint hover:-translate-y-0.5'
            : 'cursor-not-allowed border-wood-light bg-bg-paper/50 opacity-60'
      }`}
    >
      <div
        className="mb-1.5 w-10 h-4 border-2 border-wood-dark rounded"
        style={{ backgroundColor: colorHex }}
      />

      <span className="text-center text-[11px] font-display text-text-primary leading-tight">{road.name}</span>

      <div className="mt-1 flex items-center gap-0.5">
        {road.cost.fuel > 0 ? (
          <>
            <span className="text-[10px]">⛽</span>
            <span
              className={`text-[10px] font-bold ${
                isUnlocked && !canAfford ? 'text-red-500' : 'text-accent-orange'
              }`}
            >
              {road.cost.fuel}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-accent-mint font-bold">免费</span>
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="bg-wood-dark px-1.5 py-0.5 text-[9px] text-white font-display rounded">
            🔒 Lv.{road.unlockLevel}
          </span>
        </div>
      )}
    </button>
  )
}
