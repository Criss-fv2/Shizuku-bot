const handler = async (m, { conn, db }) => {
    try {
    
        await m.react('🏳️‍🌈')

        let who
        if (m.mentionedJid?.length > 0) {
            who = m.mentionedJid[0]
        } else if (m.quoted) {
            who = m.quoted.sender
        } else {
            who = m.sender
        }

        
        if (who.endsWith('@lid') || isNaN(who.split('@')[0])) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const found = groupMeta.participants.find(p => p.id === who || p.lid === who)
                if (found?.jid) who = found.jid
            } catch {}
        }

    
        const getName = (jid) => db.users?.[jid]?.name || jid.split('@')[0]
        let name = getName(who)

        // Calcular porcentaje (0% a 500%)
        const porcentaje = Math.floor(Math.random() * 501)

        // Definir frase según el resultado
        let frase
        if (porcentaje < 100) frase = "🌱 Apenas un toque sutil..."
        else if (porcentaje < 200) frase = "🌈 Con estilo y actitud..."
        else if (porcentaje < 300) frase = "🔥 Brillando con orgullo..."
        else if (porcentaje < 400) frase = "💃 Desbordando energía arcoíris..."
        else frase = "💖 ¡Explosión total de arcoíris, nivel legendario!"

        
        let { key } = await conn.sendMessage(m.chat, { text: "🏳️‍🌈 *Escaneando...* 0%\n░░░░░░░░░░" }, { quoted: m })

        const pasos = [
            "🏳️‍🌈 *Cargando...* 20%\n██░░░░░░░░",
            "🏳️‍🌈 *Cargando...* 40%\n████░░░░░░",
            "🏳️‍🌈 *Cargando...* 60%\n██████░░░░",
            "🏳️‍🌈 *Cargando...* 80%\n████████░░",
            "🏳️‍🌈 *¡COMPLETADO!* 100%\n██████████"
        ]

        for (let i = 0; i < pasos.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500))
            await conn.sendMessage(m.chat, { text: pasos[i], edit: key })
        }

        
        await conn.sendMessage(m.chat, { delete: key })

        // 3. Enviar el resultado
        await conn.sendMessage(m.chat, { 
            video: { url: 'https://files.catbox.moe/7lvpbf.mp4' }, 
            gifPlayback: false,
            caption: `🏳️‍🌈 *RESULTADO FINAL*\n\n🧐 @${who.split('@')[0]} (*${name}*) es *${porcentaje}%* Gay.\n\n_${frase}_`, 
            mentions: [who]
        }, { quoted: m })

    } catch (e) {
        console.error("Error en comando gay:", e)
        await m.react('⚠️')
        m.reply(`⚠️ Hubo un error al procesar el escaneo.`)
    }
}

handler.help = ['gay @tag', 'gaytest @tag']
handler.tags = ['anime']
handler.command = ['gay', 'gaytest', 'esgay', 'medidor']
handler.group = true

export default handler
