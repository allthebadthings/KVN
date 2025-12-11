// Vanguard Mission Control Dashboard
// Petite Vue.js Application Logic

const { createApp, reactive } = PetiteVue;

// Dashboard State
const state = reactive({
    demoMode: true,

    // Connection
    isConnected: false,
    connectionStatus: 'Disconnected',

    // System Status
    nodesOnline: 0,
    alertLevel: 'normal',
    alertText: 'System Normal',
    currentTime: '',

    // Rooms Data
    rooms: [
        {
            id: 'living_room',
            name: 'Living Room',
            occupancy: 2,
            temperature: 72.5,
            humidity: 45,
            co2: 420,
            lightLevel: 60,
            isOnline: true,
            hasAlert: false,
            cameraUrl: 'http://192.168.1.100:8080/stream/living_room'
        },
        {
            id: 'master_bedroom',
            name: 'Master Bedroom',
            occupancy: 1,
            temperature: 68.2,
            humidity: 42,
            co2: 380,
            lightLevel: 0,
            isOnline: true,
            hasAlert: false,
            cameraUrl: 'http://192.168.1.100:8080/stream/master_bedroom'
        },
        {
            id: 'kitchen',
            name: 'Kitchen',
            occupancy: 0,
            temperature: 74.1,
            humidity: 48,
            co2: 450,
            lightLevel: 80,
            isOnline: true,
            hasAlert: true,
            cameraUrl: 'http://192.168.1.100:8080/stream/kitchen'
        },
        {
            id: 'office',
            name: 'Office',
            occupancy: 1,
            temperature: 71.8,
            humidity: 43,
            co2: 395,
            lightLevel: 75,
            isOnline: true,
            hasAlert: false,
            cameraUrl: 'http://192.168.1.100:8080/stream/office'
        },
        {
            id: 'hallway',
            name: 'Hallway',
            occupancy: 0,
            temperature: 70.5,
            humidity: 41,
            co2: 360,
            lightLevel: 30,
            isOnline: true,
            hasAlert: false,
            cameraUrl: 'http://192.168.1.100:8080/stream/hallway'
        },
        {
            id: 'bathroom',
            name: 'Bathroom',
            occupancy: 0,
            temperature: 69.8,
            humidity: 55,
            co2: 340,
            lightLevel: 0,
            isOnline: false,
            hasAlert: false,
            cameraUrl: 'http://192.168.1.100:8080/stream/bathroom'
        }
    ],

    // AI Insights
    aiInsights: [
        {
            id: 1,
            text: 'Master Bedroom is 4°F warmer than Hallway. Suggest opening window.',
            timestamp: Date.now()
        },
        {
            id: 2,
            text: 'Living Room has had 0 activity for 2 hours. Lights still on.',
            timestamp: Date.now() - 300000
        },
        {
            id: 3,
            text: 'Kitchen CO₂ levels elevated. Consider increasing ventilation.',
            timestamp: Date.now() - 600000
        }
    ],

    // UI State
    sidebarCollapsed: false,
    cameraModalOpen: false,
    selectedCameraRoom: '',
    cameraStreamUrl: '',
    isRecording: false,

    // WebSocket
    ws: null,
    reconnectInterval: null
});

// Derived helpers (no computed): kept simple for PetiteVue
// connectionStatus and alertLevel are already in state and used directly

