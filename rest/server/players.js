const express = require('express')
const playersRouter = express.Router({ mergeParams: true })
const { selectQuery } = require('./db')

playersRouter.get('/', async (req, res) => {
  if (!req.query.year) {
    const players = await selectQuery(
      'player-list-total',
      'player AS name, ARRAY_AGG(team) AS team, ARRAY_AGG(year) AS year',
      true,
      'players_teams',
      null,
      'player',
      'player ASC'
    )
    if (players.length > 0) {
      res.send(players)
    }
  } else {
    const players = await selectQuery(
      `player-list-${req.query.year}`,
      'player AS name, ARRAY_AGG(team) AS team, ARRAY_AGG(year) AS year',
      true,
      'players_teams',
      [['year = ', req.query.year]],
      'player',
      'player ASC'
    )

    if (players.length > 0) {
      res.send(players)
    }
  }
})

const validatePlayer = async (req, res, next) => {
  const { player } = req.params
  let players = await selectQuery(
    'player-list',
    'lower(player)',
    true,
    'players_teams',
    null,
    null,
    'lower(player) ASC'
  )
  players = players.map((element) => Object.values(element)[0])

  if (players.includes(player.toLowerCase())) {
    next()
  } else {
    res
      .status(400)
      .send(
        'Invalid player name (non-case sensitive). For a full list of players, request GET api/players/'
      )
  }
}

const validateHeroParams = async (req, res, next) => {
  const { hero } = req.params
  let heroes = await selectQuery(
    'hero-list',
    'lower(hero)',
    true,
    'player_stats',
    [[" WHERE hero != 'All Heroes'"]]
  )
  heroes = heroes.map((element) => Object.values(element)[0])
  if (heroes.includes(hero.toLowerCase())) {
    next()
  } else {
    res
      .status(400)
      .send(
        'Invalid hero name (non-case sensitive). For a full list of heroes, request GET api/players/heroes'
      )
  }
}

const validateMatchIdsQuery = async (req, res, next) => {
  if (req.query.match_ids) {
    const matchIds = req.query.match_ids.split(',')
    let existingMatchIds = await selectQuery(
      'total-match-ids',
      'match_id',
      true,
      'player_stats'
    )
    existingMatchIds = existingMatchIds.map(
      (element) => Object.values(element)[0]
    )

    const invalid = []
    for (const matchId of matchIds) {
      if (!existingMatchIds.includes(Number(matchId))) {
        // console.log(`Invalid match ID provided: ${matchId}`)
        invalid.push(matchId)
      }
    }
    if (invalid.length > 0) {
      res.status(400).send(`Invalid match ID provided: ${invalid}`)
    } else {
      next()
    }
  } else {
    next()
  }
}

const validateStatNamesQuery = async (req, res, next) => {
  if (req.query.stat_names) {
    const statNames = req.query.stat_names.split(',')
    let existingStatNames = await selectQuery(
      'total-stat-names',
      'lower(stat_name)',
      true,
      'player_stats'
    )
    existingStatNames = existingStatNames.map(
      (element) => Object.values(element)[0]
    )

    // console.log(existingStatNames);
    const invalid = []
    for (const statName of statNames) {
      if (!existingStatNames.includes(statName.toLowerCase())) {
        // console.log(`Invalid stat name provided: ${statName}`);
        invalid.push(statName)
      }
    }
    if (invalid.length > 0) {
      res.status(400).send(`Invalid stat name provided: ${invalid}`)
    } else {
      next()
    }
  } else {
    next()
  }
}

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
    res.status(400).send(`Invalid match ID provided: ${matchId}`)
  } else {
    next()
  }
}

