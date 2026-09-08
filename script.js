// ============================================================
// script.js — macOS-style desktop portfolio
// Menu bar, Dock, Traffic-light windows, Finder with
// drill-down folder navigation (no popups).
// ============================================================

let activeWindow = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let selectedIcon = null;

// ------------------------------------------------------------
// Virtual file system for Finder
// ------------------------------------------------------------
const finderFS = {
    root: {
        id: 'root',
        name: 'Projects',
        type: 'folder',
        children: [
            {
                id: 'webapps', name: 'Web Apps', type: 'folder',
                children: [
                    { id: 'f1', name: 'OrderUP — Food Delivery', type: 'file', icon: 'fas fa-file-code', content: 'OrderUP\n\nOnline ordering system with dynamic menus, real-time cart management and checkout flow.\nStack: Node.js, ReactJS' },
                    { id: 'f2', name: 'kiran-crm.sql', type: 'file', icon: 'fas fa-file-code', content: '-- Kiran Restaurant & Dealership CRM schema\n-- customers, sales pipelines, follow-ups' },
                    { id: 'f3', name: 'portfolio.html', type: 'file', icon: 'fas fa-file-code', content: '<!-- This portfolio site -->' }
                ]
            },
            {
                id: 'backend', name: 'Backend', type: 'folder',
                children: [
                    { id: 'f4', name: 'django-rest-notes.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Django REST Framework notes\n\n- ViewSets + Routers\n- Serializer validation\n- JWT auth\n- Event-driven patterns for long-running workflows' },
                    { id: 'f5', name: 'schema-design.sql', type: 'file', icon: 'fas fa-file-code', content: '-- MySQL schema design: ledgers, recruitment pipelines,\n-- gym subscriptions, training records, municipal data' },
                    {
                        id: 'apis', name: 'APIs', type: 'folder',
                        children: [
                            { id: 'f6', name: 'rakmina-api.md', type: 'file', icon: 'fas fa-file-alt', content: '# Rakmina ATS API\n\nEndpoints for job listings, applicants, employer dashboards.\n500+ job placements facilitated.' },
                            { id: 'f7', name: 'gwp-palika.md', type: 'file', icon: 'fas fa-file-alt', content: '# GWP Palika Software\n\nGovernment municipal platform (Grails/Java).\nLive in real Nepali local government offices.' }
                        ]
                    }
                ]
            },
            {
                id: 'mobile', name: 'Mobile', type: 'folder',
                children: [
                    { id: 'f8', name: 'playstore-app.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Flutter app published on Google Play Store.\nFull lifecycle: development -> release.' }
                ]
            },
            { id: 'f9', name: 'README.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Janak Sanjel — Backend Software Engineer (Python/Java)\nProject Delivery Lead at NIRC\n\n10+ live production systems.\nEmail: janaksanjel12@gmail.com' }
        ]
    },
    desktop: {
        id: 'desktop', name: 'Desktop', type: 'folder',
        children: [
            { id: 'd1', name: 'My Portfolio', type: 'file', icon: 'fas fa-file-code', content: 'Portfolio web app — open it from the Dock.' },
            { id: 'd2', name: 'luffy-ocean-dream.mp4', type: 'file', icon: 'fas fa-file-video', content: 'Desktop wallpaper video.' }
        ]
    },
    documents: {
        id: 'documents', name: 'Documents', type: 'folder',
        children: [
            { id: 'doc1', name: 'resume-draft.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Janak Sanjel — Resume draft\n\nBCA graduate, 10+ live production systems, Django/DRF, MySQL, ReactJS.' },
            { id: 'doc2', name: 'sprint-plans', type: 'folder', children: [
                { id: 'doc2a', name: 'sprint-24.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Sprint 24 — Accounting Software release prep.' }
            ] }
        ]
    },
    downloads: {
        id: 'downloads', name: 'Downloads', type: 'folder',
        children: [
            { id: 'dl1', name: 'node-v22.pkg', type: 'file', icon: 'fas fa-file-archive', content: 'Installer package.' },
            { id: 'dl2', name: 'aws-notes.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Applied AWS learning notes — EC2, S3, RDS.' }
        ]
    },
    disk: {
        id: 'disk', name: 'Macintosh HD', type: 'folder',
        children: [
            { id: 'hd1', name: 'Applications', type: 'folder', children: [] },
            { id: 'hd2', name: 'Users', type: 'folder', children: [] },
            { id: 'hd3', name: 'System', type: 'folder', children: [] }
        ]
    },
    work: {
        id: 'work', name: 'Work', type: 'folder',
        children: [
            { id: 'w1', name: 'nirc-projects.txt', type: 'file', icon: 'fas fa-file-alt', content: 'NIRC — Project Manager & Full Stack Developer\nDec 2024 – Present\n10+ concurrent client projects.' },
            { id: 'w2', name: 'client-feedback.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Direct client collaboration reduced feedback cycles by ~30%.' }
        ]
    },
    personal: {
        id: 'personal', name: 'Personal', type: 'folder',
        children: [
            { id: 'p1', name: 'ideas.txt', type: 'file', icon: 'fas fa-file-alt', content: 'Ideas:\n- Free Tools Suite for creators\n- E-Signature app\n- Electronic voting system' }
        ]
    }
};

// Persist user-created finder items keyed by parent id
function loadUserFS() {
    try {
        const saved = JSON.parse(localStorage.getItem('finderUserItems') || '{}');
        Object.keys(saved).forEach(parentId => {
            const parent = findNode(finderFS.root, parentId) || finderFS[parentId];
            if (parent && parent.children) {
                saved[parentId].forEach(item => parent.children.push(item));
            }
        });
    } catch (e) { /* ignore */ }
}

function saveUserFS() {
    // Serialize only user-added items (flagged with user:true)
    const out = {};
    function walk(node, parentId) {
        (node.children || []).forEach(child => {
            if (child.user) {
                (out[parentId] = out[parentId] || []).push(child);
            }
            walk(child, child.id);
        });
    }
    Object.values(finderFS).forEach(node => {
        if (typeof node === 'object' && node.children) walk(node, node.id);
    });
    localStorage.setItem('finderUserItems', JSON.stringify(out));
}

function findNode(root, id) {
    if (root.id === id) return root;
    for (const child of (root.children || [])) {
        if (child.type === 'folder') {
            const found = findNode(child, id);
            if (found) return found;
        }
    }
    return null;
}

// ------------------------------------------------------------
// Finder navigation state
// ------------------------------------------------------------
let finderPath = ['root'];          // stack of folder ids
let finderHistory = ['root'];
let finderHistoryIndex = 0;

function currentFolder() {
    const id = finderPath[finderPath.length - 1];
    return findNode(finderFS.root, id) || finderFS[id] || finderFS.root;
}

function navigateFinder(nodeId, pushHistory = true) {
    const node = findNode(finderFS.root, nodeId) || finderFS[nodeId];
    if (!node || node.type !== 'folder') return;

    finderPath.push(node.id);
    if (pushHistory) {
        finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
        finderHistory.push(node.id);
        finderHistoryIndex = finderHistory.length - 1;
    }
    renderFinder();
}

function navigateUp() {
    if (finderPath.length > 1) {
        finderPath.pop();
        finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
        finderHistory.push(finderPath[finderPath.length - 1]);
        finderHistoryIndex = finderHistory.length - 1;
        renderFinder();
    }
}

function finderBack() {
    if (finderHistoryIndex > 0) {
        finderHistoryIndex--;
        // Rebuild path from history entry
        const target = finderHistory[finderHistoryIndex];
        rebuildPathTo(target);
    }
}

function finderForward() {
    if (finderHistoryIndex < finderHistory.length - 1) {
        finderHistoryIndex++;
        const target = finderHistory[finderHistoryIndex];
        rebuildPathTo(target);
    }
}

function rebuildPathTo(targetId) {
    // Build path by walking up the tree from target to root
    const path = [];
    function walk(node, chain) {
        if (node.id === targetId) {
            path.push(...chain, node.id);
            return true;
        }
        for (const child of (node.children || [])) {
            if (child.type === 'folder' && walk(child, [...chain, node.id])) return true;
        }
        return false;
    }
    walk(finderFS.root, []);
    // Also check top-level sidebar roots
    if (path.length === 0 && finderFS[targetId]) path.push(targetId);
    if (path.length) {
        finderPath = path;
        renderFinder();
    }
}

function renderFinder() {
    const folder = currentFolder();
    const content = document.getElementById('finder-content');
    const title = document.getElementById('finder-title');
    const pathEl = document.getElementById('finder-path');
    const backBtn = document.getElementById('finder-back');
    const fwdBtn = document.getElementById('finder-forward');
    if (!content) return;

    if (title) title.textContent = folder.name;

    // Sidebar active state
    document.querySelectorAll('.finder-sidebar .sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.nav === folder.id);
    });

    // Breadcrumbs
    if (pathEl) {
        pathEl.innerHTML = '';
        finderPath.forEach((id, idx) => {
            const node = findNode(finderFS.root, id) || finderFS[id];
            if (!node) return;
            const crumb = document.createElement('span');
            crumb.className = 'crumb' + (idx === finderPath.length - 1 ? ' active' : '');
            crumb.textContent = node.name;
            crumb.dataset.nav = id;
            crumb.addEventListener('click', () => {
                finderPath = finderPath.slice(0, idx + 1);
                renderFinder();
            });
            pathEl.appendChild(crumb);
            if (idx < finderPath.length - 1) {
                const sep = document.createElement('span');
                sep.className = 'crumb-sep';
                sep.textContent = '›';
                pathEl.appendChild(sep);
            }
        });
    }

    // Back/forward buttons
    if (backBtn) backBtn.disabled = finderHistoryIndex <= 0;
    if (fwdBtn) fwdBtn.disabled = finderHistoryIndex >= finderHistory.length - 1;

    // Items
    content.innerHTML = '';
    const children = folder.children || [];
    if (children.length === 0) {
        content.innerHTML = `
            <div class="finder-empty">
                <i class="far fa-folder-open"></i>
                <p>${folder.name} is empty</p>
                <small>Use the toolbar to add folders or files</small>
            </div>`;
        return;
    }

    children.forEach(child => {
        const item = document.createElement('div');
        item.className = 'finder-item';
        item.dataset.id = child.id;

        let iconHTML;
        if (child.type === 'folder') {
            iconHTML = '<i class="fas fa-folder"></i>';
        } else if (child.icon) {
            iconHTML = `<i class="${child.icon}"></i>`;
        } else {
            iconHTML = '<i class="fas fa-file"></i>';
        }
        item.innerHTML = `${iconHTML}<span>${child.name}</span>`;

        let clickTimeout = null;
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
                // Double click
                if (child.type === 'folder') {
                    navigateFinder(child.id);
                } else {
                    openNotepadWindow(child.name, child.content || '', child);
                }
                return;
            }
            clickTimeout = setTimeout(() => {
                document.querySelectorAll('.finder-item.selected').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                clickTimeout = null;
            }, 280);
        });

        item.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            document.querySelectorAll('.finder-item.selected').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            showFinderItemMenu(e.clientX, e.clientY, child, folder);
        });

        content.appendChild(item);
    });
}

