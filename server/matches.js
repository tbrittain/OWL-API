const express = require('express');
const matchesRouter = express.Router({ mergeParams: true });
const { selectQuery } = require('./db');

matchesRouter.get('/maps', async (req, res) => {
    const maps = await selectQuery('map-list-by-type', 'map_type, ARRAY_AGG(DISTINCT map_name) AS map_name',
    false, 'map_stats', null, 'map_type');
    res.send(maps);
})

module.exports = matchesRouter;