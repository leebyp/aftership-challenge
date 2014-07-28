(function() {
	var fs = require('fs');
	var httpSync = require('http-sync');
	var path = require('path');
	var _ = require('underscore');
	var parseString = require('xml2js').parseString;
	var moment = require('moment');
	var cheerio = require('cheerio');

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

		// ====== USPS tracking ======//
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

			// add different methods of filtering of response here
			var trackFilter = {
				'checkpoint': checkpointFilter
			};

			// build url in options for request
			var options = {
				host: 'production.shippingapis.com',
				path: encodeURI('/ShippingAPI.dll?API=TrackV2&XML=<TrackFieldRequest USERID="' + config.usps.userID + '">' +
					'<TrackID ID="' + tracking_number +'"></TrackID></TrackFieldRequest>')
			};

			// synchronous request waits for response before function exits
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

		// ====== HKPOST tracking ======//
		this.hkpost = function(tracking_number) {
			
			var tracking_result = {}; // save your result to this object

			// build url in options for request
			var options = {
				host: '',
				path: encodeURI('' + tracking_number)
			};

			// synchronous request waits for response before function exits
			var request = httpSync.request(options);
			var response = request.end();

			var $ = cheerio.load(String(response.body));
			
			// do your job here
			return tracking_result;

		};

		// ====== DPD UK tracking ======//
		this.dpduk = function(tracking_number) {

			var tracking_result = {}; // save your result to this object

			var checkpointFilter = function (result, original) {
				result.checkpoints = result.checkpoints || [];
				_.each(original.trackingEvent, function (value) {
					var newCheckpoint = {
						country_name: value.trackingEventLocation,
						message: value.trackingEventStatus,
						checkpoint_time: value.trackingEventDate.substr(0, value.trackingEventDate.length-5)
					};
					result.checkpoints.unshift(newCheckpoint);
				});
			};

			// add different methods of filtering of response here
			var trackFilter = {
				'checkpoint': checkpointFilter
			};

			// build url in options for request
			var options = {
				host: 'www.dpd.co.uk',
				path: encodeURI('/esgServer/shipping/delivery/?parcelCode=' + tracking_number),
				headers: {
					// @NOTE hard-coded cookie manually taken from visiting site
					Cookie: 'JSESSIONID=D1999B46E39374208EC511F0A2C8CE9B; X-Mapping-fgaocaep=4E27DE0C6A06471462B93372B0027DF4; tracking=1416f490-15ff-11e4-82c7-df05111de652; __utma=43400944.811432482.1406514564.1406514564.1406514564.1; __utmb=43400944.11.9.1406514960850; __utmc=43400944; __utmz=43400944.1406514564.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)'
				}
			};

			// synchronous request waits for response before function exits
			var request = httpSync.request(options);
			var response = request.end();

			var track = JSON.parse(response.body).obj;

			trackFilter.checkpoint(tracking_result, track);

			// do your job here
			return tracking_result;

		};
	}

	module.exports = new Courier();
	// console.log(new Courier().usps('9405903699300184125060'));
	// console.log(new Courier().hkpost('CP889331175HK'));
	// console.log(new Courier().dpduk('15502370264989N'));
}());

