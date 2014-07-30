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
				date = hour ? date + ' ' + hour : date;
				return moment(date).format('YYYY-MM-DDTHH:mm:ss');
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
			
			// @NOTE more work can be done by working out the format of external sites, to get extra transit information
			var tracking_result = {}; // save your result to this object

			var parseTime = function (date, hour) {
				date = hour ? date + ' ' + hour : date;
				return moment(date).format('YYYY-MM-DDTHH:mm:ss');
			};

			var checkpointFilter = function (result, original) {
				result.checkpoints = result.checkpoints || [];
				var $ = cheerio.load(original.htmlString);
				var text = $('#clfContent').text().split(/[\n|\t|\r]/).filter(function (value) {
					return value;
				});

				var details = text[8].split(/(was\ |\ within|\ on\ )/);

				var newCheckpoint = {
					country_name: text[7].substr(14),
					message: details[2][0].toUpperCase() + details[2].substr(1, details[2].length-1) + '.',
					checkpoint_time: parseTime(details[6].substr(0, details[6].length-1))
				};
				result.checkpoints.push(newCheckpoint);
			};

			// add different methods of filtering of response here
			var trackFilter = {
				'checkpoint': checkpointFilter
			};

			// potentially adding in language information
			var currentLanguage = 'english';
			var languages = {
				simplified: 's_',
				traditional: 'c_',
				english: ''
			};

			// build url in options for request
			var options = {
				host: 'app3.hongkongpost.hk',
				path: encodeURI('/CGI/mt/' + languages[currentLanguage] + 'mtZresult.jsp?tracknbr=' + tracking_number)
			};

			// synchronous request waits for response before function exits
			var request = httpSync.request(options);
			var response = request.end();

			var track = {
				htmlString: String(response.body)
			};

			trackFilter.checkpoint(tracking_result, track);
			
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
					Cookie: config.dpduk.cookie
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
	// console.log(new Courier().hkpost('RC933607107HK'));
	// console.log(new Courier().dpduk('15502370264989N'));
}());

