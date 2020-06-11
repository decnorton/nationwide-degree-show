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

    gtag('event', 'view', {
        event_category: 'submissions',
        event_value: submission.id,
        event_label: `Submission: ${submission.name} [${submission.id}]`,
    });
    
    gtag('config', window['gaMeasurementId'], {
        page_title: `Submission: ${submission.name}`,
        page_path: `/submissions/${submission.id}`
    });
}
