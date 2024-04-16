# WABOX
A simple WhatsApp bot to create stickers from images, videos, or GIFs.

Simply use the `/sticker` command to create a sticker or with extra options.

Sticker options:
- type `/sticker type="r"`
  - r = rounded
  - f = full
  - c = cropped
  - o = circle
- author `/sticker author="ubel"`
- pack `/sticker pack="my sticker"`

or you can combine them all `/sticker type="r" author="ubel" pack="my sticker"`

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
docker logs -f wabox # to see qrcode
```
