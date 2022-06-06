const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const DB = require('better-sqlite3-helper');
app.set('view engine', 'ejs');
const got = require('got');

var secretkey_cfg = "1234567890";

// The first call creates the global instance with your settings
DB({
  path: 'db/esp.db', // this is the default
  readonly: false, // read only
  fileMustExist: false, // throw error if database not exists
  WAL: true, // automatically enable 'PRAGMA journal_mode = WAL'
  migrate: false
})
const fs = require('fs');
const { exit } = require('process');
const { timeStamp } = require('console');
const { type } = require('express/lib/response');
const secretkey = "";
fs.readFile('secretkey.key', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    exit();
  }
  console.log('Secret Key: ' + data);
});

// routes will go here

app.get('/client/:id', (req,res) => {
    res.status(200).send({
        'id' : req.params.id,
        'name' : 'Test',
        'online' : 'Yes'
    });
});

app.get('/', (req,res) => {
  console.log("Get Dashboard");
  var history = DB().query("SELECT name,temperature,humidity,timestamp FROM history");
  history = JSON.stringify(history);
  //console.log(history);
  var thermostate = DB().query("SELECT * FROM clients WHERE model = 'Thermostat'");
  var motionsensors = DB().query("SELECT * FROM clients WHERE model = 'Motionsensor'")
  //console.log(clients);
  res.render('index', {thermostate, motionsensors, history});
});

app.get('/settings', (req,res) => {
  var webhooks = DB().query("SELECT * FROM webhooks");
  res.status(200).render('settings', {webhooks});
});

app.get('/settings/addWebhook/:webhook/:catergory', (req,res) => {
  DB().insert('webhooks', {
    address: atob(req.params.webhook),
    category: req.params.catergory
  })
  res.status(200).send("Added Webhook");
});
app.get('/settings/deleteWebhook/:id', (req,res) => {
  DB().delete('webhooks', {
    id: req.params.id
  })
  res.status(200).send("Added Webhook");
});

app.get('/delete/:id', (req,res) => {
  DB().delete('clients', {id: req.params.id})
  res.status(200).send("DELETED!");
});


app.get('/loadHistory/:name', (req,res) => {
  console.log("Load History for Name: " + req.params.name);
  //("SELECT * FROM (SELECT temperature,humidity,timestamp FROM history WHERE name='" + req.params.name + "' ORDER BY timestamp DESC LIMIT 30) ORDER BY timestamp ASC;")
  var result = DB().query("SELECT * FROM (SELECT temperature,humidity,timestamp FROM history WHERE name='" + req.params.name + "' ORDER BY timestamp DESC LIMIT 30) ORDER BY timestamp ASC;")
  res.send(result);
});


app.post('/client/register', function(req, res) {
    const name = req.body.name;
    const secretkey = req.body.secretkey;
    const version = req.body.version;
    const temperature = req.body.temperature;
    const humidity = req.body.humidity;
    var ipaddress = req.ip;
    const model = req.body.model;

    if (ipaddress.substr(0, 7) == "::ffff:") {
      ipaddress = ipaddress.substr(7)
    }

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    var result = DB().queryFirstRow('SELECT * FROM clients WHERE name=?', req.body.name);

    if (result) {
        console.log('Client found')
        res.status(200).send({
            'id': result.id,
            'name': name,
            'version': version
          });
    } else {
      if (secretkey == secretkey_cfg) {
        console.log('No client found....register')
        DB().insert('clients', {
            name: name,
            version: version,
            model: model,
            temperature: temperature,
            humidity: humidity,
            armed: 0,
            ipaddress: ipaddress
          })
        res.status(200).send({
            action: 'insert',
            response: 'OK'
        })
        console.log('add to DB Name: ' + name) 
      } else {
        res.status(401).send({
          reason: 'Wrong secretkey'
        })
      }
    }
});


app.post('/client/update', function(req, res) {
  const name = req.body.name;
  const secretkey = req.body.secretkey;
  const model = req.body.model;
  const version = req.body.version;
  const temperature = req.body.temperature;
  const humidity = req.body.humidity;
  var ipaddress = req.ip;

  if (ipaddress.substr(0, 7) == "::ffff:") {
    ipaddress = ipaddress.substr(7)
  }

  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

  var result = DB().queryFirstRow('SELECT * FROM clients WHERE name=?', req.body.name);
  console.log(result);

  if (result) {
    if (secretkey == secretkey_cfg && model != "Motionsensor") {
      console.log('Client with ID' + result.id + " updated!");
      DB().update('clients', {
          name: name,
          model: model,
          version: version,
          temperature: temperature,
          humidity: humidity,
          ipaddress: ipaddress,
          lastseen: timestamp
        }, {
          id: result.id
        })
        console.log('Client with ID' + result.id + " stored in history chart!");
        DB().insert('history', {
            clientid: result.id,
            name: name,
            temperature: temperature,
            humidity: humidity,
          })
      res.status(200).send({
          action: 'update',
          response: 'OK'
      })
    } else {
      res.status(401).send({
        reason: 'Wrong secretkey'
      })
      console.log('Wrong secretkey for ID: ' + result.id);
    }
  }else{
    res.status(404).send({
      reason: 'Name not found'
    })
    console.log('Wrong secretkey for ID: ' + result.id);
  }

});

app.get('/alarm/motion/check/:name', function(req, res) {
  console.log("Load Arming status for: " + req.params.name);
  var result = DB().query("SELECT armed FROM clients WHERE name='" + req.params.name + "';")
  if(result[0]["armed"] == 0){
    res.status(200).send("unarmed");
  }else{
    res.status(200).send("armed");
  }
});

app.get('/alarm/motion/trigger/:name', function(req, res) {
  console.log("##############################################");
  console.log("Motion Alert triggered by: " + req.params.name);
  console.log("##############################################");
  DB().update('clients', {
    motion_status: 1
  }, {
    name: req.params.name
  });
  var result = DB().query("SELECT armed FROM clients WHERE name='" + req.params.name + "';")
  if(result[0]["armed"] == 1){
    var hooks = DB().query("SELECT * FROM webhooks WHERE category = 'motionsensor';")
    hooks.forEach(function(webhook){
      makeGet(webhook.address, req.params.name);
      console.log({url: webhook, args: req.params.name, type: "GET"});
    });
  }
});

app.get('/alarm/motion/disarm/:name', function(req, res) {
  console.log("##############################################");
  console.log("Motion Alert disarmed by: " + req.params.name);
  console.log("##############################################");
  DB().update('clients', {
    motion_status: 0
  }, {
    name: req.params.name
  });
});

app.get('/alarm/motion/setting/arm/:id', function(req, res) {
  console.log("##############################################");
  console.log("System armed with id: " + req.params.id);
  console.log("##############################################");
  DB().update('clients', {
    armed: 1
  }, {
    id: req.params.id
  });
  res.status(200).send("OK");
});

app.get('/alarm/motion/setting/disarm/:id', function(req, res) {
  console.log("##############################################");
  console.log("System Disarmed with id: " + req.params.id);
  console.log("##############################################");
  DB().update('clients', {
    armed: 0
  }, {
    id: req.params.id
  });
  res.status(200).send("OK");
});

async function makePost(address, name) {
  const { data } = await got
    .post(address, {
      json: {
        value: name,
      },
    });
}

async function makeGet(address, name) {
  const { data } = await got
    .get(address + "?value1=" + name);
}

app.listen(port);
console.log('Server started at http://localhost:' + port);