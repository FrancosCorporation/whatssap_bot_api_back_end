# WhatsApp Bot API — Back-end

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

API REST em Node.js/Express que autentica usuários e conecta um número de WhatsApp via `whatsapp-web.js`, devolvendo o QR Code de pareamento para o front-end React.

## Sobre

Este repositório é o back-end do bot de WhatsApp. Ele expõe endpoints de cadastro e login (JWT + bcrypt), gerencia uma sessão do WhatsApp Web por usuário (autenticação local via `LocalAuth`) e permite o envio de mensagens a partir da API. O consumo do QR Code e o painel de controle ficam no repositório irmão [whatssap_bot_front](https://github.com/FrancosCorporation/whatssap_bot_front).

O projeto foi pensado para quem quer automatizar o atendimento de um número de WhatsApp mantendo uma sessão isolada por usuário, com o estado das sessões guardado no MongoDB.

## Funcionalidades

- Cadastro de usuários (`POST /register`) com senha criptografada em bcrypt e verificação de e-mail duplicado.
- Login (`POST /login`) com emissão de token JWT e envio do token também em cookie `httpOnly`.
- Middleware de autenticação (`src/middlewares/authMiddleware.js`) que valida o token via header `Authorization: Bearer` ou cookie.
- Início de sessão do WhatsApp por usuário (`POST /api/whatsapp/start`), retornando o QR Code em base64 (`qrcode`).
- Verificação do estado da sessão (`GET /api/check-session-status`).
- Envio de mensagens de texto (`POST /api/whatsapp/send`), normalizando o número para o formato `@c.us`.
- Associação automática do número conectado ao usuário (`whatsappNumber`) quando a sessão fica pronta.
- Sessões do WhatsApp isoladas por e-mail em `sessions/` (`LocalAuth` + Puppeteer headless) e timeout de 15s para leitura do QR Code.
- Rota protegida de exemplo (`GET /protected`) e rota de verificação de token (`GET /verify`).
- Suporte a Docker (`Dockerfile` + `docker-compose.yml`) e script de rebuild (`build.bat`).
- Base para integração com IA local (Ollama) em `src/controllers/request_Api_Ai.js`.

## Stack

- **Node.js 20** (CommonJS)
- **Express 5** + `body-parser` + `cors`
- **whatsapp-web.js** (Puppeteer, `LocalAuth`, `qrcode`)
- **MongoDB** via driver oficial (`mongodb`)
- **JWT** (`jsonwebtoken`), **bcryptjs**
- **dotenv**
- **ESLint 9** + **nodemon** (desenvolvimento)
- **Docker / docker-compose**

## Como rodar

Requer configuração de ambiente (arquivo `.env`, conforme `.env.example`) e uma instância do MongoDB acessível.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de ambiente
cp .env.example .env
# preencha MONGO_URI, NOME_DB, JWT_SECRET, SALT_ROUNDS, PORT etc.

# 3. Iniciar a API (porta definida em src/server.js, atualmente 3005)
npm start

# Desenvolvimento com reload
npm run dev

# Lint
npm run lint
```

Scripts disponíveis no `package.json`: `start`, `dev`, `test` (sem testes implementados) e `lint`.

Com Docker:

```bash
docker compose up --build
```

O `docker-compose.yml` publica a porta `3010` e roda `npm start`.

## Estrutura do projeto

```
whatssap_bot_api_back_end/
├── src/
│   ├── server.js                  # bootstrap do Express
│   ├── controllers/               # userController, whatsappController, dbController, request_Api_Ai
│   ├── middlewares/authMiddleware.js
│   ├── models/clients.js          # mapa de sessões ativas
│   ├── routes/                    # auth, userRoutes, whatsappRoutes
│   └── utils/whatsappSessionManager.js
├── Dockerfile
├── docker-compose.yml
└── build.bat
```

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE).
