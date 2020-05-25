import { APIGatewayEvent, Context } from 'aws-lambda';
import { getCategories, getSubmissions } from './lib/repository';

export async function handler(event: APIGatewayEvent, context: Context) {
    console.log('path', event.path);

    const path = event.path.replace('/.netlify/functions/api/', '');

    const parts = path.split('/');

    switch (parts[0]) {
        case 'categories':
            return respond(await getCategories());

        case 'submissions': {
            // We're specifying the page as part of the path so that we can take advantage of Netlify's
            // function response caching, which ignores query parameters.
            const page = Number(parts[1]);

            if (isNaN(page)) {
                return {
                    statusCode: '422',
                    body: JSON.stringify({
                        status: 'missing_page'
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        // Tell Netlify to cache the function's response in their CDN.
                        'Cache-Control': 'public, max-age=604800, immutable'
                    }
                };
            }

            return respond(await getSubmissions(page));
        }
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
