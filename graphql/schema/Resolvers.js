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
    }
  },
  Player: {
    async matches(player, args) {
      if (args.id) {
        let results = await getEndpoint(`players/${player.name}/matches`)
        results = results.filter(match => match.id === args.id)
        return results
      } else {
        const results = await getEndpoint(`players/${player.name}/matches`)
        return results
      }
    }
  },
  Hero: {
    async name(matchId) {
      console.log(`hero matchid: ${matchId}`)
    },
    async stats(matchId) {
      console.log(`stats matchid: ${matchId}`)
    }
  }
}

module.exports = { resolvers }