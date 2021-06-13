const express = require('express')
const teamsRouter = express.Router({ mergeParams: true })
const { selectQuery } = require('./db')

teamsRouter.get('/', async (req, res) => {
  const teams = await selectQuery(
    'teams-names',
    'team as name',
    true,
    'players_teams'
  )
  res.send(teams)
})

const validateTeamName = async (req, res, next) => {
  const { team } = req.params

  let teams = await selectQuery(
    'team-names-lower',
    'lower(attacker)',
    true,
    'map_stats',
    null,
    null,
    'lower(attacker) ASC'
  )
  teams = teams.map((element) => Object.values(element)[0])

  if (!teams.includes(team.toLowerCase())) {
    res.status(400).send(`Invalid team name: ${team}`)
  } else {
    next()
  }
}

const validateDualTeams = async (req, res, next) => {
  const { teamOne, teamTwo } = req.params

  let teams = await selectQuery(
    'team-names-lower',
    'lower(attacker)',
    true,
    'map_stats',
    null,
    null,
    'lower(attacker) ASC'
  )
  teams = teams.map((element) => Object.values(element)[0])

  if (teamOne.toLowerCase() === teamTwo.toLowerCase()) {
    res.status(400).send('Team history comparison cannot be of the same team')
    return
  }
  if (
    !teams.includes(teamOne.toLowerCase()) ||
    !teams.includes(teamTwo.toLowerCase())
  ) {
    res.status(400).send('Invalid team name provided')
    return
  }
  next()
}

teamsRouter.get('/:team', validateTeamName, async (req, res) => {
  let { team } = req.params
  team = team.toLowerCase()

  let teamYears = await selectQuery(
    `${team}-seasons-list`,
    'year',
    true,
    'players_teams',
    [
      ['lower(team) = ', team]
    ])

  teamYears = teamYears.map((element) => Object.values(element)[0])
  const formattedResult = []

  if (teamYears.includes(req.query.year)) {
    teamYears = req.query.year
  }

  for (const year of teamYears) {
    const yearObj = {
      year: year
    }
    // get players of this team from this year to iterate over
    let teamPlayersFromYear = await selectQuery(
      `${team}-lineup-${year}`,
      'player',
      false,
      'players_teams',
      [
        ['lower(team) = ', team],
        ['year = ', year, 'AND']
      ])
    teamPlayersFromYear = teamPlayersFromYear.map((element) => Object.values(element)[0])

    const individualPlayerList = []
    for (const player of teamPlayersFromYear) {
      const playerDetailsFromYear = await selectQuery(
        `${player}-details-overall`,
        'MAX(player) AS name, ARRAY_AGG(year) as year, ARRAY_AGG(DISTINCT team) as team',
        false,
        'players_teams',
        [
          ['player = ', player]
        ],
        'player'
      )
      individualPlayerList.push(playerDetailsFromYear[0])
    }
    yearObj.players = individualPlayerList
    formattedResult.push(yearObj)
  }
  res.send(formattedResult)
})

teamsRouter.get('/:team/matches', validateTeamName, async (req, res) => {
  const { team } = req.params

  let teamYears = await selectQuery(
    `${team}-seasons-list`,
    'year',
    true,
    'players_teams',
    [
      ['lower(team) = ', team.toLowerCase()]
    ])

  teamYears = teamYears.map((element) => Object.values(element)[0])

  if (!req.query.year) {
    const results = []
    for (const year of teamYears) {
      const yearlyMatches = await selectQuery(
        `${team}-${year}-match-history`,
        `stage, 
      CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
      WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
      WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
      END AS type,
      ARRAY_AGG(DISTINCT match_id) AS matches`,
        false,
        'map_stats',
        [
          ['year = ', year],
          ['attacker = ', team, 'AND']
        ],
        'stage, playoffs, postseason',
        'stage ASC'
      )
      results[year] = yearlyMatches
    }
    res.send(results)
  } else {
    const results = await selectQuery(
      `${team}-${req.query.year}-match-history`,
      `stage, 
    CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
    WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
    WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
    END AS type,
    ARRAY_AGG(DISTINCT match_id) AS matches`,
      false,
      'map_stats',
      [
        ['year = ', req.query.year],
        ['attacker = ', team, 'AND']
      ],
      'stage, playoffs, postseason',
      'stage ASC'
    )
    res.send(results)
  }
})

teamsRouter.get('/:team/match-history', validateTeamName, async (req, res) => {
  const years = [2018, 2019, 2020, 2021]
  const { team } = req.params

  if (!req.query.year) {
    const results = {}
    for (const year of years) {
      const yearlyMatches = await selectQuery(
        `${team}-${year}-match-history-detailed`,
        `stage, CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
      WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
      WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
      END AS stage_type, match_id, ARRAY_AGG(DISTINCT ARRAY[attacker, defender]) AS matchup,
      MAX(match_winner) as match_winner`,
        false,
        'map_stats',
        [
          ['year = ', year],
          // TODO not parameterizing query, but this is OK since middleware validates - may fix in the future
          [
            ` AND (lower(attacker) = '${team.toLowerCase()}' OR lower(defender) = '${team.toLowerCase()}')`
          ]
        ],
        'stage, playoffs, postseason, match_id',
        'stage ASC, playoffs DESC'
      )

      for (const match of yearlyMatches) {
        if (match.matchup[0].length === 2) {
          //eslint-disable-line
          match["matchup"] = match["matchup"][0]; //eslint-disable-line
        } else {
          match["matchup"] = match["matchup"][1]; //eslint-disable-line
        }
      }
      if (yearlyMatches.length > 0) {
        results[year] = yearlyMatches
      }
    }
    res.send(results)
  } else {
    const results = await selectQuery(
      `${team}-match-history-detailed`,
      `stage, CASE WHEN playoffs IS NULL AND postseason IS NULL THEN 'Regular Season' 
    WHEN playoffs = 'true' AND postseason IS NULL THEN 'Stage Playoffs' 
    WHEN playoffs = 'true' AND postseason = 'true' THEN 'Postseason' 
    END AS stage_type, match_id, ARRAY_AGG(DISTINCT ARRAY[attacker, defender]) AS matchup,
    MAX(match_winner) as match_winner`,
      false,
      'map_stats',
      [
        ['year = ', req.query.year],
        [
          ` AND (lower(attacker) = '${team.toLowerCase()}' OR lower(defender) = '${team.toLowerCase()}')`
        ]
      ],
      'stage, playoffs, postseason, match_id',
      'stage ASC, playoffs DESC'
    )
    for (const match of results) {
      if (match.matchup[0].length === 2) {
        //eslint-disable-line
        match["matchup"] = match["matchup"][0]; //eslint-disable-line
      } else {
        match["matchup"] = match["matchup"][1]; //eslint-disable-line
      }
    }
    if (results.length > 0) {
      res.send(results)
    } else {
      res
        .status(404)
        .send(
          'No matches found for the given year. Is this an expansion team?'
        )
    }
  }
})

// TODO
teamsRouter.get('/:teamOne/:teamTwo', validateDualTeams, async (req, res) => {
  res.send()
})

module.exports = teamsRouter
