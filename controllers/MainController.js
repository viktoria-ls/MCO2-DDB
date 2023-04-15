require('dotenv').config();

// Sends request to appropriate node and renders page (directly invoked on frontend)
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

    // Request body to send: {table, {fields}, isolation}
    createMovie: async function(req, res) {
        var {year} = req.body;

        if(year < 1980) {
            if(process.env.nodePort != 38014)   // prioritizes running the request on current node
                var response = await callCreate(process.env.nodePort, "movies_lt_eighty", req.body);
            else {
                try {
                    var response = await callCreate(38012, "movies_lt_eighty", req.body);
                }
                catch(err) {
                    var response = await callCreate(38013, "movies_lt_eighty", req.body);
                }
            }
        }
        else {
            if(process.env.nodePort != 38013)   // prioritizes running the request on current node
                var response = await callCreate(process.env.nodePort, "movies_ge_eighty", req.body);
            else {
                try {
                    var response = await callCreate(38012, "movies_ge_eighty", req.body);
                }
                catch(err) {
                    var response = await callCreate(38014, "movies_ge_eighty", req.body);
                }
            }
        }

        var jsonResponse = await response.json();

        if(response.ok)
            return res.redirect('/');
        else
            res.send(jsonResponse);
    },

    // Request body to send: {table, id, {fields}, isolation}
    updateMovie: async function(req, res) {
        //TODO
    },

    // Request body to send: {table, id, isolation}
    deleteMovie: async function(req, res) {
        // TODO: Implement like in createMovie
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
        // TODO
    },

    report2: async function(req, res) {
        // TODO
    },

    report3: async function(req, res) {
        // TODO
    },
}

// Used to insert to a table on a given port
const callCreate = async (port, table, fields) => {
    var fieldsCopy = {...fields};
    var {isolation} = fieldsCopy;
    delete fieldsCopy.isolation;

    console.log("in callCreate");

    var response = await fetch(`http://localhost:${port}/api/create`, {
        method: 'POST',
        body: JSON.stringify({fields: fieldsCopy, table, isolation}),
        headers: {'Content-Type': 'application/json'}
    });

    return response;
}

module.exports = MainController;