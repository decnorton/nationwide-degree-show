import { APIGatewayEvent, Context } from 'aws-lambda';
import { getCategories, getSubmissions } from './lib/repository';

export async function handler(event: APIGatewayEvent, context: Context) {
    const path = event.path.replace('/.netlify/functions/api/', '');

    switch (path) {
        case 'categories':
            return respond(await getCategories(event));

        case 'submissions':
            return respond(await getSubmissions(event));
    }

    return {
        statusCode: '404',
        body: JSON.stringify({
            status: 'not_found'
        }),
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=604800, immutable'
        }
    };
}

function respond(body: object) {
    return {
        statusCode: 200,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=604800, immutable'
        }
    };
}
