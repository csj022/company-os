FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (includes prisma/)
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3002

# Start command
CMD ["npm", "start"]
