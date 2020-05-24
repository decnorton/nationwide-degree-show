const fs = require('fs');

import { RawSubmission } from './submissions';

export const CATEGORIES = {
    advertising: 'Advertising',
    animation: 'Animation',
    architecture: 'Architecture & Set Design',
    branding: 'Branding',
    packaging: 'Packaging',
    ceramics: 'Ceramics',
    fashion: 'Fashion',
    costume: 'Costume Design',
    film: 'Film',
    video: 'Video',
    marketing: 'Marketing',
    fine_art: 'Fine Art',
    game: 'Game',
    graphic: 'Graphic Design',
    illustration: 'Illustration',
    jewellery: 'Jewellery Design',
    communication: 'Communication',
    photo: 'Photography',
    product: 'Product Design',
    theatre: 'Theatre',
    sculpture: 'Sculpture',
    textile: 'Textile',
    contemporary: 'Contemporary',
};

export function createCategories(dir: string): Promise<void> {
    const contents = JSON.stringify(CATEGORIES);

    fs.writeFileSync(`${dir}/categories.json`, contents);

    return Promise.resolve();
}

export function associateCategories(dir: string, submissions: RawSubmission[]): Promise<void> {
    return Promise.resolve();
}
