// functions/appscript-proxy.js
const fetch = require('node-fetch');

// Enhanced CORS headers
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
};

exports.handler = async (event, context) => {
    
    console.log('Received request:', {
        method: event.httpMethod,
        origin: event.headers.origin || 'no-origin',
        path: event.path
    });

    // 1. Handle CORS Preflight (OPTIONS)
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: CORS_HEADERS,
            body: "",
        };
    }
    
    // 2. Only allow POST for actual submission
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: CORS_HEADERS, 
            body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
        };
    }

    try {
        // Get Apps Script URL from environment
        const APPSCRIPT_URL = process.env.GOOGLE_APPSCRIPT_URL;

        if (!APPSCRIPT_URL) {
            console.error("GOOGLE_APPSCRIPT_URL environment variable is not set.");
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    success: false,
                    error: "Server configuration error: Apps Script URL missing." 
                }),
            };
        }

        // Parse request body
        let formDataObj;
        try {
            formDataObj = JSON.parse(event.body);
        } catch (parseError) {
            console.error("Failed to parse request body:", parseError);
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    success: false,
                    error: "Invalid JSON in request body" 
                }),
            };
        }
        
        console.log('Data size:', event.body.length, 'bytes');
        
        // Encode for Google Apps Script
        const appsScriptBody = 'data=' + encodeURIComponent(JSON.stringify(formDataObj));
        
        console.log('Forwarding to Apps Script...');
        
        // Forward to Google Apps Script
        const appsScriptResponse = await fetch(APPSCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', 
            },
            body: appsScriptBody,
            timeout: 30000, // 30 second timeout
        });

        const responseText = await appsScriptResponse.text();
        let appsScriptData;
        
        try {
            appsScriptData = JSON.parse(responseText);
        } catch (e) {
            console.error('Apps Script returned non-JSON:', responseText);
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({ 
                    success: false,
                    error: "Invalid response from Apps Script",
                    details: responseText.substring(0, 200)
                }),
            };
        }

        console.log('Apps Script response:', appsScriptData);

        // Return success/failure from Apps Script
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(appsScriptData),
        };

    } catch (error) {
        console.error("Function error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ 
                success: false,
                error: `Proxy error: ${error.message}`,
                stack: error.stack
            }),
        };
    }
};
