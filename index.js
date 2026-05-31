import './settings.js'
import chalk from 'chalk'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import readlineSync from 'readline-sync'
import { fileURLToPath } from 'url'
import {
  Browsers,
  makeWASocket,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason,
  proto,
  generateWAMessageFromContent,
  generateMessageID,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys'
import { exec } from 'child_process'
import { smsg } from './lib/simple.js'
import { database } from './lib/database.js'
import { handler, loadEvents } from './handler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginsDir = path.join(__dirname, 'plugins')

global.conns = []

const log = {
  info: msg => console.log(chalk.bgBlue.white.bold('INFO'), chalk.white(msg)),
  success: msg => console.log(chalk.bgGreen.white.bold('SUCCESS'), chalk.greenBright(msg)),
  warn: msg => console.log(chalk.bgYellow.red.bold('WARNING'), chalk.yellow(msg)),
  error: msg => console.log(chalk.bgRed.white.bold('ERROR'), chalk.redBright(msg))
}

const s1 = chalk.hex('#e0e0e0')
const s2 = chalk.hex('#a0a0a0')
const s3 = chalk.hex('#606060')
const s4 = chalk.hex('#303030')

const shizukuBanner = `
${s1('🕷 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🕷')}
${s3('    ⠂⠂ ⠂⠟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠂⠂⠂⠂⠂     ')}
${s3('      ⠄⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠆⠄⠂⠂⠂⠂ ⠂⠂')}
${s2('⠂⠂⠂⠂⠂⠆⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠂⠂   ⠂⠂⠆')}
${s2(' ⠂⠂⠄⠆⠟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠏⠆⠄⠂⠂ ⠄')}
${s2('⠂ ⠂⠏⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠆⠄⠂   ')}
${s2(' ⠂⠟⠿⠟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠇⠄⠂⠂⠂')}
${s1(' ⠄⠏ ⠟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠟⠟⠿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠿⠿⠏⠄⠂⠂')}
${s1(' ⠂⠂⠂⠇⠟⣿⣿⣿⣿⣿⣷⣷⣿⣿⣿⣿⣿⠿⠇⠏⠟⣷⠿⠿⠿⣿⣿⣿⣿⣿⣿⣿⠿⠄⠂⠂  ⠂')}
${s1('   ⠂ ⠄⠇⣿⣿⣿⣿⣷⠿⣷⣷⠿⣷⠿⠇⠇⠆⠏⣿⣿⠟⠄⠿⣿⣿⣿⣿⣿⣿⠿⠇⠄⠂⠂⠂⠄')}
${s1('  ⠂  ⠂⠂⠄⠿⣿⣷⣿⠟⠇⣷⠿⠇⠆⠇⠂⠂ ⠄⠄⠂⠄⠆⣷⣿⣿⣿⣿⠿⠏⠇⠂⠂⠄⠄⠄')}
${s2('    ⠂⠂⠂⠏⣿⣿⣷⣿⣿⠏⠂⠂⠄⠂⠂⠂⠂⠂⠂⠂⠂ ⠄⠏⠿⣿⣿⣿⣷⠏⠆⠂    ')}
${s2('      ⠂⠄⠆⠟⣿⣿⣿⣿⣷⠏⠄⠄⠂ ⠂   ⠄⠇⠇⠟⣷⣿⣿⣿⣿⣿⣿⣿⣷⠿⠟⠏')}
${s2('         ⠂⠟⣿⣿⣿⣿⣿⣿⣷⠿⠟⠇⠂⠆⠟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿')}
${s3('      ⠂ ⠄⠄⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿')}
${s3('  ⠂   ⠂⠂⠄⠟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿')}
${s3('⠂    ⠂ ⠄⠇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿')}
${s4(' ⠂⠂⠂⠂⠄⠄⠂⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿')}
${s4('⠂⠂⠄⠄⠄⠂⠄⠄⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿')}
${s1('🕸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🕸')}
${s2('            🕷  ')}${chalk.whiteBright('𝕾 𝖍 𝖎 𝖟 𝖚 𝖐 𝖚  𝕾𝖞𝖘𝖙𝖊𝖒')}${s2('  🕷')}
${chalk.gray('              ⸸  ' + global.botTag + '  ⸸')}
${chalk.gray('         🕸  𝑪𝒓𝒊𝒔𝒔-𝒇𝒗  ·  v' + global.botVersion + '  🕸')}
${s1('🕷 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🕷')}
`

const plugins = new Map()

async function loadPlugins () {
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true })

  const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const filePath = path.join(pluginsDir, file)
      const plugin = (await import(`${filePath}?t=${Date.now()}`)).default
      if (plugin) {
        plugins.set(file, plugin)
        log.success(`Plugin cargado: ${file}`)
      }
    } catch (e) {
      log.error(`Error cargando plugin ${file}: ${e.message}`)
    }
  }

  fs.watch(pluginsDir, async (event, filename) => {
    if (!filename?.endsWith('.js')) return

    const filePath = path.join(pluginsDir, filename)

    try {
      if (fs.existsSync(filePath)) {
        const plugin = (await import(`${filePath}?t=${Date.now()}`)).default
        if (plugin) {
          plugins.set(filename, plugin)
          log.success(`Plugin recargado: ${filename}`)
        }
      } else {
        plugins.delete(filename)
        log.warn(`Plugin eliminado: ${filename}`)
      }
    } catch (e) {
      log.error(`Error recargando plugin ${filename}: ${e.message}`)
    }
  })
}

