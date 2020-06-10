import { Submission } from './submissions';

export function trackSubmissionView(submission: Submission) {
    if (!submission) {
        console.warn('Missing submission');
        return;
    }

    if (!('gtag' in window)) {
        console.warn('Missing gtag from window')
        return;
    }

    gtag('event', 'view_submission', {
        event_value: submission.id,
        event_label: `Submission: ${submission.name} [${submission.id}]`,
    });

    console.log('Using GA ID ' + window['gaMeasurementId']);

    gtag('config', window['gaMeasurementId'], {
        page_title: `Submission: ${submission.name} [${submission.id}]`,
        page_path: `/submissions/${submission.id}`
    });
}