function showFinderItemMenu(x, y, child, parentFolder) {
    hideContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-item" data-act="open">${child.type === 'folder' ? 'Open' : 'Open in TextEdit'}</div>
        <div class="context-item" data-act="rename">Rename</div>
        <div class="context-item" data-act="delete">Move to Trash</div>
        <div class="context-separator"></div>
        <div class="context-item" data-act="info">Get Info</div>
    `;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);

    menu.querySelector('[data-act="open"]').onclick = () => {
        if (child.type === 'folder') navigateFinder(child.id);
        else openNotepadWindow(child.name, child.content || '', child);
        hideContextMenu();
    };
    menu.querySelector('[data-act="rename"]').onclick = () => {
        const itemEl = document.querySelector(`.finder-item[data-id="${child.id}"]`);
        if (itemEl) startFinderRename(itemEl, child);
        hideContextMenu();
    };
    menu.querySelector('[data-act="delete"]').onclick = () => {
        const idx = parentFolder.children.indexOf(child);
        if (idx > -1) parentFolder.children.splice(idx, 1);
        saveUserFS();
        renderFinder();
        hideContextMenu();
    };
    menu.querySelector('[data-act="info"]').onclick = () => {
        showPropertiesDialog(child.name, child.type === 'folder' ? 'Folder' : 'Document', '--', new Date().toLocaleDateString());
        hideContextMenu();
    };
}

function startFinderRename(itemEl, child) {
    const span = itemEl.querySelector('span');
    const currentName = child.name;
    const input = document.createElement('input');
    input.className = 'rename-input';
    input.value = currentName;
    span.style.display = 'none';
    itemEl.appendChild(input);
    input.focus();
    input.select();

    function finish() {
        child.name = input.value.trim() || currentName;
        span.textContent = child.name;
        span.style.display = 'block';
        input.remove();
        saveUserFS();
        renderFinder();
    }
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') finish();
        else if (e.key === 'Escape') {
            span.style.display = 'block';
            input.remove();
        }
    });
}

function finderNewFolder() {
    const folder = currentFolder();
    const count = folder.children.filter(c => c.type === 'folder').length;
    const node = { id: 'u' + Date.now(), name: `New Folder ${count + 1}`, type: 'folder', children: [], user: true };
    folder.children.push(node);
    saveUserFS();
    renderFinder();
    const itemEl = document.querySelector(`.finder-item[data-id="${node.id}"]`);
    if (itemEl) setTimeout(() => startFinderRename(itemEl, node), 100);
}

function finderNewFile() {
    const folder = currentFolder();
    const count = folder.children.filter(c => c.type === 'file').length;
    const node = { id: 'u' + Date.now(), name: `New File ${count + 1}.txt`, type: 'file', icon: 'fas fa-file-alt', content: '', user: true };
    folder.children.push(node);
    saveUserFS();
    renderFinder();
    const itemEl = document.querySelector(`.finder-item[data-id="${node.id}"]`);
    if (itemEl) setTimeout(() => startFinderRename(itemEl, node), 100);
}

// ------------------------------------------------------------
// Local storage for desktop-created items
// ------------------------------------------------------------
const fileSystem = {
    save: () => {
        const items = [];
        document.querySelectorAll('.desktop-icon.folder-icon, .desktop-icon.file-icon').forEach(item => {
            const name = item.querySelector('span').textContent;
            const type = item.classList.contains('folder-icon') ? 'folder' : 'file';
            const content = item.dataset.content || '';
            items.push({ name, type, content });
        });
        localStorage.setItem('desktopItems', JSON.stringify(items));
    },
    load: () => {
        const items = JSON.parse(localStorage.getItem('desktopItems') || '[]');
        const desktopIcons = document.querySelector('.desktop-icons');
        if (!desktopIcons) return;
        items.forEach(item => {
            const element = document.createElement('div');
            element.className = `desktop-icon ${item.type}-icon`;
            element.dataset.content = item.content || '';
            element.innerHTML = `
                <i class="fas fa-${item.type === 'folder' ? 'folder' : 'file'}"></i>
                <span>${item.name}</span>
            `;
            addIconEventListeners(element);
            desktopIcons.appendChild(element);
        });
    }
};

// ------------------------------------------------------------
// Window management
// ------------------------------------------------------------

function openWindow(appName) {
    let windowId = appName + '-window';
    if (appName === 'recycle') windowId = 'recycle-window';
    if (appName === 'explorer' || appName === 'finder') {
        openFinder();
        return;
    }
    if (appName === 'vscode') {
        openVSCode();
        return;
    }

    const win = document.getElementById(windowId);
    if (win) {
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
        }
        win.style.display = 'block';
        bringToFront(win);
        activeWindow = win;
        updateDockState();
        updateMenubarAppName(win);
    }
}

function openFinder() {
    const win = document.getElementById('finder-window');
    if (win) {
        win.style.display = 'block';
        bringToFront(win);
        activeWindow = win;
        renderFinder();
        updateDockState();
        updateMenubarAppName(win);
    }
}

function closeWindow(win) {
    win.classList.remove('active');
    win.style.display = 'none';
    if (activeWindow === win) activeWindow = null;
    updateDockState();
}

function minimizeWindow(win) {
    win.style.display = 'none';
    if (activeWindow === win) activeWindow = null;
    updateDockState();
}

function toggleMaximize(win) {
    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        const orig = win.dataset.originalRect;
        if (orig) {
            const r = JSON.parse(orig);
            win.style.top = r.top;
            win.style.left = r.left;
            win.style.width = r.width;
            win.style.height = r.height;
            win.style.transform = r.transform || '';
        }
    } else {
        win.dataset.originalRect = JSON.stringify({
            top: win.style.top || win.offsetTop + 'px',
            left: win.style.left || win.offsetLeft + 'px',
            width: win.style.width || win.offsetWidth + 'px',
            height: win.style.height || win.offsetHeight + 'px',
            transform: win.style.transform || ''
        });
        win.classList.add('maximized');
    }
    bringToFront(win);
}

function toggleWindow(appName) {
    let windowId = appName + '-window';
    if (appName === 'recycle') windowId = 'recycle-window';
    if (appName === 'finder' || appName === 'explorer') {
        const fw = document.getElementById('finder-window');
        if (fw && fw.style.display !== 'none' && fw.classList.contains('active')) {
            minimizeWindow(fw);
        } else {
            openFinder();
        }
        return;
    }

    const win = document.getElementById(windowId);
    if (win) {
        if (win.style.display === 'none' || !win.classList.contains('active')) {
            openWindow(appName);
        } else {
            minimizeWindow(win);
        }
    }
}

function bringToFront(win) {
    document.querySelectorAll('.window').forEach(w => {
        w.style.zIndex = '1000';
        w.classList.remove('active');
    });
    win.style.zIndex = '1001';
    win.classList.add('active');
}

function updateDockState() {
    document.querySelectorAll('.dock-item').forEach(item => {
        const appName = item.dataset.app;
        let windowId = appName + '-window';
        if (appName === 'recycle') windowId = 'recycle-window';
        if (appName === 'finder') windowId = 'finder-window';
        const win = document.getElementById(windowId);
        item.classList.toggle('running', !!win && win.style.display !== 'none');
    });
}

function updateMenubarAppName(win) {
    const el = document.getElementById('active-app-name');
    if (!el) return;
    const names = {
        'finder-window': 'Finder',
        'brave-window': 'Safari',
        'portfolio-window': 'Portfolio',
        'music-window': 'Music',
        'recycle-window': 'Trash',
        'about-window': 'Finder',
        'vscode-window': 'Visual Studio Code'
    };
    el.textContent = names[win.id] || 'Finder';
}

// Dragging
function startDrag(e) {
    const win = e.target.closest('.window');
    if (!win || win.classList.contains('maximized')) return;
    if (e.target.closest('.tl') || e.target.closest('button') || e.target.closest('input')) return;

    isDragging = true;
    activeWindow = win;
    bringToFront(win);

    const rect = win.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    document.body.style.userSelect = 'none';
}

function drag(e) {
    if (!isDragging || !activeWindow) return;
    e.preventDefault();
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const maxX = window.innerWidth - activeWindow.offsetWidth;
    const maxY = window.innerHeight - activeWindow.offsetHeight - 90;
    activeWindow.style.left = Math.max(-activeWindow.offsetWidth + 120, Math.min(newX, maxX)) + 'px';
    activeWindow.style.top = Math.max(26, Math.min(newY, maxY)) + 'px';
}

function stopDrag() {
    if (isDragging && activeWindow) {
        document.body.style.userSelect = 'auto';
    }
    isDragging = false;
}

// ------------------------------------------------------------
// Menu bar
// ------------------------------------------------------------
function updateMenubarClock() {
    const now = new Date();
    const timeEl = document.querySelector('.mb-time');
    const dateEl = document.querySelector('.mb-date');
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
}

function toggleAppleMenu() {
    const dd = document.getElementById('apple-dropdown');
    const cc = document.getElementById('control-center');
    if (cc) cc.classList.remove('open');
    if (dd) dd.classList.toggle('open');
}

function handleAppleAction(action) {
    const dd = document.getElementById('apple-dropdown');
    if (dd) dd.classList.remove('open');

    if (action === 'about') {
        openWindow('about');
    } else if (action === 'sleep') {
        document.body.innerHTML = '<div style="background:#000;width:100vw;height:100vh;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#555;font-size:15px;" onclick="location.reload()">Click anywhere to wake</div>';
    } else if (action === 'restart') {
        document.body.innerHTML = '<div style="background:#000;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;">Restarting…</div>';
        setTimeout(() => location.reload(), 1500);
    } else if (action === 'shutdown') {
        document.body.innerHTML = '<div style="background:#000;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;flex-direction:column;gap:12px;"><i class="fab fa-apple" style="font-size:60px;"></i>Shutting down…</div>';
        setTimeout(() => {
            document.body.innerHTML = '<div style="background:#000;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;color:#555;font-size:15px;">It is now safe to close this tab.</div>';
        }, 1800);
    } else if (action === 'lock') {
        location.reload();
    }
}

// ------------------------------------------------------------
// Context menus (desktop + icons)
// ------------------------------------------------------------
function hideContextMenu() {
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();
}

function showContextMenu(x, y, icon, isDesktop = false) {
    hideContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';

    if (isDesktop) {
        menu.innerHTML = `
            <div class="context-item" onclick="openFinder()">New Finder Window</div>
            <div class="context-item" onclick="createNewFolder()">New Folder</div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="refreshDesktop()">Refresh</div>
        `;
    } else if (icon) {
        const isFolder = icon.classList.contains('folder-icon');
        menu.innerHTML = `
            <div class="context-item" onclick="openIconApp('${icon.dataset.app || ''}')">Open</div>
            ${isFolder ? '<div class="context-item" onclick="openFolder(selectedIcon)">Open in Finder</div>' : ''}
            <div class="context-separator"></div>
            <div class="context-item" onclick="startRename(selectedIcon)">Rename</div>
            <div class="context-item" onclick="deleteItem(selectedIcon)">Move to Trash</div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="showProperties(selectedIcon)">Get Info</div>
        `;
    }

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
}

function openIconApp(app) {
    if (app) openWindow(app);
    hideContextMenu();
}

function startRename(icon) {
    if (!icon) return;
    const span = icon.querySelector('span');
    const currentName = span.textContent;
    const input = document.createElement('input');
    input.className = 'rename-input';
    input.value = currentName;
    input.maxLength = 20;
    span.style.display = 'none';
    icon.appendChild(input);
    input.focus();
    input.select();

    function finishRename() {
        const newName = input.value.trim() || currentName;
        span.textContent = newName;
        span.style.display = 'block';
        input.remove();
        hideContextMenu();
        fileSystem.save();
    }
    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') finishRename();
        else if (e.key === 'Escape') {
            span.style.display = 'block';
            input.remove();
            hideContextMenu();
        }
    });
}

function showProperties(icon) {
    if (!icon) return;
    const name = icon.querySelector('span').textContent;
    const type = icon.dataset.app === 'recycle' ? 'Trash' :
                icon.classList.contains('folder-icon') ? 'Folder' : 'Application';
    const size = icon.classList.contains('file-icon') ? (icon.dataset.content?.length || 0) + ' bytes' : '--';
    showPropertiesDialog(name, type, size, new Date().toLocaleDateString());
    hideContextMenu();
}

function showPropertiesDialog(name, type, size, created) {
    const dialog = document.createElement('div');
    dialog.className = 'properties-dialog';
    dialog.innerHTML = `
        <div class="properties-content">
            <div class="properties-header">
                <i class="fas fa-info-circle"></i>
                <span>${name} — Get Info</span>
                <button class="properties-close">×</button>
            </div>
            <div class="properties-body">
                <div class="properties-icon">
                    <i class="fas fa-${type === 'Folder' ? 'folder' : type === 'Trash' ? 'trash' : 'file'}"></i>
                </div>
                <div class="properties-info">
                    <div class="property-row"><label>Name:</label><span>${name}</span></div>
                    <div class="property-row"><label>Type:</label><span>${type}</span></div>
                    <div class="property-row"><label>Where:</label><span>Desktop</span></div>
                    <div class="property-row"><label>Size:</label><span>${size}</span></div>
                    <div class="property-row"><label>Created:</label><span>${created}</span></div>
                </div>
            </div>
            <div class="properties-footer">
                <button class="btn-ok">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('.properties-close').onclick = () => dialog.remove();
    dialog.querySelector('.btn-ok').onclick = () => dialog.remove();
}