playersRouter.get('/:player', validatePlayer, async (req, res) => {
  const { player } = req.params

  if (!req.query.year) {
    const matches = await selectQuery(
      `${player}-details-overall`,
      'MAX(player) AS name, ARRAY_AGG(year) as year, ARRAY_AGG(DISTINCT team) as team',
      false,
      'players_teams',
      [
        ['player = ', player]
      ],
      'player'
    )

    if (matches.length > 0) {
      res.send(matches)
    }
  } else {
    const matches = await selectQuery(
      `${player}-details-${req.query.year}`,
      'MAX(player) AS name, ARRAY_AGG(year) as year, ARRAY_AGG(DISTINCT team) as team',
      false,
      'players_teams',
      [
        ['player = ', player],
        ['year = ', req.query.year, 'AND']
      ],
      'player'
    )

    if (matches.length > 0) {
      res.send(matches)
    }
  }
})

playersRouter.get('/:player/matches', validatePlayer, async (req, res) => {
  const { player } = req.params

  if (!req.query.year) {
    const matches = await selectQuery(`${player}-matches-overall`,
      'match_id as id',
      true,
      'player_stats',
      [
        ['player = ', player]
      ])
    res.send(matches)
  } else {
    const matches = await selectQuery(`${player}-matches-overall`,
      'match_id as id',
      true,
      'player_stats',
      [
        ['player = ', player],
        ['year = ', req.query.year, 'AND']
      ])
    if (matches.length > 0) {
      res.send(matches)
    } else {
      res.status(404).send(`${player} has not played any matches in ${req.query.year}`)
    }
  }
})

playersRouter.get('/:player/matches/:matchId', validateMatchIdParams, async (req, res) => {
  const { player, matchId } = req.params
  let heroesPlayed = await selectQuery(
    `${player}-${matchId}-unique-heroes`,
    'hero',
    true,
    'player_stats',
    [
      ['lower(player) = ', player.toLowerCase()],
      ['match_id = ', matchId, 'AND']
    ])
  heroesPlayed = heroesPlayed.map((element) => Object.values(element)[0])

  if (heroesPlayed.length === 0) {
    res.status(404).send(`Player ${player} did not participate in match of ID ${matchId}`)
    return
  }

  const heroStats = {}

  for (const hero of heroesPlayed) {
    const stats = await selectQuery(
      `${player}-${matchId}-${hero}-stats`,
      'stat_name, SUM(stat_amount) AS stat_amount',
      false,
      'player_stats',
      [
        ['lower(player) = ', player.toLowerCase()],
        ['match_id = ', matchId, 'AND'],
        ['hero = ', hero, 'AND']
      ],
      'stat_name')
    const formattedMatchStat = {}
    for (const stat of stats) {
      formattedMatchStat[stat.stat_name] = stat.stat_amount
    }
    heroStats[hero] = formattedMatchStat
  }

  res.send(heroStats)
})

playersRouter.get('/heroes', async (req, res) => {
  let heroes = await selectQuery(
    'hero-list',
    'hero',
    true,
    'player_stats',
    [[" WHERE hero != 'All Heroes'"]],
    null,
    'hero'
  )
  heroes = heroes.map((element) => Object.values(element)[0])
  res.send(heroes)
})

playersRouter.get(
  '/:player/matches/heroes',
  validatePlayer,
  async (req, res) => {
    const { player } = req.params

    if (!req.query.year) {
      const heroes = await selectQuery(
        `${player}-match-heroes`,
        'match_id, ARRAY_AGG(DISTINCT hero) AS heroes',
        false,
        'player_stats',
        [
          ['lower(player) = ', player.toLowerCase()],
          [" AND hero != 'All Heroes'"]
        ],
        'match_id'
      )
      if (heroes.length > 0) {
        res.send(heroes)
      }
    } else {
      const heroes = await selectQuery(
        `${player}-match-heroes`,
        'match_id, ARRAY_AGG(DISTINCT hero) AS heroes',
        false,
        'player_stats',
        [
          ['lower(player) = ', player.toLowerCase()],
          ['year = ', req.query.year, 'AND'],
          [" AND hero != 'All Heroes'"]
        ],
        'match_id'
      )
      if (heroes.length > 0) {
        res.send(heroes)
      }
    }
  }
)

