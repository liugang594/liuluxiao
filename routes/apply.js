var moment = require("moment"); //日期包
var memberTable = require("./database.js"); //数据库操作

//得到下一个星期日期
function getNextDay(date){
	if(date == 6){
		return 0;  //星期日的序号为0，然后是1 2 3 4 5 6
	}
	return date+1;
}

var startDay = 3; //开始申请的星期日期（可能为周日）（活动的前一天）
var activeDay = getNextDay(startDay); // （活动的当天）

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
  	memberTable.get({'identity' : userId, 'date' : dateKey}, function(err, docs){
    	if(err || !docs || docs == ''){
       		next(false, dateKey);
     	}else{
       		next(true, dateKey);
     	}
  	});
}

/*
* 判断是否可以发送活动报名提醒
* 每次活动发送两条提醒
* 只有打球的前一天和打球当前的下午2到5点间会发送提醒
*/
applyHelper.canSendApplyNotification = function(){
    var today = moment();
    var currentDay = today.format('e'); //得到当前是星期几
    // 只有开始申请日和它的下一日可以申请
    if(currentDay != startDay && currentDay != activeDay){
        return false;
    }
    var currentHour = today.format('H');  //得到当前的小时
    // 下午2点到5点可发送
    if(currentHour > 14 && currentHour < 17){
        return true;
    }
    return false;  
}
module.exports = applyHelper;
