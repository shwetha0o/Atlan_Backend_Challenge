const { urlencoded } = require("express");
const express = require("express");
const fast2sms = require("fast-two-sms");
const app = express();
const cors = require("cors");
const pool = require("./SQL db/db");
const nodemailer = require("nodemailer");
const myDatabaseRef = require('./SQLite db/myDatabase')
var bodyParser = require('body-parser')
const { Translate } = require("@google-cloud/translate").v2;
const { Parser } = require("json2csv");
const fs = require("fs");
require("dotenv").config();
const port = 3000;


app.use("/public", express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// Middlewares
//setting up google translate api.
const translate = new Translate({
  projectId: process.env.projectId,
  keyFilename: "service-account.json",
});

// Find slang in local language - Task 1
async function findSlang(req, res, next) {
  console.log(req.query);
  try {
    const text = await translate.translate(req.query.word, req.query.lang);
    // e.g. req.query.lang = 'hi' (Hindi)
    // req.query.word = "Awesome" (English - auto detection)
    res.send(text); // Jhakaas
  } catch (err) {
    res.json({ message: err.message });
  }

  next();
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------//

// Validate data middleware - Task 2
function validateData(req, res, next) {
  const { income_per_annum, savings_per_annum, mobile_number } = req.body;

  if (income_per_annum < savings_per_annum) {
    res.send("Invalid Data Savings cannot be more than Income");
  } else if (isNaN(mobile_number)) {
    res.send("Invalid mobile number, only digits are acceptable");
  } else if (mobile_number.length !== 10) {
    res.send("Invalid mobile number, should be of 10 digits");
  }
  next();
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------//

// download in google sheets - Task 3
function myConvertJSONToCSV(jsonDataRecords, res) {
  try {
    const parser = new Parser();
    const csv = parser.parse(jsonDataRecords);

    const filePath = "myCSVrecords1.csv";

    fs.writeFile(filePath, csv, (err) => {
      if (err) {
        console.error("Error writing CSV file:", err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      console.log("CSV file created:", filePath);

      res.download(filePath, "sitabuldi.csv", (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({ error: "Internal Server Error" });
        } else {
          // Delete the file after sending to the client for download
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            } else {
              console.log("File deleted:", filePath);
            }
          });
        }
      });
    });
  } catch (err) {
    console.error("Error converting to CSV:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------//

// Send SMS middleware - task 4
async function SMS(req, res) {
  emailSubject = req.body.subject;
  emailMessage = req.body.message;

  console.log("Email Subject: " + emailSubject);
  console.log("Email Message: " + emailMessage);

  //sending email
  mySendEmail(emailSubject, emailMessage);

  res.status(200).send("Email sent successfully!");
}

function mySendEmail(emailSubject, emailMessage) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    //it means that the connection will be initiated using SSL/TLS encryption.
    auth: {
      user: "shwethamanaswini1369@gmail.com",
      pass: "fpymfhufkcmqoyhq",
    },
    tls: {
      rejectUnauthorized: false,
      //used to bypass SSL certificate verification, especially in testing or development environments where self-signed certificates might be used.
    },
  });

  const mailOptions = {
    from: "shwethamanaswini1369@gmail.com",
    to: "bvraju.itp@gmail.com",
    subject: emailSubject,
    text: emailMessage,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

//-----------------------------------------------------------------------END OF LOGIC-------------------------------------------------------------------------------//

//--------------------------------------------------------------------------Routes------------------------------------------------------------------------------------//

// Find slang in local language - task 1
app.get("/getSlang", findSlang, (req, res) => {});

//----------------------------------------------------------------------------------------------------------------------------------------------------------//

// Validate while insertion of a new client details - task 2
app.post("/validateNew", validateData, async (req, res) => {
  try {
    const {
      client_email,
      client_name,
      income_per_annum,
      savings_per_annum,
      mobile_number,
    } = req.body;
    const newClient = await pool.query(
      "INSERT INTO client_income_data(client_email,client_name,income_per_annum,savings_per_annum,mobile_number) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [
        client_email,
        client_name,
        income_per_annum,
        savings_per_annum,
        mobile_number,
      ]
    );
    res.json(newClient.rows[0]);
  } catch (err) {
    res.send(err.message);
  }
});

// Validate all and send invalid data to data collector - task 2
app.get("/validateAll", async (req, res) => {
  try {
    let inValidRows = await pool.query(
      "SELECT * FROM client_income_data WHERE savings_per_annum > income_per_annum"
    );
    inValidRows = inValidRows.rows;
    if (inValidRows.length === 0) {
      res.send("All records are Valid");
    } else {
      res.send(inValidRows);
    }
  } catch (err) {
    console.log(err.message);
  }
});

//----------------------------------------------------------------------------------------------------------------------------------------------------------//

// Get data into csv - task 3
app.get("/getCSV",(req, res) => {
  myDatabaseRef.fetchRecordsFromDatabase((err, rows) => {
    if (err) {
      res.status(505).json({ error: err, message:"oops! error occured" });
      //eg: table name not found
      //(OR) res.status(500).send('Internal Server Error');
      return;
    }

    myConvertJSONToCSV(rows, res);
  });
});

//----------------------------------------------------------------------------------------------------------------------------------------------------------//

// Send Message after a response - task 4
app.post("/sendmessage", SMS, (req, res) => {});

app.get('/fetchRecords', function (req, res) {
  //Callback function (err, rows) is passed as an argument
  myDatabaseRef.fetchRecordsFromDatabase((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      //eg: table name not found
      return;
    }

    res.status(200).json(rows);
  });
})

//----------------------------------------------------------------------------------------------------------------------------------------------------------//
app.listen(port, () => {
  console.log(`Server is listening at port : ${port}`);
});
