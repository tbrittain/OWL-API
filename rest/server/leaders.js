const express = require('express')
const leadersRouter = express.Router({ mergeParams: true })
const { selectQuery } = require('./db')
const escape = require('escape-html')

leadersRouter.get('/matches', async (req, res) => {
  let resultLimit = null

  if (req.query.limit) {
    resultLimit = req.query.limit
  }

  if (!req.query.year) {
    const matchLeaders = await selectQuery(
      'match-leaders',
      'player, COUNT(DISTINCT match_id) AS match_count',
      false,
      'player_stats',
      null,
      'player',
      'match_count DESC',
      resultLimit
    )
    if (matchLeaders.length > 0) {
      res.send(matchLeaders)
    }
  } else {
    const matchLeaders = await selectQuery(
      `match-leaders-${req.query.year}`,
      'player, COUNT(DISTINCT match_id) AS match_count',
      false,
      'player_stats',
      [['year = ', req.query.year]],
      'player',
      'match_count DESC',
      resultLimit
    )

    if (matchLeaders.length > 0) {
      res.send(matchLeaders)
    }
  }
})

const validateStatNamesParams = async (req, res, next) => {
  const { statName } = req.params

  let existingStatNames = await selectQuery(
    'total-stat-names',
    'lower(stat_name)',
    true,
    'player_stats'
  )
  existingStatNames = existingStatNames.map(
    (element) => Object.values(element)[0]
  )

  if (!existingStatNames.includes(statName.toLowerCase())) {
    res.status(400).send(`Invalid stat name provided: ${escape(statName)}`)
  } else {
    next()
  }
}

const validateHeroNameQuery = async (req, res, next) => {
  if (req.query.hero) {
    let heroes = await selectQuery(
      'hero-list',
      'lower(hero)',
      true,
      'player_stats'
    )
    heroes = heroes.map((element) => Object.values(element)[0])

    if (heroes.includes(req.query.hero.toLowerCase())) {
      next()
    } else {
      res
        .status(400)
        .send(
          'Invalid hero name (non-case sensitive). For a full list of heroes, request GET api/players/heroes'
        )
    }
  } else {
    next()
  }
}

