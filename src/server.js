// Importando as dependências
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const verificarToken = require('./middlewares/authMiddleware');
// Importa as rotas dos usuários
const userRoutes = require('./routes/userRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const PORT = 3005;
//const PORT = 3010;


// Criação do servidor Express
const app = express();

// Middleware para fazer parsing do corpo das requisições JSON
app.use(express.json());

// Criação do cliente com a autenticação local
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }, // Ou qualquer configuração do puppeteer que você precise
});

// Permitir CORS para todas as origens (ou especifique a sua)
app.use(cors({
  origin: 'http://localhost:3000', // Permitir requisições do front-end
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Usa as rotas de usuários
app.use('/', userRoutes);
app.use('/api', whatsappRoutes);

// Rota protegida que só poderá ser acessada com um token válido
app.get('/protected', verificarToken, (req, res) => {
  res.send('Você está acessando uma rota protegida!');
});

// Inicia o servidor na porta 3005
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
