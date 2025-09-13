// routes/auth.js
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');

router.get('/verify', verificarToken, (req, res) => {
  res.status(200).json({ authenticated: true });
});

module.exports = router;
