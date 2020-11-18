const express = require('express')
//const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js')
const config = require('./config.js')
const auth = require('./middleware/authenticate')

//azurewebsites.net, colostate.edu
const app = express();
app.use(express.json())
app.use(cors())

//const auth = async(req, res, next)=>{
    //console.log(req.header('Authorization'))
    //next()
//}

app.post("/procedure", auth, (req,res)=>{
    try{
    var PatientFK = req.body.PatientFK;
    var TestName = req.body.TestName;
    var TestDate = req.body.TestDate;
    var Cost = req.body.Cost;

    if(!PatientFK || !TestName || !TestDate || !Cost){res.status(400).send("bad request")}
     TestName = TestName.replace("'","''")

    //console.log("here is the patient in /procedure", req.patient)
    //res.send("here is your response")

    let insertQuery = `INSERT INTO Procedure(TestName, TestDate, Cost, DoctorPK, PatientFK)
    OUTPUT inserted.PatientPK, inserted.TestName, inserted.TestDate, inserted.Cost, inserted.DoctorPK
    VALUES('${TestName}','${TestDate}','${Cost}','${PatientFK}', ${req.patient.PatientFK})`

    let insertedPatient = dbexecuteQuery(insertQuery)
    //console.log(insertedPatient)
    res.status(201).send(insertedPatient[0])
}
    catch(error){
        console.log("error in POST /procedure", error);
        res.status(500).send()
    }
})

app.get('/patient/me', auth, (req,res)=>{
    res.send(req.patient)
})


app.get("/hi",(req,res)=>{
    res.send("hello world")
})

app.post("/patient/login", async (req,res)=>{
   // console.log(req.body)

    var DateOfBirth = req.body.DateOfBirth;
    var PhoneNumber = req.body.PhoneNumber;

    if(!DateOfBirth || !PhoneNumber){
        return res.status(400).send("bad request")
    }

    //1. check that user DOB exists in database
    var query = `SELECT *
    FROM Patient
    WHERE DateOfBirth = '${DateOfBirth}'`
    let result;

    try{
        result = await db.executeQuery(query);
    }catch(myError){
        console.log('error in /patient/login:', myError)
        return res.status(500).send()
    }
    //console.log(result)

    //2. check that phone number matches

    let user = result[0]
    //console.log(user)

    if(!bcrypt.compareSync(PhoneNumber,user.PhoneNumber)){
        console.log("invalid phone number");
        return res.status(400).send("Invalid user credentials")
    }

    //3. generate a token

    let token = jwt.sign({pk: user.PatientPK}, config.jwt, {expiresIn: '60 minutes'})
    console.log(token)

    //4. save token in database and send token and user info back to user
    let setTokenQuery = `UPDATE Patient
    SET Token = '${token}'
    WHERE PatientPK = ${user.PatientPK}`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user: {
                FName: user.FName,
                LName: user.LName,
                PhoneNumber: user.PhoneNumber,
                PatientPK: user.PatientPK
            }
        })
    }
    catch(myError){
        console.log("error setting user token ", myError);
        res.status(500).send()
    }

    app.post("/patient", async (req,res)=>{
        //res.send("creating user")
        //console.log(req.body)
        var FName = req.body.FName;
        var LName = req.body.LName;
        var Address = req.body.Address;
        var PhoneNumber = req.body.PhoneNumber;
        var DateOfBirth = req.body.DateOfBirth;
        var VisitDate = req.body.VisitDate;
    
    FName = FName.replace("'","''")
    LName = LName.replace("'","''")
    var PhoneNumberCheckQuery = `SELECT PhoneNumber
    FROM patient
    WHERE PhoneNumber = '${PhoneNumber}'`

    var existingUser = await db.executeQuery(PhoneNumberCheckQuery)
    
    console.log("existing user", existingUser)
    if(existingUser[0]){
        return res.status(409).send('Please enter a different phone number.')
    }

    //var hashedPassword = bcrypt.hashSync(password)
    var insertQuery = `INSERT INTO patient(FName,LName,Address,DateOfBirth,PhoneNumber,VisitDate)
    VALUES('${FName}', '${LName}', '${Address}', '${DateOfBirth}', '${PhoneNumber}', '${VisitDate}')`

    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{
        console.log("error in POST /patient", err)
        res.status(500).send()
    })
})
})

app.get("/appointment", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT * 
    FROM appointment 
    LEFT JOIN patient 
    ON patient.patientPK = appointment.PatientFK`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
})
app.get("/appointment/:pk", (req, res)=>{
    var pk = req.params.pk
    //console.log("my PK:", pk)

    var myQuery = `SELECT * 
    FROM appointment 
    LEFT JOIN patient 
    ON patient.patientPK = appointment.PatientFK
    WHERE appointmentPK = ${pk}`

    db.executeQuery(myQuery)
    .then((appointment)=>{

       if(appointment[0]){
           res.send(appointment[0])
       }else{res.status(404).send('bad request')}
    })
    .catch((err)=>{
        console.log("Error in /appointment/pk", err)
        res.status(500).send()
    })
})

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)})