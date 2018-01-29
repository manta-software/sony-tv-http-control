import request from 'request';
import {Client as SsdpClient} from 'node-ssdp';
import {minutes} from '../../src/utils/units';
import {discover} from '../../src/sony-tv-discoverer';
import {parseString as parseXml} from 'xml2js';

jest.mock('request');
jest.mock('node-ssdp');
jest.mock('xml2js');
jest.useFakeTimers();

const processDevice = jest.fn();

describe('Dicover', () => {
  const SSDP_SERVICE_TYPE = 'urn:schemas-sony-com:service:IRCC:1';
  const SSDP_SERVICE_TYPE_NON_SONY = 'urn:schemas-other-com:service:IRCC:1';
  const SSDP_DISCOVER_DEFAULT_TIMEOUT = minutes(1);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('will start the ssdp search', () => {
    discover();

    const mockSsdpClientInstance = SsdpClient.mock.instances[0];
    expect(mockSsdpClientInstance.search).toHaveBeenCalledWith(SSDP_SERVICE_TYPE);
    expect(mockSsdpClientInstance.search).toHaveBeenCalledTimes(1);
  });

  it('will stop the ssdp after default timeout has elapsed', () => {
    discover();

    jest.advanceTimersByTime(SSDP_DISCOVER_DEFAULT_TIMEOUT);

    const mockSsdpClientInstance = SsdpClient.mock.instances[0];
    expect(mockSsdpClientInstance.stop).toHaveBeenCalledTimes(1);
  });

  it('will stop the ssdp after provided timeout has elapsed', () => {
    const TIMEOUT = 123;

    discover(processDevice, TIMEOUT);

    jest.advanceTimersByTime(TIMEOUT);

    const mockSsdpClientInstance = SsdpClient.mock.instances[0];
    expect(mockSsdpClientInstance.stop).toHaveBeenCalledTimes(1);
  });

  describe('when a device has been discovered', () => {
    const DEVICE_HEADERS = {
      'LOCATION': 'unit-test-device-location'
    };
    const DEVICE_DATA = {
      address: 'unit-test-device-address'
    };

    it('attempts to fetch information about the device when it is a valid device', () => {
      discover();

      const mockSsdpClientInstance = SsdpClient.mock.instances[0];
      const onDeviceDiscovered = mockSsdpClientInstance.on.mock.calls[0][1];

      onDeviceDiscovered(DEVICE_HEADERS, 200, DEVICE_DATA);

      expect(request.get).toHaveBeenCalledTimes(1);
      expect(request.get).toHaveBeenCalledWith(DEVICE_HEADERS.LOCATION, expect.any(Function));
    });

    it('will not attempt to fetch information about the device when it is not a valid device', () => {
      discover();

      const mockSsdpClientInstance = SsdpClient.mock.instances[0];
      const onDeviceDiscovered = mockSsdpClientInstance.on.mock.calls[0][1];

      onDeviceDiscovered(DEVICE_HEADERS, 500, DEVICE_DATA);

      expect(request.get).not.toHaveBeenCalled();
    });

    describe('when details of the device have been fetched', () => {
      beforeEach(() => {
        discover(processDevice);

        const mockSsdpClientInstance = SsdpClient.mock.instances[0];
        const onDeviceDiscovered = mockSsdpClientInstance.on.mock.calls[0][1];

        onDeviceDiscovered(DEVICE_HEADERS, 200, DEVICE_DATA);
      });

      it('will parse the xml response when no error', () => {
        const onRequestGetCallback = request.get.mock.calls[0][1];
        const NO_ERROR = false;
        const RESPONSE_OK = {
          statusCode: 200
        };
        const BODY = '<xml></xml>';

        onRequestGetCallback(NO_ERROR, RESPONSE_OK, BODY);

        expect(parseXml).toHaveBeenCalledWith(BODY, expect.any(Function));
      });

      it('will not parse the xml when there is an error fetching the device information', () => {
        const onRequestGetCallback = request.get.mock.calls[0][1];
        const ERROR = true;
        const RESPONSE = {
          statusCode: 'dont care'
        };
        const BODY = '<xml></xml>';

        global.console = {warn: jest.fn()};
        onRequestGetCallback(ERROR, RESPONSE, BODY);

        expect(parseXml).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledTimes(1);
      });

      it('will not parse the xml when response is not 200', () => {
        const onRequestGetCallback = request.get.mock.calls[0][1];
        const NO_ERROR = false;
        const RESPONSE = {
          statusCode: 500
        };
        const BODY = '<xml></xml>';

        global.console = {warn: jest.fn()};
        onRequestGetCallback(NO_ERROR, RESPONSE, BODY);

        expect(parseXml).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledTimes(1);
      });

      describe('when device information has been parsed', () => {
        const HOST = '192.168.0.6';
        const ALT_PORT = '888';
        const friendlyName = 'KD-55X9005C';
        const manufacturer = 'Sony Corporation';
        const manufacturerURL = 'http://www.sony.net/';
        const modelName = 'KD-55X9005C';
        const udn = 'uuid:b997b471-f94e-46f9-b359-e495150c7de2';
        const serviceType = SSDP_SERVICE_TYPE;
        const controlURL = `http://${HOST}/sony/ircc`;
        const controlURLWithPort = `http://${HOST}:${ALT_PORT}/sony/ircc`;

        function buildDeviceResult({friendlyName, manufacturer, manufacturerURL, modelName, udn, serviceType, controlURL}) {
          return {
            root: {
              device: [
                {
                  friendlyName: [friendlyName],
                  manufacturer: [manufacturer],
                  manufacturerURL: [manufacturerURL],
                  modelName: [modelName],
                  UDN: [udn],
                  serviceList: [
                    {
                      service: [
                        {
                          serviceType: [
                            serviceType
                          ],
                          controlURL: [
                            controlURL
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          };
        }

        beforeEach(() => {
          const onRequestGetCallback = request.get.mock.calls[0][1];
          const NO_ERROR = false;
          const RESPONSE_OK = {
            statusCode: 200
          };
          const BODY = '<xml></xml>';

          onRequestGetCallback(NO_ERROR, RESPONSE_OK, BODY);
        });

        it('will process device when device is a sony tv', () => {
          const RESULT = buildDeviceResult({friendlyName, manufacturer, manufacturerURL, modelName, udn, serviceType, controlURL});
          const NO_ERROR = false;
          const onParsedXml = parseXml.mock.calls[0][1];

          processDevice.mockReturnValue(new Promise(() => {}));
          onParsedXml(NO_ERROR, RESULT);

          expect(processDevice).toHaveBeenCalledTimes(1);
          expect(processDevice).toHaveBeenCalledWith({
            host: HOST,
            port: '80',
            friendlyName,
            manufacturer,
            manufacturerURL,
            modelName,
            UDN: udn
          });
        });

        it('will process device when device is a sony tv on a specific port', () => {
          const RESULT = buildDeviceResult({friendlyName, manufacturer, manufacturerURL, modelName, udn, serviceType, controlURL: controlURLWithPort});
          const NO_ERROR = false;
          const onParsedXml = parseXml.mock.calls[0][1];

          processDevice.mockReturnValue(new Promise(() => {}));
          onParsedXml(NO_ERROR, RESULT);

          expect(processDevice).toHaveBeenCalledTimes(1);
          expect(processDevice).toHaveBeenCalledWith({
            host: `${HOST}:${ALT_PORT}`,
            port: ALT_PORT,
            friendlyName,
            manufacturer,
            manufacturerURL,
            modelName,
            UDN: udn
          });
        });

        it('will stop the ssdp and clear the timer when device has been processed', async () => {
          const RESULT = buildDeviceResult({friendlyName, manufacturer, manufacturerURL, modelName, udn, serviceType, controlURL});
          const NO_ERROR = false;
          const onParsedXml = parseXml.mock.calls[0][1];
          const mockSsdpClientInstance = SsdpClient.mock.instances[0];

          processDevice.mockReturnValue(Promise.resolve());
          onParsedXml(NO_ERROR, RESULT);

          await processDevice();

          expect(mockSsdpClientInstance.stop).toHaveBeenCalledTimes(1);
          expect(clearTimeout).toHaveBeenCalledTimes(1);
        });

        it('will not process the device if there was an error parsing the device information', () => {
          const ERROR = true;
          const onParsedXml = parseXml.mock.calls[0][1];

          onParsedXml(ERROR, {});

          expect(processDevice).not.toHaveBeenCalled();
          expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it('will not process the device if service is not a sony tv', () => {
          const RESULT = buildDeviceResult({friendlyName, manufacturer, manufacturerURL, modelName, udn, serviceType: SSDP_SERVICE_TYPE_NON_SONY, controlURL});
          const NO_ERROR = false;
          const onParsedXml = parseXml.mock.calls[0][1];

          onParsedXml(NO_ERROR, RESULT);

          expect(processDevice).not.toHaveBeenCalled();
        });

        it('will not stop ssdp or clear timers, but instead log an error when process device throws exception', async () => {
          const RESULT = buildDeviceResult({friendlyName, manufacturer, manufacturerURL, modelName, udn, serviceType, controlURL});
          const NO_ERROR = false;
          const onParsedXml = parseXml.mock.calls[0][1];
          const mockSsdpClientInstance = SsdpClient.mock.instances[0];

          processDevice.mockReturnValue(Promise.reject(new Error('unit-test-error')));
          onParsedXml(NO_ERROR, RESULT);

          expect.assertions(3);
          try {
            await processDevice();
          } catch (ignore) {
              expect(mockSsdpClientInstance.stop).not.toHaveBeenCalled();
              expect(clearTimeout).not.toHaveBeenCalled();
              expect(console.warn).toHaveBeenCalledTimes(1);
          }
        });
      });
    });
  });
});
