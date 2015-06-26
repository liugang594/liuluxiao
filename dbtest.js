var mongo = require("mongoose");
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
});
