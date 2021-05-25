const express = require('express');
const teamsRouter = express.Router({ mergeParams: true });
const { selectQuery } = require('./db');


teamsRouter.get('/', async (req, res) => {
    const teams = await selectQuery('team-names', 'attacker', true, 'map_stats', null, null, 'attacker ASC');
    if (teams.length > 0) {
        res.send(teams.map(element => Object.values(element)[0]));
    }
});

// TODO: consider joining the players_teams for each player to retrieve matches for each player in the lineup
teamsRouter.get('/:team', async (req, res) => {
    const { team } = req.params;

    if (!req.query.year) {
        const lineup = await selectQuery(`team-lineup-${team}`, 'player, COUNT(year) AS seasons, ARRAY_AGG(year) AS years', 
        false, 'players_teams', 
        [
            ['lower(team) = ', team.toLowerCase()]
        ], 'player', 'seasons DESC');

        if (lineup.length > 0) {
            res.send(lineup);
        }
    } else {
        const lineup = await selectQuery(`team-lineup-${team}-${req.query.year}`, 'player', false, 'players_teams', 
        [
            ['lower(team) = ', team.toLowerCase()], 
            ['year = ', req.query.year, 'AND']
        ], null, 'player ASC');
        
        if (lineup.length > 0) {
            res.send(lineup.map(element => Object.values(element)[0]));
        } else {
            res.status(404).send();
        }
    }
});

module.exports = teamsRouter;