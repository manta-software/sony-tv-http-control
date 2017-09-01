import fs from 'fs';
import request from 'request';
import sonyTvCommands from './sony-tv-commands';

const payload = fs.readFileSync('resources/sony-ircc-payload.xml').toString('utf8');

class SonyTvHttpControl {
	constructor(host) {
		this.host = host;

		this.baseRequest = request.defaults({
			baseUrl: `http://${host}/sony`,
			method: 'post',
			headers: {
				'Content-Type': 'text/xml',
				'SOAPAction': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"'
			}
		});
	}

	sendCommand(commandName) {
		const commandCode = sonyTvCommands[commandName];

		return new Promise((resolve, reject) => {
			if (!commandCode) {
				reject(`unknown command: ${commandName}`)
			}

			const commandPayload = payload.replace('{{commandCode}}', commandCode);

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
		return this.sendCommand('WakeUp');
	}

	powerOff() {
		return this.sendCommand('PowerOff');
	}
}

module.exports = SonyTvHttpControl;
