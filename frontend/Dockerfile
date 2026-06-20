FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
RUN npm install @rolldown/binding-linux-x64-musl

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
