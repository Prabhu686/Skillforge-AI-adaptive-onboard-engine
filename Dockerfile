# ── Stage 1: build React client ─────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: production server ───────────────────────────
FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./

# Copy built client into server's public folder
COPY --from=client-build /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000
CMD ["node", "index.js"]
