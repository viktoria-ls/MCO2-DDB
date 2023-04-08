const mysqlConnection = require('../db_utils');

const MainController = {
    getIndex: function(req, res) {
        console.log("Sending index page.");
        res.render('index');
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