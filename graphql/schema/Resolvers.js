const axios = require('axios').default
const BASE_URL = 'http://owl-api:4000/rest/'

const getEndpoint = async (relativeUrl) => {
  const response = await axios.get(`${BASE_URL}${relativeUrl}`)
  return response.data
}

const renameKey = async (obj, oldKey, newKey) => {
  obj[newKey] = obj[oldKey]
  delete obj[oldKey]
}

// TODO: implement some sort of caching responses, possibly using some sort of embedded db

const resolvers = {
  Query: {
    async getAllPlayers(parent, args, context, info) {
      if (args.year) {
        return await getEndpoint(`players?year=${args.year}`)
      } else {
        return await getEndpoint(`players`)
      }
    },
    async getPlayer(parent, args, context, info) {
      if (args.year) {
        const results = await getEndpoint(`players/${args.player}?year=${args.year}`)
        return results[0]
      } else {
        const results = await getEndpoint(`players/${args.player}`)
        return results[0]
      }
    },
    async getTeam(parent, args, context, info) {
      let teamName = args.name
      teamName = teamName.toLowerCase()
      let results = await getEndpoint(`teams/`)
      results = results.filter(team => team.name.toLowerCase() === teamName)
      return results[0]
    }
  },
  Player: {
    async matches(parent, args) {
      let results
      if (args.id) {
        results = await getEndpoint(`players/${parent.name}/matches`)
        results = results.filter(match => match.id === args.id)
        if (results.length === 0) {
          throw new SyntaxError(`${parent.name} did not participate in match ${args.id}`)
        } else {
          // passing playerName to the child PlayerMatch
          results[0].playerName = parent.name
          return results
        }
      } else {
        results = await getEndpoint(`players/${parent.name}/matches`)
        for (const result of results) {
          // passing playerName to the children PlayerMatch
          result.playerName = parent.name
        }
        return results
      }
    }
  },
  PlayerMatch: {
    async hero(parent, args) {
      // args.name = hero name
      if (args.name) {
        const results = await getEndpoint(`players/${parent.playerName}/matches/heroes?match_ids=${parent.id}`)

        // todo handle snake_case... i thought that middleware handled it but no
        // results = results.filter(match => match.match_id === parent.id)
        const heroes = results[0].heroes
        if (heroes.includes(args.name)) {
          // pass matchid, hero, and player to child Hero
          return [
            {
              name: args.name,
              playerName: parent.playerName,
              matchId: parent.id
            }
          ]
        } else {
          throw new SyntaxError(`${parent.playerName} did not play hero ${args.name} in match ${parent.id}`)
        }
      } else {
        let results = await getEndpoint(`players/${parent.playerName}/matches/heroes?match_ids=${parent.id}`)

        const heroes = []
        for (const hero of results[0].heroes) {
          // pass matchid, hero, and player to child Hero
          heroObj = {
            name: hero,
            playerName: parent.playerName,
            matchId: parent.id
          }
          heroes.push(heroObj)
        }
        return heroes
      }
    }
  },
  Hero: {
    async stats(parent, args) {
      const playerName = parent.playerName
      const heroName = parent.name
      const matchId = parent.matchId

      // TODO: figure out how to integrate stat_name filtering
      // stat_name is args.name
      if (args.name) {
        console.log(parent)
      } else {
        const rawResult = await getEndpoint(`players/${playerName}/heroes/${heroName}?match_ids=${matchId}`)

        const keys = Object.keys(rawResult)
        const values = Object.values(rawResult)

        formattedResult = []
        for (let i = 0; i < keys.length; i++) {
          formattedResult.push({
            statName: keys[i],
            statAmount: values[i]
          })
        }
        return formattedResult
      }
    }
  },
  Team: {
    async byYear(parent, args) {
      const teamName = parent.name
      let results = await getEndpoint(`teams/${teamName}`)
      if (args.year) {
        results = results.filter(element => element.year === args.year)
      }
      for (const teamYear of results) {
        teamYear.teamName = teamName
      }
      return results
    },
    // need to reproduce this logic for TeamMatch details
    async match(parent, args) {
      const matchId = args.id
      const teamName = parent.name
      // TODO: hit endpoint /matches/${matchId} and validate that team participated in the match
      let results = await getEndpoint(`matches/${matchId}`)
      const teams = results.teams
      if (!teams.includes(teamName)) {
        throw new SyntaxError(`${teamName} did not participate in match ID ${matchId}`)
      }

      console.log(results)
    }
  },
  TeamByYear: {
    async stages(parent, args) {
      const teamName = parent.teamName
      const year = parent.year
      // will accept args.number = stage number (integer) and args.type = stage type (string)
      let results = await getEndpoint(`teams/${teamName}/matches?year=${year}`)
      if (args.stage) {
        results = results.filter(element => element.stage === args.stage)
      }
      if (args.type) {
        results = results.filter(element => element.type === args.type)
      }
      console.log(parent)
      console.log(args)
      // below resolves TeamMatch.id, but an additional request may be necessary to resolve the remaining fields
      // consider making a TeamMatchDetails
      for (const result of results) {
        formattedMatches = []
        const matchArray = result.matches
        for (const matchId of matchArray) {
          formattedMatches.push({
            id: matchId
          })
        }
        result.matches = formattedMatches
      }
      return results
    }
  },
  TeamMatch: {
    async details(parent, args) {
      console.log(parent)
    }
  }
}

module.exports = { resolvers }