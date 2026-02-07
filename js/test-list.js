
document.addEventListener('DOMContentLoaded', () => {
    const listSection = document.getElementById('section-test-list');

    // --- 1. Definición de Templates (HTML Strings) ---
    const ROW_TEMPLATE = (test) => `
        <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
            <td class="px-6 py-4">
                <span class="font-semibold text-gray-900 dark:text-white">${test.title}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                ${test.date}
            </td>
            <td class="px-6 py-4">
                <a class="text-primary hover:underline flex items-center gap-1 text-sm font-medium" href="${test.link}" target="_blank">
                    <span class="material-symbols-outlined text-[18px]">link</span> Ver test
                </a>
            </td>
            <td class="px-6 py-4">
                <button type="button" class="btn-resultados flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer" data-id="${test.id || ''}">
                    <span class="material-symbols-outlined text-[18px]">description</span> Resultados
                </button>
            </td>
        </tr>
    `;

    const CARD_TEMPLATE = (test) => `
        <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col gap-4">
            <div>
                <h3 class="font-semibold text-base text-gray-900 dark:text-white mb-1">${test.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">${test.date}</p>
            </div>
            <div class="flex flex-col gap-3">
                <a class="flex items-center justify-center gap-2 min-h-[44px] rounded-lg border border-primary/30 text-primary font-bold text-base px-4 py-3 hover:bg-primary/5 transition-colors" href="${test.link}" target="_blank">
                    <span class="material-symbols-outlined text-[20px]">link</span> Ver test
                </a>
                <button type="button" class="btn-resultados flex items-center justify-center gap-2 min-h-[44px] rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:text-green-700 font-bold text-base px-4 py-3 transition-colors cursor-pointer" data-id="${test.id || ''}">
                    <span class="material-symbols-outlined text-[20px]">description</span> Resultados
                </button>
            </div>
        </div>
    `;

    const LOADER_SVG = `<svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

    const LOADER_TEMPLATE = `
        <tr>
            <td colspan="4" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                <div class="flex flex-col items-center justify-center gap-3">
                    ${LOADER_SVG}
                    <p class="text-sm font-medium">Cargando...</p>
                </div>
            </td>
        </tr>
    `;

    const LOADER_CARD = `
        <div class="flex flex-col items-center justify-center py-16 gap-4 text-gray-500 dark:text-gray-400">
            ${LOADER_SVG}
            <p class="text-sm font-medium text-center px-4">Cargando...</p>
        </div>
    `;

    const ERROR_TEMPLATE = (msg) => `
        <tr>
            <td colspan="4" class="px-6 py-8 text-center text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/10 rounded-lg">
                ${msg}
            </td>
        </tr>
    `;

    const ERROR_CARD = (msg) => `
        <div class="py-8 text-center text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/10 rounded-xl px-4">
            ${msg}
        </div>
    `;

    const INFO_TEMPLATE = (msg) => `
        <tr>
            <td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">
                ${msg}
            </td>
        </tr>
    `;

    const INFO_CARD = (msg) => `
        <div class="py-8 text-center text-gray-500 dark:text-gray-400 italic rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6">
            ${msg}
        </div>
    `;

    // --- 2. Lógica de Petición ---
    async function fetchWithTimeout(resource, options = {}) {
        const { timeout = 5000 } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    // --- 3. Función Principal de Carga ---
    async function loadTests() {
        const tbody = listSection.querySelector('tbody');
        const cardsContainer = listSection.querySelector('#test-list-cards');
        if (!tbody) return;

        tbody.innerHTML = LOADER_TEMPLATE;
        if (cardsContainer) cardsContainer.innerHTML = LOADER_CARD;

        const API_URL = 'https://n8n-nube-jw30.onrender.com/webhook/consultar-tests';
        console.log('Enviando petición GET a:', API_URL);

        try {
            // Petición con 5s de timeout y sin caché
            const response = await fetchWithTimeout(API_URL, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                headers: { 'Accept': 'application/json' },
                timeout: 5000
            });

            if (!response.ok) {
                throw new Error(`Status Code: ${response.status}`);
            }

            const data = await response.json();

            // Diagnóstico
            console.log('Datos recibidos de n8n:', data);

            // Validar arreglo
            if (Array.isArray(data) && data.length > 0) {
                // Limpiar loader de tabla y de cards (mobile)
                tbody.innerHTML = '';
                if (cardsContainer) cardsContainer.innerHTML = '';

                const mappedList = data.map(item => {
                    const rawDate = item['Fecha de Creación'] || item.createdAt || item.fecha || item.date;
                    let dateDisplay = 'Fecha desconocida';
                    let dateSort = new Date(0);
                    if (rawDate) {
                        try {
                            const d = new Date(rawDate);
                            if (!isNaN(d)) {
                                dateDisplay = d.toLocaleDateString('es-ES');
                                dateSort = d;
                            } else {
                                dateDisplay = rawDate;
                            }
                        } catch (e) {
                            dateDisplay = rawDate;
                        }
                    }

                    const mapped = {
                        id: item.id || item.ID || item['ID'] || item['id_test'] || '',
                        title: item['Título'] || item.title || item.nombre || 'Test sin título',
                        date: dateDisplay,
                        dateSort,
                        link: item['URL del test'] || item.link || item.url || '#'
                    };

                    if (mapped.link === '#' && item.id) {
                        mapped.link = `https://agustinafariaschellino.github.io/App-Test-Usabilidad/?id=${item.id}`;
                    }

                    return mapped;
                });

                // Ordenar de más reciente a más antiguo (por fecha de creación)
                mappedList.sort((a, b) => b.dateSort - a.dateSort);

                mappedList.forEach(mapped => {
                    tbody.insertAdjacentHTML('beforeend', ROW_TEMPLATE(mapped));
                    if (cardsContainer) cardsContainer.insertAdjacentHTML('beforeend', CARD_TEMPLATE(mapped));
                });

            } else {
                console.log('Conexión exitosa, pero array vacío.');
                tbody.innerHTML = INFO_TEMPLATE('ℹ️ No hay pruebas registradas en este momento.');
                if (cardsContainer) cardsContainer.innerHTML = INFO_CARD('ℹ️ No hay pruebas registradas en este momento.');
            }

        } catch (error) {
            console.error('❌ Error detallado en loadTests:', error);

            const errorMsg = '❌ Error: No se pudo conectar con la base de datos (Timeout/Red). Verifica tu conexión o intenta más tarde.';
            tbody.innerHTML = ERROR_TEMPLATE(errorMsg);
            if (cardsContainer) cardsContainer.innerHTML = ERROR_CARD(errorMsg);
        }
    }

    // --- 4. Activación (Observer) ---
    if (listSection) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!listSection.classList.contains('hidden')) {
                        loadTests();
                    }
                }
            }
        });

        observer.observe(listSection, { attributes: true });

        if (!listSection.classList.contains('hidden')) {
            loadTests();
        }
    }
});