leadersRouter.get(
  '/single-game/:statName',
  validateStatNamesParams,
  validateHeroNameQuery,
  async (req, res) => {
    const { statName } = req.params

    let resultLimit = 100

    if (req.query.limit) {
      if (req.query.limit <= 100) {
        try {
          resultLimit = Number(req.query.limit)
        } catch (e) {
          res.status(400).send(`Invalid result limit: ${escape(req.query.limit)}`)
          return
        }
      } else {
        res.status(400).send(`Invalid result limit: ${escape(req.query.limit)}`)
        return
      }
    }

    const dataSort = req.query.invert == "true" ? req.query.invert : false; // eslint-disable-line
    const minMax = dataSort ? 'MIN' : 'MAX'
    const ascDesc = dataSort ? 'ASC' : 'DESC'

    // no year query
    if (!req.query.year) {
      // no hero query
      if (!req.query.hero) {
        const leaders = await selectQuery(
          `top-${resultLimit}-${statName.toLowerCase()}-${minMax.toLowerCase()}-${minMax}`,
          `player, year, match_id, ARRAY_AGG(DISTINCT hero) AS heroes, ${minMax}(stat_amount) AS stat_amount`,
          false,
          'player_stats',
          [['lower(stat_name) = ', statName.toLowerCase()]],
          'player, year, match_id',
          `${minMax}(stat_amount) ${ascDesc}`,
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
        // hero query present
      } else {
        const leaders = await selectQuery(
          `${resultLimit}-${
            req.query.hero
          }-${statName.toLowerCase()}-${minMax.toLowerCase()}-${minMax}`,
          'player, year, match_id, stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
          ],
          null,
          `stat_amount ${ascDesc}`,
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
      }
      // year query present
    } else {
      // no hero query
      if (!req.query.hero) {
        const leaders = await selectQuery(
          `${resultLimit}-${statName.toLowerCase()}-${
            req.query.year
          }-${minMax.toLowerCase()}-${minMax}`,
          `player, match_id, ARRAY_AGG(DISTINCT hero) AS heroes, ${minMax}(stat_amount) AS stat_amount`,
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['year = ', req.query.year, 'AND']
          ],
          'player, year, match_id',
          `${minMax}(stat_amount) ${ascDesc}`,
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
        // hero query present
      } else {
        const leaders = await selectQuery(
          `top-${resultLimit}-${req.query.hero}-${statName.toLowerCase()}-${
            req.query.year
          }-${minMax.toLowerCase()}-${minMax}`,
          'player, match_id, stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['year = ', req.query.year, 'AND'],
            ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
          ],
          null,
          `stat_amount ${ascDesc}`,
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
      }
    }
  }
)

leadersRouter.get(
  '/career-sum/:statName',
  validateStatNamesParams,
  validateHeroNameQuery,
  async (req, res) => {
    const { statName } = req.params

    let resultLimit = 100

    if (req.query.limit) {
      if (req.query.limit <= 100) {
        try {
          resultLimit = Number(req.query.limit)
        } catch (e) {
          res.status(400).send(`Invalid result limit: ${escape(req.query.limit)}`)
          return
        }
      } else {
        res.status(400).send(`Invalid result limit: ${escape(req.query.limit)}`)
        return
      }
    }

    // no year query
    if (!req.query.year) {
      // no hero query
      if (!req.query.hero) {
        const leaders = await selectQuery(
          `career-sum-${resultLimit}-${statName.toLowerCase()}-sum`,
          'player, ARRAY_AGG(DISTINCT year) AS years, COUNT(match_id) AS num_matches, ARRAY_AGG(DISTINCT hero) AS heroes, SUM(stat_amount) AS stat_amount',
          false,
          'player_stats',
          [['lower(stat_name) = ', statName.toLowerCase()]],
          'player',
          'SUM(stat_amount) DESC',
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
        // hero query present
      } else {
        const leaders = await selectQuery(
          `career-sum-${resultLimit}-${
            req.query.hero
          }-${statName.toLowerCase()}-sum`,
          'player, ARRAY_AGG(DISTINCT year) AS years, COUNT(match_id) AS num_matches, SUM(stat_amount) AS stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
          ],
          'player',
          'SUM(stat_amount) DESC',
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
      }
      // year query present
    } else {
      // no hero query
      if (!req.query.hero) {
        const leaders = await selectQuery(
          `career-sum-${resultLimit}-${statName.toLowerCase()}-${
            req.query.year
          }-sum`,
          'player, ARRAY_AGG(DISTINCT hero) AS heroes, COUNT(match_id) AS num_matches, SUM(stat_amount) AS stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['year = ', req.query.year, 'AND']
          ],
          'player',
          'SUM(stat_amount) DESC',
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
        // hero query present
      } else {
        const leaders = await selectQuery(
          `career-sum-${resultLimit}-${
            req.query.hero
          }-${statName.toLowerCase()}-${req.query.year}-sum`,
          'player, COUNT(match_id) AS num_matches, SUM(stat_amount) AS stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['year = ', req.query.year, 'AND'],
            ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
          ],
          'player',
          'SUM(stat_amount) DESC',
          resultLimit
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
      }
    }
  }
)

leadersRouter.get(
  '/career-avg/:statName',
  validateStatNamesParams,
  validateHeroNameQuery,
  async (req, res) => {
    const { statName } = req.params

    let resultLimit = 100

    if (req.query.limit) {
      console.log('Checking result limit...')
      try {
        resultLimit = Number(req.query.limit)
      } catch (e) {
        res.status(400).send(`Invalid result limit: ${escape(req.query.limit)}`)
        return
      }
      console.log('No error from typechecking limit, continuing...')
      if (resultLimit > 100) {
        res.status(400).send(`Invalid result limit: ${escape(req.query.limit)}`)
        return
      }
      console.log(`Limit check passed: limit = ${resultLimit}`)
    }

    const dataSort = req.query.invert == "true" ? req.query.invert : false; // eslint-disable-line
    const ascDesc = dataSort ? 'ASC' : 'DESC'

    let minMatches = 1
    if (req.query.min_matches) {
      try {
        minMatches = Number(req.query.min_matches)
      } catch (e) {
        res
          .status(400)
          .send(`Invalid minimum number of matches: ${escape(req.query.min_matches)}`)
        return
      }
    }

    // TODO: could think about refactoring these if/else statements to instead construct the SQL query in a modular format to keep things DRY
    // no year query
    if (!req.query.year) {
      // no hero query
      if (!req.query.hero) {
        const leaders = await selectQuery(
          `career-avg-${resultLimit}-${statName.toLowerCase()}-min-${minMatches}`,
          `player, ARRAY_AGG(DISTINCT year) AS years, COUNT(match_id) AS num_matches, ARRAY_AGG(DISTINCT hero) AS heroes, 
            AVG(stat_amount) AS stat_amount`,
          false,
          'player_stats',
          [['lower(stat_name) = ', statName.toLowerCase()]],
          'player',
          `AVG(stat_amount) ${ascDesc}`,
          resultLimit,
          `COUNT(match_id) >= ${minMatches}`
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
        // hero query present
      } else {
        const leaders = await selectQuery(
          `career-avg-${resultLimit}-${
            req.query.hero
          }-${statName.toLowerCase()}-min-${minMatches}`,
          'player, ARRAY_AGG(DISTINCT year) AS years, COUNT(match_id) AS num_matches, AVG(stat_amount) AS stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
          ],
          'player',
          `AVG(stat_amount) ${ascDesc}`,
          resultLimit,
          `COUNT(match_id) >= ${minMatches}`
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
      }
      // year query present
    } else {
      // no hero query
      if (!req.query.hero) {
        const leaders = await selectQuery(
          `career-avg-${resultLimit}-${statName.toLowerCase()}-${
            req.query.year
          }-min-${minMatches}`,
          'player, ARRAY_AGG(DISTINCT hero) AS heroes, COUNT(match_id) AS num_matches, AVG(stat_amount) AS stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['year = ', req.query.year, 'AND']
          ],
          'player',
          `AVG(stat_amount) ${ascDesc}`,
          resultLimit,
          `COUNT(match_id) >= ${minMatches}`
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
        // hero query present
      } else {
        const leaders = await selectQuery(
          `career-avg-${resultLimit}-${
            req.query.hero
          }-${statName.toLowerCase()}-${req.query.year}-min-${minMatches}`,
          'player, COUNT(match_id) AS num_matches, AVG(stat_amount) AS stat_amount',
          false,
          'player_stats',
          [
            ['lower(stat_name) = ', statName.toLowerCase()],
            ['year = ', req.query.year, 'AND'],
            ['lower(hero) = ', req.query.hero.toLowerCase(), 'AND']
          ],
          'player',
          `AVG(stat_amount) ${ascDesc}`,
          resultLimit,
          `COUNT(match_id) >= ${minMatches}`
        )
        if (leaders.length > 0) {
          res.send(leaders)
        } else {
          res.status(404).send('No results found')
        }
      }
    }
  }
)

module.exports = leadersRouter
