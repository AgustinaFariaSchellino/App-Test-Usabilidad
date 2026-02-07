
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('questions-container');
    const btnAdd = document.getElementById('btn-add-question');

    // Function to update question numbers
    function updateQuestionNumbers() {
        if (!container) return;
        const questions = container.querySelectorAll('.question-block'); // We need to ensure we target correctly
        // Since we didn't add the class 'question-block' to the existing one in the HTML edit (only ID to container), 
        // let's rely on the structure or add the class in the template.
        // Actually, let's select children of container.
        Array.from(container.children).forEach((child, index) => {
            const label = child.querySelector('label');
            if (label) {
                label.textContent = `PREGUNTA ${index + 1}`;
            }
        });
    }

    // Function to add a new question
    function addQuestion() {
        if (!container) return;

        const count = container.children.length + 1;
        const div = document.createElement('div');
        // Match the exact classes of the existing question block
        div.className = "p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col gap-4 question-block";

        div.innerHTML = `
            <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">PREGUNTA ${count}</label>
                    <input class="block w-full bg-white dark:bg-background-dark rounded-lg border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary py-2 px-3 text-base min-h-[44px]" placeholder="Escribe tu pregunta aquí..." type="text"/>
                </div>
                <button class="btn-delete-question text-gray-400 hover:text-red-500 transition-colors p-1 mt-6" type="button">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;

        container.appendChild(div);
        // Focus the new input
        const input = div.querySelector('input');
        if (input) input.focus();
    }

    // Function to handle delete
    function handleDelete(e) {
        // Use event delegation
        const btnDelete = e.target.closest('.btn-delete-question');
        if (btnDelete) {
            // Find the parent block (the div directly inside container)
            // The button is inside div > div > div.question-block? No.
            // Structure: container > div.question-block > div.flex > button
            // So we need to find the specific ancestor that is a direct child of container, OR just the .question-block class
            const questionBlock = btnDelete.closest('.bg-gray-50'); // The main wrapper has this class
            if (questionBlock) {
                questionBlock.remove();
                updateQuestionNumbers();
            }
        }
    }

    // Expose for external use
    window.updateQuestionNumbers = updateQuestionNumbers;
    window.addQuestion = addQuestion;

    // Event Listeners
    if (btnAdd) {
        btnAdd.addEventListener('click', addQuestion);
    }

    if (container) {
        container.addEventListener('click', handleDelete);
    }
});
