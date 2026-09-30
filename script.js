// ===== PAGE LOADING =====
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ===== MOBILE NAVIGATION =====
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
if (hamburger && navMenu) {
    document.querySelectorAll('.nav-menu a, .nav-menu [data-track-visit]').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ===== NAVBAR SCROLL EFFECT =====
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(26, 54, 93, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    } else {
        navbar.style.background = 'rgba(26, 54, 93, 0.95)';
        navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
    }
});

// ===== ACTIVE NAVIGATION HIGHLIGHTING =====
function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.style.color = 'white';
        link.classList.remove('active');
        
        const linkPath = link.getAttribute('href');
        if (currentPath === '/' + linkPath || currentPath === linkPath || 
            (currentPath === '/' && linkPath === 'index.html')) {
            link.style.color = '#c69749';
            link.classList.add('active');
        }
    });
}

// Run on page load and scroll
highlightActiveNav();
window.addEventListener('scroll', () => {
    // Keep navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(26, 54, 93, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    } else {
        navbar.style.background = 'rgba(26, 54, 93, 0.95)';
        navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
    }
});

// ===== BOOK A VISIT =====
const visitModal = document.getElementById('visitModal');
const bookVisitBtn = document.getElementById('bookVisitBtn');
const closeVisitModal = document.getElementById('closeVisitModal');
const visitForm = document.getElementById('visitForm');

