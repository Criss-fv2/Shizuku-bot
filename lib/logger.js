import fs from 'fs'
import path from 'path'

const logDir = './logs'
const logFile = path.join(logDir, 'bot.log')

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)

export function writeLog(tipo, usuario, comando, detalle = '') {
  const fecha = new Date().toLocaleString('es-MX')
  const linea = `[${fecha}] [${tipo}] Usuario: ${usuario} | Comando: ${comando}${detalle ? ' | ' + detalle : ''}\n`
  fs.appendFileSync(logFile, linea)
}

export function readLogs(cantidad = 20) {
  if (!fs.existsSync(logFile)) return 'No hay logs aún.'
  const lineas = fs.readFileSync(logFile, 'utf-8').trim().split('\n')
  return lineas.slice(-cantidad).join('\n')
}
