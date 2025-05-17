document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Add form submission handler
    const activityForm = document.getElementById('activity-form');
    if (activityForm) {
        activityForm.addEventListener('submit', function(event) {
            // Form will submit normally to the backend
            const activityInput = document.getElementById('activity-input');
            if (!activityInput.value.trim()) {
                event.preventDefault();
                showAlert('Please enter an activity', 'danger');
            }
        });
    }

    // Add refresh button handler
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            loadActivities();
        });
    }

    // Load activities when the page loads
    loadActivities();

    // Setup auto-dismiss for alerts
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert-dismissible');
        alerts.forEach(function(alert) {
            if (bootstrap.Alert) {
                new bootstrap.Alert(alert).close();
            }
        });
    }, 5000);
});

/**
 * Load activities from the server and display them
 */
function loadActivities() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Show loading spinner
    activityList.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    fetch('/get_activities')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.activities && data.activities.length) {
                displayActivities(data.activities);
            } else {
                activityList.innerHTML = '<div class="alert alert-info">No activities found. Start by adding one!</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching activities:', error);
            activityList.innerHTML = `<div class="alert alert-danger">Error loading activities: ${error.message}</div>`;
        });
}

/**
 * Display activities in the activity list
 * @param {Array} activities - Array of activity objects
 */
function displayActivities(activities) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Create table
    let html = `
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Activity</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows in reverse order (newest first)
    activities.slice().reverse().forEach(activity => {
        html += `
            <tr>
                <td>${escapeHtml(activity.date)}</td>
                <td>${escapeHtml(activity.time)}</td>
                <td>${escapeHtml(activity.activity)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    activityList.innerHTML = html;
}

/**
 * Show an alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger, etc.)
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (bootstrap.Alert) {
            new bootstrap.Alert(alertDiv).close();
        }
    }, 5000);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Escaped string
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}