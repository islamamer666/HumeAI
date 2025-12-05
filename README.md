# Hume AI WebSocket Streaming API - Node.js Example

This Node.js script demonstrates how to connect to the [Hume AI Expression Measurement API](https://dev.hume.ai/reference/expression-measurement-api/stream/models) using WebSocket streaming to analyze emotional content in text.

## Features

- Connects to Hume AI's WebSocket streaming endpoint
- Sends text messages for emotional analysis
- Analyzes emotions, sentiment, and toxicity in text
- Displays results in a readable format

## Prerequisites

- Node.js (v14 or higher)
- A Hume AI API key ([Get one here](https://platform.hume.ai/))

## Installation

1. Install dependencies:

```bash
npm install
```

## Configuration

Set your Hume AI API key as an environment variable:

### On Linux/macOS:

```bash
export HUME_API_KEY="your-actual-api-key"
```

### On Windows (PowerShell):

```powershell
$env:HUME_API_KEY="your-actual-api-key"
```

### On Windows (Command Prompt):

```cmd
set HUME_API_KEY=your-actual-api-key
```

Alternatively, you can edit `stream-hume.js` and replace `'your-api-key-here'` with your actual API key (line 4).

## Usage

Run the script:

```bash
npm start
```

Or directly with Node:

```bash
node stream-hume.js
```

## How It Works

1. The script connects to `wss://api.hume.ai/v0/stream/models`
2. Sends the message "how are you" with the `language` model enabled
3. Receives emotional analysis results including:
   - **Emotions**: Detailed emotion scores for each word/phrase
   - **Sentiment**: Positive/negative sentiment scores
   - **Toxicity**: Toxicity levels
4. Displays the top 5 emotions detected along with their confidence scores

## Customization

### Analyzing Different Text

Edit the `data` field in the message object (around line 28):

```javascript
const message = {
  data: 'Your custom text here',
  // ...
};
```

### Enable Additional Models

You can enable other models like `prosody`, `face`, `burst`, etc.:

```javascript
const message = {
  data: 'your text',
  models: {
    language: {
      granularity: 'word',
      sentiment: {},
      toxicity: {}
    },
    prosody: {} // Add for audio prosody analysis
  },
  // ...
};
```

### Change Granularity

Adjust how text is analyzed:
- `'word'` - Analyze each word separately
- `'sentence'` - Analyze by sentence
- `'passage'` - Analyze entire passage

```javascript
language: {
  granularity: 'sentence' // or 'word', 'passage'
}
```

## API Reference

For full API documentation, visit:
- [Hume AI Stream Models API](https://dev.hume.ai/reference/expression-measurement-api/stream/models)
- [Hume AI Documentation](https://dev.hume.ai/docs)

## Example Output

```
Connected to Hume AI!

Sending message: {...}

Text being analyzed: "how are you"

EMOTION ANALYSIS RESULTS:
================================================================================

Word/Phrase #1: "how"
Position: 0 - 3

Top Emotions:
  Interest: 45.23%
  Curiosity: 38.67%
  Confusion: 12.45%
  Concentration: 8.91%
  Contemplation: 7.23%

--------------------------------------------------------------------------------

Word/Phrase #2: "are"
Position: 4 - 7

Top Emotions:
  Neutral: 52.34%
  Calmness: 15.67%
  ...

Analysis complete. Closing connection...
```

## Troubleshooting

### Authentication Error (401)
- Verify your API key is correct
- Make sure the key is properly set as an environment variable

### Connection Issues
- Check your internet connection
- Verify the WebSocket URL is correct
- Ensure you're not behind a firewall blocking WebSocket connections

### Module Not Found
- Run `npm install` to install dependencies

## License

MIT


