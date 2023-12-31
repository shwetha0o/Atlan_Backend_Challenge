<!-- ![alt text](https://github.com/theSatvik/Atlan-Backend-Challenge/blob/main/media/atlan-logo.jpg "Atlan") -->



# Atlan-Backend-Challenge

## :bookmark_tabs: What’s In This Document

- [Task 1](#rocket-task-1)
- [Task 2](rocket-task-2)
- [Task 3](#rocket-task-3)
- [Task 4](#rocket-task-4)
- [Dependencies Used](#ballot_box-dependencies-used)
- [Thanks to Contributors and Sponsors](#purple_heart-thanks)

 

## :rocket: Task 1 (Great Task)
 ```shell
One of our clients wanted to search for slangs (in local language) for an answer to a text question
on the basis of cities (which was the answer to a different MCQ question).

Or 

Create a Middleware which should return slangs(in some other given language) of a word.

```
### Various Approches/ideas : -
1. **DataBase(SQL) approach :-** 
    - **We can create an API or a DataBase(SQL) to map the word(or Answer) to slangs in other languages**
     - Two DB Tables :
         
         A. TABLE wordlang
          
            | word_ID | word | lang |
            | :-----: | :-: | :-: |
            | 1       | "Awesome" |  "HI" |
            
          B. TABLE wordslang
          
          
            | lang_ID | word | slang |
            | :-----: | :-: | :-: |
            |  "HI"   | "Awesome" |  "Jhakaas" |
            
     Note :  To create such type of Database the number of records could be very high and hence throughput will not be as required.
     
2. **Translation API approach :-**
  - **We can use google translate API [Click to translate](https://translate.google.co.in/) to find slangs of the given word efficiently**
    - **Route to find slangs of a text/word in local language**
        - ```shell   
                 // Find slang in local/any language 
                   function findSlang(req, res, next) {
                       console.log(req.query);
                       try{
                           const text = await translate(req.query.word, req.query.lang);
                           // e.g. req.query.lang = 'hi' (Hindi) 
                           // req.query.word = "Awesome" (English - auto detection)
                           res.send(text); // Jhakaas
                       }
                       catch(err){
                           res.send(err.message); 
                       }
                       next();
                   };
             ```   
        -   Route (GET Method) :  ```shell  http://localhost:3000/getSlang  Params {lang : "hi",word : "awesome"}```
   
           
## :rocket: Task 2 
 ```shell
A market research agency wanted to validate responses coming in against a set of business rules 
(eg. monthly savings cannot be more than monthly income) and send the response back to the data collector 
to fix it when the rules generate a flag.

Or

Create a Middleware to validate responses and send back to data collector to fix invalid responses.

```
### Various Approches/ideas : -
1. **Middleware approach   :-** 
    - **Created a sample Postgres based relational database**
        - ```shell   
           CREATE DATABASE atlan;

            CREATE TABLE client_income_data(
                client_id SERIAL PRIMARY KEY,
                client_email VARCHAR(255),
                client_name VARCHAR(255), 
                income_per_annum FLOAT,
                savings_per_annum FLOAT,
                mobile_number VARCHAR(15)
            );   
         ```
    - **Route to validate while insertion**
        - ```shell   
                 // Validate data middleware sample
                 function validateData(req, res, next) {
                    const { income_per_annum, savings_per_annum, mobile_number } = req.body;
                     if (income_per_annum < savings_per_annum) {
                        res.send("Invalid Data Savings cannot be more than Income");
                    }
                    else if (isNaN(mobile_number)) {
                        res.send("Invalid mobile number, only digits are acceptable");
                    }
                    else if (mobile_number.length !== 10) {
                        res.send("Invalid mobile number, should be of 10 digits");
                    }
                    next();
                };
             ```   
        -   Route (POST Method) :  ```shell http://localhost:3000/validateNew ```
        -   ```shell  
                Route AJAX : 
               // Validate while insertion of a new client details 
                    app.post('/validateNew', validateData, async (req, res) => {
                        try {
                            const { client_email, client_name, income_per_annum, savings_per_annum, mobile_number } = req.body;
                            const newClient = await pool.query("INSERT INTO client_income_data(client_email,client_name,income_per_annum,savings_per_annum,mobile_number)       
                            VALUES($1,$2,$3,$4,$5) RETURNING *", [client_email, client_name, income_per_annum, savings_per_annum, mobile_number]);
                            res.json(newClient.rows[0]);
                        } catch (err) {
                            res.send(err.message);
                        }
                    });
             ```
    - **Route to validate All the records/responses  if missed to validate**    
        -   Route (GET method) :  ```shell http://localhost:3000/validateAll ```
        -   ```shell  
                Route AJAX : 
            // Validate all and send invalid data to data collector 
            app.get('/validateAll', async (req, res) => {
                try {
                    let inValidRows = await pool.query("SELECT * FROM client_income_data WHERE savings_per_annum > income_per_annum");
                    inValidRows = inValidRows.rows;
                    if(inValidRows.length === 0)
                    {
                        res.send("All records are Valid");
                    }
                    else {
                        res.send(inValidRows);
                    }
                } catch (err) {
                    console.log(err.message);
                }
            });
             ```
## :rocket: Task 3 
 ```shell
A very common need for organizations is wanting all their data onto Google Sheets, wherein they could
connect their CRM, and also generate graphs and charts offered by Sheets out of the box. In such cases,
each response to the form becomes a row in the sheet, and questions in the form become columns. 


Or

Create a Middleware to export data into sheets and download it.

```
### Various Approches/ideas : -
1. **Middleware approach   :-** 
    - **Using a SQLite database**
        - ```shell
            function fetchRecordsFromDatabase(callback) 
            {const db = new sqlite3.Database('students2.db');
            const query = "SELECT * FROM students";
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error("Error querying database:", err);
                    callback(err, null);
                    //The callback function receives err (an error object) and rows (an array of fetched rows).
                    db.close();
                    return;
                }
            callback(null, rows);
            db.close();
            });
            }

         ```
    - **Route to export and download **
        - ```shell   
                 app.get("/getCSV",(req, res) => {
                     myDatabaseRef.fetchRecordsFromDatabase((err, rows) => {
                         if (err) {
                             res.status(505).json({error: err, message:"oops! error occured" });
                             //eg: table name not found
                             //(OR) res.status(500).send('Internal Server Error');
                             return;
                        }
                     myConvertJSONToCSV(rows, res);
                    });
                });
             ```   
        -   Route (GET Method) :  ```shell http://localhost:3000/getCSV ```
       
## :rocket: Task 4 
 ```shell
A recent client partner wanted us to send an SMS to the customer whose details are
collected in the response as soon as the ingestion was complete reliably. The content
of the SMS consists of details of the customer, which were a part of the answers in 
the response. This customer was supposed to use this as a “receipt” for them having 
participated in the exercise


Or

Create a Middleware to send message to user/client after successfully recording a response.

```
### Various Approches/ideas : -
1. **Middleware approach  :-** 
    - **Using a SQLite Database**
        - ```shell   
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
                              from: "(sender's email Id)",
                              to: "(Give the receivers email id)",
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
 
         ```
    - **Route to send SMS using fast-two-sms library**
        - ```shell   
                // Send SMS middleware -
                async function SMS(req, res) {
                    emailSubject = req.body.subject;
                    emailMessage = req.body.message;
                    console.log("Email Subject: " + emailSubject);
                    console.log("Email Message: " + emailMessage);
                    //sending email
                    mySendEmail(emailSubject, emailMessage);
                    res.status(200).send("Email sent successfully!");
                    }
             ```   
        -   Route (POST Method) :  ```shell http://localhost:3000/sendmessage ```
       

## :ballot_box: Dependencies Used
 ```shell
   "dependencies": {
    "@google-cloud/translate": "^8.0.2",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "ejs": "^3.1.6",
    "express": "^4.17.1",
    "fs": "0.0.1-security",
    "google-translate-api": "^2.3.0",
    "json2csv": "^6.0.0-alpha.2",
    "nodemailer": "^6.9.7",
    "pg": "^8.6.0",
    "sqlite3": "^5.1.6",
    "translate": "^1.2.3",
    "translate-google": "^1.4.3"
  },
  "devDependencies": {
    "google-translate": "^3.0.0",
    "nodemon": "^2.0.12"
  }
   ```


## :purple_heart: Thanks
Thanks for all of your time for reviewing my project
