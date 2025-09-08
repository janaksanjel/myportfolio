// Window management
let activeWindow = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Local storage for files and folders
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
        items.forEach(item => {
            const element = document.createElement('div');
            element.className = `desktop-icon ${item.type}-icon`;
            element.dataset.content = item.content || '';
            element.innerHTML = `
                <i class="fas fa-${item.type === 'folder' ? 'folder' : 'file'}" style="font-size: 48px; color: ${item.type === 'folder' ? '#FFD700' : '#4A90E2'}; margin-bottom: 10px;"></i>
                <span>${item.name}</span>
            `;
            addIconEventListeners(element);
            desktopIcons.appendChild(element);
        });
    }
};

// Initialize the desktop
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 1000);
    fileSystem.load();
    
    // Desktop icon functionality
    let selectedIcon = null;
    let clickTimeout = null;
    
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        addIconEventListeners(icon);
    });
    
    // Click desktop to deselect
    document.querySelector('.desktop').addEventListener('click', function() {
        deselectAllIcons();
        hideContextMenu();
    });
    
    // Right click desktop for context menu
    document.querySelector('.desktop').addEventListener('contextmenu', function(e) {
        if (e.target === this) {
            e.preventDefault();
            deselectAllIcons();
            showContextMenu(e.clientX, e.clientY, null, true);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (selectedIcon) {
            if (e.key === 'F2') {
                startRename(selectedIcon);
            } else if (e.key === 'Enter') {
                const app = selectedIcon.dataset.app;
                if (app) openWindow(app);
            }
        }
    });
    
    // Taskbar app clicks
    document.querySelectorAll('.taskbar-app').forEach(app => {
        app.addEventListener('click', function() {
            const appName = this.dataset.app;
            toggleWindow(appName);
            updateTaskbarState();
        });
    });
    
    // Portfolio navigation
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.addEventListener('click', function() {
            const sectionName = this.dataset.section;
            showPortfolioSection(sectionName);
        });
    });
    
    // Calculate experience duration on load
    calculateExperienceDuration();
    
    // Start button functionality
    document.getElementById('start-btn').addEventListener('click', function() {
        toggleStartMenu();
    });
    
    // Start menu app clicks
    document.querySelectorAll('.start-app').forEach(app => {
        app.addEventListener('click', function() {
            const appName = this.dataset.app;
            if (appName === 'explorer') {
                openWindow('explorer');
            } else if (appName) {
                openWindow(appName);
            }
            closeStartMenu();
        });
    });
    
    // Add network status animation
    animateNetworkStatus();
    
    // Start menu search functionality
    const startSearchInput = document.querySelector('.start-search input');
    if (startSearchInput) {
        startSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const apps = document.querySelectorAll('.start-app');
            
            apps.forEach(app => {
                const appName = app.querySelector('span').textContent.toLowerCase();
                if (appName.includes(searchTerm)) {
                    app.style.display = 'flex';
                } else {
                    app.style.display = searchTerm === '' ? 'flex' : 'none';
                }
            });
        });
    }
    
    // Close start menu when clicking outside
    document.addEventListener('click', function(e) {
        const startMenu = document.getElementById('start-menu');
        const startBtn = document.getElementById('start-btn');
        
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            closeStartMenu();
        }
    });
    
    // Search functionality
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            alert('Search: ' + this.value);
        }
    });
    
    // System tray clicks
    const wifiIcon = document.getElementById('wifi-icon');
    if (wifiIcon) {
        wifiIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleTrayPopup('wifi-popup');
        });
    }
    
    const volumeIcon = document.getElementById('volume-icon');
    if (volumeIcon) {
        volumeIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleTrayPopup('volume-popup');
        });
    }
    
    const batteryIcon = document.getElementById('battery-icon');
    if (batteryIcon) {
        batteryIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleTrayPopup('battery-popup');
        });
    }
    
    // Close tray popups when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.tray-popup') && !e.target.closest('.tray-icons i')) {
            closeTrayPopups();
        }
    });
    
    const datetime = document.getElementById('datetime');
    if (datetime) {
        datetime.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleTrayPopup('clock-popup');
            updateClockPopup();
            generateCalendar();
        });
    }
    
    // Window controls
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            const window = this.closest('.window');
            closeWindow(window);
        });
    });
    
    document.querySelectorAll('.minimize').forEach(btn => {
        btn.addEventListener('click', function() {
            const window = this.closest('.window');
            minimizeWindow(window);
        });
    });
    
    document.querySelectorAll('.maximize').forEach(btn => {
        btn.addEventListener('click', function() {
            const window = this.closest('.window');
            toggleMaximize(window);
        });
    });
    
    // Double-click window header to maximize/restore
    document.querySelectorAll('.window-header').forEach(header => {
        header.addEventListener('dblclick', function() {
            const window = this.closest('.window');
            toggleMaximize(window);
        });
    });
    
    // Window dragging
    document.querySelectorAll('.window-header').forEach(header => {
        header.addEventListener('mousedown', startDrag);
    });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Tab functionality
    document.querySelectorAll('.tab-close').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeTab(this.closest('.tab'));
        });
    });
    
    document.querySelector('.new-tab')?.addEventListener('click', createNewTab);
    
    // Brave browser functionality
    initializeBraveBrowser();
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (!this.classList.contains('active')) {
                switchTab(this);
            }
        });
    });
});

// Time and date update
function updateTime() {
    const now = new Date();
    const timeElement = document.querySelector('.time');
    const dateElement = document.querySelector('.date');
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    // Update clock popup if open
    updateClockPopup();
}

