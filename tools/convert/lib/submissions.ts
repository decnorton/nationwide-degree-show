import PromisePool from '@supercharge/promise-pool';
import { convertPdf, correctFileType, downloadFile, isImage, resizeImage } from './files';
import { CATEGORIES, RAW_CATEGORIES } from './categories';

const csv = require('csv-parse');
const fs = require('fs');
const path = require('path');
import Vibrant = require('node-vibrant');

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
                resolve(data.filter(row => row.id));
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
            const number = progress++;

            // console.log(`⏱ ${number}/${total}`);

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
                        const compressedPath = await resizeImage(submission, 400, 60);

                        await resizeImage(submission, 100, 60);
                        await resizeImage(submission, 800, 60);
                        await resizeImage(submission, 2000, 60);

                        try {
                            const colours = await Vibrant.from(compressedPath)
                                .getPalette();

                            submission.colour = colours.Muted.getHex();
                            submission.thumb_path = compressedPath;
                        } catch (error) {
                            console.error(`❌ downloadFiles(): [${submission.id}] Error extracting colour: ${error.message}`);
                        }
                    }
                }
            } catch (error) {
                if (error.message.includes('Premature end of JPEG file')
                    || error.message.includes('libpng read error')
                    || error.message.includes('Read error')
                ) {
                    // Download was corrupted, delete it and try again
                    fs.unlinkSync(submission.file_path);
                }

                console.error(`❌ downloadFiles(): [${submission.id}] ${error.message}`, error);
            }

            // console.log(`✅ ${number}/${total}`);

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
        const submissionCategories = coerceCategories(Object.keys(RAW_CATEGORIES).filter(key => submission[key]));
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

export function coerceCategories(rawCategories: string[]): string[] {
    // Keep any of the ones that don't need coercing
    const results = rawCategories.filter(c => Object.keys(CATEGORIES).includes(c));

    // [from, to]
    const pairs = [
        ['architecture', 'architecture_and_set_design'],
        ['theatre', 'architecture_and_set_design'],
        ['branding', 'branding_and_packaging'],
        ['packaging', 'branding_and_packaging'],
        ['fashion', 'fashion_and_costume_design'],
        ['costume', 'fashion_and_costume_design'],
        ['film', 'film_and_video'],
        ['video', 'film_and_video'],
        ['fine_art', 'fine_art'],
        ['sculpture', 'fine_art'],
        ['contemporary', 'fine_art'],
        ['graphic', 'graphic_design'],
        ['marketing', 'graphic_design'],
        ['communication', 'graphic_design'],
    ];

    for (let [from, to] of pairs) {
        // Check if the raw category includes `from`
        if (rawCategories.includes(from)) {
            // Map it to the destination category
            results.push(to);
        }
    }

    // Remove any duplicates
    return Array.from(new Set(results));
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
