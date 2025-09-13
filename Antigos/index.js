const { buscarResumoWeb } = require('../src/controllers/request_Api_Ai');
const { perguntarIA } = require('../src/controllers/request_Api_Ai');
const { connectDB } = require('../src/controllers/dbcontroller');
const { buscarInfoLojista } = require('../src/controllers/UserController');
let findWebOrg = "";
// Conexão com o banco de dados MongoDB
const collectionName = '62985835588';  // O nome da coleção pode ser o número de telefone, mas lembre-se de garantir que os nomes de coleção sejam válidos

let respostaIA = "";

// Dados do usuário (cliente)
const numeroCliente = "62998663525";  // Número do cliente que será verificado/registrado
let messageUser = "qual nome daminha irma?"; // messagem do cliente

async function run() {

    // Conectando com o banco de dados
    const db = await connectDB();
    console.log('Conectado com sucesso ao MongoDB');

    
    // buscando informacoes do atendente, para setar ia
    const infolog = await buscarInfoLojista(db,collectionName)
    const infologString = JSON.stringify(infolog); // Convertendo o objeto informacoes lojista para string
    const info = `
      Você é um assistente inteligente com as seguintes características: 
      ${infologString},
  
      Responda diretamente às perguntas do usuário com base nas informações acima:
  
      Se a pergunta for sobre as suas características ou informações pessoais, como nome, idade, cidade, etc., responda com a informação correspondente.
      Se a pergunta não puder ser respondida com base nas informações fornecidas, apenas responda "PesquisaWeb" sem explicações.

      Pergunta do usuário: ${messageUser}
      Historico de conversas:
      
      `;
    console.log(info);
    respostaIA = await perguntarIA(info);
    console.log("respostaIA: ", respostaIA);

    //fazendo request na internet
    //const resultWeb = await buscarResumoWeb(messageUser);
    // Fazendo a requisição para a IA
    respostaIA = perguntarIA(apiUrl, nomeDoModelo, "Resuma essa informação com dados relevantes para 200 caracteres: " + resultWeb)

    console.log("resumo: ")
    findWebOrg = respostaIA.data.response;
    console.log(findWebOrg)


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
      const respostaIA = perguntarIA("Pesquisa na web (Use Caso seja relevante ):" + findWebOrg + messageUserHistory + messageUser)

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

    } else {
      // Se o cliente não existe, criar um novo documento com o número de telefone e registrar a mensagem
      console.log('Cliente não encontrado, criando novo cliente.');
      // Fazendo a requisição para a IA
      const respostaIA = perguntarIA("Pesquisa na web (Use Caso seja relevante ):" + findWebOrg + messageUser)

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
  }

function verificarPronome(pregunta) {
  // Lista de pronomes que indicam que a pergunta é sobre o usuário
  const pronomesUsuario = ['meu', 'minha', 'minha idade', 'eu', 'me', 'nosso', 'nossa', 'meus', 'minhas'];

  // Convertendo a pergunta para minúsculas e dividindo em palavras
  const palavras = pregunta.toLowerCase().split(' ');

  // Verificando se a pergunta contém algum dos pronomes relacionados ao usuário
  for (let i = 0; i < palavras.length; i++) {
    if (pronomesUsuario.includes(palavras[i])) {
      return true; // Retorna 'Historico' se encontrar algum pronome relacionado ao usuário
    }
  }

  return false; // Se não encontrar, pode retornar uma resposta normal
}


run();
