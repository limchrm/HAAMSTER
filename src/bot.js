import Botkit from 'botkit';
import firebase from 'firebase';
import handleException from './exception';

const controller = Botkit.slackbot({ debug: false });

controller.spawn({
  token: process.env.HAAMSTER_SLACK_TOKEN,
}).startRTM();

firebase.initializeApp({
  databaseURL: process.env.HAAMSTER_FIREBASE_URL,
});

const myFirebaseRef = firebase.database().ref('done-stuff');

handleException(controller);

const week = ['월', '화', '수', '목', '금', '토', '일'];

// Get done items by index
function getItemByIndex(userId, index) {
  return new Promise((resolve, reject) => {
    myFirebaseRef.child(userId)
      .orderByChild('createdAt')
      .once('value', (snapshot) => {
        let childIndex = -1;

        const found = snapshot.forEach(item => {
          if (++childIndex === index) {
            resolve(item);
            return true;
          }

          return false;
        });

        if ( !found ) {
          reject(new Error('뭐라구~? 혼밥 하는 찐따라 안 들리는데~?'));
        }
      });
  });
}

// add a haam
controller.hears(['(.*) 함스터$', '^done (.*)'], [
  'direct_message', 'direct_mention', 'mention',
], (bot, message) => {
  const doneStuff = message.match[1];
  const userId = message.user;

  bot.reply(message, `${doneStuff} 했니? :hamster:`);

  myFirebaseRef.child(userId)
    .push({
      text: doneStuff,
      createdAt: Date.now(),
    });
});

// remove haams
controller.hears(['(.*) 처치$', '^rm (.*)'], [
  'direct_message', 'direct_mention', 'mention',
], (bot, message) => {
  const keyNumber = message.match[1];
  const userId = message.user;

  if ( ['전원', 'all'].indexOf(keyNumber) !== -1 ) {
    myFirebaseRef.child(userId).remove()
      .then(() => {
        bot.reply(message, '전원 처치 (+100) :gun::gun::gun:');
      });
    return;
  }

  getItemByIndex(userId, keyNumber - 1)
    .then(item => {
      return myFirebaseRef.child(userId).child(item.key).remove()
        .then(() => {
          const val = item.val();
          bot.reply(message, `${val.text} 처치 (+100) :gun:`);
        });
    })
    .catch((error) => {
      bot.reply(message, error.message);
    });
});

// show list of haams
controller.hears(['퇴근', '^람쥐$', '^ll$'], [
  'direct_message', 'direct_mention', 'mention',
], (bot, message) => {
  // Attach an asynchronous callback to read the data at our posts reference
  const userId = message.user;
  const msg = message.match[0];

  bot.reply(message, ':squirrel:'); // 람쥐 센세

  myFirebaseRef.child(userId)
    .orderByChild('createdAt')
    .once('value', (snapshot) => {

      const data = snapshot.val();
      if ( !data ) {
        bot.reply(message, '고요를 체험하시오.');
        return;
      }

      const result = Object.keys(data)
        .map(key => data[key]) // .map(function (key) { return data[key]; })
        .filter(item => item.createdAt) // .filter(function (item) { return item.createdAt; })
        .map((item, index) => `${index + 1}) ${item.text}`);

      if ( msg == '퇴근' ) {
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();
        const todayDay = week[today.getDay()];
        const displayToday = `*${todayMonth}. ${todayDate}. ${todayDay}* \n`;

        bot.reply(message, displayToday + result.join('\n'));
        return;
      }

      bot.reply(message, result.join('\n'));
    });
});
