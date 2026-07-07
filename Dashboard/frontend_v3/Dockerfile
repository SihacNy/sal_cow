FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Use --host to allow external connections in Docker
CMD ["npm", "run", "dev", "--", "--host"]