function createNewFolder() {
    const desktopIcons = document.querySelector('.desktop-icons');
    if (!desktopIcons) return;
    const folderCount = document.querySelectorAll('.desktop-icon.folder-icon').length;
    const newFolder = document.createElement('div');
    newFolder.className = 'desktop-icon folder-icon';
    newFolder.innerHTML = `
        <i class="fas fa-folder"></i>
        <span>New Folder ${folderCount + 1}</span>
    `;
    addIconEventListeners(newFolder);
    desktopIcons.appendChild(newFolder);
    hideContextMenu();
    fileSystem.save();
    setTimeout(() => {
        selectDesktopIcon(newFolder);
        startRename(newFolder);
    }, 100);
}

function createNewFile() {
    const desktopIcons = document.querySelector('.desktop-icons');
    if (!desktopIcons) return;
    const fileCount = document.querySelectorAll('.desktop-icon.file-icon').length;
    const newFile = document.createElement('div');
    newFile.className = 'desktop-icon file-icon';
    newFile.dataset.content = '';
    newFile.innerHTML = `
        <i class="fas fa-file"></i>
        <span>New File ${fileCount + 1}.txt</span>
    `;
    addIconEventListeners(newFile);
    desktopIcons.appendChild(newFile);
    hideContextMenu();
    fileSystem.save();
    setTimeout(() => {
        selectDesktopIcon(newFile);
        startRename(newFile);
    }, 100);
}

function deleteItem(icon) {
    if (!icon) return;
    const name = icon.querySelector('span').textContent;
    showDeleteDialog(name, () => {
        icon.remove();
        selectedIcon = null;
        fileSystem.save();
    });
    hideContextMenu();
}

function showDeleteDialog(itemName, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'delete-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <div class="dialog-header">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Move to Trash?</span>
            </div>
            <div class="dialog-body">
                <p>Are you sure you want to move “${itemName}” to the Trash?</p>
            </div>
            <div class="dialog-buttons">
                <button class="btn-no">Cancel</button>
                <button class="btn-yes">Move to Trash</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('.btn-yes').onclick = () => { onConfirm(); dialog.remove(); };
    dialog.querySelector('.btn-no').onclick = () => dialog.remove();
}

function refreshDesktop() {
    const desktop = document.querySelector('.desktop');
    if (desktop) {
        desktop.style.opacity = '0.8';
        setTimeout(() => { desktop.style.opacity = '1'; }, 200);
    }
    hideContextMenu();
}

function openFolder(folderIcon) {
    if (!folderIcon) return;
    const folderName = folderIcon.querySelector('span').textContent;
    // Create a user folder node in Finder root and open it
    const existing = finderFS.root.children.find(c => c.name === folderName && c.type === 'folder');
    if (existing) {
        openFinder();
        navigateFinder(existing.id);
    } else {
        const node = { id: 'u' + Date.now(), name: folderName, type: 'folder', children: [], user: true };
        finderFS.root.children.push(node);
        saveUserFS();
        openFinder();
        navigateFinder(node.id);
    }
    hideContextMenu();
}

function selectDesktopIcon(icon) {
    deselectAllIcons();
    icon.classList.add('selected');
    selectedIcon = icon;
}

function deselectAllIcons() {
    document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
    selectedIcon = null;
}

function addIconEventListeners(icon) {
    let clickTimeout = null;
    icon.addEventListener('click', function(e) {
        e.stopPropagation();
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            // Double click — open
            if (this.classList.contains('folder-icon')) {
                openFolder(this);
            } else if (this.classList.contains('file-icon')) {
                openTextFile(this);
            } else {
                const app = this.dataset.app;
                if (app) openWindow(app);
            }
            return;
        }
        clickTimeout = setTimeout(() => {
            selectDesktopIcon(this);
            clickTimeout = null;
        }, 280);
    });

    icon.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        selectDesktopIcon(this);
        showContextMenu(e.clientX, e.clientY, this);
    });
}

function openTextFile(fileIcon) {
    const fileName = fileIcon.querySelector('span').textContent;
    const content = fileIcon.dataset.content || '';
    openNotepadWindow(fileName, content, fileIcon);
}

// ------------------------------------------------------------
// TextEdit (Notepad) windows
// ------------------------------------------------------------
function openNotepadWindow(fileName, content, fileRef) {
    const windowId = 'notepad-' + fileName.replace(/[^a-zA-Z0-9]/g, '-');
    let notepadWindow = document.getElementById(windowId);
    const container = document.getElementById('dynamic-windows');

    if (!notepadWindow && container) {
        notepadWindow = document.createElement('div');
        notepadWindow.className = 'window notepad-window';
        notepadWindow.id = windowId;
        notepadWindow.style.top = '90px';
        notepadWindow.style.left = '220px';
        notepadWindow.style.width = '560px';
        notepadWindow.style.height = '400px';

        notepadWindow.innerHTML = `
            <div class="window-header">
                <div class="traffic-lights">
                    <button class="tl close"></button>
                    <button class="tl minimize"></button>
                    <button class="tl maximize"></button>
                </div>
                <div class="window-title"><span>${fileName}</span></div>
                <div class="header-spacer"></div>
            </div>
            <div class="notepad-content">
                <textarea class="notepad-textarea" placeholder="Type your text here...">${content}</textarea>
            </div>
        `;
        container.appendChild(notepadWindow);

        notepadWindow.querySelector('.tl.close').addEventListener('click', function() {
            const textarea = notepadWindow.querySelector('.notepad-textarea');
            if (fileRef) {
                if (fileRef.dataset) fileRef.dataset.content = textarea.value;
                else fileRef.content = textarea.value;
                fileSystem.save();
                saveUserFS();
            }
            closeWindow(notepadWindow);
        });
        notepadWindow.querySelector('.tl.minimize').addEventListener('click', () => minimizeWindow(notepadWindow));
        notepadWindow.querySelector('.tl.maximize').addEventListener('click', () => toggleMaximize(notepadWindow));
        notepadWindow.querySelector('.window-header').addEventListener('mousedown', startDrag);

        const textarea = notepadWindow.querySelector('.notepad-textarea');
        textarea.addEventListener('input', function() {
            if (fileRef) {
                if (fileRef.dataset) fileRef.dataset.content = this.value;
                else fileRef.content = this.value;
            }
        });
    }

    if (notepadWindow) {
        notepadWindow.classList.add('active');
        notepadWindow.style.display = 'block';
        bringToFront(notepadWindow);
        activeWindow = notepadWindow;
        updateDockState();
    }
}

