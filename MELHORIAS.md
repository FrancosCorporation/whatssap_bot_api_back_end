# MELHORIAS — whatssap_bot_api_back_end

Atualizado em 11/10/2026. Itens implementados nesta rodada, exceto a suíte de testes.

## Estado dos itens

| ID | Estado |
|---|---|
| SEC-01 — Chromium com sandbox e ambiente de processo reduzido | Implementado |
| SEC-02 — Prompt injection via conteúdo web | Helper de navegação web não conectado removido |
| SEC-03 — JWT_SECRET validado no boot e JWT com algoritmo/issuer/audience | Implementado |
| SEC-04 — Rate limits de autenticação, mensagens e sessões | Implementado |
| SEC-05 — clientId do SessionManager sem sanitização | Implementação morta removida |
| SEC-06 — SSRF no scraper web | Scraper sem chamadas removido |
| SEC-07 — IDs LocalAuth colidiam ao sanitizar e-mails diferentes | SHA-256 por e-mail; migração automática só para diretórios legados sem colisão |
| BUG-01 — consulta de lojista usava dbName indefinido | Usa a coleção users e projeta só campos públicos |
| BUG-02 — SALT_ROUNDS sem padrão/validação | Default 12 e faixa 10–14 |
| BUG-03 — error.message exposto ao cliente | Respostas genéricas e detalhes limitados no log |
| BUG-04 — SessionManager duplicado e não utilizado | Removido |
| BUG-05 — erro de listen e SIGTERM sem tratamento | Handler de erro e encerramento gracioso implementados |
| BUG-06 — corpo JSON sem limite | Limite de 100 KB e resposta 413 |
| IMP-01 — sem Helmet | Implementado |
| IMP-02 — sessões em memória sem restauração | Persistência LocalAuth e restauração limitada no boot |
| TEST-01 — testes automatizados | Pendente; não foram adicionados nem executados |
| DEVOPS-01 — sem CI | Lint, auditoria e build Docker |
| DEVOPS-02 — porta fixa | HOST/PORT validados por ambiente |
| DOC-01 — README sem ambiente/QR/Chromium | Atualizado |
| DOC-02 — SECURITY.md | Adicionado |
| INT-01 — endpoints de perfil e preferências para o painel | Implementado para o usuário autenticado |
| INT-02 — logout de cookie e contrato cookie-only para navegador | Implementado |

## Segurança e funcionamento

- As rotas de usuários que já estavam protegidas por alteração local foram preservadas. Rotas de WhatsApp agora também exigem Bearer JWT ou cookie HTTP-only.
- Cadastro normaliza e valida e-mail/senha e usa bcrypt com custo validado.
- Login tem limite de cinco tentativas por cinco minutos por IP/e-mail; cadastro tem limite por IP.
- Cada usuário envia até 30 mensagens por minuto e 500 por dia. Mensagens aceitam números de telefone e texto até 4.000 caracteres.
- São permitidas até três sessões simultâneas por padrão. Ao atingir o teto, a API responde 429. A configuração permite de uma a dez sessões.
- Sessões reconhecidas pelo banco e presentes no disco são restauradas no boot; o volume Docker persiste os dados entre reinícios. LocalAuth usa SHA-256 do e-mail normalizado; diretórios legados migram apenas quando o antigo ID sanitizado pertence a uma única conta. IDs legados ambíguos ficam intactos e exigem novo QR.
- O Compose sobe MongoDB 8 com volume e healthcheck para desenvolvimento; Mongo e API publicam portas apenas em loopback.
- O Chromium recebe apenas variáveis necessárias ao navegador. JWT_SECRET e MONGO_URI não são repassados ao processo do browser.
- O CORS é uma allowlist exata, com credenciais habilitadas só para as origens listadas. Helmet e respostas de erro genéricas reduzem exposição.
- O painel Vite usa a origem local `http://localhost:3000`; ela está incluída no CORS padrão. `GET /api/user/profile` devolve somente campos do usuário atual, `PUT /api/user/settings` grava a preferência e `POST /logout` remove o cookie.
- O endpoint de login não retorna o JWT no corpo; navegadores usam o cookie HttpOnly. Clientes de API podem continuar usando Bearer quando obtiverem um token por outro fluxo.
- O helper de busca web com Puppeteer não era chamado por nenhuma rota. Foi removido junto com as dependências usadas só por ele; páginas arbitrárias não são carregadas pelo bot.
- As dependências diretas foram reduzidas de 479 para 11. Puppeteer foi fixado por override em 25.13.0 para eliminar os alertas transitivos conhecidos; a compatibilidade do pareamento real não foi exercitada nesta rodada.

### SEC-07 — Isolamento dos diretórios LocalAuth

- O ID legado substituía todo caractere não permitido por `_`, então e-mails diferentes como `ana.silva@example.com` e `ana_silva@example.com` podiam compartilhar `session-ana_silva_example_com`.
- Agora cada e-mail normalizado recebe um ID SHA-256, restrito a caracteres aceitos pelo `whatsapp-web.js` e sem expor o e-mail no nome do diretório.
- No boot, uma pasta antiga só é movida para o ID novo se o ID legado corresponder a uma única conta cadastrada. Se houver colisão, não atribuí a sessão a nenhuma conta; as contas afetadas precisam parear novamente por QR. A pasta antiga não é apagada.
- Verificação estática: `node --check src/controllers/whatsappController.js`, busca pelo fluxo de migração e `git diff --check`. Nenhum teste ou sessão real foi iniciado.

## Validação

- `npm run lint`: passou.
- `node --check` em todos os arquivos JavaScript de `src/`: passou.
- `npm audit --audit-level=high`: 0 vulnerabilidades.
- `docker compose config --quiet`: passou.
- `docker build -t whatssap-bot-api:local .`: passou; a imagem instala Chromium, roda como usuário `node` e instala só dependências de produção.
- `git diff --check`: passou.
- Testes não foram adicionados nem executados.
- O pareamento real com o WhatsApp e a inicialização do Chromium em runtime não foram exercitados.

## Limites conhecidos

- O rate limiter usa memória local; implantação com várias réplicas precisa de store compartilhado.
- O limite de sessões recusa novas conexões com 429 em vez de manter uma fila persistente.
- O projeto ainda não tem automação de atendimento por IA, logout remoto do WhatsApp ou uma API oficial do WhatsApp.
