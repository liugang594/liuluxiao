var express = require('express');
var router = express.Router();


// signature	微信加密签名，signature结合了开发者填写的token参数和请求中的timestamp参数、nonce参数。
// timestamp	时间戳
// nonce	随机数
// echostr	随机字符串


/* GET users listing. */
router.get('/', function(req, res, next) {
	console.log(req.params.signature);
	console.log(req.params.timestamp);
	console.log(req.params.nonce);
	console.log(req.params.echostr);
  res.send(req.params.echostr);
});

module.exports = router;
