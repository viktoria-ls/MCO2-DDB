require('dotenv').config();
const mysql = require('mysql2/promise');

const max_id_lt_query = `SELECT MAX(id) as id FROM movies_lt_eighty`;
const max_id_ge_query = `SELECT MAX(id) as id FROM movies_ge_eighty`;

// Establishes database connection
const connect = async () => {
    const conn = await mysql.createConnection({
        host: process.env.temphost,
        database: process.env.database,
        user: process.env.user,
        password: process.env.password
    });

    return conn;
}

// CRUD transactions (not directly invoked on frontend; invoked in MainController)
const DatabaseController = {
    // Request body: {table, {fields}, isolation}
    create: async (req, res) => {
        var {table, fields, isolation} = req.body;
        if(!fields.name)  // if no movie name
            return res.status(400).json({error: "Movie name is required."});
        if(!fields.year)  // if no movie name
            return res.status(400).json({error: "Movie year is required."});

        var params = [];
        var values = Object.values(fields);

        // adds to values array including null values
        Object.keys(fields).forEach((f, index) => {
            if(f === 'rank')
                params.push('\`rank\`');
            else
                params.push(f);
        });

        var query = `INSERT INTO ${table} (${params.join(', ') + ', id'})
                     VALUES (${'?'.repeat(params.length + 1).split('').join(', ')})`;

        const connection = await connect();     // starts db connection
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        await connection.query('SET autocommit=0;');
        //await connection.beginTransaction();    // starts transaction
        try {
            // if in node1
            if(process.env.host == "172.16.3.112") {
                // LOCK tables
                await connection.query(`LOCK TABLES movies_lt_eighty WRITE, movies_lt_eighty AS t1 READ;`);
                await connection.query(`LOCK TABLES movies_ge_eighty WRITE, movies_ge_eighty AS t2 READ;`);
                var [rows] = await connection.query(max_id_lt_query);
                var max_lt_80 = rows[0].id;
                var [rows] = await connection.query(max_id_ge_query);
                var max_ge_80 = rows[0].id;
            }
    
            // if node2
            else if(process.env.host == "172.16.3.113") {
                // LOCK tables
                await connection.query(`LOCK TABLES movies_lt_eighty WRITE, movies_lt_eighty AS t1 READ;`);
                var [rows] = await connection.query(max_id_lt_query);
                var max_lt_80 = rows[0].id;

                try {
                    var max_ge_80 = await getMaxId("172.16.3.112", "movies_ge_eighty", isolation);
                }
                catch(err) {
                    
                    var max_ge_80 = await getMaxId("172.16.3.114", "movies_ge_eighty", isolation);
                }
                
            }
    
            // node3
            else {
                await connection.query(`LOCK TABLES movies_ge_eighty WRITE, movies_ge_eighty AS t2 READ;`);
                var [rows] = await connection.query(max_id_ge_query);
                var max_ge_80 = rows[0].id;

                try {
                    var max_lt_80 = await getMaxId("172.16.3.112", "movies_lt_eighty", isolation);
                }
                catch(err) {
                    var max_lt_80 = await getMaxId("172.16.3.113", "movies_lt_eighty", isolation);
                }
            }

            values.push(Math.max(max_ge_80, max_lt_80) + 1);

            var [rows] = await connection.query(query, values);     // [rows] stores stats based on changes made to db
            await connection.commit();      // commits transaction if successful
        } catch (err) {
            await connection.rollback();    // rolls back if error occurred
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();       // ends db connection regardless of success/fail
        }

        res.status(200).json({msg: "Successfully created a new movie with id = " + values[values.length - 1], newId: values[values.length - 1]});
    },

    // Request body: {table, id, {fields}, isolation}
    update: async (req, res) => {
        var {table, id, isolation, fields} = req.body;

        if(id !== 0 && !id)   // id is null
            return res.status(400).json({error: "Movie id is required."});
        var setClause = [];

        // If no fields were specified in update request
        if(!fields)
            return res.status(400).json({error: "No update parameters were set."});

        Object.keys(fields).forEach(field => {
            setClause.push(field + "= (?)");
        });

        var query = `UPDATE ${table}
                     SET ${setClause.join(', ')}
                     WHERE id = ${id}`;

        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0;');

        try {
            await connection.query(`LOCK TABLES ${table} write;`);
            var [rows] = await connection.query(query, Object.values(fields));
            await connection.commit();
            if(rows.affectedRows === 0)   // movie id not found
                return res.status(404).json({error: ("No such movie found with id =  " + id)});
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).json({msg: ("Successfully updated movie with id = " + id), updatedId: id});
    },

    search: async (req, res) => {
        var {searchQuery, isolation} = req.params;

        var select = 'SELECT * FROM ';
        var query = ` WHERE name LIKE '%${searchQuery}%'
                     OR id LIKE '%${searchQuery}%'
                     OR year LIKE '%${searchQuery}%'
                     OR genre LIKE '%${searchQuery}%'
                     OR director LIKE '%${searchQuery}%'
                     OR ${"\`rank\`"} LIKE '%${searchQuery}%'
                     OR actor_1 LIKE '%${searchQuery}%'
                     OR actor_2 LIKE '%${searchQuery}%'`;

        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0;');
        try {
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.113") {     // if this is node1 or node2
                // LOCK TABLES
                await connection.query(`LOCK TABLES movies_lt_eighty WRITE;`);
                var [rows] = await connection.query(select + "movies_lt_eighty" + query);
                var lt_rows = rows;
            }
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.114") {   // if this is node1 or node3
                // LOCK TABLES
                await connection.query(`LOCK TABLES movies_ge_eighty WRITE;`);
                var [rows] = await connection.query(select + "movies_ge_eighty" + query);
                var ge_rows = rows;
            }

            if(process.env.host == "172.16.3.113") {     // gets data from other table
                // LOCK TABLES
                try {
                    var ge_rows = await getSearchQueryResult("172.16.3.112", "movies_ge_eighty", isolation, searchQuery);
                } catch(err) {
                    var ge_rows = await getSearchQueryResult("172.16.3.114", "movies_ge_eighty", isolation, searchQuery);
                }
            }
            else if(process.env.host == "172.16.3.114") { // gets data from other table
                // LOCK TABLES
                try {
                    var lt_rows = await getSearchQueryResult("172.16.3.112", "movies_lt_eighty", isolation, searchQuery);
                } catch(err) {
                    var lt_rows = await getSearchQueryResult("172.16.3.113", "movies_lt_eighty", isolation, searchQuery);
                }
            }

        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).json({rows: [...ge_rows, ...lt_rows]});
    },

    searchFromNode: async (req, res) => {
        var {table, isolation, searchQuery} = req.params;
        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0;');

        var query = `SELECT * FROM ${table}
                     WHERE name LIKE '%${searchQuery}%'
                     OR id LIKE '%${searchQuery}%'
                     OR year LIKE '%${searchQuery}%'
                     OR genre LIKE '%${searchQuery}%'
                     OR director LIKE '%${searchQuery}%'
                     OR ${"\`rank\`"} LIKE '%${searchQuery}%'
                     OR actor_1 LIKE '%${searchQuery}%'
                     OR actor_2 LIKE '%${searchQuery}%'`;

        try {
            await connection.query(`LOCK TABLES ${table} write;`);
            var [rows] = await connection.query(query);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).send(rows);
    },

    // Request body: {table, id, isolation}
    delete: async (req, res) => {
        var {table, id, isolation} = req.body;
        if(id !== 0 && !id) // id is null
            return res.status(400).json({error: "Movie id is required."});

        var query = `DELETE FROM ${table}
                     WHERE id = ${id}`;

        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0;');

        try {
            await connection.query(`LOCK TABLES ${table} WRITE, ${table} AS t1 READ;`);
            var [rows] = await connection.query(query);
            await connection.commit();
            if(rows.affectedRows === 0)   // movie id not found
                return res.status(404).json({error: ("No such movie found with id =  " + id)});
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).json({msg: ("Successfully deleted movie with id = " + id)});
    },

    report1: async (req, res) => {
        var {isolation} = req.params;
        var query_ge = `SELECT year, COUNT(*) as title FROM movies_ge_eighty GROUP BY year ORDER BY 1 DESC`;
        var query_lt = `SELECT year, COUNT(*) as title FROM movies_lt_eighty GROUP BY year ORDER BY 1 DESC`;

        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0');

        try {
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.113") {     // if this is node1 or node2
                // LOCK TABLES
                await connection.query(`LOCK TABLES movies_lt_eighty WRITE;`);
                var [rows] = await connection.query(query_lt);
                var lt_rows = rows;
            }
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.114") {   // if this is node1 or node3
                // LOCK TABLES
                await connection.query(`LOCK TABLES movies_ge_eighty WRITE;`);
                var [rows] = await connection.query(query_ge);
                var ge_rows = rows;
            }

            if(process.env.host == "172.16.3.113") {     // gets data from other table
                // LOCK TABLES
                try {
                    var ge_rows = await getReport1("172.16.3.112", "movies_ge_eighty", isolation);
                } catch(err) {
                    var ge_rows = await getReport1("172.16.3.114", "movies_ge_eighty", isolation);
                }
            }
            else if(process.env.host == "172.16.3.114") { // gets data from other table
                // LOCK TABLES
                try {
                    var lt_rows = await getReport1("172.16.3.112", "movies_lt_eighty", isolation);
                } catch(err) {
                    var lt_rows = await getReport1("172.16.3.113", "movies_lt_eighty", isolation);
                }
            }

        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).json({rows: [...ge_rows, ...lt_rows]});
    },

    report1FromNode: async (req, res) => {
        var {table, isolation} = req.params;
        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0');

        try {
            await connection.query(`LOCK TABLES ${table} write;`);
            var [rows] = await connection.query(`SELECT year, COUNT(*) as title FROM ${table} GROUP BY year ORDER BY 1 DESC`);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).send(rows);
    },

    report2: async (req, res) => {
        var {isolation} = req.params;
        var query_ge = 'SELECT genre, ROUND(AVG(`rank`), 2) as `rank` FROM movies_ge_eighty WHERE genre IS NOT NULL group by genre order by `rank` DESC';
        var query_lt = 'SELECT genre, ROUND(AVG(`rank`), 2) as `rank` FROM movies_lt_eighty WHERE genre IS NOT NULL group by genre order by `rank` DESC';
    
        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0');
        try {
            //await connection.query(`LOCK TABLES ${table} write;`);
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.113") {     // if this is node1 or node2
                // LOCK TABLES
                await connection.query(`LOCK TABLES movies_lt_eighty WRITE;`);
                var [rows] = await connection.query(query_lt);
                var lt_rows = rows;
            }
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.114") {   // if this is node1 or node3
                // LOCK TABLES
                await connection.query(`LOCK TABLES movies_ge_eighty WRITE;`);
                var [rows] = await connection.query(query_ge);
                var ge_rows = rows;
            }

            if(process.env.host == "172.16.3.113") {     // gets data from other table
                // LOCK TABLES
                try {
                    var ge_rows = await getReport2("172.16.3.112", "movies_ge_eighty", isolation);
                } catch(err) {
                    var ge_rows = await getReport2("172.16.3.114", "movies_ge_eighty", isolation);
                }
            }
            else if(process.env.host == "172.16.3.114") { // gets data from other table
                // LOCK TABLES
                try {
                    var lt_rows = await getReport2("172.16.3.112", "movies_lt_eighty", isolation);
                } catch(err) {
                    var lt_rows = await getReport2("172.16.3.113", "movies_lt_eighty", isolation);
                }
            }

        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).json({rows: [...ge_rows, ...lt_rows]});
    },

    report2FromNode: async (req, res) => {
        var {table, isolation} = req.params;
        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0');

        try {
            await connection.query(`LOCK TABLES ${table} write;`);
            var [rows] = await connection.query(`SELECT genre, ROUND(AVG(rank),2) as ${"\`rank\`"} FROM ${table} WHERE genre IS NOT NULL group by genre order by ${"\`rank\`"} DESC`);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).send(rows);
    },

    // top 20 movies
    report3: async (req, res) => {
        var {isolation} = req.params;
        var query_ge = `SELECT name, genre, ${"\`rank\`"} FROM movies_ge_eighty ORDER BY ${"\`rank\`"} DESC LIMIT 20`;
        var query_lt = `SELECT name, genre, ${"\`rank\`"} FROM movies_lt_eighty ORDER BY ${"\`rank\`"} DESC LIMIT 20`;

        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0');
        try {
            //await connection.query(`LOCK TABLES ${table} write;`);
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.113") {     // if this is node1 or node2
                // LOCK TABLES
                await connection.query(`LOCK TABLES movies_lt_eighty WRITE;`);
                var [rows] = await connection.query(query_lt);
                var lt_rows = rows;
            }
            if(process.env.host == "172.16.3.112" || process.env.host == "172.16.3.114") {   // if this is node1 or node3
                await connection.query(`LOCK TABLES movies_ge_eighty WRITE;`);
                var [rows] = await connection.query(query_ge);
                var ge_rows = rows;
            }

            if(process.env.host == "172.16.3.113") {     // gets data from other table
                // LOCK TABLES
                try {
                    var ge_rows = await getReport3("172.16.3.112", "movies_ge_eighty", isolation);
                } catch(err) {
                    var ge_rows = await getReport3("172.16.3.114", "movies_ge_eighty", isolation);
                }
            }
            else if(process.env.host == "172.16.3.114") { // gets data from other table
                // LOCK TABLES
                try {
                    var lt_rows = await getReport3("172.16.3.112", "movies_lt_eighty", isolation);
                } catch(err) {
                    var lt_rows = await getReport3("172.16.3.113", "movies_lt_eighty", isolation);
                }
            }

        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).json({rows: [...ge_rows, ...lt_rows]});
    },

    report3FromNode: async (req, res) => {
        var {table, isolation} = req.params;
        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        // await connection.beginTransaction();
        await connection.query('SET autocommit=0');
        try {
            await connection.query(`LOCK TABLES ${table} write;`);
            var [rows] = await connection.query(`SELECT name, genre, ${"\`rank\`"} FROM ${table} ORDER BY ${"\`rank\`"} DESC LIMIT 20`);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).send(rows);
    },

    maxId: async (req, res) => {
        var {table, isolation} = req.params;
        const connection = await connect();
        await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        //await connection.beginTransaction();
        await connection.query('SET autocommit=0');

        try {
            await connection.query(`LOCK TABLES ${table} write;`);
            var [rows] = await connection.query(`SELECT MAX(id) as id FROM ${table}`);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            await connection.query(`UNLOCK TABLES;`);
            connection.end();
        }

        res.status(200).json({maxId: rows[0].id});
    }
}

// Gets the max id from a table in a given node
const getMaxId = async (host, table, isolation) => {
    var response = await fetch(`http://${host}/api/maxId/${table}/${isolation}`);
    var jsonResponse = await response.json();
    return jsonResponse.maxId;
}

const getSearchQueryResult = async (host, table, isolation, searchQuery) => {
    var response = await fetch(`http://${host}/api/search/${searchQuery}/${table}/${isolation}`);
    var jsonResponse = await response.json();
    return jsonResponse;
}

// Gets report 1 data from a table in a given node
const getReport1 = async (host, table, isolation) => {
    var response = await fetch(`http://${host}/api/report1/${table}/${isolation}`);
    var jsonResponse = await response.json();
    return jsonResponse;
}

const getReport2 = async (host, table, isolation) => {
    var response = await fetch(`http://${host}/api/report2/${table}/${isolation}`);
    var jsonResponse = await response.json();
    return jsonResponse;
}

const getReport3 = async (host, table, isolation) => {
    var response = await fetch(`http://${host}/api/report3/${table}/${isolation}`);
    var jsonResponse = await response.json();
    return jsonResponse;
}

module.exports =  DatabaseController;