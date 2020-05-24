import PromisePool from '@supercharge/promise-pool';
import { CATEGORIES } from './categories';
import { convertPdf, correctFileType, downloadFile, isImage, resizeImage } from './files';

const csv = require('csv-parse');
const fs = require('fs');
const path = require('path');
import Vibrant = require('node-vibrant')

export function parse(csvFile: string): Promise<RawSubmission[]> {
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

export async function downloadFiles(submissions: RawSubmission[]): Promise<RawSubmission[]> {
    let progress = 0;
    let total = submissions.length;

    console.log(`Downloading ${total} submissions`);

    return await PromisePool.for(submissions)
        .withConcurrency(10)
        .process(async (submission: RawSubmission) => {
            progress++;

            try {
                let filePath = await downloadFile(submission);

                if (path.extname(filePath) === '.pdf') {
                    filePath = await convertPdf(filePath);
                }

                const result = await correctFileType(filePath);
                filePath = result.path;

                submission.mime = result.mime;

                if (filePath) {
                    submission.file_path = filePath;

                    if (isImage(filePath)) {
                        const compressedPath = await resizeImage(submission, filePath, 400, 60);

                        await resizeImage(submission, filePath, 100, 60);
                        await resizeImage(submission, filePath, 800, 60);
                        await resizeImage(submission, filePath, 2000, 60);


                        const colours = await Vibrant.from(compressedPath).getPalette();

                        submission.colour = colours.Muted.getHex();
                        submission.thumb_path = compressedPath;
                    }
                }
            } catch (error) {
                console.error(`❌ downloadFiles(): ${error}`);
            }

            return submission;
        })
        .then(result => {
            if (result.errors.length) {
                console.error(`downloadFiles(): ${result.errors.length} errors`);
                console.error(result.errors);
            }

            return result.results;
        });
}

export function persist(dir: string, submissions: RawSubmission[]): Promise<Submission[]> {
    console.log(`Persisting ${submissions.length} rows`);

    // Format JSON
    const results: Submission[] = submissions.map(submission => {
        // Figure out which data this submission belongs to
        const submissionCategories = Object.keys(CATEGORIES).filter(key => submission[key]);
        const width = submission.width;
        const height = submission.height;

        const aspectRatio = width && height ? width / height : null;

        return {
            id: submission.id,
            name: submission.name,
            description: submission.description,
            website: submission.website,
            instagram: submission.instagram,
            categories: submissionCategories,
            width: width,
            height: height,
            ratio: aspectRatio,
            colour: submission.colour,
            file_name: submission.file_path ? path.basename(submission.file_path) : null,
            thumb_name: submission.thumb_path ? path.basename(submission.thumb_path) : null,
        };
    });

    fs.writeFileSync(`${dir}/submissions.json`, JSON.stringify(results));

    return Promise.resolve(results);
}

export interface RawSubmission {
    id: string;
    name: string;
    description: string;
    website: string;
    instagram: string;
    image_rgb: string;
    image_cmyk: string;

    colour: string;

    mime: string;
    file_path: string;
    thumb_path: string;

    width: number;
    height: number;

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

export interface Submission {
    id: string;
    name: string;
    description: string;
    website: string;
    instagram: string;
    file_name: string;
    thumb_name: string;
    colour: string;

    categories: string[];
}
