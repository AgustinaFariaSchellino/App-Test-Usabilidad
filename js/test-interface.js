
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Test Interface: Lógica Minimalista Activada');

    // ---------------------------------------------------------
    // 1. CAPTURA DE ID (Sin lógica extra, directo al grano)
    // ---------------------------------------------------------
    let idRaw = new URLSearchParams(window.location.search).get('id');

    // Limpieza robusta de espacios accidentales (trim y replace all spaces)
    const id = idRaw ? idRaw.trim().replace(/\s/g, '') : null;

    console.log('📍 [test-interface] ID capturado:', JSON.stringify(id), '| URL:', window.location.href);

    if (!id) {
        renderError('ID no encontrado en la URL.');
        return;
    }

    // ---------------------------------------------------------
    // 2. FETCH DINÁMICO & RETRY LOGIC (Cache Busting)
    // ---------------------------------------------------------
    function loadTest(testId) {
        // Cache busting con timestamp para obligar a re-evaluar la hoja de cálculo
        const timestamp = Date.now();
        const ENDPOINT = `https://n8n-nube-jw30.onrender.com/webhook/test-especifico?id=${encodeURIComponent(testId)}&t=${timestamp}`;

        console.log('🌍 [test-interface] Fetching:', ENDPOINT);

        // Mostrar estado de carga si es un re-intento
        const welcomeCard = document.getElementById('welcome-card');
        if (welcomeCard && welcomeCard.innerHTML.includes('reintentar')) {
            welcomeCard.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10">
                    <svg class="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-gray-500 font-medium">Re-conectando con la base de datos...</p>
                </div>
             `;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        fetch(ENDPOINT, {
            cache: 'no-store',
            signal: controller.signal
        })
            .then(resp => {
                clearTimeout(timeoutId);
                const status = resp.status;
                const statusText = resp.statusText;
                console.log('📡 [test-interface] Respuesta n8n - Status:', status, statusText, '| OK:', resp.ok);

                if (!resp.ok) {
                    return resp.text().then(body => {
                        console.error('❌ [test-interface] Cuerpo de error:', body);
                        throw new Error(`HTTP ${status} ${statusText}`);
                    });
                }
                return resp.json();
            })
            .then(data => {
                console.log('📦 [test-interface] Data recibida (cruda):', data);
                console.log('📦 [test-interface] ¿Es array?:', Array.isArray(data), '| longitud:', Array.isArray(data) ? data.length : 'N/A');

                // Si n8n devuelve array, tomar el primer elemento
                const item = Array.isArray(data) && data.length > 0 ? data[0] : data;

                // Validación básica de integridad de datos
                if (!item || (!item.Title && !item.title && !item.Título)) {
                    throw new Error('Datos incompletos o inválidos recibidos del servidor.');
                }

                startInterface(item);
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.error('❌ [test-interface] Error:', err.message);
                console.error('❌ [test-interface] AbortTimeout:', err.name === 'AbortError');
                renderError('No se pudo cargar el test. Verificá tu conexión o que n8n esté activo.', true);
            });
    }

    // Iniciar carga
    loadTest(id);

    // ---------------------------------------------------------
    // 3. LÓGICA DE INTERFAZ
    // ---------------------------------------------------------
    function startInterface(data) {
        // Mapeo tolerante
        const testData = {
            title: data.Title || data.Título || data.title || 'Test de Usuario',
            description: data.Description || data.Descripción || 'Sin descripción.',
            figmaLink: data['Link Figma'] || data.figmaLink || '',
            deviceType: data.tipo_dispositivo || data['Tipo de Dispositivo'] || 'App',
            questions: data['Preguntas (JSON)'] || []
        };

        // A. Render Bienvenida
        const welcomeCard = document.getElementById('welcome-card');
        if (welcomeCard) {
            welcomeCard.innerHTML = `
                <div class="mb-6 flex items-center justify-center size-20 rounded-full bg-primary/10 dark:bg-primary/20">
                    <span class="material-symbols-outlined text-primary text-4xl opacity-0 transition-opacity duration-300" id="welcome-icon">rocket_launch</span>
                </div>
                <h1 class="text-[#111418] dark:text-white text-2xl font-bold text-center pb-2">
                    ¡Bienvenido/a!
                </h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm text-center pb-6 px-4">
                    Gracias por participar en el Test: <strong class="text-primary">${testData.title}</strong>
                </p>
                <p class="text-gray-400 dark:text-gray-500 text-xs text-center pb-6 px-6 italic">
                    ${testData.description}
                </p>

                <button id="btn-start-testing" 
                    class="w-full max-w-[240px] h-10 bg-primary text-white text-sm font-bold rounded-lg shadow-lg hover:scale-105 transition-transform">
                    Empezar
                </button>
            `;

            // Listener para arrancar
            document.getElementById('btn-start-testing').addEventListener('click', () => {
                document.getElementById('view-welcome').classList.add('hidden');
                document.getElementById('view-prototype').classList.remove('hidden');

                // BLOQUEO DE SCROLL (Mobile Fix)
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.height = '100%';

                injectFigma(testData.figmaLink, testData.deviceType);
            });
        }

        // B. Inyectar Descripción en Overlay
        const overlayDescText = document.getElementById('overlay-description-text');
        if (overlayDescText) {
            overlayDescText.innerText = testData.description;
        }

        // C. Lógica del Overlay (Top Sheet Mode)
        const overlay = document.getElementById('description-overlay');
        const btnOpen = document.getElementById('btn-read-description');
        const btnClose = document.getElementById('btn-close-description');

        if (overlay && btnOpen && btnClose) {
            // Abrir Overlay: Remover -translate-y-full para bajarlo
            btnOpen.onclick = () => {
                overlay.classList.remove('-translate-y-full');
            };

            // Cerrar Overlay: Agregar -translate-y-full para subirlo
            btnClose.onclick = () => {
                overlay.classList.add('-translate-y-full');
            };
        }

        // D. Font Loading Fix (Prevent Ligature Flash)
        document.fonts.ready.then(() => {
            const icon = document.getElementById('welcome-icon');
            if (icon) {
                icon.classList.remove('opacity-0');
            }
        });
    }

    // ---------------------------------------------------------
    // 4. INYECCIÓN FIGMA (Core Simplificado)
    // ---------------------------------------------------------
    function injectFigma(content, deviceType = 'App') {
        const container = document.getElementById('prototipo-container-v2');
        if (!container || !content) return;

        // Limpieza visual
        container.innerHTML = '';

        // -------------------------------------------------
        // BYPASS CSP: WRAPPER PATTERN
        // -------------------------------------------------
        let linkFigma = content.trim();
        let finalUrl = linkFigma;

        // 1. Verificación de Protocolo
        if (!linkFigma.startsWith('http')) {
            console.warn('⚠️ Link sin protocolo detectado. Figma requiere HTTPS.');
        }

        // 2. Transformación Automática (Wrapper)
        if (linkFigma.includes('/proto/')) {
            console.log('🔄 Detectado Link Prototipo -> Aplicando Wrapper de Seguridad...');

            // Preserve query params if any, but ensure we build the embed url correctly
            // We use encodeURIComponent for the entire target URL
            finalUrl = 'https://www.figma.com/embed?embed_host=share&url=' + encodeURIComponent(linkFigma);
        }

        // Tarea 3: Inyección del Iframe con Auto-Escalado
        // Concatenamos los parámetros de escalado forzado
        finalUrl += '&scaling=contain&content-scaling=responsive';

        console.log('🛡️ URL de Embebido (con Escalado):', finalUrl);
        console.log('📱 Modo de Visualización:', deviceType);

        // Tarea 2: El Mockup con Proporción Condicional
        let containerStyle = '';

        if (deviceType === 'Web') {
            // ESTILO WEB (Landscape 16:10, Ancho predominante)
            containerStyle = `
                width: auto;
                height: 92%;
                max-width: 98vw;
                aspect-ratio: 16 / 10;
                margin: auto;
                border-radius: 12px; 
                overflow: hidden; 
                background-color: black; 
                box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
             `;
        } else {
            // ESTILO APP
            if (isMobile()) {
                // Mobile/Tablet: comportamiento actual (no modificar)
                containerStyle = `
                height: 92%;
                width: auto;
                aspect-ratio: 9 / 21;
                max-width: 100%; 
                margin: auto;
                border-radius: 12px; 
                overflow: hidden; 
                background-color: black; 
                box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
             `;
            } else {
                // Desktop + App: Regla 92% - límite estricto para evitar desborde vertical
                containerStyle = `
                height: 92svh;
                max-height: 92svh;
                width: auto;
                max-width: 92vw;
                aspect-ratio: 9 / 21;
                margin: auto;
                border-radius: 12px; 
                overflow: hidden; 
                background-color: black; 
                box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
             `;
            }
        }

        const finalHtml = `
        <div class="mockup-wrapper ${deviceType === 'Web' ? 'web-mockup' : 'app-mockup'}" style="${containerStyle}">
            <iframe 
                src="${finalUrl}" 
                allowfullscreen 
                allow="fullscreen; clipboard-read; clipboard-write"
                style="width: 100%; height: 100%; border: none; display: block;"
            ></iframe>
        </div>`;

        container.innerHTML = finalHtml;
        console.log('✅ Iframe Generado');

        // Tarea 4: Mobile Alerts (Orientation & Fullscreen)
        if (isMobile()) {
            console.log('📱 Mobile Alert Check - Device:', deviceType, 'Portrait:', isPortrait());

            if (deviceType === 'Web' && isPortrait()) {
                // Caso 1: Web en Vertical -> "Gira + Fullscreen"
                showMobileAlert('<span>Gira tu celular y activa <span class="material-symbols-outlined text-sm align-text-bottom mx-1">open_in_full</span></span><span>para una mejor experiencia</span>');
            } else {
                // Caso 2: App (o Web ya horizontal) -> Solo "Fullscreen"
                // Caso 2: App (o Web ya horizontal) -> Solo "Fullscreen"
                showMobileAlert('<span>Activa <span class="material-symbols-outlined text-sm align-text-bottom mx-1">open_in_full</span></span><span>para una mejor experiencia</span>');
            }
        }
    }

    // --- Helpers de Fullscreen & Mobile ---
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;
    }

    function isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    function showMobileAlert(messageHtml) {
        const alertId = 'mobile-experience-alert';
        if (document.getElementById(alertId)) return; // Ya existe

        // Usamos un contenedor flex full-width para garantizar el centrado
        const alertHtml = `
            <div id="${alertId}-wrapper" class="fixed inset-0 z-[60] pointer-events-none flex items-start justify-center pt-20">
                <div id="${alertId}" class="pointer-events-auto flex items-center justify-between gap-3 px-5 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl animate-bounce mx-4 w-auto max-w-[90%]">
                    <div class="text-xs font-bold text-gray-700 dark:text-gray-200 text-center flex flex-col gap-1 leading-tight">
                        ${messageHtml}
                    </div>
                    <button onclick="document.getElementById('${alertId}-wrapper').remove()" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors shrink-0 flex items-center justify-center">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHtml);

        // Auto-dismiss after 8 seconds (optional, but good UX)
        setTimeout(() => {
            const el = document.getElementById(`${alertId}-wrapper`);
            if (el) el.remove();
        }, 8000);
    }

    // ---------------------------------------------------------
    // 5. MANEJO DE ERROR
    // ---------------------------------------------------------
    function renderError(msg, showRetry = false) {
        const welcomeCard = document.getElementById('welcome-card');
        if (welcomeCard) {
            let actionHtml = '';

            if (showRetry) {
                actionHtml = `
                    <button id="btn-retry" class="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors flex items-center gap-2 mx-auto">
                        <span class="material-symbols-outlined">refresh</span>
                        Reintentar conexión
                    </button>
                `;
            }

            welcomeCard.innerHTML = `
                <div class="text-center text-red-500 py-8">
                    <span class="material-symbols-outlined text-5xl mb-3">error_circle_rounded</span>
                    <p class="font-bold text-lg text-gray-800 dark:text-gray-200">${msg}</p>
                    <p class="text-xs text-gray-400 mt-2 max-w-[300px] mx-auto">Si acabas de crear el test, espera unos segundos y reintenta.</p>
                    ${actionHtml}
                </div>
            `;

            if (showRetry) {
                const btn = document.getElementById('btn-retry');
                if (btn) {
                    btn.addEventListener('click', () => {
                        console.log('🔄 Reintentando carga manual...');
                        loadTest(id);
                    });
                }
            }
        }
    }

    // ---------------------------------------------------------
    // 6. FULLSCREEN LOGIC
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // 6. FULLSCREEN LOGIC (Cross-Browser & Mobile Robustness)
    // ---------------------------------------------------------
    const container = document.getElementById('prototipo-container-v2');
    // Listener Delegado para Botón Flotante (Revertido)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btn-exit-fullscreen-floating');
        if (btn) {
            e.preventDefault();
            console.log('🔙 Saliendo de Fullscreen (Botón Flotante)');
            exitFullScreen();
        }
    });
    const btnEnterFullscreen = document.getElementById('btn-enter-fullscreen');

    // Función Helper Robustecida
    function requestFullScreen(element) {
        try {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) { /* Safari / Chrome Mobile */
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { /* IE11 */
                element.msRequestFullscreen();
            } else if (element.webkitEnterFullscreen) { /* iOS Video/Old Webkit */
                element.webkitEnterFullscreen();
            } else {
                console.warn('⚠️ Fullscreen API no soportada en este dispositivo.');
                alert('Tu navegador no soporta pantalla completa automática. Por favor, usa el menú de tu navegador.');
            }
        } catch (err) {
            console.error('❌ Error al intentar entrar en fullscreen:', err);
        }
    }

    function exitFullScreen() {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } catch (err) {
            console.error('❌ Error al salir de fullscreen:', err);
        }
    }

    // Lógica para ENTRAR a Fullscreen (Botón Header)
    if (btnEnterFullscreen && container) {
        console.log('✅ Botón Fullscreen Header detectado.');

        // Touchstart para móviles (respuesta más rápida y fiable en iOS)
        const triggerFullscreen = (e) => {
            e.preventDefault(); // Evitar doble disparo
            console.log('👆 Intentando entrar en Fullscreen...');
            requestFullScreen(container);
        };

        btnEnterFullscreen.addEventListener('click', triggerFullscreen);
        btnEnterFullscreen.addEventListener('touchstart', triggerFullscreen, { passive: false });
    } else {
        console.error('❌ No se encontró el botón de Fullscreen en el Header.');
    }



    // Listener para cambios de estado (opcional, para depuración)
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            console.log('📺 Entered Fullscreen Mode');
            container.classList.add('is-fullscreen'); // Force CSS visibility
        } else {
            console.log('🔙 Exited Fullscreen Mode');
            container.classList.remove('is-fullscreen');
        }
    });

    // Webkdit Event Listener (Safari/iOS)
    document.addEventListener('webkitfullscreenchange', () => {
        if (document.webkitFullscreenElement) {
            console.log('🍎 Entered Webkit Fullscreen');
            container.classList.add('is-fullscreen');
        } else {
            console.log('🍎 Exited Webkit Fullscreen');
            container.classList.remove('is-fullscreen');
        }
    });

    // Redirigir a test-questions.html al finalizar el test
    const btnFinish = document.getElementById('btn-finish-prototype');
    if (btnFinish) {
        btnFinish.onclick = () => {
            window.location.href = `test-questions.html?id=${id}`;
        };
    }
});
