import { Database } from 'sqlite3';
import { Submission } from './submissions';

export const CATEGORIES = {
    advertising: 'Advertising',
    animation: 'Animation',
    architecture_set_design: 'Architecture & Set Design',
    branding_packaging: 'Branding & Packaging',
    ceramics: 'Ceramics',
    fashion_costume_design: 'Fashion & Costume Design',
    film: 'Film',
    fine_art: 'Fine Art',
    game_design: 'Game design',
    graphic_design: 'Graphic Design',
    illustration: 'Illustration',
    jewelry_design: 'Jewelry Design',
    miscellaneous: 'Miscellaneous ',
    photography: 'Photography',
    product_design: 'Product Design',
    textiles: 'Textiles',
};

export function createCategories(db: Database): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            const statement = db.prepare(`
                insert into categories(id, name)
                values
                    (?, ?)
            `);

            for (const [id, name] of Object.entries(CATEGORIES)) {
                statement.run([id, name]);
            }

            statement.finalize(error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    });
}

export function associateCategories(db: Database, submissions: Submission[]): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            const statement = db.prepare(`
                insert into submission_categories(submission_id, category_id)
                values
                    (?, ?)
            `);

            submissions.forEach(submission => {
                // Figure out which categories this submission belongs to
                const submissionCategories = Object.keys(CATEGORIES).filter(key => submission[key]);

                submissionCategories.forEach(category => {
                    statement.run([
                        submission.id,
                        category
                    ]);
                });
            })
        });
    });
}