function updateClockPopup() {
    const now = new Date();
    const popupTime = document.getElementById('popup-time');
    const popupDate = document.getElementById('popup-date');
    
    if (popupTime) {
        popupTime.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
    
    if (popupDate) {
        popupDate.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

let currentCalendarDate = new Date();

function generateCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthSpan = document.getElementById('calendar-month');
    
    if (!grid || !monthSpan) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    monthSpan.textContent = currentCalendarDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    grid.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day prev-month';
        dayElement.textContent = prevMonthDays - i;
        dayElement.addEventListener('click', () => {
            currentCalendarDate.setMonth(month - 1);
            generateCalendar();
        });
        grid.appendChild(dayElement);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day current-month';
        
        if (isCurrentMonth && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Add weekend styling
        const dayOfWeek = new Date(year, month, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayElement.classList.add('weekend');
        }
        
        dayElement.textContent = day;
        
        // Add click event for day selection
        dayElement.addEventListener('click', () => {
            // Remove previous selection
            grid.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
            dayElement.classList.add('selected');
            
            // Show selected date info
            const selectedDate = new Date(year, month, day);
            showDateInfo(selectedDate);
        });
        
        grid.appendChild(dayElement);
    }
    
    // Next month's leading days
    const totalCells = 42; // 6 rows × 7 days
    const currentCells = firstDay + daysInMonth;
    const remainingCells = totalCells - currentCells;
    
    for (let day = 1; day <= remainingCells && remainingCells < 7; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day next-month';
        dayElement.textContent = day;
        dayElement.addEventListener('click', () => {
            currentCalendarDate.setMonth(month + 1);
            generateCalendar();
        });
        grid.appendChild(dayElement);
    }
}

function showDateInfo(date) {
    const dateInfoDiv = document.getElementById('selected-date-info');
    if (!dateInfoDiv) {
        // Create date info display if it doesn't exist
        const clockWidget = document.querySelector('.clock-widget');
        const infoDiv = document.createElement('div');
        infoDiv.id = 'selected-date-info';
        infoDiv.className = 'selected-date-info';
        clockWidget.appendChild(infoDiv);
    }
    
    const dateInfo = document.getElementById('selected-date-info');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    dateInfo.innerHTML = `
        <div class="selected-date-display">
            <h4>Selected Date</h4>
            <p><strong>${dayName}</strong></p>
            <p>${formattedDate}</p>
            <small>Click on other dates to select them</small>
        </div>
    `;
}

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    generateCalendar();
}

function showPowerMenu() {
    const powerMenu = document.createElement('div');
    powerMenu.className = 'power-menu';
    powerMenu.innerHTML = `
        <div class="power-menu-content">
            <div class="power-option" onclick="shutdownSystem()">
                <i class="fas fa-power-off"></i>
                <span>Shut down</span>
            </div>
            <div class="power-option" onclick="restartSystem()">
                <i class="fas fa-redo"></i>
                <span>Restart</span>
            </div>
            <div class="power-option" onclick="sleepSystem()">
                <i class="fas fa-moon"></i>
                <span>Sleep</span>
            </div>
            <div class="power-option" onclick="lockSystem()">
                <i class="fas fa-lock"></i>
                <span>Lock</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(powerMenu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closePowerMenu(e) {
            if (!powerMenu.contains(e.target)) {
                powerMenu.remove();
                document.removeEventListener('click', closePowerMenu);
            }
        });
    }, 100);
}

function shutdownSystem() {
    document.body.style.background = 'black';
    document.body.innerHTML = '<div style="color: white; text-align: center; padding-top: 40vh; font-size: 24px;">Shutting down...</div>';
    setTimeout(() => {
        document.body.innerHTML = '<div style="color: white; text-align: center; padding-top: 40vh; font-size: 18px;">It\'s now safe to turn off your computer.</div>';
    }, 2000);
}

function restartSystem() {
    document.body.style.background = 'black';
    document.body.innerHTML = '<div style="color: white; text-align: center; padding-top: 40vh; font-size: 24px;">Restarting...</div>';
    setTimeout(() => {
        location.reload();
    }, 2000);
}

function sleepSystem() {
    document.body.style.background = 'black';
    document.body.innerHTML = '<div style="color: white; text-align: center; padding-top: 40vh; font-size: 18px; cursor: pointer;" onclick="location.reload()">Click to wake up</div>';
}

function lockSystem() {
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    document.body.innerHTML = `
        <div style="color: white; text-align: center; padding-top: 30vh; font-size: 24px;">
            <i class="fas fa-user-circle" style="font-size: 80px; margin-bottom: 20px;"></i>
            <div>User</div>
            <input type="password" placeholder="Password" style="margin: 20px; padding: 10px; border-radius: 4px; border: none;" onkeypress="if(event.key==='Enter') location.reload()">
            <div style="font-size: 14px; margin-top: 10px;">Press Enter to unlock</div>
        </div>
    `;
}

function openNetworkSettings() {
    alert('Network & Internet settings would open here');
}

function scanNetworks() {
    const networks = document.querySelectorAll('.network-item:not(.connected)');
    networks.forEach(network => {
        network.style.opacity = '0.5';
        setTimeout(() => {
            network.style.opacity = '1';
        }, 1000);
    });
}

function addNetwork() {
    showAddNetworkModal();
}

function showAddNetworkModal() {
    const modal = document.createElement('div');
    modal.className = 'add-network-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add Network</h3>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <label for="network-name-input">Network Name (SSID):</label>
                <input type="text" id="network-name-input" placeholder="Enter network name" maxlength="32">
                <div class="security-options">
                    <label>Security Type:</label>
                    <select id="security-type">
                        <option value="secured">WPA2/WPA3 Personal</option>
                        <option value="open">Open (No Security)</option>
                        <option value="enterprise">WPA2/WPA3 Enterprise</option>
                    </select>
                </div>
            </div>
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="add-btn">Add Network</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const networkInput = modal.querySelector('#network-name-input');
    const securitySelect = modal.querySelector('#security-type');
    
    // Focus on input
    networkInput.focus();
    
    // Event listeners
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.cancel-btn').onclick = () => modal.remove();
    
    modal.querySelector('.add-btn').onclick = () => {
        const networkName = networkInput.value.trim();
        const securityType = securitySelect.value;
        
        if (networkName) {
            createNewNetworkItem(networkName, securityType);
            modal.remove();
        } else {
            networkInput.style.borderColor = '#dc3545';
            networkInput.focus();
        }
    };
    
    // Enter key to add
    networkInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('.add-btn').click();
        }
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function createNewNetworkItem(networkName, securityType) {
    const networkList = document.querySelector('.network-list');
    const newNetwork = document.createElement('div');
    newNetwork.className = 'network-item';
    newNetwork.dataset.network = networkName;
    newNetwork.dataset.secured = securityType !== 'open';
    
    const securityText = securityType === 'open' ? 'Open' : 
                        securityType === 'enterprise' ? 'Enterprise' : 'Secured';
    
    newNetwork.innerHTML = `
        <div class="network-info">
            <i class="fas fa-wifi"></i>
            <div>
                <span>${networkName}</span>
                <small>${securityText}</small>
            </div>
        </div>
        <div class="signal-strength">
            <div class="signal-bars">
                <span class="bar active"></span>
                <span class="bar active"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </div>
        </div>
    `;
    
    // Add click event for connection
    newNetwork.addEventListener('click', function() {
        const isSecured = this.dataset.secured === 'true';
        const networkName = this.dataset.network;
        
        if (isSecured) {
            showPasswordModal(networkName);
        } else {
            connectToNetwork(networkName);
        }
    });
    
    networkList.appendChild(newNetwork);
}

// Window management functions
function openWindow(appName) {
    if (appName === 'explorer') {
        openFolderWindow('File Explorer');
        return;
    }
    
    // Map app names to window IDs
    let windowId;
    if (appName === 'recycle') {
        windowId = 'recycle-window';
    } else {
        windowId = appName + '-window';
    }
    
    const window = document.getElementById(windowId);
    const taskbarApp = document.querySelector(`[data-app="${appName}"]`);
    
    if (window) {
        // Reset any maximized state when opening
        if (window.classList.contains('maximized')) {
            window.classList.remove('maximized');
            const maxBtn = window.querySelector('.maximize i');
            if (maxBtn) {
                maxBtn.className = 'fas fa-square';
            }
        }
        
        window.style.display = 'block';
        bringToFront(window);
        
        if (taskbarApp) {
            taskbarApp.classList.add('active');
        }
        
        activeWindow = window;
    }
}

function closeWindow(window) {
    window.classList.remove('active');
    window.style.display = 'none';
    
    const appName = window.id.replace('-window', '');
    const taskbarApp = document.querySelector(`[data-app="${appName}"]`);
    
    if (taskbarApp) {
        taskbarApp.classList.remove('active');
    }
    
    if (activeWindow === window) {
        activeWindow = null;
    }
}

function minimizeWindow(window) {
    window.style.display = 'none';
    
    // Update taskbar state - handle special window ID mappings
    let appName = window.id.replace('-window', '');
    if (window.id === 'recycle-window') {
        appName = 'recycle';
    }
    
    const taskbarApp = document.querySelector(`[data-app="${appName}"]`);
    if (taskbarApp) {
        taskbarApp.classList.remove('active');
    }
    
    if (activeWindow === window) {
        activeWindow = null;
    }
}

function toggleMaximize(window) {
    if (window.classList.contains('maximized')) {
        // Restore window
        window.classList.remove('maximized');
        
        // Restore original dimensions
        const originalTop = window.dataset.originalTop || '50px';
        const originalLeft = window.dataset.originalLeft || '100px';
        const originalWidth = window.dataset.originalWidth || '800px';
        const originalHeight = window.dataset.originalHeight || '600px';
        
        window.style.top = originalTop;
        window.style.left = originalLeft;
        window.style.width = originalWidth;
        window.style.height = originalHeight;
        
        // Change maximize button icon
        const maxBtn = window.querySelector('.maximize i');
        if (maxBtn) {
            maxBtn.className = 'fas fa-square';
        }
    } else {
        // Store original dimensions before maximizing
        window.dataset.originalTop = window.style.top || window.offsetTop + 'px';
        window.dataset.originalLeft = window.style.left || window.offsetLeft + 'px';
        window.dataset.originalWidth = window.style.width || window.offsetWidth + 'px';
        window.dataset.originalHeight = window.style.height || window.offsetHeight + 'px';
        
        // Maximize window
        window.classList.add('maximized');
        
        // Change maximize button icon
        const maxBtn = window.querySelector('.maximize i');
        if (maxBtn) {
            maxBtn.className = 'fas fa-window-restore';
        }
    }
    
    bringToFront(window);
}

function toggleWindow(appName) {
    // Map app names to window IDs
    let windowId;
    if (appName === 'recycle') {
        windowId = 'recycle-window';
    } else {
        windowId = appName + '-window';
    }
    
    const window = document.getElementById(windowId);
    const taskbarApp = document.querySelector(`[data-app="${appName}"]`);
    
    if (window) {
        if (window.style.display === 'none' || !window.classList.contains('active')) {
            openWindow(appName);
        } else {
            minimizeWindow(window);
            taskbarApp?.classList.remove('active');
        }
    }
}

function updateTaskbarState() {
    document.querySelectorAll('.taskbar-app').forEach(app => {
        const appName = app.dataset.app;
        let windowId;
        if (appName === 'recycle') {
            windowId = 'recycle-window';
        } else {
            windowId = appName + '-window';
        }
        
        const window = document.getElementById(windowId);
        
        if (window && window.style.display !== 'none' && window.classList.contains('active')) {
            app.classList.add('active');
        } else {
            app.classList.remove('active');
        }
    });
}

function bringToFront(window) {
    const allWindows = document.querySelectorAll('.window');
    allWindows.forEach(w => {
        w.style.zIndex = '1000';
        w.classList.remove('active');
    });
    window.style.zIndex = '1001';
    window.classList.add('active');
}

// Window dragging functionality
function startDrag(e) {
    const window = e.target.closest('.window');
    if (!window) return;
    
    isDragging = true;
    activeWindow = window;
    bringToFront(window);
    
    const rect = window.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    window.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
}

function drag(e) {
    if (!isDragging || !activeWindow) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep window within bounds
    const maxX = window.innerWidth - activeWindow.offsetWidth;
    const maxY = window.innerHeight - activeWindow.offsetHeight - 48; // Account for taskbar
    
    activeWindow.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    activeWindow.style.top = Math.max(-10, Math.min(newY, maxY)) + 'px'; // Allow slight negative for title bar
}

function stopDrag() {
    if (isDragging && activeWindow) {
        activeWindow.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }
    
    isDragging = false;
}

// Brave Browser Functionality
function initializeBraveBrowser() {
    const addressBar = document.querySelector('.address-bar input');
    const homepageSearch = document.getElementById('homepage-search');
    const searchBtn = document.getElementById('search-btn');
    const quickLinks = document.querySelectorAll('.quick-link');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    // Address bar functionality
    if (addressBar) {
        addressBar.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                navigateToUrl(this.value);
            }
        });
        
        addressBar.addEventListener('focus', function() {
            this.select();
        });
        
        // Make address bar editable
        addressBar.addEventListener('click', function() {
            this.removeAttribute('readonly');
        });
        
        addressBar.addEventListener('blur', function() {
            // Don't make readonly immediately to allow typing
        });
    }
    
    // Homepage search functionality
    if (homepageSearch) {
        homepageSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchOrNavigate(this.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = homepageSearch.value;
            if (query) {
                searchOrNavigate(query);
            }
        });
    }
    
    // Quick links functionality
    quickLinks.forEach(link => {
        link.addEventListener('click', function() {
            const url = this.dataset.url;
            if (url === 'github') {
                searchOrNavigate('github');
            } else if (url === 'youtube') {
                navigateToUrl('https://youtube.com');
            } else {
                navigateToUrl(url);
            }
        });
    });
    
    // Navigation buttons
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-arrow-left')) {
                goBack();
            } else if (icon.classList.contains('fa-arrow-right')) {
                goForward();
            } else if (icon.classList.contains('fa-redo')) {
                refreshPage();
            }
        });
    });
}

function searchOrNavigate(query) {
    const lowerQuery = query.toLowerCase().trim();
    
    // Direct shortcuts to your profiles
    if (lowerQuery === 'github' || lowerQuery === 'git') {
        navigateToUrl('https://github.com/janaksanjel');
        return;
    }
    
    if (lowerQuery === 'youtube' || lowerQuery === 'yt') {
        navigateToUrl('https://youtube.com');
        return;
    }
    
    if (isUrl(query)) {
        navigateToUrl(query);
    } else {
        const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
        navigateToUrl(searchUrl);
    }
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
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    const addressBar = document.querySelector('.address-bar input');
    const iframe = document.getElementById('brave-iframe');
    const defaultPage = document.getElementById('default-page');
    const activeTab = document.querySelector('.tab.active');
    
    // Update address bar
    if (addressBar) {
        addressBar.value = url;
    }
    
    // Update tab title and icon
    if (activeTab) {
        const tabSpan = activeTab.querySelector('span');
        const tabIcon = activeTab.querySelector('i');
        
        // Add loading state
        activeTab.classList.add('loading');
        tabSpan.textContent = 'Loading...';
        
        // Simulate loading time
        setTimeout(() => {
            activeTab.classList.remove('loading');
            
            // Update tab based on URL
            if (url.includes('github')) {
                tabIcon.className = 'fab fa-github';
                tabSpan.textContent = 'GitHub - JANAK';
            } else if (url.includes('codepen')) {
                tabIcon.className = 'fab fa-codepen';
                tabSpan.textContent = 'CodePen';
            } else if (url.includes('youtube')) {
                tabIcon.className = 'fab fa-youtube';
                tabSpan.textContent = 'YouTube';
            } else if (url.includes('stackoverflow')) {
                tabIcon.className = 'fab fa-stack-overflow';
                tabSpan.textContent = 'Stack Overflow';
            } else {
                tabIcon.className = 'fas fa-globe';
                const domain = new URL(url).hostname.replace('www.', '');
                tabSpan.textContent = domain.charAt(0).toUpperCase() + domain.slice(1);
            }
        }, 1500);
    }
    
    // Show loading and simulate page load
    showLoadingPage();
    
    setTimeout(() => {
        // Hide default page and show simulated content
        if (defaultPage) defaultPage.style.display = 'none';
        showSimulatedWebsite(url);
    }, 1500);
}

function showLoadingPage() {
    const braveContent = document.querySelector('.brave-content');
    const existingLoading = braveContent.querySelector('.loading-indicator');
    
    if (existingLoading) {
        existingLoading.remove();
    }
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.style.display = 'flex';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
    `;
    
    braveContent.appendChild(loadingDiv);
}

function showSimulatedWebsite(url) {
    const braveContent = document.querySelector('.brave-content');
    const loadingIndicator = braveContent.querySelector('.loading-indicator');
    
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
    
    // Create simulated website content
    let websiteContent = '';
    
    if (url.includes('github')) {
        websiteContent = createGitHubPage();
    } else if (url.includes('codepen')) {
        websiteContent = createCodePenPage();
    } else if (url.includes('youtube')) {
        websiteContent = createYouTubePage();
    } else if (url.includes('stackoverflow')) {
        websiteContent = createStackOverflowPage();
    } else if (url.includes('search.brave.com')) {
        websiteContent = createSearchResultsPage();
    } else {
        websiteContent = createGenericWebsite(url);
    }
    
    const websiteDiv = document.createElement('div');
    websiteDiv.className = 'simulated-website';
    websiteDiv.innerHTML = websiteContent;
    websiteDiv.style.cssText = 'width: 100%; height: 100%; overflow-y: auto; padding: 20px; background: white;';
    
    braveContent.appendChild(websiteDiv);
}

function createGitHubPage() {
    return `
        <div style="max-width: 1200px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <header style="background: #24292e; color: white; padding: 16px 0; margin: -20px -20px 20px -20px;">
                <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 16px;">
                    <i class="fab fa-github" style="font-size: 32px;"></i>
                    <h1 style="margin: 0; font-size: 20px;">GitHub</h1>
                    <div style="flex: 1; max-width: 400px; margin-left: 20px;">
                        <input type="text" placeholder="Type / to search" style="width: 100%; padding: 8px 12px; border: 1px solid #444; border-radius: 6px; background: #2d333b; color: white;">
                    </div>
                </div>
            </header>
            <div style="display: grid; grid-template-columns: 300px 1fr; gap: 24px;">
                <aside style="padding: 20px 0;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <img src="./img/myphoto.jpg" alt="Janak Sanjel" style="width: 260px; height: 260px; border-radius: 50%; object-fit: cover; border: 3px solid #d0d7de;">
                        <h1 style="margin: 16px 0 4px 0; font-size: 24px; color: #24292f;">JANAK</h1>
                        <p style="margin: 0; color: #656d76; font-size: 20px; font-weight: 300;">janaksanjel</p>
                        <p style="margin: 16px 0; color: #656d76; font-size: 16px;">hi i am Janak!</p>
                        <div style="display: flex; gap: 8px; justify-content: center; margin: 16px 0;">
                            <span style="background: #f6f8fa; padding: 4px 8px; border-radius: 12px; font-size: 12px; color: #24292f;"><i class="fas fa-users"></i> 6 followers</span>
                            <span style="background: #f6f8fa; padding: 4px 8px; border-radius: 12px; font-size: 12px; color: #24292f;">5 following</span>
                        </div>
                        <p style="margin: 8px 0; color: #0969da; font-size: 14px;">www.janaksanjel.com.np</p>
                        <div style="margin: 16px 0;">
                            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #24292f;">Achievements</h4>
                            <div style="display: flex; gap: 8px; justify-content: center;">
                                <div style="width: 32px; height: 32px; background: #0969da; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;" title="Pull Shark">🦈</div>
                                <div style="width: 32px; height: 32px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;" title="Quickdraw">⚡</div>
                            </div>
                        </div>
                    </div>
                </aside>
                <main>
                    <div style="border-bottom: 1px solid #d0d7de; margin-bottom: 24px; padding-bottom: 16px;">
                        <nav style="display: flex; gap: 24px;">
                            <a href="#" style="color: #24292f; text-decoration: none; padding: 8px 0; border-bottom: 2px solid #fd8c73; font-weight: 600;">Overview</a>
                            <a href="#" style="color: #656d76; text-decoration: none; padding: 8px 0;">Repositories <span style="background: #f6f8fa; padding: 2px 6px; border-radius: 12px; font-size: 12px;">22</span></a>
                            <a href="#" style="color: #656d76; text-decoration: none; padding: 8px 0;">Projects</a>
                            <a href="#" style="color: #656d76; text-decoration: none; padding: 8px 0;">Packages</a>
                            <a href="#" style="color: #656d76; text-decoration: none; padding: 8px 0;">Stars <span style="background: #f6f8fa; padding: 2px 6px; border-radius: 12px; font-size: 12px;">15</span></a>
                        </nav>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #24292f;">Pinned</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div style="border: 1px solid #d0d7de; border-radius: 6px; padding: 16px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0969da;">OrderUp_Online</h3>
                                <p style="color: #656d76; font-size: 12px; margin: 0 0 12px 0;">Public</p>
                                <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: #656d76;">
                                    <span><i class="fas fa-circle" style="color: #f1e05a;"></i> JavaScript</span>
                                    <span><i class="fas fa-star"></i> 2</span>
                                </div>
                            </div>
                            <div style="border: 1px solid #d0d7de; border-radius: 6px; padding: 16px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0969da;">E-Signature</h3>
                                <p style="color: #656d76; font-size: 12px; margin: 0 0 12px 0;">Public</p>
                                <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: #656d76;">
                                    <span><i class="fas fa-circle" style="color: #e34c26;"></i> HTML</span>
                                    <span><i class="fas fa-star"></i> 1</span>
                                </div>
                            </div>
                            <div style="border: 1px solid #d0d7de; border-radius: 6px; padding: 16px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0969da;">ElectronicsVotingSystem</h3>
                                <p style="color: #656d76; font-size: 12px; margin: 0 0 12px 0;">Public</p>
                                <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: #656d76;">
                                    <span><i class="fas fa-circle" style="color: #4f5d95;"></i> PHP</span>
                                    <span><i class="fas fa-star"></i> 1</span>
                                </div>
                            </div>
                            <div style="border: 1px solid #d0d7de; border-radius: 6px; padding: 16px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0969da;">simple_react_project</h3>
                                <p style="color: #656d76; font-size: 12px; margin: 0 0 12px 0;">Public</p>
                                <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: #656d76;">
                                    <span><i class="fas fa-circle" style="color: #f1e05a;"></i> JavaScript</span>
                                    <span><i class="fas fa-star"></i> 1</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #24292f;">130 contributions in the last year</h3>
                        <div style="border: 1px solid #d0d7de; border-radius: 6px; padding: 16px; background: #f6f8fa;">
                            <div style="display: grid; grid-template-columns: repeat(53, 1fr); gap: 2px; margin-bottom: 8px;">
                                <div style="width: 10px; height: 10px; background: #ebedf0; border-radius: 2px;"></div>
                                <div style="width: 10px; height: 10px; background: #9be9a8; border-radius: 2px;"></div>
                                <div style="width: 10px; height: 10px; background: #40c463; border-radius: 2px;"></div>
                                <div style="width: 10px; height: 10px; background: #30a14e; border-radius: 2px;"></div>
                                <div style="width: 10px; height: 10px; background: #216e39; border-radius: 2px;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #656d76;">
                                <span>Less</span>
                                <div style="display: flex; gap: 2px; align-items: center;">
                                    <div style="width: 10px; height: 10px; background: #ebedf0; border-radius: 2px;"></div>
                                    <div style="width: 10px; height: 10px; background: #9be9a8; border-radius: 2px;"></div>
                                    <div style="width: 10px; height: 10px; background: #40c463; border-radius: 2px;"></div>
                                    <div style="width: 10px; height: 10px; background: #30a14e; border-radius: 2px;"></div>
                                    <div style="width: 10px; height: 10px; background: #216e39; border-radius: 2px;"></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #24292f;">Contribution activity</h3>
                        <div style="border: 1px solid #d0d7de; border-radius: 6px; padding: 16px;">
                            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #24292f;">September 2025</h4>
                            <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
                                <div style="width: 16px; height: 16px; background: #39d353; border-radius: 2px;"></div>
                                <div>
                                    <p style="margin: 0; font-size: 14px; color: #24292f;">janaksanjel/kcrm-back <strong>1 commit</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `;
}

function createCodePenPage() {
    return `
        <div style="font-family: 'Lato', sans-serif; background: #1e1e1e; color: white; min-height: 100%; margin: -20px; padding: 20px;">
            <header style="background: #000; padding: 16px 0; margin: -20px -20px 20px -20px;">
                <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 16px;">
                    <i class="fab fa-codepen" style="font-size: 32px; color: white;"></i>
                    <h1 style="margin: 0; font-size: 20px; color: white;">CodePen</h1>
                    <nav style="margin-left: auto;">
                        <a href="#" style="color: #47cf73; text-decoration: none; margin: 0 16px;">Explore</a>
                        <a href="#" style="color: white; text-decoration: none; margin: 0 16px;">Create</a>
                    </nav>
                </div>
            </header>
            <div style="max-width: 1200px; margin: 0 auto;">
                <section style="text-align: center; margin-bottom: 40px;">
                    <h2 style="font-size: 36px; margin-bottom: 16px; color: white;">Build, Test, and Discover</h2>
                    <p style="font-size: 18px; color: #999; margin-bottom: 24px;">The best place to build, test, and discover front-end code.</p>
                    <button style="background: #47cf73; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; cursor: pointer;">Start Coding</button>
                </section>
                <section>
                    <h3 style="color: white; margin-bottom: 20px;">Trending Pens</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        <div style="background: #2c2c2c; border-radius: 8px; overflow: hidden;">
                            <div style="height: 200px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 18px;">CSS Animation Demo</span>
                            </div>
                            <div style="padding: 16px;">
                                <h4 style="margin: 0 0 8px 0; color: white;">Animated Button Collection</h4>
                                <p style="color: #999; font-size: 14px; margin: 0;">by @janaksanjel</p>
                            </div>
                        </div>
                        <div style="background: #2c2c2c; border-radius: 8px; overflow: hidden;">
                            <div style="height: 200px; background: linear-gradient(45deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 18px;">React Component</span>
                            </div>
                            <div style="padding: 16px;">
                                <h4 style="margin: 0 0 8px 0; color: white;">Interactive Dashboard</h4>
                                <p style="color: #999; font-size: 14px; margin: 0;">by @janaksanjel</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

function createYouTubePage() {
    return `
        <div style="font-family: Roboto, sans-serif; background: #0f0f0f; color: white; min-height: 100%; margin: -20px; padding: 0;">
            <header style="background: #212121; padding: 0 16px; height: 56px; display: flex; align-items: center; gap: 16px;">
                <i class="fab fa-youtube" style="font-size: 24px; color: #ff0000;"></i>
                <h1 style="margin: 0; font-size: 20px; color: white;">YouTube</h1>
                <div style="flex: 1; max-width: 600px; margin: 0 40px;">
                    <div style="display: flex; align-items: center; background: #121212; border: 1px solid #303030; border-radius: 2px;">
                        <input type="text" placeholder="Search" style="flex: 1; background: none; border: none; color: white; padding: 8px 12px; outline: none;">
                        <button style="background: #303030; border: none; color: white; padding: 8px 16px; cursor: pointer;">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </header>
            <div style="display: flex;">
                <nav style="width: 240px; background: #212121; min-height: calc(100vh - 56px); padding: 12px 0;">
                    <div style="padding: 8px 24px; color: white; font-size: 14px; margin-bottom: 8px;">📺 Home</div>
                    <div style="padding: 8px 24px; color: #aaa; font-size: 14px; margin-bottom: 8px;">🔥 Trending</div>
                    <div style="padding: 8px 24px; color: #aaa; font-size: 14px; margin-bottom: 8px;">📚 Subscriptions</div>
                    <div style="padding: 8px 24px; color: #aaa; font-size: 14px; margin-bottom: 8px;">📖 Library</div>
                </nav>
                <main style="flex: 1; padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                        <div style="cursor: pointer;">
                            <div style="width: 100%; height: 180px; background: linear-gradient(45deg, #ff4757, #ff6b7a); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                                <i class="fas fa-play" style="font-size: 32px; color: white;"></i>
                            </div>
                            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: white; line-height: 1.3;">Learn JavaScript in 2024 - Complete Tutorial</h3>
                            <p style="color: #aaa; font-size: 14px; margin: 0;">Code Academy • 1.2M views • 2 days ago</p>
                        </div>
                        <div style="cursor: pointer;">
                            <div style="width: 100%; height: 180px; background: linear-gradient(45deg, #5352ed, #3742fa); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                                <i class="fas fa-play" style="font-size: 32px; color: white;"></i>
                            </div>
                            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: white; line-height: 1.3;">React Hooks Explained - useState & useEffect</h3>
                            <p style="color: #aaa; font-size: 14px; margin: 0;">Dev Tips • 856K views • 1 week ago</p>
                        </div>
                        <div style="cursor: pointer;">
                            <div style="width: 100%; height: 180px; background: linear-gradient(45deg, #00d2d3, #54a0ff); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                                <i class="fas fa-play" style="font-size: 32px; color: white;"></i>
                            </div>
                            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: white; line-height: 1.3;">CSS Grid vs Flexbox - When to Use What?</h3>
                            <p style="color: #aaa; font-size: 14px; margin: 0;">Web Dev Simplified • 2.1M views • 3 days ago</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `;
}

function createStackOverflowPage() {
    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; min-height: 100%; margin: -20px; padding: 0;">
            <header style="background: #f8f9f9; border-top: 3px solid #f48024; padding: 8px 0; border-bottom: 1px solid #e3e6e8;">
                <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 16px;">
                    <i class="fab fa-stack-overflow" style="font-size: 24px; color: #f48024;"></i>
                    <h1 style="margin: 0; font-size: 18px; color: #232629;">Stack Overflow</h1>
                    <div style="flex: 1; max-width: 400px; margin-left: 20px;">
                        <input type="text" placeholder="Search..." style="width: 100%; padding: 8px 12px; border: 1px solid #babfc4; border-radius: 3px;">
                    </div>
                </div>
            </header>
            <div style="max-width: 1200px; margin: 0 auto; padding: 20px; display: grid; grid-template-columns: 1fr 300px; gap: 24px;">
                <main>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 24px; color: #232629;">Top Questions</h2>
                        <button style="background: #0a95ff; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">Ask Question</button>
                    </div>
                    <div style="border: 1px solid #e3e6e8; border-radius: 3px;">
                        <div style="padding: 16px; border-bottom: 1px solid #e3e6e8;">
                            <h3 style="margin: 0 0 8px 0; font-size: 16px;">
                                <a href="#" style="color: #0a95ff; text-decoration: none;">How to center a div in CSS?</a>
                            </h3>
                            <p style="color: #6a737c; font-size: 14px; margin: 0 0 8px 0;">I'm trying to center a div element both horizontally and vertically. I've tried several methods but none seem to work properly...</p>
                            <div style="display: flex; gap: 16px; font-size: 12px; color: #6a737c;">
                                <span>javascript css html</span>
                                <span style="margin-left: auto;">asked 2 hours ago by <strong>newbie_dev</strong></span>
                            </div>
                        </div>
                        <div style="padding: 16px; border-bottom: 1px solid #e3e6e8;">
                            <h3 style="margin: 0 0 8px 0; font-size: 16px;">
                                <a href="#" style="color: #0a95ff; text-decoration: none;">React useState not updating immediately</a>
                            </h3>
                            <p style="color: #6a737c; font-size: 14px; margin: 0 0 8px 0;">I'm having trouble with useState in React. When I call the setter function, the state doesn't update immediately...</p>
                            <div style="display: flex; gap: 16px; font-size: 12px; color: #6a737c;">
                                <span>reactjs javascript hooks</span>
                                <span style="margin-left: auto;">asked 4 hours ago by <strong>react_learner</strong></span>
                            </div>
                        </div>
                        <div style="padding: 16px;">
                            <h3 style="margin: 0 0 8px 0; font-size: 16px;">
                                <a href="#" style="color: #0a95ff; text-decoration: none;">Java ArrayList vs LinkedList performance</a>
                            </h3>
                            <p style="color: #6a737c; font-size: 14px; margin: 0 0 8px 0;">What are the performance differences between ArrayList and LinkedList in Java? When should I use each one?</p>
                            <div style="display: flex; gap: 16px; font-size: 12px; color: #6a737c;">
                                <span>java arraylist linkedlist</span>
                                <span style="margin-left: auto;">asked 6 hours ago by <strong>java_student</strong></span>
                            </div>
                        </div>
                    </div>
                </main>
                <aside>
                    <div style="background: #fdf7e2; border: 1px solid #f1e05a; border-radius: 3px; padding: 16px; margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #735c0f;">The Overflow Blog</h4>
                        <ul style="margin: 0; padding-left: 16px; color: #735c0f; font-size: 13px;">
                            <li style="margin-bottom: 4px;">Best practices for API design</li>
                            <li>Modern JavaScript features you should know</li>
                        </ul>
                    </div>
                    <div style="background: #e1ecf4; border: 1px solid #a6ceed; border-radius: 3px; padding: 16px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0c5aa6;">Featured on Meta</h4>
                        <ul style="margin: 0; padding-left: 16px; color: #0c5aa6; font-size: 13px;">
                            <li style="margin-bottom: 4px;">New user onboarding improvements</li>
                            <li>Community guidelines update</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    `;
}

function createSearchResultsPage() {
    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; min-height: 100%; margin: -20px; padding: 20px;">
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e8e8e8;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <img src="./img/brave.png" alt="Brave" style="width: 24px; height: 24px;">
                        <h1 style="margin: 0; font-size: 20px; color: #333;">Brave Search</h1>
                    </div>
                    <div style="display: flex; align-items: center; background: #f8f9fa; border: 1px solid #dadce0; border-radius: 24px; padding: 8px 16px; max-width: 500px;">
                        <i class="fas fa-search" style="color: #9aa0a6; margin-right: 12px;"></i>
                        <input type="text" value="javascript tutorials" style="flex: 1; border: none; background: none; outline: none; font-size: 16px;">
                    </div>
                </div>
                <div style="margin-bottom: 8px; color: #70757a; font-size: 14px;">About 2,340,000 results (0.45 seconds)</div>
                <div>
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 4px 0; font-size: 18px;">
                            <a href="#" style="color: #1a0dab; text-decoration: none;">JavaScript Tutorial - W3Schools</a>
                        </h3>
                        <div style="color: #006621; font-size: 14px; margin-bottom: 4px;">https://www.w3schools.com › js</div>
                        <p style="color: #4d5156; font-size: 14px; line-height: 1.4; margin: 0;">Learn JavaScript with the world's most popular JavaScript tutorial. Our JavaScript Tutorial is designed for beginners and professionals.</p>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 4px 0; font-size: 18px;">
                            <a href="#" style="color: #1a0dab; text-decoration: none;">JavaScript.info - The Modern JavaScript Tutorial</a>
                        </h3>
                        <div style="color: #006621; font-size: 14px; margin-bottom: 4px;">https://javascript.info</div>
                        <p style="color: #4d5156; font-size: 14px; line-height: 1.4; margin: 0;">Modern JavaScript Tutorial: simple, but detailed explanations with examples and tasks, including: closures, document and events, object oriented programming and more.</p>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 4px 0; font-size: 18px;">
                            <a href="#" style="color: #1a0dab; text-decoration: none;">Learn JavaScript - Free Interactive JavaScript Tutorial</a>
                        </h3>
                        <div style="color: #006621; font-size: 14px; margin-bottom: 4px;">https://www.learn-js.org</div>
                        <p style="color: #4d5156; font-size: 14px; line-height: 1.4; margin: 0;">Learn JavaScript online with our free interactive tutorial. Start learning JavaScript now with exercises, examples and explanations.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createGenericWebsite(url) {
    const domain = new URL(url).hostname.replace('www.', '');
    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
            <header style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-size: 36px; color: #333; margin-bottom: 16px;">${domain.charAt(0).toUpperCase() + domain.slice(1)}</h1>
                <p style="font-size: 18px; color: #666; max-width: 600px; margin: 0 auto;">Welcome to ${domain}. This is a simulated website for demonstration purposes.</p>
            </header>
            <main>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px;">
                    <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; border: 1px solid #e9ecef;">
                        <h3 style="margin: 0 0 12px 0; color: #333;">About Us</h3>
                        <p style="color: #666; line-height: 1.6; margin: 0;">Learn more about our company, mission, and the team behind ${domain}.</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; border: 1px solid #e9ecef;">
                        <h3 style="margin: 0 0 12px 0; color: #333;">Services</h3>
                        <p style="color: #666; line-height: 1.6; margin: 0;">Discover the range of services and solutions we offer to our customers.</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; border: 1px solid #e9ecef;">
                        <h3 style="margin: 0 0 12px 0; color: #333;">Contact</h3>
                        <p style="color: #666; line-height: 1.6; margin: 0;">Get in touch with us for more information or support.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                    <h2 style="margin: 0 0 16px 0; font-size: 28px;">This is a simulated website</h2>
                    <p style="margin: 0; font-size: 16px; opacity: 0.9;">Created for demonstration purposes in the Windows PC Simulator</p>
                </div>
            </main>
        </div>
    `;
}

function goBack() {
    // Simulate going back to homepage
    const defaultPage = document.getElementById('default-page');
    const simulatedWebsite = document.querySelector('.simulated-website');
    const addressBar = document.querySelector('.address-bar input');
    const activeTab = document.querySelector('.tab.active');
    
    if (simulatedWebsite) {
        simulatedWebsite.remove();
    }
    
    if (defaultPage) {
        defaultPage.style.display = 'flex';
    }
    
    if (addressBar) {
        addressBar.value = '';
    }
    
    if (activeTab) {
        const tabIcon = activeTab.querySelector('i');
        const tabSpan = activeTab.querySelector('span');
        tabIcon.className = 'fas fa-home';
        tabSpan.textContent = 'New Tab';
    }
}

function goForward() {
    // Simulate forward navigation (placeholder)
    showNotification('No forward history available', 'fas fa-info-circle');
}

function refreshPage() {
    const simulatedWebsite = document.querySelector('.simulated-website');
    if (simulatedWebsite) {
        // Simulate page refresh
        simulatedWebsite.style.opacity = '0.5';
        setTimeout(() => {
            simulatedWebsite.style.opacity = '1';
        }, 500);
    }
}

function switchTab(tab) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // For demo purposes, show different content based on tab
    const tabText = tab.querySelector('span').textContent;
    if (tabText === 'GitHub') {
        navigateToUrl('https://github.com');
    } else if (tabText === 'CodePen') {
        navigateToUrl('https://codepen.io');
    } else {
        goBack(); // Show homepage for new tabs
    }
}

// Tab functionality
function closeTab(tab) {
    const tabsContainer = tab.parentElement;
    const tabs = tabsContainer.querySelectorAll('.tab');
    
    if (tabs.length > 1) {
        const wasActive = tab.classList.contains('active');
        tab.remove();
        
        // If closed tab was active, activate another tab
        if (wasActive) {
            const remainingTabs = tabsContainer.querySelectorAll('.tab');
            if (remainingTabs.length > 0) {
                switchTab(remainingTabs[0]);
            }
        }
    }
}

function createNewTab() {
    const tabsContainer = document.querySelector('.brave-tabs');
    const newTabBtn = tabsContainer.querySelector('.new-tab');
    
    // Remove active class from all tabs
    tabsContainer.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Create new tab
    const newTab = document.createElement('div');
    newTab.className = 'tab active';
    newTab.innerHTML = `
        <i class="fas fa-home"></i>
        <span>New Tab</span>
        <button class="tab-close">×</button>
    `;
    
    // Add event listeners
    newTab.querySelector('.tab-close').addEventListener('click', function(e) {
        e.stopPropagation();
        closeTab(newTab);
    });
    
    newTab.addEventListener('click', function() {
        if (!this.classList.contains('active')) {
            switchTab(this);
        }
    });
    
    // Insert before the new tab button
    tabsContainer.insertBefore(newTab, newTabBtn);
    
    // Show homepage for new tab
    goBack();
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+T for new tab
    if (e.ctrlKey && e.key === 't' && activeWindow?.id === 'brave-window') {
        e.preventDefault();
        createNewTab();
    }
    
    // Ctrl+W for close tab
    if (e.ctrlKey && e.key === 'w' && activeWindow?.id === 'brave-window') {
        e.preventDefault();
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            closeTab(activeTab);
        }
    }
    
    // Ctrl+L for address bar focus
    if (e.ctrlKey && e.key === 'l' && activeWindow?.id === 'brave-window') {
        e.preventDefault();
        const addressBar = document.querySelector('.address-bar input');
        if (addressBar) {
            addressBar.focus();
            addressBar.select();
        }
    }
    
    // Ctrl+R for refresh
    if (e.ctrlKey && e.key === 'r' && activeWindow?.id === 'brave-window') {
        e.preventDefault();
        refreshPage();
    }
    
    // Alt+Left for back
    if (e.altKey && e.key === 'ArrowLeft' && activeWindow?.id === 'brave-window') {
        e.preventDefault();
        goBack();
    }
    
    // Alt+F4 for close window
    if (e.altKey && e.key === 'F4' && activeWindow) {
        e.preventDefault();
        closeWindow(activeWindow);
    }
    
    // F11 for fullscreen toggle
    if (e.key === 'F11' && activeWindow) {
        e.preventDefault();
        toggleMaximize(activeWindow);
    }
});

// Click outside to focus window
document.addEventListener('click', function(e) {
    const clickedWindow = e.target.closest('.window');
    if (clickedWindow && clickedWindow !== activeWindow) {
        bringToFront(clickedWindow);
        activeWindow = clickedWindow;
    }
});

// Start Menu functions
function toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.toggle('active');
}

function closeStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.remove('active');
}

// System Tray Popup functions
function toggleTrayPopup(popupId) {
    closeTrayPopups();
    const popup = document.getElementById(popupId);
    popup.classList.add('active');
}

function closeTrayPopups() {
    document.querySelectorAll('.tray-popup').forEach(popup => {
        popup.classList.remove('active');
    });
}

// WiFi Network Management
document.addEventListener('DOMContentLoaded', function() {
    // Network item clicks
    document.querySelectorAll('.network-item:not(.connected)').forEach(item => {
        item.addEventListener('click', function() {
            const networkName = this.dataset.network;
            const isSecured = this.dataset.secured === 'true';
            
            if (isSecured) {
                showPasswordModal(networkName);
            } else {
                connectToNetwork(networkName);
            }
        });
    });
    
    // Disconnect button
    document.querySelector('.disconnect-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        disconnectNetwork();
    });
    
    // Password modal
    document.querySelector('.cancel-btn').addEventListener('click', closePasswordModal);
    document.querySelector('.connect-btn').addEventListener('click', connectWithPassword);
});

function showPasswordModal(networkName) {
    document.getElementById('network-name').textContent = networkName;
    document.getElementById('password-modal').classList.add('active');
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.remove('active');
    document.getElementById('network-password').value = '';
}

function connectWithPassword() {
    const networkName = document.getElementById('network-name').textContent;
    const password = document.getElementById('network-password').value;
    
    if (password.length > 0) {
        connectToNetwork(networkName);
        closePasswordModal();
    }
}

function connectToNetwork(networkName) {
    // Update UI to show connection
    document.querySelectorAll('.network-item').forEach(item => {
        item.classList.remove('connected');
        const actions = item.querySelector('.network-actions');
        if (actions) actions.remove();
    });
    
    const targetNetwork = document.querySelector(`[data-network="${networkName}"]`);
    if (targetNetwork) {
        targetNetwork.classList.add('connected');
        targetNetwork.querySelector('.network-info div small').textContent = 'Connected, secured';
        
        const actions = document.createElement('div');
        actions.className = 'network-actions';
        actions.innerHTML = '<button class="disconnect-btn">Disconnect</button>';
        targetNetwork.appendChild(actions);
        
        // Re-add disconnect event
        actions.querySelector('.disconnect-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            disconnectNetwork();
        });
    }
    
    closeTrayPopups();
}

function disconnectNetwork() {
    const connectedNetwork = document.querySelector('.network-item.connected');
    if (connectedNetwork) {
        connectedNetwork.classList.remove('connected');
        connectedNetwork.querySelector('.network-info div small').textContent = 'Secured';
        const actions = connectedNetwork.querySelector('.network-actions');
        if (actions) actions.remove();
    }
}

// Desktop Icon Management
function selectDesktopIcon(icon) {
    deselectAllIcons();
    icon.classList.add('selected');
    selectedIcon = icon;
}

function deselectAllIcons() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.classList.remove('selected');
    });
    selectedIcon = null;
}

function showContextMenu(x, y, icon, isDesktop = false) {
    hideContextMenu();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    if (isDesktop) {
        menu.innerHTML = `
            <div class="context-item" onclick="createNewFolder()">New Folder</div>
            <div class="context-item" onclick="createNewFile()">New File</div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="refreshDesktop()">Refresh</div>
        `;
    } else if (icon) {
        const isFolder = icon.classList.contains('folder-icon');
        menu.innerHTML = `
            <div class="context-item" onclick="openIconApp('${icon.dataset.app}')">Open</div>
            ${isFolder ? '<div class="context-item" onclick="openFolder(selectedIcon)">Open Folder</div>' : ''}
            <div class="context-separator"></div>
            <div class="context-item" onclick="startRename(selectedIcon)">Rename</div>
            <div class="context-item" onclick="deleteItem(selectedIcon)">Delete</div>
            <div class="context-separator"></div>
            <div class="context-item" onclick="showProperties(selectedIcon)">Properties</div>
        `;
    }
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
}

function hideContextMenu() {
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();
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
    }
    
    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            finishRename();
        } else if (e.key === 'Escape') {
            span.style.display = 'block';
            input.remove();
            hideContextMenu();
        }
    });
}

function showProperties(icon) {
    if (!icon) return;
    
    const name = icon.querySelector('span').textContent;
    const type = icon.dataset.app === 'recycle' ? 'Recycle Bin' : 
                icon.classList.contains('folder-icon') ? 'Folder' : 'Application';
    const size = icon.classList.contains('file-icon') ? (icon.dataset.content?.length || 0) + ' bytes' : '--';
    const created = new Date().toLocaleDateString();
    
    showPropertiesDialog(name, type, size, created);
    hideContextMenu();
}

function showPropertiesDialog(name, type, size, created) {
    const dialog = document.createElement('div');
    dialog.className = 'properties-dialog';
    dialog.innerHTML = `
        <div class="properties-content">
            <div class="properties-header">
                <i class="fas fa-info-circle"></i>
                <span>${name} Properties</span>
                <button class="properties-close">×</button>
            </div>
            <div class="properties-body">
                <div class="properties-icon">
                    <i class="fas fa-${type === 'Folder' ? 'folder' : type === 'Recycle Bin' ? 'trash' : 'file'}"></i>
                </div>
                <div class="properties-info">
                    <div class="property-row">
                        <label>Name:</label>
                        <span>${name}</span>
                    </div>
                    <div class="property-row">
                        <label>Type:</label>
                        <span>${type}</span>
                    </div>
                    <div class="property-row">
                        <label>Location:</label>
                        <span>Desktop</span>
                    </div>
                    <div class="property-row">
                        <label>Size:</label>
                        <span>${size}</span>
                    </div>
                    <div class="property-row">
                        <label>Created:</label>
                        <span>${created}</span>
                    </div>
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

// New folder and file creation functions
function createNewFolder() {
    const desktopIcons = document.querySelector('.desktop-icons');
    const folderCount = document.querySelectorAll('.desktop-icon.folder-icon').length;
    
    const newFolder = document.createElement('div');
    newFolder.className = 'desktop-icon folder-icon';
    newFolder.innerHTML = `
        <i class="fas fa-folder" style="font-size: 48px; color: #FFD700; margin-bottom: 10px;"></i>
        <span>New Folder ${folderCount + 1}</span>
    `;
    
    // Add event listeners
    addIconEventListeners(newFolder);
    desktopIcons.appendChild(newFolder);
    hideContextMenu();
    fileSystem.save();
    
    // Auto-select and start rename
    setTimeout(() => {
        selectDesktopIcon(newFolder);
        startRename(newFolder);
    }, 100);
}

function createNewFile() {
    const desktopIcons = document.querySelector('.desktop-icons');
    const fileCount = document.querySelectorAll('.desktop-icon.file-icon').length;
    
    const newFile = document.createElement('div');
    newFile.className = 'desktop-icon file-icon';
    newFile.dataset.content = '';
    newFile.innerHTML = `
        <i class="fas fa-file" style="font-size: 48px; color: #4A90E2; margin-bottom: 10px;"></i>
        <span>New File ${fileCount + 1}.txt</span>
    `;
    
    // Add event listeners
    addIconEventListeners(newFile);
    desktopIcons.appendChild(newFile);
    hideContextMenu();
    fileSystem.save();
    
    // Auto-select and start rename
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
                <span>Delete File</span>
            </div>
            <div class="dialog-body">
                <p>Are you sure you want to move '${itemName}' to the Recycle Bin?</p>
            </div>
            <div class="dialog-buttons">
                <button class="btn-yes">Yes</button>
                <button class="btn-no">No</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('.btn-yes').onclick = () => {
        onConfirm();
        dialog.remove();
    };
    
    dialog.querySelector('.btn-no').onclick = () => {
        dialog.remove();
    };
}

function refreshDesktop() {
    // Simple refresh animation
    const desktop = document.querySelector('.desktop');
    desktop.style.opacity = '0.8';
    setTimeout(() => {
        desktop.style.opacity = '1';
    }, 200);
    hideContextMenu();
}

function openFolder(folderIcon) {
    if (!folderIcon) return;
    
    const folderName = folderIcon.querySelector('span').textContent;
    openFolderWindow(folderName);
    hideContextMenu();
}

function addIconEventListeners(icon) {
    // Single/double click
    let clickTimeout = null;
    icon.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            // Double click - open
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
        }, 300);
    });
    
    // Right click
    icon.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        selectDesktopIcon(this);
        showContextMenu(e.clientX, e.clientY, this);
    });
}

