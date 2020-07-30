var admin = require("firebase-admin");
var log = console.log;

var serviceAccount = require("./key/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://errandz-284301.firebaseio.com"
});


const sendNotification = (token, heading, message) => {
    var payload = {
        notification: {
            title: heading,
            body: message
        }
    }

    log(`Notification Token : ${token}`);
    log(`Notification Heading : ${heading}`);
    log(`Notification Message : ${message}`);

    admin.messaging().sendToDevice(token, payload)
        .then(function (response) {
            console.log("Successfully sent message:", response);
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        });
}


/**
 * Below snippet is the sample code to send notifications with different options
 */
const sendSampleMessage = () => {

    var registrationToken = "eoqxv1o5Qqa8aXSZPyeHCr:APA91bE4mLG_pZ6p5zg6VM2Um6UPj4JX51CavAXreTqLCq5XWNRObKFdGW4alkZzrCl_jL1sKm3-7BfFzThuNdOowSpywyUdHqEFFR1oVmBC0EPdtz6CRulRfgDwiNrJANcfWdP3Ikzh";

    var payload = {
        notification: {
            title: "Errandz App",
            body: "Sample Notification from Errandz"
        },
        data: {
            heading: "Errandz App",
            message: "Sample Notification from Errandz"
        }
    };

    //  In case certain options needs to be applied to the notification
    var options = {
        priority: "normal",
        timeToLive: 60 * 60
    };

    admin.messaging().sendToDevice(registrationToken, payload, options)
        .then(function (response) {
            console.log("Successfully sent message:", response);
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        });
}


module.exports = { sendSampleMessage, sendNotification }