const express = require('express');
const apiRouter = express.Router();

const teamsRouter = require('./teams');
apiRouter.use('/teams', teamsRouter);

const playersRouter = require('./players');
apiRouter.use('/players', playersRouter);

const leadersRouter = require('./leaders');
apiRouter.use('/leaders', leadersRouter);

const matchesRouter = require('./matches');
apiRouter.use('/matches', matchesRouter);

module.exports = apiRouter;