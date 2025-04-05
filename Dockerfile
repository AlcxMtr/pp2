# Dockerfile

FROM node:18-alpine

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 py3-pip make g++ linux-headers

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production
# Rebuild bcrypt to match the container's architecture
RUN npm rebuild bcrypt --build-from-source

# Copy the rest of the app
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Expose the app port
EXPOSE 3000

# Run migration and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
