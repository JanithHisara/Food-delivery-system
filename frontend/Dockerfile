# Frontend (React + Vite dev server)
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --silent

COPY . .

# Vite dev server runs on 5173
EXPOSE 5173

CMD ["npm", "run", "dev"]