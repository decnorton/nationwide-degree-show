/**
 * A simple debounce function taken from https://davidwalsh.name/javascript-debounce-function
 *
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 */
export function debounce(func: Function, wait: number, immediate: boolean = false) {
    let timeout;

    return function () {
        const context = this, args = arguments;

        const later = () => {
            timeout = null;

            if (!immediate) {
                func.apply(context, args);
            }
        };

        const callNow = immediate && !timeout;

        clearTimeout(timeout);

        timeout = setTimeout(later, wait);

        if (callNow) {
            func.apply(context, args);
        }
    };
}
