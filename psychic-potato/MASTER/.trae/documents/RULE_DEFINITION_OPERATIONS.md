# Rule Definition Operations Specification

This document provides a comprehensive reference for rule definition operations within the KDS Inventory System and Schema Viewer. It defines the API contracts, data flow, and constraints for managing business rules, validation rules, and automation rules.

## ⚡ GET IT DONE FAST (Quick Reference)

| Operation | Description | Endpoint |
|-----------|-------------|----------|
| **CREATE_RULE** | Create a new validation or automation rule | `POST /api/rules` |
| **UPDATE_RULE** | Modify existing rule properties and conditions | `PATCH /api/rules/{id}` |
| **DELETE_RULE** | Remove a rule from the system | `DELETE /api/rules/{id}` |
| **VALIDATE_RULE** | Test rule logic against sample data | `POST /api/rules/{id}/validate` |
| **LIST_RULES** | Get all rules with filtering and pagination | `GET /api/rules` |

---

## 1. Rule Lifecycle Management Operations

### CREATE_RULE
Creates a new validation, automation, or business rule with specified conditions and actions.

**Parameters:**
- `rule_type` [R] (string): Rule category (`validation`, `automation`, `business`)
- `name` [R] (string): Unique rule identifier (3-50 characters)
- `description` [R] (string): Detailed rule purpose (10-200 characters)
- `conditions` [R] (object): Rule conditions in JSON format
- `actions` [R] (object): Actions to execute when conditions are met
- `priority` [O] (integer): Execution priority (1-100, default: 50)
- `enabled` [O] (boolean): Rule activation status (default: true)
- `tags` [O] (array<string>): Classification tags (max 5)

**Outputs:**
- **Success (201 Created)**:
```json
{
  "id": "rule_123",
  "rule_type": "validation",
  "name": "Device IP Validation",
  "status": "active",
  "created_at": "2024-03-20T10:00:00Z",
  "version": 1
}
```

**Constraints:**
- **Rate Limit**: 30 requests/minute per user
- **Validation**: Name must be unique, conditions must be valid JSON
- **Auth**: Requires `rule:write` permission

**Error Handling:**
- `400 Bad Request`: Invalid rule format or missing required fields
- `409 Conflict`: Rule name already exists
- `422 Unprocessable Entity`: Invalid condition syntax

### UPDATE_RULE
Modifies existing rule properties, conditions, or actions while maintaining version history.

**Parameters:**
- `id` [R] (string): Unique rule identifier
- `name` [O] (string): Updated rule name (3-50 characters)
- `description` [O] (string): Updated description (10-200 characters)
- `conditions` [O] (object): Updated conditions
- `actions` [O] (object): Updated actions
- `priority` [O] (integer): Updated priority (1-100)
- `enabled` [O] (boolean): Updated activation status
- `comment` [O] (string): Change reason for audit log

**Outputs:**
- **Success (200 OK)**: Returns updated rule object with new version number
- **Success (202 Accepted)**: If update triggers background validation

**Constraints:**
- **Validation**: Incremental version control, optimistic locking
- **Auth**: Requires `rule:write` permission

**Error Handling:**
- `404 Not Found`: Rule ID does not exist
- `409 Conflict`: Version mismatch or concurrent modification
- `423 Locked`: Rule is currently being validated

### DELETE_RULE
Permanently removes a rule from the system with soft-delete option for audit purposes.

**Parameters:**
- `id` [R] (string): Unique rule identifier
- `force` [O] (boolean): Hard delete vs soft delete (default: false)
- `reason` [O] (string): Deletion reason for audit log

**Outputs:**
- **Success (204 No Content)**: Rule successfully deleted
- **Success (200 OK)**: Returns confirmation with deletion timestamp

**Constraints:**
- **Dependencies**: Cannot delete rules referenced by other rules
- **Auth**: Requires `rule:admin` permission

**Error Handling:**
- `400 Bad Request`: Rule is referenced by other system components
- `404 Not Found`: Rule ID does not exist
- `423 Locked`: Rule is currently in use

---

## 2. Rule Validation & Testing Operations

### VALIDATE_RULE
Tests rule logic against provided sample data to identify potential issues before deployment.