function openTextFile(fileIcon) {
    const fileName = fileIcon.querySelector('span').textContent;
    const content = fileIcon.dataset.content || '';
    openNotepadWindow(fileName, content, fileIcon);
}

function openNotepadWindow(fileName, content, fileIcon) {
    const windowId = 'notepad-' + fileName.replace(/[^a-zA-Z0-9]/g, '-');
    let notepadWindow = document.getElementById(windowId);
    
    if (!notepadWindow) {
        notepadWindow = document.createElement('div');
        notepadWindow.className = 'window notepad-window';
        notepadWindow.id = windowId;
        notepadWindow.style.top = '80px';
        notepadWindow.style.left = '200px';
        notepadWindow.style.width = '600px';
        notepadWindow.style.height = '400px';
        
        notepadWindow.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-file-alt"></i>
                    <span>${fileName} - Notepad</span>
                </div>
                <div class="window-controls">
                    <button class="minimize"><i class="fas fa-minus"></i></button>
                    <button class="maximize"><i class="fas fa-square"></i></button>
                    <button class="close"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="notepad-content">
                <textarea class="notepad-textarea" placeholder="Type your text here...">${content}</textarea>
            </div>
        `;
        
        document.querySelector('.desktop').appendChild(notepadWindow);
        
        // Add window controls
        notepadWindow.querySelector('.close').addEventListener('click', function() {
            // Save content before closing
            const textarea = notepadWindow.querySelector('.notepad-textarea');
            if (fileIcon) {
                fileIcon.dataset.content = textarea.value;
                fileSystem.save();
            }
            closeWindow(notepadWindow);
        });
        
        notepadWindow.querySelector('.minimize').addEventListener('click', function() {
            minimizeWindow(notepadWindow);
        });
        
        notepadWindow.querySelector('.maximize').addEventListener('click', function() {
            toggleMaximize(notepadWindow);
        });
        
        // Add dragging
        notepadWindow.querySelector('.window-header').addEventListener('mousedown', startDrag);
        
        // Auto-save on text change
        const textarea = notepadWindow.querySelector('.notepad-textarea');
        textarea.addEventListener('input', function() {
            if (fileIcon) {
                fileIcon.dataset.content = this.value;
                fileSystem.save();
            }
        });
    }
    
    notepadWindow.classList.add('active');
    notepadWindow.style.display = 'block';
    bringToFront(notepadWindow);
    activeWindow = notepadWindow;
}

function openFolderWindow(folderName) {
    // Create a new folder window
    const windowId = 'folder-' + folderName.replace(/\s+/g, '-').toLowerCase();
    let folderWindow = document.getElementById(windowId);
    
    if (!folderWindow) {
        folderWindow = document.createElement('div');
        folderWindow.className = 'window explorer-window';
        folderWindow.id = windowId;
        folderWindow.style.top = '100px';
        folderWindow.style.left = '250px';
        
        folderWindow.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-folder"></i>
                    <span>${folderName}</span>
                </div>
                <div class="window-controls">
                    <button class="minimize"><i class="fas fa-minus"></i></button>
                    <button class="maximize"><i class="fas fa-square"></i></button>
                    <button class="close"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="explorer-content">
                <div class="explorer-toolbar">
                    <button class="toolbar-btn" onclick="createFolderItem('${windowId}')">New Folder</button>
                    <button class="toolbar-btn" onclick="createFileItem('${windowId}')">New File</button>
                </div>
                <div class="main-content folder-content" id="${windowId}-content">
                    <div class="empty-folder">
                        <i class="fas fa-folder-open" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                        <p>This folder is empty</p>
                        <small>Right-click to add new items</small>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelector('.desktop').appendChild(folderWindow);
        
        // Add window controls
        folderWindow.querySelector('.close').addEventListener('click', function() {
            closeWindow(folderWindow);
        });
        
        folderWindow.querySelector('.minimize').addEventListener('click', function() {
            minimizeWindow(folderWindow);
        });
        
        folderWindow.querySelector('.maximize').addEventListener('click', function() {
            toggleMaximize(folderWindow);
        });
        
        // Add dragging
        folderWindow.querySelector('.window-header').addEventListener('mousedown', startDrag);
        
        // Add right-click context menu for folder content
        const folderContent = folderWindow.querySelector('.folder-content');
        folderContent.addEventListener('contextmenu', function(e) {
            if (e.target === this || e.target.closest('.empty-folder')) {
                e.preventDefault();
                showFolderContextMenu(e.clientX, e.clientY, windowId);
            }
        });
    }
    
    folderWindow.classList.add('active');
    folderWindow.style.display = 'block';
    bringToFront(folderWindow);
    activeWindow = folderWindow;
}

function showFolderContextMenu(x, y, windowId) {
    hideContextMenu();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-item" onclick="createFolderItem('${windowId}')">New Folder</div>
        <div class="context-item" onclick="createFileItem('${windowId}')">New File</div>
        <div class="context-separator"></div>
        <div class="context-item" onclick="refreshFolder('${windowId}')">Refresh</div>
    `;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
}

function createFolderItem(windowId) {
    const folderContent = document.getElementById(windowId + '-content');
    const emptyFolder = folderContent.querySelector('.empty-folder');
    
    if (emptyFolder) {
        emptyFolder.remove();
    }
    
    const newFolder = document.createElement('div');
    newFolder.className = 'file-item folder';
    newFolder.innerHTML = `
        <i class="fas fa-folder" style="color: #FFD700;"></i>
        <span>New Folder</span>
    `;
    
    folderContent.appendChild(newFolder);
    hideContextMenu();
    
    // Add double-click to open
    newFolder.addEventListener('dblclick', function() {
        const folderName = this.querySelector('span').textContent;
        openFolderWindow(folderName);
    });
}

function createFileItem(windowId) {
    const folderContent = document.getElementById(windowId + '-content');
    const emptyFolder = folderContent.querySelector('.empty-folder');
    
    if (emptyFolder) {
        emptyFolder.remove();
    }
    
    const newFile = document.createElement('div');
    newFile.className = 'file-item file';
    newFile.dataset.content = '';
    newFile.innerHTML = `
        <i class="fas fa-file" style="color: #4A90E2;"></i>
        <span>New File.txt</span>
    `;
    
    folderContent.appendChild(newFile);
    hideContextMenu();
    
    // Add double-click to open in notepad
    newFile.addEventListener('dblclick', function() {
        const fileName = this.querySelector('span').textContent;
        const content = this.dataset.content || '';
        openNotepadWindow(fileName, content, this);
    });
    
    // Add single click selection
    newFile.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.file-item.selected').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
    });
}

