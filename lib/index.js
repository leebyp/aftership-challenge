(function() {
	var fs = require('fs');
	var httpSync = require('http-sync');
	var path = require('path');
	var _ = require('underscore');
	var parseString = require('xml2js').parseString;
	var moment = require('moment');
	var config;

	var exampleConf = path.resolve(__dirname, '../config.example.js');
	var conf = path.resolve(__dirname, '../config.js');

	// check for config file synchronously
	if (fs.existsSync(conf)) {
		config = require(conf).development;
	} else {
		config = require(exampleConf).development;
	}

	function Courier() {
		this.usps = function(tracking_number) {

			var tracking_result = {}; // save your result to this object

			var parseTime = function (date, hour) {
				return moment(date + ' ' + hour).format('YYYY-MM-DDThh:mm:ss');
			};

			var checkpointFilter = function (result, original) {
				result.checkpoints = result.checkpoints || [];
				var newCheckpoint = {
					country_name: original.summary.EventCountry[0],
					message: original.summary.Event[0],
					checkpoint_time: parseTime(original.summary.EventDate[0], original.summary.EventTime[0])
				};
				result.checkpoints.push(newCheckpoint);
			};

			var trackFilter = {
				'checkpoint': checkpointFilter
			};

			var options = {
				host: 'production.shippingapis.com',
				path: encodeURI('/ShippingAPI.dll?API=TrackV2&XML=<TrackFieldRequest USERID="' + config.usps.userID + '">' +
					'<TrackID ID="' + tracking_number +'"></TrackID></TrackFieldRequest>')
			};

			var request = httpSync.request(options);
			var response = request.end();
			parseString(response.body, function (err, result) {
				if (err) { console.log('Problem with parsing XML', err); }
				var track = {
					info: result.TrackResponse.TrackInfo[0].$,
					summary: result.TrackResponse.TrackInfo[0].TrackSummary[0],
					detail: result.TrackResponse.TrackInfo[0].TrackDetail
				};
				trackFilter.checkpoint(tracking_result, track);
			});

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
	console.log(new Courier().usps('9405903699300184125060'));
}());

