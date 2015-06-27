var https = require("https");


var httpReq = {};
httpReq.doHttpQuery = function(options, next){
	var req = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (responseText) {
              	var responseObj = JSON.parse(responseText);
              	next(responseObj);
            });
        });
    req.end();
}

module.exports = httpReq;