const express = require('express');
const dotenv = require('dotenv');
const hbs = require('hbs');

const app = express();
dotenv.config();

const routes = require('./routes.js');
app.use('/', routes);

app.set('view engine', 'hbs');

hbs.registerPartials(__dirname + '/views/partials');

port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.listen(port, function () {
	console.log('Server running at port: ' + port);
});