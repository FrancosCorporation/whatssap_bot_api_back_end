# WhatsApp Bot API — back-end

API em Node.js 24 e Express para cadastro/login, pareamento de sessões do WhatsApp Web e envio autenticado de mensagens. O projeto ainda não inclui um fluxo de atendimento com IA.

O front-end React relacionado fica em [whatssap_bot_front](https://github.com/FrancosCorporation/whatssap_bot_front).

## Requisitos

- Node.js 24 LTS e npm.
- MongoDB acessível pela aplicação.
- Chromium para as sessões do WhatsApp. No Docker, a imagem instala Chromium e mantém o sandbox habilitado.

## Configuração local

~~~sh
cp .env.example .env
~~~

Edite .env e substitua JWT_SECRET por um valor aleatório próprio. O valor de exemplo é recusado pela aplicação. Para gerar um segredo:

~~~sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
~~~

Instale e inicie:

~~~sh
npm ci
npm run dev
~~~

Se Puppeteer não encontrar um navegador instalado/gerenciado, defina PUPPETEER_EXECUTABLE_PATH para o executável local do Chromium.

## Variáveis

| Nome | Padrão | Uso |
|---|---|---|
| MONGO_URI | obrigatório | URL de conexão MongoDB |
| MONGO_URI_CONTAINER | mongodb://mongo:27017 | URI interna usada apenas pelo Docker Compose |
| NOME_DB | obrigatório | Banco usado pela API |
| JWT_SECRET | obrigatório, mínimo 32 bytes | Chave para assinar tokens |
| JWT_EXPIRES_IN | 2h | Duração do token, máximo 24h |
| SALT_ROUNDS | 12 | Custo bcrypt, aceito entre 10 e 14 |
| NODE_ENV | development | Ambiente; em production o cookie usa Secure |
| HOST | 127.0.0.1 | Interface de escuta local |
| PORT | 3005 | Porta HTTP |
| CORS_ORIGINS | http://localhost:3000 | Origens completas, sem barra final, separadas por vírgula |
| MAX_WHATSAPP_SESSIONS | 3 | Limite global de sessões simultâneas, entre 1 e 10 |
| PUPPETEER_EXECUTABLE_PATH | detectado pelo Puppeteer | Caminho opcional do Chromium |

CORS exige uma origem permitida e usa cookies apenas com credenciais habilitadas para essa allowlist. O arquivo de exemplo aponta MONGO_URI para o Mongo local publicado em 127.0.0.1:27018. O Compose substitui isso pela rede interna mongo:27017. O rate limiter é local ao processo; com várias réplicas, use um armazenamento compartilhado.

## Fluxo de pareamento

1. Crie uma conta com POST /register e entre com POST /login; o navegador recebe um cookie HttpOnly.
2. Envie as chamadas do painel com credenciais de cookie habilitadas.
3. Chame POST /api/whatsapp/start. A resposta contém QR em base64 para exibição no front-end.
4. Leia o QR pelo menu de dispositivos conectados do WhatsApp.
5. Consulte GET /api/check-session-status para obter o estado.
6. Envie mensagens com POST /api/whatsapp/send e encerre a conexão local com POST /api/whatsapp/stop.

O cookie é a sessão usada pelo painel. A API não retorna o JWT no corpo do login. Clientes fora do navegador podem usar Bearer JWT quando obtiverem um token por um fluxo próprio.

O limite é de 30 mensagens por minuto e 500 por dia por usuário. Até três sessões globais podem conectar ao mesmo tempo; novas tentativas recebem HTTP 429 quando o limite é atingido. /stop encerra o navegador, preservando o pareamento local.

## Rotas

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | /healthz | não | Healthcheck HTTP |
| POST | /register | não | Cadastro com bcrypt |
| POST | /login | não | Cria cookie HttpOnly e retorna o perfil básico |
| POST | /logout | não | Remove o cookie de sessão |
| GET | /verify | sim | Verifica o token |
| GET | /api/user/profile | sim | Retorna o perfil e as preferências do usuário atual |
| PUT | /api/user/settings | sim | Atualiza a preferência de comandos de pausa/retomada |
| GET | /api/check-session-status | sim | Estado da sessão WhatsApp |
| POST | /api/whatsapp/start | sim | Inicia o pareamento |
| POST | /api/whatsapp/stop | sim | Encerra a conexão local |
| POST | /api/whatsapp/send | sim | Envia mensagem de texto |

Rotas não documentadas respondem 404 em JSON. O corpo de cada requisição tem limite de 100 KB.

## Docker

Crie e preencha .env a partir de .env.example e execute:

~~~sh
docker compose up --build
~~~

A API fica publicada em 127.0.0.1:3005 por padrão. MongoDB também fica disponível em 127.0.0.1:27018 para desenvolvimento. A sessão do WhatsApp e os dados do banco persistem nos volumes whatsapp_sessions e mongo_data. O Mongo local não tem autenticação; ele só é publicado em loopback e serve para desenvolvimento. O container da API roda como usuário node, com filesystem somente leitura, capacidades removidas e Chromium sem a opção --no-sandbox.

## Segurança e operação

- JWT_SECRET, MongoDB e os demais segredos são validados no boot. As credenciais não são incluídas no ambiente do Chromium.
- O navegador permanece com o sandbox padrão do Chromium. Configure o runtime para permitir o sandbox de usuário.
- Helmet adiciona headers HTTP, há rate limits e o servidor encerra as sessões e o MongoDB ao receber SIGINT/SIGTERM.
- O helper antigo de pesquisa web com IA não era usado por nenhuma rota e foi removido; páginas arbitrárias não são carregadas pelo processo do bot.
- Consulte SECURITY.md antes de integrar novas fontes de conteúdo ou funcionalidades.

## Desenvolvimento

~~~sh
npm run lint
npm audit --audit-level=high
~~~

O workflow executa lint, auditoria e build da imagem. Este repositório ainda não tem testes automatizados.

## Licença

MIT; consulte LICENSE.
