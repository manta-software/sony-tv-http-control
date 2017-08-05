const fs = require('fs');
const request  = require('request');
const sonyTvCommands  = require('./lib/sony-tv-commands');
const payload = fs.readFileSync('./lib/sony-ircc-payload.xml').toString('utf8');

class SonyTvHttpControl {
	constructor(host) {
		this.host = host;

		this.baseRequest = request.defaults({
			baseUrl: 'http://' + host + '/sony',
			method: 'post',
			headers: {
				'Content-Type': 'text/xml',
				'SOAPAction': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"'
			}
		});
	}


	sendCommand(command) {
		const commandPayload = payload.replace('{{command}}', command);

		return new Promise((resolve, reject) => {
			var opts = {
				body: commandPayload,
				uri: '/IRCC'
			};

			this.baseRequest(opts, (error, response, body) => {
				if (error) {
					reject(error);
				} else {
					resolve(body);
				}
			});
		});
	}

	requestControl(clientId, password) {
		return new Promise((resolve, reject) => {
				request({
					url: `http://${this.host}/sony/accessControl`,
					method: 'post',
					body: `{"id":13,"method":"actRegister","version":"1.0","params":[{"clientid":"${clientId}:1","nickname":"${clientId}"},[{"clientid":"${clientId}:1","value":"yes","nickname":"${clientId}","function":"WOL"}]]}`,
					sendImmediately: false
				}, (error, response, body) => {
					if (error) {
						reject(error);
					} else {
						resolve(body);
					}
				}).auth('', password);
		});
	}

	powerOn() {
		return this.sendCommand(sonyTvCommands['WakeUp']);
	}

	powerOff() {
		return this.sendCommand(sonyTvCommands['PowerOff']);
	}
}

module.exports = SonyTvHttpControl;
