/*var mongo = require("mongoose");
var db = mongo.createConnection('localhost', 'liuluxiao');

var schema = mongo.Schema({name : 'string'});
var user = db.model('laochen', schema);

var me = new user({name: 'liudsssgang'});
me.save(function(err){
	if(err)
		console.log(err);
        else
		console.log('success');
});

user.find({'name':'liugang'}, function(err, docs){
	console.log('search'+"  "+err+"  "+docs);
});*/
var moment = require("moment");
var now = moment().format("YYYY-MM-DD HH:mm:ss");
console.log(now);
console.log(moment().format("e"));

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

function alreadyApplied(userName){
	var today = moment();
        console.log(today.format("YYYY-MM-DD HH:mm:ss"));
        console.log(today.add(6, "days").format("YYYY-MM-DD HH:mm:ss"));
}
console.log(alreadyApplied("aa"));
console.log(canApply());
