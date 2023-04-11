// Sends request to appropriate node and renders page (directly invoked on frontend)

// TODO: call API with appropriate port number depending on req.body.year and then render page
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
}

module.exports = MainController;