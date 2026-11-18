/** YouTube bağlantısından video kimliği (watch, youtu.be, shorts, embed, live) */
export function youTubeId(url?: string | null): string | null {
  if (!url || !/youtu\.?be/.test(url)) return null
  const m = url.match(/(?:youtu\.be\/|[?&]v=|shorts\/|embed\/|live\/)([\w-]{11})/)
  return m ? m[1] : null
}
