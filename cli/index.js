import chalk from 'chalk';
import figlet from 'figlet';
import clear from 'clear';
import inquirer from 'inquirer';
import { SonyTvHttpControl, discover } from '../dist/sony-tv-http-control';

clear();
console.log(
	chalk.yellow(
		figlet.textSync('Sony TV Http Control', { horizontalLayout: 'full' })
	)
);

async function getAction() {
	const { action } = await inquirer.prompt(
		[
			{
				type: 'list',
				name: 'action',
				message: 'What would you like to do?:',
				choices: [
					{ name: 'Locate & Pair with TV', value: 'discover' },
					{ name: 'Connect', value: 'connect' }
				]
			}
		]
	);

	return action;
}

async function askForDeviceName() {
	const { deviceName } = await inquirer.prompt([
		{
			name: 'deviceName',
			type: 'input',
			message: 'Enter a name for your TV',
			validate: function( value ) {
				if (value.length) {
					return true;
				} else {
					return 'Please a name for your TV';
				}
			}
		}
	]);

	return deviceName;
}

async function askForDevicePairingPin() {
	const { devicePin } = await inquirer.prompt([
		{
			name: 'devicePin',
			type: 'input',
			message: 'Enter the pin as shown on your TV'
		}
	]);

	return devicePin;
}

async function askToPair(host) {
	const { pairWithHost } = await inquirer.prompt([
		{
			name: 'pairWithHost',
			type: 'list',
			message: `Would you like to pair with ${host}`,
			choices: [ { name: 'yes', value: true }, { name: 'no', value: false }],
			default: 'yes'
		}
	]);

	return pairWithHost;
}

async function onDiscovered(deviceName, device) {
	const pairWithHost = await askToPair(device.host);

	if (pairWithHost) {
		return pair(deviceName, device);
	}

	throw `ignoring ${device.host}`;
}

async function pair(deviceName, device) {
	const sonyTvHttpControl = new SonyTvHttpControl(`${device.host}:${device.port}`);

	sonyTvHttpControl.requestControl(deviceName);
	
	const devicePin = await askForDevicePairingPin();

	return sonyTvHttpControl.requestControl(deviceName, devicePin)
		.then(() => {
			console.log('Successfully paired with your TV');
		})
		.catch((error) => {
			console.log('Failed to par with your TV', error);
		});
}

async function findTv() {
	const deviceName = await askForDeviceName();

	discover((device) => {
		return onDiscovered(deviceName, device);
	});
}

getAction()
	.then((action) => {
		switch (action) {
			case 'discover':
					return findTv();
				break;
			default:
				console.log('Unknown action:', action);
		}
	});
