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

function loginUser(requestFields, callback) {
    checkUserActiveStatus(requestFields.emailID, (errorCode, message) => {
        if (errorCode == 501 || errorCode == 500) {
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

function fetchHirerHomeData(requestFields, callback) {

    let userID = requestFields.hirerID;

    getNumberOfHirerPostedJobs(userID, (status, jobListNumber) => {

        if (status == 'success') {

            let queryString = `SELECT Job.*, JobStatus.ID, JobStatus.TaskerID, User.FirstName, User.LastName, User.ProfileImage, User.Dob, User.Bio,
            COUNT(Review.ReviewerID) AS TotalReviews, SUM(Rating) AS TotalRating 
            FROM Job, User, JobStatus 
            LEFT JOIN Review 
            ON JobStatus.TaskerID = Review.UserID
            WHERE Job.JobID = JobStatus.JobID AND 
            JobStatus.TaskerID = User.ID AND 
            Job.HirerID = ${userID} AND JobStatus.Status = 1 
            GROUP BY Job.JobID, JobStatus.ID ORDER BY DateRequested LIMIT 10`

            connection.query(queryString, function (error, rows) {
                if (error) {
                    callback('error', 'System error - in fecthing jobs')
                } else {
                    let jobList = []
                    for (i = 0; i < rows.length; i++) {
                        jobList.push({
                            'jobInfo': {
                                'jobID': rows[i].JobID,
                                'jobName': rows[i].Name,
                                'jobWage': rows[i].Wage,
                                'date': rows[i].Date,
                                'description': rows[i].Description,
                                'hirerID': rows[i].HirerID,
                                'jobStatusID': rows[i].ID,
                                'jobCategory': rows[i].JobCategory
                            },
                            'userInfo': {
                                'userID': rows[i].TaskerID,
                                'firstName': rows[i].FirstName,
                                'lastName': rows[i].LastName,
                                'dob': rows[i].Dob,
                                'bio': rows[i].Bio,
                                'profileImage': rows[i].ProfileImage,
                                'numberOfReviews': rows[i].TotalReviews,
                                'totalRating': rows[i].TotalRating == undefined ? 0 : rows[i].TotalRating
                            }
                        })
                    }
                    callback('success', {
                        "number_of_jobs": jobListNumber,
                        'jobList': jobList
                    })
                }
            })

        }
    })
}


function getNumberOfHirerPostedJobs(userID, callback) {
    let queryString = `SELECT COUNT(JobID) AS NumberOfJobs FROM Job WHERE HirerID = ${userID}`;
    connection.query(queryString, function (error, rows) {
        if (error) {
            console.log("Number of Client Jobs - System Error")
            callback('error', 'System error')
        } else {
            // console.log(rows[0]);
            callback('success', rows[0].NumberOfJobs)
        }
    })
}

function fetchPostJobResponse(requestFields, callback) {
    let jobName = requestFields.jobName;
    let jobWage = requestFields.jobWage;
    let date = requestFields.date;
    let jobDescription = requestFields.description;
    let jobCategory = requestFields.jobCategory;
    let hirerID = requestFields.hirerID;

    let queryString = `INSERT INTO Job (Name, Wage, Date, Description, JobCategory, HirerID) VALUES ("${jobName}", ${jobWage}, ${date}, "${jobDescription}", ${jobCategory}, ${hirerID})`;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            callback('success', 'Job added successfully');
        }
    })
}

function fetchHirerUpcomingJobList(requestFields, callback) {
    let hirerID = requestFields.hirerID;
    let currentTimestamp = Date.now()
    let queryString = `SELECT * FROM Job WHERE HirerID = ${hirerID} AND Date >= ${currentTimestamp} ORDER BY Date`;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System Error')
        } else {
            let joblist = [];
            for (i = 0; i < rows.length; i++) {
                joblist.push({
                    'jobID': rows[i].JobID,
                    'jobName': rows[i].Name,
                    'jobWage': rows[i].Wage,
                    'date': rows[i].Date,
                    'description': rows[i].Description,
                    'jobCategory': rows[i].JobCategory,
                    'taskerID': rows[i].TaskerID
                })
            }
            callback('success', joblist)
        }
    })
}

