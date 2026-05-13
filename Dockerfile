FROM node:20-bookworm-slim

# node-gyp / better-sqlite3: "python" aranir; slim imajda sadece python3 olabilir
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     python3 make g++ libsqlite3-dev \
  && ln -sf /usr/bin/python3 /usr/bin/python \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
# npm ci bazen ortam/kilit uyumsuzlugunda kirilir; production icin install yeterli
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
