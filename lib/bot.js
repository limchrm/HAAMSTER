'use strict';

var _botkit = require('botkit');

var _botkit2 = _interopRequireDefault(_botkit);

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _exception = require('./exception');

var _exception2 = _interopRequireDefault(_exception);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var controller = _botkit2.default.slackbot({ debug: false });

controller.spawn({
  token: process.env.HAAMSTER_SLACK_TOKEN
}).startRTM();

_firebase2.default.initializeApp({
  databaseURL: process.env.HAAMSTER_FIREBASE_URL
});

var myFirebaseRef = _firebase2.default.database().ref('done-stuff');

(0, _exception2.default)(controller);

var week = ['월', '화', '수', '목', '금', '토', '일'];

// Get done items by index
function getItemByIndex(userId, index) {
  return new Promise(function (resolve, reject) {
    myFirebaseRef.child(userId).orderByChild('createdAt').once('value', function (snapshot) {
      var childIndex = -1;

      var found = snapshot.forEach(function (item) {
        if (++childIndex === index) {
          resolve(item);
          return true;
        }

        return false;
      });

      if (!found) {
        reject(new Error('뭐라구~? 혼밥 하는 찐따라 안 들리는데~?'));
      }
    });
  });
}

// add a haam
controller.hears(['(.*) 함스터$', '^done (.*)'], ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  var doneStuff = message.match[1];
  var userId = message.user;

  bot.reply(message, doneStuff + ' 했니? :hamster:');

  myFirebaseRef.child(userId).push({
    text: doneStuff,
    createdAt: Date.now()
  });
});

// remove haams
controller.hears(['(.*) 처치$', '^rm (.*)'], ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  var keyNumber = message.match[1];
  var userId = message.user;

  if (['전원', 'all'].indexOf(keyNumber) !== -1) {
    myFirebaseRef.child(userId).remove().then(function () {
      bot.reply(message, '전원 처치 (+100) :gun::gun::gun:');
    });
    return;
  }

  getItemByIndex(userId, keyNumber - 1).then(function (item) {
    return myFirebaseRef.child(userId).child(item.key).remove().then(function () {
      var val = item.val();
      bot.reply(message, val.text + ' 처치 (+100) :gun:');
    });
  }).catch(function (error) {
    bot.reply(message, error.message);
  });
});

// show list of haams
controller.hears(['퇴근', '^람쥐$', '^ll$'], ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  // Attach an asynchronous callback to read the data at our posts reference
  var userId = message.user;
  var msg = message.match[0];

  bot.reply(message, ':squirrel:'); // 람쥐 센세

  myFirebaseRef.child(userId).orderByChild('createdAt').once('value', function (snapshot) {

    var data = snapshot.val();
    if (!data) {
      bot.reply(message, '고요를 체험하시오.');
      return;
    }

    var result = Object.keys(data).map(function (key) {
      return data[key];
    }) // .map(function (key) { return data[key]; })
    .filter(function (item) {
      return item.createdAt;
    }) // .filter(function (item) { return item.createdAt; })
    .map(function (item, index) {
      return index + 1 + ') ' + item.text;
    });

    if (msg == '퇴근') {
      var today = new Date();
      var todayMonth = today.getMonth();
      var todayDate = today.getDate();
      var todayDay = week[today.getDay()];
      var displayToday = '*' + todayMonth + '. ' + todayDate + '. ' + todayDay + '* \n';

      bot.reply(message, displayToday + result.join('\n'));
      return;
    }

    bot.reply(message, result.join('\n'));
  });
});