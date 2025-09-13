FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g nodemon

COPY . .

# Instala as ferramentas de build necessárias para compilar módulos nativos no Alpine
RUN apk add --no-cache --virtual .gyp python3 make g++

# Força a reconstrução do bcrypt
# RUN npm rebuild bcrypt

# Remove as ferramentas de build (para reduzir o tamanho da imagem)
RUN apk del .gyp

EXPOSE 3010

CMD ["npm", "start"]