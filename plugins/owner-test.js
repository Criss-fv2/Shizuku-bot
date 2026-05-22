import axios from 'axios'

const APIS = [
  {
    nombre: 'TikTok',
    emoji: '🎵',
    test: async () => {
      const start = Date.now()
      const { data } = await axios.get('https://www.tikwm.com/api/?url=https://www.tiktok.com/@tiktok/video/7106594312292453675', { timeout: 8000 })
      return { ms: Date.now() - start, ok: data?.code === 0 }
    }
  },
  {
    nombre: 'YouTube MP3',
    emoji: '🎵',
    test: async () => {
      const start = Date.now()
      const { data } = await axios.get('https://dv-yer-api.online/ytmp3?mode=link&url=' + encodeURIComponent('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), { timeout: 8000 })
      return { ms: Date.now() - start, ok: !!data?.result?.download_url || !!data?.url || !!data?.link }
    }
  },
  {
    nombre: 'YouTube MP4',
    emoji: '🎬',
    test: async () => {
      const start = Date.now()
      const { data } = await axios.get('https://api-faa.my.id/faa/ytmp4?url=' + encodeURIComponent('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), { timeout: 8000 })
      return { ms: Date.now() - start, ok: !!data?.result?.download_url || !!data?.url || !!data?.link }
    }
  },
  {
    nombre: 'Pinterest',
    emoji: '📌',
    test: async () => {
      const start = Date.now()
      const { status } = await axios.get('https://id.pinterest.com/', { timeout: 8000 })
      return { ms: Date.now() - start, ok: status === 200 }
    }
  }
]

const getEstado = (ok, ms) => {
  if (!ok) return '🕷 Caído'
  if (ms < 1000) return '🕸 Excelente'
  if (ms < 3000) return '🕷 Normal'
  return '🕸 Lento'
}

let handler = async (m, { conn }) => {
  await m.react('🕷')

  const msg = await m.reply(
    `🕷 *${global.botTag}*\n` +
    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
    `🕸 Probando APIs de descarga...\n` +
    `🕷 Esto puede tomar unos segundos\n` +
    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
    `${global.author}`
  )

  const resultados = await Promise.all(
    APIS.map(async (api) => {
      try {
        const { ms, ok } = await api.test()
        return { ...api, ms, ok }
      } catch {
        return { ...api, ms: null, ok: false }
      }
    })
  )

  const funcionando = resultados.filter(r => r.ok).length
  const total = resultados.length

  let texto =
    `🕷 *${global.botTag}*\n` +
    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
    `🕸 *Diagnóstico de descargas*\n\n`

  for (const r of resultados) {
    const estado = getEstado(r.ok, r.ms)
    const tiempo = r.ms ? `${r.ms}ms` : 'sin respuesta'
    texto += `${r.emoji} *${r.nombre}*\n`
    texto += `🕷 Estado: ${estado}\n`
    texto += `🕸 Tiempo: ${tiempo}\n\n`
  }

  texto +=
    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
    `🕷 APIs activas: *${funcionando}/${total}*\n` +
    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
    `${global.author}`

  await conn.sendMessage(m.chat, { text: texto, edit: msg.key }, { quoted: m })
  await m.react(funcionando === total ? '🕸' : '🕷')
}

handler.help = ['test']
handler.tags = ['owner']
handler.command = ['test', 'testapi', 'pingapis']
handler.owner = true

export default handler
