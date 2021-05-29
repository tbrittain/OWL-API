const {
  GraphQLSchema,
  GraphQLObjectType,
} = require('graphql');

const { matchQuery, playerQuery, teamQuery } = require('./queries/index')

const RootQuery = new GraphQLObjectType({
  name: 'rootQuery',
  description: 'Root query for entrypoints to GraphQL API',
  fields: () => ({
    match: matchQuery,
    // team: teamQuery,
    // player: playerQuery
  })
})

const schema = new GraphQLSchema({
  query: RootQuery
})

module.exports = { schema }