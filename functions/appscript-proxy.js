// functions/appscript-proxy.js
const fetch = require('node-fetch');

// Define the required CORS headers for all responses
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", 
};

exports.handler = async (event, context) => {
    
    // *** SECURITY CHECK REMOVED: Function is now open to all domains ***

    // 1. Handle the CORS Preflight Request (HTTP OPTIONS)
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: "OK",
        };
    }
    
    // 2. Main POST Request Handler
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: CORS_HEADERS, 
            body: "Method Not Allowed",
        };
    }

    try {
        // Retrieve the Apps Script URL securely from environment variables
        const APPSCRIPT_URL = process.env.GOOGLE_APPSCRIPT_URL;

        if (!APPSCRIPT_URL) {
            console.error("GOOGLE_APPSCRIPT_URL environment variable is not set.");
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: { message: "Server configuration error: Apps Script URL missing." } }),
            };
        }

        // Parse the raw JSON body sent from the frontend
        const formDataObj = JSON.parse(event.body); 
        
        // RE-ENCODE for Google Apps Script's expected format (data=...)
        const appsScriptBody = 'data=' + encodeURIComponent(JSON.stringify(formDataObj));
        
        // Forward the request to Google Apps Script
        const appsScriptResponse = await fetch(APPSCRIPT_URL, {
            method: 'POST',
            headers: {
                // Apps Script expects this content type when receiving the data=... string
                'Content-Type': 'application/x-www-form-urlencoded', 
            },
            body: appsScriptBody, 
        });

        const appsScriptData = await appsScriptResponse.json();

        // 3. Return the Final Result with CORS Headers
        if (!appsScriptResponse.ok) {
            return {
                statusCode: appsScriptResponse.status,
                headers: CORS_HEADERS, 
                body: JSON.stringify(appsScriptData),
            };
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(appsScriptData),
        };

    } catch (error) {
        console.error("Apps Script Function error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: { message: `Internal Apps Script proxy error: ${error.message}` } }),
        };
    }
};
