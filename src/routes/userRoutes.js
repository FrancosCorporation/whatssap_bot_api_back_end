// routes/userRoutes.js (ou onde você define suas rotas)
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const whatsappController = require('../controllers/whatsappController');

// Rota de registro
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/api/check-session-status', whatsappController.checkSessionStatus);
// Outras rotas
router.get('/', UserController.index);
router.get('/all', UserController.allusers);
router.get('/:id', UserController.show);
router.post('/create', UserController.create);

module.exports = router;
