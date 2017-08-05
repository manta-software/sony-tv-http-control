const SonyTvHttpControl = require('./index');

var sonyTvHttpControl = new SonyTvHttpControl('192.168.0.17');

sonyTvHttpControl.requestControl('cuong', '5186')
    .then((response) => {
        console.log('Success', response);
        process.exit();
    })
    .catch((error) => {
        console.log('Error', error);
        process.exit();
    });
