const express = require('express')
const cors = require('cors')
const { ApolloServer } = require('apollo-server-express')
const snakeCase = require('lodash.snakecase')
const { createComplexityLimitRule } = require('graphql-validation-complexity')

// express as middleware
const port = process.env.port || 4001
const app = express()

// types and resolvers
const { typeDefs } = require('./schema/TypeDefs')
const { resolvers } = require('./schema/Resolvers')

// handle some fields from REST api returned as snake_case -> camelCase
const snakeCaseFieldResolver = (source, args, contextValue, info) => {
  return source[snakeCase(info.fieldName)]
}

const ComplexityLimitRule = createComplexityLimitRule(2500, {
  onCost: (cost) => {
    console.log('Query cost:', cost);
  },
  formatErrorMessage: (cost) =>
    `Query with cost ${cost} exceeds complexity limit`,
})

// apollo server
const server = new ApolloServer({
  fieldResolver: snakeCaseFieldResolver,
  validationRules: [ComplexityLimitRule],
  typeDefs, 
  resolvers
})

// handle CORS requests from index.html
app.use(cors())

// body parsing - only necessary for 'post'-like CRUD mutations
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


server.applyMiddleware({ app })

app.listen(port, () => {
  console.log(`GraphQL API server listening at http://localhost:${port}/graphql/`)
})
