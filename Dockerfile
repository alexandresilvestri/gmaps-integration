FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npx tsc -p tsconfig.src.json