// ------------------------------------------------------------
// Safari (Brave) browser — simulated pages
// ------------------------------------------------------------
function initializeBraveBrowser() {
    const addressBar = document.querySelector('.address-bar input');
    const homepageSearch = document.getElementById('homepage-search');
    const searchBtn = document.getElementById('search-btn');
    const quickLinks = document.querySelectorAll('.quick-link');
    const navBtns = document.querySelectorAll('.nav-btn');

    if (addressBar) {
        addressBar.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') navigateToUrl(this.value);
        });
        addressBar.addEventListener('focus', function() { this.select(); });
    }

    if (homepageSearch) {
        homepageSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchOrNavigate(this.value);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = homepageSearch.value;
            if (query) searchOrNavigate(query);
        });
    }

    quickLinks.forEach(link => {
        link.addEventListener('click', function() {
            const url = this.dataset.url;
            if (url === 'github') searchOrNavigate('github');
            else if (url === 'youtube') navigateToUrl('https://youtube.com');
            else navigateToUrl(url);
        });
    });

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-arrow-left')) goBack();
            else if (icon.classList.contains('fa-arrow-right')) goForward();
            else if (icon.classList.contains('fa-redo')) refreshPage();
        });
    });
}

function searchOrNavigate(query) {
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery === 'github' || lowerQuery === 'git') {
        navigateToUrl('https://github.com/janaksanjel');
        return;
    }
    if (lowerQuery === 'youtube' || lowerQuery === 'yt') {
        navigateToUrl('https://youtube.com');
        return;
    }
    if (isUrl(query)) navigateToUrl(query);
    else navigateToUrl(`https://search.brave.com/search?q=${encodeURIComponent(query)}`);
}

function isUrl(string) {
    try {
        new URL(string.startsWith('http') ? string : 'https://' + string);
        return true;
    } catch {
        return string.includes('.') && !string.includes(' ');
    }
}

function navigateToUrl(url) {
    if (!url.startsWith('http')) url = 'https://' + url;

    const addressBar = document.querySelector('.address-bar input');
    const defaultPage = document.getElementById('default-page');
    const activeTab = document.querySelector('.tab.active');

    if (addressBar) addressBar.value = url;

    if (activeTab) {
        const tabSpan = activeTab.querySelector('span');
        const tabIcon = activeTab.querySelector('i');
        activeTab.classList.add('loading');
        tabSpan.textContent = 'Loading…';
        setTimeout(() => {
            activeTab.classList.remove('loading');
            if (url.includes('github')) { tabIcon.className = 'fab fa-github'; tabSpan.textContent = 'GitHub — janaksanjel'; }
            else if (url.includes('codepen')) { tabIcon.className = 'fab fa-codepen'; tabSpan.textContent = 'CodePen'; }
            else if (url.includes('youtube')) { tabIcon.className = 'fab fa-youtube'; tabSpan.textContent = 'YouTube'; }
            else if (url.includes('stackoverflow')) { tabIcon.className = 'fab fa-stack-overflow'; tabSpan.textContent = 'Stack Overflow'; }
            else {
                tabIcon.className = 'fas fa-globe';
                try {
                    const domain = new URL(url).hostname.replace('www.', '');
                    tabSpan.textContent = domain.charAt(0).toUpperCase() + domain.slice(1);
                } catch { tabSpan.textContent = 'Web Page'; }
            }
        }, 1200);
    }

    showLoadingPage();
    setTimeout(() => {
        if (defaultPage) defaultPage.style.display = 'none';
        showSimulatedWebsite(url);
    }, 1200);
}

function showLoadingPage() {
    const braveContent = document.querySelector('.brave-content');
    if (!braveContent) return;
    braveContent.querySelector('.loading-indicator')?.remove();
    braveContent.querySelector('.simulated-website')?.remove();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.style.display = 'flex';
    loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
    braveContent.appendChild(loadingDiv);
}

function showSimulatedWebsite(url) {
    const braveContent = document.querySelector('.brave-content');
    if (!braveContent) return;
    braveContent.querySelector('.loading-indicator')?.remove();

    let websiteContent = '';
    if (url.includes('github')) websiteContent = createGitHubPage();
    else if (url.includes('codepen')) websiteContent = createCodePenPage();
    else if (url.includes('youtube')) websiteContent = createYouTubePage();
    else if (url.includes('stackoverflow')) websiteContent = createStackOverflowPage();
    else if (url.includes('search.brave.com')) websiteContent = createSearchResultsPage();
    else websiteContent = createGenericWebsite(url);

    const websiteDiv = document.createElement('div');
    websiteDiv.className = 'simulated-website';
    websiteDiv.innerHTML = websiteContent;
    websiteDiv.style.cssText = 'width: 100%; height: 100%; overflow-y: auto; padding: 20px; background: white;';
    braveContent.appendChild(websiteDiv);
}

function createGitHubPage() {
    return `
        <div style="max-width: 1000px; margin: 0 auto; font-family: -apple-system, sans-serif;">
            <header style="background:#24292e;color:#fff;padding:14px 20px;margin:-20px -20px 20px;border-radius:0;">
                <div style="display:flex;align-items:center;gap:14px;">
                    <i class="fab fa-github" style="font-size:28px;"></i>
                    <strong>GitHub</strong>
                    <input type="text" placeholder="Type / to search" style="flex:1;max-width:360px;padding:7px 12px;border:1px solid #444;border-radius:6px;background:#2d333b;color:#fff;outline:none;">
                </div>
            </header>
            <div style="display:grid;grid-template-columns:260px 1fr;gap:24px;">
                <aside style="text-align:center;">
                    <img src="./img/myphoto.jpg" alt="Janak Sanjel" style="width:200px;height:200px;border-radius:50%;object-fit:cover;border:1px solid #d0d7de;">
                    <h1 style="margin:14px 0 2px;font-size:22px;color:#24292f;">Janak Sanjel</h1>
                    <p style="margin:0;color:#656d76;font-size:17px;">janaksanjel</p>
                    <div style="display:flex;gap:8px;justify-content:center;margin:14px 0;">
                        <span style="background:#f6f8fa;padding:4px 10px;border-radius:12px;font-size:12px;">👥 6 followers</span>
                        <span style="background:#f6f8fa;padding:4px 10px;border-radius:12px;font-size:12px;">5 following</span>
                    </div>
                    <p style="color:#0969da;font-size:13px;">www.janaksanjel.com.np</p>
                </aside>
                <main>
                    <div style="border-bottom:1px solid #d0d7de;margin-bottom:18px;padding-bottom:12px;display:flex;gap:22px;font-size:14px;">
                        <span style="border-bottom:2px solid #fd8c73;font-weight:600;color:#24292f;">Overview</span>
                        <span style="color:#656d76;">Repositories <span style="background:#f6f8fa;padding:1px 6px;border-radius:10px;font-size:12px;">22</span></span>
                        <span style="color:#656d76;">Stars <span style="background:#f6f8fa;padding:1px 6px;border-radius:10px;font-size:12px;">15</span></span>
                    </div>
                    <h3 style="margin:0 0 12px;font-size:15px;color:#24292f;">Pinned</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        ${[
                            ['OrderUp_Online', 'JavaScript', '#f1e05a'],
                            ['E-Signature', 'HTML', '#e34c26'],
                            ['ElectronicsVotingSystem', 'PHP', '#4F5D95'],
                            ['simple_react_project', 'JavaScript', '#f1e05a']
                        ].map(([name, lang, color]) => `
                            <div style="border:1px solid #d0d7de;border-radius:8px;padding:14px;">
                                <h4 style="margin:0 0 6px;font-size:14px;color:#0969da;">${name}</h4>
                                <p style="margin:0 0 10px;color:#656d76;font-size:12px;">Public</p>
                                <span style="font-size:12px;color:#656d76;"><i class="fas fa-circle" style="color:${color};font-size:9px;"></i> ${lang}</span>
                            </div>`).join('')}
                    </div>
                    <div style="margin-top:20px;border:1px solid #d0d7de;border-radius:8px;padding:16px;background:#f6f8fa;">
                        <h4 style="margin:0 0 10px;font-size:14px;color:#24292f;">130 contributions in the last year</h4>
                        <div style="display:flex;gap:3px;">
                            ${['#ebedf0','#9be9a8','#40c463','#30a14e','#216e39'].map(c => `<div style="width:12px;height:12px;background:${c};border-radius:3px;"></div>`).join('')}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `;
}

function createCodePenPage() {
    return `
        <div style="font-family:-apple-system,sans-serif;background:#1e1e2e;color:#fff;min-height:100%;margin:-20px;padding:20px;">
            <header style="background:#000;padding:14px 20px;margin:-20px -20px 20px;display:flex;align-items:center;gap:14px;">
                <i class="fab fa-codepen" style="font-size:26px;"></i>
                <strong style="font-size:18px;">CodePen</strong>
                <nav style="margin-left:auto;display:flex;gap:18px;font-size:14px;">
                    <span style="color:#47cf73;">Explore</span><span>Create</span>
                </nav>
            </header>
            <section style="text-align:center;margin:40px 0;">
                <h2 style="font-size:30px;margin-bottom:10px;">Build, Test, and Discover</h2>
                <p style="color:#999;margin-bottom:20px;">The best place to build, test, and discover front-end code.</p>
                <button style="background:#47cf73;color:#fff;border:none;padding:11px 24px;border-radius:6px;font-size:15px;cursor:pointer;">Start Coding</button>
            </section>
            <h3 style="margin-bottom:14px;">Trending Pens</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                <div style="background:#2c2c3c;border-radius:10px;overflow:hidden;">
                    <div style="height:150px;background:linear-gradient(45deg,#ff6b6b,#4ecdc4);display:flex;align-items:center;justify-content:center;">CSS Animation Demo</div>
                    <div style="padding:14px;"><strong>Animated Button Collection</strong><br><small style="color:#999;">by @janaksanjel</small></div>
                </div>
                <div style="background:#2c2c3c;border-radius:10px;overflow:hidden;">
                    <div style="height:150px;background:linear-gradient(45deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;">React Component</div>
                    <div style="padding:14px;"><strong>Interactive Dashboard</strong><br><small style="color:#999;">by @janaksanjel</small></div>
                </div>
            </div>
        </div>
    `;
}

