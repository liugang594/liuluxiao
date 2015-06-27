var moment = require("moment");
var memberTable = require("./database.js");

function getNextDay(date){
	if(date == 7){
		return 1;
	}
	return date+1;
}

var startDay = 5; //开始申请的星期日期（可能为周日）（活动的前一天）
var activeDay = getNextDay(startDay);  （活动的当天）

var applyHelper = {};

//判断当前是否可申请
applyHelper.canApply = function(){
      var today = moment();
      var currentDay = today.format('e'); //得到当前是星期几
      // 只有开始申请日和它的下一日可以申请
      if(currentDay != startDay && currentDay != activeDay){
         return false;
      }
      var currentHour = today.format('H');  //得到当前的小时
      // 从开始申请日的早9点到下一天的晚7点可申请
      if(currentDay == startDay && currentHour < 9){
         return false;
      }
      if(currentDay == activeDay && currentHour > 19){
         return false;
      }
      return true;
      
}

//检查用户是否已经申请
applyHelper.checkUserAppliedStatus=function(userId, next){
  var today = moment(); //得到当前时间
  var currentDay = today.format('e'); //得到当天是星期几
  var dateKey = "";       //数据库中以YYYYMMDD和用户名来唯一标记用户，其中日期为打球的那天
  if(currentDay == startDay){
    dateKey = today.add(1, "days").format("YYYYMMDD"); //如果是打球的前一天，则日期加1
  }else if(currentDay == activeDay){
    dateKey = today.format("YYYYMMDD");   //如果是打球那天，则使用当前日期
  }else{
    return;   //如果不是这两天，则直接返回
  }
  memberTable.get({identity: userId, date : dateKey}, function(err, docs){
     if(err || docs == ''){
       next(false, dateKey);
     }else{
       next(true, dateKey);
     }
  });
}

module.exports = applyHelper;