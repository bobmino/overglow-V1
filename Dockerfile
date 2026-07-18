# Overglow Trip — API (Node) + sert aussi le SPA en mode all-in-one si dist présent
FROM node:20-bookworm-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5001
ENV STORAGE_DRIVER=local
ENV UPLOAD_DIR=/app/uploads

EXPOSE 5001
CMD ["node", "-r", "dotenv/config", "server.js"]
