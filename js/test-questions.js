/**
 * test-questions.js
 * Motor dinámico para la Sección de Feedback Final.
 * Lee el ID de la URL, obtiene datos de n8n, renderiza preguntas y envía respuestas.
 */
document.addEventListener('DOMContentLoaded', () => {
    let testTitle = '';

    // Captura y limpieza del ID (sin espacios ni caracteres extraños)
    const idRaw = new URLSearchParams(window.location.search).get('id');
    const id = idRaw ? idRaw.trim().replace(/\s/g, '') : null;

    console.log('📍 [test-questions] ID capturado:', JSON.stringify(id), '| URL:', window.location.href);

    if (!id) {
        showError('ID no encontrado en la URL.');
        return;
    }

    const QUESTIONS_ENDPOINT = `https://n8n-nube-jw30.onrender.com/webhook/test-especifico?id=${encodeURIComponent(id)}&t=${Date.now()}`;
    const RESPONSES_ENDPOINT = 'https://n8n-nube-jw30.onrender.com/webhook/guardar-feedback';
    const AUDIO_WEBHOOK = 'https://n8n-nube-jw30.onrender.com/webhook/receptor-audio';

    const viewQuestions = document.getElementById('view-questions');
    const viewFinish = document.getElementById('view-finish');
    const questionsLoader = document.getElementById('questions-loader');
    const questionsFormWrapper = document.getElementById('questions-form-wrapper');
    const questionsFormContent = document.getElementById('questions-form-content');
    const btnSubmit = document.getElementById('btn-submit-questions');

    loadTest();

    function loadTest() {
        console.log('🌍 [test-questions] Fetching:', QUESTIONS_ENDPOINT);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        fetch(QUESTIONS_ENDPOINT, { cache: 'no-store', signal: controller.signal })
            .then(resp => {
                clearTimeout(timeoutId);
                const status = resp.status;
                const statusText = resp.statusText;
                console.log('📡 [test-questions] Respuesta n8n - Status:', status, statusText, '| OK:', resp.ok);

                if (!resp.ok) {
                    return resp.text().then(body => {
                        console.error('❌ [test-questions] Cuerpo de error:', body);
                        throw new Error(`HTTP ${status} ${statusText}`);
                    });
                }
                return resp.json();
            })
            .then(data => {
                console.log('📦 [test-questions] Data recibida (cruda):', data);
                console.log('📦 [test-questions] ¿Es array?:', Array.isArray(data), '| longitud:', Array.isArray(data) ? data.length : 'N/A');

                // Si n8n devuelve array, tomar el primer elemento
                const item = Array.isArray(data) && data.length > 0 ? data[0] : data;
                if (!item) {
                    console.warn('⚠️ [test-questions] Data vacía o inválida');
                    showFinishDirectly();
                    return;
                }

                testTitle = item.Title || item.Título || item.title || '';
                const questions = parseQuestions(item);
                if (!questions || questions.length === 0) {
                    showFinishDirectly();
                } else {
                    renderQuestions(questions);
                    showQuestionsView();
                }
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.error('❌ [test-questions] Error:', err.message, '| AbortTimeout:', err.name === 'AbortError');
                showError(err.name === 'AbortError' ? 'La solicitud tardó demasiado. Verificá que n8n esté activo.' : 'No se pudo cargar el test. Verificá el ID o tu conexión.', true);
            });
    }

    function parseQuestions(data) {
        if (!data) return [];
        const raw = data['Preguntas (JSON)'] || data.questions || data.Preguntas || [];
        if (Array.isArray(raw)) return raw.filter(q => typeof q === 'string' && q.trim());
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed.filter(q => typeof q === 'string' && q.trim()) : [];
            } catch {
                return [];
            }
        }
        return [];
    }

    function renderQuestions(questions) {
        questionsFormContent.innerHTML = questions.map((q, i) => `
            <div class="question-card p-6 rounded-xl shadow-sm border border-[#e5e7eb] dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-4" data-question-index="${i}">
                <h2 class="text-[#111418] dark:text-white text-xl font-bold">${i + 1}. ${escapeHtml(q)}</h2>
                <div class="flex flex-col gap-3">
                    <textarea
                        data-question-index="${i}"
                        data-question="${escapeHtml(q)}"
                        class="answer-textarea w-full rounded-lg border-[#dbe0e6] dark:border-gray-700 bg-transparent dark:text-white focus:ring-primary focus:border-primary min-h-[100px] text-sm p-3"
                        placeholder="Escribe tu respuesta aquí..."></textarea>
                    <div class="audio-control-wrapper flex justify-end transition-all duration-300 ease-in-out max-w-full">
                        <div class="btn-audio-initial">
                            <button type="button" class="btn-grabar-audio flex items-center gap-2 rounded-lg h-10 px-4 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors cursor-pointer" data-question-index="${i}">
                                <span class="material-symbols-outlined text-[18px]">mic</span>
                                Grabar Audio
                            </button>
                        </div>
                        <div class="btn-audio-recording hidden w-full rounded-xl p-4 bg-[#FEE2E2] dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3" data-question-index="${i}">
                            <span class="text-red-600 dark:text-red-400 font-bold text-sm">Grabando...</span>
                            <button type="button" class="btn-detener-grabacion flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors cursor-pointer shrink-0" data-question-index="${i}">
                                <span class="material-symbols-outlined text-[18px]">stop</span>
                                Detener Grabación
                            </button>
                        </div>
                        <div class="btn-audio-processing hidden w-full">
                            <button type="button" disabled class="flex items-center justify-center gap-2 rounded-lg h-10 px-4 w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-bold cursor-not-allowed">
                                <span class="material-symbols-outlined text-[18px]">hourglass_empty</span>
                                Procesando voz...
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        bindAudioHandlers();
    }

    let mediaRecorder = null;
    let audioChunks = [];
    let currentStream = null;

    function bindAudioHandlers() {
        document.addEventListener('click', (e) => {
            const btnGrabar = e.target.closest('.btn-grabar-audio');
            const btnDetener = e.target.closest('.btn-detener-grabacion');
            if (btnGrabar) {
                e.preventDefault();
                startRecording(parseInt(btnGrabar.dataset.questionIndex, 10));
            } else if (btnDetener) {
                e.preventDefault();
                stopRecording(parseInt(btnDetener.dataset.questionIndex, 10));
            }
        });
    }

    async function startRecording(questionIndex) {
        audioChunks = [];
        const card = questionsFormContent.querySelector(`.question-card[data-question-index="${questionIndex}"]`);
        if (!card) return;
        const initial = card.querySelector('.btn-audio-initial');
        const recording = card.querySelector('.btn-audio-recording');
        const processing = card.querySelector('.btn-audio-processing');
        const textarea = card.querySelector('.answer-textarea');

        try {
            currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(currentStream);

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };

            mediaRecorder.start();
            initial.classList.add('hidden');
            recording.classList.remove('hidden');
            card.querySelector('.audio-control-wrapper').classList.add('w-full');
            textarea.disabled = true;
            const currentVal = (textarea.value || '').trim();
            const isPlaceholder = currentVal === 'Grabando audio...' || currentVal === 'Traduciendo audio...' || currentVal === 'Procesando transcripción...';
            if (!isPlaceholder && currentVal) {
                textarea.dataset.contentBeforeRecording = currentVal;
            }
            textarea.value = 'Grabando audio...';
            textarea.classList.add('italic', 'text-gray-400');
        } catch (err) {
            console.error('Error accediendo al micrófono:', err);
            alert('No se pudo acceder al micrófono. Verificá los permisos del navegador.');
        }
    }

    function stopRecording(questionIndex) {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
        const card = questionsFormContent.querySelector(`.question-card[data-question-index="${questionIndex}"]`);
        if (!card) return;

        const recording = card.querySelector('.btn-audio-recording');
        const processing = card.querySelector('.btn-audio-processing');
        const textarea = card.querySelector('.answer-textarea');

        recording.classList.add('hidden');
        processing.classList.remove('hidden');
        textarea.value = 'Traduciendo audio...';
        textarea.classList.add('italic', 'text-gray-400');

        mediaRecorder.onstop = () => {
            if (currentStream) currentStream.getTracks().forEach(t => t.stop());
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            sendAudioToN8n(blob, questionIndex, card, processing, textarea);
        };
        mediaRecorder.stop();
    }

    function sendAudioToN8n(blob, questionIndex, card, processingEl, textarea) {
        console.log('Tamaño del audio enviado:', blob.size);
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        const url = AUDIO_WEBHOOK + '?t=' + Date.now();
        fetch(url, {
            method: 'POST',
            body: formData,
            mode: 'cors',
            cache: 'no-store'
        })
            .then(resp => {
                console.log('Status:', resp.status);
                console.log('Headers:', [...resp.headers]);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const contentType = resp.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    console.warn('Respuesta no es JSON, content-type:', contentType);
                    textarea.value = 'Procesando transcripción...';
                    textarea.disabled = false;
                    textarea.classList.remove('italic', 'text-gray-400');
                    resetAudioUI(card, processingEl);
                    return null;
                }
                return resp.text().then(raw => {
                    if (!raw || !raw.trim()) {
                        textarea.value = 'Procesando transcripción...';
                        textarea.disabled = false;
                        textarea.classList.remove('italic', 'text-gray-400');
                        resetAudioUI(card, processingEl);
                        return null;
                    }
                    try {
                        return JSON.parse(raw);
                    } catch (e) {
                        console.warn('JSON inválido:', raw);
                        textarea.value = 'Procesando transcripción...';
                        textarea.disabled = false;
                        textarea.classList.remove('italic', 'text-gray-400');
                        resetAudioUI(card, processingEl);
                        return null;
                    }
                });
            })
            .then(data => {
                if (!data) return;
                const text = (data.text || data.transcription || data.Text || '').trim();
                if (!text) {
                    textarea.disabled = false;
                    textarea.classList.remove('italic', 'text-gray-400');
                    delete textarea.dataset.contentBeforeRecording;
                    resetAudioUI(card, processingEl);
                    return;
                }
                const savedBeforeRecording = textarea.dataset.contentBeforeRecording || '';
                delete textarea.dataset.contentBeforeRecording;
                if (savedBeforeRecording) {
                    textarea.value = savedBeforeRecording + ' ' + text;
                } else {
                    textarea.value = text;
                }
                textarea.disabled = false;
                textarea.classList.remove('italic', 'text-gray-400');
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                resetAudioUI(card, processingEl);
            })
            .catch(err => {
                console.error('Error enviando audio:', err);
                const saved = textarea.dataset.contentBeforeRecording || '';
                delete textarea.dataset.contentBeforeRecording;
                textarea.value = saved;
                textarea.disabled = false;
                textarea.classList.remove('italic', 'text-gray-400');
                resetAudioUI(card, processingEl);
                alert('No se pudo procesar el audio. Intentá de nuevo.');
            });
    }

    function resetAudioUI(card, processingEl) {
        const initial = card.querySelector('.btn-audio-initial');
        const wrapper = card.querySelector('.audio-control-wrapper');
        processingEl.classList.add('hidden');
        initial.classList.remove('hidden');
        wrapper.classList.remove('w-full');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showQuestionsView() {
        questionsLoader.classList.add('hidden');
        questionsFormWrapper.classList.remove('hidden');
        bindSubmitHandler();
    }

    function showFinishDirectly() {
        viewQuestions.classList.add('hidden');
        viewFinish.classList.remove('hidden');
    }

    function collectResponses() {
        const textareas = questionsFormContent.querySelectorAll('textarea[data-question-index]');
        return Array.from(textareas).map(ta => ({
            questionIndex: parseInt(ta.dataset.questionIndex, 10),
            question: ta.dataset.question,
            answer: (ta.value || '').trim()
        }));
    }

    function bindSubmitHandler() {
        if (!btnSubmit) return;
        btnSubmit.onclick = () => submitFeedback();
    }

    function submitFeedback() {
        const responses = collectResponses();
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="animate-pulse">Enviando...</span>';

        fetch(RESPONSES_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testId: id,
                title: testTitle,
                responses,
                timestamp: new Date().toISOString()
            })
        })
            .then(resp => {
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                viewQuestions.classList.add('hidden');
                viewFinish.classList.remove('hidden');
            })
            .catch(err => {
                console.error('Error enviando respuestas:', err);
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<span class="truncate">Enviar todo</span>';
                alert('No se pudieron guardar las respuestas. Revisá tu conexión e intentá de nuevo.');
            });
    }

    function showError(msg, showRetry = false) {
        questionsLoader.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <span class="material-symbols-outlined text-5xl mb-3">error_circle_rounded</span>
                <p class="font-bold text-lg text-gray-800 dark:text-gray-200">${msg}</p>
                ${showRetry ? '<button id="btn-retry" class="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">Reintentar</button>' : ''}
            </div>
        `;
        const btn = document.getElementById('btn-retry');
        if (btn) {
            btn.onclick = () => {
                questionsLoader.innerHTML = `
                    <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-gray-500 dark:text-gray-400 font-medium text-sm">Cargando...</p>
                `;
                loadTest();
            };
        }
    }
});
