import { AnyMessageContent, MediaType, downloadContentFromMessage, proto, toBuffer } from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export class VoxConfig {
  msg: proto.IWebMessageInfo

  constructor(msg: proto.IWebMessageInfo) {
    this.msg = msg
  }

  isMedia(): boolean {
    return (
      this.msg.message?.hasOwnProperty('imageMessage') ||
      this.msg.message?.hasOwnProperty('videoMessage') ||
      false
    )
  }

  getText(): string | null {
    return (
      this.msg.message?.extendedTextMessage?.text ||
      this.msg.message?.imageMessage?.caption ||
      this.msg.message?.videoMessage?.caption ||
      this.msg.message?.conversation ||
      null
    )
  }

  async createSticker(author: string = "", pack_name: string = ""): Promise<AnyMessageContent | undefined> {
    try {
      const media: proto.Message.IVideoMessage | proto.Message.IImageMessage | null =
        this.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
        this.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
        this.msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage ||
        this.msg.message?.imageMessage ||
        this.msg.message?.videoMessage ||
        null;

      if (!media) {
        return { text: "Hmm... I'm pretty sure that's not a picture or video." }
      }

      const mediaType = media.mimetype?.split("/")[0] as MediaType
      const stream = await downloadContentFromMessage(media, mediaType)
      const buffer = await toBuffer(stream)
      const pack = pack_name.match(/^".*"$/g) ? pack_name.replace('"', "") : pack_name

      const sticker = new Sticker(buffer, {
        quality: 15,
        type: StickerTypes.FULL,
        author,
        pack
      })

      return sticker.toMessage()
    } catch (e) {
      const error = e as Error
      console.error(error.message)
    }
  }
}
