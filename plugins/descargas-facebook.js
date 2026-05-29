import fetch from 'node-fetch';

const handler = async (m, { conn, args, text }) => {
    const input = args[0] || text;
    if (!input) return m.reply('🌌 *Shizuku-System* | Ingresa un enlace.');

    const apiUrl = `https://api.alyacore.xyz/dl/facebookv2?url=${encodeURIComponent(input)}&key=𝑺𝒉𝒊𝒛𝒖𝒌𝒖-𝑺𝒚𝒔𝒕𝒆𝒎`;

    try {
        await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } });

        const res = await fetch(apiUrl);
        const json = await res.json();

        
        console.log("RESPUESTA API:", JSON.stringify(json, null, 2));

        if (!json.status) {
            return m.reply(`❌ *Shizuku-System* | ${json.message || 'Error en la API.'}`);
        }

        
        const videoUrl = json.result.url || json.result.video || json.result.link || json.result;

        if (!videoUrl) {
            return m.reply('❌ *Shizuku-System* | No se pudo extraer el enlace del video de la respuesta.');
        }

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: '✨ *Shizuku-System* | Descarga completada.'
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error(e);
        await m.reply('⚠️ *Shizuku-System* | Error de conexión con la API.');
    }
};

handler.command = ['fb', 'facebook'];
export default handler;
