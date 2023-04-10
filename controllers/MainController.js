const mysqlConnection = require('../db_utils');

const MainController = {
    getIndex: function(req, res) {
        console.log("Sending index page.");
        res.render('index');
    },

		getCentralNode: function(req, res) {
			console.log("Sending central node page.");
			res.render('node1');
		},

		getNode2: function(req, res) {
			console.log("Sending node 2 page.");
			res.render('node2');
		},

		getNode3: function(req, res) {
			console.log("Sending node 3 page.");
			res.render('node3');
		},

    sampleQuery: function(req, res) {
        var query = `SELECT *
                     FROM movies_normalized
                     LIMIT 20`;
        mysqlConnection.query(query, (err, result, fields) => {
            if(err) throw err;
            res.send(result);
        });
    }
}

module.exports = MainController;