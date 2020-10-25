const { Autohook } = require('twitter-autohook');
let dotenv = require('dotenv').config();
var fs = require("fs");
const axios = require('axios');

function processResponse(event){
  //process incoming events
  var data = event;
  var text = data[0].message_create || '';
  var message = text.message_data.text
  var courseCode =  message.trim().substring(0,6).toUpperCase();
  var courseRep = text.sender_id;

  processBroadcast(courseRep, courseCode, message);
}

function processBroadcast(sender, courseCode, message) {
  //reading content of target.json
  var obj = JSON.parse(fs.readFileSync('target.json', 'utf8')); 

  // get specific numbers to send to
  if (obj[sender] != undefined || obj[sender] != false) {

    //if sender is autorized to send message
    (undefined === obj[sender][courseCode]) ? 
      displayError("Course code entered does not exist") :
      sendBroadcastSMS(courseCode, message, obj[sender][courseCode]);
      //sends messages to the specified phone numbers  
  }else{
    displayError("The sender "+ sender +" is not authorized to send messages")
  }
}

function sendBroadcastSMS(courseCode, message, phoneNumbers){
  //sends messages
  var msg = message.trim().substring(6)
  var url = "http://api.ebulksms.com:8080/sendsms?"+
      "username=EMAIL_ADDRESS_GOES_HERE"+
      "&apikey=API_KEY_GOES_HERE"+
      "&sender=NOT_"+courseCode+
      "&messagetext="+msg+
      "&flash=0&recipients="+phoneNumbers.toString();

  // Make a request for a user with a given ID
  axios.get(url)
    .then(function (response) {
      // handle success
      console.log(response);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
      console.log('anything else?')
    });
}

function displayError(errMsg){
  //displays error messages
  console.log(errMsg)
  return;
}


(async start => {
  try {
    const webhook = new Autohook();

    webhook.on('event', async event => {
      if (event.direct_message_events) {
        processResponse(event.direct_message_events);
      }
    });    
    
    // Removes existing webhooks
    await webhook.removeWebhooks();
    
    // Starts a server and adds a new webhook
    await webhook.start();
  
    // Subscribes to your own user's activity
    await webhook.subscribe({oauth_token: dotenv.parsed.TWITTER_ACCESS_TOKEN, oauth_token_secret: dotenv.parsed.TWITTER_ACCESS_TOKEN_SECRET});  
  } catch (e) {
    // Display the error and quit
    process.exit(1);
  }
})();  
