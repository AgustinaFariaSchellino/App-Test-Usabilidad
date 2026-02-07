/**
 * responses.js
 * Lógica de carga y visualización de respuestas de feedback por test.
 * Integrado en index.html - sección #section-answers.
 */
document.addEventListener('DOMContentLoaded', () => {
    const sectionTestList = document.getElementById('section-test-list');
    const sectionAnswers = document.getElementById('section-answers');
    const answersTitle = document.getElementById('answers-title');
    const answersSubtitle = document.getElementById('answers-subtitle');
    const answersLoader = document.getElementById('answers-loader');
    const answersContent = document.getElementById('answers-content');
    const answersEmpty = document.getElementById('answers-empty');
    const answersError = document.getElementById('answers-error');
    const btnBackToTests = document.getElementById('btn-back-to-tests');
    const btnBackToTestsFooter = document.getElementById('btn-back-to-tests-footer');

    const TRAER_RESPUESTAS_URL = 'https://n8n-nube-jw30.onrender.com/webhook/traer-respuestas';

    // Exponer verResultados para que el botón pueda llamarla
    window.verResultados = function (testId) {
        if (!testId || !String(testId).trim()) {
            console.warn('verResultados: ID inválido');
            return;
        }
        sectionTestList.classList.add('hidden');
        sectionAnswers.classList.remove('hidden');
        loadResponses(String(testId).trim());
    };

    // Delegación: botón Resultados captura data-id y llama verResultados
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-resultados');
        if (!btn) return;
        e.preventDefault();
        const testId = (btn.dataset.id || '').trim();
        if (testId) window.verResultados(testId);
    });

    function closeResponses() {
        sectionAnswers.classList.add('hidden');
        sectionTestList.classList.remove('hidden');
    }

    function loadResponses(testId) {
        answersLoader.classList.remove('hidden');
        answersContent.classList.add('hidden');
        answersEmpty.classList.add('hidden');
        answersError.classList.add('hidden');

        const url = `${TRAER_RESPUESTAS_URL}?id=${encodeURIComponent(testId)}`;

        fetch(url, { cache: 'no-store' })
            .then(resp => {
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                return resp.json();
            })
            .then(data => {
                answersLoader.classList.add('hidden');
                const { title, questionsWithAnswers } = parseFeedbackData(data);
                answersTitle.textContent = title ? `Respuestas del test: ${title}` : 'Respuestas del test';
                answersSubtitle.textContent = 'Detalle de las respuestas abiertas y grabaciones de audio recolectadas.';

                if (!questionsWithAnswers || questionsWithAnswers.length === 0) {
                    answersEmpty.classList.remove('hidden');
                } else {
                    renderResponses(questionsWithAnswers);
                    answersContent.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error('Error cargando respuestas:', err);
                answersLoader.classList.add('hidden');
                answersError.classList.remove('hidden');
            });
    }

    /**
     * Parsea la respuesta de n8n.
     * Cada fila trae un campo 'Respuestas' que es un texto JSON.
     * Se usa JSON.parse() para convertirlo y agrupar por pregunta.
     */
    function parseFeedbackData(data) {
        let title = '';
        const questionMap = new Map(); // question -> [ { answer, timestamp?, ... } ]

        const rows = Array.isArray(data) ? data : (data?.data ? data.data : []);
        if (!Array.isArray(rows)) return { title: '', questionsWithAnswers: [] };

        rows.forEach((row, rowIndex) => {
            const rowTitle = row['Título'] || row.title || row.Title || '';
            if (rowTitle && !title) title = rowTitle;

            const respuestasRaw = row['Respuestas'] || row.respuestas || row.Respuestas || row.responses || '[]';
            let parsed = [];
            try {
                parsed = typeof respuestasRaw === 'string' ? JSON.parse(respuestasRaw) : respuestasRaw;
            } catch (e) {
                console.warn('Error parseando Respuestas en fila', rowIndex, e);
                return;
            }
            if (!Array.isArray(parsed)) parsed = [];

            const timestamp = row.timestamp || row.fecha || row.Timestamp || '';
            parsed.forEach((r, i) => {
                const q = r.question || r.pregunta || r.Question || `Pregunta ${i + 1}`;
                const a = r.answer || r.respuesta || r.Answer || r.answerText || '';
                if (!questionMap.has(q)) questionMap.set(q, []);
                questionMap.get(q).push({
                    answer: a,
                    timestamp,
                    isAudio: !!r.isAudio
                });
            });
        });

        const questionsWithAnswers = Array.from(questionMap.entries()).map(([question, answers]) => ({
            question,
            answers
        }));

        return { title, questionsWithAnswers };
    }

    /**
     * Renderiza cada pregunta con sus respuestas en tarjetas elegantes.
     */
    function renderResponses(questionsWithAnswers) {
        answersContent.innerHTML = questionsWithAnswers.map((item, i) => {
            const cardsHtml = item.answers.map(a => {
                const meta = a.timestamp ? `
                    <div class="mt-3 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        ${formatDate(a.timestamp)}
                    </div>
                ` : '';
                const audioBadge = a.isAudio ? `
                    <div class="mt-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-[18px]">mic</span>
                        <span class="text-xs font-semibold text-primary">Transcripción de audio</span>
                    </div>
                ` : '';
                return `
                    <div class="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm w-full">
                        <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">${escapeHtml(a.answer) || '<em class="text-gray-400">Sin respuesta</em>'}</p>
                        ${audioBadge}
                        ${meta}
                    </div>
                `;
            }).join('');

            return `
                <section class="w-full">
                    <div class="flex items-center gap-3 mb-4 sm:mb-6">
                        <span class="flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full h-6 w-6">${i + 1}</span>
                        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">${escapeHtml(item.question)}</h3>
                    </div>
                    <div class="space-y-4">${cardsHtml}</div>
                </section>
            `;
        }).join('');
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso);
            return isNaN(d) ? iso : d.toLocaleDateString('es-ES');
        } catch {
            return iso;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    if (btnBackToTests) btnBackToTests.onclick = closeResponses;
    if (btnBackToTestsFooter) btnBackToTestsFooter.onclick = closeResponses;
});
