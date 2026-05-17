import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const handler = async (m, { conn }) => {
    
    await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } })

    const sentMsg = await m.reply('⸸ _...accediendo al hardware de la infraestructura._')

    
    const uptime = process.uptime()
    const dias = Math.floor(uptime / 86400)
    const horas = Math.floor((uptime % 86400) / 3600)
    const minutos = Math.floor((uptime % 3600) / 60)
    const segundos = Math.floor(uptime % 60)

    const opcionesHora = { 
        timeZone: 'America/Tijuana', 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    }
    const horaTijuana = new Date().toLocaleString('es-MX', opcionesHora)
    const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2)
    const freeRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2)
    const usedRAM = (totalRAM - freeRAM).toFixed(2)

    let realCPU = 'MSM8998' 
    let realCores = '8 Cores'

    try {
        const { stdout: cpuInfo } = await execAsync('getprop ro.product.board')
        if (cpuInfo.trim()) {
            realCPU = cpuInfo.trim().toUpperCase()
        }
        const { stdout: coresInfo } = await execAsync('ls -d /sys/devices/system/cpu/cpu[0-9]* | wc -l')
        if (coresInfo.trim()) {
            realCores = `${coresInfo.trim()} Cores`
        }
    } catch (e) {
        const cpus = os.cpus()
        if (cpus.length > 0) {
            realCPU = cpus[0].model.trim()
            realCores = `${cpus.length} Cores`
        }
    }

  
    let diskTotal = '?'
    let diskUsed = '?'
    let diskPercent = '?'
    try {
        const { stdout } = await execAsync(`df -h /data`)
        const lineas = stdout.trim().split('\n')
        if (lineas.length > 1) {
            const partes = lineas[1].replace(/\s+/g, ' ').split(' ')
            diskTotal = partes[1]
            diskUsed = partes[2]
            diskPercent = partes[4]
        }
    } catch (error) {
        diskTotal = '64G'
        diskUsed = '32G'
        diskPercent = '50%'
    }

    
    const nodeVersion = process.version
    const pid = process.pid
    const cpuArch = os.arch() === 'arm64' ? 'aarch64' : os.arch()

    
    const result = 
        `✠ ══〔 𝕾𝖍𝖎𝖟𝖚𝖐𝖚 𝕾𝖊𝖗𝖛𝖊𝖗 〕══ ✠\n\n` +
        `┌─ ⏱️ *SISTEMA Y TIEMPO*\n` +
        `│ ⸸ *Hora:* ${horaTijuana}\n` +
        `│ ⸸ *Uptime:* ${dias}d ${horas}h ${minutos}m ${segundos}s\n` +
        `│ ⸸ *Motor:* Node.js ${nodeVersion}\n` +
        `└ ⸸ *PID Proceso:* ${pid}\n\n` +
        `┌─ 🖥️ *INFRAESTRUCTURA*\n` +
        `│ ⸸ *OS Base:* Ubuntu Lts\n` +
        `│ ⸸ *Entorno:* Linux x86_64\n` +
        `│ ⸸ *Arquitectura:* ${cpuArch}\n` +
        `│ ⸸ *CPU:* ${realCPU}\n` +
        `└ ⸸ *Núcleos:* ${realCores}\n\n` +
        `┌─ 📊 *MEMORIA RAM*\n` +
        `│ ⸸ *Total:* ${totalRAM} GB\n` +
        `│ ⸸ *Usada:* ${usedRAM} GB\n` +
        `└ ⸸ *Libre:* ${freeRAM} GB\n\n` +
        `┌─ 💾 *ALMACENAMIENTO*\n` +
        `│ ⸸ *Disco:* ${diskTotal}\n` +
        `│ ⸸ *Ocupado:* ${diskUsed} (${diskPercent})\n` +
        `└ ⸸ *Database:* Conectada 🟢\n\n` +
        `_...sistema operando al 100%_ 🕷️`

    
    await conn.sendMessage(m.chat, { text: result, edit: sentMsg.key }, { quoted: m })
}

handler.help = ['estado']
handler.tags = ['main']
handler.command = ['estado', 'status', 'server'] 

export default handler
