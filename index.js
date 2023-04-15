require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const { mysqlConnection } = require('./controllers/DatabaseController');

// express app instance
const app = express();

// middleware
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});
app.use(express.json());
app.use(express.static('public'));
app.use('/controller', express.static('controllers'));
app.use('/favicon.ico', express.static('public/images/favicon.ico'));
app.use("/css",express.static("./node_modules/bootstrap/dist/css"));
app.use("/js",express.static("./node_modules/bootstrap/dist/js"));

// routes
const routes = require('./routes/routes');
const crudRoutes = require('./routes/crudRoutes');
app.use('/', routes);
app.use('/api/', crudRoutes);

// handlebars
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// server and database connection
const port = process.env.port || 3000;
app.listen(port, () => {
	console.log('Server running at port: ' + port + '.');
});