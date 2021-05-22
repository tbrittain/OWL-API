const { Pool } = require('pg');
// hardcoded, could also use .env, and 
// pool would automatically use it
const pool = new Pool({
    user: 'root',
    host: 'db',
    database: 'root',
    password: 'root',
    port: 5432
});

const selectQuery = (queryName, columns, table, where = null, 
    groupby = null, orderby = null, limit = null) => {
    const query = { name: queryName }

    let queryText = `SELECT ${columns} FROM ${table}`
    let values;

    if (where) {
        
    }

    pool
        .query(query, (err, res) => {
            console.log(err, res)
        })
}

const conditionParse = (condition)

module.exports = { selectQuery };