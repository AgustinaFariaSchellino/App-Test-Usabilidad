document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('admin-header-container');
    if (headerContainer) {
        headerContainer.innerHTML = `
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-solid border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark px-4 py-3 sm:px-6 lg:px-10 min-h-[64px] sm:h-20 w-full"> 
            <a href="#" id="header-link-home" class="text-[#111418] dark:text-white text-base sm:text-xl font-bold leading-tight tracking-tight hover:opacity-80 transition-opacity shrink-0">Flex App</a>
            <div class="flex items-center gap-2 sm:gap-6">
                <button id="btn-mis-pruebas" class="nav-item text-[#94a3b8] hover:text-primary text-sm font-semibold transition-colors bg-transparent border-0 cursor-pointer px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 -mr-1">
                    Mis pruebas
                </button>
                <button id="header-btn-new-test" class="flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-bold min-h-[44px] px-4 py-2.5 hover:bg-primary/90 shadow-sm transition-all active:scale-95">
                    <svg class="size-4 shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4.5v15m7.5-7.5h-15" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>Nuevo test</span>
                </button>
            </div>
        </header>
        `;
    }
});