var https = require("https");

var httpReq = {};
httpReq.doHttpQuery = function(options, next, data){
	var req = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (responseText) {
              	var responseObj = JSON.parse(responseText);
              	next(responseObj);
            });
        });
	if(data){
		req.write(data+"\n");
	}
    req.end();
}

module.exports = httpReq;