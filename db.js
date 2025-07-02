// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // use your MySQL user
  password: '@Eliakimu122',          // use your MySQL password
  database: 'inheritance'
});

connection.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

module.exports = connection;