if (bookVisitBtn && visitModal) {
    bookVisitBtn.addEventListener('click', () => {
        const dateInput = document.getElementById('visitDate');
        if (dateInput) {
            dateInput.min = new Date().toISOString().split('T')[0];
        }
        visitModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

if (closeVisitModal && visitModal) {
    closeVisitModal.addEventListener('click', () => {
        visitModal.classList.remove('active');
        document.body.style.overflow = '';
    });
}

if (visitModal) {
    visitModal.addEventListener('click', (e) => {
        if (e.target === visitModal) {
            visitModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (visitForm) {
    visitForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitButton = visitForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('visitName').value,
                    phone: document.getElementById('visitPhone').value,
                    email: document.getElementById('visitEmail').value,
                    address: document.getElementById('visitAddress').value,
                    service: document.getElementById('visitService').value,
                    preferredDate: document.getElementById('visitDate').value,
                    preferredTime: document.getElementById('visitTime').value,
                    notes: document.getElementById('visitNotes').value
                })
            });
            const result = await response.json();
            if (result.success) {
                visitForm.reset();
                visitModal.classList.remove('active');
                document.body.style.overflow = '';
                showNotification('Visit request sent. Track it anytime with this phone number.', 'success');
            } else {
                showNotification(result.message || 'Could not send visit request', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Could not send visit request. Please try again.', 'error');
        } finally {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
}

// ===== TRACK VISIT =====
(function setupVisitTracking() {
    const serviceLabels = {
        painting: 'Painting & Decorating',
        plumbing: 'Plumbing',
        tiling: 'Tiling & Flooring',
        carpentry: 'Carpentry',
        repairs: 'General Repairs',
        cleaning: 'Deep Cleaning',
        other: 'Other'
    };
    const timeLabels = {
        morning: 'Morning (8am–12pm)',
        afternoon: 'Afternoon (12pm–4pm)',
        evening: 'Evening (4pm–6pm)'
    };
    const statusLabels = {
        pending: 'Pending — waiting to confirm',
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function ensureTrackModal() {
        let modal = document.getElementById('trackVisitModal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'trackVisitModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Track your visit</h3>
                    <button type="button" class="modal-close" id="closeTrackVisitModal"><i class="fas fa-times"></i></button>
                </div>
                <form id="trackVisitForm">
                    <div class="form-group">
                        <label for="trackVisitPhone">Phone number used for booking *</label>
                        <input type="tel" id="trackVisitPhone" required placeholder="e.g. 07500 111222">
                    </div>
                    <button type="submit" class="btn btn-primary">Check status</button>
                </form>
                <div class="track-result" id="trackVisitResult"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    function openTrackModal() {
        const modal = ensureTrackModal();
        const result = document.getElementById('trackVisitResult');
        if (result) result.innerHTML = '';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const phone = document.getElementById('trackVisitPhone');
        if (phone) phone.focus();
    }

    function closeTrackModal() {
        const modal = document.getElementById('trackVisitModal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
        const openBtn = e.target.closest('[data-track-visit]');
        if (openBtn) {
            e.preventDefault();
            openTrackModal();
            return;
        }
        if (e.target.closest('#closeTrackVisitModal')) {
            closeTrackModal();
            return;
        }
        const modal = document.getElementById('trackVisitModal');
        if (modal && e.target === modal) {
            closeTrackModal();
        }
    });

    document.addEventListener('submit', async (e) => {
        const form = e.target.closest('#trackVisitForm');
        if (!form) return;
        e.preventDefault();
        const phone = document.getElementById('trackVisitPhone').value.trim();
        const resultBox = document.getElementById('trackVisitResult');
        const submitButton = form.querySelector('button[type="submit"]');
        const original = submitButton.textContent;
        submitButton.textContent = 'Checking...';
        submitButton.disabled = true;
        resultBox.innerHTML = '';

        try {
            const response = await fetch('/api/visits/track?phone=' + encodeURIComponent(phone));
            const result = await response.json();
            if (!result.success) {
                resultBox.innerHTML = `<p class="track-empty">${result.message || 'Could not track visit'}</p>`;
                return;
            }
            if (!result.data.length) {
                resultBox.innerHTML = '<p class="track-empty">No visit request found for this number.</p>';
                return;
            }
            resultBox.innerHTML = result.data.map(visit => `
                <div class="track-card">
                    <div class="track-card-top">
                        <strong>${escapeHtml(visit.name)}</strong>
                        <span class="track-status track-status-${escapeHtml(visit.status)}">${escapeHtml(statusLabels[visit.status] || visit.status)}</span>
                    </div>
                    <p>${escapeHtml(serviceLabels[visit.service] || visit.service)}</p>
                    <p>${escapeHtml(visit.preferredDate)} · ${escapeHtml(timeLabels[visit.preferredTime] || visit.preferredTime)}</p>
                    <p>${escapeHtml(visit.address)}</p>
                    ${visit.adminNote ? `<p class="track-update">Update: ${escapeHtml(visit.adminNote)}</p>` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Error:', error);
            resultBox.innerHTML = '<p class="track-empty">Could not check status. Please try again.</p>';
        } finally {
            submitButton.textContent = original;
            submitButton.disabled = false;
        }
    });
})();

// ===== CONTACT FORM HANDLING =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const service = document.getElementById('service').value;
        const message = document.getElementById('message').value;
        
        // Show loading state
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        try {
            // Send data to backend
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    phone,
                    email,
                    service,
                    message
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                contactForm.reset();
                showNotification('Request saved. We will contact you soon.', 'success');
            } else {
                showNotification('Error submitting form: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error submitting form. Please try again or call us directly.', 'error');
        } finally {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
}

// ===== REVIEW SYSTEM =====
const reviewModal = document.getElementById('reviewModal');
const addReviewBtn = document.getElementById('addReviewBtn');
const closeModalBtn = document.getElementById('closeModal');
const reviewForm = document.getElementById('reviewForm');
const starRating = document.getElementById('starRating');
const ratingValue = document.getElementById('ratingValue');
const reviewsGrid = document.getElementById('reviewsGrid');
const reviewPhotosInput = document.getElementById('reviewPhotos');
const photoPreviewGrid = document.getElementById('photoPreviewGrid');
let selectedReviewPhotos = [];

function renderPhotoPreviews() {
    if (!photoPreviewGrid) return;
    photoPreviewGrid.innerHTML = '';
    selectedReviewPhotos.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'photo-preview-item';
        const img = document.createElement('img');
        img.alt = `Selected photo ${index + 1}`;
        img.src = URL.createObjectURL(file);
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', 'Remove photo');
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            selectedReviewPhotos.splice(index, 1);
            renderPhotoPreviews();
        });
        item.appendChild(img);
        item.appendChild(removeBtn);
        photoPreviewGrid.appendChild(item);
    });
}

if (reviewPhotosInput) {
    reviewPhotosInput.addEventListener('change', () => {
        const incoming = Array.from(reviewPhotosInput.files || []);
        const remaining = 4 - selectedReviewPhotos.length;
        if (incoming.length > remaining) {
            showNotification('You can add up to 4 photos', 'info');
        }
        selectedReviewPhotos = selectedReviewPhotos.concat(incoming.slice(0, Math.max(0, remaining)));
        reviewPhotosInput.value = '';
        renderPhotoPreviews();
    });
}

if (addReviewBtn && reviewModal) {
    addReviewBtn.addEventListener('click', () => {
        reviewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

if (closeModalBtn && reviewModal) {
    closeModalBtn.addEventListener('click', () => {
        reviewModal.classList.remove('active');
        document.body.style.overflow = '';
    });
}

if (reviewModal) {
    reviewModal.addEventListener('click', (e) => {
        if (e.target === reviewModal) {
            reviewModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (starRating && ratingValue) {
    starRating.addEventListener('click', (e) => {
        if (e.target.classList.contains('fa-star')) {
            const rating = parseInt(e.target.dataset.rating);
            ratingValue.value = rating;
            
            const stars = starRating.querySelectorAll('i');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.classList.remove('far');
                    star.classList.add('fas');
                } else {
                    star.classList.remove('fas');
                    star.classList.add('far');
                }
            });
        }
    });
}

if (reviewForm) {
reviewForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const reviewerName = document.getElementById('reviewerName').value;
    const reviewerEmail = document.getElementById('reviewerEmail').value;
    const reviewService = document.getElementById('reviewService').value;
    const rating = parseInt(ratingValue.value);
    const reviewText = document.getElementById('reviewText').value;
    
    // Validate rating
    if (rating === 0) {
        showNotification('Please select a rating', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = reviewForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('name', reviewerName);
        formData.append('email', reviewerEmail);
        formData.append('service', reviewService);
        formData.append('rating', rating);
        formData.append('review', reviewText);
        selectedReviewPhotos.forEach((file) => {
            formData.append('photos', file);
        });

        const response = await fetch('/api/reviews', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Reset form
            reviewForm.reset();
            ratingValue.value = '0';
            selectedReviewPhotos = [];
            renderPhotoPreviews();
            
            // Reset stars
            const stars = starRating.querySelectorAll('i');
            stars.forEach(star => {
                star.classList.remove('fas');
                star.classList.add('far');
            });
            
            // Close modal
            reviewModal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Show success message
            showNotification('Thank you for your review!', 'success');
            
            // Reload reviews
            loadReviews();
        } else {
            showNotification('Error submitting review: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error submitting review. Please try again.', 'error');
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});
}

// Load reviews from backend
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            displayReviews(result.data);
        } else {
            // Display sample reviews if no reviews in database
            displaySampleReviews();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        // Display sample reviews on error
        displaySampleReviews();
    }
}

// Display reviews in the grid
function displayReviews(reviews) {
    if (!reviewsGrid) return;
    reviewsGrid.innerHTML = '';
    
    reviews.forEach(review => {
        const reviewCard = createReviewCard(review);
        reviewsGrid.appendChild(reviewCard);
    });
}

// Create a review card element
function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    
    const stars = generateStars(review.rating);
    const initials = getInitials(review.name);
    const date = formatDate(review.createdAt);
    
    const serviceLabels = {
        'painting': 'Painting & Decorating',
        'plumbing': 'Plumbing',
        'tiling': 'Tiling & Flooring',
        'carpentry': 'Carpentry',
        'repairs': 'General Repairs',
        'cleaning': 'Deep Cleaning',
        'other': 'Other Services'
    };
    
    card.innerHTML = `
        <div class="review-header">
            <div class="reviewer-avatar">${initials}</div>
            <div class="reviewer-info">
                <h4>${review.name}</h4>
                <div class="review-date">${date}</div>
            </div>
        </div>
        <div class="review-rating">
            ${stars}
        </div>
        <div class="review-service">${serviceLabels[review.service] || review.service}</div>
        <div class="review-text">"${review.review}"</div>
        ${reviewPhotosHtml(review.photos)}
    `;
    
    return card;
}

function reviewPhotosHtml(photos) {
    if (!photos || !photos.length) return '';
    const images = photos.map((src) => {
        const safeSrc = String(src).replace(/"/g, '');
        return `<img src="${safeSrc}" alt="Review photo" onclick="openReviewPhoto('${safeSrc}')">`;
    }).join('');
    return `<div class="review-photos">${images}</div>`;
}

function openReviewPhoto(src) {
    let lightbox = document.getElementById('reviewPhotoLightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'reviewPhotoLightbox';
        lightbox.className = 'photo-lightbox';
        lightbox.innerHTML = '<img alt="Review photo enlarged">';
        lightbox.addEventListener('click', () => lightbox.classList.remove('active'));
        document.body.appendChild(lightbox);
    }
    lightbox.querySelector('img').src = src;
    lightbox.classList.add('active');
}

window.openReviewPhoto = openReviewPhoto;

// Generate star HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Get initials from name
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Display sample reviews (fallback)
function displaySampleReviews() {
    const sampleReviews = [
        {
            name: 'Sarah Thompson',
            rating: 5,
            service: 'painting',
            review: 'Absolutely fantastic work! Salah and his team transformed our living room with their painting services. Professional, punctual, and the finish was impeccable. Highly recommend!',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            name: 'Michael Roberts',
            rating: 5,
            service: 'plumbing',
            review: 'Had an emergency plumbing issue at 2 AM and they responded within 30 minutes. Fixed the problem quickly and at a reasonable price. True professionals!',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            name: 'Emma Wilson',
            rating: 4,
            service: 'tiling',
            review: 'Great tiling work in our bathroom. The team was skilled and cleaned up after themselves. Only minor delay in material delivery, but overall excellent service.',
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            name: 'David Chen',
            rating: 5,
            service: 'carpentry',
            review: 'Custom shelving and cabinet work exceeded our expectations. Attention to detail was amazing and the craftsmanship is top-notch. Will definitely use again.',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            name: 'Lisa Martinez',
            rating: 5,
            service: 'cleaning',
            review: 'Post-construction deep cleaning was thorough and efficient. They made our new home spotless before we moved in. Worth every penny!',
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            name: 'James Brown',
            rating: 5,
            service: 'repairs',
            review: 'Multiple general repairs around the house completed in one day. Fair pricing, honest assessment of what needed fixing, and quality workmanship.',
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    displayReviews(sampleReviews);
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
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
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for scroll animation
document.querySelectorAll('.service-card, .feature-item, .review-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    if (reviewsGrid) {
        loadReviews();
    }
});