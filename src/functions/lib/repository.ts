const categories = require('../data/categories.json');
const submissions = require('../data/submissions.json') as any[];
const defaultPageSize = 50;

export async function getSubmissions(page: number): Promise<any> {
    let start;
    let results = [];

    start = (page - 1) * defaultPageSize;

    if (start < submissions.length) {
        results = submissions.slice(start, start + defaultPageSize);
    }

    return {
        data: results,
        meta: {
            page,
            start,
            finish: start + defaultPageSize,
            timestamp: new Date().toJSON()
        }
    };
}

export async function getCategories(): Promise<any> {
    return { data: categories };
}