**Parameters:**
- `id` [R] (string): Rule identifier to validate
- `test_data` [R] (object): Sample data for validation
- `context` [O] (object): Additional context parameters
- `dry_run` [O] (boolean): Test without side effects (default: true)

**Outputs:**
- **Success (200 OK)**:
```json
{
  "valid": true,
  "results": {
    "conditions_met": true,
    "actions_executed": ["log_warning", "update_status"],
    "execution_time_ms": 45
  },
  "warnings": [],
  "errors": []
}
```

**Constraints:**
- **Timeout**: Maximum 30 seconds for complex validations
- **Resource Limits**: Test data size limited to 1MB

**Error Handling:**
- `422 Unprocessable Entity`: Invalid rule syntax or logic errors
- `500 Internal Server Error`: Rule execution failure

### TEST_RULE_BATCH
Validates multiple rules against a dataset to check for conflicts and dependencies.

**Parameters:**
- `rule_ids` [R] (array<string>): List of rule identifiers
- `test_data` [R] (object): Common test dataset
- `execution_order` [O] (string): `priority`, `dependency`, `manual`
- `stop_on_error` [O] (boolean): Halt execution on first failure

**Outputs:**
- **Success (200 OK)**: Returns detailed results for each rule
- **Success (207 Multi-Status)**: Mixed success/failure results

**Constraints:**
- **Batch Size**: Maximum 50 rules per request
- **Execution Order**: Respects rule priorities and dependencies

**Error Handling:**
- `400 Bad Request`: Invalid rule combination or circular dependencies
- `504 Gateway Timeout`: Batch processing exceeds time limit

---

## 3. Rule Discovery & Management Operations

### LIST_RULES
Retrieves all rules with advanced filtering, sorting, and pagination capabilities.

**Parameters:**
- `page` [O] (integer): Page number (default: 1)
- `limit` [O] (integer): Items per page (1-100, default: 20)
- `rule_type` [O] (string): Filter by rule type
- `status` [O] (string): Filter by activation status
- `tags` [O] (array<string>): Filter by tags
- `search` [O] (string): Text search in name/description
- `sort_by` [O] (string): Sort field (default: `created_at`)
- `sort_order` [O] (string): `asc` or `desc` (default: `desc`)

**Outputs:**
- **Success (200 OK)**:
```json
{
  "rules": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  },
  "filters_applied": {
    "rule_type": "validation",
    "status": "active"
  }
}
```

**Constraints:**
- **Rate Limit**: 120 requests/minute
- **Cache**: Results cached for 30 seconds

### GET_RULE_DETAILS
Retrieves comprehensive information about a specific rule including execution history.

**Parameters:**
- `id` [R] (string): Rule identifier
- `include_history` [O] (boolean): Include execution history (default: false)
- `include_dependencies` [O] (boolean): Include dependent rules (default: false)

**Outputs:**
- **Success (200 OK)**: Complete rule object with metadata

**Constraints:**
- **History Limit**: Maximum 1000 execution records

### SEARCH_RULES
Performs semantic search across rule definitions, conditions, and documentation.

**Parameters:**
- `query` [R] (string): Search query (minimum 3 characters)
- `search_fields` [O] (array<string>): Fields to search (`name`, `description`, `conditions`)
- `fuzzy_match` [O] (boolean): Enable fuzzy matching (default: false)
- `highlight_matches` [O] (boolean): Include match highlighting (default: true)

**Outputs:**
- **Success (200 OK)**: Returns ranked search results with relevance scores

---

## 4. Rule Execution & Monitoring Operations

### EXECUTE_RULE
Manually triggers rule execution against specified data for immediate processing.

**Parameters:**
- `id` [R] (string): Rule identifier
- `input_data` [R] (object): Data to process
- `execution_context` [O] (object): Runtime context parameters
- `async` [O] (boolean): Execute asynchronously (default: false)

**Outputs:**
- **Success (200 OK)**: Immediate execution results
- **Success (202 Accepted)**: Job queued for async execution

**Constraints:**
- **Timeout**: 60 seconds for synchronous execution
- **Rate Limit**: 10 executions/minute per rule

### GET_EXECUTION_STATUS
Retrieves the status and results of a rule execution job.

