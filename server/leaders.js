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
        let heroes = await selectQuery('hero-list', 'lower(hero)', true, 'player_stats');
        heroes = heroes.map(element => Object.values(element)[0]);

        if (heroes.includes(req.query.hero.toLowerCase())) {
            next();
        } else {
            res.status(400).send('Invalid hero name (non-case sensitive). For a full list of heroes, request GET api/players/heroes');
        }
    } else {
        next();
    }
}

leadersRouter.get('/top-single-game/:statName', validateStatNamesParams, validateHeroNameQuery, async (req, res) => {
    const { statName } = req.params;
    
    let resultLimit = 100;

    if (req.query.limit && req.query.limit <= 100) {
        resultLimit = req.query.limit;
    }

    // no year query
    if (!req.query.year) {
        // no hero query
        if (!req.query.hero) {
            const leaders = await selectQuery(`top-${resultLimit}-${statName.toLowerCase()}`, 'player, year, match_id, ARRAY_AGG(DISTINCT hero) AS heroes, MAX(stat_amount) AS stat_amount',
            false, 'player_stats',
            [
                ['lower(stat_name) = ', statName.toLowerCase()]
            ], 'player, year, match_id', 'MAX(stat_amount) DESC', resultLimit);
            if (leaders.length > 0) {
                res.send(leaders);
            }
        // hero query present
        } else {
            const leaders = await selectQuery(`top-${resultLimit}-${req.query.hero}-${statName.toLowerCase()}`, 'player, year, match_id, stat_amount',
            false, 'player_stats',
            [
                ['lower(stat_name) = ', statName.toLowerCase()],
                ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
            ], null, 'stat_amount DESC', resultLimit);
            if (leaders.length > 0) {
                res.send(leaders);
            }
        }
    // year query present
    } else {
        // no hero query
        if (!req.query.hero) {
            const leaders = await selectQuery(`top-${resultLimit}-${statName.toLowerCase()}-${req.query.year}`, 'player, year, match_id, ARRAY_AGG(DISTINCT hero) AS heroes, MAX(stat_amount) AS stat_amount',
            false, 'player_stats',
            [
                ['lower(stat_name) = ', statName.toLowerCase()],
                ['year = ', req.query.year, 'AND']
            ], 'player, year, match_id', 'MAX(stat_amount) DESC', resultLimit);
            if (leaders.length > 0) {
                res.send(leaders);
            }
        // hero query present
        } else {
            const leaders = await selectQuery(`top-${resultLimit}-${req.query.hero}-${statName.toLowerCase()}-${req.query.year}`, 'player, match_id, stat_amount',
            false, 'player_stats',
            [
                ['lower(stat_name) = ', statName.toLowerCase()],
                ['year = ', req.query.year, 'AND'],
                ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
            ], null, 'stat_amount DESC', resultLimit);
            if (leaders.length > 0) {
                res.send(leaders);
            }
        }
    }
});

module.exports = leadersRouter;