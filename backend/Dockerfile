# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy application code first
COPY . .
# Exclude node_modules from the copy
COPY ./.dockerignore ./.dockerignore

# Create reports directory and make it writable
RUN mkdir -p /app/reports && chmod 777 /app/reports

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]