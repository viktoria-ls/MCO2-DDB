const MainController = {
    getIndex: function(req, res) {
        console.log("Sending index page.");
        res.render('index');
    }
}

module.exports = MainController;