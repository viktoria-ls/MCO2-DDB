require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const mysqlConnection = require('./db_utils');

// express app instance
const app = express();

// routes
const routes = require('./routes.js');
app.use('/', routes);

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/controller', express.static('controllers'));
app.use('/favicon.ico', express.static('public/images/favicon.ico'));
app.use("/css",express.static("./node_modules/bootstrap/dist/css"));
app.use("/js",express.static("./node_modules/bootstrap/dist/js"));

// handlebars
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// server and database connection
const port = process.env.port || 3000;
mysqlConnection.connect((error) => {
	if(error)
		throw error;
	else {
		console.log('Connected to MySQL database.');
		app.listen(port, () => {
			console.log('Server running at port: ' + port + '.');
		});
	}
});

