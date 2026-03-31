# ─── Stage 1: dependencias ────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: imagen final ────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

# Instalar OpenSSL que necesita Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Seguridad: usuario no-root
RUN groupadd -r clinica && useradd -r -g clinica clinica

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar el código fuente y el schema de Prisma
COPY src ./src
COPY prisma ./prisma
COPY package.json ./

# Generar Prisma Client dentro de la imagen
RUN npx prisma generate

# El proceso corre como usuario sin privilegios
USER clinica
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]