function refreshFolder(windowId) {
    const folderContent = document.getElementById(windowId + '-content');
    folderContent.style.opacity = '0.5';
    setTimeout(() => {
        folderContent.style.opacity = '1';
    }, 300);
    hideContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-item" onclick="createFolderItem('${windowId}')">New Folder</div>
        <div class="context-item" onclick="createFileItem('${windowId}')">New File</div>
        <div class="context-separator"></div>
        <div class="context-item" onclick="refreshFolder('${windowId}')">Refresh</div>
    `;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
}

function createFolderItem(windowId) {
    const folderContent = document.getElementById(windowId + '-content');
    const emptyFolder = folderContent.querySelector('.empty-folder');
    if (emptyFolder) emptyFolder.remove();
    
    const folderCount = folderContent.querySelectorAll('.file-item.folder').length;
    
    const newFolder = document.createElement('div');
    newFolder.className = 'file-item folder';
    newFolder.innerHTML = `
        <i class="fas fa-folder" style="color: #FFD700; font-size: 32px;"></i>
        <span>New Folder ${folderCount + 1}</span>
    `;
    
    addFolderItemListeners(newFolder, windowId);
    folderContent.appendChild(newFolder);
    hideContextMenu();
    
    // Auto-rename
    setTimeout(() => startFolderItemRename(newFolder), 100);
}

function createFileItem(windowId) {
    const folderContent = document.getElementById(windowId + '-content');
    const emptyFolder = folderContent.querySelector('.empty-folder');
    if (emptyFolder) emptyFolder.remove();
    
    const fileCount = folderContent.querySelectorAll('.file-item.file').length;
    
    const newFile = document.createElement('div');
    newFile.className = 'file-item file';
    newFile.innerHTML = `
        <i class="fas fa-file" style="color: #4A90E2; font-size: 32px;"></i>
        <span>New File ${fileCount + 1}.txt</span>
    `;
    
    addFolderItemListeners(newFile, windowId);
    folderContent.appendChild(newFile);
    hideContextMenu();
    
    // Auto-rename
    setTimeout(() => startFolderItemRename(newFile), 100);
}

function addFolderItemListeners(item, windowId) {
    // Double-click to open/rename
    let clickTimeout = null;
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            // Double click
            if (this.classList.contains('folder')) {
                const folderName = this.querySelector('span').textContent;
                openFolderWindow(folderName);
            }
            return;
        }
        
        clickTimeout = setTimeout(() => {
            // Single click - select
            document.querySelectorAll('.file-item.selected').forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            clickTimeout = null;
        }, 300);
    });
    
    // Right-click context menu
    item.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.file-item.selected').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        showFileItemContextMenu(e.clientX, e.clientY, this, windowId);
    });
}

function showFileItemContextMenu(x, y, item, windowId) {
    hideContextMenu();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    const isFolder = item.classList.contains('folder');
    
    menu.innerHTML = `
        ${isFolder ? '<div class="context-item" onclick="openSelectedFolder()">Open</div>' : ''}
        <div class="context-item" onclick="startFolderItemRename(document.querySelector(\'.file-item.selected\'))">Rename</div>
        <div class="context-item" onclick="deleteSelectedItem()">Delete</div>
        <div class="context-separator"></div>
        <div class="context-item" onclick="showItemProperties()">Properties</div>
    `;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
}

function startFolderItemRename(item) {
    if (!item) return;
    
    const span = item.querySelector('span');
    const currentName = span.textContent;
    
    const input = document.createElement('input');
    input.className = 'rename-input';
    input.value = currentName;
    input.style.width = '100px';
    
    span.style.display = 'none';
    item.appendChild(input);
    input.focus();
    input.select();
    
    function finishRename() {
        const newName = input.value.trim() || currentName;
        span.textContent = newName;
        span.style.display = 'block';
        input.remove();
        hideContextMenu();
    }
    
    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            finishRename();
        } else if (e.key === 'Escape') {
            span.style.display = 'block';
            input.remove();
            hideContextMenu();
        }
    });
}

function deleteSelectedItem() {
    const selected = document.querySelector('.file-item.selected');
    if (selected) {
        const name = selected.querySelector('span').textContent;
        showDeleteDialog(name, () => {
            const parent = selected.parentElement;
            selected.remove();
            
            // Show empty folder message if no items left
            if (parent.children.length === 0) {
                parent.innerHTML = `
                    <div class="empty-folder">
                        <i class="fas fa-folder-open" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                        <p>This folder is empty</p>
                        <small>Right-click to add new items</small>
                    </div>
                `;
            }
        });
    }
    hideContextMenu();
}

function openSelectedFolder() {
    const selected = document.querySelector('.file-item.selected');
    if (selected && selected.classList.contains('folder')) {
        const folderName = selected.querySelector('span').textContent;
        openFolderWindow(folderName);
    }
    hideContextMenu();
}

function showItemProperties() {
    const selected = document.querySelector('.file-item.selected');
    if (selected) {
        const name = selected.querySelector('span').textContent;
        const type = selected.classList.contains('folder') ? 'Folder' : 'File';
        const size = selected.classList.contains('file') ? '0 bytes' : '--';
        const created = new Date().toLocaleDateString();
        
        showPropertiesDialog(name, type, size, created);
    }
    hideContextMenu();
}

function refreshFolder(windowId) {
    const folderContent = document.getElementById(windowId + '-content');
    folderContent.style.opacity = '0.8';
    setTimeout(() => {
        folderContent.style.opacity = '1';
    }, 200);
    hideContextMenu();
}

// Calculate experience duration
function calculateExperienceDuration() {
    const startDate = new Date('2024-12-05');
    const currentDate = new Date();
    
    const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
    const monthDiff = currentDate.getMonth() - startDate.getMonth();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    
    // If current day is before start day, subtract one month
    if (currentDate.getDate() < startDate.getDate()) {
        totalMonths--;
    }
    
    // Ensure minimum of 1 month if started this month
    if (totalMonths < 1) {
        totalMonths = 1;
    }
    
    const experienceElement = document.getElementById('experience-months');
    if (experienceElement) {
        if (totalMonths === 1) {
            experienceElement.textContent = '1 month';
        } else {
            experienceElement.textContent = totalMonths + ' months';
        }
    }
}

// Contact and Social Network Functions
function openContactApp(type) {
    switch(type) {
        case 'email':
            showNotification('Opening Email Client...', 'fas fa-envelope');
            setTimeout(() => {
                window.open('mailto:janaksanjel@example.com', '_blank');
            }, 1000);
            break;
        case 'phone':
            showNotification('Dialing Phone Number...', 'fas fa-phone');
            break;
        case 'location':
            showNotification('Opening Maps...', 'fas fa-map-marker-alt');
            setTimeout(() => {
                window.open('https://maps.google.com/?q=Chapagaun,Lalitpur', '_blank');
            }, 1000);
            break;
    }
}

function openSocialNetwork(platform) {
    const networks = {
        linkedin: {
            url: 'https://linkedin.com/in/janaksanjel',
            name: 'LinkedIn',
            icon: 'fab fa-linkedin'
        },
        github: {
            url: 'https://github.com/janaksanjel',
            name: 'GitHub',
            icon: 'fab fa-github'
        },
        twitter: {
            url: 'https://twitter.com/janaksanjel',
            name: 'Twitter',
            icon: 'fab fa-twitter'
        },
        instagram: {
            url: 'https://instagram.com/janaksanjel',
            name: 'Instagram',
            icon: 'fab fa-instagram'
        }
    };
    
    const network = networks[platform];
    if (network) {
        showNotification(`Connecting to ${network.name}...`, network.icon);
        setTimeout(() => {
            window.open(network.url, '_blank');
        }, 1000);
    }
}

function showNotification(message, icon) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'desktop-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .desktop-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(0, 120, 212, 0.3);
                border-radius: 8px;
                padding: 16px 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                z-index: 5000;
                animation: slideIn 0.3s ease-out;
                min-width: 250px;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #333;
                font-size: 14px;
                font-weight: 500;
            }
            
            .notification-content i {
                color: #0078d4;
                font-size: 16px;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Portfolio functionality
function showPortfolioSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.portfolio-sections .section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to clicked nav item
    const targetNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
}

// Network Status Animation
function animateNetworkStatus() {
    const connectedStatuses = document.querySelectorAll('.network-status.connected, .connection-status.online');
    
    connectedStatuses.forEach((status, index) => {
        setTimeout(() => {
            status.style.animationDelay = `${index * 0.5}s`;
        }, index * 100);
    });
    
    setInterval(() => {
        const socialItems = document.querySelectorAll('.social-item');
        socialItems.forEach(item => {
            const status = item.querySelector('.network-status');
            if (status && status.classList.contains('connected')) {
                item.style.borderColor = '#28a745';
                setTimeout(() => {
                    item.style.borderColor = '#e0e0e0';
                }, 200);
            }
        });
    }, 5000 + Math.random() * 10000);
}