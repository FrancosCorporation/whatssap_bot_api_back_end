const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getCollection } = require('./dbController');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

const userController = {
  index: (_req, res) => res.json({ message: 'Usuários autenticados.' }),

  allusers: (_req, res) => res.json({ message: 'Listagem indisponível nesta versão.' }),

  show: (req, res) => res.json({ message: 'Usuário autenticado.', id: req.params.id }),

  create: (req, res) => {
    const { name, email } = req.body || {};
    if (typeof name !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
    }
    return res.status(501).json({ message: 'Cadastro de usuário administrativo não implementado.' });
  },

  profile: async (req, res) => {
    try {
      const users = await getCollection('users');
      const user = await users.findOne(
        { email: req.user.email },
        { projection: { name: 1, email: 1, createdAt: 1, whatsappNumber: 1, allowPauseContinue: 1 } },
      );
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      return res.status(200).json({
        name: user.name,
        email: user.email,
        createdAt: user.createdAt || null,
        whatsappNumber: user.whatsappNumber || null,
        allowPauseContinue: user.allowPauseContinue !== false,
      });
    } catch (error) {
      console.error('[User] Profile lookup failed:', error.name, error.code || 'unknown');
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  },

  updateSettings: async (req, res) => {
    if (typeof req.body?.allowPauseContinue !== 'boolean') {
      return res.status(400).json({ message: 'Informe uma configuração válida.' });
    }

    try {
      const users = await getCollection('users');
      const result = await users.updateOne(
        { email: req.user.email },
        { $set: { allowPauseContinue: req.body.allowPauseContinue, updatedAt: new Date() } },
      );
      if (!result.matchedCount) return res.status(404).json({ message: 'Usuário não encontrado.' });

      return res.status(200).json({ allowPauseContinue: req.body.allowPauseContinue });
    } catch (error) {
      console.error('[User] Settings update failed:', error.name, error.code || 'unknown');
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  },

  logout: (_req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return res.status(200).json({ message: 'Sessão encerrada.' });
  },

  login: async (req, res) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;
      if (!email || typeof password !== 'string' || password.length > 128) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
      }

      const users = await getCollection('users');
      const user = await users.findOne({ email });
      if (!user || typeof user.password !== 'string') {
        return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
      }

      const token = jwt.sign(
        { id: String(user._id), email: user.email },
        config.jwtSecret,
        {
          algorithm: 'HS256',
          audience: config.jwtAudience,
          expiresIn: config.jwtExpiresIn,
          issuer: config.jwtIssuer,
        },
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: config.jwtCookieMaxAge,
        path: '/',
      });

      return res.json({ user: { name: user.name, email: user.email } });
    } catch (error) {
      console.error('[Auth] Login failed:', error.name, error.code || 'unknown');
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  },

  register: async (req, res) => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;

      if (
        !name || name.length > 100 ||
        !email || email.length > 254 || !EMAIL_PATTERN.test(email) ||
        typeof password !== 'string' || password.length < 8 || password.length > 128
      ) {
        return res.status(400).json({ message: 'Informe nome, e-mail válido e senha de 8 a 128 caracteres.' });
      }

      const users = await getCollection('users');
      const existingUser = await users.findOne({ email }, { projection: { _id: 1 } });
      if (existingUser) {
        return res.status(409).json({ message: 'E-mail já cadastrado.' });
      }

      const hashedPassword = await bcrypt.hash(password, config.saltRounds);
      const result = await users.insertOne({
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });

      return res.status(201).json({
        message: 'Usuário registrado com sucesso.',
        userId: String(result.insertedId),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'E-mail já cadastrado.' });
      }
      console.error('[Auth] Registration failed:', error.name, error.code || 'unknown');
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  },

  buscarInfoLojista: async (req, res) => {
    const phoneNumber = String(req.params.numberphonesendend || '').replace(/\D/g, '');
    if (phoneNumber.length < 7 || phoneNumber.length > 15) {
      return res.status(400).json({ message: 'Número de telefone inválido.' });
    }

    try {
      const users = await getCollection('users');
      const user = await users.findOne(
        { whatsappNumber: phoneNumber },
        { projection: { name: 1, whatsappNumber: 1, _id: 0 } },
      );
      if (!user) return res.status(404).json({ message: 'Nenhum dado encontrado.' });
      return res.status(200).json(user);
    } catch (error) {
      console.error('[User] Seller lookup failed:', error.name, error.code || 'unknown');
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  },
};

module.exports = userController;
