const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async message => {
    // Verifica se há mídia (áudio, imagem, etc.)
    if (message.hasMedia) {
        const media = await message.downloadMedia();

        if (media) {
            // Descobre a extensão correta (ex: .jpg, .mp3)
            const extension = mime.extension(media.mimetype);

            // Gera um nome único com timestamp
            const fileName = `midia_${Date.now()}.${extension}`;

            // Caminho para salvar o arquivo
            const filePath = path.join(__dirname, 'downloads', fileName);

            // Garante que a pasta existe
            if (!fs.existsSync('downloads')) {
                fs.mkdirSync('downloads');
            }

            // Salva o arquivo em base64
            fs.writeFileSync(filePath, media.data, { encoding: 'base64' });

            console.log(`📁 Arquivo salvo: ${filePath}`);
        }
    } else {
        console.log(`Mensagem sem mídia: ${message.body}`);
    }
});

client.initialize();
