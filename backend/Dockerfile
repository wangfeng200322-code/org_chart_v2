# syntax=docker/dockerfile:1

FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/server.js"]


