import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import axios from 'axios'

const UA      = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36'
const MAX_MB  = 95
const MAX_B   = MAX_MB * 1024 * 1024


const KNOWN = {
    'whatsapp':           'com.whatsapp',
    'whatsapp plus':      'com.whatsapp.plus',
    'whatsapp gb':        'com.gbwhatsapp',
    'gbwhatsapp':         'com.gbwhatsapp',
    'gb whatsapp':        'com.gbwhatsapp',
    'whatsapp business':  'com.whatsapp.w4b',
    'telegram':           'org.telegram.messenger',
    'instagram':          'com.instagram.android',
    'tiktok':             'com.zhiliaoapp.musically',
    'spotify':            'com.spotify.music',
    'spotify premium':    'com.spotify.music',
    'youtube':            'com.google.android.youtube',
    'youtube vanced':     'com.vanced.android.youtube',
    'youtube premium':    'com.google.android.youtube',
    'netflix':            'com.netflix.mediaclient',
    'minecraft':          'com.mojang.minecraftpe',
    'free fire':          'com.dts.freefireth',
    'free fire max':      'com.dts.freefiremax',
    'clash of clans':     'com.supercell.clashofclans',
    'clash royale':       'com.supercell.clashroyale',
    'roblox':             'com.roblox.client',
    'pubg':               'com.tencent.ig',
    'pubg mobile':        'com.tencent.ig',
    'capcut':             'com.lemon.lvoverseas',
    'facebook':           'com.facebook.katana',
    'snapchat':           'com.snapchat.android',
    'twitter':            'com.twitter.android',
    'x twitter':          'com.twitter.android',
    'pinterest':          'com.pinterest',
    'shazam':             'com.shazam.android',
    'zoom':               'us.zoom.videomeetings',
    'discord':            'com.discord',
    'chrome':             'com.android.chrome',
    'firefox':            'org.mozilla.firefox',
    'vpn':                'com.expressvpn.vpn',
    'duolingo':           'com.duolingo',
    'canva':              'com.canva.editor',
    'picsart':            'com.picsart.studio',
    'ppsspp':             'org.ppsspp.ppsspp',
    'dolphin':            'org.dolphinemu.dolphinemu',
}

function normalizeQuery(q) {
    return q.toLowerCase().trim().replace(/\s+/g, ' ')
}

function findPackage(q) {
    const norm = normalizeQuery(q)
    // Búsqueda exacta primero
    if (KNOWN[norm]) return KNOWN[norm]
    // Búsqueda parcial — el query contiene la clave
    for (const [key, pkg] of Object.entries(KNOWN)) {
        if (norm.includes(key) || key.includes(norm)) return pkg
    }
    return null
}


async function getByPackage(pkg) {
    const url  = `https://apkpure.net/${pkg.replace(/\./g, '-')}/${pkg}`
    const res  = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 12000 })
    const html = await res.text()
    const $    = cheerio.load(html)

    const name    = $('h1.title-like').first().text().trim() ||
                    $('div.apk-title h1').first().text().trim() ||
                    pkg
    const version = $('span.file-light').first().text().trim() ||
                    $('p.details-sdk span').last().text().trim() || 'N/A'
    const dlBtn   = $('a.da').attr('href') ||
                    $('a[href*="download"]').filter((_, el) => $(el).attr('href')?.includes('.apk')).first().attr('href')

    if (!dlBtn) throw new Error('No se encontró botón de descarga en APKPure.')
    return { name, version, dlUrl: dlBtn.startsWith('http') ? dlBtn : `https://apkpure.net${dlBtn}`, pkg }
}


async function searchAPKPure(query) {
    const url  = `https://apkpure.net/search?q=${encodeURIComponent(query)}`
    const res  = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 12000 })
    const html = await res.text()
    const $    = cheerio.load(html)

    const results = []
    $('div.search-dl, div.apk-list-item, li.search-item').each((_, el) => {
        const name    = $(el).find('p.p1, h4.p1, .title').first().text().trim()
        const pkg     = $(el).find('p.p2, .package-name').first().text().trim()
        const link    = $(el).find('a').first().attr('href')
        if (name && link) results.push({ name, pkg, link: link.startsWith('http') ? link : `https://apkpure.net${link}` })
    })

    
    const norm = normalizeQuery(query)
    results.sort((a, b) => {
        const sa = similarity(normalizeQuery(a.name), norm)
        const sb = similarity(normalizeQuery(b.name), norm)
        return sb - sa
    })

    return results[0] || null
}


async function searchAPKCombo(query) {
    const url  = `https://apkcombo.com/search/${encodeURIComponent(query)}/`
    const res  = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 12000 })
    const html = await res.text()
    const $    = cheerio.load(html)

    const first = $('a.search-item, div.apk-wrap a').first()
    if (!first.length) return null

    const name   = first.find('h2, .title').text().trim() || query
    const href   = first.attr('href')
    const appUrl = href?.startsWith('http') ? href : `https://apkcombo.com${href}`

    
    const res2  = await fetch(appUrl, { headers: { 'User-Agent': UA }, timeout: 12000 })
    const html2 = await res2.text()
    const $2    = cheerio.load(html2)

    const dlUrl = $2('a.download-btn, a[href*=".apk"]').first().attr('href')
    if (!dlUrl) return null

    return { name, dlUrl: dlUrl.startsWith('http') ? dlUrl : `https://apkcombo.com${dlUrl}` }
}


