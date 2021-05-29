const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const { buildSchema } = require('graphql')
const cors = require('cors')

const { schema } = require('./server/index')

const port = process.env.port || 4001
 
const app = express()

// handle CORS requests from index.html
app.use(cors())

// body parsing
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}))

app.listen(port, () => {
  console.log(`GraphQL API server listening at http://localhost:${port}/graphql/`)
})

// TODO: https://graphql.org/blog/rest-api-graphql-wrapper/
// https://www.youtube.com/watch?v=UBGzsb2UkeY&t=902s
// https://github.com/aichbauer/express-graphql-boilerplate/tree/master/api