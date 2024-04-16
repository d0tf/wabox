FROM node:21-bookworm-slim

RUN mkdir /app

WORKDIR /app

COPY . .

RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install ffmpeg -y

RUN npm install
RUN npm run compile

CMD ["npm", "start"]
