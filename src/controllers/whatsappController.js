const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getCollection } = require('./dbController');
const clients = require('../models/clients'); // Centraliza sessões

const whatsappController = {

  startSession: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Token não fornecido ou mal formatado' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const email = decoded.email;

      if (!email) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (clients[email]) {
        return res.status(200).json({ message: 'Sessão já iniciada para este usuário' });
      }

      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: email.replace(/[^a-zA-Z0-9_-]/g, '_'),
          dataPath: path.join(__dirname, '..', 'sessions'),
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox'],
        },
      });

      clients[email] = client;
      let responded = false;

      client.on('qr', async (qr) => {
        if (responded) return;
        responded = true;
        const qrImage = await qrcode.toDataURL(qr);
        res.status(200).json({ qr: qrImage });
      });

      client.on('authenticated', () => {
        console.log(`Cliente ${email} autenticado`);
      });

      client.on('ready', async () => {
        console.log(`Cliente ${email} está pronto`);

        const userNumber = client.info?.wid?.user;
        if (userNumber) {
          const usersCollection = await getCollection('users');
          await usersCollection.updateOne(
            { email },
            { $set: { whatsappNumber: userNumber } }
          );
          console.log(`Número ${userNumber} associado ao usuário ${email}`);
        }
      });

      client.on('auth_failure', (msg) => {
        console.error(`Erro de autenticação para ${email}: ${msg}`);
        delete clients[email];
        if (!responded) {
          responded = true;
          res.status(401).json({ message: 'Erro de autenticação', error: msg });
        }
      });

      client.on('disconnected', (reason) => {
        console.log(`Cliente ${email} desconectado: ${reason}`);
        delete clients[email];
      });

      client.initialize();

      setTimeout(() => {
        if (!responded) {
          responded = true;
          res.status(408).json({ message: 'Tempo de resposta do QR expirado' });
        }
      }, 15000);

    } catch (error) {
      console.error('Erro na sessão do WhatsApp:', error);
      res.status(500).json({ message: 'Erro interno', error: error.message });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const email = decoded?.email;

      if (!email) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const client = clients[email];
      if (!client) {
        return res.status(400).json({ message: 'Sessão do WhatsApp não encontrada' });
      }

      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ message: 'Destinatário e mensagem são obrigatórios' });
      }

      const formatNumber = (number) => {
        return number.includes('@') ? number : `${number}@c.us`;
      };

      const formattedTo = formatNumber(to);
      const msg = await client.sendMessage(formattedTo, message);

      res.status(200).json({
        message: 'Mensagem enviada com sucesso',
        id: msg.id._serialized,
        to: formattedTo,
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ message: 'Erro interno ao enviar mensagem', error: error.message });
    }
  },

  checkSessionStatus: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) return res.status(401).json({ authenticated: false });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const email = decoded?.email;
      const client = clients[email];

      if (client && client.info?.wid?.user) {
        return res.status(200).json({ authenticated: true });
      }

      return res.status(200).json({ authenticated: false });

    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
      return res.status(500).json({ authenticated: false });
    }
  }

};

module.exports = whatsappController;
