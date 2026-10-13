import dotenv from 'dotenv'
import { createApp } from './app.js'
import { config } from './config.js'
import { createSqliteStorage } from './storage/sqlite.js'

dotenv.config()

const app = createApp(createSqliteStorage({ path: config.databasePath }))
const PORT = Number(process.env.PORT ?? 3000)

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`)
})
