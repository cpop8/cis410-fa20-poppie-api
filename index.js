const express = require('express')
const db = require('./dbConnectExec.js')

const app = express();
app.use(express.json())

app.get("/hi",(req,res)=>{
    res.send("hello world")
})

app.post("/patient", async (req,res)=>{
    res.send("creating user")
    console.log("request body", req.body)

    var FName = req.body.FName;
    var LName = req.body.LName;
    var Address = req.body.Address;
    var DateOfBirth = req.body.DateOfBirth;
    var PhoneNumber = req.body.PhoneNumber;
    var VisitDate = req.body.VisitDate;

    var DateOfBirthCheckQuery = `SELECT DateOfBirth
    FROM patient
    WHERE DateOfBirth = '${DateOfBirth}'`

    var existingUser = await db.executeQuery(DateOfBirthCheckQuery)
    
    console.log("existing user", existingUser)
    if(existingUser[0]){
        return res.status(409).send('Please enter a different Date of Birth.')
    }

    var insertQuery = `INSERT INTO patient(FName,LName,Address,DateOfBirth,PhoneNumber,VisitDate)
    VALUES('${FName}', '${LName}', '${Address}', '${DateOfBirth}', '${PhoneNumber}', '${VisitDate}')`

    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{
        console.log("error in POST /patient", err)
        res.status(500).send()
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
       // console.log("Movies: ", movies)

       if(appointment[0]){
           res.send(appointment[0])
       }else{res.status(404).send('bad request')}
    })
    .catch((err)=>{
        console.log("Error in /appointment/pk", err)
        res.status(500).send()
    })
})
app.listen(5000,()=>{console.log("app is running on port 5000")})