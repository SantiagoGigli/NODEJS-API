import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()
mongoose.Promise = global.Promise

export const mongooseConnection = () => new Promise<void>((resolve, reject) => {
  const DATABASE_URL = process.env.DATABASE_URL

  mongoose.connect(`${DATABASE_URL}`)

  const db = mongoose.connection

  db.on('error', function (err) {
    reject(err)
  })

  db.once('open', function () {
    console.log('Connection to DB successful')
    resolve()
  })
})