function createYouTubePage() {
    return `
        <div style="font-family:Roboto,sans-serif;background:#0f0f0f;color:#fff;min-height:100%;margin:-20px;padding:0;">
            <header style="background:#212121;padding:0 16px;height:54px;display:flex;align-items:center;gap:14px;">
                <i class="fab fa-youtube" style="font-size:24px;color:#f00;"></i>
                <strong style="font-size:18px;">YouTube</strong>
                <div style="flex:1;max-width:520px;margin:0 30px;display:flex;background:#121212;border:1px solid #303030;border-radius:20px;overflow:hidden;">
                    <input type="text" placeholder="Search" style="flex:1;background:none;border:none;color:#fff;padding:8px 16px;outline:none;">
                    <button style="background:#303030;border:none;color:#fff;padding:8px 18px;cursor:pointer;"><i class="fas fa-search"></i></button>
                </div>
            </header>
            <main style="padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;">
                ${[
                    ['Learn JavaScript in 2026 — Full Course', 'Code Academy · 1.2M views'],
                    ['React Hooks Explained', 'Dev Tips · 856K views'],
                    ['CSS Grid vs Flexbox', 'Web Dev Simplified · 2.1M views'],
                    ['Django REST Framework Deep Dive', 'Backend Pro · 480K views']
                ].map(([title, meta]) => `
                    <div style="cursor:pointer;">
                        <div style="width:100%;height:160px;background:linear-gradient(45deg,#ff4757,#ff6b7a);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
                            <i class="fas fa-play" style="font-size:30px;"></i>
                        </div>
                        <h3 style="margin:0 0 4px;font-size:15px;line-height:1.3;">${title}</h3>
                        <p style="color:#aaa;font-size:13px;margin:0;">${meta}</p>
                    </div>`).join('')}
            </main>
        </div>
    `;
}

function createStackOverflowPage() {
    return `
        <div style="font-family:-apple-system,sans-serif;background:#fff;min-height:100%;margin:-20px;padding:0;">
            <header style="background:#f8f9f9;border-top:3px solid #f48024;padding:10px 20px;border-bottom:1px solid #e3e6e8;display:flex;align-items:center;gap:12px;">
                <i class="fab fa-stack-overflow" style="font-size:22px;color:#f48024;"></i>
                <strong style="color:#232629;">Stack Overflow</strong>
                <input type="text" placeholder="Search…" style="margin-left:auto;max-width:300px;flex:1;padding:7px 12px;border:1px solid #babfc4;border-radius:6px;">
            </header>
            <div style="max-width:900px;margin:0 auto;padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h2 style="margin:0;font-size:22px;color:#232629;">Top Questions</h2>
                    <button style="background:#0a95ff;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;">Ask Question</button>
                </div>
                ${[
                    ['How to center a div in CSS?', 'javascript css html', '2 hours ago'],
                    ['Django ORM select_related vs prefetch_related', 'django python orm', '4 hours ago'],
                    ['MySQL index not being used in query', 'mysql database indexing', '6 hours ago']
                ].map(([q, tags, when]) => `
                    <div style="border:1px solid #e3e6e8;border-radius:6px;padding:14px;margin-bottom:12px;">
                        <h3 style="margin:0 0 6px;font-size:15px;"><a href="#" style="color:#0a95ff;text-decoration:none;">${q}</a></h3>
                        <div style="display:flex;gap:10px;font-size:12px;color:#6a737c;">
                            <span>${tags}</span><span style="margin-left:auto;">asked ${when}</span>
                        </div>
                    </div>`).join('')}
            </div>
        </div>
    `;
}

function createSearchResultsPage() {
    return `
        <div style="font-family:-apple-system,sans-serif;background:#fff;min-height:100%;margin:-20px;padding:20px;">
            <div style="max-width:720px;margin:0 auto;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                    <img src="./img/brave.png" alt="Brave" style="width:22px;height:22px;">
                    <strong style="color:#333;">Brave Search</strong>
                </div>
                <div style="display:flex;align-items:center;background:#f8f9fa;border:1px solid #dadce0;border-radius:22px;padding:9px 16px;max-width:480px;margin-bottom:20px;">
                    <i class="fas fa-search" style="color:#9aa0a6;margin-right:12px;"></i>
                    <input type="text" value="javascript tutorials" style="flex:1;border:none;background:none;outline:none;font-size:15px;">
                </div>
                <div style="color:#70757a;font-size:13px;margin-bottom:16px;">About 2,340,000 results (0.45 seconds)</div>
                ${[
                    ['JavaScript Tutorial — W3Schools', 'https://www.w3schools.com › js', "Learn JavaScript with the world's most popular JavaScript tutorial."],
                    ['JavaScript.info — The Modern Tutorial', 'https://javascript.info', 'Modern JavaScript Tutorial: simple but detailed explanations with examples and tasks.'],
                    ['Learn JavaScript — Free Interactive Tutorial', 'https://www.learn-js.org', 'Learn JavaScript online with free interactive tutorials and exercises.']
                ].map(([t, u, d]) => `
                    <div style="margin-bottom:22px;">
                        <h3 style="margin:0 0 3px;font-size:17px;"><a href="#" style="color:#1a0dab;text-decoration:none;">${t}</a></h3>
                        <div style="color:#006621;font-size:13px;margin-bottom:3px;">${u}</div>
                        <p style="color:#4d5156;font-size:13px;line-height:1.4;margin:0;">${d}</p>
                    </div>`).join('')}
            </div>
        </div>
    `;
}

function createGenericWebsite(url) {
    let domain = 'this site';
    try { domain = new URL(url).hostname.replace('www.', ''); } catch {}
    return `
        <div style="font-family:-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:40px 20px;">
            <header style="text-align:center;margin-bottom:36px;">
                <h1 style="font-size:32px;color:#333;margin-bottom:12px;">${domain.charAt(0).toUpperCase() + domain.slice(1)}</h1>
                <p style="font-size:16px;color:#666;">Welcome to ${domain}. This is a simulated website for demonstration purposes.</p>
            </header>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-bottom:32px;">
                <div style="background:#f5f5f7;padding:22px;border-radius:12px;"><h3 style="margin:0 0 8px;color:#333;">About Us</h3><p style="color:#666;margin:0;line-height:1.5;">Learn more about our company and team.</p></div>
                <div style="background:#f5f5f7;padding:22px;border-radius:12px;"><h3 style="margin:0 0 8px;color:#333;">Services</h3><p style="color:#666;margin:0;line-height:1.5;">Discover the range of solutions we offer.</p></div>
                <div style="background:#f5f5f7;padding:22px;border-radius:12px;"><h3 style="margin:0 0 8px;color:#333;">Contact</h3><p style="color:#666;margin:0;line-height:1.5;">Get in touch with our support team.</p></div>
            </div>
            <div style="text-align:center;padding:36px;background:linear-gradient(135deg,#0a84ff,#5e5ce6);border-radius:16px;color:#fff;">
                <h2 style="margin:0 0 10px;font-size:24px;">This is a simulated website</h2>
                <p style="margin:0;font-size:14px;opacity:.9;">Created for demonstration in the macOS web portfolio.</p>
            </div>
        </div>
    `;
}

function goBack() {
    const defaultPage = document.getElementById('default-page');
    const simulatedWebsite = document.querySelector('.simulated-website');
    const addressBar = document.querySelector('.address-bar input');
    const activeTab = document.querySelector('.tab.active');

    simulatedWebsite?.remove();
    if (defaultPage) defaultPage.style.display = 'flex';
    if (addressBar) addressBar.value = '';
    if (activeTab) {
        const tabIcon = activeTab.querySelector('i');
        const tabSpan = activeTab.querySelector('span');
        tabIcon.className = 'fas fa-home';
        tabSpan.textContent = 'New Tab';
    }
}

function goForward() {
    showNotification('No forward history available', 'fas fa-info-circle');
}

function refreshPage() {
    const simulatedWebsite = document.querySelector('.simulated-website');
    if (simulatedWebsite) {
        simulatedWebsite.style.opacity = '0.5';
        setTimeout(() => { simulatedWebsite.style.opacity = '1'; }, 400);
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const tabText = tab.querySelector('span').textContent;
    if (tabText === 'GitHub') navigateToUrl('https://github.com');
    else if (tabText === 'CodePen') navigateToUrl('https://codepen.io');
    else goBack();
}

function closeTab(tab) {
    const tabsContainer = tab.parentElement;
    const tabs = tabsContainer.querySelectorAll('.tab');
    if (tabs.length > 1) {
        const wasActive = tab.classList.contains('active');
        tab.remove();
        if (wasActive) {
            const remaining = tabsContainer.querySelectorAll('.tab');
            if (remaining.length > 0) switchTab(remaining[0]);
        }
    }
}

function createNewTab() {
    const tabsContainer = document.querySelector('.brave-tabs');
    if (!tabsContainer) return;
    const newTabBtn = tabsContainer.querySelector('.new-tab');
    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    const newTab = document.createElement('div');
    newTab.className = 'tab active';
    newTab.innerHTML = `<i class="fas fa-home"></i><span>New Tab</span><button class="tab-close">×</button>`;
    newTab.querySelector('.tab-close').addEventListener('click', function(e) {
        e.stopPropagation();
        closeTab(newTab);
    });
    newTab.addEventListener('click', function() {
        if (!this.classList.contains('active')) switchTab(this);
    });
    tabsContainer.insertBefore(newTab, newTabBtn);
    goBack();
}

// ------------------------------------------------------------
// Notifications
// ------------------------------------------------------------
function showNotification(message, icon) {
    const notification = document.createElement('div');
    notification.className = 'desktop-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.parentNode?.removeChild(notification), 300);
    }, 3000);
}

