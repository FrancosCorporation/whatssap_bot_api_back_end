const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const axios = require('axios');
const meioDeInteracao = "Preciso que utilize dos paramentro que vou lhe enviar na proxima linha, para ser esse personagem."
const nomePersonagem = "Rodolfo";
const idadePersonagem = "33";
const profissaoPersonagem = "Eng Mecatronico e resolvedor de problemas";
const cidadePersonagem = "Goiania";
const estiloFalaPersonagem = "Atualidade, formal, sem girias, direto ao ponto.";
const tracosPersonalidadePersonagem = "Alegre.";
const prompt2 = `Você é a ${nomePersonagem}, uma ${profissaoPersonagem} de ${idadePersonagem} anos que mora no ${cidadePersonagem}. Seu estilo de fala é ${estiloFalaPersonagem}. Você é ${tracosPersonalidadePersonagem}.`                            

const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});


client.on('message', async message => {
    // Se for uma mensagem de texto e não for do próprio bot
    if (!message.fromMe && !message.hasMedia) {
        const prompt = message.body; // O texto enviado pelo usuário
        //console.log(message)
        //console.log(message.body)
        try {
            const response = await axios.post(
                'http://localhost:11434/api/generate',
                {
                    model: 'llama3',
                    prompt: prompt2+"/n"+prompt,
                    stream: false
                },
                { timeout: 60000 } // 60 segundos
            );

            const resposta = response.data.response;
            //console.log(resposta)
            // Envia a resposta da IA de volta para o WhatsApp
            if (message.from.endsWith('@c.us')) {
                //client.sendMessage(message.from, `${resposta}`);
                console.log(resposta)
            }
            
            //console.log('Resposta enviada:', resposta);
        } catch (err) {
            console.error('Erro na requisição à IA:', err.message);
            client.sendMessage(message.from, `❌ Erro ao consultar a IA.`);
        }
    }

    // Parte de mídia continua funcionando normalmente
     if (message.hasMedia) {
        const media = await message.downloadMedia();

        if (media) {
            const extension = mime.extension(media.mimetype);
            const fileName = `midia_${Date.now()}.${extension}`;
            const filePath = path.join(__dirname, 'downloads', fileName);

            if (!fs.existsSync('downloads')) {
                fs.mkdirSync('downloads');
            }

            fs.writeFileSync(filePath, media.data, { encoding: 'base64' });
            console.log(`📁 Mídia salva: ${filePath}`);
        }
    }
});

client.initialize();
