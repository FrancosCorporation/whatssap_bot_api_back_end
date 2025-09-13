const { MongoClient } = require('mongodb');

// Definindo o nome do banco e a coleção
const dbName = 'WhatssapBot';
const collectionName = '62985835588';  // Nome correto da coleção

// Objeto dinâmico com as informações do atendente
const infoDinamica = {
  numberphone: '62985835588',  // No MongoClient, o número é uma string
  nome: "Rodolfo",
  idade: 35,
  cidade: "Goiania",
  profissao: "Desenvolvedor de Software e vendedor",
  gostaDeCafe: true,
  horaDeAcordar: "08:00",
  frutaFavorita: "Melancia",
  hobby: "Jogos de estratégia",
  produto: "geladeira",
  comidaFavorita: "Pizza",
  redesSociais: ["Instagram", "Twitter"],
  outrasSkills: ["atendimento", "vendas", "desenvolvimento web"]
};

// Função para salvar dados dinamicamente usando MongoClient
async function salvarDadosDinamicamente(dados) {
  const client = await new MongoClient('mongodb://localhost:27017').connect();
  const db = client.db(dbName);  // Selecionando o banco de dados
  const collection = db.collection(collectionName);  // Selecionando a coleção

  try {
    // Atualiza o documento com o número de telefone ou cria um novo se não existir
    const resultado = await collection.findOneAndUpdate(
      { numberphone: dados.numberphone },  // critério de identificação
      { $set: dados },  // dados a salvar
      { upsert: true, returnDocument: 'after' } // cria se não existir, retorna o novo
    );

    console.log('✅ Dados salvos/atualizados com sucesso:');
    console.log(resultado.value);  // Exibe os dados atualizados ou criados
  } catch (erro) {
    console.error('❌ Erro ao salvar dados dinâmicos:', erro);
  } finally {
    await client.close();  // Fechar a conexão com o MongoDB
  }
}

// Chama a função para salvar os dados
salvarDadosDinamicamente(infoDinamica);
