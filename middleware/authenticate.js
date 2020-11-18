const jwt = require('jsonwebtoken')

const db = require('../dbConnectExec.js')
const config = require('../config.js')

const auth = async(req, res, next)=>{
    //console.log(req.header('Authorization'))
    try{

        //1. decode token

       let myToken = req.header('Authorization').replace('Bearer ', '')
       console.log(myToken)

       let decodedToken = jwt.verify(myToken, config.JWT)
       console.log(decodedToken)

       let PatientPK = decodedToken.pk;
       console.log(PatientPK)
        //2. compare token with db token
        let query = `SELECT PatientPK, FName, LName, DateOfBirth 
        FROM Patient
        WHERE PatientPK = ${PatientPK} and Token = '${myToken}'`

        let returnedUser = await db.executeQuery(query)
        //console.log(returnedUser)
        //3. save user information in request
        if(returnedUser[0]){
            req.patient = returnedUser[0];
            next()
        }
        else(res.status(401).send('Authentication failed.'))
    
    }catch(myError){
        res.status(401).send("Authentication failed")
    }
}
module.exports = auth