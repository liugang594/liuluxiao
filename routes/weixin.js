var express = require('express');
var router = express.Router();
var wechat = require('wechat-enterprise');
var https = require("https");

var mongo = require("mongoose");
var db = mongo.createConnection('localhost', 'liuluxiao');

var memberSchema = mongo.Schema({name : 'string', date : 'string'});
var memberTable = db.model('badminton', memberSchema);

// signature    微信加密签名，signature结合了开发者填写的token参数和请求中的timestamp参数、nonce参数。
// timestamp    时间戳
// nonce        随机数
// echostr      随机字符串
//token : eckHIIvmoi03YK
//EncodingAESKey : CEuEdsnKg5S65bMw1f9tWPbFo4bcjcnYmkbmhkQugLP


var config = {
        token: 'eckHIIvmoi03YK',
        encodingAESKey: 'CEuEdsnKg5S65bMw1f9tWPbFo4bcjcnYmkbmhkQugLP',
        corpId: 'wx4ac672b2ce5632dc',
        corpsecret: '-7q3gszP1KeP6dK5gQ9fSVwoL9zwR6kEB1pWbKkqZua-Kgd4XRZ8Q1cW3xO-0GP-'
};


/* GET users listing. */
// router.get('/', function(req, res, next) {
//      var msg_signature = req.query.msg_signature;
//      var timestamp = req.query.timestamp;
//      var nonce = req.query.nonce;
//      var echostr = req.query.echostr;
//      var cryptor = new wechat(config, function(){
//              console.log("handler");
//      });
//      var s = cryptor.decrypt(echostr);

//      console.log(msg_signature);
//      console.log(timestamp);
//      console.log(nonce);
//      console.log(echostr);
//      console.log(cryptor);
//      console.log(s.message);

//      res.send(s.message);
// });

// 验证微信企业号是否有效
router.get('/', wechat(config, function (req, res, next) {
  console.log("验证微信企业号是否有效")
  res.writeHead(200);
  res.end('hello node api');
}));


// 请求access_token，请求路径格式如下
// https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wx4ac672b2ce5632dc&corpsecret=-7q3gszP1KeP6dK5gQ9fSVwoL9zwR6kEB1pWbKkqZua-Kgd4XRZ8Q1cW3xO-0GP-
var accessTokenValue = '';
var queryAccessTokenOptions = {
    hostname: 'qyapi.weixin.qq.com',
    port: 443,
    path: '/cgi-bin/gettoken?corpid='+config.corpId+'&corpsecret='+config.corpsecret,
    method: 'GET'
}

// 请求access_token
function queryAccessToken(){
        var accessTokenReq = https.request(queryAccessTokenOptions, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (responseText) {
                var responseObj = JSON.parse(responseText);
                console.log("获取access_token:"+responseObj.access_token);
                accessTokenValue = responseObj.access_token;
            });
        });
        accessTokenReq.end();
}
// 上来时先请求一次access_token
queryAccessToken();
//然后每隔7000秒重新请求
setInterval(queryAccessToken, 7000000);

//报名系统，微信端会传入当前请求的code，然后根据access_token和code去请求用户信息
router.get('/baoming/apply',function (req, res, next) {
  if(!canApply()){
    res.render('apply_disabled');
    return;
  }
  // res.writeHead(200);
  // console.log(req.query.code);
  queryCurrentUserBaseInfo(accessTokenValue, req.query.code, function(currentUserName, dateKey){
      checkUserAppliedStatus(currentUserName, function(isApplied){
            if(isApplied){
              res.render('already_applied', { name: currentUserName});
            }else{
              var me = new memberTable({name: currentUserName, date: dateKey});
              me.save(function(err){
                if(err)
                  console.log(err);
                else
                  console.log(currentUserName+' 报名成功');
              });

              res.render('baoming_apply', { name: currentUserName});
            }
      });
      
  });
  // res.end("hello world");
});


//得到当前用户的UserId
var currentUserInfoOptions = {
    hostname: 'qyapi.weixin.qq.com',
    port: 443,
    path: '/cgi-bin/user/getuserinfo?',
    method: 'GET'
};

function queryCurrentUserBaseInfo(accessToken, code, next){
        currentUserInfoOptions.path = '/cgi-bin/user/getuserinfo?access_token='+accessToken+'&code='+code ;
        var currentUserInfoReq = https.request(currentUserInfoOptions, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (responseText) {
              var responseObj = JSON.parse(responseText);
              var userId = responseObj.UserId;
              console.log("获取当前用户UserId:"+userId);
              queryCurrentUserDetailInfo(accessToken, userId, next);
            });
        });
        currentUserInfoReq.end();
}


//得到当前用户的详细信息
var userDetailInfoOptions = {
    hostname: 'qyapi.weixin.qq.com',
    port: 443,
    path: '/cgi-bin/user/get?',
    method: 'GET'
};

function queryCurrentUserDetailInfo(accessToken, userId, next){
        userDetailInfoOptions.path = '/cgi-bin/user/get?access_token='+accessToken+'&userid='+userId ;
        var userDetailInfoReq = https.request(userDetailInfoOptions, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (responseText) {
              var responseObj = JSON.parse(responseText);
              console.log("获取当前用户详细信息:"+responseText);
              next(responseObj.name);
//{"errcode":0,"errmsg":"ok","userid":"liugang","name":"刘刚","department":[1],"gender":"1","email":"liugang@ufenqi.com","weixinid":"liugang594","avatar":"http:\/\/shp.qpic.cn\/bizmp\/zp11meG1a1vgxGMIRl80icwaVMSMlhCSJoBrrF76MF6EShQGZGkSTTA\/","status":1,"extattr":{"attrs":[]}}
            });
        });
        userDetailInfoReq.end();

}

function canApply(){
      var today = moment();
      var currentDay = today.format('e');
      //apply is opening only on wednesday or thursday
      if(currentDay != 3 && currentDay != 4){
         return false;
      }
      var currentHour = today.format('H');
      //apply is opening between 3-9:00 to 4-19:00
      if(currentDay == 3 && currentHour < 9){
         return false;
      }
      if(currentDay == 4 && currentHour > 19){
         return false;
      }
      return true;
      
}

function checkUserAppliedStatus(userName, next){
  var today = moment();
  var currentDay = today.format('e');
  var dateKey = "";
  if(currentDay == 3){
    dateKey = today.add(1, "days").format("YYYYMMDD");
  }else if(currentDay == 4){
    dateKey = today.format("YYYYMMDD");
  }else{
    return；
  }
  memberTableuser.find({'name': userName, 'date' : dateKey}, function(err, docs){
     if(err || !docs){
       next(false, dateKey);
     }else{
       next(true, dateKey);
     }
  });
}

module.exports = router;
