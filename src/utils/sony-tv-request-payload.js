export const getPayload = (commandCode) =>
    `<?xml version="1.0"?>
    <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
      <s:Body>
        <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
          <IRCCCode>${commandCode}</IRCCCode>
        </u:X_SendIRCC>
      </s:Body>
    </s:Envelope>`;

export const getAccessControlPayload = (clientId) =>
    ({
      id: 13,
      method: 'actRegister',
      version: '1.0',
      params: [
        {
          clientid: `${clientId}:1`,
          nickname: clientId
        },
        [
          {
            clientid: `${clientId}:1`,
            value: 'yes',
            nickname: clientId,
            function: 'WOL'
          }
        ]
      ]
    });
