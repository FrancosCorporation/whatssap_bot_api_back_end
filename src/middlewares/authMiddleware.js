const jwt = require('jsonwebtoken');
const config = require('../config/env');

function getBearerToken(header) {
  if (typeof header !== 'string') return undefined;
  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  return match?.[1];
}

function verificarToken(req, res, next) {
  const token = getBearerToken(req.headers.authorization) || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });

    if (!decoded || typeof decoded !== 'object' || typeof decoded.email !== 'string' || !decoded.email) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = {
      id: typeof decoded.id === 'string' ? decoded.id : decoded.email,
      email: decoded.email,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

module.exports = verificarToken;
