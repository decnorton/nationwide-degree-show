const http = require('https');
const path = require('path');
const fs = require('fs');
const url = require('url');
import PromisePool from '@supercharge/promise-pool';
import * as imagemin from 'imagemin';
import * as probe from 'probe-image-size';
import * as sharp from 'sharp';
import { RawSubmission } from './submissions';

const PDFImage = require('pdf-image').PDFImage;

const glob = require('glob');

const FileType = require('file-type');

const imageminJpegtran = require('imagemin-jpegtran');

const submissionsDir = path.resolve(__dirname, '../../src/static/submissions')
const originalsDir = path.resolve(submissionsDir, './original');
const thumbsDir = path.resolve(submissionsDir, './thumbs');

export const errors: string[] = [];
export const missingImages: { id; name; reason: string, extension; link; }[] = [];

if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, {
        recursive: true
    });
}

if (!fs.existsSync(thumbsDir)) {
    fs.mkdirSync(thumbsDir, {
        recursive: true
    });
}

function normaliseExtension(extension: string) {
    extension = extension.trim().toLowerCase();

    switch (extension) {
        case '.jpeg':
        case '.jpg':
            return '.jpg';

        default:
            return extension;
    }
}

export async function downloadFile(submission: RawSubmission): Promise<string> {
    const fileUrl = submission.image_rgb;

    if (!fileUrl) {
        return Promise.reject(new Error('Missing image URL'));
    }

    const extension = normaliseExtension(path.extname(fileUrl));
    const fileName = `${submission.id}${extension}`;
    const downloadTo = path.resolve(originalsDir, fileName);

    // Check if there's an override

    const overrides = glob.sync(path.resolve(submissionsDir, 'overrides', `${submission.id}*`));

    if (overrides.length) {
        return Promise.resolve(overrides[0]);
    }

    // If the file exists but the size is less than 5kb, it's most likely a download error
    if (fs.existsSync(downloadTo) && fs.statSync(downloadTo).size > 5 * 1024) {
        return Promise.resolve(downloadTo);
    }

    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(downloadTo);

        let options = url.parse(fileUrl);

        // Make sure the path is encoded as some of the file names have special characters, typeform doesn't do this for us.
        options.path = encodeURI(options.path);
        options.pathname = encodeURI(options.pathname);

        http.get(options, response => {
            response.pipe(writeStream);

            writeStream.on('finish', () => {
                console.debug(`downloadFile(): [${submission.id}] Finished downloading to ${downloadTo}`);

                writeStream.close();

                resolve(downloadTo);
            })
        })
            .on('error', error => {
                console.error(`downloadFile(): [${submission.id}] Error downloading file: ${error.message}`, error);

                fs.unlinkSync(downloadTo);

                reject(error);
            });
    });
}

export async function convertPdf(filePath: string): Promise<string> {
    const image = new PDFImage(filePath);

    try {
        const pagePath = await image.convertPage(0);

        if (fs.existsSync(pagePath)) {
            // We got the image successfully, move it to the overrides folder
            const overridePath = filePath
                .replace('original', 'overrides')
                .replace(path.extname(filePath), path.extname(pagePath));

            fs.renameSync(
                pagePath,
                overridePath
            );

            return overridePath;
        }
    } catch (error) {
        console.error(error);
    }


    return filePath;
}

export async function correctFileType(filePath: string): Promise<{ path: string; mime: string; }> {
    try {
        const result = await FileType.fromFile(filePath);

        if (result) {
            // file-type will detect some PDF files as Illustrator files; we don't want to rename these.
            if (['ai', 'mp1'].includes(result.ext)) {
                return { path: filePath, mime: result.mime };
            }

            // Rename file with the proper extension
            const pathWithoutExtension = filePath.replace(path.extname(filePath), '');
            let renameTo = `${pathWithoutExtension}.${result.ext}`;

            if (filePath !== renameTo) {
                // Move to the overrides directory
                renameTo = renameTo.replace('original', 'overrides');

                console.log(`correctFileType(): Renaming file from [${path.basename(filePath)}] to [${path.basename(renameTo)}]`);

                fs.renameSync(filePath, renameTo);
            }

            return {
                path: renameTo,
                mime: result.mime
            };
        } else {
            console.error('❌ Failed to determine file type of: ' + filePath);
        }

        return { path: filePath, mime: null };
    } catch (error) {
        console.error(`❌ Failed to determine file type of [${filePath}]: ${error.message}`);

        // Resolve anyway
        return { path: filePath, mime: null };
    }
}

