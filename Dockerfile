FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3005 \
    HOME=/tmp \
    TMPDIR=/tmp \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node src ./src
RUN mkdir -p /app/src/sessions && chown -R node:node /app/src/sessions

USER node
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
