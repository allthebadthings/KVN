// Vanguard WebSocket Client
// Real-time communication with ESP32-P4 Hub

class VanguardWebSocket {
    constructor(url = 'ws://192.168.1.100/ws') {
        this.url = url;
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
        this.connectionCallbacks = [];

        // Message types
        this.MESSAGE_TYPES = {
            SENSOR_UPDATE: 'sensor_update',
            SYSTEM_STATUS: 'system_status',
            AI_INSIGHT: 'ai_insight',
            NODE_STATUS: 'node_status',
            CONTROL_RESPONSE: 'control_response',
            ERROR: 'error'
        };
    }

    // Connect to WebSocket server
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            console.log(`🔌 Connecting to Vanguard Hub: ${this.url}`);
            this.ws = new WebSocket(this.url);

            this.ws.onopen = (event) => this.handleOpen(event);
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = (event) => this.handleClose(event);
            this.ws.onerror = (event) => this.handleError(event);

        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    // Handle connection opened
    handleOpen(event) {
        console.log('🟢 WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Notify connection callbacks
        this.connectionCallbacks.forEach(callback => callback(true));

        // Request initial system state
        this.send({
            type: 'request_state',
            timestamp: Date.now()
        });

        // Send heartbeat
        this.startHeartbeat();
    }

    // Handle incoming message
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 Received message:', data);

            // Route message to appropriate handler
            if (data.type && this.messageHandlers.has(data.type)) {
                const handlers = this.messageHandlers.get(data.type);
                handlers.forEach(handler => handler(data));
            } else {
                console.warn('Unknown message type:', data.type);
            }

        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    // Handle connection closed
    handleClose(event) {
        console.log('🔴 WebSocket connection closed:', event.code, event.reason);
        this.isConnected = false;

        // Notify connection callbacks
        this.connectionCallbacks.forEach(callback => callback(false));

        // Stop heartbeat
        this.stopHeartbeat();

        // Schedule reconnection
        this.scheduleReconnect();
    }

    // Handle connection error
    handleError(event) {
        console.error('❌ WebSocket error:', event);
        this.isConnected = false;

        // Notify connection callbacks
        this.connectionCallbacks.forEach(callback => callback(false));
    }

    // Send message to server
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify(data);
            console.log('📤 Sending message:', data);
            this.ws.send(message);
            return true;
        } else {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }
    }

    // Register message handler
    on(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        this.messageHandlers.get(messageType).push(handler);
    }

    // Remove message handler
    off(messageType, handler) {
        if (this.messageHandlers.has(messageType)) {
            const handlers = this.messageHandlers.get(messageType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // Register connection callback
    onConnection(callback) {
        this.connectionCallbacks.push(callback);
    }

    // Send control command
    sendControl(room, device, value) {
        return this.send({
            type: 'control',
            room: room,
            device: device,
            value: value,
            timestamp: Date.now()
        });
    }

    // Send mode activation
    sendMode(mode) {
        return this.send({
            type: 'mode',
            mode: mode,
            timestamp: Date.now()
        });
    }

    // Send heartbeat
    sendHeartbeat() {
        return this.send({
            type: 'heartbeat',
            timestamp: Date.now()
        });
    }

    // Start heartbeat interval
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendHeartbeat();
            }
        }, 30000); // Every 30 seconds
    }

    // Stop heartbeat interval
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Schedule reconnection
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    // Disconnect gracefully
    disconnect() {
        console.log('👋 Disconnecting WebSocket');

        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }

        this.isConnected = false;
        this.reconnectAttempts = 0;
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.isConnected,
            readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
            url: this.url,
            attempts: this.reconnectAttempts
        };
    }
}

// Create global WebSocket instance
const vanguardWS = new VanguardWebSocket();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VanguardWebSocket, vanguardWS };
} else {
    window.VanguardWebSocket = VanguardWebSocket;
    window.vanguardWS = vanguardWS;
}

// Auto-connect when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Vanguard WebSocket client initialized');
    if (window.VANGUARD_DEMO) {
        console.log('🧪 Demo mode enabled: skipping WebSocket connection');
        if (window.updateConnectionStatus) {
            window.updateConnectionStatus(true);
        }
        return;
    }

    // Set up message handlers for dashboard
    if (window.vanguardWS) {
        // Sensor update handler
        vanguardWS.on('sensor_update', (data) => {
            console.log('Sensor update received:', data);
            // This would update the dashboard state
            if (window.updateRoomData) {
                window.updateRoomData(data);
            }
        });

        // System status handler
        vanguardWS.on('system_status', (data) => {
            console.log('System status update:', data);
            if (window.updateSystemStatus) {
                window.updateSystemStatus(data);
            }
        });

        // AI insight handler
        vanguardWS.on('ai_insight', (data) => {
            console.log('AI insight received:', data);
            if (window.addAIInsight) {
                window.addAIInsight(data);
            }
        });

        // Connection status handler
        vanguardWS.onConnection((connected) => {
            console.log('Connection status changed:', connected);
            if (window.updateConnectionStatus) {
                window.updateConnectionStatus(connected);
            }
        });

        // Connect to hub
        vanguardWS.connect();
    }
});
