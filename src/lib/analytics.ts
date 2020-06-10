import { Submission } from './submissions';

export function trackSubmissionView(submission: Submission) {
    if (!submission || !('gtag' in window)) {
        return;
    }

    gtag('event', 'view_submission', {
        event_value: submission.id,
        event_label: `Submission: ${submission.name} [${submission.id}]`,
    });

    gtag('config', window['gaMeasurementId'], {
        page_title: `Submission: ${submission.name} [${submission.id}]`,
        page_path: `/submissions/${submission.id}`
    });
}
