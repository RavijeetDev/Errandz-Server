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
const authValidation = require('./authValidation.js')
const { request, response } = require('express');
const notiServ = require('./noti.js');
const { checkTokenValidation } = require('./authValidation.js');

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

        sendResponseWithoutData(response, status, fetchedData);

    });

});


server.post('/login', (request, response) => {

    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields
            dbResult.loginUser(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })


})

server.post('/addAddress', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields
            dbResult.addAddressRequest(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})

server.post('/hirerHomeData', (request, response) => {

    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchHirerHomeData(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })

        }
    })
})

server.post('/postJob', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchPostJobResponse(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})

server.post('/hirerUpcomingJobList', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchHirerUpcomingJobList(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/hirerUpcomingJobDescription', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchHirerJobTaskerDescription(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/hirerJobHistoryList', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchHirerJobHistoryList(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/userInfo', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchUserInfo(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/uploadUserInfo', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.updateUserInfo(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})


server.post('/taskerHomeData', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchTaskerHomeData(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})


server.post('/updateJobStatus', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.updateJobStatus(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})

server.post('/deleteJobStatus', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.deleteJobFromJobStatusTable(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})

server.post('/applyForJob', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields
            dbResult.updateJobStatus(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})


server.post('/taskerAppliedJobList', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchTaskerAppliedJobList(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/taskerSavedJobList', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchTaskerSavedJobList(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/taskerJobInfo', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchTaskerJobInfo(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/taskerJobHistoryList', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchTaskerJobHistoryList(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/taskerHistoryJobInfo', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchTaskerHistoryJobInfo(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/userReviewList', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchUserReviewList(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/historyJobInfo', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchHirerHistoryJobInfo(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/reviewsOfJob', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.fetchReviewOfJob(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})

server.post('/postReview', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields
            dbResult.addNewReview(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})

server.post('/jobRequestList', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields;
            dbResult.getRequestedJobInfo(requestFields, (status, output) => {

                sendResponseWithData(response, status, output)

            })
        }
    })
})



server.post('/updateNotificationToken', (request, response) => {
    authValidation.checkTokenValidation(request, (status, message) => {
        if (status === 404) {
            sendResponseWithoutData(response, status, message);
        } else {
            let requestFields = request.fields
            dbResult.updateNotificationToken(requestFields, (status, message) => {
                sendResponseWithoutData(response, status, message);
            })
        }
    })
})


function sendResponseWithoutData(response, status, message) {
    response.send({ "result": { "status": status, "message": message } })
}

function sendResponseWithData(response, status, output) {
    if (status == 'success') {
        response.send(
            {
                "result": {
                    "status": status,
                    "message": "success"
                },
                "data": output
            }
        )
    } else {
        sendResponseWithoutData(response, status, output)
    }
}


//-----  For Server Crash Test  -----//
server.get('/crash', (request, response) => {
    process.nextTick(() => {
        throw new Error;
    })
})


//-----  For Server Crash Test  -----//
server.get('/notifyTest', (request, response) => {
    /* 
    notiServ.sendSampleMessage();
    var registrationToken = "eoqxv1o5Qqa8aXSZPyeHCr:APA91bE4mLG_pZ6p5zg6VM2Um6UPj4JX51CavAXreTqLCq5XWNRObKFdGW4alkZzrCl_jL1sKm3-7BfFzThuNdOowSpywyUdHqEFFR1oVmBC0EPdtz6CRulRfgDwiNrJANcfWdP3Ikzh";
    notiServ.sendNotification(registrationToken, "ERRANDZ APP", "This is sample notification for Errandz App");
     */
})

// server.post('/emailVerification', (request, response) => {

//     let requestFields = request.fields;
//     dbResult.checkEmailVerification(requestFields, (status, fetchedData) => {
//         response.send({ "result": { "status": status, "message": fetchedData } })
//     })

// });

// server.post('/emailActivationCode', (request, response) => {
//     let requestFields = request.fields;
//     dbResult.resendEmailVerificationCode(requestFields, (status, fetchedData) => {
//         response.send({ "result": { "status": status, "message": fetchedData } })
//     })
// });

// server.post('/passwordActivationCode', (request, response) => {
//     let requestFields = request.fields;
//     dbResult.createActivationCodeForNewPassword(requestFields, (status, fetchedData) => {
//         response.send({ "result": { "status": status, "message": fetchedData } })
//     })
// })

// server.post('/createNewPassword', (request, response) => {
//     let requestFields = request.fields
//     dbResult.createNewPassword(requestFields, (status, fetchedData) => {
//         response.send({ "result": { "status": status, "message": fetchedData } })
//     })
// })



