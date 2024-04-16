import makeWASocket, { AnyMessageContent, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { join } from "path";
import { VoxConfig } from "./lib/Vox";

async function start() {
  const CREDS_PATH = join(__dirname, '../creds')
  const PREFIX = "/"
  const { state, saveCreds } = await useMultiFileAuthState(CREDS_PATH)

  const socket = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  })

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

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
      if (!text.startsWith(prefix)) return;
      const cmd = text.slice(prefix.length).trim().split(/\s/)[0].toLowerCase()
      const content = text.slice(prefix.length + cmd.length).trim() !== "" ? text.slice(prefix.length + cmd.length).trim() : null
      // const args = content ? content.trim().split(/\s/) : null

      switch (cmd) {
        case "ping": {
          socket.sendMessage(message.key.remoteJid!, { text: "Pong 🏓" }, { quoted: message })
          break;
        }
        case "sticker":
        case "stiker": {
          const args = content ? content.trim().split("|") : null
          const author = args ? args[0] : ""
          const pack = args ? args[1] : ""
          const sticker = await vox.createSticker(author, pack) as AnyMessageContent
          socket.sendMessage(message.key.remoteJid!, sticker, { quoted: message })
          break;
        }
      }
    } catch (e) {
      const error = e as Error
      console.error(error.message)
    }
  })
}

start()
