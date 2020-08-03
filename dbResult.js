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
const notificationServer = require('./noti.js');


// ***********************************************************
//      Setting up Node Server using ExpressJS
// ***********************************************************


// var connection = mysql.createConnection({
//     host: 'localhost',
//     port: '8889',
//     user: 'root',
//     password: 'root',
//     database: 'Errandz'
// });


var connection = mysql.createConnection({
    host: 'aws-db-errandz.c7gfmikod6bj.us-east-1.rds.amazonaws.com',
    port: '3306',
    user: 'admin',
    password: 'g55Svp~0',
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

    let firstName = signUpFields.firstName
    let lastName = signUpFields.lastName
    let dob = signUpFields.dob
    let emailID = signUpFields.emailID
    let userType = signUpFields.userType
    let loginType = signUpFields.loginType
    let uid = signUpFields.uid
    let profileImage = signUpFields.profileImage

    let queryString = `INSERT INTO User 
    (FirstName, LastName, EmailID, UserType, Dob, LoginType, UID, ProfileImage, Active) 
    VALUES ('${firstName}', "${lastName}", "${emailID}", ${userType}, ${dob}, ${loginType}, "${uid}", "${profileImage}", 1)`;

    connection.query(queryString, function (error, result) {

        if (error) {
            console.log("Issue in inserting data of User")
            callback("error", "System error");
        } else {
            callback("success", "Email ID registered successfully.")
        }

    })

}

function loginUser(requestFields, callback) {

    let emailID = requestFields.emailID
    let uID = requestFields.uid;
    let loginType = requestFields.loginType;
    let pushToken = requestFields.token;

    let queryString = `SELECT User.*, User.ID AS UserID , Address.* 
    FROM User LEFT JOIN Address 
    ON User.AddressID = Address.ID 
    WHERE EmailID = "${emailID}" AND UID = "${uID}" AND LoginType = ${loginType}`;

    console.log(queryString)
    connection.query(queryString, function (error, fetchedData) {
        if (error) {
            callback("error", "System Error")
        } else if (fetchedData.length == 0) {
            callback("error", "Email ID does not exist ")
        } else {
            let output = {
                "userID": fetchedData[0].UserID,
                "firstName": fetchedData[0].FirstName,
                "lastName": fetchedData[0].LastName,
                "emailID": fetchedData[0].EmailId,
                "userType": fetchedData[0].UserType,
                "dob": fetchedData[0].Dob,
                "profileImage": fetchedData[0].ProfileImage,
                "bio": fetchedData[0].Bio,
                "address": {
                    "addressID": fetchedData[0].ID,
                    "streetAddress": fetchedData[0].StreetAddress,
                    "city": fetchedData[0].City,
                    "province": fetchedData[0].Province,
                    "postalCode": fetchedData[0].PostalCode,
                    "country": fetchedData[0].Country,
                    "latitude": fetchedData[0].Latitude,
                    "longitude": fetchedData[0].Longitude,
                    "fullAddress": fetchedData[0].FullAddress
                }
            }
            let fields = {
                userID: fetchedData[0].UserID,
                token: pushToken
            }
            updateNotificationToken(fields, (status, message) => {
                if (status === "error") {
                    console.log(message);
                } else {
                    console.log(message);
                }
            })
            callback('success', output);
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
            console.log(queryString)

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
    console.log(queryString)
    connection.query(queryString, function (error, rows) {
        if (error) {
            console.log("Number of Client Jobs - System Error")
            callback('error', 'System error')
        } else {
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

    let queryString = `INSERT INTO Job (Name, Wage, Date, Description, JobCategory, HirerID) 
    VALUES ("${jobName}", ${jobWage}, ${date}, "${jobDescription}", ${jobCategory}, ${hirerID})`;

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


function fetchHirerJobTaskerDescription(requestFields, callback) {
    let jobID = requestFields.jobID;

    let queryString = `SELECT JobStatus.ID AS JobStatusID, Status, User.* FROM JobStatus, User 
    WHERE JobStatus.TaskerID = User.ID 
    AND JobID = ${jobID} AND Status IN (2, 5)`;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System Error');
        } else {
            let output = {}
            if (rows.length > 0) {
                output = {
                    'jobInfo': {
                        'jobStatusID': rows[0].JobStatusID,
                        'status': rows[0].Status
                    },
                    'userInfo': {
                        'userID': rows[0].ID,
                        'firstName': rows[0].FirstName,
                        'lastName': rows[0].LastName,
                        'emailID': rows[0].EmailId,
                        'profileImage': rows[0].ProfileImage
                    }
                }
            }
            callback('success', output);
        }
    })
}


function fetchHirerJobHistoryList(requestFields, callback) {

    let hirerID = requestFields.hirerID;

    let queryString = `SELECT Job.*, JobStatus.ID, JobStatus.Status, JobStatus.TaskerID 
    FROM Job, JobStatus 
    WHERE Job.JobID = JobStatus.JobID 
    AND Status = 6 AND HirerID = ${hirerID} 
    ORDER BY Date DESC`;

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

    let queryString = `SELECT Job.*, JobStatus.ID, JobStatus.Status, 
    User.ID As UserID, User.FirstName, User.LastName, User.ProfileImage, User.Dob, User.Bio, 
    (SELECT COUNT(ID) FROM Review WHERE UserID = ${taskerID}) AS NumberOfReviews, 
    (SELECT SUM(Rating) FROM Review WHERE UserID = ${taskerID}) AS TotalRating 
    FROM Job, JobStatus, User 
    WHERE Job.JobID = JobStatus.JobID 
    AND User.ID = JobStatus.TaskerID 
    AND Job.JobID = ${jobID} AND Status = 6 AND JobStatus.TaskerID = ${taskerID}`;

    console.log(queryString);
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


function fetchUserInfo(requestFields, callback) {

    let userId =  requestFields.userID;
         
    let queryString = `SELECT User.ID, FirstName, LastName, EmailID, UserType, Dob, ProfileImage, Bio, 
    (SELECT COUNT(ID) FROM Review WHERE UserID = ${userId}) AS NumberOfReviews, 
    (SELECT SUM(Rating) FROM Review WHERE UserID = ${userId}) AS TotalRating, 
    Address.ID AS AddressID, Address.* 
    FROM User, Address 
    WHERE User.AddressID = Address.ID AND User.ID = ${userId}`;

    console.log(queryString)
    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            // coonsole.log(rows[0])
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
                'totalRating': rows[0].TotalRating == undefined ? 0 : rows[0].TotalRating,
                "address": {
                    "addressID": rows[0].AddressID,
                    "streetAddress": rows[0].StreetAddress,
                    "city": rows[0].City,
                    "province": rows[0].Province,
                    "postalCode": rows[0].PostalCode,
                    "country": rows[0].Country,
                    "latitude": rows[0].Latitude,
                    "longitude": rows[0].Longitude,
                    "fullAddress": rows[0].FullAddress
                }
            })
        }
    })
}


function addAddressRequest(requestFields, callback) {
    let userID = requestFields.userID;
    let fullAddress = requestFields.fullAddress;
    let streetAddress = requestFields.streetAddress;
    let city = requestFields.city;
    let province = requestFields.province;
    let postalCode = requestFields.postalCode;
    let country = requestFields.country;
    let latitude = requestFields.latitude;
    let longitude = requestFields.longitude;

    let queryString = `INSERT INTO Address (StreetAddress, City, province, PostalCode, Country, FullAddress, Latitude, Longitude) 
    VALUES ('${streetAddress}', '${city}', '${province}', '${postalCode}', '${country}', '${fullAddress}', ${latitude}, ${longitude})`;


    connection.query(queryString, function (error, rows) {

        if (error) {
            callback('error', 'System Error - Insert Address');
        } else {
            let addressID = rows.insertId;

            let userQueryString = `UPDATE User SET AddressID = ${addressID} WHERE ID = ${userID}`;

            connection.query(userQueryString, function (errorMessage, result) {
                if (error) {
                    callback('error', 'System error - updating address id')
                } else {
                    console.log('success', 'Address added successfully!')
                }
            })
        }

    })
}


function updateUserInfo(requestFields, callback) {

    let userID = requestFields.userID
    let firstName = requestFields.firstName
    let lastName = requestFields.lastName
    let bio = requestFields.bio
    let addressJson = JSON.parse(requestFields.address);
    let addressID = addressJson.addressID;
    let fullAddress = addressJson.fullAddress;
    let streetAddress = addressJson.streetAddress;
    let city = addressJson.city;
    let province = addressJson.province;
    let postalCode = addressJson.postalCode;
    let country = addressJson.country;
    let latitude = addressJson.latitude;
    let longitude = addressJson.longitude;

    let addressQueryString = `UPDATE Address SET StreetAddress = '${streetAddress}', City = '${city}', Province = '${province}', 
    PostalCode = '${postalCode}', Country = '${country}', FullAddress = '${fullAddress}', 
    Latitude = ${latitude}, Longitude = ${longitude} WHERE ID = ${addressID}`;

    console.log(`Address insert query : ${addressQueryString}`);
    connection.query(addressQueryString, function (error, rows) {

        if (error) {
            console.log('System Error - Updating address')
            callback('error', 'System Error - Updating address');
        } else {

            let queryString = `UPDATE User SET FirstName = '${firstName}', LastName = '${lastName}', Bio = '${bio}', AddressID = '${addressID}' WHERE ID = ${userID}`;
            console.log(queryString)
            connection.query(queryString, function (error, rows) {
                if (error) {
                    console.log('System error - profile updating')
                    callback('error', 'System error - profile updating');
                } else {
                    callback('success', 'Profile updated successfully');
                }
            })
        }
    });
}


function fetchTaskerHomeData(requestFields, callback) {

    let userID = requestFields.taskerID
    let currentTimestamp = Date.now()

    getTaskerApprovedJobList(userID, (status, output) => {
        if (status == 'error') {
            callback('error', 'System error - Approved Jobs')
        } else {
            let queryString = `SELECT * FROM 
            (SELECT Job.JobID AS jobid, Name AS JobName, Wage As JobWage, Date As JobDate, 
             Description AS JobInfo, HirerID AS Hirer, JobCategory AS Category FROM Job 
             WHERE Date > ${currentTimestamp}) Q2 LEFT JOIN 
             (SELECT Job.* , JobStatus.ID, JobStatus.TaskerID, JobStatus.Status FROM Job, JobStatus 
              WHERE Job.JobID = JobStatus.JobID 
              AND TaskerID = ${userID} AND Job.Date > ${currentTimestamp}) 
              Q1 ON Q1.JobID = Q2.JobID ORDER BY Q2.JobDate`;

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

    let queryString = `SELECT JobStatus.ID As JobStatusID, Job.JobID, Name, JobCategory, Job.HirerID, Date, Description, Wage, Status 
    From Job, JobStatus 
    WHERE Job.JobID = JobStatus.JobID
    AND TaskerID = ${userID} AND Status IN (2, 5)`;

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

    console.log(queryString);
    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {
            if (status == 1) {
                fetchDataForNotification(hirerID, taskerID, "Job Request", "sent you a new job request");
            } else if (status == 2) {
                fetchDataForNotification(taskerID, hirerID, "Request Accepted", "accepted your job request");
            }
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

    let queryString = `SELECT Job.* , JobStatus.ID As JobStatusID, JobStatus.Status, JobStatus.DateRequested 
    FROM Job, JobStatus 
    WHERE Job.JobID = JobStatus.JobID 
    AND Status != 4 AND Status != 6 AND JobStatus.TaskerID = ${taskerID} 
    ORDER BY Date`

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

    let queryString = `SELECT Job.* , JobStatus.ID As JobStatusID, JobStatus.Status, JobStatus.DateRequested 
    FROM Job, JobStatus 
    WHERE Job.JobID = JobStatus.JobID 
    AND Status = 4 AND JobStatus.TaskerID = ${taskerID} 
    ORDER BY Date`;

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

    let queryString = `SELECT Job.*, User.ID AS UserID, FirstName, LastName, EmailID, ProfileImage, Dob, Bio, Address.*, 
    (SELECT COUNT(ID) FROM Review WHERE UserID = ${hirerID}) AS NumberOfReviews, 
    (SELECT SUM(Rating) FROM Review WHERE UserID = ${hirerID}) AS TotalRating, 
    (SELECT ID from JobStatus WHERE TaskerID = ${taskerID} 
     AND JobID = ${jobID}) AS JobStatusID, 
     (SELECT Status from JobStatus 
      WHERE TaskerID = ${taskerID} 
      AND JobID = ${jobID}) AS JobStatus 
      FROM User, Job, Address 
      WHERE Job.HirerID = User.ID 
      AND User.AddressID = Address.ID 
      AND User.ID = ${hirerID} AND Job.JobID = ${jobID}`;

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
                    'userID': rows[0].UserID,
                    'firstName': rows[0].FirstName,
                    'lastName': rows[0].LastName,
                    'emailID': rows[0].EmailID,
                    'profileImage': rows[0].ProfileImage,
                    'dob': rows[0].Dob,
                    'bio': rows[0].Bio,
                    'numberOfReviews': rows[0].NumberOfReviews,
                    'totalRating': rows[0].TotalRating == undefined ? 0 : rows[0].TotalRating,
                    "address": {
                        "addressID": rows[0].ID,
                        "streetAddress": rows[0].StreetAddress,
                        "city": rows[0].City,
                        "province": rows[0].Province,
                        "postalCode": rows[0].PostalCode,
                        "country": rows[0].Country,
                        "latitude": rows[0].Latitude,
                        "longitude": rows[0].Longitude,
                        "fullAddress": rows[0].FullAddress
                    }
                }
            }



            callback('success', output);
        }
    })
}


