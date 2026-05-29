import fetch from 'node-fetch';

const handler = async (m, { conn, args, text }) => {
    const input = args[0] || text;
    if (!input) return m.reply('🌌 *Shizuku-System* | Ingresa un enlace o término de búsqueda de Facebook.');

    const apiUrl = `https://api.alyacore.xyz/dl/facebookv2?url=${encodeURIComponent(input)}&key=𝑺𝒉𝒊𝒛𝒖𝒌𝒖-𝑺𝒚𝒔𝒕𝒆𝒎`;

    try {
        await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } });

        const res = await fetch(apiUrl);
        const json = await res.json();

        if (!json.status) {
            return m.reply(`❌ *Shizuku-System* | ${json.message || 'Error al procesar la solicitud.'}`);
        }

        const videoUrl = json.result.url || json.result.video; 

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: '✨ *Shizuku-System* | Descarga completada.'
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    } catch (e) {
        await m.reply('⚠️ *Shizuku-System* | Ocurrió un error al conectar con el servidor.');
    }
};

handler.command = ['fb', 'facebook'];
handler.tags = ['descargas'];
export default handler;
