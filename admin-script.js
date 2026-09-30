// ===== ADMIN PANEL JAVASCRIPT =====

// ===== AUTHENTICATION =====
const ADMIN_CREDENTIALS = {
    username: 'salah',
    password: 'salah'
};

const AUTH_TOKEN = 'salah-admin-token-2024';

// Check if user is logged in
function isAuthenticated() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUsername', username);
            localStorage.setItem('adminToken', data.token);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminToken');
    window.location.href = 'admin-login.html';
}

// Protect admin pages
function protectPage() {
    if (!isAuthenticated() && !window.location.href.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
    }
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Handle API errors
async function fetchWithAuth(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API error:', error);
        return null;
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

// ===== PAGE SPECIFIC FUNCTIONALITY =====

// Login Page
if (window.location.href.includes('admin-login.html')) {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const success = await login(username, password);
            if (success) {
                showNotification('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
            } else {
                showNotification('Invalid username or password', 'error');
            }
        });
    }
}

// Dashboard Page
if (window.location.href.includes('admin-dashboard.html')) {
    protectPage();
    
    // Load dashboard stats
    async function loadDashboardStats() {
        try {
            // Load contacts
            const contactsResponse = await fetchWithAuth('/api/contacts');
            const contactsData = contactsResponse ? await contactsResponse.json() : { success: false, data: [] };
            const contacts = contactsData.success ? contactsData.data : [];
            
            // Load reviews
            const reviewsResponse = await fetchWithAuth('/api/reviews/all');
            const reviewsData = reviewsResponse ? await reviewsResponse.json() : { success: false, data: [] };
            const reviews = reviewsData.success ? reviewsData.data : [];

            const visitsResponse = await fetchWithAuth('/api/visits');
            const visitsData = visitsResponse ? await visitsResponse.json() : { success: false, data: [] };
            const visits = visitsData.success ? visitsData.data : [];
            
            // Update stats
            document.getElementById('totalContacts').textContent = contacts.length;
            document.getElementById('pendingContacts').textContent = contacts.filter(c => c.status === 'pending').length;
            document.getElementById('totalReviews').textContent = reviews.length;
            document.getElementById('pendingReviews').textContent = reviews.filter(r => !r.approved).length;
            const pendingVisits = visits.filter(v => v.status === 'pending').length;
            document.getElementById('totalVisits').textContent = visits.length;
            document.getElementById('pendingVisitsLabel').textContent = pendingVisits + ' pending';
            
            // Update badges
            document.getElementById('contactsBadge').textContent = contacts.filter(c => c.status === 'pending').length;
            document.getElementById('reviewsBadge').textContent = reviews.filter(r => !r.approved).length;
            const visitsBadge = document.getElementById('visitsBadge');
            if (visitsBadge) visitsBadge.textContent = pendingVisits;
            
            loadRecentContacts(contacts.slice(0, 5));
            loadRecentReviews(reviews.slice(0, 5));
            loadRecentVisits(visits.slice(0, 5));
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            showNotification('Error loading dashboard data', 'error');
        }
    }
    
    function loadRecentContacts(contacts) {
        const container = document.getElementById('recentContacts');
        if (!container) return;
        
        if (contacts.length === 0) {
            container.innerHTML = '<p class="no-data">No recent contacts</p>';
            return;
        }
        
        container.innerHTML = contacts.map(contact => `
            <div class="recent-item">
                <div class="recent-item-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="recent-item-content">
                    <div class="recent-item-title">${contact.name}</div>
                    <div class="recent-item-subtitle">${contact.service}</div>
                </div>
                <div class="recent-item-date">${formatDate(contact.createdAt)}</div>
            </div>
        `).join('');
    }
    
    function loadRecentReviews(reviews) {
        const container = document.getElementById('recentReviews');
        if (!container) return;
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="no-data">No recent reviews</p>';
            return;
        }
        
        container.innerHTML = reviews.map(review => `
            <div class="recent-item">
                <div class="recent-item-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="recent-item-content">
                    <div class="recent-item-title">${review.name}</div>
                    <div class="recent-item-subtitle">${review.rating} stars - ${review.service}</div>
                </div>
                <div class="recent-item-actions">
                    <button class="btn-action btn-delete" onclick="deleteReview('${review._id}')" title="Delete review">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    function loadRecentVisits(visits) {
        const container = document.getElementById('recentVisits');
        if (!container) return;
        if (visits.length === 0) {
            container.innerHTML = '<p class="no-data">No visit requests</p>';
            return;
        }
        container.innerHTML = visits.map(visit => `
            <div class="recent-item">
                <div class="recent-item-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="recent-item-content">
                    <div class="recent-item-title">${visit.name}</div>
                    <div class="recent-item-subtitle">${visit.preferredDate} · ${formatVisitTime(visit.preferredTime)} · ${visit.status}</div>
                </div>
            </div>
        `).join('');
    }

    window.deleteReview = async function(reviewId) {
        if (!confirm('Delete this customer review? This cannot be undone.')) return;
        try {
            const response = await fetchWithAuth(`/api/reviews/${reviewId}`, { method: 'DELETE' });
            if (!response) return;
            const data = await response.json();
            if (data.success) {
                showNotification('Review deleted successfully', 'success');
                loadDashboardStats();
            } else {
                showNotification(data.message || 'Error deleting review', 'error');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            showNotification('Error deleting review', 'error');
        }
    };
    
    loadDashboardStats();
}

// Contacts Management Page
if (window.location.href.includes('admin-contacts.html')) {
    protectPage();
    
    let allContacts = [];
    
    // Load contacts
    async function loadContacts() {
        try {
            const response = await fetchWithAuth('/api/contacts');
            const data = response ? await response.json() : { success: false, data: [] };
            
            if (data.success) {
                allContacts = data.data;
                filterAndDisplayContacts();
                updateContactStats();
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            showNotification('Error loading contacts', 'error');
        }
    }
    
    function filterAndDisplayContacts() {
        const statusFilter = document.getElementById('statusFilter').value;
        const serviceFilter = document.getElementById('serviceFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        
        let filtered = allContacts;
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }
        
        if (serviceFilter !== 'all') {
            filtered = filtered.filter(c => c.service === serviceFilter);
        }
        
        if (searchFilter) {
            filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(searchFilter) ||
                c.phone.includes(searchFilter) ||
                c.email?.toLowerCase().includes(searchFilter)
            );
        }
        
        displayContacts(filtered);
    }
    
    function displayContacts(contacts) {
        const tbody = document.getElementById('contactsTableBody');
        if (!tbody) return;
        
        document.getElementById('totalCount').textContent = contacts.length;
        
        if (contacts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No contacts found</td></tr>';
            return;
        }
        
        tbody.innerHTML = contacts.map(contact => `
            <tr>
                <td><strong>${contact.name}</strong></td>
                <td>${contact.phone}</td>
                <td>${contact.email || 'N/A'}</td>
                <td>${formatService(contact.service)}</td>
                <td><span class="status-badge status-${contact.status}">${contact.status}</span></td>
                <td>${formatDate(contact.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewContact('${contact._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <a href="https://wa.me/44${contact.phone.replace(/^0/, '')}" target="_blank" class="btn-action btn-whatsapp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <button class="btn-action btn-delete" onclick="deleteContact('${contact._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    function updateContactStats() {
        const pending = allContacts.filter(c => c.status === 'pending').length;
        document.getElementById('contactsBadge').textContent = pending;
    }
    
    // View contact details
    window.viewContact = async function(contactId) {
        try {
            const response = await fetchWithAuth(`/api/contacts/${contactId}`);
            const data = response ? await response.json() : { success: false };
            
            if (data.success) {
                const contact = data.data;
                const modalBody = document.getElementById('contactModalBody');
                
                modalBody.innerHTML = `
                    <div class="detail-item">
                        <label>Name:</label>
                        <p>${contact.name}</p>
                    </div>
                    <div class="detail-item">
                        <label>Phone:</label>
                        <p>${contact.phone}</p>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <p>${contact.email || 'N/A'}</p>
                    </div>
                    <div class="detail-item">
                        <label>Service:</label>
                        <p>${formatService(contact.service)}</p>
                    </div>
                    <div class="detail-item">
                        <label>Message:</label>
                        <p>${contact.message}</p>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <p><span class="status-badge status-${contact.status}">${contact.status}</span></p>
                    </div>
                    <div class="detail-item">
                        <label>Submitted:</label>
                        <p>${formatDate(contact.createdAt)}</p>
                    </div>
                    <div class="detail-item">
                        <label>Update Status:</label>
                        <select id="contactStatusUpdate" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                            <option value="pending" ${contact.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="contacted" ${contact.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                            <option value="completed" ${contact.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                    <button class="btn-login" onclick="updateContactStatus('${contact._id}')" style="margin-top: 1rem;">
                        Update Status
                    </button>
                `;
                
                document.getElementById('contactModal').classList.add('active');
            }
        } catch (error) {
            console.error('Error loading contact details:', error);
            showNotification('Error loading contact details', 'error');
        }
    };
    
    // Update contact status
    window.updateContactStatus = async function(contactId) {
        try {
            const newStatus = document.getElementById('contactStatusUpdate').value;
            
            const response = await fetchWithAuth(`/api/contacts/${contactId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Contact status updated successfully', 'success');
                document.getElementById('contactModal').classList.remove('active');
                loadContacts();
            } else {
                showNotification('Error updating contact status', 'error');
            }
        } catch (error) {
            console.error('Error updating contact status:', error);
            showNotification('Error updating contact status', 'error');
        }
    };
    
    // Delete contact
    window.deleteContact = async function(contactId) {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        
        try {
            const response = await fetchWithAuth(`/api/contacts/${contactId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Contact deleted successfully', 'success');
                loadContacts();
            } else {
                showNotification('Error deleting contact', 'error');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            showNotification('Error deleting contact', 'error');
        }
    };
    
    // Event listeners
    document.getElementById('statusFilter')?.addEventListener('change', filterAndDisplayContacts);
    document.getElementById('serviceFilter')?.addEventListener('change', filterAndDisplayContacts);
    document.getElementById('searchFilter')?.addEventListener('input', filterAndDisplayContacts);
    document.getElementById('refreshBtn')?.addEventListener('click', loadContacts);
    
    // Modal close
    document.getElementById('closeContactModal')?.addEventListener('click', () => {
        document.getElementById('contactModal').classList.remove('active');
    });
    
    loadContacts();
}

// Reviews Management Page
if (window.location.href.includes('admin-reviews.html')) {
    protectPage();
    
    let allReviews = [];
    
    // Load reviews
    async function loadReviews() {
        try {
            const response = await fetchWithAuth('/api/reviews/all');
            const data = response ? await response.json() : { success: false, data: [] };
            
            if (data.success) {
                allReviews = data.data;
                filterAndDisplayReviews();
                updateReviewStats();
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            showNotification('Error loading reviews', 'error');
        }
    }
    
    function filterAndDisplayReviews() {
        const statusFilter = document.getElementById('reviewStatusFilter').value;
        const serviceFilter = document.getElementById('reviewServiceFilter').value;
        const ratingFilter = document.getElementById('ratingFilter').value;
        const searchFilter = document.getElementById('reviewSearchFilter').value.toLowerCase();
        
        let filtered = allReviews;
        
        if (statusFilter === 'pending') {
            filtered = filtered.filter(r => !r.approved);
        } else if (statusFilter === 'approved') {
            filtered = filtered.filter(r => r.approved);
        }
        
        if (serviceFilter !== 'all') {
            filtered = filtered.filter(r => r.service === serviceFilter);
        }
        
        if (ratingFilter !== 'all') {
            filtered = filtered.filter(r => r.rating === parseInt(ratingFilter));
        }
        
        if (searchFilter) {
            filtered = filtered.filter(r => 
                r.name.toLowerCase().includes(searchFilter) ||
                r.review.toLowerCase().includes(searchFilter)
            );
        }
        
        displayReviews(filtered);
    }
    
    function displayReviews(reviews) {
        const tbody = document.getElementById('reviewsTableBody');
        if (!tbody) return;
        
        document.getElementById('totalReviewsCount').textContent = reviews.length;
        
        if (reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No reviews found</td></tr>';
            return;
        }
        
        tbody.innerHTML = reviews.map(review => `
            <tr>
                <td><strong>${review.name}</strong></td>
                <td>${formatService(review.service)}</td>
                <td>
                    <div class="rating-stars">
                        ${generateStars(review.rating)}
                    </div>
                </td>
                <td>${review.review.substring(0, 50)}${review.review.length > 50 ? '...' : ''}</td>
                <td><span class="status-badge status-${review.approved ? 'approved' : 'pending'}">${review.approved ? 'Approved' : 'Pending'}</span></td>
                <td>${formatDate(review.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn-action btn-view" onclick="viewReview('${review._id}')" title="View review">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${!review.approved ? `<button type="button" class="btn-action btn-approve" onclick="approveReview('${review._id}')" title="Approve review">
                            <i class="fas fa-check"></i> Approve
                        </button>` : ''}
                        <button type="button" class="btn-action btn-delete" onclick="deleteReview('${review._id}')" title="Delete review">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    function updateReviewStats() {
        const pending = allReviews.filter(r => !r.approved).length;
        document.getElementById('reviewsBadge').textContent = pending;
    }
    
    // View review details
    window.viewReview = async function(reviewId) {
        try {
            const response = await fetchWithAuth(`/api/reviews/all`);
            const data = response ? await response.json() : { success: false, data: [] };
            
            if (data.success) {
                const review = data.data.find(r => String(r._id) === String(reviewId));
                if (review) {
                    const modalBody = document.getElementById('reviewModalBody');
                    
                    modalBody.innerHTML = `
                        <div class="detail-item">
                            <label>Name:</label>
                            <p>${review.name}</p>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <p>${review.email}</p>
                        </div>
                        <div class="detail-item">
                            <label>Service:</label>
                            <p>${formatService(review.service)}</p>
                        </div>
                        <div class="detail-item">
                            <label>Rating:</label>
                            <div class="rating-stars">
                                ${generateStars(review.rating)}
                            </div>
                        </div>
                        <div class="detail-item">
                            <label>Review:</label>
                            <p>${review.review}</p>
                        </div>
                        ${review.photos && review.photos.length ? `
                        <div class="detail-item">
                            <label>Photos:</label>
                            <div class="admin-review-photos">
                                ${review.photos.map(src => `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="Review photo"></a>`).join('')}
                            </div>
                        </div>` : ''}
                        <div class="detail-item">
                            <label>Status:</label>
                            <p><span class="status-badge status-${review.approved ? 'approved' : 'pending'}">${review.approved ? 'Approved' : 'Pending'}</span></p>
                        </div>
                        <div class="detail-item">
                            <label>Submitted:</label>
                            <p>${formatDate(review.createdAt)}</p>
                        </div>
                        ${!review.approved ? `<button type="button" class="btn-login" onclick="approveReview('${review._id}')" style="margin-top: 1rem;">
                            Approve Review
                        </button>` : ''}
                        <button type="button" class="btn-login btn-delete-lg" onclick="deleteReview('${review._id}')">
                            Delete Review
                        </button>
                    `;
                    
                    document.getElementById('reviewModal').classList.add('active');
                }
            }
        } catch (error) {
            console.error('Error loading review details:', error);
            showNotification('Error loading review details', 'error');
        }
    };
    
    // Approve review
    window.approveReview = async function(reviewId) {
        try {
            const response = await fetchWithAuth(`/api/reviews/${reviewId}/approve`, {
                method: 'PUT'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Review approved successfully', 'success');
                document.getElementById('reviewModal').classList.remove('active');
                loadReviews();
            } else {
                showNotification('Error approving review', 'error');
            }
        } catch (error) {
            console.error('Error approving review:', error);
            showNotification('Error approving review', 'error');
        }
    };
    
    // Delete review
    window.deleteReview = async function(reviewId) {
        if (!confirm('Delete this customer review? This cannot be undone.')) return;
        
        try {
            const response = await fetchWithAuth(`/api/reviews/${reviewId}`, {
                method: 'DELETE'
            });

            if (!response) return;
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Review deleted successfully', 'success');
                document.getElementById('reviewModal')?.classList.remove('active');
                loadReviews();
            } else {
                showNotification(data.message || 'Error deleting review', 'error');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            showNotification('Error deleting review', 'error');
        }
    };
    
    // Event listeners
    document.getElementById('reviewStatusFilter')?.addEventListener('change', filterAndDisplayReviews);
    document.getElementById('reviewServiceFilter')?.addEventListener('change', filterAndDisplayReviews);
    document.getElementById('ratingFilter')?.addEventListener('change', filterAndDisplayReviews);
    document.getElementById('reviewSearchFilter')?.addEventListener('input', filterAndDisplayReviews);
    document.getElementById('refreshReviewsBtn')?.addEventListener('click', loadReviews);
    
    // Modal close
    document.getElementById('closeReviewModal')?.addEventListener('click', () => {
        document.getElementById('reviewModal').classList.remove('active');
    });
    
    loadReviews();
}

if (window.location.href.includes('admin-visits.html')) {
    protectPage();
    let allVisits = [];

    async function loadVisits() {
        try {
            const response = await fetchWithAuth('/api/visits');
            const data = response ? await response.json() : { success: false, data: [] };
            if (data.success) {
                allVisits = data.data;
                filterAndDisplayVisits();
                const pending = allVisits.filter(v => v.status === 'pending').length;
                document.getElementById('visitsBadge').textContent = pending;
            }
        } catch (error) {
            console.error('Error loading visits:', error);
            showNotification('Error loading visits', 'error');
        }
    }

    function filterAndDisplayVisits() {
        const statusFilter = document.getElementById('visitStatusFilter').value;
        const searchFilter = document.getElementById('visitSearchFilter').value.toLowerCase();
        let filtered = allVisits;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(v => v.status === statusFilter);
        }
        if (searchFilter) {
            filtered = filtered.filter(v =>
                v.name.toLowerCase().includes(searchFilter) ||
                v.phone.includes(searchFilter) ||
                (v.address || '').toLowerCase().includes(searchFilter)
            );
        }
        displayVisits(filtered);
    }

    function displayVisits(visits) {
        const tbody = document.getElementById('visitsTableBody');
        if (!tbody) return;
        document.getElementById('totalVisitsCount').textContent = visits.length;
        if (visits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No visit requests</td></tr>';
            return;
        }
        tbody.innerHTML = visits.map(visit => `
            <tr>
                <td><strong>${visit.name}</strong></td>
                <td>${visit.phone}</td>
                <td>${formatService(visit.service)}</td>
                <td>${visit.preferredDate}<br><small>${formatVisitTime(visit.preferredTime)}</small></td>
                <td><span class="status-badge status-${visit.status}">${visit.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn-action btn-view" onclick="viewVisit('${visit._id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button type="button" class="btn-action btn-delete" onclick="deleteVisit('${visit._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.viewVisit = function(visitId) {
        const visit = allVisits.find(v => String(v._id) === String(visitId));
        if (!visit) return;
        document.getElementById('visitAdminModalBody').innerHTML = `
            <div class="detail-item"><label>Name:</label><p>${visit.name}</p></div>
            <div class="detail-item"><label>Phone:</label><p>${visit.phone}</p></div>
            <div class="detail-item"><label>Email:</label><p>${visit.email || 'N/A'}</p></div>
            <div class="detail-item"><label>Address:</label><p>${visit.address}</p></div>
            <div class="detail-item"><label>Service:</label><p>${formatService(visit.service)}</p></div>
            <div class="detail-item"><label>Preferred date:</label><p>${visit.preferredDate}</p></div>
            <div class="detail-item"><label>Preferred time:</label><p>${formatVisitTime(visit.preferredTime)}</p></div>
            <div class="detail-item"><label>Customer notes:</label><p>${visit.notes || 'None'}</p></div>
            <div class="detail-item"><label>Status:</label>
                <select id="visitStatusUpdate" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <option value="pending" ${visit.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${visit.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${visit.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${visit.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
            <div class="detail-item"><label>Admin update / note:</label>
                <textarea id="visitAdminNote" rows="3" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">${visit.adminNote || ''}</textarea>
            </div>
            <button type="button" class="btn-login" onclick="updateVisit('${visit._id}')">Save update</button>
        `;
        document.getElementById('visitAdminModal').classList.add('active');
    };

    window.updateVisit = async function(visitId) {
        try {
            const response = await fetchWithAuth(`/api/visits/${visitId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: document.getElementById('visitStatusUpdate').value,
                    adminNote: document.getElementById('visitAdminNote').value
                })
            });
            if (!response) return;
            const data = await response.json();
            if (data.success) {
                showNotification('Visit updated', 'success');
                document.getElementById('visitAdminModal').classList.remove('active');
                loadVisits();
            } else {
                showNotification(data.message || 'Error updating visit', 'error');
            }
        } catch (error) {
            console.error('Error updating visit:', error);
            showNotification('Error updating visit', 'error');
        }
    };

    window.deleteVisit = async function(visitId) {
        if (!confirm('Delete this visit request?')) return;
        try {
            const response = await fetchWithAuth(`/api/visits/${visitId}`, { method: 'DELETE' });
            if (!response) return;
            const data = await response.json();
            if (data.success) {
                showNotification('Visit deleted', 'success');
                loadVisits();
            } else {
                showNotification(data.message || 'Error deleting visit', 'error');
            }
        } catch (error) {
            console.error('Error deleting visit:', error);
            showNotification('Error deleting visit', 'error');
        }
    };

    document.getElementById('visitStatusFilter')?.addEventListener('change', filterAndDisplayVisits);
    document.getElementById('visitSearchFilter')?.addEventListener('input', filterAndDisplayVisits);
    document.getElementById('refreshVisitsBtn')?.addEventListener('click', loadVisits);
    document.getElementById('closeVisitAdminModal')?.addEventListener('click', () => {
        document.getElementById('visitAdminModal').classList.remove('active');
    });

    loadVisits();
}

// ===== SHARED FUNCTIONALITY =====

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format service name
function formatService(service) {
    const services = {
        'painting': 'Painting & Decorating',
        'plumbing': 'Plumbing',
        'tiling': 'Tiling & Flooring',
        'carpentry': 'Carpentry',
        'repairs': 'General Repairs',
        'cleaning': 'Deep Cleaning',
        'other': 'Other'
    };
    return services[service] || service;
}

function formatVisitTime(time) {
    const times = {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening'
    };
    return times[time] || time;
}

// Generate star rating HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Sidebar toggle
document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

if (document.getElementById('visitsBadge') && !window.location.href.includes('admin-visits.html') && !window.location.href.includes('admin-dashboard.html')) {
    fetchWithAuth('/api/visits').then(async (response) => {
        if (!response) return;
        const data = await response.json();
        if (data.success) {
            document.getElementById('visitsBadge').textContent = data.data.filter(v => v.status === 'pending').length;
        }
    }).catch(() => {});
}

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});