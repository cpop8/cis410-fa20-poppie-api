const sql = require('mssql')
const poppieConfig = require('./config.js')

const config = {
    user: poppieConfig.DB.user,
    password: poppieConfig.DB.password,
    server: poppieConfig.DB.server,
    database: poppieConfig.DB.database,
}

    async function executeQuery(aQuery){
        var connection = await sql.connect(config)
        var result = await connection.query(aQuery)
    
        return result.recordset
    }

    module.exports = {executeQuery: executeQuery}
    //executeQuery(`SELECT * 
    //FROM movie 
    //LEFT JOIN genre 
    //ON genre.genrePK = movie.GenreFK`)