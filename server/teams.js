const express = require('express');
const teamsRouter = express.Router();

const testQuery = require('./db');

teamsRouter.get('/', (req, res, next) => {
    res.send();
})

module.exports = teamsRouter;