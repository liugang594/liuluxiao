var express = require('express');
var router = express.Router();
var wechat = require('wechat-enterprise');


// signature	微信加密签名，signature结合了开发者填写的token参数和请求中的timestamp参数、nonce参数。
// timestamp	时间戳
// nonce	随机数
// echostr	随机字符串
//token : eckHIIvmoi03YK
//EncodingAESKey : CEuEdsnKg5S65bMw1f9tWPbFo4bcjcnYmkbmhkQugLP


var config = {
	token: 'eckHIIvmoi03YK',
 	encodingAESKey: 'CEuEdsnKg5S65bMw1f9tWPbFo4bcjcnYmkbmhkQugLP',
  	corpId: 'wx4ac672b2ce5632dc'
};


/* GET users listing. */
// router.get('/', function(req, res, next) {
// 	var msg_signature = req.query.msg_signature;
// 	var timestamp = req.query.timestamp;
// 	var nonce = req.query.nonce;
// 	var echostr = req.query.echostr;
// 	var cryptor = new wechat(config, function(){
// 		console.log("handler");
// 	});
// 	var s = cryptor.decrypt(echostr);

// 	console.log(msg_signature);
// 	console.log(timestamp);
// 	console.log(nonce);
// 	console.log(echostr);
// 	console.log(cryptor);
// 	console.log(s.message);

// 	res.send(s.message);
// });

router.get('/', wechat(config, function (req, res, next) {
  res.writeHead(200);
  res.end('hello node api');
}));

router.get('/baoming/apply',function (req, res, next) {
  res.writeHead(200);
  console.log(req.params.code);
  res.end('hello node api');
  getUserInfo('', req.params.code);
});

var https = require("https");

var options = {
    hostname: 'qyapi.weixin.qq.com',
    port: 443,
    path: '/cgi-bin/user/getuserinfo?',
    method: 'GET'
};

function getUserInfo(accessToken, code){
	options.path = '/cgi-bin/user/getuserinfo?access_token='+accessToken+'&code='+code ;
	var req = https.request(options, function (res) {
	    console.log('STATUS: ' + res.statusCode);
	    console.log('HEADERS: ' + JSON.stringify(res.headers));
	    res.setEncoding('utf8');
	    res.on('data', function (chunk) {
	        console.log('BODY: ' + chunk);
	    });
	});
}

module.exports = router;
