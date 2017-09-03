import { URL } from 'url';
import Promise from 'bluebird';
import fs from 'fs';
import request from 'request';
import sonyTvCommands from './sony-tv-commands';
import { Client as SsdpClient } from 'node-ssdp';
import { parseString as parseXml } from 'xml2js';

const payload = fs.readFileSync('resources/sony-ircc-payload.xml').toString('utf8');
const SSDP_SERVICE_TYPE = 'urn:schemas-sony-com:service:IRCC:1';
// const SSDP_SERVICE_TYPE = 'ssdp:all';

const SSDP_DISCOVER_TIMEOUT = 10000;

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

	discover(processDevice, timeout = SSDP_DISCOVER_TIMEOUT) {
		const ssdp = new SsdpClient();
		const timer = setTimeout(ssdp.stop, timeout);

		ssdp.on('response', (headers, statusCode, data) => {
			if (statusCode === 200) {
				request.get(headers.LOCATION, (error, response, body) => {
					if (!error && response.statusCode === 200) {
						parseXml(body, (err, result) => {
							if (!err) {
								const device = result.root.device[0];
								const service = device.serviceList[0].service
									.find(service => service.serviceType[0] === SSDP_SERVICE_TYPE);

								const api = new URL(service.controlURL[0]);
								console.log('processing', api);
								processDevice({
									host: api.host,
									port: (api.port || 80),
									friendlyName: device.friendlyName[0],
									manufacturer: device.manufacturer[0],
									manufacturerURL: device.manufacturerURL[0],
									modelName: device.modelName[0],
									UDN: device.UDN[0]
								})
									.then(() => ssdp.stop())
									.then(() => clearTimeout(timer))
									.catch((err) => {
										console.warn(`Failed to process: ${api}`, err);
									});
							} else {
								console.warn(`Failed to parse the response: ${err}.`);
							}
						});
					} else {
						console.warn(`Error for device ${data.address}, statusCode: ${response.statusCode}, error: ${error}, body: ${body}`);
					}
				});
			}
		});

		ssdp.search(SSDP_SERVICE_TYPE);
	}

	powerOn() {
		return this.sendCommand('WakeUp');
	}

	powerOff() {
		return this.sendCommand('PowerOff');
	}
}

module.exports = SonyTvHttpControl;
