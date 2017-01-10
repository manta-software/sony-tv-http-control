'use strict';

var fs = require('fs');
var request = require('request');
var sonyTvCommands = require('./lib/sony-tv-commands');

function SonyTvHttpRemote (host, preSharedKey) {
    this._baseRequest = request.defaults({
        baseUrl: 'http://' + host + '/sony',
        method: 'post',
        headers: {
            'Content-Type': 'text/xml',
            'SOAPAction': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
            'X-Auth-PSK': preSharedKey
        }
    });

    this._payload = fs.readFileSync('./lib/sony-ircc-payload.xml').toString('utf8');
    
    this._sendCommand = function (command) {
        var payload = this._payload.replace('{{command}}', command);


        return new Promise((resolve, reject) => {
            var opts = {
                body: payload,
                uri: '/IRCC'
            };

            this._baseRequest(opts, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
    }
}

SonyTvHttpRemote.prototype.powerOn = function () {
    return this._sendCommand(sonyTvCommands['WakeUp']);
};

SonyTvHttpRemote.prototype.powerOff = function () {
    return this._sendCommand(sonyTvCommands['PowerOff']);
};

module.exports = SonyTvHttpRemote;