playersRouter.get('/:player/heroes', validatePlayer, async (req, res) => {
  const { player } = req.params

  const heroes = await selectQuery(
    `hero-list-${player}`,
    'year, ARRAY_AGG(DISTINCT hero)',
    false,
    'player_stats',
    [
      ['lower(player) = ', player.toLowerCase()],
      ['hero != ', 'All Heroes', 'AND']
    ],
    'year'
  )
  res.send(heroes)
})

playersRouter.get('/heroes/stat-names', async (req, res) => {
  const statNames = await selectQuery(
    'stat-names-by-hero',
    'hero, ARRAY_AGG(DISTINCT stat_name) AS stat_names',
    true,
    'player_stats',
    null,
    'hero'
  )
  res.send(statNames)
})

playersRouter.get(
  '/:player/heroes/:hero',
  validatePlayer,
  validateHeroParams,
  validateMatchIdsQuery,
  validateStatNamesQuery,
  async (req, res) => {
    const { player, hero } = req.params

    let matchIds
    let statNames

    if (req.query.stat_names) {
      statNames = req.query.stat_names.split(',')
      statNames = statNames.map((stat) => stat.toLowerCase())
    }

    if (req.query.match_ids) {
      matchIds = req.query.match_ids.split(',')
      let heroMatchStats = {}
      for (const matchId of matchIds) {
        let matchStat = await selectQuery(
          `${player}-${hero}-stats-${matchId}`,
          'stat_name, ROUND(AVG(stat_amount), 2) AS match_average',
          false,
          'player_stats',
          [
            ['lower(player) = ', player.toLowerCase()],
            ['lower(hero) = ', hero.toLowerCase(), 'AND'],
            ['match_id = ', matchId, 'AND']
          ],
          'stat_name'
        )
        if (statNames) {
          matchStat = matchStat.filter((element) => {
            return statNames.includes(element.stat_name.toLowerCase())
          })
        }
        const formattedMatchStat = {}
        for (const stat of matchStat) {
          formattedMatchStat[stat.stat_name] = stat.match_average
        }
        if (matchIds.length === 1) {
          heroMatchStats = formattedMatchStat
        } else {
          heroMatchStats[matchId] = formattedMatchStat
        }
      }
      res.send(heroMatchStats)
      return
    }

    if (!req.query.year) {
      let heroAvgStats = await selectQuery(
        `${player}-${hero}-avg-stats`,
        'stat_name, ROUND(AVG(stat_amount), 2) as player_average',
        false,
        'player_stats',
        [
          ['lower(player) = ', player.toLowerCase()],
          ['lower(hero) = ', hero.toLowerCase(), 'AND']
        ],
        'stat_name'
      )
      if (heroAvgStats.length > 0) {
        if (statNames) {
          heroAvgStats = heroAvgStats.filter((element) => {
            return statNames.includes(element.stat_name.toLowerCase())
          })
        }

        const formattedMatchStat = {}
        for (const stat of heroAvgStats) {
          formattedMatchStat[stat.stat_name] = stat.player_average
        }
        res.send(formattedMatchStat)
      } else {
        res.status(404).send(`${player} has not played any matches as ${hero}`)
      }
    } else {
      let heroAvgStats = await selectQuery(
        `${player}-${hero}-avg-stats-${req.query.year}`,
        'stat_name, ROUND(AVG(stat_amount), 2) as player_average',
        false,
        'player_stats',
        [
          ['lower(player) = ', player.toLowerCase()],
          ['lower(hero) = ', hero.toLowerCase(), 'AND'],
          ['year = ', req.query.year, 'AND']
        ],
        'stat_name'
      )
      if (heroAvgStats.length > 0) {
        if (statNames) {
          heroAvgStats = heroAvgStats.filter((element) => {
            return statNames.includes(element.stat_name.toLowerCase())
          })
        }

        const formattedMatchStat = {}
        for (const stat of heroAvgStats) {
          formattedMatchStat[stat.stat_name] = stat.player_average
        }
        res.send(formattedMatchStat)
      } else {
        res.status(404).send(`${player} has not played any matches as ${hero}`)
      }
    }
  }
)

module.exports = {
  playersRouter: playersRouter
}
