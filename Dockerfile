# 1️⃣ Base image for building (TypeScript compile)
FROM node:20-alpine AS builder

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files first for better caching
COPY package*.json ./

# 4️⃣ Install ALL dependencies (including dev for tsc + prisma)
RUN npm install

# 5️⃣ Copy the full source code
COPY . .

# 6️⃣ Generate Prisma client
RUN npx prisma generate

# 7️⃣ Build TypeScript → creates dist/
RUN npm run build



# ===============================
# 🚀  PRODUCTION IMAGE
# ===============================

FROM node:20-alpine AS runner

WORKDIR /app

# Copy only what's needed for production
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install ONLY production deps
RUN npm install --only=production

# Prisma needs generated client copied
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start server
CMD ["node", "dist/index.js"]
