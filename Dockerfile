FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json .
RUN npm ci 

COPY . .

RUN apt-get update -y && \
      apt-get upgrade -y && \
      apt-get install ffmpeg -y && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/*

RUN npm run compile

CMD ["npm", "start"]
