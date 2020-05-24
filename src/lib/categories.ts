import axios from 'axios';

export interface Category {
    id: string;
    name: string;
}

export function fetchCategories(): Promise<Category[]> {
    return axios.get('/.netlify/functions/api/categories').then(response => {
        const categories: Category[] = response.data.data;

        return categories;
    });
}