// ------------------------------------------------------------
// Portfolio navigation
// ------------------------------------------------------------
function showPortfolioSection(sectionName) {
    document.querySelectorAll('.portfolio-sections .section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const targetSection = document.getElementById(sectionName);
    if (targetSection) targetSection.classList.add('active');
    const targetNavItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    if (targetNavItem) targetNavItem.classList.add('active');
}

// ------------------------------------------------------------
// Fullscreen
// ------------------------------------------------------------
function toggleWebsiteFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err.message);
        });
    } else {
        document.exitFullscreen();
    }
}

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    loadUserFS();
    updateMenubarClock();
    setInterval(updateMenubarClock, 1000);
    fileSystem.load();

    // Desktop icon listeners
    document.querySelectorAll('.desktop-icon').forEach(icon => addIconEventListeners(icon));

    // Desktop click — deselect + close menus
    document.querySelector('.desktop').addEventListener('click', function() {
        deselectAllIcons();
        hideContextMenu();
        document.getElementById('apple-dropdown')?.classList.remove('open');
        document.getElementById('control-center')?.classList.remove('open');
    });

    // Desktop right-click
    document.querySelector('.desktop').addEventListener('contextmenu', function(e) {
        if (e.target === this || e.target.classList.contains('desktop-video') || e.target === this.querySelector('.desktop-icons')?.parentNode) {
            e.preventDefault();
            deselectAllIcons();
            showContextMenu(e.clientX, e.clientY, null, true);
        }
    });

    // Dock clicks
    document.querySelectorAll('.dock-item').forEach(item => {
        item.addEventListener('click', function() {
            toggleWindow(this.dataset.app);
        });
    });

    // Traffic lights (event delegation for dynamic windows too)
    document.addEventListener('click', function(e) {
        const closeBtn = e.target.closest('.tl.close');
        const minBtn = e.target.closest('.tl.minimize');
        const maxBtn = e.target.closest('.tl.maximize');
        if (closeBtn) closeWindow(closeBtn.closest('.window'));
        else if (minBtn) minimizeWindow(minBtn.closest('.window'));
        else if (maxBtn) toggleMaximize(maxBtn.closest('.window'));
    });

    // Double-click header to maximize
    document.querySelectorAll('.window-header').forEach(header => {
        header.addEventListener('dblclick', function(e) {
            if (e.target.closest('.tl')) return;
            toggleMaximize(this.closest('.window'));
        });
    });

    // Dragging
    document.querySelectorAll('.window-header').forEach(header => {
        header.addEventListener('mousedown', startDrag);
    });
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    // Click on window brings to front
    document.addEventListener('mousedown', function(e) {
        const win = e.target.closest('.window');
        if (win && win !== activeWindow && !e.target.closest('.tl')) {
            bringToFront(win);
            activeWindow = win;
            updateMenubarAppName(win);
        }
    });

    // Menu bar
    document.getElementById('apple-menu-btn')?.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleAppleMenu();
    });
    document.querySelectorAll('.apple-dd-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            handleAppleAction(this.dataset.action);
        });
    });
    document.getElementById('menubar-search')?.addEventListener('click', function(e) {
        e.stopPropagation();
        openFinder();
    });
    document.getElementById('about-more-btn')?.addEventListener('click', function() {
        closeWindow(document.getElementById('about-window'));
        openWindow('portfolio');
        showPortfolioSection('about');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#apple-dropdown') && !e.target.closest('#apple-menu-btn')) {
            document.getElementById('apple-dropdown')?.classList.remove('open');
        }
        if (!e.target.closest('#control-center') && !e.target.closest('#menubar-wifi')) {
            document.getElementById('control-center')?.classList.remove('open');
        }
        if (!e.target.closest('.context-menu')) {
            hideContextMenu();
        }
    });

    // Control center toggle via wifi icon
    document.getElementById('menubar-wifi')?.addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('apple-dropdown')?.classList.remove('open');
        document.getElementById('control-center')?.classList.toggle('open');
    });

    // Finder controls
    document.getElementById('finder-back')?.addEventListener('click', finderBack);
    document.getElementById('finder-forward')?.addEventListener('click', finderForward);
    document.getElementById('finder-new-folder')?.addEventListener('click', finderNewFolder);
    document.getElementById('finder-new-file')?.addEventListener('click', finderNewFile);

    document.querySelectorAll('.finder-sidebar .sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            const nav = this.dataset.nav;
            if (nav === 'root') {
                finderPath = ['root'];
            } else if (finderFS[nav]) {
                finderPath = [nav];
            } else {
                return;
            }
            finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
            finderHistory.push(finderPath[finderPath.length - 1]);
            finderHistoryIndex = finderHistory.length - 1;
            renderFinder();
        });
    });

    // Finder content empty-area right click
    document.getElementById('finder-content')?.addEventListener('contextmenu', function(e) {
        if (e.target === this || e.target.closest('.finder-empty')) {
            e.preventDefault();
            hideContextMenu();
            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.innerHTML = `
                <div class="context-item" data-act="nf">New Folder</div>
                <div class="context-item" data-act="nfile">New File</div>
                <div class="context-separator"></div>
                <div class="context-item" data-act="up">Back to Parent</div>
            `;
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
            document.body.appendChild(menu);
            menu.querySelector('[data-act="nf"]').onclick = () => { finderNewFolder(); hideContextMenu(); };
            menu.querySelector('[data-act="nfile"]').onclick = () => { finderNewFile(); hideContextMenu(); };
            menu.querySelector('[data-act="up"]').onclick = () => { navigateUp(); hideContextMenu(); };
        }
    });

    // Portfolio navigation
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.addEventListener('click', function() {
            showPortfolioSection(this.dataset.section);
        });
    });

    // Tabs
    document.querySelectorAll('.tab-close').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeTab(this.closest('.tab'));
        });
    });
    document.querySelector('.new-tab')?.addEventListener('click', createNewTab);
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (!this.classList.contains('active')) switchTab(this);
        });
    });

    initializeBraveBrowser();

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F11') {
            e.preventDefault();
            toggleWebsiteFullscreen();
        }
        if (e.key === 'F2' && selectedIcon) startRename(selectedIcon);
        if (e.key === 'Enter' && selectedIcon) {
            const app = selectedIcon.dataset.app;
            if (app) openWindow(app);
        }
        if (e.ctrlKey && e.key === 't' && activeWindow?.id === 'brave-window') {
            e.preventDefault();
            createNewTab();
        }
        if (e.ctrlKey && e.key === 'w' && activeWindow?.id === 'brave-window') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) closeTab(activeTab);
        }
    });

    // Initial dock state
    updateDockState();
});

// ------------------------------------------------------------
// Lock Screen
// ------------------------------------------------------------
(function initLockScreen() {
    const lock = document.getElementById('lockscreen');
    if (!lock) return;

    // Auto request fullscreen when lock screen is visible
    function requestLockFullscreen() {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
            try {
                const p = req.call(el);
                if (p && p.catch) p.catch(() => {});
            } catch (err) {
                /* fullscreen not allowed yet */
            }
        }
    }
    requestLockFullscreen();
    // Browsers block fullscreen without a user gesture, so also try on
    // the first interaction while the lock screen is showing.
    document.addEventListener('click', requestLockFullscreen, { once: true });
    document.addEventListener('keydown', requestLockFullscreen, { once: true });

    const timeEl = lock.querySelector('.ls-time');
    const dateEl = lock.querySelector('.ls-date');

    function updateLockClock() {
        const now = new Date();
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        }
    }
    updateLockClock();
    setInterval(updateLockClock, 1000);

    function unlockDesktop() {
        lock.classList.add('hidden');
        setTimeout(() => lock.remove(), 700);
        // Fullscreen is kept for the whole website (see enterSiteFullscreen below)
    }

    lock.addEventListener('click', function() {
        if (!lock.classList.contains('hidden')) {
            lock.classList.add('signing');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (!document.body.contains(lock) || lock.classList.contains('hidden')) return;
        if (lock.classList.contains('signing') && e.key === 'Enter') {
            unlockDesktop();
        } else {
            lock.classList.add('signing');
        }
    });

    const signInBtn = lock.querySelector('.lockscreen-signin');
    if (signInBtn) {
        signInBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            unlockDesktop();
        });
    }
})();

// ------------------------------------------------------------
// Fullscreen for the whole website (not just the lock screen)
// ------------------------------------------------------------
function enterSiteFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
        try {
            const p = req.call(el);
            if (p && p.catch) p.catch(() => {});
        } catch (err) {
            /* fullscreen not allowed yet */
        }
    }
}

// Try immediately on load (works if the browser already granted permission,
// e.g. after a reload in the same tab).
document.addEventListener('DOMContentLoaded', enterSiteFullscreen);

// Browsers require a user gesture for fullscreen, so also trigger on the
// first click or keypress anywhere on the site.
document.addEventListener('click', enterSiteFullscreen, { once: true });
document.addEventListener('keydown', enterSiteFullscreen, { once: true });

// If the user leaves fullscreen (Esc or F11), re-enter on their next click/keypress.
document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
        document.addEventListener('click', enterSiteFullscreen, { once: true });
        document.addEventListener('keydown', enterSiteFullscreen, { once: true });
    }
});

// ============================================================
// VS Code — fully working web edition
// Explorer (real Finder FS), tabs, syntax-highlighted editor,
// search, run, extensions, terminal with commands, status bar.
// ============================================================
const vscodeState = {
    openTabs: [],      // { id, name, content, dirty }
    activeTabId: null,
    expanded: {},      // folderId -> bool
    selectedId: null,
    initialized: false
};

const vscodeExts = [
    { name: 'Python', desc: 'IntelliSense, linting, debugging for Python', icon: 'fab fa-python', color: '#3572A5', meta: 'Microsoft · Installed' },
    { name: 'Java Extension Pack', desc: 'Java language support for VS Code', icon: 'fab fa-java', color: '#b07219', meta: 'Microsoft · Installed' },
    { name: 'Django', desc: 'Django template & ORM snippets', icon: 'fas fa-database', color: '#0c4b33', meta: 'Baptiste Darthenay · Installed' },
    { name: 'Prettier', desc: 'Code formatter using prettier', icon: 'fas fa-align-left', color: '#1a2b34', meta: 'Prettier · Installed' },
    { name: 'GitLens', desc: 'Supercharge Git in VS Code', icon: 'fab fa-git-alt', color: '#f14e32', meta: 'GitKraken · Available' },
    { name: 'Live Share', desc: 'Real-time collaborative editing', icon: 'fas fa-users', color: '#5c2d91', meta: 'Microsoft · Available' }
];

function openVSCode() {
    const win = document.getElementById('vscode-window');
    if (!win) return;
    win.style.display = 'block';
    bringToFront(win);
    activeWindow = win;
    updateDockState();
    updateMenubarAppName(win);
    if (!vscodeState.initialized) {
        vscodeState.initialized = true;
        renderVSCodeTree();
        initVSCodeUI();
    }
}

// ---------- Explorer tree (reads the same virtual FS as Finder) ----------
function vscodeCollectFiles() {
    const files = [];
    function walk(node, path) {
        (node.children || []).forEach(child => {
            const p = path ? path + '/' + child.name : child.name;
            if (child.type === 'folder') walk(child, p);
            else files.push({ node: child, path: p });
        });
    }
    Object.values(finderFS).forEach(node => {
        if (node && node.children) walk(node, node.id);
    });
    return files;
}

function vscodeFindNode(id) {
    let found = null;
    function walk(node) {
        if (found) return;
        if (node.id === id) { found = node; return; }
        (node.children || []).forEach(walk);
    }
    Object.values(finderFS).forEach(node => {
        if (node && node.children) walk(node);
    });
    return found;
}

function vscodeDisplayName(id) {
    const f = vscodeCollectFiles().find(x => x.node.id === id);
    return f ? f.path : (vscodeFindNode(id) || {}).name || id;
}

