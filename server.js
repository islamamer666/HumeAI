const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuration
const PORT = process.env.PORT || 3000;
const HUME_API_KEY = process.env.HUME_API_KEY || 'yI04LhYYTNoSiBnZlmn6adtQkExXfyvxmWbKJvh9KGDK4iYa';
const WS_URL = 'wss://api.hume.ai/v0/stream/models';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Hume AI Emotion Analysis Service',
    status: 'running',
    version: '1.0.0',
    usage: {
      method: 'POST',
      path: '/analyze',
      body: {
        message: 'Text to analyze (required)',
        request_id: 'Your custom ID for tracking (optional)',
        granularity: 'word | sentence | passage (optional, default: word)'
      }
    },
    example: 'POST /analyze with body: {"message": "I love this!"}'
  });
});

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main analyze endpoint - returns results directly
app.post('/analyze', async (req, res) => {
  const { message, request_id, granularity = 'word' } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid "message" field. Please provide text to analyze.'
    });
  }

  const requestId = request_id || `req_${Date.now()}`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${new Date().toISOString()}] New analysis request`);
  console.log(`Request ID: ${requestId}`);
  console.log(`Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
  console.log(`${'='.repeat(60)}`);

  try {
    const result = await analyzeWithHumeAI(message, requestId, granularity);
    console.log(`[${requestId}] ✅ Analysis complete - returning results`);
    res.json(result);
  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error.message);
    res.status(500).json({
      success: false,
      request_id: requestId,
      error: error.message
    });
  }
});

// Analyze text with Hume AI via WebSocket
function analyzeWithHumeAI(message, requestId, granularity) {
  return new Promise((resolve, reject) => {
    console.log(`[${requestId}] 🔌 Connecting to Hume AI WebSocket...`);

    const ws = new WebSocket(WS_URL, {
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY
      }
    });

    let timeoutId;
    const TIMEOUT_MS = 30000; // 30 second timeout

    // Set timeout
    timeoutId = setTimeout(() => {
      console.log(`[${requestId}] ⏰ Timeout - closing connection`);
      ws.close();
      reject(new Error('Analysis timeout - no response from Hume AI within 30 seconds'));
    }, TIMEOUT_MS);

    ws.on('open', () => {
      console.log(`[${requestId}] ✅ Connected to Hume AI`);

      const payload = {
        data: message,
        models: {
          language: {
            granularity: granularity
          }
        },
        raw_text: true,
        job_details: true,
        payload_id: requestId
      };

      console.log(`[${requestId}] 📤 Sending message for analysis...`);
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', (data) => {
      clearTimeout(timeoutId);

      try {
        const response = JSON.parse(data.toString());
        console.log(`[${requestId}] 📥 Received response from Hume AI`);

        // Check for errors in response
        if (response.error) {
          ws.close();
          reject(new Error(`Hume AI error: ${response.error}`));
          return;
        }

        // Format the results
        const result = formatResults(response, message, requestId);
        
        ws.close();
        resolve(result);

      } catch (error) {
        ws.close();
        reject(new Error(`Failed to parse Hume AI response: ${error.message}`));
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeoutId);
      console.error(`[${requestId}] ❌ WebSocket error:`, error.message);
      
      if (error.message.includes('401')) {
        reject(new Error('Authentication failed - check your Hume AI API key'));
      } else {
        reject(new Error(`WebSocket error: ${error.message}`));
      }
    });

    ws.on('close', (code, reason) => {
      clearTimeout(timeoutId);
      console.log(`[${requestId}] 🔌 WebSocket closed (code: ${code})`);
    });
  });
}

// Format Hume AI results into a clean structure
function formatResults(response, originalText, requestId) {
  const result = {
    success: true,
    request_id: requestId,
    original_text: originalText,
    job_id: response.job_details?.job_id || null,
    timestamp: new Date().toISOString(),
    word_count: 0,
    analysis: [],
    summary: {
      dominant_emotion: null,
      dominant_score: 0
    }
  };

  if (response.language && response.language.predictions) {
    const predictions = response.language.predictions;
    result.word_count = predictions.length;

    let maxScore = 0;
    let dominantEmotion = null;

    predictions.forEach(pred => {
      // Sort emotions by score
      const sortedEmotions = [...(pred.emotions || [])]
        .sort((a, b) => b.score - a.score);
      
      const topEmotions = sortedEmotions.slice(0, 5).map(e => ({
        emotion: e.name,
        score: e.score,
        percentage: Math.round(e.score * 10000) / 100
      }));

      // Track overall dominant emotion
      if (sortedEmotions.length > 0 && sortedEmotions[0].score > maxScore) {
        maxScore = sortedEmotions[0].score;
        dominantEmotion = sortedEmotions[0].name;
      }

      result.analysis.push({
        text: pred.text,
        position: {
          start: pred.position?.begin || 0,
          end: pred.position?.end || 0
        },
        primary_emotion: topEmotions[0]?.emotion || null,
        primary_score: topEmotions[0]?.percentage || 0,
        top_emotions: topEmotions
      });
    });

    result.summary.dominant_emotion = dominantEmotion;
    result.summary.dominant_score = Math.round(maxScore * 10000) / 100;
  }

  return result;
}

// Start server
app.listen(PORT, () => {
  console.log(`
${'='.repeat(60)}
🚀 Hume AI Emotion Analysis Service
${'='.repeat(60)}

Server running on port ${PORT}

Endpoints:
  GET  /          - Service info
  GET  /health    - Health check
  POST /analyze   - Analyze text and return emotions

Configuration:
  HUME_API_KEY: ${HUME_API_KEY ? '✅ Set' : '❌ Not set'}

Example:
  curl -X POST http://localhost:${PORT}/analyze \\
    -H "Content-Type: application/json" \\
    -d '{"message": "I love this product!"}'

${'='.repeat(60)}
`);
});
