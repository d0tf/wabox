import makeWASocket, { AnyMessageContent, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { join } from "path";
import { VoxConfig } from "./lib/Vox";
import { cryptoConversion } from "./lib/cryptoConversion";
import QRCode from "qrcode"
import { captureTV } from "./lib/utils";

async function start() {
  const CREDS_PATH = join(__dirname, '../creds')
  const PREFIX = "/"
  const MY_NUMBER = "6285156565846"
  const { state, saveCreds } = await useMultiFileAuthState(CREDS_PATH)

  const socket = makeWASocket({
    auth: state,
  })

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(await QRCode.toString(qr, { type: "terminal", small: true }))
    }

    if (connection === "close") {
      try {
        if ((lastDisconnect?.error as Boom)?.output.statusCode !== DisconnectReason.loggedOut) {
          console.log("Reconnecting...")
          return start()
        } else {
          console.log("Logged out")
          process.exit(0)
        }
      } catch (e) {
        const error = e as Error
        console.error(error)
      }
    }

    console.log("Connection update:", update)
  })


  socket.ev.on("creds.update", saveCreds)

  socket.ev.on("messages.upsert", async (msg) => {
    try {
      const message = msg.messages[0]
      const vox = new VoxConfig(message)
      const prefix = PREFIX
      const text = vox.getText()

      if (!text) return;
      if (text.startsWith(`@${MY_NUMBER}`)) {
      }
      if (!text.startsWith(prefix)) return;
      const cmd = text.slice(prefix.length).trim().split(/\s/)[0].toLowerCase()
      const content = text.slice(prefix.length + cmd.length).trim() !== "" ? text.slice(prefix.length + cmd.length).trim() : null
      const args = content ? content.trim().split(/\s/) : null

      switch (cmd) {
        case "ping": {
          socket.sendMessage(message.key.remoteJid!, { text: "Pong 🏓" }, { quoted: message })
          break;
        }
        case "cv": {
          if (args) {
            if (args.length < 2) {
              socket.sendMessage(message.key.remoteJid!, { text: "/c {amount} {symbol}" }, { quoted: message })
            }
            if (!args[0].match(/^\d+(\.\d+)?$/gi)) {
              socket.sendMessage(message.key.remoteJid!, { text: "/c {amount (number)} {symbol}" }, { quoted: message })
            }

            const amount = +args[0]
            const symbol = args[1]
            const conversion = await cryptoConversion(amount, symbol)
            const formattedResult = `${conversion.amount} ${conversion.ticker.toUpperCase()} = ${conversion.price}\n\nPrice from Binance`
            socket.sendMessage(message.key.remoteJid!, { text: formattedResult }, { quoted: message })
          } else {
            socket.sendMessage(message.key.remoteJid!, { text: "/c {amount} {symbol}" }, { quoted: message })
          }
          break;
        }
        case "sticker":
        case "stiker": {
          let type: string = ""
          let author: string = ""
          let pack: string = ""

          const patterns = { type: /type="([^"]+)"/, author: /author="([^"]+)"/, pack: /pack="([^"]+)"/ }
          const typeMatch = content?.match(patterns.type)
          const authorMatch = content?.match(patterns.author)
          const packMatch = content?.match(patterns.pack)

          type = typeMatch ? typeMatch[1] : ""
          author = authorMatch ? authorMatch[1] : ""
          pack = packMatch ? packMatch[1] : ""

          const sticker = await vox.createSticker(type, author, pack) as AnyMessageContent
          socket.sendMessage(message.key.remoteJid!, sticker, { quoted: message })
          break;
        }
        case "teto": {
          if (args) {
            if (args.length < 1) {
              socket.sendMessage(message.key.remoteJid!, { text: "/tv {pair} {timeframe}" }, { quoted: message })
            }

            const pair: string = args[0]
            const timeframe: string = !args[1] ? "60m" : args[1]
            const res = await captureTV(pair, timeframe)
            if (res) {
              try {
                await socket.sendMessage(message.key.remoteJid!, { image: { url: res.filePath } }, { quoted: message })
              } catch {
                socket.sendMessage(message.key.remoteJid!, { text: "Error sending image" }, { quoted: message })
              } finally {
                await res.cleanup()
              }
            }
          } else {
            socket.sendMessage(message.key.remoteJid!, { text: "/tv {pair} {timeframe}" }, { quoted: message })
          }
          break
        }
      }
    } catch (e) {
      const error = e as Error
      console.error(error.message)
    }
  })
}

start()
