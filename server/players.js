const express = require('express');
const playersRouter = express.Router();
const { selectQuery } = require('./db');

playersRouter.get('/', async (req, res) => {
    if (!req.query.year) {
        const players = await selectQuery('player-list', 'player', true, 'players_teams', null, null, 'player ASC');
        if (players.length > 0) {
            res.send(players.map(element => Object.values(element)[0]));
        }
    } else {
        const players = await selectQuery(`player-list-${year}`, 'player', true, 'players_teams', 
        [
            ['year = ', req.query.year]
        ], null, 'player ASC');

        if (players.length > 0) {
            res.send(players.map(element => Object.values(element)[0]));
        }
    }
});

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

const validateHero = async (req, res, next) => {
    const { hero } = req.params;
    let heroes = await selectQuery('hero-list', 'lower(hero)', true, 'player_stats',
    [
        [" WHERE hero != 'All Heroes'"]
    ]);
    heroes = heroes.map(element => Object.values(element)[0]);
    if (heroes.includes(hero.toLowerCase())) {
        next();
    } else {
        res.status(400).send('Invalid hero name (non-case sensitive. For a full list of heroes, request GET api/players/heroes');
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
})

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

playersRouter.get('/:player/:hero', validatePlayer, validateHero, async (req, res) => {
    const { player, hero } = req.params;

    if (!req.query.year) {
        const heroAvgStats = await selectQuery(`${player}-${hero}-avg-stats`, 'stat_name, AVG(stat_amount) as player_average',
        false, 'player_stats', 
        [
            ['lower(player) = ', player.toLowerCase()],
            ['lower(hero) = ', hero, 'AND']
        ], 'stat_name');
        res.send(heroAvgStats);
    } else {
        const heroAvgStats = await selectQuery(`${player}-${hero}-avg-stats-${req.query.year}`, 'stat_name, AVG(stat_amount) as player_average',
        false, 'player_stats', 
        [
            ['lower(player) = ', player.toLowerCase()],
            ['lower(hero) = ', hero.toLowerCase(), 'AND'],
            ['year = ', req.query.year, 'AND']
        ], 'stat_name');
        res.send(heroAvgStats);
    }
});



module.exports = playersRouter;