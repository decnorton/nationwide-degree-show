import Vue from 'vue';
import InfiniteLoading from 'vue-infinite-loading';
import VueLazyload from 'vue-lazyload';
import vSelect from 'vue-select'

import { fetchCategories } from './lib/categories';
import { fetchSubmissions } from './lib/submissions';
import { debounce } from './lib/utils/debounce';

if ('serviceWorker' in navigator) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.ts');
    });
}

Vue.use(VueLazyload)
Vue.use(InfiniteLoading, {
    slots: {
        // keep default styles
        noMore: `That's all for now`,
    }
});
Vue.component('v-select', vSelect);

// Register the submission modal component
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

            if (!this.selectedSubmission) {
                // Modal isn't showing
                const $target = $event.target;

                if ($target instanceof HTMLElement && $target.classList.contains('submission-cell')) {
                    if ($event.key === 'ArrowLeft' || $event.key === 'ArrowUp') {
                        const $previous = $target.previousElementSibling;

                        if ($previous instanceof HTMLElement) {
                            $event.preventDefault();
                            $previous.focus()
                        }
                    }

                    if ($event.key === 'ArrowRight' || $event.key === 'ArrowDown') {
                        const $next = $target.nextElementSibling;

                        if ($next instanceof HTMLElement) {
                            $event.preventDefault();
                            $next.focus();
                        }
                    }
                }

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

        this._resizeListener = debounce(() => {
            // Make sure the details width matches the image.
            this.matchDetailsWithImage();

            // Force submission cell styles to be recalculated when the window is resized.
            this.$forceUpdate();
        }, 100);

        window.addEventListener('resize', this._resizeListener);
    },

    beforeDestroy() {
        document.removeEventListener('keydown', this._keyListener);
    },

    methods: {
        applyCategoryFilter() {
            const category = this.selectedCategory;

            if (category) {
                this.submissions = this.allSubmissions.filter(submission => submission.categories.includes(category.value));
            } else {
                this.submissions = this.allSubmissions;
            }
        },

        changeSize(amount: number) {
            const newSize = this.size + amount;

            // Clamp to 100-500
            this.size = Math.max(100, Math.min(500, newSize));

            localStorage.setItem('size', String(this.size));

            this.fetch();
        },

        fetch($state?) {
            fetchSubmissions(this.page)
                .then(submissions => {
                    if (submissions.length) {
                        this.page++;

                        this.allSubmissions.push(...submissions);

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

        submissionStyle(submission) {
            if (window.innerWidth > 420) {
                return {
                    'width': this.size * submission.ratio + 'px',
                    'max-height': this.size + 'px',
                    background: submission.colour
                };
            } else {
                return {};
            }
        },

        matchDetailsWithImage() {
            // Each time an image is loaded, make sure the submission details are the same width as the image (bloody designers).
            const $selectedSubmissionImage = this.$refs.selectedSubmissionImage;
            const $selectedSubmissionDetails = this.$refs.selectedSubmissionDetails;

            if ($selectedSubmissionImage && $selectedSubmissionDetails) {
                $selectedSubmissionDetails.style.width = `${$selectedSubmissionImage.clientWidth}px`;
            }
        }
    }
});

// Add a global direct to add a `visible` class to elements once they become visible on the page.
if ('IntersectionObserver' in window) {
    Vue.directive('intersect', {
        // When the bound element is inserted into the DOM...
        inserted: (el) => {
            if (!el) {
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
}

console.log('Find out how this site was built @ https://github.com/freshmeet-uk/nationwide-degree-show');
