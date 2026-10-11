const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const {
  sendMessageDailyLimiter,
  sendMessageMinuteLimiter,
  startSessionLimiter,
} = require('../middlewares/rateLimiters');

// Iniciar sessão do WhatsApp
router.post('/whatsapp/start', startSessionLimiter, whatsappController.startSession);

// Encerrar a conexão local sem apagar os dados de pareamento persistidos.
router.post('/whatsapp/stop', whatsappController.stopSession);

// Enviar mensagem
router.post(
  '/whatsapp/send',
  sendMessageMinuteLimiter,
  sendMessageDailyLimiter,
  whatsappController.sendMessage,
);

module.exports = router;
