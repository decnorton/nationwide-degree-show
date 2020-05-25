import { APIGatewayEvent } from 'aws-lambda';

const categories = require('../data/categories.json');
const submissions = require('../data/submissions.json') as any[];
const defaultChunkSize = 30;

export async function getSubmissions(event: APIGatewayEvent): Promise<any> {
    const page = event.queryStringParameters.page;
    const chunkSize = Number(event.queryStringParameters.count || defaultChunkSize);

    let start;
    let results = [];

    if (page) {
        start = (Number(page) - 1) * chunkSize;

        if (start < submissions.length) {
            results = submissions.slice(start, start + chunkSize);

            console.log({
                start,
                finish: start + chunkSize,
                page
            });
        }
    }

    return {
        data: results,
        meta: {
            page,
            start,
            finish: start + chunkSize
        }
    };
}

export async function getCategories(event: APIGatewayEvent): Promise<any> {
    return {
        data: categories
    };
}
