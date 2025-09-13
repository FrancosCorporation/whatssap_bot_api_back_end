// controllers/userController.js
const { getCollection } = require('./dbController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const saltRounds = parseInt(process.env.SALT_ROUNDS);


const userController = {
  index: (req, res) => {
    res.send('Listar todos os usuários');
  },

  allusers: (req, res) => {
    res.send('Diferentes usuários');
  },

  show: (req, res) => {
    const { id } = req.params;
    res.send(`Mostrar usuário com ID: ${id}`);
  },

  create: (req, res) => {
    const { name, email } = req.body;
    res.send(`Usuário criado: ${name}, ${email}`);
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    const users = await getCollection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    // Envia token como cookie HTTP-only
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true em produção
      sameSite: 'Strict', // evita CSRF
      maxAge: 1000 * 60 * 60 * 2 // 2 horas (exemplo)
    });
    return res.json({ token, user: { name: user.name, email: user.email } });
  },

  // 🚀 Nova função de registro de usuário
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }

      const usersCollection = await getCollection('users');

      // Verifica se e-mail já está em uso
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'E-mail já cadastrado' });
      }
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const result = await usersCollection.insertOne({ name, email, password: hashedPassword });
      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        userId: result.insertedId,
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ message: 'Erro interno no servidor' });
    }
  },
  buscarInfoLojista: async (req, res) => {
    const { numberphonesendend } = req.params;
    try {
      const db = await getCollection(dbName);
      const dados = await db.findOne({ numberphone: numberphonesendend });

      if (!dados) {
        console.warn('⚠️ Nenhum dado encontrado para este número.');
        return res.status(404).json({ message: 'Nenhum dado encontrado' });
      }

      console.log('✅ Informações do atendente carregadas:', dados);
      return res.status(200).json(dados);
    } catch (err) {
      console.error('❌ Erro ao buscar dados do atendente:', err);
      return res.status(500).json({ message: 'Erro ao buscar dados do atendente' });
    }
  }
  
};

module.exports = userController;