function vscodeFileIcon(node) {
    const n = node.name.toLowerCase();
    if (n.endsWith('.html')) return 'fab fa-html5';
    if (n.endsWith('.css')) return 'fab fa-css3-alt';
    if (n.endsWith('.js')) return 'fab fa-js';
    if (n.endsWith('.py')) return 'fab fa-python';
    if (n.endsWith('.java')) return 'fab fa-java';
    if (n.endsWith('.sql')) return 'fas fa-database';
    if (n.endsWith('.md')) return 'fab fa-markdown';
    if (n.endsWith('.json')) return 'fas fa-brackets-curly';
    if (n.includes('.txt') || n.endsWith('.notes')) return 'far fa-file-alt';
    return node.icon || 'far fa-file-alt';
}

function renderVSCodeTree() {
    const tree = document.getElementById('vscode-tree');
    if (!tree) return;
    tree.innerHTML = '';
    Object.values(finderFS).forEach(node => {
        if (node && node.children) tree.appendChild(vscodeBuildNode(node, 0));
    });
}

function vscodeBuildNode(node, depth) {
    const row = document.createElement('div');
    row.className = 'vscode-tree-item ' + node.type;
    row.dataset.id = node.id;
    row.style.paddingLeft = (12 + depth * 14) + 'px';
    if (vscodeState.selectedId === node.id) row.classList.add('selected');

    const twisty = document.createElement('span');
    twisty.className = 'twisty';
    twisty.textContent = node.type === 'folder' ? (vscodeState.expanded[node.id] ? '▾' : '▸') : '';
    row.appendChild(twisty);

    const icon = document.createElement('i');
    icon.className = node.type === 'folder' ? 'fas fa-folder' : vscodeFileIcon(node);
    row.appendChild(icon);

    const label = document.createElement('span');
    label.textContent = node.name;
    row.appendChild(label);

    row.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.vscode-tree-item.selected').forEach(el => el.classList.remove('selected'));
        row.classList.add('selected');
        vscodeState.selectedId = node.id;
        if (node.type === 'folder') {
            vscodeState.expanded[node.id] = !vscodeState.expanded[node.id];
            renderVSCodeTree();
        } else {
            vscodeOpenFile(node.id);
        }
    });

    if (node.type === 'folder' && vscodeState.expanded[node.id]) {
        const frag = document.createDocumentFragment();
        frag.appendChild(row);
        (node.children || []).forEach(child => frag.appendChild(vscodeBuildNode(child, depth + 1)));
        return frag;
    }
    return row;
}

// ---------- Tabs + editor ----------
function vscodeOpenFile(id) {
    const node = vscodeFindNode(id);
    if (!node) return;
    let tab = vscodeState.openTabs.find(t => t.id === id);
    if (!tab) {
        tab = { id: id, name: node.name, content: node.content || '', dirty: false };
        vscodeState.openTabs.push(tab);
    }
    vscodeState.activeTabId = id;
    vscodeRenderTabs();
    vscodeRenderEditor(tab);
    vscodeSetStatus('Opened ' + vscodeDisplayName(id));
}

function vscodeRenderTabs() {
    const bar = document.getElementById('vscode-tabs');
    if (!bar) return;
    bar.innerHTML = '';
    if (!vscodeState.openTabs.length) {
        const hint = document.createElement('div');
        hint.className = 'vscode-welcome-tabs-hint';
        hint.textContent = 'No editors open';
        bar.appendChild(hint);
        return;
    }
    vscodeState.openTabs.forEach(tab => {
        const el = document.createElement('div');
        el.className = 'vscode-tab' + (tab.id === vscodeState.activeTabId ? ' active' : '');
        const icon = document.createElement('i');
        icon.className = vscodeFileIcon(vscodeFindNode(tab.id) || { name: tab.name });
        el.appendChild(icon);
        const name = document.createElement('span');
        name.textContent = (tab.dirty ? '● ' : '') + tab.name;
        el.appendChild(name);
        const close = document.createElement('button');
        close.className = 'vscode-tab-close';
        close.textContent = '×';
        close.addEventListener('click', function(e) {
            e.stopPropagation();
            vscodeCloseTab(tab.id);
        });
        el.appendChild(close);
        el.addEventListener('click', function() {
            vscodeState.activeTabId = tab.id;
            vscodeRenderTabs();
            vscodeRenderEditor(tab);
        });
        bar.appendChild(el);
    });
}

function vscodeRenderEditor(tab) {
    const area = document.getElementById('vscode-editor-area');
    if (!area) return;
    area.innerHTML = '';
    if (!tab) {
        area.innerHTML = vscodeWelcomeHTML();
        return;
    }
    const editor = document.createElement('div');
    editor.className = 'vscode-editor active';
    const code = document.createElement('div');
    code.className = 'vscode-code';
    code.contentEditable = 'true';
    code.spellcheck = false;
    vscodeRebuildRows(code, tab);
    editor.appendChild(code);
    area.appendChild(editor);

    // Live editing: caret-offset based, then rebuild rows + re-highlight
    code.addEventListener('beforeinput', function(e) {
        const supported = ['insertText', 'insertParagraph', 'insertLineBreak', 'insertFromPaste', 'deleteContentBackward', 'deleteContentForward'];
        if (!supported.includes(e.inputType)) { e.preventDefault(); return; }
        e.preventDefault();
        const offset = vscodeGetCaretOffset(code);
        let newOffset = offset;
        let edited = true;
        if (e.inputType === 'insertText' && e.data) {
            tab.content = tab.content.slice(0, offset) + e.data + tab.content.slice(offset);
            newOffset = offset + e.data.length;
        } else if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') {
            tab.content = tab.content.slice(0, offset) + '\n' + tab.content.slice(offset);
            newOffset = offset + 1;
        } else if (e.inputType === 'insertFromPaste' && e.dataTransfer) {
            const text = e.dataTransfer.getData('text/plain') || '';
            tab.content = tab.content.slice(0, offset) + text + tab.content.slice(offset);
            newOffset = offset + text.length;
        } else if (e.inputType === 'deleteContentBackward' && offset > 0) {
            tab.content = tab.content.slice(0, offset - 1) + tab.content.slice(offset);
            newOffset = offset - 1;
        } else if (e.inputType === 'deleteContentForward' && offset < tab.content.length) {
            tab.content = tab.content.slice(0, offset) + tab.content.slice(offset + 1);
            newOffset = offset;
        } else {
            edited = false;
        }
        if (!edited) return;
        tab.dirty = true;
        vscodeRebuildRows(code, tab);
        vscodeSetCaretOffset(code, newOffset);
        vscodePersistTab(tab);
        vscodeUpdateTabLabel(tab);
        const file = vscodeCollectFiles().find(x => x.node.id === tab.id);
        const before = tab.content.slice(0, newOffset);
        const ln = before.split('\n').length;
        const col = newOffset - before.lastIndexOf('\n') ;
        vscodeSetStatusRight((file ? file.path : tab.name) + ' · Ln ' + ln + ', Col ' + col);
    });

    const file = vscodeCollectFiles().find(x => x.node.id === tab.id);
    vscodeSetStatusRight((file ? file.path : tab.name) + ' · Ln 1, Col 1');
}

function vscodeWelcomeHTML() {
    return `\n                <img src="./img/vscode.png" alt="VS Code" />\n                <h1>Visual Studio Code</h1>\n                <p>Web Edition — Janak Sanjel's workspace</p>\n                <div class="vscode-welcome-keys">\n                  <div><span>Open a file</span><kbd>Click a file in the Explorer</kbd></div>\n                  <div><span>Terminal</span><kbd>Ctrl + \`</kbd></div>\n                  <div><span>Command Palette</span><kbd>Ctrl + Shift + P</kbd></div>\n                </div>\n              `;
}

function vscodeRebuildRows(code, tab) {
    code.innerHTML = '';
    tab.content.split('\n').forEach((line, i) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'vscode-code-line';
        const no = document.createElement('span');
        no.className = 'vscode-line-no';
        no.textContent = i + 1;
        const src = document.createElement('span');
        src.className = 'vscode-line-code';
        src.innerHTML = vscodeHighlight(line) || '&nbsp;';
        rowEl.appendChild(no);
        rowEl.appendChild(src);
        code.appendChild(rowEl);
    });
}

function vscodeGetCaretOffset(root) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return 0;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer)) return 0;
    const pre = document.createRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
}

function vscodeSetCaretOffset(root, offset) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let remaining = offset, node;
    while ((node = walker.nextNode())) {
        if (remaining <= node.length) {
            const sel = window.getSelection();
            const range = document.createRange();
            try {
                range.setStart(node, remaining);
            } catch (err) {
                range.setStart(node, node.length);
            }
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        remaining -= node.length;
    }
}

function vscodeUpdateTabLabel(tab) {
    const bar = document.getElementById('vscode-tabs');
    if (!bar) return;
    const active = bar.querySelector('.vscode-tab.active span');
    if (active) active.textContent = (tab.dirty ? '● ' : '') + tab.name;
}

function vscodeCloseTab(id) {
    const idx = vscodeState.openTabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    vscodeState.openTabs.splice(idx, 1);
    if (vscodeState.activeTabId === id) {
        const next = vscodeState.openTabs[idx] || vscodeState.openTabs[idx - 1];
        vscodeState.activeTabId = next ? next.id : null;
    }
    vscodeRenderTabs();
    const active = vscodeState.openTabs.find(t => t.id === vscodeState.activeTabId);
    vscodeRenderEditor(active || null);
}

function vscodePersistTab(tab) {
    const node = vscodeFindNode(tab.id);
    if (node) {
        node.content = tab.content;
        fileSystem.save();
        saveUserFS();
    }
}

