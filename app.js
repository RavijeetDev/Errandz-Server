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

const dbResult = require('./dbResult.js');
const { request, response } = require('express');

// ***********************************************************
//      Setting up Node Server using ExpressJS
// ***********************************************************
const server = express();
const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server is Running on Port : ${port}`);
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


/********************************************************************************************/
/* ----------------------------- Server Request and Respoonse ----------------------------- */
/********************************************************************************************/
server.post('/signup', (request, response) => {

    let signUpFields = request.fields;
    dbResult.addSignedUpUser(signUpFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    });

});

server.post('/emailVerification', (request, response) => {

    let requestFields = request.fields;
    dbResult.checkEmailVerification(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })

});

server.post('/emailActivationCode', (request, response) => {
    let requestFields = request.fields;
    dbResult.resendEmailVerificationCode(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
});

server.post('/passwordActivationCode', (request, response) => {
    let requestFields = request.fields;
    dbResult.createActivationCodeForNewPassword(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/createNewPassword', (request, response) => {
    let requestFields = request.fields
    dbResult.createNewPassword(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/login', (request, response) => {
    let requestFields = request.fields
    dbResult.loginUser(requestFields, (status, fetchedData) => {
        if (status == "error") {
            response.send({ "result": { "status": status, "message": fetchedData } })
        } else {
            let userDataJson = {
                "result": {
                    "status": status,
                    "message": "Login Successful"
                },
                "data": {
                    "userID": fetchedData[0].ID,
                    "firstName": fetchedData[0].FirstName,
                    "lastName": fetchedData[0].LastName,
                    "emailID": fetchedData[0].EmailId,
                    "userType": fetchedData[0].UserType,
                    "dob": fetchedData[0].Dob,
                    "profileImage": fetchedData[0].ProfileImage,
                    "bio": fetchedData[0].bio,
                    "address": (fetchedData[0].address == null) ? "" : fetchedData[0].address
                }
            }
            response.send(userDataJson)
        }
    })
})

server.post('/hirerHomeData', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchHirerHomeData(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "home_data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/postJob', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchPostJobResponse(requestFields, (status, fetchedData) => {
            response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/hirerUpcomingJobList', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchHirerUpcomingJobList(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/hirerJobHistoryList', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchHirerJobHistoryList(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/userInfo', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchUserInfo(requestFields.userID, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/uploadUserInfo', (request, response) => {
    let requestFields = request.fields;
    console.log(requestFields);
    dbResult.updateUserInfo(requestFields, (status, fetchedData) => {
            response.send({ "result": { "status": status, "message": fetchedData } })
    })
})


server.post('/taskerHomeData', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchTaskerHomeData(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})


server.post('/updateJobStatus', (request, response) => {
    let requestFields = request.fields;
    dbResult.updateJobStatus(requestFields, (status, fetchedData) => {
            response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/deleteJobStatus', (request, response) => {
    let requestFields = request.fields;
    dbResult.deleteJobFromJobStatusTable(requestFields, (status, fetchedData) => {
            response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/applyForJob' , (request, response) => {
    let requestFields = request.fields
    dbResult.updateJobStatus(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
})


server.post('/taskerAppliedJobList', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchTaskerAppliedJobList(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/taskerSavedJobList', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchTaskerSavedJobList(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/taskerJobInfo', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchTaskerJobInfo(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/userReviewList', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchUserReviewList(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/historyJobInfo', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchHirerHistoryJobInfo(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/reviewsOfJob', (request, response) => {
    let requestFields = request.fields;
    dbResult.fetchReviewOfJob(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})

server.post('/postReview' , (request, response) => {
    let requestFields = request.fields
    dbResult.addNewReview(requestFields, (status, fetchedData) => {
        response.send({ "result": { "status": status, "message": fetchedData } })
    })
})

server.post('/jobRequestList', (request, response) => {
    let requestFields = request.fields;
    dbResult.getRequestedJobInfo(requestFields, (status, fetchedData) => {
        if (status == 'success') {
            response.send(
                {
                    "result": {
                        "status": status,
                        "message": "success"
                    },
                    "data": fetchedData
                }
            )
        } else {
            response.send({ "result": { "status": status, "message": fetchedData } })
        }
    })
})


