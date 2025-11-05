# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Exclude node_modules from the copy
COPY ./.dockerignore ./.dockerignore

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/server.js"]