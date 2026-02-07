
document.addEventListener('DOMContentLoaded', () => {
    const views = {
        welcome: document.getElementById('view-welcome'),
        prototype: document.getElementById('view-prototype'),
        questions: document.getElementById('view-questions'),
        finish: document.getElementById('view-finish')
    };

    const buttons = {
        start: document.getElementById('btn-start-testing'), // ID to be added to index.html
        finishPrototype: document.getElementById('btn-finish-prototype'), // ID to be added
        submitQuestions: document.getElementById('btn-submit-questions') // ID to be added
    };

    function switchView(targetViewId) {
        // Find current active view
        let currentView = null;
        for (const key in views) {
            if (!views[key].classList.contains('hidden') && !views[key].classList.contains('fade-out')) {
                currentView = views[key];
                break;
            }
        }

        const targetView = views[targetViewId];
        if (!targetView || targetView === currentView) return;

        if (currentView) {
            currentView.classList.add('fade-out');
            setTimeout(() => {
                currentView.classList.add('hidden');
                currentView.classList.remove('fade-out');

                targetView.classList.remove('hidden');
                targetView.classList.add('fade-out');

                requestAnimationFrame(() => {
                    targetView.classList.remove('fade-out');
                });
                window.scrollTo(0, 0);
            }, 300);
        } else {
            targetView.classList.remove('hidden');
        }
    }

    if (buttons.start) {
        buttons.start.addEventListener('click', () => switchView('prototype'));
    }

    if (buttons.finishPrototype) {
        buttons.finishPrototype.addEventListener('click', () => switchView('questions'));
    }

    if (buttons.submitQuestions) {
        buttons.submitQuestions.addEventListener('click', () => switchView('finish'));
    }
});
