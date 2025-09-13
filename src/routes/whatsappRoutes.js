const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Iniciar sessão do WhatsApp
router.post('/whatsapp/start', whatsappController.startSession);

// Enviar mensagem
router.post('/whatsapp/send', whatsappController.sendMessage);

module.exports = router;
