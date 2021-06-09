const { gql } = require("apollo-server-express")

const typeDefs = gql`
  # Types
  type Player {
    name: String!
    team: [String!]!
    year: [Int!]!
  }

  # Queries
  type Query {
    getAllPlayers(year: Int!): [Player!]!
  }
`

module.exports = { typeDefs }