# Job Tracker Database Schema

## Entity Relationship Diagram

```
┌─────────────┐
│    Users    │
├─────────────┤
│ id (PK)     │
│ email       │
│ password    │
│ full_name   │
│ created_at  │
│ updated_at  │
└─────────────┘
       │
       │ 1:N
       ↓
┌──────────────────────┐        ┌─────────────┐
│  JobApplications     │───────→│  Companies  │
├──────────────────────┤  N:1   ├─────────────┤
│ id (PK)              │        │ id (PK)     │
│ user_id (FK)         │        │ name        │
│ company_id (FK)      │        │ website     │
│ position_title       │        │ industry    │
│ status               │        │ size        │
│ application_date     │        │ location    │
│ job_posting_url      │        │ description │
│ salary_min/max       │        └─────────────┘
│ location             │
│ work_type            │
│ notes                │
└──────────────────────┘
       │
       ├───1:N──→ ┌─────────────┐
       │          │  Contacts   │
       │          ├─────────────┤
       │          │ id (PK)     │
       │          │ job_app_id  │
       │          │ name        │
       │          │ title       │
       │          │ email       │
       │          │ phone       │
       │          │ linkedin    │
       │          └─────────────┘
       │
       ├───1:N──→ ┌─────────────┐
       │          │    Notes    │
       │          ├─────────────┤
       │          │ id (PK)     │
       │          │ job_app_id  │
       │          │ content     │
       │          │ type        │
       │          └─────────────┘
       │
       ├───1:N──→ ┌─────────────┐
       │          │    Tasks    │
       │          ├─────────────┤
       │          │ id (PK)     │
       │          │ job_app_id  │
       │          │ title       │
       │          │ description │
       │          │ due_date    │
       │          │ completed   │
       │          └─────────────┘
       │
       └───M:N──→ ┌─────────────┐
                  │    Tags     │
                  ├─────────────┤
                  │ id (PK)     │
                  │ name        │
                  │ color       │
                  └─────────────┘

┌──────────────────────┐
│   ActivityLogs       │
├──────────────────────┤
│ id (PK)              │
│ user_id (FK)         │
│ job_application_id   │
│ action               │
│ entity_type          │
│ entity_id            │
│ metadata (JSON)      │
│ created_at           │
└──────────────────────┘
```

## Relationships

### Primary Relationships
- **User → JobApplication** (1:N): One user can have many job applications
- **JobApplication → Company** (N:1): Many applications can be for the same company
- **JobApplication → Contact** (1:N): Each application can have multiple contacts
- **JobApplication → Note** (1:N): Each application can have multiple notes
- **JobApplication → Task** (1:N): Each application can have multiple tasks
- **JobApplication ↔ Tag** (M:N): Applications and tags have many-to-many relationship via junction table
- **User → ActivityLog** (1:N): Track all user activities

### Cascade Rules
- Deleting a User cascades to all their JobApplications and ActivityLogs
- Deleting a JobApplication cascades to related Contacts, Notes, Tasks, and junction table entries
- Deleting a Company sets company_id to NULL in JobApplications
- Deleting a Tag cascades to junction table entries only

## SQLite-Specific Considerations

### Pragmas
```sql
PRAGMA foreign_keys = ON;  -- Enable foreign key constraints
PRAGMA journal_mode = WAL; -- Write-Ahead Logging for better concurrency
```

### Data Types
- Using INTEGER for IDs (maps to SQLite's INTEGER PRIMARY KEY)
- TEXT for strings (no size limit needed in SQLite)
- DATETIME stored as TEXT in ISO8601 format
- BOOLEAN stored as INTEGER (0/1)
- JSON stored as TEXT (SQLite 3.38+ has JSON operators)

### Indexes
Strategic indexes on:
- Foreign keys (user_id, company_id, job_application_id)
- Frequently queried fields (status, application_date, due_date)
- Timestamp fields for sorting (created_at)

### Triggers
Automatic updated_at triggers for main entities to track modifications

## Migration Strategy

1. **Version Control**: Each migration file numbered sequentially (001_initial_schema.sql, 002_add_field.sql)
2. **Migration Table**: Track applied migrations in a `migrations` table
3. **Transaction Safety**: Apply each migration within a transaction
4. **Rollback Support**: Optional rollback files for each migration
5. **Data Migrations**: Separate data migration scripts when schema changes affect existing data

## Performance Optimizations

1. **Denormalization**: Consider caching company name in job_applications for list views
2. **Composite Indexes**: For common query patterns (user_id + status, user_id + application_date)
3. **Partial Indexes**: For filtered queries (e.g., only active applications)
4. **View Creation**: For complex recurring queries
5. **Connection Pooling**: Reuse database connections in the application layer

