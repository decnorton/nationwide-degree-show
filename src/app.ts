import Vue from 'vue';
import InfiniteLoading from 'vue-infinite-loading';
import vSelect from 'vue-select'

import { fetchCategories } from './lib/categories';
import { fetchSubmissions } from './lib/submissions';

Vue.use(InfiniteLoading, {});
Vue.component('v-select', vSelect)

const categorySelect = new Vue({
    el: '.category-select',
    data: {
        categories: []
    },
    created() {
        fetchCategories().then(categories => {
            return this.categories = Object.entries(categories)
                // Convert the object into an array
                .map(([value, label]) => ({ label, value }));
        });
    }
});

const submissions = new Vue({
    el: '.submissions-grid-container',
    data: {
        size: 300,
        page: 1,
        submissions: []
    },
    created() {

    },
    methods: {
        infiniteHandler($state) {
            console.log($state);

            fetchSubmissions(this.page)
                .then(submissions => {
                    if (submissions.length) {
                        this.page++;

                        this.submissions.push(...submissions);
                        $state.loaded();
                    } else {
                        $state.complete();
                    }
                });

            // axios.get(api, {
            //     params: {
            //         page: this.page,
            //     },
            // }).then(({ data }) => {
            //     if (data.hits.length) {
            //         this.page += 1;
            //         this.list.push(...data.hits);
            //         $state.loaded();
            //     } else {
            //         $state.complete();
            //     }
            // });
        },
    }
})
