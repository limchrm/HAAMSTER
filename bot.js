'use strict';
const Botkit = require('botkit');
const Firebase = require("firebase");

const controller = Botkit.slackbot({ debug: false });
const myFirebaseRef = new Firebase( process.env.HAAMSTER_FIREBASE_URL );
const firebaseStorage = require('botkit-storage-firebase')({
  firebase_uri: process.env.HAAMSTER_FIREBASE_URL
});

controller.spawn({
  token: process.env.HAAMSTER_SLACK_TOKEN,
}).startRTM()

require('./exception.js')(controller);

// Get done items by index
function getItemByIndex(userId, index) {
	return new Promise((resolve, reject) => {
	  myFirebaseRef.child('done-stuff').child(userId)
		  .orderByChild('createdAt')
		  .once("value", function(snapshot) {
		  	let childIndex = -1;
		  	
		  	const found = snapshot.forEach(item => {
		  		if (++childIndex === index) {
		  			resolve(item);
		  			return true;
		  		}
		  	});
		  	
		  	if ( !found ) {
		  		return reject(new Error('뭐라구~? 혼밥 하는 찐따라 안 들리는데~?'));
		  	}
		  });
	});
}

// add a haam
controller.hears(['(.*) 함스터$', '^done (.*)'],['direct_message'],function(bot,message) {
  const doneStuff = message.match[1]; //match[1] is the (.*) group. match[0] is the entire group (open the (.*) doors).
  const userId = message.user;
  
  bot.reply(message, doneStuff + ' 했니? :hamster:');

 	myFirebaseRef.child('done-stuff').child(userId)
 	  .push({
	 		text: doneStuff,
	    createdAt: Date.now(),
	 	});
});

// remove haams
controller.hears(['(.*) 처치$', '^rm (.*)'], ['direct_message','direct_mention','mention'], function(bot, message) {
  const keyNumber = message.match[1];
	const userId = message.user;

  if ( ['전원', 'all'].indexOf(keyNumber) !== -1 ) {
  	myFirebaseRef.child('done-stuff').child(userId).remove()
  	  .then(() => {
      	bot.reply(message, `전원 처치 (+100) :gun::gun::gun:`);
  	  });
  	return;
  }

  getItemByIndex(userId, keyNumber - 1)
    .then(item => {
    	return myFirebaseRef.child('done-stuff').child(userId).child(item.key()).remove()
    	  .then(function () {
    	  	const val = item.val();
    	  	bot.reply(message, `${val.text} 처치 (+100) :gun:`);
    	  });
    })
	  .catch(function(error) {
	  	bot.reply(message, error.message);
	  });
});

// show list of haams
controller.hears(['^람쥐$', '^sqr$', '^ll$'], ['direct_message','direct_mention','mention'], function(bot, message) {
  // Attach an asynchronous callback to read the data at our posts reference
  const userId = message.user;
  bot.reply(message, ':squirrel:');
  myFirebaseRef.child('done-stuff').child(userId)
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
