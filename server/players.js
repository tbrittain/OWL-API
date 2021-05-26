const express = require('express');
const playersRouter = express.Router({ mergeParams: true });
const { selectQuery } = require('./db');

playersRouter.get('/', async (req, res) => {
    if (!req.query.year) {
        const players = await selectQuery('player-list-total', 'player', true, 'players_teams', null, null, 'player ASC');
        if (players.length > 0) {
            res.send(players.map(element => Object.values(element)[0]));
        }
    } else {
        const players = await selectQuery(`player-list-${req.query.year}`, 'player', true, 'players_teams', 
        [
            ['year = ', req.query.year]
        ], null, 'player ASC');

        if (players.length > 0) {
            res.send(players.map(element => Object.values(element)[0]));
        }
    }
});

// TODO: perhaps instead of a post method to update DB, create a helper program that takes an excel/csv file as input and
// automatically updates the databases with recent match data

const validatePlayer = async (req, res, next) => {
    const { player } = req.params;
    let players = await selectQuery('player-list', 'lower(player)', true, 'players_teams', null, null, 'lower(player) ASC');
    players = players.map(element => Object.values(element)[0]);

    if (players.includes(player.toLowerCase())) {
        next();
    } else {
        res.status(400).send('Invalid player name (non-case sensitive). For a full list of players, request GET api/players/');
    }
}

const validateHeroParams = async (req, res, next) => {
    const { hero } = req.params;
    let heroes = await selectQuery('hero-list', 'lower(hero)', true, 'player_stats',
    [
        [" WHERE hero != 'All Heroes'"]
    ]);
    heroes = heroes.map(element => Object.values(element)[0]);
    if (heroes.includes(hero.toLowerCase())) {
        next();
    } else {
        res.status(400).send('Invalid hero name (non-case sensitive). For a full list of heroes, request GET api/players/heroes');
    }
}

const validateMatchIds = async (req, res, next) => {
    if (req.query.match_ids) {
        matchIds = req.query.match_ids.split(',');
        let existingMatchIds = await selectQuery('total-match-ids', 'match_id', true, 'player_stats');
        existingMatchIds = existingMatchIds.map(element => Object.values(element)[0])
        
        let invalid = [];
        for (const matchId of matchIds) {
            if (!existingMatchIds.includes(Number(matchId))) {
                // console.log(`Invalid match ID provided: ${matchId}`)
                invalid.push(matchId);
            }
        }
        if (invalid.length > 0) {
            res.status(400).send(`Invalid match ID provided: ${invalid}`);
        } else {
            next();
        }
    } else {
        next();
    }
}

const validateStatNamesQuery = async (req, res, next) => {
    if (req.query.stat_names) {
        const statNames = req.query.stat_names.split(',');
        let existingStatNames = await selectQuery('total-stat-names', 'lower(stat_name)', true, 'player_stats');
        existingStatNames = existingStatNames.map(element => Object.values(element)[0]);

        // console.log(existingStatNames);
        let invalid = [];
        for (const statName of statNames) {
            if (!existingStatNames.includes(statName.toLowerCase())) {
                // console.log(`Invalid stat name provided: ${statName}`);
                invalid.push(statName);
            }
        }
        if (invalid.length > 0) {
            res.status(400).send(`Invalid stat name provided: ${invalid}`);
        } else {
            next();
        }
    } else {
        next();
    }
}

playersRouter.get('/:player/matches', validatePlayer, async (req, res) => {
    const { player } = req.params;

    if (!req.query.year) {
        const matches = await selectQuery(`${player}-match-list`, 'year, ARRAY_AGG(DISTINCT match_id) AS match_ids', false,
        'player_stats', 
        [
            ['lower(player) = ', player.toLowerCase()]
        ], 'year, player');

        if (matches.length > 0) {
            res.send(matches);
        }
    } else {
        const matches = await selectQuery(`${player}-match-list-${req.query.year}`, 'year, ARRAY_AGG(DISTINCT match_id) AS match_ids', false,
        'player_stats', 
        [
            ['lower(player) = ', player.toLowerCase()],
            ['year = ', req.query.year, 'AND']
        ], 'year, player');

        if (matches.length > 0) {
            res.send(matches);
        }
    }
});

playersRouter.get('/heroes', async (req, res) => {
    let heroes = await selectQuery('hero-list', 'hero', true, 'player_stats',
    [
        [" WHERE hero != 'All Heroes'"]
    ], null, 'hero');
    heroes = heroes.map(element => Object.values(element)[0]);
    res.send(heroes);
});

