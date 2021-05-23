const express = require('express');
const teamsRouter = express.Router();
const { selectQuery } = require('./db');


teamsRouter.get('/', async (req, res, next) => {
    const teams = await selectQuery('team-names', 'attacker', true, 'map_stats');
    if (teams) {
        res.send(teams.map(element => Object.values(element)[0]));
    }
})

// TODO: consider joining the players_teams for each player to retrieve matches for each player in the lineup
teamsRouter.get('/lineup/:team', async (req, res, next) => {
    const { team } = req.params;

    if (!req.query.year) {
        const lineup = await selectQuery('team-lineup', 'player, COUNT(year) AS seasons, ARRAY_AGG(year) AS years', 
        false, 'players_teams', [['team', team]], 'player', 'seasons DESC');

        if (lineup) {
            res.send(lineup);
        }
    } else if (req.query.year) {
        const lineup = await selectQuery('team-lineup-year', 'player', false, 'players_teams', [['team', team], ['year', req.query.year, 'AND']], null, 'player ASC');

        if (lineup) {
            res.send(lineup.map(element => Object.values(element)[0]));
        }
    }
})

module.exports = teamsRouter;