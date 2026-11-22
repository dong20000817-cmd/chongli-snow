declare const __BUILD_AT__: string

/** 构建时间由 vite.config.ts 的 define 注入，用于在「工具」里显示版本。 */
export const BUILD_AT = typeof __BUILD_AT__ === 'string' ? __BUILD_AT__ : ''

export function buildLabel(): string {
  if (!BUILD_AT) return '本地开发版'
  const d = new Date(BUILD_AT)
  if (Number.isNaN(d.getTime())) return '本地开发版'
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`
}

export type UpdateResult = 'updated' | 'latest' | 'unsupported'

/**
 * 主动检查 Service Worker 更新。
 * 新版本装好后 controllerchange 会触发一次刷新（见 main.tsx），
 * 所以这里只负责“催一下”，不需要自己 reload。
 */
export async function checkForUpdate(): Promise<UpdateResult> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'unsupported'
  let reg: ServiceWorkerRegistration | null = null
  try {
    reg = (await navigator.serviceWorker.getRegistration()) ?? null
  } catch {
    return 'unsupported'
  }
  if (!reg) return 'unsupported'
  try {
    await reg.update()
  } catch {
    return 'unsupported'
  }
  if (reg.installing || reg.waiting) return 'updated'
  await new Promise(r => setTimeout(r, 2500))
  return reg.installing || reg.waiting ? 'updated' : 'latest'
}
