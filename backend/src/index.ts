import dotenv from 'dotenv'
import { createApp } from './app.js'

dotenv.config()

const app = createApp()
const PORT = Number(process.env.PORT ?? 3000)

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`)
})
