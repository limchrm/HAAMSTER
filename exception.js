const _ = require('lodash');

const yorks = [
  '망스터', '좃스터', '좆스터',
	'씨발롬', '씨발놈', '씨발련', '씨발년', '시발롬', '시발놈', '시발년', '시발련',
	'ㅅㅂ', '시발', '씨발', 'sibal', '시부랄', '쉬벌', '씨펄', 'C Perl', '쉬펄', '쒸펄', '시벌', '씨벌',
	'ㅂㅅ', '병신', '비영신', '븅신', '피융신', '비융신',
	'개새끼', '개새', '개년',
	'상년', '쌍년', '썅년', '썅노무새끼',
	'지랄', '염병', '옘병', '존나', '줫나', '좆', '좃',
];

module.exports = (controller) => {
	
	// 서장님 찾기
	controller.hears([new RegExp(`(${yorks.join('|')})`, 'g')], ['direct_message'], function(bot, message) {
		const word = _.uniq(message.match).join('? ');

		bot.reply(message, `뭐 임마? ${word}?`);
		bot.reply(message, {
			attachments: [{
				title: '느그 서장 어딨어?',
				title_link: 'https://www.youtube.com/watch?v=ZZS4aNrUmD8',
				image_url: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRzRcgZ3m2XXsB61gBBJOE-oP6n3fh6Olx12edSW6MMHB_6PKCw'
			}]
		});
	});

	// 힐 안 주는 메르시
	controller.hears('힐', ['direct_message'], function(bot, message) {
		bot.reply(message, {
			username: '메르시',
			attachments: [{
				title: 'ㄴㄴ',
				image_url: 'http://cfile22.uf.tistory.com/image/27365245575108A532FCE6'
			}]
		});
	});

	// 갓스터
	controller.hears(['갓스터', '함스터갓'], ['direct_message'], function(bot, message) {
		bot.reply(message, 'https://www.youtube.com/watch?v=LA4CTzhrLu8');
	});
	
	controller.hears(['버피', 'Buffy', 'buffy'], ['direct_message'], function(bot, message) {
	bot.reply(message, {
		username: '버피 홍보대사',
		attachments: [
		{
			author_name: "PAWSONG",
			title: "Buffy the Voxel World",
			title_link: "https://buffy.run/",
      text: "Did you call me?",
			image_url: "https://media.giphy.com/media/3owyoTShGplI0MnEHK/giphy.gif",
		}
		]
	});
});

};