function fetchHirerJobHistoryList(requestFields, callback) {
    let hirerID = requestFields.hirerID;
    let currentTimestamp = Date.now()

    let queryString = `SELECT Job.*, JobStatus.ID, JobStatus.Status, JobStatus.TaskerID FROM Job, JobStatus WHERE Job.JobID = JobStatus.JobID AND Status = 5 AND HirerID = ${hirerID} AND Date <= ${currentTimestamp} ORDER BY Date DESC`;
    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System Error')
        } else {
            let joblist = [];
            for (i = 0; i < rows.length; i++) {
                joblist.push({
                    'jobID': rows[i].JobID,
                    'jobName': rows[i].Name,
                    'jobWage': rows[i].Wage,
                    'date': rows[i].Date,
                    'description': rows[i].Description,
                    'jobCategory': rows[i].JobCategory,
                    'jobStatusID': rows[i].ID,
                    'status': rows[i].Status,
                    'taskerID': rows[i].TaskerID
                })
            }
            callback('success', joblist)
        }
    })
}

function fetchHirerHistoryJobInfo(requestFields, callback) {
    let jobID = requestFields.jobID;
    let hirerID = requestFields.hirerID;
    let taskerID = requestFields.taskerID;

    let queryString = `SELECT Job.*, JobStatus.ID, JobStatus.Status, User.ID As UserID, User.FirstName, User.LastName, User.ProfileImage, User.Dob, User.Bio, (SELECT COUNT(ID) FROM Review WHERE UserID = ${taskerID}) AS NumberOfReviews, (SELECT SUM(Rating) FROM Review WHERE UserID = ${taskerID}) AS TotalRating FROM Job, JobStatus, User WHERE Job.JobID = JobStatus.JobID AND User.ID = JobStatus.TaskerID AND Job.JobID = ${jobID} AND Status = 5 AND JobStatus.TaskerID = ${taskerID}`
    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error')
        } else {

            let output = {
                'jobInfo': {
                    'jobID': rows[0].JobID,
                    'jobName': rows[0].Name,
                    'jobWage': rows[0].Wage,
                    'date': rows[0].Date,
                    'description': rows[0].Description,
                    'taskerID': taskerID,
                    'jobCategory': rows[0].JobCategory
                },
                'userInfo': {
                    'userID': rows[0].UserID,
                    'firstName': rows[0].FirstName,
                    'lastName': rows[0].LastName,
                    'profileImage': rows[0].ProfileImage,
                    'dob': rows[0].Dob,
                    'bio': rows[0].Bio,
                    'numberOfReviews': rows[0].NumberOfReviews,
                    'totalRating': rows[0].TotalRating == undefined ? 0 : rows[0].TotalRating
                }
            }



            callback('success', output);
        }
    })
}

function fetchUserInfo(userId, callback) {

    let queryString = `SELECT User.ID, FirstName, LastName, EmailID, UserType, Dob, ProfileImage, Bio, (SELECT COUNT(ID) FROM Review WHERE UserID = ${userId}) AS NumberOfReviews, (SELECT SUM(Rating) FROM Review WHERE UserID = ${userId}) AS TotalRating FROM User WHERE ID = ${userId}`;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            callback('success', {
                'userID': rows[0].ID,
                'firstName': rows[0].FirstName,
                'lastName': rows[0].LastName,
                'emailID': rows[0].EmailID,
                'userType': rows[0].UserType,
                'dob': rows[0].Dob,
                'profileImage': rows[0].ProfileImage,
                'bio': rows[0].Bio,
                'numberOfReviews': rows[0].NumberOfReviews,
                'totalRating': rows[0].TotalRating == undefined ? 0 : rows[0].TotalRating
            })
        }
    })
}

function updateUserInfo(requestFields, callback) {
    let userID = requestFields.userID
    let firstName = requestFields.firstName
    let lastName = requestFields.lastName
    let bio = requestFields.bio

    let queryString = `UPDATE User SET FirstName = '${firstName}', LastName = '${lastName}', Bio = '${bio}' WHERE ID = ${userID}`;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            callback('success', 'Profile updated successfully');
        }
    })
}


