const { gql } = require("apollo-server-express")

// TODO: team queries

const typeDefs = gql`
  # Types
  type Player {
    name: String!
    team: [String!]!
    year: [Int!]!
    matches(id: Int): [PlayerMatch!]
  }

  type PlayerMatch {
    id(year: Int): ID!
    hero(name: String): [Hero]
  }

  type Hero {
    name: String!
    stats: [HeroStats!]
  }

  type HeroStats {
    statName(name: String): String!
    statAmount: Float!
  }

  # Queries
  type Query {
    getAllPlayers(year: Int): [Player!]!
    getPlayer(year: Int, player: String!): Player!
  }
`

module.exports = { typeDefs }