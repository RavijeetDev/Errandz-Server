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
const { error } = require('console');



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

/********************************************************************************************/
/* ----------------------------- Checking Database Connection ----------------------------- */
/********************************************************************************************/
connection.connect(function (error) {
    if (!!error) {
        console.log('Database Connection Error !!');
    } else {
        console.log('Database Connected');
    }
})


/********************************************************************************************/
/* ----------------------------- Server Request and Respoonse ----------------------------- */
/********************************************************************************************/
server.post('/signup', (request, response) => {

    let signUpFields = request.fields;
    addSignedUpUser(signUpFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    });

});

server.post('/emailVerification', (request, response) => {

    let requestFields = request.fields;
    checkEmailVerification(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })

});

server.post('/emailActivationCode', (request, response) => {
    let requestFields = request.fields;
    resendEmailVerificationCode(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
});

server.post('/passwordActivationCode', (request, response) => {
    let requestFields = request.fields;
    createActivationCodeForNewPassword(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/changePassword', (request, response) => {
    let requestFields = request.fields
    createNewPassword(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/login', (request, response) => {
    let requestFields = request.fields
    loginUser(requestFields, (status, fetchedData) => {
        if (status == "error") {
            response.send({ "result": { "status": status, "message": fetchedData } })
        } else {
            let userDataJson = {
                "result": {
                    "status": status,
                    "message": "Login Successful"
                },
                "data": {
                    "userId": fetchedData[0].ID,
                    "firstName": fetchedData[0].FirstName,
                    "lastName": fetchedData[0].LastName,
                    "emailID": fetchedData[0].EmailId,
                    "userType": fetchedData[0].UserType,
                    "dob": fetchedData[0].Dob,
                    "profileImage": fetchedData[0].ProfileImage,
                    "bio": fetchedData[0].bio,
                    "address" : (fetchedData[0].address == null) ? "" : fetchedData[0].address
                }
            }
            response.send(userDataJson)
        }
    })
})


/********************************************************************************************/
/* ------------------------------ Fetching Data From Database ----------------------------- */
/********************************************************************************************/

function addSignedUpUser(signUpFields, callback) {

    checkIfEmailIDExist(signUpFields.emailID, (status, message) => {
        if (status) {
            callback("error", message)
        } else {

            let queryString = `INSERT INTO User (FirstName, LastName, EmailID, Password, UserType, Dob, LoginType) VALUES ("${signUpFields.firstName}", "${signUpFields.lastName}", "${signUpFields.emailID}", "${signUpFields.password}", ${signUpFields.userType}, "${signUpFields.dob}", ${signUpFields.loginType})`;
            connection.query(queryString, function (error, result) {

                if (error) {
                    console.log("Issue in inserting data of User")
                    callback("error", "System error");
                } else {
                    addActivationCodeForUserVerification(signUpFields.emailID)
                    callback("success", "Email ID registered successfully.")
                }

            })
        }
    })
}

function checkIfEmailIDExist(emailID, callback) {
    let emailQuery = `SELECT ID FROM User WHERE EmailID = "${emailID}"`
    connection.query(emailQuery, function (error, rows) {
        if (error) {
            console.log("Error in fetching data from User table -> checkIfEmailIDExist")
            callback(true, "System error");
        } else if (rows.length > 0) {
            callback(true, "Email ID already registered")
        } else {
            callback(false, "")
        }
    })
}

function addActivationCodeForUserVerification(emailID) {
    let activationCode = generateActivationRandomNumber();
    let queryString = `INSERT INTO UserActivation (EmailID, ActivationType, ActivationCode) VALUES ("${emailID}", 1, ${activationCode})`
    connection.query(queryString, function (error, result) {
        if (error) console.log("System error -> addActivationCodeForUserVerification")
        else console.log(`Activation code added for ${emailID}`)
    })
}



function checkEmailVerification(requestFields, callback) {

    let query = `SELECT ID FROM UserActivation WHERE EmailID = "${requestFields.emailID}" AND ActivationCode = ${requestFields.activationCode} AND ActivationType = 1`
    connection.query(query, function (error, rows, fields) {
        if (error) {
            callback("error", "There is some system issue")
        } else {
            if (rows.length > 0) {
                deleteActivationCodeEntry(requestFields.emailID, 1);
                activateUser(requestFields.emailID);
                callback("success", "Email ID verified successfully")
            } else {

                checkUserActiveStatus(requestFields.emailID, (errorCode, message) => {
                    callback("error", message)
                })

            }
        }
    })
}

function activateUser(emailID) {
    let queryString = `UPDATE User SET Active = 1 WHERE emailID = "${emailID}"`
    connection.query(queryString, function (error, rows) {
        if (error) {
            console.log("Unable to activate user")
        } else {
            console.log("User Activated successfully")
        }
    })
}



function resendEmailVerificationCode(requestFields, callback) {
    let activationCode = generateActivationRandomNumber()
    checkUserActiveStatus(requestFields.emailID, (errorCode, message) => {
        if (errorCode == 501 || errorCode == 502) {
            callback(message)
        } else {
            let queryString = `UPDATE UserActivation SET ActivationCode = ${activationCode} WHERE EmailID = "${requestFields.emailID}"`
            connection.query(queryString, function (error, result) {
                if (error) {
                    callback("System Error")
                } else {
                    callback("Activation code is send successfully")
                }
            })
        }
    })
}


function createActivationCodeForNewPassword(requestFields, callback) {
    checkUserActiveStatus(requestFields.emailID, (errorCode, message) => {
        if (errorCode == 501 || errorCode == 502) {
            callback("error", message)
        } else {
            let activationCode = generateActivationRandomNumber()
            let queryString = `INSERT INTO UserActivation (EmailID, ActivationType, ActivationCode) VALUES ("${requestFields.emailID}", 2, ${activationCode})`
            connection.query(queryString, function (error, result) {
                if (error) {
                    callback("error", "System error")
                } else {
                    callback("success", "Activation Code is send successfully")
                }
            });
        }
    })
}


function createNewPassword(requestFields, callback) {
    checkUserActiveStatus(requestFields.emailID, (errorCode, message) => {
        if (errorCode == 501 || errorCode == 502) {
            callback("error", message)
        } else {
            let queryString = `SELECT ID FROM UserActivation WHERE EmailID = "${requestFields.emailID}" AND ActivationCode = ${requestFields.activationCode} AND ActivationType = 2`
            connection.query(queryString, function (error, result) {
                if (error) {
                    callback("error", "System error")
                } else if (result.length > 0) {
                    updateNewPassword(requestFields.emailID, requestFields.password, requestFields.activationCode, 2)
                    deleteActivationCodeEntry(requestFields.emailID, 2)
                    callback("Password changed successfully")
                } else {
                    callback("error", "Invalid Activation Code")
                }
            })
        }
    });
}

function updateNewPassword(emailID, password) {
    let queryString = `UPDATE User SET Password = "${password}" WHERE EmailID = "${emailID}"`
    connection.query(queryString, function (error, result) {
        if (error) {
            console.log("System error")
        } else {
            console.log("Password Updated Successfully")
        }
    })
}


function loginUser(requestFields, callback) {
    checkUserActiveStatus(requestFields.emailID, (errorCode, message) => {
        if (errorCode == 501 || errorCode == 502) {
            callback("error", message)
        } else {
            let queryString = `SELECT * FROM User WHERE EmailID = "${requestFields.emailID}" AND Password = "${requestFields.password}" AND LoginType = 1`
            connection.query(queryString, function (error, result) {
                if (error) {
                    callback("error", "System Error")
                } else if (result.length == 0) {
                    callback("error", "Password is not correct")
                } else {
                    callback("success", result)
                }
            })
        }
    })
}

function checkUserActiveStatus(emailID, callback) {
    let queryString = `SELECT Active FROM User WHERE EmailID = "${emailID}"`
    connection.query(queryString, function (error, result) {
        if (error) {
            callback(500, "System error")
        } else if (result.length == 0) {
            callback(501, "Email ID is not registered")
        } else if (result[0].Active == 1) {
            callback(502, "Email ID is already verified")
        } else {
            callback(503, "Invalid activation code")
        }
    })
}

function deleteActivationCodeEntry(emailID, activationType) {
    let queryString = `DELETE FROM UserActivation WHERE EmailID = "${emailID}" AND ActivationType = ${activationType}`
    connection.query(queryString, function (error, rows) {
        if (error) {
            console.log("Deleting email verification code - System Error")
        } else {
            console.log("Deleted Successfully")
        }
    })
}





/********************************************************************************************/
/* ---------------------------------------- Utility --------------------------------------- */
/********************************************************************************************/

function generateActivationRandomNumber() {
    return Math.floor(Math.random() * 10000);
}

