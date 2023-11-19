// get the client
const mysql = require("mysql2");

// create the connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "employee_db",
});

module.exports = connection;
