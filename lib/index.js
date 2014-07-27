(function() {
	var fs = require('fs');
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
}());

