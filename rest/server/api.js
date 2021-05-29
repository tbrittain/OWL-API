const express = require('express')
const apiRouter = express.Router()

const validateYear = (req, res, next) => {
  if (req.query.year) {
    const years = [2018, 2019, 2020, 2021]
    if (!years.includes(Number(req.query.year))) {
      res
        .status(400)
        .send('Invalid year provided. Valid years are from 2018 - 2021.')
    } else {
      // console.log('Valid year provided');
      next()
    }
  } else {
    next()
  }
}

apiRouter.use(validateYear)

const teamsRouter = require('./teams')
apiRouter.use('/teams', teamsRouter)

const { playersRouter } = require('./players')
apiRouter.use('/players', playersRouter)

const leadersRouter = require('./leaders')
apiRouter.use('/leaders', leadersRouter)

const matchesRouter = require('./matches')
apiRouter.use('/matches', matchesRouter)

apiRouter.use(function (req, res, next) {
  res.status(404).send('No results found')
})

module.exports = apiRouter
