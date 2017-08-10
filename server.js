require('dotenv').config();

process.env.ROOT = __dirname;

const path = require('path');
var webpack = require('webpack');
var express = require("express");
var config = require('./webpack.config');

const SocketServer = require('ws').Server;

const async = require("async");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

var app = express();
var compiler = webpack(config);

var bodyParser = require('body-parser');

// ------------------------------------------------------------ SERVER VARS ---------------------------------------------------------------------



// ------------------------------------------------------------ MISC FUNCTIONS --------------------------------------------------------------------




// ------------------------------------------------------------ MIDDLEWARE ---------------------------------------------------------------------


app.use(express.static(path.join(__dirname, 'public')));

app.use(require('webpack-dev-middleware')(compiler, {
  publicPath: config.output.publicPath,
  noInfo: true
}));

app.use(require('webpack-hot-middleware')(compiler));

app.use( bodyParser.json() );       
app.use(bodyParser.urlencoded({     
  extended: true
})); 


// ------------------------------------------------------------ WEBSOCKETS ----------------------------------------------------------------------

const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const wss = new SocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});


// ------------------------------------------------------------ ROUTES ---------------------------------------------------------------------------


var routes = require('./routes');

routes.get_start(app);
routes.get_stock(app);
routes.add_stock(app, wss);
routes.home(app);



// ------------------------------------------------------------ WEBSOCKETS LOOP -------------------------------------------------------------------

// Main server loop
setInterval(() => {

  async.each(wss.clients, function(client, callback) {
    client.send( JSON.stringify({
      time: new Date().toTimeString()
    }));
  });
    
}, 1000);


