const express = require('express')
const matchesRouter = express.Router({ mergeParams: true })
const { selectQuery } = require('./db')

matchesRouter.get('/maps', async (req, res) => {
  const maps = await selectQuery('map-list-by-type', 'map_type, ARRAY_AGG(DISTINCT map_name) AS map_name',
    false, 'map_stats', null, 'map_type')
  res.send(maps)
})

const validateMatchIdParams = async (req, res, next) => {
  const { matchId } = req.params
  let existingMatchIds = await selectQuery('total-match-ids', 'match_id', true, 'player_stats')
  existingMatchIds = existingMatchIds.map(element => Object.values(element)[0])
  if (!existingMatchIds.includes(Number(matchId))) {
    res.status(400).send(`Invalid match ID provided: ${matchId}`)
  } else {
    next()
  }
}

matchesRouter.get('/', async (req, res) => {
  const years = [2018, 2019, 2020, 2021]
  if (!req.query.year) {
    const results = {}
    for (const year of years) {
      const yearlyMatches = await selectQuery(`${req.query.year}-match-history`, `stage, 
      CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
      WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
      WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
      END AS stage_type,
      ARRAY_AGG(DISTINCT match_id) AS matches`, false, 'map_stats',
      [
        ['year = ', year]
      ], 'stage, playoffs, postseason', 'stage ASC')
      results[year] = yearlyMatches
    }
    res.send(results)
  } else {
    const results = await selectQuery(`${req.query.year}-match-history`, `stage, 
    CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
    WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
    WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
    END AS stage_type,
    ARRAY_AGG(DISTINCT match_id) AS matches`, false, 'map_stats',
    [
      ['year = ', req.query.year]
    ], 'stage, playoffs, postseason', 'stage ASC')
    res.send(results)
  }
})

matchesRouter.get('/:matchId', validateMatchIdParams, async (req, res) => {
  const { matchId } = req.params
  // not parameterizing the conditional statements in the subqueries, but this is ok since the middleware validates matchid
  const results = await selectQuery(`${matchId}-match-results`,
    'MAX(year) AS year, winner, ARRAY_AGG(DISTINCT teams) AS teams, ARRAY_AGG(DISTINCT map_name) AS maps',
    false, `(SELECT year, match_winner AS winner, map_winner AS teams 
    FROM map_stats 
    WHERE match_id = ${matchId} 
    AND map_winner != 'draw'
    UNION 
    SELECT year, match_winner AS winner, map_loser AS teams 
    FROM map_stats 
    WHERE match_id = ${matchId}
    AND map_winner != 'draw') match_history, 
    (SELECT DISTINCT map_name 
    FROM map_stats 
    WHERE match_id = ${matchId}) maps_played`, null, 'winner')
  res.send(results)
})

module.exports = matchesRouter
