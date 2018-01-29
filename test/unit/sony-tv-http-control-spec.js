import nock from 'nock';
import {requestAccessControl, sendAuthorisation, sendSystemCommand, sendCommand} from '../../src/sony-tv-http-control';
import {getAccessControlPayload, getPayload} from '../../src/utils/sony-tv-request-payload';

jest.mock('../../src/utils/sony-tv-request-payload');

describe('Sony TV Http Control Test Suite', function() {
  const HOST = 'unit-test-host';
  const CLIENT_ID = 'unit-test-client-id';
  const TEST_BODY = 'unit-test-body';

  describe('Request access control', () => {
    beforeEach(() => {
      getAccessControlPayload.mockImplementation((clientId) => clientId === CLIENT_ID ? TEST_BODY : null);
    });

    it('will post a request to the tv to access control and resolves with the response', () => {
      const expectedResponse = 'success';

      nock(`http://${HOST}/sony/accessControl`)
        .post('', (body) => body === TEST_BODY)
        .reply(200, expectedResponse);

      expect.assertions(1);
      return requestAccessControl(HOST, CLIENT_ID)
        .then((response) => expect(response.body).toBe(expectedResponse));
    });

    it('will reject with error when tv responded with an error', () => {
      const expectedResponse = new Error('unit-test-error');

      nock(`http://${HOST}/sony/accessControl`)
        .post('', (body) => body === TEST_BODY)
        .replyWithError(expectedResponse);

      expect.assertions(1);
      return requestAccessControl(HOST, CLIENT_ID)
        .catch((error) => expect(error).toEqual(expectedResponse));
    });
  });

  describe('Sending authorisation', () => {
    const PASSCODE = 'unit-test-passcode';

    beforeEach(() => {
      getAccessControlPayload.mockImplementation((clientId) => clientId === CLIENT_ID ? TEST_BODY : null);
    });

    it('will post a request to the tv with authorisation code and resolves with the response', () => {
      const expectedResponse = 'success';
      const expectedAuthCookie = ['auth=unit-test-auth-cookie'];
      const responseHeaders = {
        'set-cookie': expectedAuthCookie
      };

      nock(`http://${HOST}/sony/accessControl`)
        .post('', (body) => body === TEST_BODY)
        .basicAuth({
          user: '',
          pass: PASSCODE
        })
        .reply(200, expectedResponse, responseHeaders);

      expect.assertions(1);
      return sendAuthorisation(HOST, CLIENT_ID, PASSCODE)
        .then((response) => expect(response).toBe(expectedAuthCookie[0]));
    });

    it('will reject with error when tv responded with an error', () => {
      const expectedResponse = new Error('unit-test-error');

      nock(`http://${HOST}/sony/accessControl`)
        .post('', (body) => body === TEST_BODY)
        .basicAuth({
          user: '',
          pass: PASSCODE
        })
        .replyWithError(expectedResponse);

      expect.assertions(1);
      return sendAuthorisation(HOST, CLIENT_ID, PASSCODE)
        .catch((error) => expect(error).toBe(expectedResponse));
    });
  });

  describe('Send system command', () => {
    it('will post system command and parse the JSON response', () => {
      const expectedResponse = {
        result: [
        ]
      };

      nock(`http://${HOST}/sony/system`)
        .post('')
        .reply(200, JSON.stringify(expectedResponse));

      expect.assertions(1);
      return sendSystemCommand(HOST)
        .then((response) => expect(response).toEqual(expectedResponse));
    });

    it('will reject with error when tv responded with an error', () => {
      const expectedResponse = new Error('unit-test-error');

      nock(`http://${HOST}/sony/system`)
        .post('')
        .replyWithError(expectedResponse);

      expect.assertions(1);
      return sendSystemCommand(HOST)
        .catch((error) => expect(error).toBe(expectedResponse));
    });
  });

  describe('Send command', () => {
    const COMMAND_CODE = 'unit-test-command-code';
    const COOKIE = 'unit-test-cookies';

    beforeEach(() => {
      getPayload.mockImplementation((commandCode) => commandCode === COMMAND_CODE ? TEST_BODY : null);
    });

    it('will post system command', () => {
      const expectedResponse = 'OK';

      nock(`http://${HOST}/sony/IRCC`, {
        reqheaders: {
          'Cookie': COOKIE
        }
      })
        .post('', (body) => body === TEST_BODY)
        .reply(200);

      expect.assertions(1);
      return sendCommand(HOST, COMMAND_CODE, COOKIE)
        .then((response) => expect(response).toEqual(expectedResponse));
    });

    it('will reject with error when tv responded with an error', () => {
      const expectedResponse = new Error('unit-test-error');

      nock(`http://${HOST}/sony/IRCC`, {
        reqheaders: {
          'Cookie': COOKIE
        }
      })
        .post('', (body) => body === TEST_BODY)
        .replyWithError(expectedResponse);

      expect.assertions(1);
      return sendCommand(HOST, COMMAND_CODE, COOKIE)
        .catch((error) => expect(error).toBe(expectedResponse));
    });
  });
});