global.sessionName = global.sessionName || './Sessions/Owner'
try {
  fs.mkdirSync(global.sessionName, { recursive: true })
} catch (e) {
  log.error(`No se pudo crear carpeta de sesión: ${e.message}`)
}

const methodCodeQR = process.argv.includes('--qr')
const methodCode = process.argv.includes('--code')
const DIGITS = s => String(s).replace(/\D/g, '')

function normalizePhone (input) {
  let s = DIGITS(input)
  if (!s) return ''
  if (s.startsWith('0')) s = s.replace(/^0+/, '')
  if (s.length === 10 && s.startsWith('3')) s = '57' + s
  if (s.startsWith('52') && !s.startsWith('521') && s.length >= 12) s = '521' + s.slice(2)
  if (s.startsWith('54') && !s.startsWith('549') && s.length >= 11) s = '549' + s.slice(2)
  return s
}

let opcion = ''
let phoneNumber = ''

if (methodCodeQR) opcion = '1'
else if (methodCode) opcion = '2'
else if (!fs.existsSync('./Sessions/Owner/creds.json')) {
  const sep = chalk.hex('#808080')('🕷' + '━'.repeat(35) + '🕷')
  console.log(`
${sep}
${chalk.whiteBright('   𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖞𝖘𝖙𝖊𝖒  ·  Método de conexión')}
${sep}

  ${chalk.hex('#c0c0c0')('[ 1 ]')}  ${chalk.white('Código QR')}
          ${chalk.gray('Escanea con la cámara de WhatsApp')}

  ${chalk.hex('#c0c0c0')('[ 2 ]')}  ${chalk.white('Código de emparejamiento')}
          ${chalk.gray('Código de 8 dígitos en tu WhatsApp')}

${sep}`)

  opcion = readlineSync.question(chalk.hex('#808080')('  🕸 Elige una opción --> '))

  while (!/^[1-2]$/.test(opcion)) {
    log.error('Solo ingrese 1 o 2.')
    opcion = readlineSync.question(chalk.hex('#808080')('  🕸 Elige una opción --> '))
  }

  if (opcion === '2') {
    const sep2 = chalk.hex('#808080')('🕷' + '━'.repeat(35) + '🕷')
    console.log(`
${sep2}
${chalk.whiteBright('   Ingresa tu número de WhatsApp')}
${chalk.gray('   Formato: +52xxxxxxxxxx / +57xxxxxxxxx')}
${sep2}`)
    const phoneInput = readlineSync.question(chalk.hex('#808080')('  🕸 Número --> '))
    phoneNumber = normalizePhone(phoneInput)
  }
}

