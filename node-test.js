const { SonyTvHttpControl, discover } = require('./dist/sony-tv-http-control');

discover((device) => {
  console.log('device', device);
  return Promise.resolve();
});

// sonyTvHttpControl.requestControl('mac-pro', '3828')
//     .then((response) => {
//         console.log('Success', response);
//         process.exit();
//     })
//     .catch((error) => {
//         console.log('Error', error);
//         process.exit();
//     });
