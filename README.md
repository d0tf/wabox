# WABOX
A simple WhatsApp bot to create stickers from images, videos, or GIFs.

Simply use the `/sticker` command to create a sticker or if you want to add a sticker pack and author you can use a command like this `/sticker author|sticker_pack`.

## Usage
```sh
git clone https://github.com/d0tf/wabox
cd wabox
npm install
npm run compile
npm start
```

#### Run Inside Docker
```sh
git clone https://github.com/d0tf/wabox
cd wabox
docker compose up -d
docker logs wabox # to see qrcode
```
