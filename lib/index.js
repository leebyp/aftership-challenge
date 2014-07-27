(function() {
	var fs = require('fs');
	var http = require('http');
	var config;

	// check for config file synchronously
	if (fs.existsSync('../config.js')) {
		config = require('../config.js').development;
	} else {
		config = require('../config.example.js').development;
	}

	function Courier() {
		this.usps = function(tracking_number) {
			var tracking_result = {}; // save your result to this object

			var options = {
				hostname: 'production.shippingapis.com',
				path: encodeURI('/ShippingAPI.dll?API=TrackV2&XML=<TrackFieldRequest USERID="' + config.usps.userID + '">' +
					'<TrackID ID="' + tracking_number +'"></TrackID></TrackFieldRequest>')
			};

			var req = http.request(options, function(res) {
				res.setEncoding('utf8');
				var completeResponse = '';
				res.on('data', function (chunk) {
					completeResponse += chunk;
				});
				res.on('end', function () {
					console.log(completeResponse);
				});
			}).on('error', function(err) {
				console.log('Problem with request: ' + err.message);
			});
			req.end();

			// do your job here
			return tracking_result;

		};

		this.hkpost = function(tracking_number) {
			var tracking_result = {}; // save your result to this object

			// do your job here
			return tracking_result;

		};

		this.dpduk = function(tracking_number) {
			var tracking_result = {}; // save your result to this object

			// do your job here
			return tracking_result;

		};
	}

	module.exports = new Courier();
	new Courier().usps('9405903699300184125060');
}());