// Methods
const methods = {
    // Initialize dashboard
    init() {
        console.log('🚀 Vanguard Mission Control initializing...');
        if (state.demoMode) {
            state.isConnected = true;
            state.connectionStatus = 'Demo Mode';
        }
        this.generateDummyRooms();
        state.nodesOnline = state.rooms.filter(r => r.isOnline).length;
        this.updateTime();
        if (!state.demoMode) {
            this.connectWebSocket();
        }
        this.startDataSimulation();

        // Update time every second
        setInterval(() => this.updateTime(), 1000);

        // Auto-reconnect WebSocket
        state.reconnectInterval = setInterval(() => {
            if (!state.isConnected) {
                this.connectWebSocket();
            }
        }, 5000);
    },

    // Update current time
    updateTime() {
        const now = new Date();
        state.currentTime = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    // Connect to WebSocket
    connectWebSocket() {
        if (state.ws && state.ws.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            state.ws = new WebSocket('ws://192.168.1.100/ws');

            state.ws.onopen = () => {
                console.log('🟢 WebSocket connected to Vanguard Hub');
                state.isConnected = true;
                state.connectionStatus = 'Connected';

                // Request initial system state
                this.sendWebSocketMessage({
                    type: 'request_state'
                });
            };

            state.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };

            state.ws.onclose = () => {
                console.log('🔴 WebSocket disconnected');
                state.isConnected = false;
                state.connectionStatus = 'Disconnected';
                state.ws = null;
            };

            state.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                state.isConnected = false;
                state.connectionStatus = 'Connection Error';
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            state.isConnected = false;
            state.connectionStatus = 'Connection Failed';
        }
    },

    // Handle WebSocket messages
    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'sensor_update':
                    this.updateRoomData(message);
                    break;
                case 'system_status':
                    this.updateSystemStatus(message);
                    break;
                case 'ai_insight':
                    this.addAIInsight(message);
                    break;
                case 'node_status':
                    this.updateNodeStatus(message);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    },

    // Send WebSocket message
    sendWebSocketMessage(data) {
        if (state.ws && state.ws.readyState === WebSocket.OPEN) {
            state.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    },

    // Update room data
    updateRoomData(data) {
        const room = state.rooms.find(r => r.id === data.node);
        if (room) {
            Object.assign(room, {
                temperature: data.temp || room.temperature,
                humidity: data.humidity || room.humidity,
                occupancy: data.occupancy || room.occupancy,
                co2: data.co2 || room.co2,
                lightLevel: data.light_level || room.lightLevel,
                lastUpdate: Date.now()
            });

            // Check for alerts
            this.checkRoomAlerts(room);
        }
    },

    // Update system status
    updateSystemStatus(data) {
        state.nodesOnline = data.nodes_online || 0;
        state.alertLevel = data.system_health || 'normal';

        switch (state.alertLevel) {
            case 'critical':
                state.alertText = 'CRITICAL ALERT';
                break;
            case 'warning':
                state.alertText = 'Warning';
                break;
            default:
                state.alertText = 'System Normal';
        }
    },

    // Add AI insight
    addAIInsight(data) {
        const insight = {
            id: Date.now(),
            text: data.insight,
            timestamp: Date.now()
        };

        state.aiInsights.unshift(insight);

        // Keep only last 10 insights
        if (state.aiInsights.length > 10) {
            state.aiInsights.pop();
        }
    },

    // Update node status
    updateNodeStatus(data) {
        const room = state.rooms.find(r => r.id === data.node_id);
        if (room) {
            room.isOnline = data.is_online;
        }
    },

    // Check room alerts
    checkRoomAlerts(room) {
        room.hasAlert = false;

        // CO2 alert
        if (room.co2 > 1000) {
            room.hasAlert = true;
        }

        // Temperature alert
        if (room.temperature > 80 || room.temperature < 60) {
            room.hasAlert = true;
        }

        // Humidity alert
        if (room.humidity > 70 || room.humidity < 30) {
            room.hasAlert = true;
        }
    },

    // Toggle sidebar
    toggleSidebar() {
        state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // Dismiss AI insight
    dismissInsight(id) {
        state.aiInsights = state.aiInsights.filter(insight => insight.id !== id);
    },

    // View camera
    viewCamera(roomId) {
        const room = state.rooms.find(r => r.id === roomId);
        if (room && room.isOnline) {
            state.selectedCameraRoom = room.name;
            state.cameraStreamUrl = room.cameraUrl;
            state.cameraModalOpen = true;
        }
    },

    // Close camera modal
    closeCamera() {
        state.cameraModalOpen = false;
        state.selectedCameraRoom = '';
        state.cameraStreamUrl = '';
    },

    // Camera error handler
    cameraError() {
        console.error('Camera feed error');
        // Could show error message or fallback image
    },

    // Take snapshot
    takeSnapshot() {
        console.log('📸 Taking snapshot from', state.selectedCameraRoom);
        // Implementation would capture current frame
        this.addAIInsight({
            insight: `Snapshot captured from ${state.selectedCameraRoom} camera`
        });
    },

    // Start/stop recording
    startRecording() {
        state.isRecording = !state.isRecording;
        console.log(state.isRecording ? '🔴 Recording started' : '⏹️ Recording stopped');

        if (state.isRecording) {
            this.addAIInsight({
                insight: `Recording started from ${state.selectedCameraRoom} camera`
            });
        }
    },

    // Toggle light
    toggleLight(roomId) {
        const room = state.rooms.find(r => r.id === roomId);
        if (room && room.isOnline) {
            const newLevel = room.lightLevel > 0 ? 0 : 75;

            this.sendWebSocketMessage({
                type: 'control',
                room: roomId,
                device: 'light',
                value: newLevel
            });

            // Optimistic update
            room.lightLevel = newLevel;
        }
    },

    // Activate mode
    activateMode(mode) {
        console.log(`🎯 Activating ${mode} mode`);

        this.sendWebSocketMessage({
            type: 'mode',
            mode: mode
        });

        // Add AI insight
        const insights = {
            night: 'Night mode activated. All lights dimmed, security armed.',
            movie: 'Movie mode activated. Living room lights dimmed, blinds closed.',
            away: 'Away mode activated. All sensors armed, HVAC set to eco.',
            emergency: 'EMERGENCY MODE ACTIVATED. All doors unlocked, lights on maximum.'
        };

        this.addAIInsight({ insight: insights[mode] });
    },

    // Start data simulation (for testing without hardware)
    startDataSimulation() {
        setInterval(() => {
            // Simulate random sensor updates
            state.rooms.forEach(room => {
                if (room.isOnline && Math.random() > 0.7) {
                    // Small random variations
                    room.temperature += (Math.random() - 0.5) * 0.5;
                    room.humidity += (Math.random() - 0.5) * 2;
                    room.co2 += Math.floor((Math.random() - 0.5) * 10);

                    // Keep values in reasonable ranges
                    room.temperature = Math.max(65, Math.min(80, room.temperature));
                    room.humidity = Math.max(30, Math.min(70, room.humidity));
                    room.co2 = Math.max(300, Math.min(1000, room.co2));

                    // Random occupancy changes
                    if (Math.random() > 0.9) {
                        room.occupancy = Math.floor(Math.random() * 4);
                    }

                    this.checkRoomAlerts(room);
                }
            });

            // Simulate occasional AI insights
            if (Math.random() > 0.95) {
                const insights = [
                    'Energy usage is 15% higher than yesterday at this time.',
                    'Temperature differential detected between living room and kitchen.',
                    'Motion detected in office after hours.',
                    'CO₂ levels optimal in all rooms.',
                    'All security sensors functioning normally.'
                ];

                this.addAIInsight({
                    insight: insights[Math.floor(Math.random() * insights.length)]
                });
            }
        }, 2000);
    },

    generateDummyRooms() {
        const base = state.rooms.length;
        let i = 0;
        while (state.rooms.length < 17) {
            i++;
            const id = `scout_${base + i}`;
            state.rooms.push({
                id,
                name: `Scout ${base + i}`,
                occupancy: Math.floor(Math.random() * 3),
                temperature: 68 + Math.random() * 8,
                humidity: 35 + Math.floor(Math.random() * 25),
                co2: 350 + Math.floor(Math.random() * 300),
                lightLevel: Math.floor(Math.random() * 100),
                isOnline: true,
                hasAlert: false,
                cameraUrl: `http://192.168.1.100:8080/stream/${id}`
            });
        }
    }
};

// Create Petite Vue app
const app = createApp({
    // Reactive state
    ...state,

    // Computed properties


    // Methods
    ...methods,

    // Lifecycle
    mounted() {
        console.log('🎯 Vanguard Dashboard mounted');
        this.init();
    },

    unmounted() {
        console.log('👋 Vanguard Dashboard unmounted');
        if (state.reconnectInterval) {
            clearInterval(state.reconnectInterval);
        }
        if (state.ws) {
            state.ws.close();
        }
    }
});

// Mount the app
app.mount('#app');

window.updateRoomData = methods.updateRoomData;
window.updateSystemStatus = methods.updateSystemStatus;
window.addAIInsight = methods.addAIInsight;
window.updateConnectionStatus = function(connected) {
    state.isConnected = connected;
    state.connectionStatus = connected ? 'Connected' : 'Disconnected';
};

console.log('🚀 Vanguard Mission Control Dashboard initialized');
