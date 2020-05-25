const categories = require('../data/categories.json');
const submissions = require('../data/submissions.json') as any[];
const defaultChunkSize = 50;

export async function getSubmissions(page: number): Promise<any> {
    let start;
    let results = [];

    start = (page - 1) * defaultChunkSize;

    if (start < submissions.length) {
        results = submissions.slice(start, start + defaultChunkSize);

        console.log({
            start,
            finish: start + defaultChunkSize,
            page
        });
    }

    return {
        data: results,
        meta: {
            page,
            start,
            finish: start + defaultChunkSize
        }
    };
}

export async function getCategories(): Promise<any> {
    return {
        data: categories
    };
}
