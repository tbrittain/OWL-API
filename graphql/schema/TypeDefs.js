const { gql } = require("apollo-server-express")


const typeDefs = gql`
  # Types
  # =========================
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
    stats: [HeroStats!]!
  }

  type HeroStats {
    statName(name: String): String!
    statAmount: Float!
  }

  # =========================
  # Team Types
  type Team {
    name: String!
    byYear(year: Int): [TeamByYear!]!
    match(id: Int!): MatchDetails!
  }

  type TeamByYear {
    year: Int!
    players: [Player!]!
    stages(stage: Int, type: String): [Stage!]!
  }

  type Stage {
    stage: Int!
    type: String!
    matches: [TeamMatch!]!
  }

  # Team Match Types
  type TeamMatch {
    id: ID!
    details: MatchDetails!
  }

  # TODO: Could make winner and teams TeamType instead of string
  type MatchDetails {
    year: Int!
    roundStartTime: String!
    winner: String!
    teams: [String!]!
    games: [Game!]!
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