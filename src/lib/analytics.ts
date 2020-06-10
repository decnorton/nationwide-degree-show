import { Submission } from './submissions';

export function trackSubmissionView(submission: Submission) {
    if (!submission || !('gtag' in window)) {
        return;
    }

    gtag('event', 'view_item', {
        type: 'submission',
        submission_id: submission.id,
        name: `Submission: ${submission.name} [${submission.id}]`,
    });

    gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: `Submission: ${submission.name} [${submission.id}]`,
        page_path: `/submissions/${submission.id}`
    });
}
