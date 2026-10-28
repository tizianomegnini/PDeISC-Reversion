document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🌗 CONTROL DE MODO OSCURO / CLARO
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateToggleUI(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleUI(newTheme);
    });

    function updateToggleUI(theme) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Modo Claro';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Modo Oscuro';
        }
    }

    // ==========================================
    // ⚙️ GESTIÓN INDIVIDUAL DE NODOS
    // ==========================================
    const linksContainer = document.getElementById('links-container');
    const logContainer = document.getElementById('log-container');
    const userText = document.getElementById('user-text');
    const userUrl = document.getElementById('user-url');
    const btnCreateCustom = document.getElementById('btn-create-custom');

    let linkCounter = 0;

    // Logs en Pantalla sin usar Alerts
    const addLog = (message, type = 'info') => {
        if (logContainer.innerHTML.includes('Esperando acciones')) {
            logContainer.innerHTML = '';
        }
        const colorMap = { info: '#0dcaf0', success: '#198754', warning: '#ffc107' };
        const logItem = document.createElement('div');
        logItem.style.color = colorMap[type];
        logItem.className = 'mb-1 border-bottom border-secondary pb-1 small';
        logItem.innerHTML = `> ${message}`;
        logContainer.appendChild(logItem);
        logContainer.scrollTop = logContainer.scrollHeight;
    };

    const formatURL = (url) => {
        let trimmed = url.trim();
        if (!/^https?:\/\//i.test(trimmed)) {
            trimmed = 'https://' + trimmed;
        }
        return trimmed;
    };

    // CREACIÓN DEL COMPONENTE NODO UNIFICADO
    btnCreateCustom.addEventListener('click', () => {
        const textValue = userText.value.trim();
        const urlValue = userUrl.value.trim();

        if (!textValue || !urlValue) {
            addLog('⚠️ ERROR: Campos vacíos. No se pudo crear el nodo.', 'warning');
            return;
        }

        const cleanUrl = formatURL(urlValue);
        linkCounter++;

        const placeholder = document.getElementById('empty-placeholder');
        if (placeholder) placeholder.remove();

        // Contenedor del Componente Individual (Card Neutra Unificada)
        const nodeCard = document.createElement('div');
        nodeCard.className = 'card p-3 border shadow-sm bg-body-secondary text-body animate-fade';
        nodeCard.id = `node-wrapper-${linkCounter}`;

        // Estructura adaptativa
        nodeCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <a href="${cleanUrl}" target="_blank" class="btn btn-link text-body fw-bold p-0 dynamic-link-target text-start text-truncate" style="max-width: 75%;">
                    🔗 <span class="link-text-render">${textValue}</span>
                </a>
                <button class="btn btn-sm btn-outline-secondary btn-toggle-edit py-1 px-2 fw-semibold">⚙️ Editar</button>
            </div>
            
            <div class="edit-panel d-none mt-3 pt-3 border-top border-secondary-subtle">
                <div class="row g-2">
                    <div class="col-12 col-sm-6">
                        <input type="text" class="form-control form-control-sm bg-body text-body input-edit-text" value="${textValue}">
                    </div>
                    <div class="col-12 col-sm-6">
                        <input type="url" class="form-control form-control-sm bg-body text-body input-edit-url" value="${cleanUrl}">
                    </div>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-2">
                    <button class="btn btn-xs btn-secondary btn-cancel-edit style-btn-mini">Cancelar</button>
                    <button class="btn btn-xs btn-outline-secondary btn-save-edit style-btn-mini fw-bold">Guardar</button>
                </div>
            </div>
        `;

        linksContainer.appendChild(nodeCard);
        addLog(`[Nodo #${linkCounter} Inyectado] Atributos -> <b>href:</b> "${cleanUrl}", <b>texto:</b> "${textValue}"`, 'success');

        userText.value = '';
        userUrl.value = '';

        // Captura de eventos del panel de edición
        const editPanel = nodeCard.querySelector('.edit-panel');
        const toggleEditBtn = nodeCard.querySelector('.btn-toggle-edit');
        const cancelBtn = nodeCard.querySelector('.btn-cancel-edit');
        const saveBtn = nodeCard.querySelector('.btn-save-edit');
        const anchorTarget = nodeCard.querySelector('.dynamic-link-target');
        const textRender = nodeCard.querySelector('.link-text-render');
        const editTextInp = nodeCard.querySelector('.input-edit-text');
        const editUrlInp = nodeCard.querySelector('.input-edit-url');

        toggleEditBtn.addEventListener('click', () => {
            editPanel.classList.toggle('d-none');
        });

        cancelBtn.addEventListener('click', () => {
            editPanel.classList.add('d-none');
            editTextInp.value = textRender.textContent;
            editUrlInp.value = anchorTarget.getAttribute('href');
        });

        saveBtn.addEventListener('click', () => {
            const newText = editTextInp.value.trim();
            const newUrl = editUrlInp.value.trim();

            if (!newText || !newUrl) {
                addLog('⚠️ ERROR: Modificación cancelada. Campos vacíos.', 'warning');
                return;
            }

            const cleanNewUrl = formatURL(newUrl);
            const oldHref = anchorTarget.getAttribute('href');
            const oldText = textRender.textContent;

            if (oldHref !== cleanNewUrl || oldText !== newText) {
                anchorTarget.setAttribute('href', cleanNewUrl);
                textRender.textContent = newText;

                addLog(`⚙️ <b>[Nodo Modificado]</b> Mutación aplicada con éxito:`, 'info');
                if (oldText !== newText) addLog(`&nbsp;&nbsp;&nbsp;• Texto: de "${oldText}" a "${newText}"`, 'info');
                if (oldHref !== cleanNewUrl) addLog(`&nbsp;&nbsp;&nbsp;• href: de "${oldHref}" a "${cleanNewUrl}"`, 'info');
            } else {
                addLog('ℹ️ No se detectaron cambios en las propiedades.', 'warning');
            }

            editPanel.classList.add('d-none');
        });
    });

    // ==========================================
    // 🚀 CONTROL DEL BOTÓN "VOLVER ARRIBA"
    // ==========================================
    const backToTopBtn = document.getElementById('btn-back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});