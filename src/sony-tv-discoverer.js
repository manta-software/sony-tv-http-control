import {URL} from 'url';
import {Client as SsdpClient} from 'node-ssdp';
import {parseString as parseXml} from 'xml2js';
import request from 'request';
import {minutes} from './utils/units';

const SSDP_SERVICE_TYPE = 'urn:schemas-sony-com:service:IRCC:1';
// const SSDP_SERVICE_TYPE = 'ssdp:all';
const SSDP_DISCOVER_DEFAULT_TIMEOUT = minutes(1);

export function discover(processDevice, timeout = SSDP_DISCOVER_DEFAULT_TIMEOUT) {
  const ssdp = new SsdpClient();
  const timer = setTimeout(() => {
    ssdp.stop();
  }, timeout);

  ssdp.on('response', (headers, statusCode, data) => {
    if (statusCode === 200) {
      request.get(headers.LOCATION, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          parseXml(body, (err, result) => {
            if (!err) {
              const device = result.root.device[0];
              const service = device.serviceList[0].service.find((service) => service.serviceType[0] === SSDP_SERVICE_TYPE);

              if (service) {
                const api = new URL(service.controlURL[0]);

                processDevice({
                  host: api.host,
                  port: (api.port || '80'),
                  friendlyName: device.friendlyName[0],
                  manufacturer: device.manufacturer[0],
                  manufacturerURL: device.manufacturerURL[0],
                  modelName: device.modelName[0],
                  UDN: device.UDN[0]
                })
                  .then(() => {
                    ssdp.stop();
                    clearTimeout(timer);
                  })
                  .catch((err) => {
                    console.warn(`Failed to process: ${device.friendlyName[0]}`, err);
                  });
              }
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
