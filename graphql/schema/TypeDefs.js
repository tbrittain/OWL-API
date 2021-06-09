const { gql } = require("apollo-server-express")

const typeDefs = gql`
  # Types
  type Player {
    name: String!
    team: [String!]!
    year: [Int!]!
    matches: [PlayerMatch]
  }

  type PlayerMatch {
    id: ID!
    performance: PlayerPerformance
  }

  type PlayerPerformance {
    stats: [HeroStats]
  }

  type HeroStats {
    stat: Float
  }

  # Queries
  type Query {
    getAllPlayers(year: Int): [Player!]!
    getPlayer(year: Int, player: String!): Player!
  }
`

module.exports = { typeDefs }