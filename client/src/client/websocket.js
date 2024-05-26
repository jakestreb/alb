const BASE_URL = 'ws://localhost:8000';

export function openConnection() {
  const chatSocket = new WebSocket(`${BASE_URL}/ws/chat/`);

  chatSocket.onopen = function() {
    console.log('WebSocket connection established.');
    const message = {
      'message': 'Hello, world!'
    };
    chatSocket.send(JSON.stringify(message));
  };

  chatSocket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);
  };
}
