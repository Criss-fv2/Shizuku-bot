

const axios = require('axios');
const { reply } = require('../lib/funciones');

let handler = async (m, { conn, text, args }) => {
    if (!text) return reply(m, `⚠️ Ingresa una URL de YouTube\nEjemplo: .play2 https://www.youtube.com/watch?v=xxxxxxxxxxx`);

    // ✅ API ACTUALIZADA COMO SOLICITASTE
    let api = `https://api.alyacore.xyz/dl/ytmp4?url=${encodeURIComponent(text)}&quality=480&key=Shizuku-System`;

    try {
        let res = await axios.get(api);
        let json = res.data;

        // 📥 ESTRUCTURA DE RESPUESTA (SE MANTIENE IGUAL)
        if (!json.status) return reply(m, `❌ ${json.message}\n👤 Creador: ${json.creator}`);

        // ENVÍO DE ARCHIVO SI ES VÁLIDO
        await conn.sendMessage(m.chat, { 
            video: { url: json.data.download }, 
            caption: `🎥 *Título:* ${json.data.title}\n🔗 *Canal:* ${json.data.author}\n⚙️ *Calidad:* 480p` 
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        return reply(m, `❌ Ocurrió un error al procesar la solicitud`);
    }
};

handler.help = ['play2 <url>'];
handler.tags = ['descargas'];
handler.command = /^play2$/i;

module.exports = handler;
