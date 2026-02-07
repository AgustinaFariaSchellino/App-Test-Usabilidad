
document.addEventListener('DOMContentLoaded', () => {
    // --- Cache/State Cleanup on Load ---
    console.log('🔄 Inicializando sistema - Limpiando estados previos...');
    if (window.clearCreateTestForm) window.clearCreateTestForm();

    const btnGenerate = document.getElementById('btn-generate-link');

    // --- Device Selector Animation ---
    const devicePill = document.getElementById('device-pill');
    const deviceInputs = document.querySelectorAll('input[name="device_type"]');

    if (devicePill && deviceInputs.length > 0) {
        function updatePill(input) {
            if (input.value === 'Web') {
                devicePill.classList.add('translate-x-full');
            } else {
                devicePill.classList.remove('translate-x-full');
            }
        }

        deviceInputs.forEach(input => {
            input.addEventListener('change', (e) => updatePill(e.target));
            // Initialize persistence or default state
            if (input.checked) updatePill(input);
        });
    }

    // --- Data Capture Logic ---
    function captureTestData() {
        const titleInput = document.getElementById('test-title');
        const descInput = document.getElementById('test-desc');
        const figmaInput = document.getElementById('figma-link');
        const questionsContainer = document.getElementById('questions-container');

        if (!titleInput || !figmaInput || !questionsContainer) {
            console.error('Critical form elements missing');
            return null;
        }

        // --- VALIDATION START ---
        const titleVal = titleInput.value.trim();
        // Description is now mandatory as per request
        // "También hagamos ahí un manejo de que sea obligatorio poner titulo, descripcion y enlace"
        const descVal = descInput ? descInput.value.trim() : '';
        const figmaVal = figmaInput.value.trim();

        if (!titleVal || !descVal || !figmaVal) {
            alert('Por favor completa todos los campos obligatorios: Título, Descripción y Enlace de Figma.');
            return null;
        }
        // --- VALIDATION END ---

        const questions = [];
        const inputs = questionsContainer.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                questions.push(input.value.trim());
            }
        });

        const idRaw = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const id = idRaw.trim();

        // --- ESTANDARIZACIÓN DE URL (SOLICITADA) ---
        const baseUrl = 'https://agustinafariaschellino.github.io/App-Test-Usabilidad/test-interface.html?id=';
        const urlFinal = baseUrl + id;

        const deviceType = document.querySelector('input[name="device_type"]:checked')?.value || 'App';

        const testData = {
            id: id,
            title: titleVal,
            description: descVal,
            tipo_dispositivo: deviceType,
            figmaLink: figmaVal,
            questions: questions,
            testLink: urlFinal, // URL Única y Final para n8n
            link: urlFinal,     // Alias para compatibilidad
            url: urlFinal,      // Alias muy probable
            createdAt: new Date().toISOString()
        };

        return testData;
    }

    // --- Persist and UI Feedback ---
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            const data = captureTestData();

            if (data) {
                // UI Feedback: Loading State
                const originalText = btnGenerate.innerHTML;
                const originalPointerEvents = btnGenerate.style.pointerEvents;

                // Debug Log Solicitado
                console.log('URL GENERADA PARA EL EXCEL:', data.testLink);
                console.log('Objeto final generado:', data);

                btnGenerate.innerHTML = '<svg class="animate-spin h-5 w-5 text-current inline-block mr-2 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Cargando...';
                btnGenerate.style.pointerEvents = 'none';
                btnGenerate.classList.add('opacity-70');

                try {
                    // WEBHOOK URL - Production
                    const WEBHOOK_URL = 'https://n8n-nube-jw30.onrender.com/webhook/crear-nuevo-test';

                    console.log('Enviando petición POST a:', WEBHOOK_URL);

                    // Petición con manejo de caché nulo
                    const response = await fetch(WEBHOOK_URL, {
                        method: 'POST',
                        mode: 'cors',
                        cache: 'no-store', // Cache Buster
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    // 1. Logging Técnico de Respuesta
                    console.log('Status Response:', response.status, response.statusText);

                    // 2. Validación Estricta
                    if (!response.ok) {
                        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
                    }

                    // 3. Éxito Real
                    console.log('✅ Confirmación de n8n recibida exitosamente.');

                    // Update UI using generated link from data object
                    const generatedUrl = data.testLink;

                    if (window.setGeneratedLink) window.setGeneratedLink(generatedUrl);
                    if (window.openSuccessModal) window.openSuccessModal();

                } catch (error) {
                    console.error('❌ Error Crítico al guardar:', error);
                    const errorMsg = '❌ Error: No se pudo guardar el test. Verifica tu conexión o que el servidor n8n esté activo.';
                    alert(errorMsg);

                } finally {
                    // Reset UI
                    btnGenerate.innerHTML = originalText;
                    btnGenerate.style.pointerEvents = originalPointerEvents;
                    btnGenerate.classList.remove('opacity-70');
                }
            }
        });
    }

    // --- Form Clearing Logic ---
    function clearForm() {
        const titleInput = document.getElementById('test-title');
        const descInput = document.getElementById('test-desc');
        const figmaInput = document.getElementById('figma-link');
        const questionsContainer = document.getElementById('questions-container');

        if (titleInput) titleInput.value = '';
        if (descInput) descInput.value = '';
        if (figmaInput) figmaInput.value = '';

        if (questionsContainer) {
            questionsContainer.innerHTML = '';
            if (window.addQuestion) {
                // Si existe la función global importada de questions.js (si así estuviera estructurado), usarla.
                // Pero aquí parece que questions.js maneja sus propios listeners o window exports.
                // Asumimos comportamiento manual por ahora para ser seguros.
                // window.addQuestion(); // Evitamos llamarlo ciegamente si no estamos seguros de su comportamiento "vacío"

                // Mejor recreamos el "estado inicial vacio" manualmente como en el else
                const div = document.createElement('div');
                div.className = "p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col gap-4 question-block";
                div.innerHTML = `<div class="flex justify-between items-start gap-4">
                        <div class="flex-1">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">PREGUNTA 1</label>
                            <input class="block w-full bg-white dark:bg-background-dark rounded-lg border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary py-2 px-3 text-base min-h-[44px]" value="" type="text" placeholder="Escribe tu pregunta aquí..."/>
                        </div>
                        <button class="btn-delete-question text-gray-400 hover:text-red-500 transition-colors p-1 mt-6" type="button"><span class="material-symbols-outlined">delete</span></button>
                    </div>`;
                questionsContainer.appendChild(div);
            } else {
                const div = document.createElement('div');
                div.className = "p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex flex-col gap-4 question-block";
                div.innerHTML = `<div class="flex justify-between items-start gap-4">
                        <div class="flex-1">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">PREGUNTA 1</label>
                            <input class="block w-full bg-white dark:bg-background-dark rounded-lg border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary py-2 px-3 text-base min-h-[44px]" value="" type="text" placeholder="Escribe tu pregunta aquí..."/>
                        </div>
                        <button class="btn-delete-question text-gray-400 hover:text-red-500 transition-colors p-1 mt-6" type="button"><span class="material-symbols-outlined">delete</span></button>
                    </div>`;
                questionsContainer.appendChild(div);
            }
            if (window.updateQuestionNumbers) window.updateQuestionNumbers();
        }
    }


    window.clearCreateTestForm = clearForm;
});
