
# 🤖 WhatsApp Voice IA - Rodolfo Assistant

Este projeto é uma integração entre o **WhatsApp Web**, **transcrição de áudios** usando **Whisper (OpenAI)** e uma **IA local** (via `ollama` ou servidor local) para responder mensagens de texto e voz dos usuários no estilo de um personagem específico — **Rodolfo**, um engenheiro mecatrônico de 33 anos.

---

## 📌 Funcionalidades

- 📩 Recebe mensagens de texto e responde com a IA personalizada.
- 🎙️ Recebe áudios (formatos como `.oga`, `.opus`) e transcreve automaticamente.
- 🤖 Responde com base na transcrição e personalidade definida.
- 💾 Salva arquivos de mídia localmente para histórico ou debug.
- 🧠 Integra com servidor local de IA (ex: [Ollama](https://ollama.ai)).

---

## 📁 Estrutura do Projeto

```
seu-projeto/
├── index.js              # Código principal (WhatsApp + IA + Áudio)
├── transcrever.py        # Transcrição de áudio usando Whisper
├── downloads/            # Áudios e mídias salvas temporariamente
├── package.json
└── README.md
```

---

## ⚙️ Requisitos

### Node.js (v16+)
Instale via: https://nodejs.org

### Python (v3.9+)
Instale via: https://www.python.org/downloads/

### ffmpeg
Usado para converter `.oga` ou `.opus` para `.wav`  
- Linux: `sudo apt install ffmpeg`
- Mac: `brew install ffmpeg`
- Windows: [Download FFmpeg](https://ffmpeg.org/download.html)

---

## 🧠 Instalação de Dependências

### 1. Dependências Node.js

```bash
npm install whatsapp-web.js qrcode-terminal axios mime-types fluent-ffmpeg
```

### 2. Dependências Python (Whisper)

```bash
pip install git+https://github.com/openai/whisper.git
pip install torch
```

> ⚠️ Obs: O Whisper pode demorar para baixar os modelos na primeira vez.

---

## 🚀 Como Usar

### 1. Inicie o WhatsApp Bot

```bash
node index.js
```

Você verá um QR Code no terminal. Escaneie com seu WhatsApp para conectar.

### 2. Envie mensagens de texto ou áudio

- Envie texto: o bot responderá com base na personalidade definida.
- Envie áudio (formato `.oga`, `.opus`): ele será transcrito com Whisper e enviado à IA para resposta.

---

## 👤 Personagem Rodolfo

A IA responde sempre com a personalidade definida:

- Nome: **Rodolfo**
- Idade: **33**
- Profissão: **Eng. Mecatrônico e resolvedor de problemas**
- Estilo de fala: **Atual, formal, sem gírias, direto ao ponto**
- Traço marcante: **Alegre**

---

## 🧠 Integração com IA Local (Ollama)

O código utiliza uma API local, como:

```http
POST http://localhost:11434/api/generate
```

Certifique-se de que seu modelo esteja rodando corretamente (ex: `ollama run llama3`).

---

## 📌 Notas Finais

- A pasta `downloads/` guarda os arquivos temporariamente. Você pode limpá-la periodicamente.
- O projeto pode ser modularizado no futuro em arquivos separados para melhor manutenção.

---

## ✨ Possibilidades Futuras

- Interface Web para gerenciar mensagens e arquivos.
- Personalização de múltiplos personagens.
- Suporte a idiomas múltiplos.
- Log em banco de dados.

---

## 🛠️ Autor

Projeto criado por **Rodolfo Franco**, para integrar IA com comunicação em tempo real via WhatsApp.
