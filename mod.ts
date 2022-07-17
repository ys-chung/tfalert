import { Bot } from "https://deno.land/x/grammy@v1.9.1/mod.ts"
import "https://deno.land/std@0.148.0/dotenv/load.ts"

const { TOKEN, ID, CHAT_ID } = Deno.env.toObject()

if (!(TOKEN && ID && CHAT_ID)) {
  console.log("Missing environment variables")
  Deno.exit(1)
}

const bot = new Bot(TOKEN)

const getDate = () => new Date().toUTCString()
const log = (message: string) => console.log(`[${getDate()}] ${message}`)

let flag = false

async function checkTestflight() {
  log("Checking Testflight...")

  const res = await fetch(`https://testflight.apple.com/join/${ID}`)

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

  await bot.api.sendMessage(
    CHAT_ID,
    `Testflight is available!\nhttps://testflight.apple.com/join/${ID}`,
    {
      disable_web_page_preview: true
    }
  )
}

bot.command("stopMessages", () => (flag = true))

async function check() {
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
}

setInterval(check, 5000)

bot.start()
