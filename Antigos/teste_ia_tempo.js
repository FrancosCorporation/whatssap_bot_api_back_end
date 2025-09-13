const { execSync } = require('child_process');
const axios = require('axios');
const { gerenciarOllama } = require('./restart_ai');
const perguntaUsuario = " Qual é o nome do instrumento de sopro de madeira com um som característico e melancólico, frequentemente usado em música clássica e jazz?";
//llama3.2:3b modelo de reposta preciso e mais rapido
//Cogito:3b  modelo melhor de reposta preciso e mais rapido

const prompt2 = `
Você é um classificador de perguntas técnicas.  
Dada a pergunta abaixo, retorne a categoria a que ela pertence.  
Use apenas **uma palavra-chave** que represente o **assunto geral** da pergunta.  
Não explique, apenas responda com a categoria.

Pergunta:
${perguntaUsuario}
`;

(async () => {
  await gerenciarOllama();
  await main();
  // continuar somente após o reinício + delay
})();

async function listarModelosOllama() {
  try {
    const output = execSync('ollama list', { encoding: 'utf8' });
    const linhas = output.trim().split('\n').slice(1); // ignora cabeçalho
    return linhas.map(linha => linha.split(/\s+/)[0]); // pega o nome do modelo
  } catch (err) {
    console.error('Erro ao listar modelos Ollama:', err.message);
    return [];
  }
}

async function testarModelo(modelo) {
  const prompt = prompt2;
  const url = 'http://localhost:11434/api/generate';
  const payload = {
    model: modelo,
    prompt: prompt,
    stream: false,
  };

  try {
    const start = Date.now();
    const response = await axios.post(url, payload);
    const end = Date.now();

    const tempo = end - start;
    console.log(`🧠 Modelo: ${modelo}`);
    console.log(`⏱️ Tempo de resposta: ${tempo}ms`);
    console.log(`📤 Resposta: ${response.data.response}`);
    console.log('---------------------------');
  } catch (error) {
    console.error(`❌ Erro ao testar modelo ${modelo}:`, error.message);
  }
}

async function main() {
  const modelos = await listarModelosOllama();

  if (modelos.length === 0) {
    console.log('Nenhum modelo encontrado.');
    return;
  }

  for (const modelo of modelos) {
    await testarModelo(modelo);
  }
}
