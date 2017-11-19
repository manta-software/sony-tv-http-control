import {expect} from './test-helpers';
import nock from 'nock';
import {SonyTvHttpControl} from '../../src/sony-tv-http-control';
import sonyTvCommands from '../../src/sony-tv-commands';

describe('Sony TV Http Control Test Suite', function() {
  const HOST = 'unit-test';

  let sonyTvHttpControl = null;

  beforeEach(function() {
    sonyTvHttpControl = new SonyTvHttpControl(HOST);
  });

  describe('Send command', function() {
    it('will post a request to the tv', function() {
      const aCommand = 'TvPower';
      const expectedCommandCode = sonyTvCommands[aCommand];
      const expectedResponse = 'success';

      nock(`http://${HOST}/sony/IRCC`).
          post('', (body) => body.includes(expectedCommandCode)).
          reply(200, expectedResponse);

      return expect(sonyTvHttpControl.sendCommand(aCommand)).
          to.
          eventually.
          equal(expectedResponse);
    });

    it('rejects with an error when command is unknown', function() {
      const aCommand = 'unknown';

      return expect(sonyTvHttpControl.sendCommand(aCommand)).
          to.
          be.
          rejectedWith(`unknown command: ${aCommand}`);
    });
  });
});
