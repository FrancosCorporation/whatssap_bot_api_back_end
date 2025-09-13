const fs = require('fs');
const axios = require('axios');

//const nomeDoModelo = "mistral" // 12 segundos
//const nomeDoModelo = "gemma3:12b" //24 segundos
//const nomeDoModelo = "qwen3:8b" // 21 segundos
const nomeDoModelo = "llama3.2" // 7 segundos
// Função para carregar produtos do JSON
function carregarProdutos() {
  const dados = fs.readFileSync('./produtos.json', 'utf-8');
  return JSON.parse(dados);
}

// Função para gerar prompt com os produtos encontrados
function gerarPrompt(produtos, perguntaUsuario) {
  const contexto = produtos.map(p =>
    `Produto: ${p.nome}\nDescrição: ${p.descricao}\nPreço: ${p.preco}`
  ).join('\n\n');

  return `${contexto}\n\nCom base nesses produtos disponíveis, responda à seguinte pergunta como se fosse um vendedor profissional:\n${perguntaUsuario}`;
}

// Função para chamar o Ollama
async function chamarIA(prompt) {
  try {
    const inicio = Date.now();
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: nomeDoModelo,
      prompt: prompt,
      stream: false
    });

    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log("⏱️ Tempo de resposta:", duracao, "segundos\n");
    console.log("🤖 Resposta da IA:\n", response.data.response);
  } catch (err) {
    console.error("❌ Erro ao chamar IA:", err.message);
  }
}

// Simulação da entrada do usuário
const entradaUsuario = "Descrição produtos";

if (/produtos/i.test(entradaUsuario)) {
  const produtos = carregarProdutos();
  const prompt = gerarPrompt(produtos, entradaUsuario);
  chamarIA(prompt);
} else {
  console.log("🤔 Nenhum gatilho detectado na mensagem.");
}
