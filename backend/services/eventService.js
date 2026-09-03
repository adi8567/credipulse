/**
 * Real-time event broadcasting via Server-Sent Events (SSE)
 */

let clients = [];

function addClient(res) {
  clients.push(res);
  res.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
}

function broadcastEvent(eventType, payload) {
  const data = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  clients.forEach(client => {
    try {
      client.write(`event: ${eventType}\ndata: ${data}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

module.exports = { addClient, broadcastEvent };
