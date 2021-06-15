const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT
})

const selectQuery = async (
  queryName,
  columns,
  distinct = false,
  table,
  condition = null,
  groupby = null,
  orderby = null,
  limit = null,
  having = null
) => {
  const query = { name: queryName }

  let queryText

  if (distinct) {
    queryText = `SELECT DISTINCT ${columns} FROM ${table}`
  } else {
    queryText = `SELECT ${columns} FROM ${table}`
  }

  let values

  if (condition) {
    const conditions = conditionParse(condition)
    queryText += conditions.text
    values = conditions.values

    query.values = values
  }

  if (groupby) {
    queryText += ` GROUP BY ${groupby}`
  }

  if (having) {
    queryText += ` HAVING ${having}`
  }

  if (orderby) {
    queryText += ` ORDER BY ${orderby}`
  }

  if (limit) {
    queryText += ` LIMIT ${limit}`
  }

  queryText += ';'
  query.text = queryText

  // debugging queries
  // console.log(queryText);
  // console.log(values);

  return pool
    .query(query)
    .then((res) => {
      return res.rows
    })
    .catch((e) => console.error(e.stack))
}

const conditionParse = (conditionArr) => {
  const result = {}
  let text = ''
  const values = []
  conditionArr.forEach((element, index) => {
    if (element.length === 3) {
      // additional statements in conditional
      text += ` ${element[2]} ${element[0]}$${index + 1}`
      values.push(element[1])
    } else if (element.length === 2) {
      // first statement in conditional
      text += ` WHERE ${element[0]}$${index + 1}`
      values.push(element[1])
    } else if (element.length === 1) {
      // insertion of literal, not for use with variable values
      text += element[0]
    }
  })
  result.text = text
  result.values = values
  return result
}

// console.log(conditionParse(testArray));

module.exports = { selectQuery }
