import { toBlob } from 'html-to-image'

export type ExportResult = 'shared' | 'downloaded' | 'cancelled'

export async function exportPosterImage(
  node: HTMLElement,
  filename: string,
  title = '滑雪天气通 · 天气概览图',
): Promise<ExportResult> {
  const blob = await toBlob(node, {
    pixelRatio: 2,
    backgroundColor: '#0b1725',
    cacheBust: true,
  })
  if (!blob) throw new Error('empty image')

  const file = new File([blob], filename, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled'
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
  return 'downloaded'
}
