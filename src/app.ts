import Vue from 'vue';
import InfiniteLoading from 'vue-infinite-loading';
import VueLazyload from 'vue-lazyload';
import vSelect from 'vue-select'

import { fetchCategories } from './lib/categories';
import { fetchSubmissions } from './lib/submissions';

Vue.use(VueLazyload)
Vue.use(InfiniteLoading, {
    slots: {
        // keep default styles
        noMore: `That's all for now`,
    }
});
Vue.component('v-select', vSelect);

// register modal component
Vue.component('submission-modal', {
    template: '#submission-modal',
    props: ['showing'],
});

const app = new Vue({
    el: '#app',
    data: {
        size: 300,
        page: 1,
        categories: [],
        submissions: [],
        allSubmissions: [],

        selectedSubmission: null,
        selectedCategory: null,

        infiniteId: +new Date(),
    },

    watch: {
        selectedCategory() {
            localStorage.setItem('category', JSON.stringify(this.selectedCategory));

            this.applyCategoryFilter();
        }
    },

    mounted() {
        this.size = Number(localStorage.getItem('size')) || this.size;
        this.selectedCategory = JSON.parse(localStorage.getItem('category'));

        this._keyListener = function ($event: KeyboardEvent) {
            if ($event.key === 'ArrowDown') {
                $event.preventDefault();

                document.scrollingElement.scrollBy({
                    top: this.size * 2
                });
            }

            if (!this.selectedSubmission) {
                return;
            }

            if ($event.key === 'Escape') {
                $event.preventDefault();
                this.selectedSubmission = null;
            }

            if ($event.key === 'ArrowLeft') {
                $event.preventDefault();
                this.previousSubmission();
            }

            if ($event.key === 'ArrowRight') {
                $event.preventDefault();
                this.nextSubmission();
            }
        };

        document.addEventListener('keydown', this._keyListener.bind(this));

        fetchCategories().then(categories => {
            return this.categories = Object.entries(categories)
                // Convert the object into an array
                .map(([value, label]) => ({ label, value }));
        });
    },

    beforeDestroy() {
        document.removeEventListener('keydown', this._keyListener);
    },

    methods: {
        applyCategoryFilter() {
            const category = this.selectedCategory;

            if (category) {
                this.submissions.length = 0;
                this.submissions.push(...this.allSubmissions.filter(submission => {
                    return submission.categories.includes(category.value);
                }));
            } else {
                this.submissions.length = 0;
                this.submissions.push(...this.allSubmissions);
            }
        },

        changeSize(size: number) {
            this.size = size;

            localStorage.setItem('size', String(size));

            this.fetch();
        },

        fetch($state?) {
            fetchSubmissions(this.page)
                .then(submissions => {
                    if (submissions.length) {
                        this.page++;

                        this.allSubmissions.push(...submissions);
                        this.submissions.push(...submissions);

                        this.applyCategoryFilter();

                        $state?.loaded();
                    } else {
                        $state?.complete();
                    }
                });
        },

        nextSubmission() {
            const currentIndex = this.submissions.indexOf(this.selectedSubmission);

            const max = this.submissions.length - 1;
            const nextIndex = currentIndex + 1;

            this.selectedSubmission = this.submissions[Math.min(nextIndex, max)];

            // Fetch the next page when we've got 3 from the end
            if (nextIndex >= max - 3) {
                this.fetch();
            }
        },
        previousSubmission() {
            const currentIndex = this.submissions.indexOf(this.selectedSubmission);

            this.selectedSubmission = this.submissions[Math.max(currentIndex - 1, 0)];

            this.infiniteId += 1;
        },
    }
});

// Register a global custom directive called `v-focus`
Vue.directive('intersect', {
    // When the bound element is inserted into the DOM...
    inserted: (el) => {
        if (!el || !('IntersectionObserver' in window)) {
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.filter(e => e.isIntersecting).forEach(entry => {
                entry.target.classList.add('visible');
            });
        });

        this.observer?.observe(el);
    },

    unbind: () => {
        this.observer?.disconnect();
    },
});

if ('serviceWorker' in navigator) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.ts');
    });
}
