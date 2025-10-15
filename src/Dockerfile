# 1️⃣ Base image
FROM node:20-alpine AS builder

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files first (for better caching)
COPY package*.json ./

# 4️⃣ Install dependencies
RUN npm install

# 5️⃣ Copy the rest of the code
COPY . .

# 6️⃣ Build the TypeScript project
RUN npm run build

# 7️⃣ Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the built output and necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN npm install --only=production

# Set environment variable
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Run the app
CMD ["node", "dist/index.js"]
