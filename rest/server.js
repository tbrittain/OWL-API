const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')

module.exports = app

const port = process.env.port || 4000

// handle CORS requests from index.html
app.use(cors())

// body parsing
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// logging
app.use(morgan('dev'))

// mount apiRouter
const apiRouter = require('./server/api')
app.use('/rest', apiRouter)

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
