const VIEWS = {
    '/': 'viewHome',
    '/history': 'viewHistory',
    '/library': 'viewLibrary',
    '/quiz': 'viewQuiz'
};

const ROUTE_HANDLERS = {};

export function onRoute(route, handler) {
    ROUTE_HANDLERS[route] = handler;
}

export function getRouteFromHash() {
    const hash = window.location.hash.replace('#', '') || '/';
    if (hash.startsWith('/history')) return '/history';
    if (hash.startsWith('/library')) return '/library';
    if (hash.startsWith('/quiz')) return '/quiz';
    return '/';
}

export function navigateTo(route) {
    Object.entries(VIEWS).forEach(([r, viewId]) => {
        const el = document.getElementById(viewId);
        if (el) el.classList.toggle('hidden', r !== route);
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.dataset.route === route);
    });

    if (ROUTE_HANDLERS[route]) {
        ROUTE_HANDLERS[route]();
    }

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

export function initRouter() {
    window.addEventListener('hashchange', () => navigateTo(getRouteFromHash()));
    navigateTo(getRouteFromHash());
}

export function goHome() {
    window.location.hash = '#/';
}
