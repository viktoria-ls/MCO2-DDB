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
// TODO: Set Isolation Levels appropriately based on user functions for changing isolation levels
const DatabaseController = {
    create: async (req, res) => {
        if(!req.body.name)  // if no movie name
            return res.status(400).json({error: "Movie name is required."});

        var params = ["name", "year", "genre", "director", "rank", "actor_1", "actor_2", "actor_3"];
        var values = [];

        var db_name = req.body.db_name;
        delete req.body.db_name;

        // adds to values array including null values
        params.forEach((p, index) => {
            if(Object.keys(req.body).includes(p))
                values.push(Object.values(req.body)[index]);
            else
                values.push(null);
        })

        var query = `INSERT INTO ${db_name} (name, year, genre, director, \`rank\`, actor_1, actor_2, actor_3)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const connection = await connect();     // starts db connection
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

    update: async (req, res) => {
        if(req.body.id !== 0 && !req.body.id)   // id is null
            return res.status(400).json({error: "Movie id is required."});
        var setClause = [];

        var db_name = req.body.db_name;
        var id = req.body.id;
        delete req.body.db_name;
        delete req.body.id;

        // If no fields were specified in update request
        if(Object.keys(req.body).length === 0)
            return res.status(400).json({error: "No update parameters were set."});

        Object.keys(req.body).forEach(field => {
            setClause.push(field + "= (?)");
        });

        var query = `UPDATE ${db_name}
                     SET ${setClause.join(', ')}
                     WHERE id = ${id}`;

        const connection = await connect();
        await connection.beginTransaction();

        try {
            var [rows] = await connection.query(query, Object.values(req.body));
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

    delete: async (req, res) => {
        if(req.body.id !== 0 && !req.body.id) // id is null
            return res.status(400).json({error: "Movie id is required."});

        var query = `DELETE FROM ${req.body.db_name}
                     WHERE id = ${req.body.id}`;

        const connection = await connect();
        await connection.beginTransaction();

        try {
            var [rows] = await connection.query(query);
            await connection.commit();
            if(rows.affectedRows === 0)   // movie id not found
                return res.status(404).json({error: ("No such movie found with id =  " + req.body.id)});
        } catch (err) {
            await connection.rollback();
            return res.status(500).json({error: err.message});
        } finally {
            connection.end();
        }

        res.status(200).json({msg: ("Successfully deleted movie with id = " + req.body.id)});
    },
}

module.exports =  DatabaseController;