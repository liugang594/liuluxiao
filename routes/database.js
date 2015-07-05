var mongo = require("mongoose");
var db = mongo.createConnection('localhost', 'liuluxiao');

var memberSchema = mongo.Schema(
				{	name 	: { type : String }, 
					date 	: { type : String, index: true }, 
					valid 	: { type : Boolean }, 
					identity: { type : String, index: true }
				}
			);
var memberTable = db.model('badminton', memberSchema);
var memberOperators = {};

/*
* insert a record
* name, identity, date are required, valid is optional
*/
memberOperators.insert = function(data, callback){
	if(!data || !data.name || !data.identity || !data.date){
		throw '用户名、用户标识和活动日期不能为粉';
	}
	if(data.valid === null || data.valid == undefined){
		data.valid = true;
	}
	var newMember = new memberTable(data);
    newMember.save(callback);
};

/*
* get apply status of member, by using the member id or/and active date
*
*/
memberOperators.get = function(data, callback){
	if(!data || !data.identity){
		throw '用户标识不能为空';
	}
	memberTable.findOne(data, callback);
}

/*
* update member status
* identity is required
*
*/
memberOperators.update = function(data, callback){
	if(!data || !data.identity){
		throw '用户标识不能为空';
	}
	memberTable.update({identity : data.identity}, data, {}, callback );
}

/*
* remove member 
* identity and date are required
*
*/
memberOperators.remove = function(data, callback){
	if(!data || !data.identity || !data.date){
		throw '用户标识和日期不能为空';
	}
	memberTable.remove(data, callback );
}

memberOperators.findOneAndRemove = function(data, callback){
	if(!data || !data.identity || !data.date){
		throw '用户标识和日期不能为空';
	}
	memberTable.findOneAndRemove(data, callback );
}

//list all data by specifing date
memberOperators.list = function(data, callback){
	memberTable.find(data, callback);
}

memberOperators.histories = function(callback){
	memberTable.aggregate(
	 	{ $group: 
		 	{ _id: '$date', _count: { $sum: 1 } } 
		},
		function (err, docs) {
			if(err){
				console.log(err);
			}else{
				callback(docs);
			}
	 	}
	);
}

module.exports = memberOperators;

//test histories
// memberOperators.histories({}, function(data){
// 	console.log(data);
// });

//test insert
//memberOperators.insert({name: '刘刚', identity: 'liugang', valid: true, date : '20150626'}, function(err){
//	err?console.log("报名失败："+err):console.log("报名成功");
//})

//test get
//memberOperators.get({identity: 'liugang'}, function(err, docs){
//	err?console.log('查询失败：'+err):console.log(docs);
//});

//test update
// memberOperators.update({identity:'liugang', name:'ttt', date:'20150606', valid:false}, function(err, doc){
// 	err?console.log('更新失败：'+err):console.log(doc);
// })

//test list
// memberOperators.list({date: '20150606'}, function(err, docs){
// 	err?console.log('列举失败：'+err):console.log(docs);
// });



