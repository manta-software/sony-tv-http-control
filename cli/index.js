import chalk from 'chalk';
import figlet from 'figlet';
import clear from 'clear';
import inquirer from 'inquirer';
import fs from 'fs';
import {
  requestAccessControl,
  sendAuthorisation,
  sendSystemCommand,
  sendCommand
} from '../src/sony-tv-http-control';
import {discover} from '../src/sony-tv-discoverer';

clear();
console.log(chalk.yellow(figlet.textSync('Sony TV Http Control', {horizontalLayout: 'full'})));

function saveDevice({deviceName, host, cookie}) {
  const device = {
    name: deviceName,
    host: host,
    cookie: cookie
  };

  fs.writeFileSync(`./device-${deviceName}.json`, JSON.stringify(device));
}

function getSavedDevices() {
  return fs.readdirSync('.').filter((file) => file.startsWith('device-') && file.endsWith('.json'));
}

async function getAction() {
  const {action} = await inquirer.prompt(
      [
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?:',
          choices: [
            {name: 'Locate & Pair with TV', value: 'discover'},
            {name: 'Connect', value: 'connect'}
          ]
        }
      ]
  );

  return action;
}

async function askForDeviceName() {
  const {deviceName} = await inquirer.prompt([
    {
      name: 'deviceName',
      type: 'input',
      message: 'Enter a name for your TV',
      validate: function(value) {
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
  const {devicePin} = await inquirer.prompt([
    {
      name: 'devicePin',
      type: 'input',
      message: 'Enter the pin as shown on your TV'
    }
  ]);

  return devicePin;
}

async function confirm(message) {
  const {confirmed} = await inquirer.prompt([
    {
      name: 'confirmed',
      type: 'list',
      message: message,
      choices: [{name: 'yes', value: true}, {name: 'no', value: false}],
      default: true
    }
  ]);

  return confirmed;
}

async function askForCommand(commands) {
  const {command} = await inquirer.prompt(
      [
        {
          type: 'list',
          name: 'command',
          message: 'Enter a command',
          choices: commands
        }
      ],
  );

  return command;
}

async function onDiscovered(deviceName, device) {
  const confirmed = await confirm(`Would you like to pair with ${device.host}`);

  if (confirmed) {
    return pair(deviceName, device);
  }

  throw new Error(`ignoring ${device.host}`);
}

async function pair(deviceName, device) {
  const host = `${device.host}:${device.port}`;

  await requestAccessControl(host, deviceName);

  const devicePin = await askForDevicePairingPin();

  return sendAuthorisation(host, deviceName, devicePin)
    .then((response) => {
      saveDevice({deviceName, host, cookie: response});
      console.log('Successfully paired with your TV');
    })
    .catch((error) => {
      console.log('Failed to pair with your TV', error);
    });
}

async function findTv() {
  const deviceName = await askForDeviceName();

  return discover((device) => {
    return onDiscovered(deviceName, device);
  });
}

async function selectDevice() {
  const {selectedDevice} = await inquirer.prompt([
    {
      name: 'selectedDevice',
      type: 'list',
      message: 'Select a device to connect to',
      choices: getSavedDevices().map((device) => ({name: device, value: device}))
    }
  ]);

  return JSON.parse(fs.readFileSync(`./${selectedDevice}`));
}

async function connectTv() {
  const deviceInfo = await selectDevice();

  const host = deviceInfo.host;
  const {result} = await sendSystemCommand(host);
  const command = await askForCommand(result[1]);
  const response = await sendCommand(deviceInfo.host, command, deviceInfo.cookie);

  return response;
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

getAction().then((action) => {
  switch (action) {
    case 'discover':
      return findTv();
    case 'connect':
      return connectTv();
    default:
      console.log('Unknown action:', action);
  }
});
