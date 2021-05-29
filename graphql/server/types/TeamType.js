const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
} = require('graphql');
const axios = require('axios').default

const BASE_URL = 'http://owl-api:4000/'

const TeamType = new GraphQLObjectType({
  name: 'Team',
  description: 'Represents a team in OWL',
  fields: () => ({

  })
})

module.exports = { TeamType }