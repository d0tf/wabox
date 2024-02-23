# WABOX
WhatsApp bot to create image, video or GIF into sticker.

## How to use
```sh
git clone https://github.com/d0tf/wabox
cd wabox
npm install
npm run compile
npm start
```
#### Use Docker Image
```sh
git clone https://github.com/d0tf/wabox
cd wabox
docker build -t wabox .
docker run -d --name wabox --restart always wabox 
docker logs wabox # to see qrcode
```
