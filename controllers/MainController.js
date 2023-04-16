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
        if(process.env.nodePort == 38012) {     // if this is central node
            var response = await callUpdate(38012, "movies_lt_eighty", req.body);
            if(response.status === 404)
                var response = await callUpdate(38012, "movies_ge_eighty", req.body);
        }

        else { // if this is not central node
            var thisNodeTable = (process.env.nodePort == 38013) ? "movies_lt_eighty" : "movies_ge_eighty";
            var response = await callUpdate(process.env.nodePort, thisNodeTable, req.body);

            if(response.status === 404) {       // id not found in thisNodeTable
                try {       // try update request on central node with other table
                    var otherTable = (thisNodeTable === "movies_lt_eighty") ? "movies_ge_eighty" : "movies_lt_eighty";
                    var response = await callUpdate(38012, otherTable, req.body);
                }
                catch(err) {    // central node is down, try on other node
                    var otherNonCentralNode = (process.env.nodePort == 38013) ? 38014 : 38013;
                    var response = await callUpdate(otherNonCentralNode, otherTable, req.body);
                }
            }
        }
        

        var jsonResponse = await response.json();

        if(response.ok)
            return res.redirect('/');
        else
            res.send(jsonResponse);
    },

    // Request body to send: {table, id, isolation}
    deleteMovie: async function(req, res) {
        // TODO: Implement like in createMovie
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
const callCreate = async (port, table, body) => {
    var fieldsCopy = {...body};
    var {isolation} = fieldsCopy;
    delete fieldsCopy.isolation;

    var response = await fetch(`http://localhost:${port}/api/create`, {
        method: 'POST',
        body: JSON.stringify({fields: fieldsCopy, table, isolation}),
        headers: {'Content-Type': 'application/json'}
    });

    return response;
}

const callUpdate = async (port, table, body) => {
    var fieldsCopy = {...body};
    var {isolation, id} = fieldsCopy;
    delete fieldsCopy.isolation;
    delete fieldsCopy.id;

    var response = await fetch(`http://localhost:${port}/api/update`, {
        method: 'PATCH',
        body: JSON.stringify({fields: fieldsCopy, table, isolation, id}),
        headers: {'Content-Type': 'application/json'}
    });

    return response;
}

module.exports = MainController;