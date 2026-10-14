# Plan — whatssap_bot_api_back_end

## 1. Visão geral

- **Nome:** whatssap_bot_api_back_end — API de bot WhatsApp (Baileys)
- **Descrição:** API Node/Express para sessões WhatsApp multi-conta via Baileys, com isolamento de sessões por conta (SEC-07, SHA-256 do e-mail normalizado), endpoints de perfil/logout, empacotada em Docker.
- **Estado atual:** SEC-01..07 + itens de robustez/documentação concluídos em 2026-10-11 (commit `e0a44f4`); CI modernizada nesta sessão.

## 2. Arquitetura e tecnologias

- Node 24+, Express, Baileys (vendored), Puppeteer (skip em CI), MongoDB.
- CI: lint + audit + docker build; **modernizada nesta sessão** (Ubuntu 24.04, Actions v7, Node 22/24).

## 3. Funcionalidades existentes

- [x] Sessões multi-conta isoladas por hash do e-mail — SEC-07.
- [x] Preferences/logout endpoints — implementado.
- [x] CI com lint/audit/docker build — **modernizada nesta sessão**.

## 4. Objetivos futuros

- **OBJ-01 (P2, concluído nesta sessão):** CI previsível (runner fixo, actions pinadas, matriz 22/24).
- **OBJ-02 (P3, pendente):** validação de pareamento real WhatsApp (fora de CI; exige QR).
- **OBJ-03 (P3, recomendação):** documentar fluxo de sessões no README (diagrama).

## 5–7. Melhorias / Roadmap / Backlog

Fases 1–3 concluídas; backlog: OBJ-02 (pendente operacional, QR), OBJ-03 (docs).

## 8. Riscos e pendências

- Pasta `src/utils/` vazia local (não rastreada) descartada nesta sessão.
- TEST-01 (pareamento real) continua vedado nesta esteira.

## 9. Ideias adicionais

- Exportar métricas de sessão para o `observa-stack`.

---
*(Gerado em 2026-10-14 pelo agente orquestrador)*