export async function resizeImage(submission: RawSubmission, filePath: string, size: number, quality: number): Promise<string> {
    const destinationDir = path.resolve(thumbsDir, `${size}`);

    if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, {
            recursive: true
        });
    }

    // Get the base file name, without extension
    const fileName = path.basename(filePath, path.extname(filePath));

    // Make sure they're all converted to JPEG
    const destination = path.resolve(destinationDir, `${fileName}.jpg`);

    if (fs.existsSync(destination)) {
        return Promise.resolve(destination);
    }

    let builder = sharp(filePath)
        .resize(size, size, {
            fit: 'inside',
            withoutEnlargement: true
        });

    // Don't convert gifs to JPEGs, but still resize them
    if (path.basename(filePath) !== 'gif') {
        builder = builder.toFormat('jpeg', {
            quality
        });
    }

    return builder.toFile(destination)
        .then(() => fileName, error => {
            console.error(`resizeImage(): Unable to resize image [${filePath}]: ${error.message}`);

            missingImages.push({
                id: submission.id,
                extension: path.extname(filePath),
                name: submission.name,
                reason: error.message,
                link: submission.image_rgb,
            });

            throw error;
        });
}

export async function probeImageDimensions(submissions: RawSubmission[]): Promise<RawSubmission[]> {
    let progress = 0;
    let total = submissions.length;

    console.log(`Fetching image dimensions for ${total} submissions`);

    return await PromisePool.for(submissions)
        .withConcurrency(10)
        .process(async submission => {
            progress++;

            try {
                const result = await fetchDimensions(submission);

                submission.width = result.width;
                submission.height = result.height;
            } catch (error) {
                console.error(`probeImageDimensions(): ${error.message}`);
            }

            return submission;
        })
        .then(result => result.results);
}

export async function compressFiles(size: number) {
    const files = await imagemin([
        `${thumbsDir}/${size}/*`
    ], {
        destination: `${thumbsDir}/${size}`,
        plugins: [
            // We should only have JPEG files left now
            imageminJpegtran({
                progressive: true
            })
        ]
    });

    console.log(`Compressed ${files.length} files`);

    return Promise.resolve();
}

function fetchDimensions(submission: RawSubmission): Promise<{ width: number; height: number }> {
    const filePath = submission.file_path;

    if (!filePath || !fs.existsSync(filePath)) {
        const errorMessage = `fetchDimensions(): [${submission.id}] File doesn't exist: ${filePath}`;

        missingImages.push({
            id: submission.id,
            extension: null,
            name: submission.name,
            reason: 'File is missing',
            link: submission.image_rgb
        });

        errors.push(errorMessage);

        return Promise.reject(new Error(errorMessage));
    }

    if (!isImage(filePath)) {
        let extension = path.extname(filePath);

        const errorMessage = `fetchDimensions(): [${submission.id}] File is not an image: ${extension}`;

        errors.push(errorMessage);

        missingImages.push({
            id: submission.id,
            extension: extension,
            reason: 'File is not an image',
            name: submission.name,
            link: submission.image_rgb
        });

        return Promise.reject(new Error(errorMessage));
    }

    return probe(fs.createReadStream(filePath))
        .then(result => {
            return {
                width: result.width,
                height: result.height
            };
        })
        .catch(error => {
            console.error(`fetchDimensions(): ${error.message} | ${filePath}`);

            throw error;
        });
}

export function isImage(filePath: string) {
    // Get the extension and strip the dot
    const extension = path.extname(filePath).slice(1);

    return [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'tif'
    ].includes(extension);
}