async function startBot () {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName)
  const { version } = await fetchLatestBaileysVersion()
  const logger = pino({ level: 'silent' })

  const conn = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async () => '',
    keepAliveIntervalMs: 45000
  })

  global.conn = conn

  conn.decodeJid = jid => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {}
      return decode.user && decode.server ? decode.user + '@' + decode.server : jid
    }
    return jid
  }


  // sendAlbumMessage — álbum atómico inmune a mensajes externos
  conn.sendAlbumMessage = async (jid, items, opts = {}) => {
    const ms = Date.now()
    const mediaMessages = await Promise.all(
      items.map(async (item, i) => {
        const isVideo = !!item.video
        const media = await prepareWAMessageMedia(
          isVideo ? { video: item.video } : { image: item.image },
          { upload: conn.waUploadToServer }
        )
        const msg = isVideo
          ? proto.Message.fromObject({ videoMessage: { ...media.videoMessage, caption: item.caption || '' } })
          : proto.Message.fromObject({ imageMessage: { ...media.imageMessage, caption: item.caption || '' } })
        return {
          key: { remoteJid: jid, id: generateMessageID(), fromMe: true },
          message: msg,
          messageTimestamp: Math.floor(ms / 1000) + i
        }
      })
    )

    const albumMsg = generateWAMessageFromContent(jid, {
      messageContextInfo: {},
      albumMessage: {
        expectedImageCount: mediaMessages.filter(m => m.message.imageMessage).length,
        expectedVideoCount: mediaMessages.filter(m => m.message.videoMessage).length
      }
    }, { userJid: conn.user.jid, quoted: opts.quoted })

    await conn.relayMessage(jid, albumMsg.message, { messageId: albumMsg.key.id })

    for (const m of mediaMessages) {
      m.message.imageMessage && (m.message.imageMessage.contextInfo = { associatedSequenceNumber: albumMsg.key.id ? 1 : 1 })
      await conn.relayMessage(jid, m.message, { messageId: m.key.id })
    }

    return albumMsg
  }

  conn.ev.on('creds.update', saveCreds)

  if (opcion === '2' && !fs.existsSync('./Sessions/Owner/creds.json')) {
    setTimeout(async () => {
      try {
        if (!state.creds.registered) {
          const pairing = await conn.requestPairingCode(phoneNumber)
          const code = pairing?.match(/.{1,4}/g)?.join('-') || pairing
          const sepCode = chalk.hex('#808080')('🕷' + '━'.repeat(35) + '🕷')
          console.log(`\n${sepCode}\n${chalk.whiteBright('   🕸  Código de emparejamiento')}\n${sepCode}\n\n       ${chalk.whiteBright(code)}\n\n${chalk.gray('   Abre WhatsApp → Dispositivos vinculados')}\n${chalk.gray('   → Vincular dispositivo → Ingresar código')}\n${sepCode}\n`)
        }
      } catch (e) {
        log.error(`Error al generar código: ${e.message}`)
      }
    }, 3000)
  }

  conn.ev.on('connection.update', async update => {
    const { qr, connection, lastDisconnect } = update

    if (qr && opcion === '1') {
      const sepQR = chalk.hex('#808080')('🕷' + '━'.repeat(35) + '🕷')
      console.log(`\n${sepQR}\n${chalk.whiteBright('   🕸  Escanea el código QR')}\n${chalk.gray('   Abre WhatsApp → Dispositivos vinculados')}\n${sepQR}\n`)
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
  console.log(shizukuBanner)
  log.success(`Conectado como: ${conn.user?.name || 'Desconocido'}`)
  log.info(`Plugins cargados: ${plugins.size}`)
  await loadEvents(conn)
  // 🕷 Aviso de reinicio exitoso
  try {
    const { RESTART_FILE } = await import('./plugins/owner-restart.js')
    if (fs.existsSync(RESTART_FILE)) {
      const data = JSON.parse(fs.readFileSync(RESTART_FILE, 'utf-8'))
      const tiempo = Math.round((Date.now() - data.time) / 1000)
      await conn.sendMessage(data.chat, {
        text: `🕷 *${global.botTag}*\n\n🕸 Sistema reiniciado correctamente\n🕷 Tiempo: ${tiempo} segundos\n\n${global.dev}`
      })
      fs.unlinkSync(RESTART_FILE)
    }
  } catch {}
}

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode

      if ([
        DisconnectReason.connectionLost,
        DisconnectReason.connectionClosed,
        DisconnectReason.restartRequired,
        DisconnectReason.timedOut,
        DisconnectReason.badSession
      ].includes(reason)) {
        log.warn(`Reconectando... (${reason})`)
        startBot()
      } else if (reason === DisconnectReason.loggedOut) {
        log.warn('Sesión cerrada. Eliminando sesión...')
        exec('rm -rf ./Sessions/Owner/*')
        process.exit(1)
      } else if (reason === DisconnectReason.forbidden) {
        log.error('Acceso denegado. Eliminando sesión...')
        exec('rm -rf ./Sessions/Owner/*')
        process.exit(1)
      } else if (reason === DisconnectReason.multideviceMismatch) {
        log.warn('Multidispositivo no coincide. Reiniciando...')
        exec('rm -rf ./Sessions/Owner/*')
        process.exit(0)
      } else {
        log.error(`Desconexión desconocida: ${reason}`)
        startBot()
      }
    }
  })

  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return
      let m = messages[0]
      if (!m?.message) return

      if (Object.keys(m.message)[0] === 'ephemeralMessage') {
        m.message = m.message.ephemeralMessage.message
      }

      if (m.key?.remoteJid === 'status@broadcast') return
      if (m.key?.id?.startsWith('BAE5') && m.key.id.length === 16) return

      m = await smsg(conn, m)
      await handler(m, conn, plugins)
    } catch (e) {
      log.error(`Error en mensaje: ${e.message}`)
    }
  })
}

;(async () => {
  const sepInit = chalk.hex('#808080')('🕷' + '━'.repeat(35) + '🕷')
  console.log(`\n${sepInit}\n${chalk.whiteBright('   🕸  Iniciando ' + global.botName + '...')}\n${chalk.gray('   ' + global.dev)}\n${sepInit}\n`)
  await database.read()
  log.success('Base de datos cargada.')
  await loadPlugins()
  global.plugins = plugins
  await startBot()
})()