function fetchTaskerJobHistoryList(requestFields, callback) {
    let taskerID = requestFields.taskerID;
    let currentTimestamp = Date.now()

    let queryString = `SELECT Job.*, JobStatus.ID, JobStatus.Status 
    FROM Job, JobStatus 
    WHERE Job.JobID = JobStatus.JobID AND Status = 6 AND TaskerID = ${taskerID} 
    ORDER BY Date DESC`;

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
                    'hirerID': rows[i].HirerID
                })
            }
            callback('success', joblist)
        }
    })
}


function fetchTaskerHistoryJobInfo(requestFields, callback) {
    let jobID = requestFields.jobID;
    let hirerID = requestFields.hirerID;
    let taskerID = requestFields.taskerID;

    let queryString = `SELECT Job.*, JobStatus.ID AS JobStatusID, JobStatus.Status, 
    User.ID As UserID, User.FirstName, User.LastName, User.ProfileImage, 
    User.Dob, User.Bio, Address.*, 
    (SELECT COUNT(ID) FROM Review WHERE UserID = ${hirerID}) AS NumberOfReviews, 
    (SELECT SUM(Rating) FROM Review WHERE UserID = ${hirerID}) AS TotalRating 
    FROM Job, JobStatus, User, Address 
    WHERE Job.JobID = JobStatus.JobID 
    AND User.ID = Job.HirerID 
    AND Job.JobID = ${jobID} AND Status = 6 
    AND JobStatus.TaskerID = ${taskerID} 
    AND Address.ID = User.AddressID`;

    console.log(queryString);
    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'System error');
        } else {

            let output = {
                'jobInfo': {
                    'jobID': rows[0].JobID,
                    'jobName': rows[0].Name,
                    'jobWage': rows[0].Wage,
                    'date': rows[0].Date,
                    'description': rows[0].Description,
                    'hirerID': hirerID,
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
                    'totalRating': rows[0].TotalRating == undefined ? 0 : rows[0].TotalRating,
                    "address": {
                        "addressID": rows[0].ID,
                        "streetAddress": rows[0].StreetAddress,
                        "city": rows[0].City,
                        "province": rows[0].Province,
                        "postalCode": rows[0].PostalCode,
                        "country": rows[0].Country,
                        "latitude": rows[0].Latitude,
                        "longitude": rows[0].Longitude,
                        "fullAddress": rows[0].FullAddress
                    }
                }
            }



            callback('success', output);
        }
    })
}


