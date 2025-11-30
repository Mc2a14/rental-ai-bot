class MainApp {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
    }

    bindEvents() {
        const loadDataBtn = document.getElementById('loadData');
        if (loadDataBtn) {
            loadDataBtn.addEventListener('click', () => this.fetchData());
        }
    }

    async fetchData() {
        const dataContainer = document.getElementById('dataContainer');
        
        try {
            dataContainer.innerHTML = '<div class="loading">Loading data...</div>';
            
            const response = await fetch('/api/data');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayData(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            dataContainer.innerHTML = `
                <div class="error">
                    <p>Failed to load data: ${error.message}</p>
                    <button onclick="location.reload()" class="btn">Retry</button>
                </div>
            `;
        }
    }

    displayData(data) {
        const dataContainer = document.getElementById('dataContainer');
        
        let html = `
            <div class="success-message">
                <p>${data.message}</p>
            </div>
            <div class="data-grid">
        `;
        
        data.data.forEach(item => {
            html += `
                <div class="data-item">
                    <h4>${item.name}</h4>
                    <p>ID: ${item.id}</p>
                    <p>Value: ${item.value}</p>
                </div>
            `;
        });
        
        html += '</div>';
        dataContainer.innerHTML = html;
    }

    loadInitialData() {
        // Check if we're on a page that needs initial data
        if (document.getElementById('dataContainer')) {
            // Optional: Load some data automatically
            // this.fetchData();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MainApp();
});

// Utility functions
const Utils = {
    formatDate: (date) => {
        return new Date(date).toLocaleString();
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
