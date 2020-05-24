import { APIGatewayEvent } from 'aws-lambda';

const categories = require('../data/categories.json');
const submissions = require('../data/submissions.json');
const chunkSize = 30;

export async function getSubmissions(event: APIGatewayEvent): Promise<any[]> {
    const page = event.queryStringParameters.page;
    let results = [];

    if (page) {
        let start = (Number(page) - 1) * chunkSize;

        results = submissions.splice(start, chunkSize);

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
