# EioT-Framework
 The EioT-Framework backend (Node.js Server and HTML Files)


This is the main repo for the EioT-Framework. It consists of a Node.js+Express+ejs stack.
The EioT-Framework will control all future modules. At this time it supports the EioT-Motionsensor and the EioT-Thermostat.

Features:
- Simple and structured Webinterface
- Works with custom modules (Simple API)
- IFTT-Webhook support
- Temperature and Humidity history for every thermostat icl. Charts of the last 30 entrys
- Easy to debug
- more to come....

# Disclaimer

This project is in work - there is no authentication yet nor a documentation.
Till now it is rather simple and much Spaghetti code :D

## Installation

Use the node package manager [npm](https://www.npmjs.com/package/npm) to install the package.

```bash
npm install eiot-framework
```

## Setup
Just change the secret.key and you are good to go.
Run the server with 

```bash
npm run devStart
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)

# Additional Info:
Use the EioT-Flasher for setting up the ESPs with the firmware of your choice:
https://github.com/clusterzx/EIoT-Flasher

Screenshot of GUI:
[![image.png](https://i.postimg.cc/wv4rhbQ9/image.png)](https://postimg.cc/r0WgTjHH)

[![image.png](https://i.postimg.cc/vTd0LF6F/image.png)](https://postimg.cc/2b2drtw2)
