
document.addEventListener('DOMContentLoaded', () => {

    // --- Selectors ---
    const views = {
        home: document.getElementById('section-home'),
        createTest: document.getElementById('section-create-test'),
        testList: document.getElementById('section-test-list')
    };

    const buttons = {
        homeCreateTest: document.getElementById('btn-create-test-home'),
        backToHome: document.getElementById('btn-back-to-home')
    };

    // --- Navigation Functions ---

    function updateHeaderActiveState(viewId) {
        const btnMisPruebas = document.getElementById('btn-mis-pruebas');
        if (!btnMisPruebas) return;

        if (viewId === 'testList') {
            btnMisPruebas.classList.add('active');
            btnMisPruebas.classList.remove('text-[#94a3b8]');
            btnMisPruebas.classList.add('text-primary');
        } else {
            btnMisPruebas.classList.remove('active');
            btnMisPruebas.classList.add('text-[#94a3b8]');
            btnMisPruebas.classList.remove('text-primary');
        }
    }

    function switchView(targetViewId) {
        updateHeaderActiveState(targetViewId);

        // 1. Identify current active view
        let currentView = null;
        for (const key in views) {
            if (!views[key].classList.contains('hidden') && !views[key].classList.contains('fade-out')) {
                currentView = views[key];
                break;
            }
        }

        const targetView = views[targetViewId];
        if (!targetView || targetView === currentView) return;

        // 2. Fade out current view
        if (currentView) {
            currentView.classList.add('fade-out');

            // Wait for transition to finish before hiding and showing new view
            setTimeout(() => {
                currentView.classList.add('hidden');
                currentView.classList.remove('fade-out'); // Reset for next time

                // 3. Show and Fade in new view
                targetView.classList.remove('hidden');
                // Force reflow to enable transition? Not strictly needed if starting from opacity 1 default state but logic might need tweak if we want fade-in effect.
                // Actually, CSS says .view-section { opacity: 1 }. 
                // To fade IN, we might need it to start at opacity 0.
                // Let's adjust logic: 
                // Target starts hidden (opacity 1 by default CSS, but display none).
                // Remove hidden -> it appears instantly.
                // To fade in: Add 'fade-out' (opacity 0) BEFORE removing hidden.
                // Then remove 'fade-out' to animate to opacity 1.

                targetView.classList.add('fade-out');
                targetView.classList.remove('hidden');

                // Small delay to allow DOM to register the class state before removing it for transition
                requestAnimationFrame(() => {
                    targetView.classList.remove('fade-out');
                });

                window.scrollTo(0, 0);

            }, 300); // Match CSS transition time
        } else {
            // No current view (initial load?), just show target
            targetView.classList.remove('hidden');
        }
    }
    window.switchView = switchView;

    // Initial State Check
    updateHeaderActiveState('home');

    // --- Event Listeners ---

    // 1. Static Buttons
    if (buttons.homeCreateTest) {
        buttons.homeCreateTest.addEventListener('click', () => switchView('createTest'));
    }

    if (buttons.backToHome) {
        buttons.backToHome.addEventListener('click', () => switchView('home'));
    }

    // 2. Header Buttons (Event Delegation)
    document.addEventListener('click', (e) => {
        // Handle "Nuevo test" button
        if (e.target.closest('#header-btn-new-test')) {
            e.preventDefault();
            switchView('createTest');
        }

        // Handle "Mis pruebas" button
        if (e.target.closest('#btn-mis-pruebas')) {
            e.preventDefault();
            switchView('testList');
        }

        // Handle Back button
        if (e.target.closest('#btn-back-to-home')) {
            e.preventDefault();
            switchView('home');
        }

        // Handle Logo click
        if (e.target.closest('#header-link-home')) {
            e.preventDefault();
            switchView('home');
        }
    });

});
