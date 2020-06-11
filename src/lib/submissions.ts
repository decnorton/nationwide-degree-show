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
    // Page is specified in the path so we can make use of Netlify's caching of
    // functions (which breaks if query params are used).
    return axios.get(`/.netlify/functions/api/submissions/${page}`)
        .then(response => response.data.data);
}
