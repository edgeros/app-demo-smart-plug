/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: main.js plug application.
 *
 * Author: Han.hui <hanhui@acoinfo.com>
 *
 */

const WebApp = require('webapp');
var Device = require('device');

/* Smart plug device */
var plug = undefined;

/* Smart plug devices */
var plugs = new Map();

/* WebApp */
var app = WebApp.createApp();

/*
 * Set static path
 */
app.use(WebApp.static('./public'));

/*
 * Select device
 */
app.post('/api/select/:devid', function(req, res) {
	plug = new Device();
	plug.request(req.params.devid, function(error) {
		if (error) {
			res.send({
				result: false,
				code: 50004,
				message: `您没有此设备权限！：${error.message}`
			});
			plug = undefined;

		} else {
			res.send({
				result: true,
				code: 20000,
				message: 'success'
			});
			plug.on('lost', plugRemove);
			plug.on('message', function(msg) {
				io.emit('plug-message', msg);
			});

			plug.send({ query: true, attrs: ['channel0'] }, function(error) {
				if (error) {
					console.error('Query plug error:', error.message);
				} else {
					console.log('Query plug Ok!');
				}
			}, 3);
		}
	});
});

/*
 * app start
 */
app.start();

/* Socket IO */
var io = require('socket.io')(
	app, {
		path: '/plug',
		serveClient: false,
		pingInterval: 10000,
		pingTimeout: 5000,
		cookie: false
	}
);

/*
 * Client connect & disconnect
 */
io.on('connection', function(sockio) {
	sockio.on('plug-control', function(msg) {
		if (plug && plug.devid) {
			console.log('Client send message:', JSON.stringify(msg));
			plug.send(msg, function(error) {
				if (error) {
					console.error('Send message to plug error:', error.message);
				}
			}, 3);
		} else {
			sockio.emit('plug-error', { code: 50002, error: '无效设备!' });
		}
	});

	sockio.on('plug-list', function(result) {
		let dev = [];
		plugs.forEach((plug) => {
			dev.push(plug);
		});
		result(dev);
	});
});

/*
 * Get All Smart plug device
 */
Device.list(true, function(error, list) {
	if (list) {
		list.forEach(function(dev) {
			Device.info(dev.devid, function(error, info) {
				if (info && 
					info.report.name === 'plug'  && info.report.model === 'port') {
					plugs.set(dev.devid, {
						devid: dev.devid, alias: dev.alias, report: info.report
					});
				}
			});
		});
	}
});

/*
 * Smart plug device lost
 */
Device.on('lost', function(devid) {
	if (plugs.has(devid)) {
		plugs.delete(devid);
		if (plug && plug.devid === devid) {
			plugRemove();
		}

		io.emit('plug-lost', devid);
	}
});

/*
 * Smart plug device join
 */
Device.on('join', function(devid, info) {
	if (info.report.name === 'plug' && info.report.model === 'port') {
		var devobj = {
			devid: devid, alias: info.alias, report: info.report
		};
		plugs.set(devid, devobj);
		io.emit('plug-join', devobj);
	}
});

/*
 * Smart plug query statistical data
 */
setInterval(function() {
	if (plug && plug.devid) {
		plug.send({ query: true, attrs: [] });
	}
}, 5000);

/*
 * Smart plug Remove
 */
function plugRemove() {
	if (plug) {
		plug.release();
		plug.removeAllListeners();
	}
}

/* Event loop */
require('iosched').forever();
