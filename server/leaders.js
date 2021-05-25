const express = require('express');
const leadersRouter = express.Router({ mergeParams: true });
const { selectQuery } = require('./db');

leadersRouter.get('/matches', async (req, res) => {

    let resultLimit = null;

    if (req.query.limit) {
        resultLimit = req.query.limit;
    }

    if (!req.query.year) {
        const matchLeaders = await selectQuery('match-leaders', 'player, COUNT(DISTINCT match_id) AS match_count',
        false, 'player_stats', null, 'player', 'match_count DESC', resultLimit);
        if (matchLeaders.length > 0) {
            res.send(matchLeaders);
        }
    } else {
        const matchLeaders = await selectQuery(`match-leaders-${req.query.year}`, 'player, COUNT(DISTINCT match_id) AS match_count',
        false, 'player_stats',
        [
            ['year = ', req.query.year]
        ], 'player', 'match_count DESC', resultLimit);
        
        if (matchLeaders.length > 0) {
            res.send(matchLeaders);
        }
    }
});

const validateStatNamesParams = async (req, res, next) => {
    const { statName } = req.params;

    let existingStatNames = await selectQuery('total-stat-names', 'lower(stat_name)', true, 'player_stats');
    existingStatNames = existingStatNames.map(element => Object.values(element)[0]);

    if (!existingStatNames.includes(statName.toLowerCase())) {
        res.status(400).send(`Invalid stat name provided: ${statName}`);
    } else {
        next();
    }
}

const validateHeroNameQuery = async (req, res, next) => {
    if (req.query.hero) {
        
    } else {
        next();
    }
}

leadersRouter.get('/top-single-game/:statName', validateStatNamesParams, async (req, res) => {
    const { statName } = req.params;
    res.send();

});

module.exports = leadersRouter;