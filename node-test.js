const SonyTvHttpControl = require('./dist/sony-tv-http-control');

var sonyTvHttpControl = new SonyTvHttpControl('192.168.0.17');

sonyTvHttpControl.requestControl('mac-pro', '3828')
    .then((response) => {
        console.log('Success', response);
        process.exit();
    })
    .catch((error) => {
        console.log('Error', error);
        process.exit();
    });
