const express = require('express')
const matchesRouter = express.Router({ mergeParams: true })
const { selectQuery } = require('./db')
const escape = require('escape-html')

matchesRouter.get('/maps', async (req, res) => {
  const maps = await selectQuery(
    'map-list-by-type',
    'map_type, ARRAY_AGG(DISTINCT map_name) AS map_name',
    false,
    'map_stats',
    null,
    'map_type'
  )
  res.send(maps)
})

const validateMatchIdParams = async (req, res, next) => {
  const { matchId } = req.params
  let existingMatchIds = await selectQuery(
    'total-match-ids',
    'match_id',
    true,
    'player_stats'
  )
  existingMatchIds = existingMatchIds.map(
    (element) => Object.values(element)[0]
  )
  if (!existingMatchIds.includes(Number(matchId))) {
    res.status(400).send(`Invalid match ID provided: ${escape(matchId)}`)
  } else {
    next()
  }
}

matchesRouter.get('/', async (req, res) => {
  const years = [2018, 2019, 2020, 2021]
  if (!req.query.year) {
    const results = {}
    for (const year of years) {
      const yearlyMatches = await selectQuery(
        `${req.query.year}-match-history`,
        `stage, 
      CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
      WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
      WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
      END AS stage_type,
      ARRAY_AGG(DISTINCT match_id) AS matches`,
        false,
        'map_stats',
        [['year = ', year]],
        'stage, playoffs, postseason',
        'stage ASC'
      )
      results[year] = yearlyMatches
    }
    res.send(results)
  } else {
    const results = await selectQuery(
      `${req.query.year}-match-history`,
      `stage, 
    CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
    WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
    WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
    END AS stage_type,
    ARRAY_AGG(DISTINCT match_id) AS matches`,
      false,
      'map_stats',
      [['year = ', req.query.year]],
      'stage, playoffs, postseason',
      'stage ASC'
    )
    res.send(results)
  }
})

// TODO: fix this endpoint to be more compliant with the GraphQL endpoint
// may want to separate it into a couple or several endpoints to query games within matches, and rounds within games
matchesRouter.get('/:matchId', validateMatchIdParams, async (req, res) => {
  const { matchId } = req.params
  let overallResults = await selectQuery(
    `${matchId}-match-results`,
    'MAX(year) AS year, MAX(round_start_time) AS round_start_time, winner, ARRAY_AGG(DISTINCT teams) AS teams',
    false,
    `(SELECT year, round_start_time, match_winner AS winner, map_winner AS teams 
    FROM map_stats 
    WHERE match_id = ${matchId} 
    AND map_winner != 'draw'
    UNION 
    SELECT year, round_start_time, match_winner AS winner, map_loser AS teams
    FROM map_stats 
    WHERE match_id = ${matchId}
    AND map_winner != 'draw') match_history`,
    null,
    'winner'
  )
  overallResults = overallResults[0]
  res.send(overallResults)
})

matchesRouter.get('/:matchId/games', validateMatchIdParams, async (req, res) => {
  const { matchId } = req.params
  const totalGameResults = await selectQuery(
    `rounds-match-id-${matchId}`,
    `game_number, map_name, map_winner, map_loser, map_type, map_round, attacker, defender, 
  winning_team_final_map_score, losing_team_final_map_score, control_round_name, defender_payload_distance,
  attacker_time_banked, defender_time_banked, attacker_control_perecent AS attacker_control_percent,
  defender_control_perecent AS defender_control_percent, attacker_round_end_score, defender_round_end_score`,
    false,
    'map_stats',
    [['match_id = ', matchId]],
    null,
    'game_number ASC, map_round ASC'
  )
  const games = {}
  for (const game of totalGameResults) {
    if (!Object.keys(games).includes(String(game.game_number))) {
      games[game.game_number] = {
        game_number: game.game_number,
        map_name: game.map_name,
        map_winner: game.map_winner,
        winner_final_map_score: game.winning_team_final_map_score,
        loser_final_map_score: game.losing_team_final_map_score,
        map_type: game.map_type,
        rounds: []
      }
    }
    const mapRound = {
      round_number: game.map_round,
      attacker: game.attacker,
      defender: game.defender,
      stats: []
    }
    if (game.map_type === 'payload') {
      mapRound.stats.push({
        stat_name: 'Defender payload distance',
        stat_amount: Number(game.defender_payload_distance)
      })
      mapRound.stats.push({
        stat_name: 'Attacker time banked',
        stat_amount: Number(game.attacker_time_banked)
      })
      mapRound.stats.push({
        stat_name: 'Defender time banked',
        stat_amount: Number(game.defender_time_banked)
      })
      mapRound.stats.push({
        stat_name: 'Attacker round end score',
        stat_amount: Number(game.attacker_round_end_score)
      })
      mapRound.stats.push({
        stat_name: 'Defender round end score',
        stat_amount: Number(game.defender_round_end_score)
      })
    } else if (game.map_type === 'control') {
      // Although this refactoring makes it more GraphQL-compliant,
      // will not be able to pull out control round name
      // mapRound.control_round_name = game.control_round_name
      mapRound.stats.push({
        stat_name: 'Attacker control percent',
        stat_amount: Number(game.attacker_control_percent)
      })
      mapRound.stats.push({
        stat_name: 'Defender control percent',
        stat_amount: Number(game.defender_control_percent)
      })
      mapRound.stats.push({
        stat_name: 'Attacker round end score',
        stat_amount: Number(game.attacker_round_end_score)
      })
      mapRound.stats.push({
        stat_name: 'Defender round end score',
        stat_amount: Number(game.defender_round_end_score)
      })
    } else if (game.map_type === 'assault') {
      mapRound.stats.push({
        stat_name: 'Attacker time banked',
        stat_amount: Number(game.attacker_time_banked)
      })
      mapRound.stats.push({
        stat_name: 'Defender time banked',
        stat_amount: Number(game.defender_time_banked)
      })
      mapRound.stats.push({
        stat_name: 'Attacker round end score',
        stat_amount: Number(game.attacker_round_end_score)
      })
      mapRound.stats.push({
        stat_name: 'Defender round end score',
        stat_amount: Number(game.defender_round_end_score)
      })
    } else if (game.map_type === 'hybrid') {
      mapRound.stats.push({
        stat_name: 'Defender payload distance',
        stat_amount: Number(game.defender_payload_distance)
      })
      mapRound.stats.push({
        stat_name: 'Attacker time banked',
        stat_amount: Number(game.attacker_time_banked)
      })
      mapRound.stats.push({
        stat_name: 'Defender time banked',
        stat_amount: Number(game.defender_time_banked)
      })
      mapRound.stats.push({
        stat_name: 'Attacker round end score',
        stat_amount: Number(game.attacker_round_end_score)
      })
      mapRound.stats.push({
        stat_name: 'Defender round end score',
        stat_amount: Number(game.defender_round_end_score)
      })
    }
    games[game.game_number]["rounds"].push(mapRound) // eslint-disable-line
  }
  res.send(Object.values(games))
})

module.exports = matchesRouter
