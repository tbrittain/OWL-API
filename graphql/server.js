const express = require('express')
const cors = require('cors')
const { ApolloServer } = require('apollo-server-express')

// express as middleware
const port = process.env.port || 4001
const app = express()

// types and resolvers
const { typeDefs } = require('./schema/TypeDefs')
const { resolvers } = require('./schema/Resolvers')

// apollo server
const server = new ApolloServer({typeDefs, resolvers})

// handle CORS requests from index.html
app.use(cors())

// body parsing - only necessary for 'post'-like CRUD mutations
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


server.applyMiddleware({ app })

app.listen(port, () => {
  console.log(`GraphQL API server listening at http://localhost:${port}/graphql/`)
})