playersRouter.get('/:player/matches/heroes', validatePlayer, async (req, res) => {
    const { player } = req.params;

    if (!req.query.year) {
        const heroes = await selectQuery(`${player}-match-heroes`, 'match_id, ARRAY_AGG(DISTINCT hero) AS heroes', false, 
        'player_stats', [
            ['lower(player) = ', player.toLowerCase()], 
            [" AND hero != 'All Heroes'"]
        ], 'match_id');
        if (heroes.length > 0) {
            res.send(heroes);
        }
    } else {
        const heroes = await selectQuery(`${player}-match-heroes`, 'match_id, ARRAY_AGG(DISTINCT hero) AS heroes', false, 
        'player_stats', [
            ['lower(player) = ', player.toLowerCase()], 
            ['year = ', req.query.year, 'AND'],
            [" AND hero != 'All Heroes'"]
        ], 'match_id');
        if (heroes.length > 0) {
            res.send(heroes);
        }
    }
});

playersRouter.get('/:player/heroes', validatePlayer, async (req, res) => {
    const { player } = req.params;

    let heroes = await selectQuery(`hero-list-${player}`, 'year, ARRAY_AGG(DISTINCT hero)', false, 'player_stats',
    [
        ['lower(player) = ', player.toLowerCase()],
        ['hero != ', 'All Heroes', 'AND']
    ], 'year');
    res.send(heroes);
});

playersRouter.get('/heroes/stat-names', async (req, res) => {
    let statNames = await selectQuery('stat-names-by-hero', 'hero, ARRAY_AGG(DISTINCT stat_name) AS stat_names', true, 'player_stats',
    null, 'hero');
    res.send(statNames);
});

playersRouter.get('/:player/heroes/:hero', validatePlayer, validateHeroParams, validateMatchIds, validateStatNamesQuery, async (req, res) => {
    const { player, hero } = req.params;

    let matchIds;
    let statNames;

    if (req.query.stat_names) {
        statNames = req.query.stat_names.split(',');
        statNames = statNames.map(stat => stat.toLowerCase());
    }

    if (req.query.match_ids) {
        matchIds = req.query.match_ids.split(',');
        const heroMatchStats = {}
        for (const matchId of matchIds) {
            let matchStat = await selectQuery(`${player}-${hero}-stats-${matchId}`, 'stat_name, stat_amount', false,
            'player_stats',
            [
                ['lower(player) = ', player.toLowerCase()],
                ['lower(hero) = ', hero.toLowerCase(), 'AND'],
                ['match_id = ', matchId, 'AND']
            ]);
            if (statNames) {
                matchStat = matchStat.filter(element => {
                    return statNames.includes(element.stat_name.toLowerCase())
                });
            }
            heroMatchStats[matchId] = matchStat;
        }
        res.send(heroMatchStats);
        return;
    }

    if (!req.query.year) {
        let heroAvgStats = await selectQuery(`${player}-${hero}-avg-stats`, 'stat_name, AVG(stat_amount) as player_average',
        false, 'player_stats', 
        [
            ['lower(player) = ', player.toLowerCase()],
            ['lower(hero) = ', hero.toLowerCase(), 'AND']
        ], 'stat_name');
        if (heroAvgStats.length > 0) {
            if (statNames) {
                heroAvgStats = heroAvgStats.filter(element => {
                    return statNames.includes(element.stat_name.toLowerCase())
                });
            }
            res.send(heroAvgStats);
        } else {
            res.status(404).send(`${player} has not played any matches as ${hero}`)
        }
    } else {
        let heroAvgStats = await selectQuery(`${player}-${hero}-avg-stats-${req.query.year}`, 'stat_name, AVG(stat_amount) as player_average',
        false, 'player_stats', 
        [
            ['lower(player) = ', player.toLowerCase()],
            ['lower(hero) = ', hero.toLowerCase(), 'AND'],
            ['year = ', req.query.year, 'AND']
        ], 'stat_name');
        if (heroAvgStats.length > 0) {
            if (statNames) {
                heroAvgStats = heroAvgStats.filter(element => {
                    return statNames.includes(element.stat_name.toLowerCase())
                });
            }
            res.send(heroAvgStats);
        } else {
            res.status(404).send(`${player} has not played any matches as ${hero}`)
        }
    }
});

module.exports = { 
    playersRouter: playersRouter,
};