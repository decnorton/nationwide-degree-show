const path = require('path');
const csv = require('csv-parse');
const sqlite = require('sqlite3').verbose();
const fs = require('fs');

import { associateCategories, createCategories } from './categories';
import { parseSubmissions, persist } from './submissions';

const dataDir = path.resolve(__dirname, '../../data');
const dbFile = `${dataDir}/submissions.sqlite`;
const csvFile = `${dataDir}/submissions.csv`;

// Remove the old DB file, we're going to start from scratch each time
fs.unlinkSync(dbFile);

const db = new sqlite.Database(dbFile);

db.serialize(function () {
    db.run(`create table submissions (
        id          text not null,
        name        text not null,
        description text not null,
        file_image  text,
        file_video  text,
        website     text null,
        instagram   text null
    )`);

    db.run(`create table categories (
        id   text,
        name text
    )`);

    db.run(`create table submission_categories (
        submission_id text,
        category_id   text
    )`);
});

createCategories(db)
    .then(() => parseSubmissions(csvFile))
    .then(submissions => persist(db, submissions))
    .then(submissions => associateCategories(db, submissions))
    .finally(() => {
        db.close(error => {
            if (error) {
                return console.error(`Error whilst preparing database: ${error.message}`)
            }

            console.info('✅ Database prepared');
        });
    });

