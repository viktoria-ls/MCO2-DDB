require('dotenv').config();
const mysql = require('mysql2/promise');

// Establishes database connection
const connect = async () => {
    const conn = await mysql.createConnection({
        host: process.env.host,
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

        var params = ["name", "year", "genre", "director", "rank", "actor_1", "actor_2", "actor_3"];
        var values = [];

        // adds to values array including null values
        params.forEach((p, index) => {
            if(Object.keys(fields).includes(p))
                values.push(Object.values(fields)[index]);
            else
                values.push(null);
        })

        var query = `INSERT INTO ${table} (name, year, genre, director, \`rank\`, actor_1, actor_2, actor_3)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const connection = await connect();     // starts db connection
        await connection.execute(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        await connection.beginTransaction();    // starts transaction

        try {
            var [rows] = await connection.query(query, values);     // [rows] stores stats based on changes made to db
            await connection.commit();      // commits transaction if successful
        } catch (err) {
            await connection.rollback();    // rolls back if error occurred
            return res.status(500).json({error: err.message});
        } finally {
            connection.end();       // ends db connection regardless of success/fail
        }

        res.status(200).json({msg: "Successfully created a new movie with id = " + rows.insertId});
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
        await connection.execute(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        await connection.beginTransaction();

        try {
            var [rows] = await connection.query(query, Object.values(fields));
            await connection.commit();
            if(rows.affectedRows === 0)   // movie id not found
                return res.status(404).json({error: ("No such movie found with id =  " + id)});
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            connection.end();
        }

        res.status(200).json({msg: ("Successfully updated movie with id = " + id)});
    },

    // Request body: {table, id, isolation}
    delete: async (req, res) => {
        var {table, id, isolation} = req.body;
        if(id !== 0 && !id) // id is null
            return res.status(400).json({error: "Movie id is required."});

        var query = `DELETE FROM ${table}
                     WHERE id = ${id}`;

        const connection = await connect();
        await connection.execute(`SET TRANSACTION ISOLATION LEVEL ${isolation}`);
        await connection.beginTransaction();

        try {
            var [rows] = await connection.query(query);
            await connection.commit();
            if(rows.affectedRows === 0)   // movie id not found
                return res.status(404).json({error: ("No such movie found with id =  " + id)});
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            connection.end();
        }

        res.status(200).json({msg: ("Successfully deleted movie with id = " + id)});
    },
}

module.exports =  DatabaseController;