**Parameters:**
- `execution_id` [R] (string): Execution job identifier
- `include_logs` [O] (boolean): Include detailed execution logs

**Outputs:**
- **Success (200 OK)**: Execution status and results

### LIST_EXECUTION_HISTORY
Retrieves execution history for a rule with filtering and analytics.

**Parameters:**
- `rule_id` [R] (string): Rule identifier
- `time_range` [O] (object): Date range filter
- `status` [O] (string): Filter by execution status
- `limit` [O] (integer): Maximum records (1-1000)

**Outputs:**
- **Success (200 OK)**: Paginated execution history with statistics

---

## 5. Rule Import/Export Operations

### EXPORT_RULES
Exports rule definitions in various formats for backup or migration purposes.

**Parameters:**
- `format` [R] (string): Export format (`json`, `yaml`, `csv`)
- `rule_ids` [O] (array<string>): Specific rules to export
- `include_history` [O] (boolean): Include execution history
- `compression` [O] (boolean): Enable compression (default: true)

**Outputs:**
- **Success (200 OK)**: Returns file download or data payload

### IMPORT_RULES
Imports rule definitions from external sources with validation and conflict resolution.

**Parameters:**
- `import_data` [R] (object/string): Rule definitions to import
- `format` [R] (string): Import format (`json`, `yaml`)
- `conflict_resolution` [R] (string): `skip`, `overwrite`, `merge`
- `dry_run` [O] (boolean): Preview import without changes
- `validate_only` [O] (boolean): Validate without importing

**Outputs:**
- **Success (200 OK)**: Import summary with statistics
- **Success (207 Multi-Status)**: Partial success with conflicts

**Constraints:**
- **File Size**: Maximum 10MB for import files
- **Validation**: All rules must pass validation before import

---

## 6. Rule Analytics & Reporting Operations

### GET_RULE_ANALYTICS
Retrieves comprehensive analytics and metrics for rule performance and usage.

**Parameters:**
- `rule_id` [O] (string): Specific rule or system-wide
- `metrics` [O] (array<string>): Metrics to include
- `time_period` [O] (string): Analysis period
- `aggregation` [O] (string): Data aggregation level

**Outputs:**
- **Success (200 OK)**: Analytics data with visualizations

### GENERATE_RULE_REPORT
Creates detailed reports on rule effectiveness, conflicts, and recommendations.

**Parameters:**
- `report_type` [R] (string): Report category
- `scope` [O] (string): Report scope (`system`, `category`, `rule`)
- `format` [O] (string): Output format (`pdf`, `html`, `json`)
- `include_recommendations` [O] (boolean): Include improvement suggestions

**Outputs:**
- **Success (200 OK)**: Report data or file download

---

## Error Handling Reference

### Common Error Codes
- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict or version mismatch
- `422 Unprocessable Entity`: Validation failure
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error
- `503 Service Unavailable`: Service temporarily unavailable

### Recovery Procedures
1. **Rate Limit Exceeded**: Wait for reset period, implement exponential backoff
2. **Validation Errors**: Review error details, correct data format, retry
3. **Version Conflicts**: Retrieve latest version, merge changes, retry
4. **Authentication Errors**: Refresh credentials, check permissions
5. **Server Errors**: Retry with exponential backoff, contact support if persistent

---

## Versioning Information

**API Version**: 2.1.0  
**Last Updated**: 2026-01-03  
**Status**: Production Ready  
**Deprecation Policy**: 6-month notice for breaking changes  

### Version History
- **v2.1.0**: Added rule analytics and reporting operations
- **v2.0.0**: Major rewrite with improved error handling
- **v1.5.0**: Added batch operations and import/export
- **v1.0.0**: Initial stable release

---

## Cross-References

**Related Operations:**
- `RETRIEVE_INVENTORY` → Use with `LIST_RULES` for complete system view
- `UPDATE_DEVICE_NODE` → Triggers rule validation via `VALIDATE_RULE`
- `SEARCH_CATALOG` → Complements `SEARCH_RULES` for comprehensive search

**Integration Points:**
- Inventory management system for rule application targets
- Configuration generation for automation rules
- Monitoring system for rule execution tracking