async function resolveDlUrl(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        redirect: 'follow',
        timeout: 20000
    })
    
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application') || ct.includes('octet-stream') || ct.includes('zip')) {
        const size = parseInt(res.headers.get('content-length') || '0', 10)
        return { finalUrl: res.url, size, res }
    }
  
    const html = await res.text()
    const $    = cheerio.load(html)
    const real = $('a[href*=".apk"]').first().attr('href') ||
                 $('a.download').attr('href')
    if (!real) throw new Error('No se pudo resolver la URL de descarga final.')
    return resolveDlUrl(real.startsWith('http') ? real : new URL(real, url).href)
}


function similarity(a, b) {
    if (a === b) return 100
    let match = 0
    const shorter = a.length < b.length ? a : b
    const longer  = a.length < b.length ? b : a
    for (let i = 0; i < shorter.length; i++) if (shorter[i] === longer[i]) match++
    // Bonus si b contiene a
    if (longer.includes(shorter)) match += shorter.length
    return Math.floor((match / longer.length) * 100)
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
const handler = async (m, { conn, args, usedPrefix, command }) => {
    const query = args.join(' ').trim()

    if (!query)
        return m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
            `⸸ Escribe el nombre de la app.\n\n` +
            `› *${usedPrefix}${command} whatsapp*\n` +
            `› *${usedPrefix}${command} minecraft*\n` +
            `› *${usedPrefix}${command} spotify premium*\n\n` +
            `_...si existe, lo consigo._ 🕷️`
        )

    await m.react('🔍')

    try {
        let appInfo = null

        
        const pkg = findPackage(query)
        if (pkg) {
            try {
                appInfo = await getByPackage(pkg)
            } catch {
                appInfo = null
            }
        }

        
        if (!appInfo) {
            const result = await searchAPKPure(query)
            if (result) {
                try {
                    appInfo = await getByPackage(result.pkg || result.link.split('/').pop())
                    if (!appInfo) appInfo = { name: result.name, dlUrl: result.link, version: 'N/A', pkg: result.pkg }
                } catch {
                    appInfo = { name: result.name, dlUrl: result.link, version: 'N/A', pkg: result.pkg }
                }
            }
        }

        
        if (!appInfo) {
            const combo = await searchAPKCombo(query)
            if (combo) appInfo = { ...combo, version: 'N/A', pkg: '' }
        }

        if (!appInfo)
            return m.reply(
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
                `⸸ No encontré *${query}* en ninguna fuente.\n` +
                `_...verifica el nombre e intenta de nuevo._ 🕷️`
            )

        await m.react('⬇️')

        
        const { finalUrl, size, res } = await resolveDlUrl(appInfo.dlUrl)

        const sizeMB = size ? (size / (1024 * 1024)).toFixed(1) : null
        const info   =
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
            `📦 *${appInfo.name}*\n` +
            `🏷️ Versión: ${appInfo.version}\n` +
            (sizeMB ? `💾 Tamaño: ${sizeMB} MB\n` : '') +
            `\n_${global.dev}_ 🕷️`

        
        if (!size || size <= MAX_B) {
            await m.reply(
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
                `⏳ Descargando *${appInfo.name}*...\n` +
                (sizeMB ? `💾 ${sizeMB} MB — puede tardar un momento.\n` : '') +
                `_...blinky está en ello._ 🕷️`
            )

            
            const buffer = Buffer.from(await (await fetch(finalUrl, { headers: { 'User-Agent': UA }, timeout: 60000 })).arrayBuffer())

            const fileName = `${appInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${appInfo.version}.apk`

            await conn.sendMessage(m.chat, {
                document: buffer,
                mimetype: 'application/vnd.android.package-archive',
                fileName,
                caption: info
            }, { quoted: m })

            await m.react('✅')

        } else {
            
            await m.reply(
                `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
                `📦 *${appInfo.name}*\n` +
                `🏷️ Versión: ${appInfo.version}\n` +
                `💾 Tamaño: *${sizeMB} MB* — demasiado grande para enviarlo por aquí.\n\n` +
                `🔗 *Descarga directa:*\n${finalUrl}\n\n` +
                `_WhatsApp tiene límite de ${MAX_MB}MB por archivo._ 🕷️`
            )
            await m.react('⚠️')
        }

    } catch (e) {
        console.error('[APK ERROR]', e.message)
        await m.react('❌')
        m.reply(
            `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 · 𝕬𝕻𝕶 〕══ ✠\n\n` +
            `⸸ Error al obtener el APK.\n` +
            `\`${e.message.slice(0, 200)}\`\n\n` +
            `_...intenta con el nombre exacto de la app._ 🕷️`
        )
    }
}

handler.help    = ['apk <nombre>']
handler.tags    = ['descargas']
handler.command = ['apk', 'apkdl', 'apkd', 'apks']

export default handler
