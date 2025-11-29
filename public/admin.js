console.log("🔄 admin.js is loading...");

// Simple test function
function testSave() {
    console.log("💾 Save button clicked!");
    
    // Test if we can access localStorage
    try {
        const testData = { test: "Hello World", timestamp: new Date().toISOString() };
        localStorage.setItem('test_config', JSON.stringify(testData));
        console.log("✅ localStorage test passed");
        
        // Show success message
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            document.getElementById('propertyConfig').style.display = 'none';
            successMessage.style.display = 'block';
            console.log("✅ Success message shown");
        } else {
            console.log("❌ Success message element not found");
        }
    } catch (error) {
        console.error("❌ localStorage test failed:", error);
        alert("Error: " + error.message);
    }
}

// Set up the save button
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM Content Loaded");
    
    const submitBtn = document.getElementById('submitBtn');
    console.log("📝 Submit button found:", submitBtn);
    
    if (submitBtn) {
        submitBtn.addEventListener('click', testSave);
        console.log("✅ Event listener added to submit button");
    } else {
        console.log("❌ Submit button not found!");
    }
    
    // Also make the button visible for testing
    const submitBtnElement = document.getElementById('submitBtn');
    if (submitBtnElement) {
        submitBtnElement.style.display = 'block';
        console.log("✅ Submit button made visible");
    }
});

console.log("✅ admin.js loaded completely");
