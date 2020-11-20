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

       let DoctorPK = decodedToken.pk;
       console.log(DoctorPK)
        //2. compare token with db token
        let query = `SELECT DoctorPK, FName, LName, Email 
        FROM Doctor
        WHERE DoctorPK = ${DoctorPK} and Token = '${myToken}'`

        let returnedUser = await db.executeQuery(query)
        //console.log(returnedUser)
        //3. save user information in request
        if(returnedUser[0]){
            req.doctor = returnedUser[0];
            next()
        }
        else(res.status(401).send('Authentication failed.'))
    
    }catch(myError){
        res.status(401).send("Authentication failed")
    }
}
module.exports = auth
