// File: netlify/functions/generate-email-draft.js

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { targetAudience, mainBenefit, callToAction } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY; // Access the API key

        if (!apiKey) {
            console.error("Gemini API Key not found in environment variables for email draft.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server configuration error: API key missing for email draft." })
            };
        }

        if (!targetAudience || !mainBenefit || !callToAction) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Target audience, main benefit, and call to action are required." })
            };
        }

        const prompt = `Draft a concise, friendly, and professional outreach email under 100 words.
        The email is for: "<span class="math-inline">\{targetAudience\}"\.