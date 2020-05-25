import { APIGatewayEvent } from 'aws-lambda';

const categories = require('../data/categories.json');
const submissions = require('../data/submissions.json') as any[];
const chunkSize = 30;

export async function getSubmissions(event: APIGatewayEvent): Promise<any[]> {
    const page = event.queryStringParameters.page;
    let results = [];

    if (page) {
        let start = (Number(page) - 1) * chunkSize;

        if (start >= submissions.length) {
            return results;
        }

        results = submissions.slice(start, start + chunkSize);

        console.log({
            start,
            finish: start + chunkSize,
            page
        });
    }

    return results;
}

export function getCategories(event: APIGatewayEvent): Promise<any[]> {
    return new Promise((resolve, reject) => {
        resolve(categories);
    });
}
