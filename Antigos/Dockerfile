# Use imagem base com suporte a Ollama
FROM ubuntu:22.04

# Variável para evitar prompts do apt
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependências básicas e curl
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    software-properties-common && \
    apt-get clean

# Instala Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Adiciona o ollama ao PATH
ENV PATH="/root/.ollama/bin:$PATH"

# Garante que Ollama escute em todas as interfaces (necessário para acessar de fora do container)
ENV OLLAMA_HOST=0.0.0.0

# Prepara os modelos
RUN ollama serve & \
    sleep 5 && \
    ollama pull cogito:3b && \
    ollama pull llama3.2:3b

# Expõe a porta padrão do Ollama
EXPOSE 11434

# Inicia o serviço Ollama escutando em 0.0.0.0
CMD ["ollama", "serve", "--host", "0.0.0.0"]
