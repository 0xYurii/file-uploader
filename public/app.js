// ===== Configuration =====
// Use the same origin as the page (works for both local and production)
const API_BASE = window.location.origin;

// ===== Utility Functions =====

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove
    const timeout = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);

    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    });
}

/**
 * Show loading state on button
 */
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

/**
 * Show error message in form
 */
function showFormError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

/**
 * Hide error message in form
 */
function hideFormError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }
}

// ===== API Functions =====

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            credentials: 'include', // Important for cookies
            headers: {
                ...options.headers,
            },
        });

        // Handle authentication errors
        if (response.status === 401) {
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
            throw new Error('Unauthorized');
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const authAPI = {
    async signup(username, email, password) {
        return apiFetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
    },

    async login(username, password) {
        return apiFetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
    },

    async logout() {
        return apiFetch('/auth/logout', {
            method: 'POST',
        });
    },

    async getCurrentUser() {
        return apiFetch('/auth/me');
    },
};

// Files API
const filesAPI = {
    async upload(file) {
        const formData = new FormData();
        formData.append('file', file);

        return fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        }).then(async (response) => {
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Upload failed');
            }
            return response.json();
        });
    },

    async getFiles() {
        return apiFetch('/api/files');
    },

    async deleteFile(fileId) {
        return apiFetch(`/api/files/${fileId}`, {
            method: 'DELETE',
        });
    },

    async moveFile(fileId, folderId) {
        return apiFetch(`/api/files/${fileId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId }),
        });
    },

    downloadFile(fileId) {
        window.location.href = `${API_BASE}/api/files/${fileId}/download`;
    },
};

// Folders API
const foldersAPI = {
    async create(name) {
        return apiFetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
    },

    async getFolders() {
        return apiFetch('/api/folders');
    },
};

// ===== Authentication Page Logic =====
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    // Toggle between login and signup forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');

    showSignupBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        hideFormError('loginError');
    });

    showLoginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
        hideFormError('signupError');
    });

    // Handle login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFormError('loginError');

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        setButtonLoading(loginBtn, true);

        try {
            await authAPI.login(username, password);
            showToast('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 500);
        } catch (error) {
            showFormError('loginError', error.message);
            setButtonLoading(loginBtn, false);
        }
    });

    // Handle signup
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideFormError('signupError');

        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const signupBtn = document.getElementById('signupBtn');

        setButtonLoading(signupBtn, true);

        try {
            await authAPI.signup(username, email, password);
            showToast('Account created successfully!', 'success');
            
            // Auto-login after signup
            await authAPI.login(username, password);
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 500);
        } catch (error) {
            showFormError('signupError', error.message);
            setButtonLoading(signupBtn, false);
        }
    });
}

// ===== Dashboard Page Logic =====
if (window.location.pathname === '/dashboard.html') {
    let currentUser = null;
    let allFiles = [];
    let allFolders = [];
    let selectedFiles = [];
    let currentFileToMove = null;

    // Check authentication on load
    async function checkAuth() {
        try {
            const response = await authAPI.getCurrentUser();
            currentUser = response.user;
            displayUserInfo();
            await Promise.all([loadFiles(), loadFolders()]);
        } catch (error) {
            window.location.href = '/';
        }
    }

    // Display user information
    function displayUserInfo() {
        const usernameEl = document.getElementById('username');
        const avatarEl = document.getElementById('userAvatar');
        
        if (usernameEl) {
            usernameEl.textContent = currentUser.username;
        }
        
        if (avatarEl) {
            avatarEl.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }

    // Load files
    async function loadFiles() {
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading files...</p></div>';

        try {
            const response = await filesAPI.getFiles();
            allFiles = response.files || [];
            displayFiles();
            updateStorageInfo();
        } catch (error) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <p>Failed to load files. ${error.message}</p>
                </div>
            `;
        }
    }

    // Display files
    function displayFiles() {
        const filesList = document.getElementById('filesList');

        if (allFiles.length === 0) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke-width="2"/>
                        <polyline points="13 2 13 9 20 9" stroke-width="2"/>
                    </svg>
                    <h3>No files yet</h3>
                    <p>Upload your first file to get started</p>
                </div>
            `;
            return;
        }

        filesList.innerHTML = allFiles.map(file => `
            <div class="file-card" data-file-id="${file.id}">
                <div class="file-card-header">
                    <div class="file-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke-width="2"/>
                            <polyline points="13 2 13 9 20 9" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="file-info">
                        <div class="file-name" title="${file.filename}">${file.filename}</div>
                        <div class="file-meta">${formatFileSize(file.size)} • ${formatDate(file.uploadedAt)}</div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn-download" onclick="downloadFile('${file.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2"/>
                            <polyline points="7 10 12 15 17 10" stroke-width="2"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke-width="2"/>
                        </svg>
                        Download
                    </button>
                    <button class="btn-move" onclick="openMoveModal('${file.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke-width="2"/>
                        </svg>
                        Move
                    </button>
                    <button class="btn-delete" onclick="deleteFile('${file.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6" stroke-width="2"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2"/>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Load folders
    async function loadFolders() {
        const foldersList = document.getElementById('foldersList');
        foldersList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading folders...</p></div>';

        try {
            const response = await foldersAPI.getFolders();
            allFolders = response.folders || [];
            displayFolders();
        } catch (error) {
            foldersList.innerHTML = `
                <div class="empty-state">
                    <p>Failed to load folders. ${error.message}</p>
                </div>
            `;
        }
    }

    // Display folders
    function displayFolders() {
        const foldersList = document.getElementById('foldersList');

        if (allFolders.length === 0) {
            foldersList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke-width="2"/>
                    </svg>
                    <h3>No folders yet</h3>
                    <p>Create your first folder to organize files</p>
                </div>
            `;
            return;
        }

        foldersList.innerHTML = allFolders.map(folder => {
            const fileCount = folder.files?.length || 0;
            return `
                <div class="folder-card" data-folder-id="${folder.id}">
                    <div class="folder-card-header">
                        <div class="folder-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="folder-info">
                            <div class="folder-name" title="${folder.name}">${folder.name}</div>
                            <div class="folder-meta">${fileCount} ${fileCount === 1 ? 'file' : 'files'}</div>
                        </div>
                    </div>
                    <div class="folder-actions">
                        <button class="btn-open" onclick="viewFolderFiles('${folder.id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" stroke-width="2"/>
                            </svg>
                            Open
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update storage info
    function updateStorageInfo() {
        const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
        const storageText = document.getElementById('storageText');
        const storageBar = document.getElementById('storageBar');
        
        if (storageText) {
            storageText.textContent = `${formatFileSize(totalSize)} used`;
        }
        
        if (storageBar) {
            // Simulate storage percentage (you can adjust this based on actual limits)
            const percentage = Math.min((totalSize / (1024 * 1024 * 1024)) * 100, 100); // 1GB limit for visualization
            storageBar.style.width = `${percentage}%`;
        }
    }

    // File upload handling
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const filePreview = document.getElementById('filePreview');
    const uploadBtn = document.getElementById('uploadBtn');

    // Click to browse
    uploadDropzone?.addEventListener('click', () => fileInput?.click());

    // Drag and drop
    uploadDropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('dragover');
    });

    uploadDropzone?.addEventListener('dragleave', () => {
        uploadDropzone.classList.remove('dragover');
    });

    uploadDropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelection();
        }
    });

    // File selection
    fileInput?.addEventListener('change', handleFileSelection);

    function handleFileSelection() {
        selectedFiles = Array.from(fileInput.files);
        
        if (selectedFiles.length > 0) {
            filePreview.classList.remove('hidden');
            filePreview.innerHTML = selectedFiles.map((file, index) => `
                <div class="file-preview-item">
                    <div class="file-preview-info">
                        <div class="file-preview-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke-width="2"/>
                                <polyline points="13 2 13 9 20 9" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="file-preview-details">
                            <h4>${file.name}</h4>
                            <p>${formatFileSize(file.size)}</p>
                        </div>
                    </div>
                    <button type="button" class="file-preview-remove" onclick="removeFile(${index})">&times;</button>
                </div>
            `).join('');
            uploadBtn.disabled = false;
        } else {
            filePreview.classList.add('hidden');
            uploadBtn.disabled = true;
        }
    }

    // Remove file from selection
    window.removeFile = function(index) {
        const dt = new DataTransfer();
        selectedFiles.forEach((file, i) => {
            if (i !== index) dt.items.add(file);
        });
        fileInput.files = dt.files;
        handleFileSelection();
    };

    // Upload files
    uploadForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedFiles.length === 0) return;

        setButtonLoading(uploadBtn, true);

        try {
            // Upload files one by one
            for (const file of selectedFiles) {
                await filesAPI.upload(file);
            }

            showToast(`${selectedFiles.length} file(s) uploaded successfully!`, 'success');
            
            // Reset form
            uploadForm.reset();
            selectedFiles = [];
            filePreview.classList.add('hidden');
            uploadBtn.disabled = true;

            // Reload files
            await loadFiles();
        } catch (error) {
            showToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            setButtonLoading(uploadBtn, false);
        }
    });

    // Download file
    window.downloadFile = function(fileId) {
        filesAPI.downloadFile(fileId);
        showToast('Download started', 'success');
    };

    // Delete file
    window.deleteFile = async function(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await filesAPI.deleteFile(fileId);
            showToast('File deleted successfully', 'success');
            await loadFiles();
        } catch (error) {
            showToast(`Delete failed: ${error.message}`, 'error');
        }
    };

    // View folder files
    window.viewFolderFiles = function(folderId) {
        const folder = allFolders.find(f => f.id === folderId);
        if (!folder) return;

        const filesList = document.getElementById('filesList');
        const folderFiles = folder.files || [];

        // Switch to files view
        document.querySelector('[data-view="files"]')?.click();

        if (folderFiles.length === 0) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <h3>Empty folder</h3>
                    <p>This folder doesn't contain any files yet</p>
                </div>
            `;
            return;
        }

        filesList.innerHTML = folderFiles.map(file => `
            <div class="file-card" data-file-id="${file.id}">
                <div class="file-card-header">
                    <div class="file-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke-width="2"/>
                            <polyline points="13 2 13 9 20 9" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="file-info">
                        <div class="file-name" title="${file.filename}">${file.filename}</div>
                        <div class="file-meta">${formatFileSize(file.size)} • ${formatDate(file.uploadedAt)}</div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn-download" onclick="downloadFile('${file.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2"/>
                            <polyline points="7 10 12 15 17 10" stroke-width="2"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke-width="2"/>
                        </svg>
                        Download
                    </button>
                    <button class="btn-delete" onclick="deleteFile('${file.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6" stroke-width="2"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2"/>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    };

    // Move file modal
    const moveFileModal = document.getElementById('moveFileModal');
    const moveFileForm = document.getElementById('moveFileForm');
    const targetFolderSelect = document.getElementById('targetFolder');

    window.openMoveModal = async function(fileId) {
        currentFileToMove = fileId;
        
        // Populate folder dropdown
        if (allFolders.length === 0) {
            showToast('Please create a folder first', 'warning');
            return;
        }

        targetFolderSelect.innerHTML = allFolders.map(folder => 
            `<option value="${folder.id}">${folder.name}</option>`
        ).join('');

        moveFileModal.classList.remove('hidden');
    };

    moveFileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const folderId = targetFolderSelect.value;
        if (!currentFileToMove || !folderId) return;

        try {
            await filesAPI.moveFile(currentFileToMove, folderId);
            showToast('File moved successfully', 'success');
            closeModal('moveFileModal');
            await Promise.all([loadFiles(), loadFolders()]);
        } catch (error) {
            showToast(`Move failed: ${error.message}`, 'error');
        }
    });

    // Create folder modal
    const createFolderModal = document.getElementById('createFolderModal');
    const createFolderForm = document.getElementById('createFolderForm');
    const createFolderBtn = document.getElementById('createFolderBtn');

    createFolderBtn?.addEventListener('click', () => {
        createFolderModal.classList.remove('hidden');
    });

    createFolderForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const folderName = document.getElementById('folderName').value;
        if (!folderName) return;

        try {
            await foldersAPI.create(folderName);
            showToast('Folder created successfully', 'success');
            closeModal('createFolderModal');
            createFolderForm.reset();
            await loadFolders();
        } catch (error) {
            showToast(`Create folder failed: ${error.message}`, 'error');
        }
    });

    // Modal close handlers
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.add('hidden');
    }

    document.querySelectorAll('.modal-overlay, .modal-close, #cancelFolderBtn, #cancelMoveBtn').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = e.target.closest('.modal');
            modal?.classList.add('hidden');
        });
    });

    // Navigation between views
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            
            // Update nav
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Update views
            document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
            document.getElementById(`${view}View`)?.classList.add('active');

            // Reload all files when switching back to files view
            if (view === 'files') {
                loadFiles();
            }
        });
    });

    // Refresh files button
    document.getElementById('refreshFilesBtn')?.addEventListener('click', loadFiles);

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            await authAPI.logout();
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } catch (error) {
            showToast('Logout failed', 'error');
        }
    });

    // Initialize dashboard
    checkAuth();
}
