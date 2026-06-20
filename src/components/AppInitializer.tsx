/**
 * 应用初始化器
 * 在应用挂载时加载存档并启动自动保存
 */
import { useEffect, type ReactNode } from 'react'
import { initSave, setupAutoSave } from '@/utils/saveManager'

interface AppInitializerProps {
  children: ReactNode
}

export default function AppInitializer({ children }: AppInitializerProps) {
  useEffect(() => {
    initSave()
    setupAutoSave()
  }, [])

  return <>{children}</>
}