function fetchTaskerHomeData(requestFields, callback) {

    let userID = requestFields.taskerID
    let currentTimestamp = Date.now()

    getTaskerApprovedJobList(userID, (status, output) => {
        if (status == 'error') {
            callback('error', 'System error - Approved Jobs')
        } else {
            let queryString = `SELECT * FROM (SELECT Job.JobID AS jobid, Name AS JobName, Wage As JobWage, Date As JobDate, Description AS JobInfo, HirerID AS Hirer, JobCategory AS Category FROM Job WHERE Date > ${currentTimestamp}) Q2 LEFT JOIN (SELECT Job.* , JobStatus.ID, JobStatus.TaskerID, JobStatus.Status FROM Job, JobStatus WHERE Job.JobID = JobStatus.JobID AND TaskerID = ${userID} AND Job.Date > ${currentTimestamp}) Q1 ON Q1.JobID = Q2.JobID ORDER BY Q2.JobDate`;

            connection.query(queryString, function (error, rows) {
                if (error) {
                    callback('error', 'System error')
                } else {
                    let upcomingJobList = [];
                    for (i = 0; i < rows.length; i++) {
                        if (rows[i].Status == undefined || rows[i].Status == 4) {
                            upcomingJobList.push({
                                'jobID': rows[i].jobid,
                                'jobName': rows[i].JobName,
                                'date': rows[i].JobDate,
                                'description': rows[i].JobInfo,
                                'jobCategory': rows[i].Category,
                                'hirerID': rows[i].Hirer,
                                'status': rows[i].Status == undefined ? 0 : rows[i].Status,
                                'jobWage': rows[i].JobWage,
                                'jobStatusID': rows[i].ID == undefined ? 0 : rows[i].ID
                            })
                        }
                    }
                    callback('success', { "approved_jobs": output, "upcoming_jobs": upcomingJobList });
                }
            })
        }
    });
}

function getTaskerApprovedJobList(userID, callback) {
    // SELECT Job.JobID, Name, Date, JobCategory,  From Job, JobRequest WHERE Job.JobID = JobRequest.JobID AND WorkerID = 14 AND STATUS = 1
    let queryString = `SELECT JobStatus.ID As JobStatusID, Job.JobID, Name, JobCategory, Job.HirerID, Date, Description, Wage, Status From Job, JobStatus WHERE Job.JobID = JobStatus.JobID AND TaskerID = ${userID} AND Status = 2`;
    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error')
        } else {
            let joblist = [];
            for (i = 0; i < rows.length; i++) {
                joblist.push({
                    'jobID': rows[i].JobID,
                    'jobName': rows[i].Name,
                    'date': rows[i].Date,
                    'jobCategory': rows[i].JobCategory,
                    'hirerID': rows[i].HirerID,
                    'status': rows[i].Status,
                    'jobWage': rows[i].Wage,
                    'description': rows[i].Description,
                    'jobStatusID': rows[i].JobStatusID
                })
            }
            callback('success', joblist);
        }
    })
}

function updateJobStatus(requestFields, callback) {

    let taskerID = requestFields.taskerID
    let hirerID = requestFields.hirerID
    let jobID = requestFields.jobID
    let status = requestFields.status
    let jobStatusID = requestFields.jobStatusID


    let queryString;
    if (jobStatusID == 0) {
        if (status == 1) {
            queryString = `INSERT INTO JobStatus (JobID, TaskerID, Status, DateRequested) VALUES (${jobID}, ${taskerID}, ${status}, ${Date.now()})`
        } else {
            queryString = `INSERT INTO JobStatus (JobID, TaskerID, Status) VALUES (${jobID}, ${taskerID}, ${status})`
        }
    } else {
        if (status == 1) {
            queryString = `Update JobStatus SET Status = ${status}, DateRequested = ${Date.now()} WHERE ID = ${jobStatusID}`
        } else {
            queryString = `Update JobStatus SET Status = ${status} WHERE ID = ${jobStatusID}`
        }
    }

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            callback('success', 'Saved successfully');
        }
    })
}

function deleteJobFromJobStatusTable(requestFields, callback) {
    let jobStatusID = requestFields.jobStatusID;

    let queryString = `DELETE FROM JobStatus WHERE ID = ${jobStatusID}`

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            callback('success', 'Unsaved successfully');
        }
    })
}

