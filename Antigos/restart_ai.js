const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const contadorPath = path.join(__dirname, 'contador.txt');

// Função para esperar
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para ler o contador
function lerContador() {
  if (!fs.existsSync(contadorPath)) {
    fs.writeFileSync(contadorPath, '0', 'utf8');
  }
  const valor = parseInt(fs.readFileSync(contadorPath, 'utf8'));
  return isNaN(valor) ? 0 : valor;
}

// Função para escrever o contador
function escreverContador(valor) {
  fs.writeFileSync(contadorPath, valor.toString(), 'utf8');
}

// Função para reiniciar o Ollama
async function reiniciarOllama() {
  console.log('🔁 Reiniciando Ollama...');

  // Mata o processo
  await new Promise((resolve, reject) => {
    exec('taskkill /F /IM ollama.exe', (err) => {
      if (err) {
        console.error('❌ Erro ao matar o Ollama:', err);
        reject(err);
      } else {
        console.log('✅ Ollama finalizado.');
        resolve();
      }
    });
  });

  // Aguarda brevemente antes de iniciar
  await esperar(1000);

  // Inicia o processo novamente
  await new Promise((resolve, reject) => {
    exec('start ollama', (err) => {
      if (err) {
        console.error('❌ Erro ao iniciar o Ollama:', err);
        reject(err);
      } else {
        console.log('🚀 Ollama iniciado novamente.');
        console.log('---------------------------');
        resolve();
      }
    });
  });

  // Aguarda 6 segundos antes de seguir
  await esperar(6000);
}

// Função principal do controle
async function gerenciarOllama() {
  const contador = lerContador();

  if (contador >= 14) {
    escreverContador(0);
    await reiniciarOllama(); // Aguarda o reinício completo com delay
  } else {
    escreverContador(contador + 1);
    console.log(`🧮 Incrementando contador: ${contador + 1}`);
  }
}

module.exports = {
  gerenciarOllama,
};
