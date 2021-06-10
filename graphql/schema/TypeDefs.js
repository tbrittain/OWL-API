const { gql } = require("apollo-server-express")

// TODO: team queries

const typeDefs = gql`
  # Types
  # Player Types
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

  # Team Types
  type Team {
    name: String!
    lineup(year: Int): [TeamLineup!]!
  }

  type TeamLineup {
    year: Int!
    players: [Player!]!
    matches: [TeamMatch]
  }

  # Team Match Types
  type TeamMatch {
    id: ID!
    year: Int!
    roundStartTime: String!
    winner: String!
    teams: [String!]!
    games: [Game]
  }

  type Game {
    gameNumber: Int!
    mapName: String!
    mapWinner: String!
    winnerFinalMapScore: Int!
    loserFinalMapScore: Int!
    mapType: String!
    rounds: [Round]
  }

  type Round {
    roundNumber: Int!
    attacker: String!
    defender: String!
    stats: [RoundStatistic]
  }

  type RoundStatistic {
    statName: String!
    statAmount: Float!
  }

  # Queries
  # TODO: getTeams and getMatch queries?
  # TODO: maybe remove the year parameter from getPlayer
  type Query {
    getAllPlayers(year: Int): [Player!]!
    getPlayer(year: Int, player: String!): Player!
    getTeam(name: String!): Team!
  }
`

module.exports = { typeDefs }