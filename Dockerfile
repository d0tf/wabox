FROM node:21-bullseye

RUN mkdir /app

WORKDIR /app

COPY . .

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y

RUN npm install
RUN npm run compile

CMD ["npm", "start"]
