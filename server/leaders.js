const express = require('express');
const leadersRouter = express.Router();
const { selectQuery } = require('./db');

leadersRouter.get('/matches', async (req, res, next) => {
    if (!req.query.year) {
        const matchLeaders = await selectQuery('match-leaders', 'player, COUNT(DISTINCT match_id) AS match_count',
        false, 'player_stats', null, 'player', 'match_count DESC');
        if (matchLeaders.length > 0) {
            res.send(matchLeaders);
        }
    } else {
        const matchLeaders = await selectQuery('match-leaders', 'player, COUNT(DISTINCT match_id) AS match_count',
        false, 'player_stats', 
        [
            ['year', req.query.year]
        ], 'player', 'match_count DESC');
        
        if (matchLeaders.length > 0) {
            res.send(matchLeaders);
        }
    }
})

module.exports = leadersRouter;