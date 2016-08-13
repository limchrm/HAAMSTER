'use strict';
var Botkit = require('botkit');
var config = require('./config.js');
var Firebase = require("firebase");


var myFirebaseRef = new Firebase(config.firebase_url);
var firebaseStorage = require('botkit-storage-firebase')({firebase_uri: config.firebase_url});

var controller = Botkit.slackbot({
  debug: false,
  // storage: firebaseStorage
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});


// connect the bot to a stream of messages
controller.spawn({
  token: config.slack_token
}).startRTM()

controller.hears('done (.*)',['direct_message'],function(bot,message) {
  var doneStuff = message.match[1]; //match[1] is the (.*) group. match[0] is the entire group (open the (.*) doors).
  
  bot.reply(message, doneStuff + ' 했니?');

 	myFirebaseRef.child('done-stuff').push({
 		text: doneStuff,
    createdAt: Date.now(),
 	});
});

function getItemByIndex(index) {
	return new Promise((resolve, reject) => {
	  myFirebaseRef.child('done-stuff')
		  .orderByChild('createdAt')
		  .once("value", function(snapshot) {
		  	let childIndex = -1;
		  	
		  	const found = snapshot.forEach(item => {
		  		if (++childIndex === index) {
		  			resolve(item);
		  			return true;
		  		}
		  	});
		  	
		  	if (!found) {
		  		return reject(new Error('뭐라구~? 혼밥 하는 찐따라 안 들리는데~?'));
		  	}
		  });
	});
}

// give the bot something to listen for.
controller.hears('(.*) 지워', ['direct_message','direct_mention','mention'], function(bot, message) {
  const keyNumber = message.match[1];

  getItemByIndex(keyNumber - 1)
    .then(item => {
    	return myFirebaseRef.child('done-stuff').child(item.key()).remove()
    	  .then(function () {
    	  	const val = item.val();
    	  	bot.reply(message, `ㅇㅋ ${val.text} 지움`);
    	  });
    })
	  .catch(function(error) {
	  	bot.reply(message, error.message);
	  	bot.reply(message, '다시 말해봐~');
	  });
});

controller.hears('오바마', ['direct_message','direct_mention','mention'], function(bot, message) {
  // Attach an asynchronous callback to read the data at our posts reference
  myFirebaseRef.child('done-stuff')
    .orderByChild('createdAt')
    .once("value", function(snapshot) {
    	const data = snapshot.val();
    	const result = Object.keys(data)
	    	.map(key => data[key]) // .map(function (key) { return data[key]; })
	    	.filter(item => item.createdAt) // .filter(function (item) { return item.createdAt; })
	    	.map((item, index) => `(${index + 1}) ${item.text}`);
      bot.reply(message, result.join('\n'));
	  });
});
