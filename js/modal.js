
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('success-modal');
    const btnOpenModal = document.getElementById('btn-generate-link');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const inputLink = document.getElementById('test-link-input');

    function openModal() {
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');

            // Clear form if function exists
            if (window.clearCreateTestForm) {
                window.clearCreateTestForm();
            }

            // Redirect to "Mis pruebas" (testList)
            if (window.switchView) {
                window.switchView('testList');
            }
        }
    }

    function copyLink() {
        if (inputLink) {
            inputLink.select();
            inputLink.setSelectionRange(0, 99999); // For mobile devices
            navigator.clipboard.writeText(inputLink.value).then(() => {
                const originalText = btnCopyLink.innerHTML;
                // Visual feedback could go here
            });
        }
    }

    function setGeneratedLink(url) {
        if (inputLink) {
            inputLink.value = url;
        }
    }

    // Expose functions for create-test.js
    window.openSuccessModal = openModal;
    window.setGeneratedLink = setGeneratedLink;

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeModal);
    }

    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', copyLink);
    }
});
