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

const testArray = [
    ['team', 'shanghai dragons'],
    ['year', '2019', 'AND'],
    ['map_type', 'payload', 'OR']
]

const conditionParse = (conditionArr) => {
    let result = {};
    let text = '', values = [];
    conditionArr.forEach((element, index) => {
        if (element.length === 3) {
            text += ` ${element[2]} ${element[0]} = $${index+1}`;
            values.push(element[1]);
        } else if (element.length === 2) {
            text += `${element[0]} = $${index+1}`;
            values.push(element[1]);
        }
    });
    result.text = text;
    result.values = values;
    return result;
}

// console.log(conditionParse(testArray));

module.exports = { selectQuery };