import { Bot } from "grammy"

if (!(process.env.TOKEN && process.env.ID && process.env.CHAT_ID)) {
  console.log("Missing environment variables")
  process.exit(1)
}

const bot = new Bot(process.env.TOKEN)

const getDate = () => new Date().toUTCString()
const log = (message: string) => console.log(`[${getDate()}] ${message}`)

let flag = false

async function checkTestflight() {
  log("Checking Testflight...")

  const res = await fetch(`https://testflight.apple.com/join/${process.env.ID}`)

  if (!res.ok) {
    log("Testflight is not available")
    return false
  }

  const text = await res.text()

  if (
    !(
      text.includes("This beta is full.") ||
      text.includes("This beta isn't accepting any new testers right now.")
    )
  ) {
    log("Testflight is available")
    return true
  }

  log("Testflight is full")
  return false
}

async function sendNotification() {
  log("Sending notification...")

  const chatID = process.env.CHAT_ID

  await bot.api.sendMessage(
    chatID,
    `Testflight is available!\nhttps://testflight.apple.com/join/${process.env.ID}`,
    {
      disable_web_page_preview: true
    }
  )
}

bot.command("stopMessages", () => (flag = true))

setInterval(
  async () => {
    try {
      if (flag) {
        log("Messages are stopped")
        return
      }

      const isAvailable = await checkTestflight()

      if (isAvailable) {
        await sendNotification()
      }
    } catch (error) {
      console.error(error)
    }
  },
  process.env.INTERVAL ? parseInt(process.env.INTERVAL) : 5000
)

bot.start()
