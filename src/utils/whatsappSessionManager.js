// utils/whatsappSessionManager.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

class WhatsAppSessionManager {
  constructor() {
    this.clients = {}; // Armazenar clientes por email ou id do usuário
  }

  // Cria o cliente WhatsApp para um usuário, utilizando o token para identificação
  async createClient(userId, onQr, onReady, onMessage) {
    // Verifica se já existe uma sessão ativa para o usuário
    if (this.clients[userId]) {
      return this.clients[userId]; // Retorna o cliente se já existe
    }

    // Criação de um novo cliente com base no userId (email ou outro identificador único)
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: userId, // Usando o userId para isolar sessões por usuário
        dataPath: path.join(__dirname, '..', 'sessions'),
      }),
      puppeteer: { headless: true, args: ['--no-sandbox'] },
    });

    // Registrando os eventos do cliente
    client.on('qr', onQr); // Evento QR code gerado
    client.on('ready', onReady); // Evento de prontidão da sessão
    client.on('message', onMessage); // Evento de recebimento de mensagem
    client.on('authenticated', () => console.log(`Cliente ${userId} autenticado`));
    client.on('auth_failure', (msg) => console.error(`Erro de autenticação para ${userId}: ${msg}`));

    // Inicializando o cliente
    client.initialize();

    // Armazenando o cliente na coleção de clientes
    this.clients[userId] = client;

    return client;
  }

  // Retorna o cliente associado a um usuário
  getClient(userId) {
    return this.clients[userId];
  }
}

module.exports = new WhatsAppSessionManager();
