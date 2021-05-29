const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
} = require('graphql');

const MatchType = new GraphQLObjectType({
  name: 'Matches',
  description: 'Represents matchups of OWL teams',
  fields: () => ({

  })
})

module.exports = { MatchType }