const axios = require('axios').default
const BASE_URL = 'http://owl-api:4000/rest/'

const getEndpoint = async (relativeUrl) => {
  const response = await axios.get(`${BASE_URL}${relativeUrl}`)
  return response.data
}

const resolvers = {
  Query: {
    getAllPlayers(parent, args, context, info) {
      if (args.year) {
        return getEndpoint(`/players?year=${args.year}`)
      } else {
        return getEndpoint(`/players`)
      }
    },
    getPlayer(parent, args, context, info) {
      if (args.year) {
        return getEndpoint(`/players/${args.player}?year=${args.year}`)
      } else {
        return getEndpoint(`/players/${args.player}`)
      }
    }
  },
  PlayerPerformance(parent, args, context, info) {

  },
  HeroStats(parent, args, context, info) {

  }
}

module.exports = { resolvers }