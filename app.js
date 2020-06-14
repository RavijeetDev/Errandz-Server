// ***********************************************************
//      Core Node Modules
// ***********************************************************
const path = require('path');



// ***********************************************************
//      NPM Node Modules
// ***********************************************************
const express = require('express');
const mysql = require('mysql');
const formidable = require('express-formidable');
const { sign } = require('crypto');



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
server.use(formidable());

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


server.post('/signup', (request, response) => {

    let signUpFields = request.fields;
    console.log(signUpFields)
    saveDataOfSignedUpUser(signUpFields, (status, fetchedData) => {
        response.send(fetchedData)
    });

});


function saveDataOfSignedUpUser(signUpFields, callback) {

    //create random number for user ID
    let queryString = `INSERT INTO User (FirstName, LastName, EmailID, Password, UserType, Dob, LoginType, GoogleID) VALUES ("${signUpFields.firstName}", "${signUpFields.lastName}", "${signUpFields.emailID}", "${signUpFields.password}", ${signUpFields.userType}, "${signUpFields.dob}", ${signUpFields.loginType}, "${signUpFields.googleID}")`;
    console.log(queryString)

    connection.query(queryString, function (error, result) {
        if(error) {
            callback("Error");
        } else {
            
            let getUserIDQuery = `SELECT ID FROM User WHERE FirstName = "${signUpFields.firstName}" AND "$"`
            connection.query
        }
    })

}

