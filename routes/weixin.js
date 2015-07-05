var express = require('express');
var router = express.Router();
var wechat = require('wechat-enterprise');
var https = require("https");
var applier = require("./apply.js");
var database = require("./database.js");
var httpReq = require("./httpReq.js");

var QYWeiXinConfig = {
        token: 'eckHIIvmoi03YK',
        encodingAESKey: 'CEuEdsnKg5S65bMw1f9tWPbFo4bcjcnYmkbmhkQugLP',
        corpId: 'wx4ac672b2ce5632dc',
        corpsecret: '-7q3gszP1KeP6dK5gQ9fSVwoL9zwR6kEB1pWbKkqZua-Kgd4XRZ8Q1cW3xO-0GP-'
};

// 验证微信企业号是否有效
router.get('/', wechat(QYWeiXinConfig, function (req, res, next) {
            console.log("验证微信企业号是否有效")
            res.writeHead(200);
            res.end('liuluxiao');
        }
    )
);


// 请求access_token，请求路径格式如下
// https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=<corpid>&corpsecret=<corpsecret>
var accessTokenValue = '';
// 请求access_token
function queryAccessToken(){
    httpReq.doHttpQuery({
            hostname: 'qyapi.weixin.qq.com',
            port: 443,
            path: '/cgi-bin/gettoken?corpid='+QYWeiXinConfig.corpId+'&corpsecret='+QYWeiXinConfig.corpsecret,
            method: 'GET'
        }, 
        function(responseObj){
            accessTokenValue = responseObj.access_token;
            console.log("获取access_token: "+accessTokenValue);
            sendApplyActiveNotification();
        }
    )
}
// 上来时先请求一次access_token
queryAccessToken();
//然后每隔7000秒重新请求
setInterval(queryAccessToken, 7000000);

//报名系统，微信端会传入当前请求的code，然后根据access_token和code去请求用户信息
router.get('/baoming/apply',function (req, res, next) {
    //当前不是报名日期时，直接返回
    if(!applier.canApply()){
        res.render('apply_disabled');
        return;
    }
    //否则要先查询用户的信息
    queryCurrentUserBaseInfo(accessTokenValue, req.query.code, function(currentUserId, currentUserName){
        applier.checkUserAppliedStatus(currentUserId, function(isApplied, dateKey){
            //如果已经申请了，则直接返回
            if(isApplied){
                database.list({date : dateKey}, function(listErr, docs){
                    res.render('already_applied', { name: currentUserName, list : docs});
                });
            }else{
                database.insert({name: currentUserName, identity:currentUserId, date:dateKey, valid:true}, function(err, docs){
                    database.list({date : dateKey}, function(listErr, listDocs){
                        if(err){
                            res.render('baoming_apply', { err: true, msg : err, list : listDocs});
                        }else{
                            res.render('baoming_apply', { name: currentUserName, err : false, list : listDocs});
                        }
                    });
                });
            }
      });      
    }); 
});

//报名系统，微信端会传入当前请求的code，然后根据access_token和code去请求用户信息
router.get('/baoming/cancel',function (req, res, next) {
    //否则要先查询用户的信息
    queryCurrentUserBaseInfo(accessTokenValue, req.query.code, function(currentUserId, currentUserName){
        applier.checkUserAppliedStatus(currentUserId, function(isApplied, dateKey){
            //如果没有申请，则直接返回
            if(!isApplied){
                database.list({date : dateKey}, function(listErr, docs){
                    res.render('not_applied', { name: currentUserName, list : docs});
                });
            }else{
                database.findOneAndRemove({identity:currentUserId, date: dateKey}, function(err, doc){
                    database.list({date : dateKey}, function(listErr, docs){
                        if(err){
                            console.log("取消失败");
                            res.render('not_applied', { name: currentUserName, list : docs});
                        }else{
                            res.render('cancel_success', { name: currentUserName, list : docs}); 
                        }   
                    });                             
                });
            }
      });      
    }); 
});

//查看历史数据
router.get("/baoming/histories", function(req, res, next){
    database.histories(function(array){
        if(array){
            res.render('applied_histories', {list : array});
        }else{
            res.render('applied_histories', {list : {}});
        }
    })
});

//查看某次活动的报名情况
router.get("/baoming/history", function(req, res, next){
    var date = req.query.date;
    if(!date){
        res.send("没有指定日期");
    }
    database.list({date:date}, function(err, docs){
        if(err){
            res.send("查询失败")
        }else{
            res.render('history_data', {date:date, list : docs||{}});
        }
    })
});

//得到当前用户的UserId
function queryCurrentUserBaseInfo(accessToken, code, next){
    httpReq.doHttpQuery({
                hostname: 'qyapi.weixin.qq.com',
                port: 443,
                path: '/cgi-bin/user/getuserinfo?access_token='+accessToken+'&code='+code ,
                method: 'GET'
            },function(responseObj){
                var userId = responseObj.UserId;
                console.log("得到当前用户的UserId："+userId);
                queryCurrentUserDetailInfo(accessToken, userId, next);
            }
        );
}


//得到当前用户的详细信息
function queryCurrentUserDetailInfo(accessToken, userId, next){
    httpReq.doHttpQuery({
                hostname: 'qyapi.weixin.qq.com',
                port: 443,
                path: '/cgi-bin/user/get?access_token='+accessToken+'&userid='+userId,
                method: 'GET'
            },
            function(responseObj){
                console.log("得到当前用户的详细信息："+responseObj.name);
                next(responseObj.userid, responseObj.name);
            }
        );
}

//发送报名活动提醒
function sendApplyActiveNotification(){
    if(!applier.canSendApplyNotification()){
        //目前还不能发通知，返回
        return;
    }
    var content = JSON.stringify({
                       "touser": "@all",
                       "msgtype": "text",
                       "agentid": "3",
                       "text": {
                           "content": "记得报名哦" //中文长度受限，7个字
                       },
                       "safe":"0"
                    });
    httpReq.doHttpQuery({
                hostname: 'qyapi.weixin.qq.com',
                port: 443,
                path: '/cgi-bin/message/send?access_token='+accessTokenValue,
                method: 'POST',
                headers: {  
                    "Content-Type": 'application/x-www-form-urlencoded',  
                    "Content-Length": content.length  
                } 
            },
            function(responseObj){
                if(responseObj.errcode == 0){
                    console.log('发送报名活动提醒通知成功');
                }else{
                    console.log("发送报名活动提醒通知失败:"+responseObj.errmsg);
                }
            },
            content
        );
}

module.exports = router;
