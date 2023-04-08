require('dotenv').config();

const mysql = require('mysql2');
const mysqlConnection = mysql.createConnection({
	host: process.env.host,
	database: process.env.database,
	user: process.env.user,
	password: process.env.password
});

module.exports = mysqlConnection;