function fetchUserReviewList(requestFields, callback) {
    let userID = requestFields.userID;

    let queryString = `SELECT Review.*, User.ProfileImage AS ReviewerProfilePic, 
    User.FirstName AS ReviewerName, Job.Name AS JobName 
    FROM Review, User, Job 
    WHERE Review.ReviewerID = User.ID 
    AND Review.JobID = Job.JobID 
    AND Review.UserID = ${userID} 
    ORDER BY Date Desc`;

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

    let queryString = `SELECT Review.*, User.ID AS ReviewerID, User.FirstName, User.ProfileImage 
    FROM Review, User 
    WHERE Review.ReviewerID = User.ID 
    AND JobID = ${jobID} AND ReviewerID = ${reviewerID}`;

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

    let queryString = `INSERT INTO Review (JobID, UserID, ReviewerID, Date, Rating, Review) 
    VALUES (${jobID}, ${userID}, ${reviewerID}, ${date}, ${rating}, "${review}")`
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


function updateNotificationToken(requestFields, callback) {
    let userID = requestFields.userID;
    let token = requestFields.token;

    let queryString = `UPDATE User SET PushToken  = "${token}" WHERE ID = ${userID}`;

    connection.query(queryString, function (error, rows) {
        if (error) {
            callback('error', 'Notification Not Updated');
        } else {
            callback('success', "Notification Token Updated Successfully");
        }
    })
}


function fetchDataForNotification(recieverID, senderID, notificationTitle, notificationMessageSubString) {
    let tokenQueryString = `SELECT PushToken FROM User WHERE ID = ${recieverID}`;

    connection.query(tokenQueryString, function (error, result) {
        if (error) {
            console.log("Token Not Retrieved");
        } else {

            let token = result[0].PushToken;
            let userQueryString = `SELECT FirstName, LastName FROM User WHERE ID = ${senderID}`;
            connection.query(userQueryString, function (error, result) {
                if (error) {
                    console.log("User Not Fetched for Notification");
                } else {
                    let name = `${result[0].FirstName} ${result[0].LastName}`;
                    notificationServer.sendNotification(token, notificationTitle, `${name} ${notificationMessageSubString}`);
                }

            })
        }

    })
}


module.exports = {
    addSignedUpUser,
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
    fetchTaskerJobHistoryList,
    fetchTaskerHistoryJobInfo,
    fetchUserReviewList,
    fetchHirerHistoryJobInfo,
    fetchReviewOfJob,
    addNewReview,
    getRequestedJobInfo,
    addAddressRequest,
    fetchHirerJobTaskerDescription,
    updateNotificationToken
}
