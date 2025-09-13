const { MongoClient } = require('mongodb');
const axios = require('axios');

// Conexão com o banco de dados MongoDB
const client = new MongoClient('mongodb://localhost:27017');
// Nome do modelo de IA (você pode configurar para o modelo de sua escolha)
const nomeDoModelo = 'Cogito'; // Aqui você pode configurar o modelo de IA que usar
// DB
const dbName = 'WhatssapBot';
const collectionName = '62985835588';  // O nome da coleção pode ser o número de telefone, mas lembre-se de garantir que os nomes de coleção sejam válidos


// Dados do usuário (isso seria inserido no banco de dados)
const InfoLojista = {
  numberphone: collectionName,
  nome: "Rodolfo",
  idade: 33,
  cidade: "Goiania",
  profissao: "Desenvolvedor de Software",
  gostaDeCafe: true,
  horaDeAcordar: "08:00",
  frutaFavorita: "Melancia",
  hobby: "Jogos de estratégia",
  comidaFavorita: "Pizza",
  redesSociais: ["Instagram", "Twitter"]
};

// Dados do usuário (cliente)
const numeroCliente = "62998663525";  // Número do cliente que será verificado/registrado
const messageUser = `Qual a previsao temp goianira?`; // messagem do cliente

async function run() {
  try {
    // Conectando com o banco de dados
    const startTimeDBConnection = Date.now(); // Início da conexão com o banco de dados
    await client.connect();
    const endTimeDBConnection = Date.now(); // Fim da conexão com o banco de dados
    console.log('Conectado com sucesso ao MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Verificar se o cliente já existe no banco de dados
    const consulta = await collection.findOne({ numberphone: numeroCliente });

    if (consulta) {
      // Se o cliente existe, podemos pegar os dados dele
      console.log('Cliente encontrado:', consulta);

      // Montando o histórico de conversas
      let historicoDeConversas = "";
      consulta.conversas.forEach((conversa) => {
        historicoDeConversas += `Mensagem: ${conversa.mensagem}\n`;
      });

      // Criando um prompt para a IA com base nas informações do cliente
      const messageUserHistory = `
        Aqui está o histórico de conversas com o cliente:
        ${historicoDeConversas}
        Não utilize as perguntas do historico para serem respondidas, preciso que foque na pergunta a partir daqui:
      `;

      // Fazendo a requisição para a IA
      const apiUrl = 'http://localhost:11434/api/generate'; // Altere conforme a URL da sua IA
      try {
        const respostaIA = await axios.post(apiUrl, {
          model: nomeDoModelo,
          prompt: messageUserHistory+"/n"+messageUser,
          stream: false
        });

        // Exibindo a resposta da IA
        console.log("Resposta da IA:", respostaIA.data.response);

        // Agora, você pode fazer a atualização de conversa como antes, se necessário
        // Caso precise adicionar uma nova conversa ao histórico
        const updateResult = await collection.updateOne(
          { numberphone: numeroCliente },
          {
            $push: {  // $push adiciona a nova mensagem à lista de conversas
              conversas: {
                data: new Date().toISOString(),
                mensagem: messageUser
              }
            }
          }
        );
      } catch (erro) {
        console.error("Erro ao interagir com a IA:", erro);
      }
    } else {
      // Se o cliente não existe, criar um novo documento com o número de telefone e registrar a mensagem
      console.log('Cliente não encontrado, criando novo cliente.');

      // Fazendo a requisição para a IA
      const apiUrl = 'http://localhost:11434/api/generate'; // Altere conforme a URL da sua IA
      try {
        const respostaIA = await axios.post(apiUrl, {
          model: nomeDoModelo,
          prompt: messageUser,
          stream: false
        });

      const novoCliente = {
        numberphone: numeroCliente,
        conversas: [
          {
            data: new Date().toISOString(),
            mensagem: messageUser,
          }
        ]
      };

      const resultado = await collection.insertOne(novoCliente);
      console.log('Novo cliente adicionado com sucesso:', resultado.insertedId);
      // Exibindo a resposta da IA
      console.log("Resposta da IA:", respostaIA.data.response);
    }
    catch (err) {
      console.error('erro ao inserir cliente novo com mensagems novas:', err);
    } 
    }

  } catch (err) {
    console.error('Erro ao conectar ou operar no MongoDB:', err);
  } finally {
    await client.close();
  }
}

run();
