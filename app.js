// ***********************************************************
//      Core Node Modules
// ***********************************************************
const path = require('path');



// ***********************************************************
//      NPM Node Modules
// ***********************************************************
const express = require('express');
const mysql = require('mysql');



// ***********************************************************
//      Custom Node Modules
// ***********************************************************



// ***********************************************************
//      Setting up Node Server using ExpressJS
// ***********************************************************
const server = express();

server.listen(3000, () => {
    console.log('Server is up on port 3000');
});
const pubDirPath = path.join(__dirname, 'public')
server.use(express.static(pubDirPath));

let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
}
server.use(allowCrossDomain);

/* <-----  The code below is used to connect the server to a local database  server -----> */
var connection = mysql.createConnection({
    host: 'localhost',
    port: '8889',
    user: 'root',
    password: 'root',
    database: 'Errandz'
});

connection.connect(function (error) {
    if (!!error) {
        console.log('Database Connection Error !!');
    } else {
        console.log('Database Connected');
    }
})

server.get('', (req, res) => {

    connection.query('SELECT * FROM User', function(error, rows, fields) {
        if(!!error) {
            console.log('Error in database query\n');
            console.log(error);
        }else {
            console.log('Success\n');
            res.send(rows);
        }
    })
})