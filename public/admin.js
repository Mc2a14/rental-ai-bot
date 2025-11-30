class AdminPanel {
    constructor() {
        this.serverStartTime = Date.now();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSystemStatus();
        this.updateServerInfo();
        
        // Update uptime every second
        setInterval(() => this.updateServerInfo(), 1000);
    }

    bindEvents() {
        document.getElementById('refreshStatus')?.addEventListener('click', () => {
            this.loadSystemStatus();
        });

        document.getElementById('loadAllData')?.addEventListener('click', () => {
            this.loadAllData();
        });

        document.getElementById('clearData')?.addEventListener('click', () => {
            this.clearData();
        });

        document.getElementById('testAPI')?.addEventListener('click', () => {
            this.testAPIConnection();
        });

        document.getElementById('viewLogs')?.addEventListener('click', () => {
            this.viewLogs();
        });
    }

    async loadSystemStatus() {
        const statusElement = document.getElementById('systemStatus');
        
        try {
            statusElement.className = 'status-loading';
            statusElement.textContent = 'Checking system status...';
            
            const response = await fetch('/api/health');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            statusElement.className = 'status-success';
            statusElement.innerHTML = `
                <strong>Status:</strong> ${data.status}<br>
                <strong>Environment:</strong> ${data.environment}<br>
                <strong>Last Check:</strong> ${new Date(data.timestamp).toLocaleTimeString()}
            `;
        } catch (error) {
            console.error('Error checking system status:', error);
            statusElement.className = 'status-error';
            statusElement.innerHTML = `
                <strong>Status:</strong> Error<br>
                <strong>Message:</strong> ${error.message}
            `;
        }
    }

    updateServerInfo() {
        const portElement = document.getElementById('serverPort');
        const envElement = document.getElementById('serverEnv');
        const uptimeElement = document.getElementById('serverUptime');
        
        if (portElement) portElement.textContent = window.location.port || '3000';
        if (envElement) envElement.textContent = process.env.NODE_ENV || 'development';
        
        if (uptimeElement) {
            const uptime = Date.now() - this.serverStartTime;
            uptimeElement.textContent = this.formatUptime(uptime);
        }
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }

    async loadAllData() {
        const container = document.getElementById('adminDataContainer');
        
        try {
            container.innerHTML = '<div class="loading">Loading comprehensive data...</div>';
            
            const [healthResponse, dataResponse] = await Promise.all([
                fetch('/api/health'),
                fetch('/api/data')
            ]);
            
            if (!healthResponse.ok || !dataResponse.ok) {
                throw new Error('One or more API requests failed');
            }
            
            const [healthData, appData] = await Promise.all([
                healthResponse.json(),
                dataResponse.json()
            ]);
            
            this.displayAdminData(healthData, appData);
        } catch (error) {
            console.error('Error loading all data:', error);
            container.innerHTML = `
                <div class="error">
                    <p>Failed to load data: ${error.message}</p>
                </div>
            `;
        }
    }

    displayAdminData(healthData, appData) {
        const container = document.getElementById('adminDataContainer');
        
        let html = `
            <div class="admin-data-section">
                <h4>Health Status</h4>
                <pre>${JSON.stringify(healthData, null, 2)}</pre>
            </div>
            <div class="admin-data-section">
                <h4>Application Data</h4>
                <pre>${JSON.stringify(appData, null, 2)}</pre>
            </div>
        `;
        
        container.innerHTML = html;
    }

    clearData() {
        const container = document.getElementById('adminDataContainer');
        if (container) {
            container.innerHTML = '<p>Data cleared. Click "Load All Data" to refresh.</p>';
        }
    }

    async testAPIConnection() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            alert(`API Connection Successful!\nStatus: ${data.status}\nEnvironment: ${data.environment}`);
        } catch (error) {
            alert(`API Connection Failed: ${error.message}`);
        }
    }

    viewLogs() {
        alert('Server logs would be displayed here in a real application.\n\nThis feature would typically connect to a logging service or database to retrieve application logs.');
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
