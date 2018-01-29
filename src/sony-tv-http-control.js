import request from 'request';
import {getPayload, getAccessControlPayload} from './utils/sony-tv-request-payload';

function sendAccessControl(host, clientId, passcode) {
  return new Promise((resolve, reject) => {
    const opts = {
      url: `http://${host}/sony/accessControl`,
      method: 'post',
      json: true,
      body: getAccessControlPayload(clientId),
      sendImmediately: false
    };

    request(opts, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    }).auth('', passcode);
  });
}

export const requestAccessControl = (host, clientId) => {
  return sendAccessControl(host, clientId);
};

export const sendAuthorisation = (host, clientId, passcode) => {
  return sendAccessControl(host, clientId, passcode)
    .then((response) => {
      return response.headers['set-cookie'][0];
    });
};

export const sendSystemCommand = (host) => {
  return new Promise((resolve, reject) => {
    const opts = {
      url: `http://${host}/sony/system`,
      method: 'post',
      body: '{"id":20,"method":"getRemoteControllerInfo","version":"1.0","params":[]}'
    };

    request(opts, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
};

export const sendCommand = (host, commandCode, cookies) => {
  return new Promise((resolve, reject) => {
    const commandPayload = getPayload(commandCode);

    const opts = {
      url: `http://${host}/sony/IRCC`,
      method: 'post',
      body: commandPayload,
      headers: {
        'Content-Type': 'text/xml',
        'SOAPAction': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
        'Cookie': cookies // Cookie header is case-sensitive, otherwise Sony TV will reject it
      }
    };

    request(opts, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve('OK');
      }
    });
  });
};
