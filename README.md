TechShares-UI
============

### Getting started

TechShares-UI depends on Node.js. While it should work using versions as old as 0.12.x, it is recommended to use v5.x.

On Ubuntu and OSX, the easiest way to install Node is to use the [Node Version Manager](https://github.com/creationix/nvm).
For Windows users there is [NVM-Windows](https://github.com/coreybutler/nvm-windows).

cd techshares-ui

Before launching the GUI you will need to install the npm packages for each subdirectory:
```
cd dl; npm install
cd ../web; npm install
```

Once all the packages have been installed you can start the development server by going to the ./web folder and running:
```
npm start
```

Once the compilation is done the GUI will be available in your browser at: localhost:8080. Hot Reloading is enabled so the browser will live update as you edit the source files.

## Production
If you'd like to host your own wallet somewhere, you should create a production build and host it using NGINX or Apache. In order to create a prod bundle, simply run the following command:
```
npm run build
```
This will create a bundle in the /dist folder that can be hosted with the web server of your choice.

## Contributing
TechShares-UI is open source and anyone is free to contribute. PR's are welcomed and will be reviewed in a timely manner, and long-term contributors will be given access to the repo.

