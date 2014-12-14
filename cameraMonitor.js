/*
	Script to monitor IP Camera
	Moves camera to different positions and saves snapshots by intervals

	Christopher Dudas <kristof.dudas@gmail.com>

	SDK taken from http://www.foscam.es/descarga/ipcam_cgi_sdk.pdf
 */

var httpRequest = require('http-request');
var async = require('async');

// TODO: Need http point so camera can send its "Alarm" when motion sensor signals


// Output directory
var OUTPUT_DIRECTORY = '/Users/chris/Desktop/Snapshots/';

// Url of the camera
var CAMERA_URL = 'http://192.168.1.21:1465';

// Object representing auth details - used by http-request 
var AUTH_OBJ = {type: 'basic', username: 'admin', password: ''};

// Endpoint to set the camera's position
var SET_POSITION_ENDPOINT = '/decoder_control.cgi';

// End point to take a snapshot
var SNAPSHOT_ENDPOINT = '/snapshot.cgi';

// How often to take snapshots
var ROUTINE_INTERVAL = 2 * 60 * 1000; // 2 minutes

// Delay between move command and snapshot to allow it time to move into position
var MOVE_SNAPSHOT_DELAY = 20 * 1000;

// Which 'position' to take snapshots of
// These are the command numbers for that position
var CAMERA_POSITIONS_MONITOR = [31, 33, 35];

// The position the camera should return to when idle
var CAMERA_END_POSITION = 33;

function doPatrol() {
	// Snapshots should be prefixed with timestamps in form YYYY-MM-DD HHMM
	var date = new Date();
	var filePrefix = OUTPUT_DIRECTORY + 
		date.getFullYear() + '-' + fill(date.getMonth()+1) + '-' + fill(date.getDate()) + 
		' ' + fill(date.getHours()) + fill(date.getMinutes()) + ' ';

	// go to each camera 'position' and take a snapshot
	async.eachSeries(CAMERA_POSITIONS_MONITOR, patrolPosition.bind(this, filePrefix), function(err) {
		if (err) { console.log('patrol error', err); }
		goToPosition(CAMERA_END_POSITION);
	});
}

function patrolPosition(filePrefix, position, callback) {
	goToPosition(position);

	// Delay the actual taking of the snapshot - give it time to move into position
	setTimeout(function() {
		// Take snapshot
		httpRequest.get(
			{ url:CAMERA_URL + SNAPSHOT_ENDPOINT, auth: AUTH_OBJ }, 
			filePrefix + position + '.jpg', callback
		);
	}, MOVE_SNAPSHOT_DELAY);
}

function goToPosition(position, callback) {
	httpRequest.get({ url:CAMERA_URL + SET_POSITION_ENDPOINT + '?command=' + position, auth: AUTH_OBJ }, function(err) {
		if (err) { console.log('Error on go to position', err); }
	});
}

function fill(str) {
	return ('00' + str).slice(-2);
}

doPatrol(); // Run immediatley
setInterval(doPatrol, ROUTINE_INTERVAL);