function fetchTaskerAppliedJobList(requestFields, callback) {
    let taskerID = requestFields.taskerID;

    let queryString = `SELECT Job.* , JobStatus.ID As JobStatusID, JobStatus.Status, JobStatus.DateRequested FROM Job, JobStatus WHERE Job.JobID = JobStatus.JobID AND Status != 4 AND JobStatus.TaskerID = ${taskerID} ORDER BY Date`

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error')
        } else {
            let joblist = [];
            for (i = 0; i < rows.length; i++) {
                joblist.push({
                    'jobID': rows[i].JobID,
                    'jobName': rows[i].Name,
                    'jobWage': rows[i].Wage,
                    'date': rows[i].Date,
                    'description': rows[i].Description,
                    'hirerID': rows[i].HirerID,
                    'jobCategory': rows[i].JobCategory,
                    'jobStatusID': rows[i].JobStatusID,
                    'status': rows[i].Status
                })
            }
            callback('success', joblist);
        }
    })
}

function fetchTaskerSavedJobList(requestFields, callback) {
    let taskerID = requestFields.taskerID;

    let queryString = `SELECT Job.* , JobStatus.ID As JobStatusID, JobStatus.Status, JobStatus.DateRequested FROM Job, JobStatus WHERE Job.JobID = JobStatus.JobID AND Status = 4 AND JobStatus.TaskerID = ${taskerID} ORDER BY Date`

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error')
        } else {
            let joblist = [];
            for (i = 0; i < rows.length; i++) {
                joblist.push({
                    'jobID': rows[i].JobID,
                    'jobName': rows[i].Name,
                    'jobWage': rows[i].Wage,
                    'date': rows[i].Date,
                    'description': rows[i].Description,
                    'hirerID': rows[i].HirerID,
                    'jobCategory': rows[i].JobCategory,
                    'jobStatusID': rows[i].JobStatusID,
                    'status': rows[i].Status
                })
            }
            callback('success', joblist);
        }
    })
}

function fetchTaskerJobInfo(requestFields, callback) {
    let jobID = requestFields.jobID;
    let hirerID = requestFields.hirerID;
    let taskerID = requestFields.taskerID;

    let queryString = `SELECT Job.*, User.ID, FirstName, LastName, EmailID, ProfileImage, Dob, Bio, (SELECT COUNT(ID) FROM Review WHERE UserID = ${hirerID}) AS NumberOfReviews, (SELECT SUM(Rating) FROM Review WHERE UserID = ${hirerID}) AS TotalRating, (SELECT ID from JobStatus WHERE TaskerID = ${taskerID} AND JobID = ${jobID}) AS JobStatusID, (SELECT Status from JobStatus WHERE TaskerID = ${taskerID} AND JobID = ${jobID}) AS JobStatus FROM User, Job WHERE Job.HirerID = User.ID AND User.ID = ${hirerID} AND Job.JobID = ${jobID}`;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error')
        } else {

            let output = {
                'jobInfo': {
                    'jobID': rows[0].JobID,
                    'jobName': rows[0].Name,
                    'jobWage': rows[0].Wage,
                    'date': rows[0].Date,
                    'description': rows[0].Description,
                    'hirerID': rows[0].HirerID,
                    'jobCategory': rows[0].JobCategory,
                    'jobStatusID': rows[0].JobStatusID == undefined ? 0 : rows[0].JobStatusID,
                    'status': rows[0].JobStatus == undefined ? 0 : rows[0].JobStatus
                },
                'userInfo': {
                    'userID': rows[0].ID,
                    'firstName': rows[0].FirstName,
                    'lastName': rows[0].LastName,
                    'emailID': rows[0].EmailID,
                    'profileImage': rows[0].ProfileImage,
                    'dob': rows[0].Dob,
                    'bio': rows[0].Bio,
                    'numberOfReviews': rows[0].NumberOfReviews,
                    'totalRating': rows[0].TotalRating == undefined ? 0 : rows[0].TotalRating
                }
            }



            callback('success', output);
        }
    })
}

function fetchUserReviewList(requestFields, callback) {
    let userID = requestFields.userID;

    let queryString = `SELECT Review.*, User.ProfileImage AS ReviewerProfilePic, User.FirstName AS ReviewerName, Job.Name AS JobName FROM Review, User, Job WHERE Review.ReviewerID = User.ID AND Review.JobID = Job.JobID AND Review.UserID = ${userID} ORDER BY Date Desc`

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error')
        } else {
            let reviewList = [];
            for (i = 0; i < rows.length; i++) {
                reviewList.push({
                    'ID': rows[i].ID,
                    'reviewerProfilePic': rows[i].ReviewerProfilePic,
                    'reviewerName': rows[i].ReviewerName,
                    'jobName': rows[i].JobName,
                    'rating': rows[i].Rating,
                    'reviewDate': rows[i].Date,
                    'review': rows[i].Review
                })
            }
            callback('success', reviewList);
        }
    })
}

