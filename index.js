const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js')
const config = require('./config.js')
const auth = require('./middleware/authenticate')

//azurewebsites.net, colostate.edu
const app = express();
app.use(express.json())
app.use(cors())

app.post('doctor/logout', auth, (req,res)=>{
    var query = `UPDATE Doctor
    SET Token = NULL
    WHERE DoctorPK = ${req.doctor.DoctorPK}`

    db.executeQuery(query)
    .then(()=>{res.status(200).send()})
    .catch((error)=>{
        console.log("error on POST /doctor/logout", error)
        res.status(500).send()
    })
})

//const auth = async(req, res, next)=>{
    //console.log(req.header('Authorization'))
    //next()
//}

app.post("/procedure", auth, async (req,res)=>{
    try{
    var PatientFK = req.body.PatientFK;
    var ProcedureName = req.body.ProcedureName;
    var ProcedureDate = req.body.ProcedureDate;
    var Cost = req.body.Cost;

    if(!PatientFK || !ProcedureName || !ProcedureDate || !Cost){res.status(400).send("bad request")}
     ProcedureName = ProcedureName.replace("'","''")

    //console.log("here is the patient in /procedure", req.patient)
    //res.send("here is your response")

    let insertQuery = `INSERT INTO Procedure(ProcedureName, ProcedureDate, Cost, DoctorPK, PatientFK)
    OUTPUT inserted.PatientPK, inserted.ProcedureName, inserted.ProcedureDate, inserted.Cost, inserted.DoctorPK
    VALUES('${ProcedureName}','${ProcedureDate}','${Cost}','${PatientFK}', ${req.patient.PatientFK})`

    let insertedPatient = await dbexecuteQuery(insertQuery)
    //console.log(insertedPatient)
    res.status(201).send(insertedPatient[0])
}
    catch(error){
        console.log("error in POST /procedure", error);
        res.status(500).send()
    }
})

app.get('/doctor/me', auth, (req,res)=>{
    let DoctorPK = req.doctor.DoctorPK;
    res.send(req.doctor)
})

//app.patch("/doctor/:pk", auth, (req,res)=>{
 ///   let doctorPK = req.params.pk
    //make sure doctor can only enter information on patient

//app.delete("/doctor/:pk", auth, (req,res)=>{
    //    let doctorPK = req.params.pk
        //make sure doctor can only enter information on patient
//})

app.get("/", (req,res)=>{res.send("Hello world.")})

app.get("/hi",(req,res)=>{
    res.send("hello world")
})

app.post("/doctor/login", async (req,res)=>{
    console.log(req.body)

    var Email = req.body.Email;
    var Password = req.body.Password;

    if(!Email || !Password){
        return res.status(400).send("bad request")
    }

    //1. check that users email exists in database
    var query = `SELECT *
    FROM Doctor
    WHERE Email = '${Email}'`
    let result;

    try{
        result = await db.executeQuery(query);
    }catch(myError){
        console.log('error in /doctor/login:', myError)
        return res.status(500).send()
    }
    //console.log(result)

    if(!result[0]){return res.status(400).send('Invalid user credentials')}

    //2. check that password matches

    let user = result[0]
    //console.log(user)

    if(!bcrypt.compareSync(Password,user.Password)){
        console.log("invalid password");
        return res.status(400).send("Invalid user credentials")
    }

    //3. generate a token

    let token = jwt.sign({pk: user.DoctorPK}, config.jwt, {expiresIn: '60 minutes'})
    console.log(token)

    //4. save token in database and send token and user info back to user
    let setTokenQuery = `UPDATE Doctor
    SET Token = '${Token}'
    WHERE DoctorPK = ${user.DoctorPK}`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user: {
                FName: user.FName,
                LName: user.LName,
                Email: user.Email,
                DoctorPK: user.DoctorPK
            }
        })
    }
    catch(myError){
        console.log("error setting user token ", myError);
        res.status(500).send()
    }

    app.post("/doctor", async (req,res)=>{
        //res.send("creating user")
        console.log("request body", req.body)
        var FName = req.body.FName;
        var LName = req.body.LName;
        var Email = req.body.Email;
        var Password = req.body.Password;
    
        if(!FName || !LName || !Email || !Password){
            return res.status(400).send("bad request")
        }
    FName = FName.replace("'","''")
    LName = LName.replace("'","''")

    var EmailCheckQuery = `SELECT Email
    FROM Doctor
    WHERE Email = '${Email}'`

    var existingUser = await db.executeQuery(EmailCheckQuery)
    
    console.log("existing user", existingUser)
    if(existingUser[0]){
        return res.status(409).send('Please enter a different email.')
    }

    var hashedPassword = bcrypt.hashSync(Password)
    var insertQuery = `INSERT INTO Doctor(FName,LName,Email,Password)
    VALUES('${FName}', '${LName}', '${Email}', '${hashedPassword}')`

    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{
        console.log("error in POST /doctor", err)
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