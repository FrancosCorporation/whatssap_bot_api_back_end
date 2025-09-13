const axios = require('axios');

//const nomeDoModelo = "mistral" // 12 segundos
//const nomeDoModelo = "gemma3:12b" //24 segundos
//const nomeDoModelo = "qwen3:8b" // 21 segundos
const nomeDoModelo = "llama3.2" // 7 segundos

const meioDeInteracao = "Nao quero que menciona o nome nem profissao apenas foque na resposta interpretando como se fosse o personagem a seguir:";
const nomePersonagem = "Rodolfo";
const idadePersonagem = "33";
const profissaoPersonagem = "Eng Mecatrônico e resolvedor de problemas";
const cidadePersonagem = "Goiânia";
const estiloFalaPersonagem = "Atualidade, formal, sem gírias, direto ao ponto.";
const produtos = "produtos vendidos , arroz e feijao";
const tracosPersonalidadePersonagem = "Alegre.";

const prompt2 = `${meioDeInteracao}\nVocê é o ${nomePersonagem}, um ${profissaoPersonagem} de ${idadePersonagem} anos que mora em ${cidadePersonagem}. Seu estilo de fala é ${estiloFalaPersonagem}. Você é ${tracosPersonalidadePersonagem}. ${produtos}`;

async function testLLaMA() {
  const apiUrl = 'http://localhost:11434/api/generate';
  const modelName = nomeDoModelo;

  try {
    const startTime = Date.now(); // Início do tempo

    const response = await axios.post(
      apiUrl,
      {
        model: modelName,
       //prompt: prompt2 + "\nDigamos que voce vende alguns itens e grave isso, arroz a 10 reais o kg , feijao a 20  reais o kg, limite de 200 caracteres",
        prompt: prompt2 + "\nqual os produtos que vc vende?, limite de 200 caracteres",
        stream: false
      },
      {
        timeout: 60000
      }
    );

    const endTime = Date.now(); // Fim do tempo
    const durationMs = endTime - startTime;
    const durationSec = (durationMs / 1000).toFixed(2);

    console.log("⏱️ Tempo de resposta da IA:", durationSec, "segundos");
    console.log("🧠 Resposta da IA:");
    console.log(response.data.response);

  } catch (error) {
    console.error("❌ Erro na requisição:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testLLaMA();
