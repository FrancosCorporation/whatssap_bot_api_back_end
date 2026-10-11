const fs = require('node:fs');
const path = require('node:path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const config = require('../config/env');
const { getCollection } = require('./dbController');
const clients = require('../models/clients');

const sessionsPath = path.resolve(__dirname, '..', 'sessions');

function clientIdForEmail(email) {
  return email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function browserEnvironment() {
  const allowedNames = [
    'PATH', 'Path', 'HOME', 'USERPROFILE', 'TMPDIR', 'TMP', 'TEMP',
    'LANG', 'LC_ALL', 'LD_LIBRARY_PATH', 'SYSTEMROOT', 'SystemRoot',
  ];
  return Object.fromEntries(
    allowedNames
      .filter((name) => process.env[name])
      .map((name) => [name, process.env[name]]),
  );
}

function notify(record) {
  const waiters = [...record.waiters];
  record.waiters.clear();
  for (const resolve of waiters) resolve();
}

function removeIfCurrent(email, record) {
  if (clients.get(email) === record) clients.delete(email);
}

function createClient(email) {
  fs.mkdirSync(sessionsPath, { recursive: true, mode: 0o700 });

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: clientIdForEmail(email),
      dataPath: sessionsPath,
    }),
    puppeteer: {
      headless: true,
      ...(config.puppeteerExecutablePath ? { executablePath: config.puppeteerExecutablePath } : {}),
      env: browserEnvironment(),
      args: ['--disable-http2'],
    },
  });

  const record = { client, status: 'connecting', qr: null, waiters: new Set() };
  clients.set(email, record);

  client.on('qr', (qr) => {
    record.qr = qr;
    record.status = 'awaiting_qr';
    notify(record);
  });

  client.on('authenticated', () => {
    record.status = 'authenticated';
  });

  client.on('ready', () => {
    record.status = 'ready';
    record.qr = null;
    notify(record);

    const phoneNumber = client.info?.wid?.user;
    if (!phoneNumber) return;
    void getCollection('users')
      .then((users) => users.updateOne({ email }, { $set: { whatsappNumber: phoneNumber } }))
      .catch((error) => {
        console.error('[WhatsApp] Could not persist account status:', error.name, error.code || 'unknown');
      });
  });

  client.on('auth_failure', () => {
    record.status = 'failed';
    record.qr = null;
    notify(record);
    removeIfCurrent(email, record);
    void client.destroy().catch(() => {});
  });

  client.on('disconnected', () => {
    record.status = 'disconnected';
    record.qr = null;
    notify(record);
    removeIfCurrent(email, record);
  });

  void client.initialize().catch((error) => {
    record.status = 'failed';
    record.qr = null;
    notify(record);
    removeIfCurrent(email, record);
    console.error('[WhatsApp] Client initialization failed:', error.name, error.code || 'unknown');
    void client.destroy().catch(() => {});
  });

  return record;
}

function waitForRecord(record, timeoutMs) {
  if (record.qr || ['ready', 'failed', 'disconnected'].includes(record.status)) {
    return Promise.resolve(record);
  }

  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      record.waiters.delete(finish);
      resolve(record);
    };
    const timer = setTimeout(finish, timeoutMs);
    record.waiters.add(finish);
  });
}

function hasSavedSession(email) {
  const sessionPath = path.join(sessionsPath, 'session-' + clientIdForEmail(email));
  try {
    const stats = fs.lstatSync(sessionPath);
    return stats.isDirectory() && !stats.isSymbolicLink();
  } catch {
    return false;
  }
}

async function restoreSessions() {
  const users = await getCollection('users');
  const savedUsers = await users
    .find({ whatsappNumber: { $exists: true, $type: 'string' } })
    .project({ email: 1 })
    .toArray();

  for (const user of savedUsers) {
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    if (!email || clients.has(email) || !hasSavedSession(email)) continue;
    if (clients.size >= config.maxWhatsAppSessions) {
      console.warn('[WhatsApp] Some saved sessions were not restored because the configured limit was reached.');
      break;
    }
    createClient(email);
  }

  return clients.size;
}

async function closeAllSessions() {
  const records = [...clients.values()];
  clients.clear();
  await Promise.allSettled(records.map((record) => record.client.destroy()));
}

const whatsappController = {
  startSession: async (req, res) => {
    const email = req.user.email;
    let record = clients.get(email);
    const created = !record;

    if (record?.status === 'ready') {
      return res.status(200).json({ authenticated: true, message: 'Sessão já conectada.' });
    }
    if (!record) {
      if (clients.size >= config.maxWhatsAppSessions) {
        return res.status(429).json({ message: 'Limite de sessões simultâneas atingido.' });
      }
      record = createClient(email);
    }

    try {
      await waitForRecord(record, 15_000);
      if (record.status === 'ready') {
        return res.status(200).json({ authenticated: true, message: 'Sessão conectada.' });
      }
      if (record.qr) {
        const qr = await qrcode.toDataURL(record.qr);
        return res.status(200).json({ qr });
      }
      if (record.status === 'failed' || record.status === 'disconnected') {
        return res.status(502).json({ message: 'Não foi possível iniciar a sessão do WhatsApp.' });
      }

      if (created) {
        removeIfCurrent(email, record);
        await record.client.destroy().catch(() => {});
      }
      return res.status(408).json({ message: 'Tempo de conexão excedido. Tente novamente.' });
    } catch (error) {
      console.error('[WhatsApp] Could not prepare QR response:', error.name, error.code || 'unknown');
      if (created) {
        removeIfCurrent(email, record);
        await record.client.destroy().catch(() => {});
      }
      return res.status(500).json({ message: 'Erro interno ao iniciar a sessão.' });
    }
  },

  stopSession: async (req, res) => {
    const email = req.user.email;
    const record = clients.get(email);
    if (!record) return res.status(404).json({ message: 'Sessão não encontrada.' });

    removeIfCurrent(email, record);
    record.status = 'stopping';
    notify(record);
    try {
      await record.client.destroy();
      return res.status(200).json({ message: 'Sessão encerrada; o pareamento local foi preservado.' });
    } catch (error) {
      console.error('[WhatsApp] Could not stop session:', error.name, error.code || 'unknown');
      return res.status(500).json({ message: 'Erro interno ao encerrar a sessão.' });
    }
  },

  sendMessage: async (req, res) => {
    const record = clients.get(req.user.email);
    if (!record || record.status !== 'ready') {
      return res.status(409).json({ message: 'Sessão conectada do WhatsApp não encontrada.' });
    }

    const destination = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const number = destination.replace(/@c\.us$/i, '').replace(/^\+/, '');
    if (!/^\d{7,15}$/.test(number) || !message || message.length > 4000) {
      return res.status(400).json({ message: 'Informe um número válido e uma mensagem de até 4000 caracteres.' });
    }

    try {
      const formattedDestination = number + '@c.us';
      const sentMessage = await record.client.sendMessage(formattedDestination, message);
      return res.status(200).json({
        message: 'Mensagem enviada com sucesso.',
        id: sentMessage.id._serialized,
        to: formattedDestination,
      });
    } catch (error) {
      console.error('[WhatsApp] Message send failed:', error.name, error.code || 'unknown');
      return res.status(502).json({ message: 'Não foi possível enviar a mensagem.' });
    }
  },

  checkSessionStatus: async (req, res) => {
    const record = clients.get(req.user.email);
    const authenticated = record?.status === 'ready';
    return res.status(200).json({
      authenticated,
      connecting: Boolean(record && !authenticated),
    });
  },

  restoreSessions,
  closeAllSessions,
};

module.exports = whatsappController;
