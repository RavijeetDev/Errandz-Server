var admin = require("firebase-admin");

function checkTokenValidation(req, callback) {

    let idToken = req.headers.authorization;
    let uid = req.fields.uid;
    if (idToken != undefined && idToken !== "") {
        admin.auth().verifyIdToken(idToken)
            .then(function (decodedToken) {
                let tokenUid = decodedToken.uid;
                if (uid === tokenUid) {
                    callback("200", 'success');
                } else {
                    callback("404", "Unauthorized Token")
                }
            }).catch(function (error) {
                console.log(error.code)
                if (error.code === "auth/id-token-expired") {
                    callback("404 ", "Token expired");
                } else {
                    callback("404", "Unauthorized Token");
                }
            })
    }
}

module.exports = {
    checkTokenValidation
}