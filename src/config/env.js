require('dotenv').config();

function required(name, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(name + ' is required.');
  }
  return value.trim();
}

function readPort(value) {
  if (value === undefined || value.trim() === '') return 3005;
  if (!/^\d+$/.test(value.trim())) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return port;
}

function readCorsOrigins(value) {
  const entries = (value || 'http://localhost:3000').split(',').map((item) => item.trim());
  for (const entry of entries) {
    let parsed;
    try {
      parsed = new URL(entry);
    } catch {
      throw new Error('CORS_ORIGINS must contain comma-separated HTTP(S) origins.');
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== entry) {
      throw new Error('CORS_ORIGINS entries must be HTTP(S) origins without paths.');
    }
  }
  return [...new Set(entries)];
}

const jwtSecret = required('JWT_SECRET', process.env.JWT_SECRET);
if (Buffer.byteLength(jwtSecret, 'utf8') < 32 || /^(replace|change[-_ ]?me|example)/i.test(jwtSecret)) {
  throw new Error('JWT_SECRET must be a unique secret of at least 32 bytes.');
}

const mongoUri = required('MONGO_URI', process.env.MONGO_URI);
if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
  throw new Error('MONGO_URI must use mongodb:// or mongodb+srv://.');
}

const databaseName = required('NOME_DB', process.env.NOME_DB);
if (!/^[a-zA-Z0-9_-]{1,63}$/.test(databaseName)) {
  throw new Error('NOME_DB must contain 1 to 63 letters, numbers, underscores or hyphens.');
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h';
const durationMatch = /^([1-9]\d*)(s|m|h|d)$/.exec(jwtExpiresIn);
if (!durationMatch) {
  throw new Error('JWT_EXPIRES_IN must be a positive duration in seconds, minutes, hours or days.');
}
const durationUnits = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const jwtCookieMaxAge = Number(durationMatch[1]) * durationUnits[durationMatch[2]];
if (jwtCookieMaxAge > 86_400_000) {
  throw new Error('JWT_EXPIRES_IN cannot exceed 24 hours.');
}

const saltRoundsValue = process.env.SALT_ROUNDS;
const saltRounds = saltRoundsValue === undefined || saltRoundsValue.trim() === '' ? 12 : Number(saltRoundsValue);
if (!Number.isInteger(saltRounds) || saltRounds < 10 || saltRounds > 14) {
  throw new Error('SALT_ROUNDS must be an integer between 10 and 14.');
}

const maxWhatsAppSessions = Number(process.env.MAX_WHATSAPP_SESSIONS || 3);
if (!Number.isInteger(maxWhatsAppSessions) || maxWhatsAppSessions < 1 || maxWhatsAppSessions > 10) {
  throw new Error('MAX_WHATSAPP_SESSIONS must be an integer between 1 and 10.');
}

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST?.trim() || '127.0.0.1',
  port: readPort(process.env.PORT),
  corsOrigins: readCorsOrigins(process.env.CORS_ORIGINS),
  mongoUri,
  databaseName,
  jwtSecret,
  jwtExpiresIn,
  jwtCookieMaxAge,
  jwtIssuer: 'whatssap-bot-api',
  jwtAudience: 'whatssap-bot-client',
  saltRounds,
  maxWhatsAppSessions,
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined,
});
