const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

const client = new Client();

// ===== Configuração do Personagem =====
const meioDeInteracao = "Nao quero que mencione o nome nem profissão apenas foque na resposta interpretando como se fosse o personagem a seguir";
const nomePersonagem = "Rodolfo";
const idadePersonagem = "33";
const profissaoPersonagem = "Eng Mecatrônico e resolvedor de problemas";
const cidadePersonagem = "Goiânia";
const estiloFalaPersonagem = "Atualidade, formal, sem gírias, direto ao ponto.";
const tracosPersonalidadePersonagem = "Alegre.";
const prompt2 = `${meioDeInteracao}\nVocê é o ${nomePersonagem}, um ${profissaoPersonagem} de ${idadePersonagem} anos que mora em ${cidadePersonagem}. Seu estilo de fala é ${estiloFalaPersonagem}. Você é ${tracosPersonalidadePersonagem}.`;
const apiUrl = 'http://localhost:11434/api/generate';
const modelName = 'llama3.2'; // Altere para o nome do seu modelo da IA

// Cria pasta de downloads se não existir
if (!fs.existsSync('downloads')) {
    fs.mkdirSync('downloads');
}

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async message => {
    // TEXTOS
    client.sendTyping(message.from); // Envia o "digitando..."
    if (!message.fromMe && !message.hasMedia) {
        const prompt = message.body;

        try {
            const response = await axios.post(
                apiUrl,
                {
                    model: modelName,
                    prompt: `${prompt2}\n${prompt}`,
                    stream: false
                },
                { timeout: 60000 }
            );

            const resposta = response.data.response;
            
            client.sendMessage(message.from, resposta);
        } catch (err) {
            console.error('Erro IA:', err.message);
            client.sendMessage(message.from, `❌ Erro ao consultar a IA.`);
        }
    }

    // MÍDIAS (ÁUDIO)
    if (message.hasMedia) {
        const media = await message.downloadMedia();
        if (!media) return;

        const extension = mime.extension(media.mimetype);
        const fileName = `audio_${Date.now()}.${extension}`;
        const filePath = path.join(__dirname, 'downloads', fileName);
        fs.writeFileSync(filePath, media.data, { encoding: 'base64' });

        if (extension === 'oga' || extension === 'opus') {
            try {
                const wavPath = await converterOgaParaWav(filePath);
                const texto = await transcreverComWhisper(wavPath);

                const response = await axios.post(
                    apiUrl,
                    {
                        model: modelName,
                        prompt: `${prompt2}\n${texto}`,
                        stream: false
                    },
                    { timeout: 60000 }
                );

                const resposta = response.data.response;
                client.sendMessage(message.from, resposta);
            } catch (err) {
                console.error("Erro ao processar áudio:", err.message);
                client.sendMessage(message.from, `❌ Erro ao processar o áudio.`);
            }
        }
    }
});

client.initialize();

// === Funções auxiliares ===

function converterOgaParaWav(inputPath) {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace(/\.\w+$/, '.wav');
        ffmpeg(inputPath)
            .toFormat('wav')
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .save(outputPath);
    });
}

function transcreverComWhisper(caminhoAudio) {
    return new Promise((resolve, reject) => {
      exec(`python transcribe_audio.py "${caminhoAudio}"`, (error, stdout, stderr) => {
        if (error) {
            console.error("Erro ao executar Python:", error);
            console.error("stderr:", stderr); // Agora estamos capturando stderr, que pode conter mais informações úteis
            return reject(stderr || error.message);
        }
        if (stderr) {
            console.error("stderr:", stderr); // Adicionando esta linha para capturar erros adicionais
        }
        console.log("Transcrição:", stdout); // Verifique a transcrição gerada
        resolve(stdout.trim());
    });
    
    });
}
