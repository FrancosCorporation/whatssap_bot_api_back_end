const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { exec } = require('child_process');

// Caminho do áudio original
const inputAudio = path.resolve(__dirname, 'downloads/audio_1746143213205.oga'); // Substitua pelo seu arquivo .oga
const outputWav = inputAudio.replace(/\.\w+$/, '.wav');

// 1. Converter para WAV
function converterParaWav(input, output) {
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .toFormat('wav')
            .on('end', () => {
                console.log('✔️ Convertido para WAV:', output);
                resolve(output);
            })
            .on('error', reject)
            .save(output);
    });
}

// 2. Transcrever com Whisper
function transcreverComPython(audioWav) {
    return new Promise((resolve, reject) => {
        const comando = `python transcribe_audio.py "${audioWav}"`;
        exec(comando, (error, stdout, stderr) => {
            if (error) {
                console.error("Erro ao executar Python:", error);
                return reject(stderr || error.message);
            }
            if (stderr) {
                console.warn("Aviso:", stderr);
            }
            console.log("📝 Transcrição:\n", stdout.trim());
            resolve(stdout.trim());
        });
    });
}

// Execução principal
(async () => {
    try {
        const wav = await converterParaWav(inputAudio, outputWav);
        await transcreverComPython(wav);
    } catch (err) {
        console.error("❌ Erro:", err);
    }
})();
