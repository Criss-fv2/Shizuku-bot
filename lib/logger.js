import fs from 'fs'
import path from 'path'

const logDir  = './logs'
const logFile = path.join(logDir, 'bot.log')
const MAX_SIZE = 2 * 1024 * 1024  // 2MB máximo
const MAX_LINES = 500              // máximo 500 líneas al rotar

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)

function rotateLogs() {
    try {
        if (!fs.existsSync(logFile)) return
        const size = fs.statSync(logFile).size
        if (size < MAX_SIZE) return

        // Guardar solo las últimas 500 líneas
        const lineas = fs.readFileSync(logFile, 'utf-8').trim().split('\n')
        const recientes = lineas.slice(-MAX_LINES)
        fs.writeFileSync(logFile, recientes.join('\n') + '\n')
    } catch {}
}

export function writeLog(tipo, usuario, comando, detalle = '') {
    rotateLogs()
    const fecha = new Date().toLocaleString('es-MX')
    const linea = `[${fecha}] [${tipo}] Usuario: ${usuario} | Comando: ${comando}${detalle ? ' | ' + detalle : ''}\n`
    fs.appendFileSync(logFile, linea)
}

export function readLogs(cantidad = 20) {
    if (!fs.existsSync(logFile)) return 'No hay logs aún.'
    const lineas = fs.readFileSync(logFile, 'utf-8').trim().split('\n')
    return lineas.slice(-cantidad).join('\n')
}

