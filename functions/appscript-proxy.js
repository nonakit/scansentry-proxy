// functions/appscript-proxy.js
const fetch = require('node-fetch');

// Define ALL authorized domains (origins) to prevent quota abuse.
const AUTHORIZED_ORIGINS = [
    "https://nonakit.github.io", 
    "https://tislamkanon.github.io2", 
    "http://127.0.0.1:5501", 
    "http://localhost:5501" 
];

// Define the required CORS headers for all responses
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", 
};

exports.handler = async (event, context) => {
    
    // *** SECURITY CHECK: BLOCK UNAUTHORIZED ORIGINS ***
    const origin = event.headers.origin;

    if (origin && !AUTHORIZED_ORIGINS.includes(origin)) {
        console.warn(`Access Denied: Request blocked from unauthorized origin: ${origin}`);
        return {
            statusCode: 403,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: { message: "Access Denied: Unauthorized Origin" } }),
        };
    }
    // *** END SECURITY CHECK ***

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

        // The request body from your frontend
        const requestBody = event.body; // Apps Script often handles simple text/JSON, keep it raw
        
        // Forward the request to Google Apps Script
        const appsScriptResponse = await fetch(APPSCRIPT_URL, {
            method: 'POST',
            // IMPORTANT: Apps Script might not need the Content-Type header explicitly here, 
            // but including it is safe for JSON payloads.
            headers: {
                'Content-Type': 'application/json',
            },
            body: requestBody, // Forward the raw body
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
            headers: CORS_HEADERS, // CORS header for successful response
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
