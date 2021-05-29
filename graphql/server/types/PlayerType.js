const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
} = require('graphql')
const fetch = require('node-fetch')


const BASE_URL = 'http://owl-api:4000/'

const PlayerType = new GraphQLObjectType({
  name: 'Player',
  description: 'Represents a player belonging to an OWL team',
  
})

module.exports = { PlayerType }