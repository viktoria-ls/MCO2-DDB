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

    // Request body to send: {table, id, {fields}, isolation}
    updateMovie: async function(req, res) {
        // PROBLEM: What if user updates year (1979 -> 1980)? does the record get moved to the other node?
        var reqBody = {
            fields: {...req.body}
        }

    },

    // Request body to send: {table, id, isolation}
    deleteMovie: async function(req, res) {
        // tries to delete from movies_lt_eighty and checks if central node is running
        try {
            var response_lt_80 = await fetch('http://localhost:38012/api/delete', {
                method: 'DELETE',
                body: JSON.stringify({...req.body, table: "movies_lt_eighty"}),
                headers: {'Content-Type': 'application/json'}
            });
        }
        catch(error) {
            // Central node is down
            console.log("Central node down");
            // TODO: run request on other nodes

            return res.redirect('/');
        }
        

        // found in movies_lt_eighty
        if(response_lt_80.ok) {
            // delete from movies_normalized
            await fetch('http://localhost:38012/api/delete', {
                method: 'DELETE',
                body: JSON.stringify({...req.body, table: "movies_normalized"}),
                headers: {'Content-Type': 'application/json'}
            });
            return res.redirect('/');
        }
        
        // movie id not found in movies_lt_eighty
        if(response_lt_80.status === 404) {
            // tries to delete from movies_lt_eighty
            var response_ge_80 = await fetch('http://localhost:38012/api/delete', {
                method: 'DELETE',
                body: JSON.stringify({...req.body, table: "movies_ge_eighty"}),
                headers: {'Content-Type': 'application/json'}
            });

            var json = await response_ge_80.json()

            // found in movies_lt_eighty
            if(response_ge_80.ok) {
                // delete from movies_normalized
                await fetch('http://localhost:38012/api/delete', {
                    method: 'DELETE',
                    body: JSON.stringify({...req.body, table: "movies_normalized"}),
                    headers: {'Content-Type': 'application/json'}
                });
                return res.redirect('/');
            }
            // error
            else
                res.send(json);
        }
    },

    report1: async function(req, res) {

    },

    report2: async function(req, res) {

    },

    report3: async function(req, res) {

    },
}

module.exports = MainController;