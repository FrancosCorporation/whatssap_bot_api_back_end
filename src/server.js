const config = require('./config/env');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');
const verificarToken = require('./middlewares/authMiddleware');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const whatsappController = require('./controllers/whatsappController');
const { connectDB, closeDB } = require('./controllers/dbController');

const app = express();
const allowedOrigins = new Set(config.corsOrigins);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins.has(origin)) {
      callback(null, false);
      return;
    }
    callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/api', verificarToken, whatsappRoutes);
app.get('/protected', verificarToken, (_req, res) => {
  res.status(200).json({ message: 'Acesso autenticado.' });
});

app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));

app.use((error, _req, res, _next) => {
  if (res.headersSent) return _next(error);
  const requestedStatus = Number(error.status || error.statusCode);
  const status = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus < 500
    ? requestedStatus
    : 500;
  if (status === 413) {
    return res.status(413).json({ message: 'Corpo da requisição excede o limite de 100 KB.' });
  }
  if (status < 500) return res.status(status).json({ message: 'Requisição inválida.' });

  console.error('[HTTP] Request failed:', error.name, error.code || 'unknown');
  return res.status(500).json({ message: 'Erro interno no servidor.' });
});

let httpServer;
let shuttingDown = false;

async function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (reason === 'unhandledRejection' || reason === 'server_error' || reason === 'startup_error') {
    process.exitCode = 1;
  }

  console.log('[Server] Shutting down (' + reason + ').');
  const forceExitTimer = setTimeout(() => {
    console.error('[Server] Shutdown timed out.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  try {
    if (httpServer?.listening) {
      await new Promise((resolve) => {
        httpServer.close((error) => {
          if (error) console.error('[Server] HTTP close failed:', error.code || error.name);
          resolve();
        });
      });
    }
    await whatsappController.closeAllSessions();
    await closeDB();
  } catch (error) {
    process.exitCode = 1;
    console.error('[Server] Shutdown step failed:', error.name, error.code || 'unknown');
  } finally {
    clearTimeout(forceExitTimer);
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => {
  console.error('[Server] Unhandled rejection:', error?.name || 'unknown error');
  void shutdown('unhandledRejection');
});

async function start() {
  await connectDB();
  if (shuttingDown) return;

  await whatsappController.restoreSessions();
  if (shuttingDown) {
    await whatsappController.closeAllSessions();
    return;
  }

  httpServer = app.listen(config.port, config.host, () => {
    console.log('[Server] Listening on ' + config.host + ':' + config.port + '.');
  });
  httpServer.on('error', (error) => {
    console.error('[Server] HTTP listener failed:', error.code || error.name);
    void shutdown('server_error');
  });
}

void start().catch((error) => {
  console.error('[Server] Startup failed:', error.name, error.code || 'unknown');
  void shutdown('startup_error');
});

module.exports = { app };
