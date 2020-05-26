const path = require('path');
const csv = require('csv-parse');
const fs = require('fs');
const copyDir = require('copy-dir');

import { compressFiles, missingImages, probeImageDimensions } from './files';
import { createCategories } from './categories';
import { downloadFiles, parse as parseSubmissions, persist as persistSubmissions } from './submissions';

const dataDir = path.resolve(__dirname, '../../data');
const preparedDir = path.resolve(dataDir, 'prepared');
const csvFile = `${dataDir}/submissions.csv`;

// Remove the old DB file, we're going to start from scratch each time
if (fs.existsSync(preparedDir)) {
    fs.rmdirSync(preparedDir, {
        recursive: true
    });
}

fs.mkdirSync(preparedDir);

createCategories(preparedDir)
    .then(() => parseSubmissions(csvFile))
    .then(downloadFiles)
    .then(probeImageDimensions)
    .then(async submissions => {
        await compressFiles(400);
        await compressFiles(800);
        await compressFiles(2000);

        return submissions;
    })
    .then(submissions => persistSubmissions(preparedDir, submissions))
    .then(() => {
        // Copy the database into the function directories so they can query them
        const destinations = [
            path.resolve(__dirname, '../../src/functions/data'),
        ];

        destinations.forEach(destination => {
            copyDir.sync(preparedDir, destination);
        });

        console.log('Copied database to Netlify function directories');

        let errorFile = path.resolve(__dirname, 'errors.log');
        let missingImagesFile = path.resolve(__dirname, 'missing-images.csv');

        if (fs.existsSync(errorFile)) {
            fs.unlinkSync(errorFile);
        }

        if (fs.existsSync(missingImagesFile)) {
            fs.unlinkSync(missingImagesFile);
        }

        fs.writeFileSync(
            missingImagesFile,
            missingImages
                .map(({ id, name, extension, reason, link }) => [`"${id}"`, `"${name}"`, `"${reason}"`, `"${extension}"`, `"${link}"`].join(','))
                .join('\n')
        );
    }, error => {
        console.error(`❌ Error: ${error.message}`, error);
    });

