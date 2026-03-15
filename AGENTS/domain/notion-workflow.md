# Notion Integration — Task Management Workflow

Agents use Notion as the project task board. Every bug fix, feature, and chore should be tracked through the board lifecycle.

## Credentials

```
Database ID: 3234108650748087bb9fed7096170350
Token:       (set NOTION_TOKEN env var or see .deploy-credentials)
API Version: 2022-06-28
Parent Page: 32341086-5074-80d0-9c38-d28d257addbe
```

## Board Columns (Status Field)

The `Status` property is a **select** (not status type). Valid values:

| Status        | Meaning |
|---------------|---------|
| `Inbox`       | Untriaged — needs investigation and priority |
| `Backlog`     | Triaged, prioritized, not yet started |
| `In Progress` | Actively being worked on |
| `QA`          | Code complete, needs testing/verification |
| `Done`        | Verified and deployed |

## Priority Field

Select type with values: `High`, `Medium`, `Low`.

## API Patterns

### Query all tasks

```bash
curl -s -X POST "https://api.notion.com/v1/databases/3234108650748087bb9fed7096170350/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Filter by status

```bash
curl -s -X POST "https://api.notion.com/v1/databases/3234108650748087bb9fed7096170350/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"property":"Status","select":{"equals":"In Progress"}}}'
```

### Update ticket status

```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/$PAGE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"properties":{"Status":{"select":{"name":"QA"}}}}'
```

### Create a new ticket

```bash
curl -s -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "3234108650748087bb9fed7096170350"},
    "properties": {
      "Name": {"title": [{"text": {"content": "Ticket title here"}}]},
      "Status": {"select": {"name": "Inbox"}},
      "Priority": {"select": {"name": "Medium"}}
    }
  }'
```

### Add content blocks to a page

```bash
curl -s -X PATCH "https://api.notion.com/v1/blocks/$PAGE_ID/children" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "children": [
      {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"text": {"content": "Section Title"}}]}},
      {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "Body text here."}}]}}
    ]
  }'
```

### Read page content blocks

```bash
curl -s "https://api.notion.com/v1/blocks/$PAGE_ID/children" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Notion-Version: 2022-06-28"
```

### Add a comment (requires Insert Comments capability)

```bash
curl -s -X POST "https://api.notion.com/v1/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"page_id": "$PAGE_ID"},
    "rich_text": [{"type": "text", "text": {"content": "Comment text here"}}]
  }'
```

## Agent Workflow — When Solving Tasks

### Starting Work

1. **Check the board** — query for `Inbox` and `Backlog` tickets, prioritize by `Priority` field
2. **Move to In Progress** — update the ticket status before starting work
3. **Read the ticket** — fetch page content blocks for full description, acceptance criteria, and key files

### During Work

4. **Add comments** on the ticket with progress notes (what was tried, what worked)
5. **Create sub-tickets** if you discover related bugs during implementation
6. **Reference commits** in comments (e.g., "Fixed in commit abc1234")

### Completing Work

7. **Move to QA** — update status after code is committed and type-checked
8. **Deploy** — run `./scripts/deploy.sh frontend` (or `ghost` for Ghost AI)
9. **Verify** — use preview tools or live site to verify the fix
10. **Move to Done** — after successful verification
11. **Close duplicates** — if a ticket duplicates an existing Done ticket, close it with a comment explaining which ticket it duplicates

### Triage Rules

- **Inbox → Backlog**: Add priority, verify the bug/feature is valid, add investigation notes
- **Inbox → Done**: If the issue is already fixed or invalid
- **Templates** (Chore/Bug/Feature): Move to Backlog with Low priority — these are Notion templates, not code tasks

## Documentation Pages

Separate from the task board, there are documentation pages under a parent page:

```
Documentation Page ID: 32441086-5074-8193-8402-f4750c7de62d
  ├── User Guide:      32441086-5074-81ad-8683-cf16451479f9
  └── Developer Setup:  32441086-5074-81bc-bf25-c2946086c7cc
```

## Tips

- The `Status` field is `select` type, NOT `status` type — use `{"select": {"name": "..."}}` not `{"status": {"name": "..."}}`
- Rich text max per block: 2000 characters. Split long content into multiple blocks
- Comments API may return 403 if the integration doesn't have "Insert comments" capability — add content as page blocks instead
- Always parse Python output for Notion API responses — the JSON is complex and deeply nested
- Use `python3 -c "import sys,json; ..."` for quick response parsing
