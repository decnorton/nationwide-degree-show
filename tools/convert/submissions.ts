import { Database } from 'sqlite3';

const path = require('path');
const csv = require('csv-parse');
const sqlite = require('sqlite3').verbose();
const fs = require('fs');

export function parseSubmissions(csvFile: string): Promise<Submission[]> {
    return new Promise((resolve, reject) => {
        // Transpose the CSV file
        const parser = csv({
            cast: true,
            skip_empty_lines: true,
            columns: record => {
                // Normalise column names
                return record.map((column: string) => column.toLowerCase().trim().split(/\s/).join('_'));
            }
        }, function (error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });

        fs.createReadStream(csvFile).pipe(parser);
    });
}

export function persist(db: Database, submissions: Submission[]): Promise<Submission[]> {
    console.log(`Persisting ${submissions.length} rows`);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            const statement = db.prepare(`
                insert into submissions(id, name, description, website, instagram)
                values
                    (?, ?, ?, ?, ?)
            `);

            submissions.forEach(row => {
                statement.run([
                    row.id,
                    row.name,
                    row.description,
                    row.website,
                    row.instagram
                ]);
            });

            statement.finalize(error => {
                if (error) {
                    reject(error);
                } else {
                    resolve(submissions);
                }
            });
        });
    });
}

export interface Submission {
    id: string;
    name: string;
    description: string;
    website: string;
    instagram: string;

    // Categories
    advertising: boolean;
    animation: boolean;
    architecture_set_design: boolean;
    branding_packaging: boolean;
    ceramics: boolean;
    fashion_costume_design: boolean;
    film: boolean;
    fine_art: boolean;
    game_design: boolean;
    graphic_design: boolean;
    illustration: boolean;
    jewelry_design: boolean;
    miscellaneous: boolean;
    photography: boolean;
    product_design: boolean;
    textiles: boolean;
}
