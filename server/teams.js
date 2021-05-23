const express = require('express');
const teamsRouter = express.Router();
const { selectQuery } = require('./db');

const testQuery = require('./db');

teamsRouter.get('/', async (req, res, next) => {
    const teams = await selectQuery('team-names', 'attacker', true, 'map_stats');
    if (teams) {
        res.send(teams.map(element => Object.values(element)[0]));
    }
})

teamsRouter.get('/lineup/:team', async (req, res, next) => {
    const { team } = req.params;

    if (!req.query.year) {
        const lineup = await selectQuery()
    }
})

module.exports = teamsRouter;