# Sony Android TV HTTP Control
Controls a Sony Android powered TV over HTTP

# Installation
Designed to be used in Node.js

`npm install sony-tv-http-control`

# Usage
## ES6

```
import {
  discover,
  requestAccessControl,
  sendAuthorisation,
  sendSystemCommand,
  sendCommand
} from 'sony-tv-http-control';

```

## Require
```
var sonyTvHttpControl = require('sony-tv-http-control');

sonyTvHttpControl.discover(processDevice);

sonyTvHttpControl.requestAccessControl(host, deviceName);

sonyTvHttpControl.sendAuthorisation(host, deviceName, devicePin);

sonyTvHttpControl.sendSystemCommand(host);

sonyTvHttpControl.sendCommand(host, command, cookie);
```

# CLI
Use the CLI to test the library.
You must ensure your device is on the same network as your Sony TV.
Requires [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) - which is normally bundled with NPM v5


To launch the CLI you need to clone this repo and then run.
```bash
git clone git@github.com:/manta-software/sony-tv-http-control
cd sony-tv-http-control
npm install
npm run cli
```
* Use `Locate & Pair with TV ` to look for a Sony TV on your network (using SSDP).
    * Your TV should be on as it will display the authorisation code you will need to enter in the CLI
    * When prompted for a name, enter any string, this will be stored on your TV when authorised
    * :warning: The CLI will store the authorisation cookie once it has been authorised with your TV.  This is necessary in order to connect to it again and send the commands.  Is is stored as a JSON file and prefixed with `device-{deviceName}`.
* Once you have successfully paired, you can use `Connect` to connect to your TV and send commands.


# API Reference
### discover
Uses SSDP (Simple Service Discovery Protocol) to locate Sony TVs on your network

`dicover(processDevice, [timeout]);`

* `processDevice` - function that will be called when a sony tv device has been found.
  * Will pass in an object with the following properties
      * `host` - [String] ip address the device in on, e.g. `http://192.168.0.6:80`
      * `port` - [String] the port of device is on
      * `friendlyName` - [String] name given to the device
      * `manufacturer` - [String] the manufacturer name
      * `manufacturerURL` - [String] URL of the manufacturer
      * `modelName` - [String] the model name
      * `UDN`- [String] the device UDN

* `timeout` - [Optional][Number] timeout in milliseconds.  Default is 1 minute (60000ms).

Return - Nothing

### requestAccessControl
Sends a request to your sony TV to request remote access to it.  This will prompt the TV to show a passcode, which you should use in `sendAuthorisation`. 

`requestAccessControl(host, clientId)`

* `host` - [String] ip address the device in on, e.g. http://192.168.0.6:80 
* `clientId` - [String] arbitary string to identify the remote client requesting the control.  Will be stored in the TV once authorised.

Return - [Promise] resolves with the response from the TV if successful, otherwise rejects with the error from the TV

### sendAuthorisation
Sends the authorisation code for the client used in the `requestAccessControl` to gain remote access.

`sendAuthorisation(host, clientId, passcode)`

* `host` - [String] ip address the device in on, e.g. http://192.168.0.6:80
* `clientId` - [String] the clientId used in the `requestAccessControl` call
* `passcode` - [String] the passcode as displayed on the TV

Return - [Promise] resolves with the auth cookies if successful, otherwise will reject with the error from the TV

### sendSystemCommand
Sends the System request to the TV to get a list of all the commands the TV will support

`sendSystemCommand(host)`

* `host` - [String] ip address the device in on, e.g. http://192.168.0.6:80

Return - [Promise] resolves with the response as a JSON object that will contain the supported commands, otherwise rejects with an error

### sendCommand
Sends a command request to the TV

`sendCommand(host, commandCode, cookies)`
* `host` - [String] ip address the device in on, e.g. http://192.168.0.6:80
* `commandCode` - [String] the command to send, e.g. `AAAAAQAAAAEAAAAVAw==`
* `cookies` - [String] cookies that will contain the authorisation value e.g. `auth=ABCD`

Return - [Promise] resolves with 'OK' if successful, otherwise will reject with the error from the TV

## References
https://openremote.github.io/archive-dotorg/forums/Sony%20TV%20HTTP%20control.html