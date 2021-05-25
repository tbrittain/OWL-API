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

const selectQuery = async (queryName, columns, distinct = false, table, 
    condition = null, groupby = null, orderby = null, limit = null) => {
    const query = { name: queryName }
    
    let queryText;

    if (distinct) {
        queryText = `SELECT DISTINCT ${columns} FROM ${table}`
    } else {
        queryText = `SELECT ${columns} FROM ${table}`
    }
    
    let values;

    if (condition) {
        const conditions = conditionParse(condition);
        queryText += conditions.text;
        values = conditions.values;

        query.values = values;
    }

    if (groupby) {
        queryText += ` GROUP BY ${groupby}`;
    }

    if (orderby) {
        queryText += ` ORDER BY ${orderby}`;
    }

    if (limit) {
        queryText += ` LIMIT ${limit}`;
    }

    queryText += ';';
    query.text = queryText;

    // debugging queries
    // console.log(queryText);
    // console.log(values);

    return pool
        .query(query)
        .then(res => {
            return res.rows;
        })
        .catch(e => console.error(e.stack));
}


const conditionParse = (conditionArr) => {
    let result = {};
    let text = '', values = [];
    conditionArr.forEach((element, index) => {
        if (element.length === 3) {
            // additional statements in conditional
            text += ` ${element[2]} ${element[0]}$${index+1}`;
            values.push(element[1]);
        } else if (element.length === 2) {
            // first statement in conditional
            text += ` WHERE ${element[0]}$${index+1}`;
            values.push(element[1]);
        } else if (element.length === 1) {
            // insertion of literal, not for use with variable values
            text += element[0];
        }
    });
    result.text = text;
    result.values = values;
    return result;
}

// console.log(conditionParse(testArray));

module.exports = { selectQuery };