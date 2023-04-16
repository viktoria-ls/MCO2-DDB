require('dotenv').config();

// Sends request to appropriate node and renders page (directly invoked on frontend)
const MainController = {
    getIndex: function(req, res) {
        res.render('index');
    },

    getCentralNode: function(req, res) {
        res.render('node1');
    },

    getNode2: function(req, res) {
        res.render('node2');
    },

    getNode3: function(req, res) {
        res.render('node3');
    },

    // Request body to send: {table, {fields}, isolation}
    createMovie: async function(req, res) {
        var {year} = req.body;

        if(year < 1980) {
            if(process.env.host != "172.16.3.114")   // prioritizes running the request on current node
                var response = await callCreate(process.env.host, "movies_lt_eighty", req.body);
            else {
                try {
                    var response = await callCreate("172.16.3.112", "movies_lt_eighty", req.body);
                }
                catch(err) {
                    var response = await callCreate("172.16.3.113", "movies_lt_eighty", req.body);
                }
            }
        }
        else {
            if(process.env.host != "172.16.3.113")   // prioritizes running the request on current node
                var response = await callCreate(process.env.host, "movies_ge_eighty", req.body);
            else {
                try {
                    var response = await callCreate("172.16.3.112", "movies_ge_eighty", req.body);
                }
                catch(err) {
                    var response = await callCreate("172.16.3.114", "movies_ge_eighty", req.body);
                }
            }
        }

        var jsonResponse = await response.json();

        if(response.ok)
            return res.send("Successfully inserted Movie #" + jsonResponse.newId);
        else
            res.send(jsonResponse.error);
    },

    searchMovie: async function(req, res) {
        var {searchQuery, isolation} = req.params;
        var response = await fetch(`http://${process.env.host}/api/search/${searchQuery}/${isolation}`);
        var jsonResponse = await response.json();
        return res.send(jsonResponse.rows);
    },

    // Request body to send: {table, id, {fields}, isolation}
    updateMovie: async function(req, res) {
        if(process.env.host == "172.16.3.112") {     // if this is central node
            var response = await callUpdate("172.16.3.112", "movies_lt_eighty", req.body);
            if(response.status === 404)
                var response = await callUpdate("172.16.3.112", "movies_ge_eighty", req.body);
        }

        else { // if this is not central node
            var thisNodeTable = (process.env.host == "172.16.3.113") ? "movies_lt_eighty" : "movies_ge_eighty";
            var response = await callUpdate(process.env.host, thisNodeTable, req.body);

            if(response.status === 404) {       // id not found in thisNodeTable
                try {       // try update request on central node with other table
                    var otherTable = (thisNodeTable === "movies_lt_eighty") ? "movies_ge_eighty" : "movies_lt_eighty";
                    var response = await callUpdate("172.16.3.112", otherTable, req.body);
                }
                catch(err) {    // central node is down, try on other node
                    var otherNonCentralNode = (process.env.host == "172.16.3.113") ? "172.16.3.114" : "172.16.3.113";
                    var response = await callUpdate(otherNonCentralNode, otherTable, req.body);
                }
            }
        }

        var jsonResponse = await response.json();

        if(response.ok)
            return res.send("Successfully updated Movie #" + jsonResponse.updatedId);
        else
            res.send(jsonResponse.error);
    },

    // Request body to send: {table, id, isolation}
    deleteMovie: async function(req, res) {
        if(process.env.host == "172.16.3.112") {     // if this is central node
            var response = await callDelete("172.16.3.112", "movies_lt_eighty", req.body);
            if(response.status === 404)
                var response = await callDelete("172.16.3.112", "movies_ge_eighty", req.body);
        }

        else { // if this is not central node
            var thisNodeTable = (process.env.host == "172.16.3.113") ? "movies_lt_eighty" : "movies_ge_eighty";
            var response = await callDelete(process.env.host, thisNodeTable, req.body);

            if(response.status === 404) {       // id not found in thisNodeTable
                try {       // try update request on central node with other table
                    var otherTable = (thisNodeTable === "movies_lt_eighty") ? "movies_ge_eighty" : "movies_lt_eighty";
                    var response = await callDelete("172.16.3.112", otherTable, req.body);
                }
                catch(err) {    // central node is down, try on other node
                    var otherNonCentralNode = (process.env.host == "172.16.3.113") ? "172.16.3.114" : "172.16.3.113";
                    var response = await callDelete(otherNonCentralNode, otherTable, req.body);
                }
            }
        }
        

        var jsonResponse = await response.json();

        if(response.ok)
            return res.send("Successfully deleted Movie #" + req.body.id);
        else
            res.send(jsonResponse.error);
    },

    // Number of Movies per Year
    report1: async function(req, res) {
        var response = await fetch(`http://${process.env.host}/api/report1/${req.params.isolation}`);
        var jsonResponse = await response.json();
        return res.send(jsonResponse);
    },

    // Average rank of all Movies under each Genre
    report2: async function(req, res) {
        var response = await fetch(`http://${process.env.host}/api/report2/${req.params.isolation}`);
        var jsonResponse = await response.json();
        return res.send(jsonResponse);
    },

    // Top 20 highest ranking Movies for each Genre
    report3: async function(req, res) {
        var response = await fetch(`http://${process.env.host}/api/report3/${req.params.isolation}`);
        var jsonResponse = await response.json();
        return res.send(jsonResponse);
    },
}

// Inserts into a table on a given port
const callCreate = async (port, table, body) => {
    var fieldsCopy = {...body};
    var {isolation} = fieldsCopy;
    delete fieldsCopy.isolation;

    var response = await fetch(`http://${process.env.host}/api/create`, {
        method: 'POST',
        body: JSON.stringify({fields: fieldsCopy, table, isolation}),
        headers: {'Content-Type': 'application/json'}
    });

    return response;
}

// Updates a record from a table on a given port
const callUpdate = async (port, table, body) => {
    var fieldsCopy = {...body};
    var {isolation, id} = fieldsCopy;
    delete fieldsCopy.isolation;
    delete fieldsCopy.id;

    var response = await fetch(`http://${process.env.host}/api/update`, {
        method: 'PATCH',
        body: JSON.stringify({fields: fieldsCopy, table, isolation, id}),
        headers: {'Content-Type': 'application/json'}
    });

    return response;
}

// Deletes a record from a table on a given port
const callDelete = async (port, table, body) => {
    var {isolation, id} = body;

    var response = await fetch(`http://${process.env.host}/api/delete`, {
        method: 'DELETE',
        body: JSON.stringify({table, isolation, id}),
        headers: {'Content-Type': 'application/json'}
    });

    return response;
}

module.exports = MainController;