# Operations Specification: KVN Inventory System
 
 This document provides a comprehensive reference for the operational capabilities of the KVN Inventory System and Schema Viewer. It defines the API contracts, data flow, and constraints for managing the "Dragon Guardian" / "KVN" infrastructure.

## ⚡ GET IT DONE FAST (Quick Reference)

| Operation | Description | Endpoint |
|-----------|-------------|----------|
| **RETRIEVE_INVENTORY** | Get the full hierarchical schema of the inventory. | `GET /api/inventory` |
| **UPDATE_DEVICE** | Modify properties of a specific device/node. | `PATCH /api/inventory/nodes/{id}` |
| **GENERATE_CONFIG** | Trigger ESPHome YAML generation for a device. | `POST /api/devices/{id}/generate-config` |
| **SEARCH_CATALOG** | Find items by query, tag, or type. | `GET /api/search` |
| **SYNC_STATUS** | Check synchronization status with local files. | `GET /api/system/sync/status` |

---

## 1. Inventory Management Operations

### RETRIEVE_INVENTORY
Retrieves the complete inventory structure as a hierarchical JSON tree. Used to populate the primary visualization and sidebar.

*   **Parameters**:
    *   `depth` [O] (integer): Limit the traversal depth. Default: unlimited.
    *   `include_metadata` [O] (boolean): Include detailed metadata (timestamps, versions). Default: `false`.
    *   `format` [O] (string): Response format (`json`, `yaml`). Default: `json`.

*   **Outputs**:
    *   **Success (200 OK)**:
        ```json
        {
          "root": {
            "id": "root_1",
            "type": "category",
            "children": [...]
          },
          "version": "1.2.0",
          "timestamp": "2024-03-20T10:00:00Z"
        }
        ```

*   **Constraints**:
    *   **Rate Limit**: 60 requests/minute.
    *   **Cache**: Responses cached for 5 seconds.

*   **Error Handling**:
    *   `500 Internal Server Error`: If JSON parsing fails.
    *   **Recovery**: Retry with exponential backoff.

### UPDATE_DEVICE_NODE
Updates the properties, configuration, or status of a specific node in the inventory.

*   **Parameters**:
    *   `id` [R] (string): Unique identifier of the node.
    *   `properties` [R] (object): Key-value pairs to update.
        *   `status` (string): e.g., "Active", "Maintenance".
        *   `ip_address` (string): IPv4 address.
    *   `audit_comment` [O] (string): Reason for the change.

*   **Outputs**:
    *   **Success (200 OK)**: Returns the updated node object.
    *   **Success (202 Accepted)**: If update triggers a background sync.

*   **Constraints**:
    *   **Validation**: IP addresses must be valid. Status must match enum.
    *   **Auth**: Requires `write` permission.

*   **Error Handling**:
    *   `404 Not Found`: Node ID does not exist.
    *   `409 Conflict`: Version mismatch (optimistic locking).

---

## 2. Configuration & Automation Operations

### GENERATE_ESPHOME_CONFIG
Generates the specific ESPHome YAML configuration file for a device based on its properties and templates.

*   **Parameters**:
    *   `device_id` [R] (string): Target device ID.
    *   `templates` [O] (array<string>): List of template names to include (e.g., `["wifi_base", "sensor_hub"]`).
    *   `force_regenerate` [O] (boolean): Ignore cache.

*   **Outputs**:
    *   **Success (200 OK)**:
        ```json
        {
          "config_content": "esphome: ...",
          "generated_at": "2024-03-20T10:05:00Z",
          "path": "/config/generated/device_1.yaml"
        }
        ```

*   **Constraints**:
    *   **Processing**: Synchronous operation (max 30s timeout).
    *   **Dependencies**: Requires access to `master_config.yaml`.

*   **Error Handling**:
    *   `422 Unprocessable Entity`: Missing required device properties (e.g., no board type defined).
    *   `500`: Template rendering error.

### DEPLOY_FIRMWARE
Triggers a remote OTA (Over-The-Air) update for a specific device.

*   **Parameters**:
    *   `device_id` [R] (string): Target device.
    *   `firmware_version` [O] (string): Specific version tag. Default: `latest`.
    *   `dry_run` [O] (boolean): Test connection without flashing.

*   **Outputs**:
    *   **Success (202 Accepted)**:
        ```json
        {
          "job_id": "job_123",
          "status": "queued",
          "estimated_duration": "120s"
        }
        ```

*   **Constraints**:
    *   **Network**: Device must be online and reachable via API.
    *   **Auth**: Requires `admin` privileges.

*   **Error Handling**:
    *   `503 Service Unavailable`: Device offline.
    *   **Recovery**: Check device connectivity and retry.

---

## 3. Visualization & User Interface Operations

### SAVE_VISUALIZATION_STATE
Saves the user's current view preferences (zoom, layout, expanded nodes).

*   **Parameters**:
    *   `user_id` [R] (string): User identifier.
    *   `layout_config` [R] (object):
        *   `zoom` (float)
        *   `pan_x` (float)
        *   `pan_y` (float)
        *   `expanded_nodes` (array<string>)

*   **Outputs**:
    *   **Success (204 No Content)**

*   **Constraints**:
    *   **Storage**: Limited to 10 states per user.

### SEARCH_CATALOG
Performs a semantic or keyword search across the entire inventory.

*   **Parameters**:
    *   `query` [R] (string): Search terms.
    *   `filters` [O] (object):
        *   `type` (string): e.g., "sensor", "project".
        *   `status` (string): e.g., "active".

*   **Outputs**:
    *   **Success (200 OK)**:
        ```json
        {
          "results": [
            { "id": "1", "name": "Kitchen Sensor", "score": 0.95, "matches": ["name"] }
          ],
          "total": 1
        }
        ```

---

## 4. System & Maintenance Operations

### SYNC_LOCAL_FILES
Synchronizes the JSON database with the local filesystem (Jupyter notebooks, YAML files).

*   **Parameters**:
    *   `direction` [R] (enum): `import` (Files -> DB) or `export` (DB -> Files).
    *   `dry_run` [O] (boolean): Preview changes.

*   **Outputs**:
    *   **Success (200 OK)**:
        ```json
        {
          "added": 2,
          "modified": 5,
          "deleted": 0,
          "logs": ["..."]
        }
        ```

*   **Constraints**:
    *   **Locking**: Locks the inventory during sync.

*   **Error Handling**:
    *   `409 Conflict`: File lock active.

---

## Versioning
*   **Version**: 1.0.0
*   **Last Updated**: 2026-01-03
*   **Status**: Active Draft