function fetchReviewOfJob(requestFields, callback) {
    let jobID = requestFields.jobID;
    let reviewerID = requestFields.reviewerID;

    let queryString = `SELECT Review.*, User.ID AS ReviewerID, User.FirstName, User.ProfileImage FROM Review, User WHERE Review.ReviewerID = User.ID AND JobID = ${jobID} AND ReviewerID = ${reviewerID} `;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            let reviewList = [];
            for (i = 0; i < rows.length; i++) {
                reviewList.push({
                    'ID': rows[i].ID,
                    'reviewerID': rows[i].ReviewerID,
                    'reviewerProfilePic': rows[i].ProfileImage,
                    'reviewerName': rows[i].FirstName,
                    'rating': rows[i].Rating,
                    'reviewDate': rows[i].Date,
                    'review': rows[i].Review
                })
            }
            callback('success', reviewList);
        }
    })
}

function addNewReview(requestFields, callback) {
    let jobID = requestFields.jobID;
    let userID = requestFields.userID;
    let reviewerID = requestFields.reviewerID
    let date = Date.now()
    let rating = requestFields.rating
    let review = requestFields.review

    let queryString = `INSERT INTO Review (JobID, UserID, ReviewerID, Date, Rating, Review) VALUES (${jobID}, ${userID}, ${reviewerID}, ${date}, ${rating}, "${review}")`
    console.log(queryString)
    connection.query(queryString, function (error, result) {

        if (error) {
            callback("error", "Saving Review");
        } else {
            callback("success", "Review Added Successfully")
        }

    })
}

function getRequestedJobInfo(requestFields, callback) {
    let userID = requestFields.hirerID;

    let queryString = `SELECT Job.*, JobStatus.ID, JobStatus.TaskerID, User.FirstName, User.LastName, User.ProfileImage, User.Dob, User.Bio,
            COUNT(Review.ReviewerID) AS TotalReviews, SUM(Rating) AS TotalRating 
            FROM Job, User, JobStatus 
            LEFT JOIN Review 
            ON JobStatus.TaskerID = Review.UserID
            WHERE Job.JobID = JobStatus.JobID AND 
            JobStatus.TaskerID = User.ID AND 
            Job.HirerID = ${userID} AND JobStatus.Status = 1 
            GROUP BY Job.JobID, JobStatus.ID ORDER BY DateRequested`

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error - in fecthing jobs')
        } else {
            let jobList = []
            for (i = 0; i < rows.length; i++) {
                jobList.push({
                    'jobInfo': {
                        'jobID': rows[i].JobID,
                        'jobName': rows[i].Name,
                        'jobWage': rows[i].Wage,
                        'date': rows[i].Date,
                        'description': rows[i].Description,
                        'hirerID': rows[i].HirerID,
                        'jobStatusID': rows[i].ID,
                        'jobCategory': rows[i].JobCategory
                    },
                    'userInfo': {
                        'userID': rows[i].TaskerID,
                        'firstName': rows[i].FirstName,
                        'lastName': rows[i].LastName,
                        'dob': rows[i].Dob,
                        'bio': rows[i].Bio,
                        'profileImage': rows[i].ProfileImage,
                        'numberOfReviews': rows[i].TotalReviews,
                        'totalRating': rows[i].TotalRating == undefined ? 0 : rows[i].TotalRating
                    }
                })
            }
            callback('success', jobList)
        }
    })
}

module.exports = {
    addSignedUpUser,
    checkEmailVerification,
    resendEmailVerificationCode,
    createActivationCodeForNewPassword,
    createNewPassword,
    loginUser,
    fetchPostJobResponse,
    fetchHirerHomeData,
    fetchHirerUpcomingJobList,
    fetchHirerJobHistoryList,
    fetchUserInfo,
    updateUserInfo,
    fetchTaskerHomeData,
    updateJobStatus,
    deleteJobFromJobStatusTable,
    fetchTaskerAppliedJobList,
    fetchTaskerSavedJobList,
    fetchTaskerJobInfo,
    fetchUserReviewList,
    fetchHirerHistoryJobInfo,
    fetchReviewOfJob,
    addNewReview,
    getRequestedJobInfo
}

function generateActivationRandomNumber() {
    return Math.floor(Math.random() * 10000);
}