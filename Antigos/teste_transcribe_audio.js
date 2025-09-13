const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const player = require('play-sound')();

// Texto para converter
const texto = 'construir uma mentalidade de abundância que permeie todas as áreas da vida.';

// Envia requisição para gerar o áudio
fetch('https://ttsmp3.com/makemp3_new.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    msg: texto,
    lang: 'Camila', // Voz brasileira do site
    source: 'ttsmp3',
  }),
})
  .then(res => res.json())
  .then(async data => {
    const audioUrl = data.URL;

    if (audioUrl) {
      console.log('Baixando áudio de:', audioUrl);

      // Caminho local para salvar
      const outputPath = path.join(__dirname, 'saida.mp3');

      // Faz o download do áudio e salva
      const response = await fetch(audioUrl);
      const buffer = await response.buffer();
      fs.writeFileSync(outputPath, buffer);
      console.log('Áudio salvo em:', outputPath);

      // Reproduz localmente
      player.play(outputPath, err => {
        if (err) console.error('Erro ao tocar áudio:', err);
      });
    } else {
      console.error('Erro: Nenhum áudio foi retornado');
    }
  })
  .catch(err => console.error('Erro ao gerar o áudio:', err));
