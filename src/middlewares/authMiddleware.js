const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // Tenta pegar o token tanto do header quanto do cookie
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = verificarToken;
