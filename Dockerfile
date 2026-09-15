FROM node:24-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build


FROM node:24-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend ./

COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]