// ---------- Lightweight syntax highlighting ----------
function vscodeHighlight(line) {
    const esc = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const parts = [];
    // Order matters: comments, strings, then keywords/numbers on the rest
    const re = /(\/\/.*$|#(?![^\[]*\]).*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:const|let|var|function|return|if|else|for|while|class|import|from|export|default|new|await|async|def|self|None|True|False|print|public|private|static|void|int|String|boolean|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|JOIN|ON|AS)\b)|(\b\d+(?:\.\d+)?\b)/gi;
    let last = 0, m;
    while ((m = re.exec(esc)) !== null) {
        if (m.index > last) parts.push({ t: esc.slice(last, m.index), c: null });
        let cls = null;
        if (m[1] !== undefined) cls = 'tok-com';
        else if (m[2] !== undefined) cls = 'tok-str';
        else if (m[3] !== undefined) cls = 'tok-key';
        else if (m[4] !== undefined) cls = 'tok-num';
        parts.push({ t: m[0], c: cls });
        last = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
    }
    if (last < esc.length) parts.push({ t: esc.slice(last), c: null });
    return parts.map(p => p.c ? '<span class="' + p.c + '">' + p.t + '</span>' : p.t).join('');
}

// ---------- Activity bar panels (search / run / extensions) ----------
function initVSCodeUI() {
    document.querySelectorAll('.vscode-act-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.vscode-act-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.dataset.view;
            if (view === 'explorer') {
                vscodeShowExplorer();
            } else if (view === 'search') {
                vscodeShowSearch();
            } else if (view === 'run') {
                vscodeShowRun();
            } else if (view === 'extensions') {
                vscodeShowExtensions();
            }
        });
    });

    // Terminal toggle (Ctrl + `)
    document.addEventListener('keydown', function(e) {
        const win = document.getElementById('vscode-window');
        if (!win || win.style.display === 'none') return;
        if (e.ctrlKey && e.key === '`') {
            e.preventDefault();
            vscodeToggleTerminal();
        }
    });

    const termClose = document.getElementById('vscode-term-close');
    if (termClose) termClose.addEventListener('click', vscodeToggleTerminal);

    const termInput = document.getElementById('vscode-term-input');
    if (termInput) {
        termInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                vscodeRunCommand(this.value);
                this.value = '';
            }
        });
    }

    // Clicking editor area hides side panels
    const area = document.getElementById('vscode-editor-area');
    if (area) {
        area.addEventListener('mousedown', function() {
            const panel = area.querySelector('.vscode-panel');
            if (panel) {
                panel.remove();
                document.querySelectorAll('.vscode-act-btn').forEach(b => b.classList.remove('active'));
            }
        });
    }
}

function vscodeShowExplorer() {
    const sb = document.getElementById('vscode-sidebar');
    if (!sb) return;
    sb.style.display = '';
    // Rebuild sidebar markup (search/run/extensions panels replace it)
    sb.innerHTML = '<div class="vscode-side-title">EXPLORER</div><div class="vscode-tree" id="vscode-tree"></div>';
    renderVSCodeTree();
    const area = document.getElementById('vscode-editor-area');
    const panel = area && area.querySelector('.vscode-panel');
    if (panel) panel.remove();
    document.querySelectorAll('.vscode-act-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === 'explorer');
    });
}

function vscodeShowSearch() {
    const sb = document.getElementById('vscode-sidebar');
    if (!sb) return;
    sb.style.display = '';
    sb.innerHTML = `
        <div class="vscode-side-title">SEARCH</div>
        <div class="vscode-panel">
            <input type="text" id="vscode-search-input" placeholder="Search files..." />
            <div id="vscode-search-results"><span class="muted">Type to search across all files</span></div>
        </div>`;
    const input = document.getElementById('vscode-search-input');
    if (input) {
        input.addEventListener('input', function() {
            vscodeDoSearch(this.value);
        });
        input.focus();
    }
}

function vscodeDoSearch(q) {
    const box = document.getElementById('vscode-search-results');
    if (!box) return;
    box.innerHTML = '';
    if (!q.trim()) {
        box.innerHTML = '<span class="muted">Type to search across all files</span>';
        return;
    }
    const needle = q.toLowerCase();
    let count = 0;
    vscodeCollectFiles().forEach(f => {
        const hay = ((f.node.name || '') + ' ' + (f.node.content || '')).toLowerCase();
        const idx = hay.indexOf(needle);
        if (idx === -1 || count >= 30) return;
        count++;
        const row = document.createElement('div');
        row.className = 'vscode-search-result';
        const snippet = ((f.node.content || '').replace(/\s+/g, ' ') || f.node.name);
        const at = snippet.toLowerCase().indexOf(needle);
        let html = vscodeEsc(snippet.slice(Math.max(0, at - 20), at + needle.length + 30));
        html = html.replace(new RegExp(vscodeEsc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), m => '<mark>' + m + '</mark>');
        row.innerHTML = '<i class="' + vscodeFileIcon(f.node) + '"></i> <strong>' + vscodeEsc(f.node.name) + '</strong><br><small class="muted">' + f.path + '</small><br>' + html;
        row.addEventListener('click', function() {
            vscodeOpenFile(f.node.id);
        });
        box.appendChild(row);
    });
    if (!count) box.innerHTML = '<span class="muted">No results found</span>';
}

function vscodeShowRun() {
    const sb = document.getElementById('vscode-sidebar');
    if (!sb) return;
    sb.style.display = '';
    sb.innerHTML = `
        <div class="vscode-side-title">RUN AND DEBUG</div>
        <div class="vscode-panel">
            <p class="muted">Run and Debug</p>
            <p class="muted" style="font-size:12px;">To customize Run and Debug, create a launch.json file.</p>
            <button class="vscode-run-btn" id="vscode-run-btn"><i class="fas fa-play"></i> Run active file</button>
            <div id="vscode-run-out" class="muted" style="margin-top:10px; font-size:12px;"></div>
        </div>`;
    const btn = document.getElementById('vscode-run-btn');
    if (btn) btn.addEventListener('click', vscodeRunActiveFile);
}

function vscodeRunActiveFile() {
    const out = document.getElementById('vscode-run-out');
    const tab = vscodeState.openTabs.find(t => t.id === vscodeState.activeTabId);
    if (!out) return;
    if (!tab) {
        out.innerHTML = '<span class="t-err">No file is open in the editor.</span>';
        return;
    }
    const name = tab.name.toLowerCase();
    vscodeToggleTerminal(true);
    if (name.endsWith('.py')) {
        vscodeTermPrint('$ python ' + tab.name, 't-dim');
        vscodeTermPrint('Hello from ' + tab.name + ' — Python runtime (simulated)', 't-ok');
    } else if (name.endsWith('.js')) {
        vscodeTermPrint('$ node ' + tab.name, 't-dim');
        vscodeTermPrint('Node.js v22 — script finished (simulated)', 't-ok');
    } else if (name.endsWith('.html')) {
        vscodeTermPrint('$ open ' + tab.name, 't-dim');
        vscodeTermPrint('Preview: open it in Safari from the Dock for the real page.', 't-ok');
    } else {
        vscodeTermPrint('$ ' + tab.name, 't-dim');
        vscodeTermPrint('No runtime available for this file type.', 't-err');
    }
    vscodeSetStatus('Debug session started');
}

function vscodeShowExtensions() {
    const sb = document.getElementById('vscode-sidebar');
    if (!sb) return;
    sb.style.display = '';
    sb.innerHTML = `
        <div class="vscode-side-title">EXTENSIONS</div>
        <div class="vscode-panel" style="padding:0 8px;">${vscodeExts.map(ext => `
            <div class="vscode-ext-item">
                <div class="ext-icon"><i class="${ext.icon}" style="color:${ext.color};"></i></div>
                <div>
                    <div class="ext-name">${ext.name}</div>
                    <div class="ext-desc">${ext.desc}</div>
                    <div class="ext-meta">${ext.meta}</div>
                </div>
            </div>`).join('')}
        </div>`;
}

// ---------- Terminal ----------
function vscodeToggleTerminal(forceOpen) {
    const term = document.getElementById('vscode-terminal');
    if (!term) return;
    const show = forceOpen === true ? true : term.style.display === 'none';
    term.style.display = show ? 'flex' : 'none';
    if (show) {
        const out = document.getElementById('vscode-term-output');
        if (out && !out.dataset.init) {
            out.dataset.init = '1';
            vscodeTermPrint('Web VS Code terminal — type `help` for commands.', 't-dim');
        }
        const input = document.getElementById('vscode-term-input');
        if (input) input.focus();
    }
}

function vscodeTermPrint(text, cls) {
    const out = document.getElementById('vscode-term-output');
    if (!out) return;
    const div = document.createElement('div');
    if (cls) div.className = cls;
    div.textContent = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
}

function vscodeRunCommand(cmdLine) {
    const cmd = cmdLine.trim();
    vscodeTermPrint('janak@mac ~ % ' + cmd);
    if (!cmd) return;
    const [name, ...args] = cmd.split(/\s+/);
    switch (name) {
        case 'help':
            vscodeTermPrint('Available: help, ls, cd, cat <file>, open <file>, code <file>, clear, echo, date, whoami, pwd, tree, node <file>, python <file>, exit');
            break;
        case 'ls':
        case 'dir': {
            const files = vscodeCollectFiles();
            vscodeTermPrint(files.map(f => f.path).join('\n'));
            break;
        }
        case 'pwd':
            vscodeTermPrint('/Users/janak');
            break;
        case 'whoami':
            vscodeTermPrint('janak');
            break;
        case 'date':
            vscodeTermPrint(new Date().toString());
            break;
        case 'echo':
            vscodeTermPrint(args.join(' '));
            break;
        case 'tree': {
            const files = vscodeCollectFiles();
            vscodeTermPrint(files.length + ' files in workspace\n' + files.map(f => '  ' + f.path).join('\n'));
            break;
        }
        case 'cat':
        case 'code':
        case 'open': {
            if (!args.length) { vscodeTermPrint('usage: ' + name + ' <file>', 't-err'); break; }
            const target = vscodeCollectFiles().find(f =>
                f.node.name.toLowerCase() === args.join(' ').toLowerCase() ||
                f.path.toLowerCase() === args.join(' ').toLowerCase());
            if (!target) { vscodeTermPrint('No such file: ' + args.join(' '), 't-err'); break; }
            if (name === 'cat') {
                vscodeTermPrint(target.node.content || '(empty file)');
            } else {
                vscodeOpenFile(target.node.id);
                vscodeTermPrint('Opened ' + target.path, 't-ok');
            }
            break;
        }
        case 'node':
        case 'python': {
            if (!args.length) { vscodeTermPrint('usage: ' + name + ' <file>', 't-err'); break; }
            const f = vscodeCollectFiles().find(x => x.node.name.toLowerCase() === args.join(' ').toLowerCase());
            if (!f) { vscodeTermPrint('No such file: ' + args.join(' '), 't-err'); break; }
            vscodeTermPrint(name + ' ' + f.path + ' — executed (simulated runtime)', 't-ok');
            break;
        }
        case 'clear': {
            const out = document.getElementById('vscode-term-output');
            if (out) out.innerHTML = '';
            break;
        }
        case 'exit':
            vscodeToggleTerminal();
            break;
        default:
            vscodeTermPrint('command not found: ' + name + ' (try `help`)', 't-err');
    }
}

function vscodeEsc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------- Status bar ----------
function vscodeSetStatus(text) {
    const el = document.getElementById('vscode-status-left');
    if (el) el.textContent = text;
}

function vscodeSetStatusRight(text) {
    const el = document.getElementById('vscode-status-right');
    if (el) el.textContent = text;
}
