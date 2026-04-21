FROM node:20-slim AS builder
WORKDIR /app
COPY pharmsafe-mcp/package*.json ./
RUN npm ci
COPY pharmsafe-mcp/tsconfig.json ./
COPY pharmsafe-mcp/src/ ./src/
RUN npx tsc

FROM node:20-slim
WORKDIR /app
COPY pharmsafe-mcp/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY pharmsafe-mcp/agent/ ./agent/
COPY pharmsafe-mcp/test-data/ ./test-data/
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/server-http.js"]
