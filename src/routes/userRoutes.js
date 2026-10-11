// routes/userRoutes.js (ou onde você define suas rotas)
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const whatsappController = require('../controllers/whatsappController');
const verificarToken = require('../middlewares/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiters');

// Rota de registro
router.post('/register', registerLimiter, UserController.register);
router.post('/login', loginLimiter, UserController.login);
router.get('/api/check-session-status', verificarToken, whatsappController.checkSessionStatus);
// Outras rotas — protegidas (D3: exigem JWT; criar/listar usuários só para autenticados)
router.get('/', verificarToken, UserController.index);
router.get('/all', verificarToken, UserController.allusers);
router.get('/:id', verificarToken, UserController.show);
router.post('/create', verificarToken, UserController.create);

module.exports = router;
