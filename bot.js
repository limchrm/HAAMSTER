'use strict';
var Botkit = require('botkit');
var Firebase = require("firebase");


var myFirebaseRef = new Firebase(process.env.HAAMSTER_FIREBASE_URL);
var firebaseStorage = require('botkit-storage-firebase')({
  firebase_uri: process.env.HAAMSTER_FIREBASE_URL,
});

var controller = Botkit.slackbot({
  debug: false,
  // storage: firebaseStorage
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});


// connect the bot to a stream of messages
controller.spawn({
  token: process.env.HAAMSTER_SLACK_TOKEN,
}).startRTM()

controller.hears('(.*) 함스터',['direct_message'],function(bot,message) {
  var doneStuff = message.match[1]; //match[1] is the (.*) group. match[0] is the entire group (open the (.*) doors).
  
  bot.reply(message, doneStuff + ' 했니? :hamster:');

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
controller.hears('(.*) 처치', ['direct_message','direct_mention','mention'], function(bot, message) {
  const keyNumber = message.match[1];

  if ( keyNumber == '전원' ) {
  	myFirebaseRef.child('done-stuff').remove()
  	  .then(() => {
      	bot.reply(message, `전원 처치 (+100) :gun::gun::gun:`);
  	  });
  	return;
  }

  getItemByIndex(keyNumber - 1)
    .then(item => {
    	return myFirebaseRef.child('done-stuff').child(item.key()).remove()
    	  .then(function () {
    	  	const val = item.val();
    	  	bot.reply(message, `${val.text} 처치 (+100) :gun:`);
    	  });
    })
	  .catch(function(error) {
	  	bot.reply(message, error.message);
	  });
});

controller.hears('람쥐', ['direct_message','direct_mention','mention'], function(bot, message) {
  // Attach an asynchronous callback to read the data at our posts reference
  bot.reply(message, ':squirrel:')
  myFirebaseRef.child('done-stuff')
    .orderByChild('createdAt')
    .once("value", function(snapshot) {
    	const data = snapshot.val();
    	if (!data) {
    		bot.reply(message, '고요를 체험하시오.');
    		return;
    	}

    	const result = Object.keys(data)
	    	.map(key => data[key]) // .map(function (key) { return data[key]; })
	    	.filter(item => item.createdAt) // .filter(function (item) { return item.createdAt; })
	    	.map((item, index) => `${index + 1}) ${item.text}`);
      bot.reply(message, result.join('\n'));
	  });
});
