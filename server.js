const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const API_PORT = 23360;
const app = express();
//const path = require('path');
const bodyParser = require('body-parser');
// var basicAuth = require('basic-auth');
const { google } = require('googleapis')

const { OAuth2 } = google.auth
var eventIndex = 0;
const config = require('./config-db.js');
const url = `mongodb://${config.username}:${config.password}@${config.url}:${config.port}/${config.database}?authSource=admin`;
const client = new MongoClient(url, { useUnifiedTopology: true });
let calendarCollection = null; // store data about calendar
let mainCollection = null;  // store data except calendar
// let username;

// variable used in the function
let loginginUser = null


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Create a new instance of oAuth and set  Client ID & Client Secret for the calendar.
const oAuth2Client = new OAuth2(
  '582748277921-687tf2occnb5a5dd2b3t1g7binlshak7.apps.googleusercontent.com',
  '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'
)

// Call the setCredentials method and set our refresh token for the calendar.
oAuth2Client.setCredentials({
  refresh_token: '1//04pyLE2dmOxcgCgYIARAAGAQSNwF-L9IrjbImaMgieyLNIMNKgHc5jToxSj0YyqSQtdCusv8CfD-wue1WveK3jodyO3Sdtpyt-rA',
})

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

// const event = {
//   summary: 'Meet with Natalya',
//   colorId: 1
// }


const  VerifyRecord = function(json) {
  if (!json.hasOwnProperty('Username')){
    throw new Error("Missing Username");
}
  if (!json.hasOwnProperty('RecordDate')){
      throw new Error("Missing Date");
  }
  if (!json.hasOwnProperty('RecordType')){
      throw new Error("Missing Type");
  }
  if (!json.hasOwnProperty('distance')) {
      throw new Error("Missing Distance");
  }
  if (!json.hasOwnProperty('start')){
      throw new Error("Missing Start time");
  }
  if (!json.hasOwnProperty('end')){
      throw new Error("Missing end time");
  }
  
  return {Username: json.Username, Date: json.RecordDate, Type: json.RecordType, Distance: json.distance, start: json.start, end: json.end};
}

// addRecord endpoint
app.post("/Record/:username", function(req, res, next) {
    let username = req.params.username;
    console.log(username);

      let body = req.body;
      let Record = VerifyRecord(body);
      collection.insertOne(Record)
      .then(Record_jsn => {
          res.status(200).json(Record_jsn);
          console.log(Record_jsn);
      })
      .catch(err => {
      console.log(err);
      res.status(400).send({msg: `Could not add this Record`});
    });
})

// grab all records for the user
app.get("/Records/:username", function(req, res, next) {
  let username = req.params.username;
  // collection.find({}).toArray()
  
  mainCollection.aggregate([
      {$lookup:{
      from: "records",
      localField:"Username",
      foreignField:"Username",
      as:"personalRecords"
      }},
    {
      $unwind: "$personalRecords"
    }
  ]).toArray()
  .then(docs => {
    let Arr = [];
    for(let i of docs){
      
      if (username == i.Username){
        Arr.push(i)

      }
    }
    console.log(Arr);
    res.status(200).json(Arr);
  })
  .catch(err => {
      console.log(err);
      res.status(400).json({msg : `Could not find training records`});
  })
})

const  VerifyPerson = function(json) {
  if (!json.hasOwnProperty('name')){
      throw new Error("Missing name");
  }
  if (!json.hasOwnProperty('gender')){
      throw new Error("Missing gender");
  }
  if (!json.hasOwnProperty('city')) {
      throw new Error("Missing city");
  }
  if (!json.hasOwnProperty('birthDate')){
      throw new Error("Missing birth date");
  }
  if (!json.hasOwnProperty('pass')){
      throw new Error("Missing password");
  }
  return {Username:json.name, gender: json.gender, city: json.city, birthDate: json.birthDate, password: json.pass};
}


app.post('/register',function (req, res, next) {
  let body = req.body;    
  let peronalInfo = VerifyPerson(body);    
  mainCollection.findOne({Username:body.name})
  .then(result => {
    if (result) {
      res.status(400).send({msg:"this user name has been used,please change one."})

    } else {
      mainCollection.insertOne(peronalInfo)
      .then(info => {
        res.status(200).send({msg:"user created successfully."})

      })
      .catch(err => {
        console.log("could not add data.")
      })
    }
  })

 })


app.post('/login',function (req, res, next) {
  username = req.body.name;
  let inputedpassword = req.body.pass;

  mainCollection.findOne({Username: username})
  .then(logInfo => {
    console.log(logInfo);

    if(logInfo !== null) {
      loginginUser = username
      let password = logInfo.password
      console.log(password === inputedpassword);

      if (password === inputedpassword) {
        console.log("login successfully");
        res.status(200).json(logInfo);
      } else if(password !== inputedpassword) {
        res.status(400).send({msg:`password is not correct!`})
      }     
    } else {
      res.status(400).send({msg:`User does not exsit.`})
    }
  }).catch(err => {
    console.log("user" + err)
  })
})

app.post('/delete', function(req, res, next) {
  let index = req.body.index;
  console.log("delete " + index);

  // collection.deleteOne({i})
  collection.find({Username: loginginUser}).toArray()
  .then(finded => {
    console.log("findedd");
    // console.log(finded);
    // console.log(finded[index]);
    let id = finded[index]._id 
    console.log(id);
    collection.deleteOne({_id:id})

    res.status(200).send({msg: "successfully deleted one record"})
  }
  )

})





app.use(express.static('content'));

// initiate client
client.connect()
.then(conn => {
   
    collection = client.db().collection(config.collection);
    calendarCollection = client.db().collection(config.calendarCollection);
    mainCollection = client.db().collection(config.mainCollection);
    // users = client.db().collection(config.users);
    console.log("Connected!", conn.s.url.replace(/:([^:@]{1,})@/, ':****@')) 
})
.catch(err => { console.log(`Could not connect to ${url.replace(/:([^:@]{1,})@/, ':****@')}`, err);  throw err; })

// tell the server to listen on the given port and log a message to the console (so we can see our server is doing something!)
.then(() => app.listen(API_PORT, () => console.log(`Listening on localhost: ${API_PORT}`)))
.catch(err => console.log(`Could not start server`, err))