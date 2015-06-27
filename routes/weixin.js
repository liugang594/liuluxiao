var express = require('express');
var router = express.Router();
var wechat = require('wechat-enterprise');
var https = require("https");
var moment = require("moment");
var mongo = require("mongoose");
var db = mongo.createConnection('localhost', 'liuluxiao');

var memberSchema = mongo.Schema({name : 'string', date : 'string', valid : 'boolean', identity: 'string'});
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
  queryCurrentUserBaseInfo(accessTokenValue, req.query.code, function(currentUserName){
      checkUserAppliedStatus(currentUserName, function(isApplied, dateKey){
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


var startDay = 5; //开始申请的星期日期（可能为周日）
//判断当前是否可申请
function canApply(){
      var today = moment();
      var currentDay = today.format('e'); //得到当前是星期几
      // 只有开始申请日和它的下一日可以申请
      if(currentDay != startDay && currentDay != startDay+1){
         return false;
      }
      var currentHour = today.format('H');  //得到当前的小时
      // 从开始申请日的早9点到下一天的晚7点可申请
      if(currentDay == startDay && currentHour < 9){
         return false;
      }
      if(currentDay == startDay+1 && currentHour > 19){
         return false;
      }
      return true;
      
}

//检查用户是否已经申请
function checkUserAppliedStatus(userName, next){
  var today = moment(); //得到当前时间
  var currentDay = today.format('e'); //得到当天
  var dateKey = "";       //数据库中以YYYYMMDD和用户名来唯一标记用户，其中日期为打球的那天
  if(currentDay == startDay){
    dateKey = today.add(1, "days").format("YYYYMMDD"); //如果是打球的前一天，则日期加1
  }else if(currentDay == startDay+1){
    dateKey = today.format("YYYYMMDD");   //如果是打球那天，则使用当前日期
  }else{
    return;   //如果不是这两天，则直接返回
  }
  memberTable.find({'name': userName, 'date' : dateKey}, function(err, docs){
     console.log(err+"   "+docs+"   "+(err || !docs));
     if(err || docs == ''){
       console.log("false");
       next(false, dateKey);
     }else{
       console.log("true");
       next(true, dateKey);
     }
  });
}

module.exports = router;
