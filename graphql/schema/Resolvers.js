const axios = require('axios').default
const BASE_URL = 'http://owl-api:4000/rest/'

const getEndpoint = async (relativeUrl) => {
  const response = await axios.get(`${BASE_URL}${relativeUrl}`)
  return response.data
}

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
      const teamName = args.name
      let results = await getEndpoint(`teams/`)
      results = results.filter(team => team.name === teamName)
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
        // FIXME: need an endpoint to get the heroes from the individual match, because this one takes a long time
        let results = await getEndpoint(`players/${parent.playerName}/matches/heroes`)
        // todo handle snake_case... i thought that middleware handled it but no
        results = results.filter(match => match.match_id === parent.id)
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
        let results = await getEndpoint(`players/${parent.playerName}/matches/heroes`)
        results = results.filter(match => match.match_id === parent.id)

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
    // FIXME PREVENT THIS FROM BEING CALLED WHEN NESTED TOO DEEP BECAUSE IT WILL FRY YOUR CPU
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
    async lineup(parent, args) {
      const teamName = parent.name
      if (args.year) {
        console.log(parent)
      } else {
        const results = await getEndpoint(`teams/${teamName}`)
        console.log(results)
        return results
      }
    }
  },
  TeamLineup: {
    async matches(parent, args) {

    }
  }
}

module.exports = { resolvers }