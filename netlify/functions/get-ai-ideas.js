// File: netlify/functions/get-ai-ideas.js

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { challenge } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            console.error("Gemini API Key not found in environment variables.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server configuration error: API key missing." })
            };
        }

        if (!challenge) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Business challenge text is required." })
            };
        }

        const prompt = `A business owner is facing the following challenge: "${challenge}". 
        Suggest 2-3 practical and concise automation solutions or ideas that Automating DNA could help them implement to solve this. 
        For each suggestion, provide a "title" and a one-sentence "description".`;
        
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "suggestions": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "title": { "type": "STRING" },
                                    "description": { "type": "STRING" }
                                },
                                required: ["title", "description"]
                            }
                        }
                    },
                    required: ["suggestions"]
                }
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error in Function:', errorData);
            return {
                statusCode: response.status, // Forward the status from Google
                body: JSON.stringify({ error: `Gemini API request failed: ${errorData.error?.message || 'Unknown API error'}` })
            };
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0].content.parts[0].text) {
             const suggestionsJson = JSON.parse(result.candidates[0].content.parts[0].text);
             return {
                 statusCode: 200,
                 body: JSON.stringify(suggestionsJson) 
             };
        } else {
            console.error('Unexpected Gemini API response structure in function:', result);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Could not parse suggestions from AI." })
            };
        }

    } catch (error) {
        console.error('Error in Netlify function:', error);
        // Ensure a JSON response even for unexpected errors
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Function error: ${error.message || "An unexpected error occurred in the function."}` })
        };
    }
};