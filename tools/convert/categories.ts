const fs = require('fs');

import { RawSubmission } from './submissions';

export const RAW_CATEGORIES = {
    advertising: 'Advertising',
    animation: 'Animation',
    architecture: 'Architecture & Set Design',
    branding: 'Branding',
    ceramics: 'Ceramics',
    communication: 'Communication',
    contemporary: 'Contemporary',
    costume: 'Costume Design',
    decorative: 'Decorative',
    fashion: 'Fashion',
    film: 'Film',
    fine_art: 'Fine Art',
    game: 'Game',
    graphic: 'Graphic Design',
    illustration: 'Illustration',
    jewellery: 'Jewellery Design',
    marketing: 'Marketing',
    packaging: 'Packaging',
    photo: 'Photography',
    product: 'Product Design',
    sculpture: 'Sculpture',
    textile: 'Textile',
    theatre: 'Theatre',
    video: 'Video',
};


// Advertising
// Animation
// Architecture + Set Design (Theatre)
// Branding (Packaging)
// Ceramics
// Fashion & Textiles (Costume)
// Film (video)
// Fine Art (Contemporary, Sculpture)
// Game Design
// Graphic Design (Marketing, communication)
// Illustration
// Jewellery
// Photography
// Product Design


export const CATEGORIES = {
    advertising: 'Advertising',
    animation: 'Animation',
    architecture_and_set_design: 'Architecture & Set Design',
    branding_and_packaging: 'Branding & Packaging',
    ceramics: 'Ceramics',
    fashion_and_costume_design: 'Fashion, Textiles & Costume Design',
    film_and_video: 'Film',
    fine_art: 'Fine Art',
    game: 'Game Design',
    graphic_design: 'Graphic Design & Marketing',
    illustration: 'Illustration',
    jewellery: 'Jewellery Design',
    photo: 'Photography',
    product: 'Product Design',
};

export function createCategories(dir: string): Promise<void> {
    const contents = JSON.stringify(CATEGORIES);

    fs.writeFileSync(`${dir}/categories.json`, contents);

    return Promise.resolve();
}

export function associateCategories(dir: string, submissions: RawSubmission[]): Promise<void> {
    return Promise.resolve();
}
