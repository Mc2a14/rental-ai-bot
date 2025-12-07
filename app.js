// ============ USER & PROPERTY MANAGEMENT API ============
const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

// CREATE THE EXPRESS APP HERE (THIS WAS MISSING!)
const app = express();

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const PROPERTIES_FILE = path.join(__dirname, 'data', 'properties.json');

// Add middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize files
function initDataFiles() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    
    if (!fs.existsSync(PROPERTIES_FILE)) {
        fs.writeFileSync(PROPERTIES_FILE, JSON.stringify({}));
    }
}

initDataFiles();

// User login
app.post('/api/user/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    username: user.username,
                    created: user.created
                }
            });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// User registration
app.post('/api/user/register', (req, res) => {
    try {
        const { username, password } = req.body;
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        
        // Check if user exists
        if (users.some(u => u.username === username)) {
            return res.json({ success: false, message: 'Username already exists' });
        }
        
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username,
            password,
            created: new Date().toISOString(),
            role: 'host'
        };
        
        users.push(newUser);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        
        res.json({ 
            success: true, 
            user: {
                id: newUser.id,
                username: newUser.username,
                created: newUser.created
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Save property (host only)
app.post('/api/property/save', (req, res) => {
    try {
        const { userId, propertyData } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }
        
        const properties = JSON.parse(fs.readFileSync(PROPERTIES_FILE, 'utf8'));
        
        // Generate unique property ID
        const propertyId = 'property_' + Date.now();
        
        // Store property with user association
        const property = {
            id: propertyId,
            userId: userId,
            ...propertyData,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        // Save to properties file
        properties[propertyId] = property;
        fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(properties, null, 2));
        
        // Also update propertyConfig.json for backward compatibility
        const configPath = path.join(__dirname, 'data', 'propertyConfig.json');
        fs.writeFileSync(configPath, JSON.stringify(propertyData, null, 2));
        
        // Update recommendations and appliances files
        if (propertyData.recommendations) {
            const recPath = path.join(__dirname, 'data', 'recommendations.json');
            fs.writeFileSync(recPath, JSON.stringify(propertyData.recommendations, null, 2));
        }
        
        if (propertyData.appliances) {
            const appPath = path.join(__dirname, 'data', 'appliances.json');
            fs.writeFileSync(appPath, JSON.stringify(propertyData.appliances, null, 2));
        }
        
        res.json({ 
            success: true, 
            propertyId: propertyId,
            guestLink: `/property/${propertyId}`
        });
        
    } catch (error) {
        console.error('Save property error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get property for guests (no authentication required)
app.get('/api/property/:propertyId', (req, res) => {
    try {
        const { propertyId } = req.params;
        const properties = JSON.parse(fs.readFileSync(PROPERTIES_FILE, 'utf8'));
        
        const property = properties[propertyId];
        
        if (property) {
            res.json({ 
                success: true, 
                property: property 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Property not found' 
            });
        }
    } catch (error) {
        console.error('Get property error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user's properties
app.get('/api/user/:userId/properties', (req, res) => {
    try {
        const { userId } = req.params;
        const properties = JSON.parse(fs.readFileSync(PROPERTIES_FILE, 'utf8'));
        
        const userProperties = Object.values(properties).filter(p => p.userId === userId);
        
        res.json({ 
            success: true, 
            properties: userProperties 
        });
    } catch (error) {
        console.error('Get user properties error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Guest property page
app.get('/property/:propertyId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Make property config endpoints also work with propertyId
app.get('/api/property-config/:propertyId', (req, res) => {
    try {
        const { propertyId } = req.params;
        const properties = JSON.parse(fs.readFileSync(PROPERTIES_FILE, 'utf8'));
        
        const property = properties[propertyId];
        
        if (property) {
            // Remove sensitive data for guest view
            const { userId, ...guestData } = property;
            res.json(guestData);
        } else {
            res.json({});
        }
    } catch (error) {
        console.error('Property config error:', error);
        res.json({});
    }
});

// ADD THIS AT THE VERY END OF THE FILE:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
