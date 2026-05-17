import axios from 'axios'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    // 1. Obtener el texto (ya sea escribiendo al lado del comando o respondiendo a un mensaje)
    let text = args.join(' ')
    if (!text && m.quoted) {
        text = m.quoted.text || m.quoted.caption || ''
    }

    // Si de plano no hay texto por ningún lado, avisa al usuario
    if (!text) {
        return m.reply(`❌ *Error:* Por favor ingresa una pregunta.\n\n*Ejemplo:* ${usedPrefix + command} ¿Cuál es la capital de México?`)
    }

    // Mensaje de espera en cursiva
    m.reply('_Pensando..._')

    try {
        // 2. Codificar la consulta para evitar errores con espacios o caracteres especiales
        let query = encodeURIComponent(text)
        
        // 3. Conexión segura a tu API estable de Copilot
        let response = await axios.get(`https://api.evogb.org/ai/copilot?text=${query}&key=Criss-fv`)
        let res = response.data

        // 4. Enviar la respuesta de vuelta al chat
        if (res && res.status && res.response) {
            await conn.sendMessage(m.chat, { text: res.response }, { quoted: m })
        } else {
            m.reply('⚠️ La IA no devolvió una respuesta válida en este momento.')
        }

    } catch (error) {
        console.error(error)
        m.reply(`❌ *Error:* ${error.message || 'No se pudo conectar con el servidor de la IA.'}`)
    }
}

// Configuración idéntica a la que requería tu bot original
handler.help = ['perl', 'chatgpt']
handler.tags = ['ai']
handler.command = ['chatgpt', 'ia'] // Añadí 'perl' por si tenías usuarios acostumbrados a ese nombre

export default handler
