import axios from 'axios';

export interface Submission {
    id: string;
    name: string;
    description: string;
    website: string;
    instagram: string;
    categories: string[];
}

export function fetchSubmissions(page: number): Promise<Submission[]> {
    return axios.get('/.netlify/functions/api/submissions', {
        params: {
            page
        }
    })
        .then(response => response.data.data);
}
