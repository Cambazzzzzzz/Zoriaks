FROM --platform=linux/amd64 node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     build-essential python3 make g++ libsqlite3-dev \
  && ln -sf /usr/bin/python3 /usr/bin/python \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
ENV npm_config_build_from_source=false
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
