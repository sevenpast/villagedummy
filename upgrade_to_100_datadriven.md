# 🚀 UPGRADE TO 100% DATA-DRIVEN ARCHITECTURE

## ⚡ 30 Minuten bis zur vollständigen Data-Driven Architecture

---

## ✅ STEP 1: Add ui_config column (2 min)

```sql
-- In Supabase SQL Editor
ALTER TABLE task_variants 
ADD COLUMN ui_config JSONB;

-- Add comment
COMMENT ON COLUMN task_variants.ui_config IS 
'JSON configuration for dynamic UI rendering. Defines forms, file uploads, AI features, etc.';
```

---

## ✅ STEP 2: Copy UniversalTaskRenderer component (5 min)

```bash
# Create the component file
mkdir -p components/tasks
touch components/tasks/UniversalTaskRenderer.tsx

# Copy from Artifact "UniversalTaskRenderer.tsx"
# Paste into the file
```

---

## ✅ STEP 3: Update Dashboard to use UniversalTaskRenderer (3 min)

```typescript
// app/dashboard/page.tsx

// OLD:
import TaskCard from '@/components/tasks/TaskCard';

// NEW:
import UniversalTaskRenderer from '@/components/tasks/UniversalTaskRenderer';

// In the render:
{filteredTasks.map(task => (
  <UniversalTaskRenderer
    key={task.taskId}
    task={task}
    expanded={expandedTask === task.taskId}
    onToggle={() => setExpandedTask(expandedTask === task.taskId ? null : task.taskId)}
    onAction={handleTaskAction}
  />
))}
```

---

## ✅ STEP 4: Migrate existing Tasks 1-8 to ui_config (10 min)

```sql
-- Task 1: Residence Permit
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "question_yesno",
      "question": "Do you already have a work visa / permit for Switzerland?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "set_reminder", "days": 7 }
      }
    }
  ]
}'
WHERE task_id = 1;

-- Task 2: Housing (with form)
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "question_yesno",
      "question": "Have you already found a permanent residence?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "show_form" }
      }
    },
    {
      "type": "form",
      "title": "What are you looking for?",
      "fields": [
        { "name": "location", "label": "City", "type": "select", "options": ["Zurich", "Geneva", "Basel", "Bern", "Zug"], "required": true },
        { "name": "budget", "label": "Monthly Budget (CHF)", "type": "number", "required": true },
        { "name": "rooms", "label": "Rooms", "type": "select", "options": ["1", "2", "3", "4+"], "required": true },
        { "name": "type", "label": "Type", "type": "select", "options": ["Apartment", "House", "Studio", "Shared"], "required": true }
      ],
      "submitText": "Search Listings",
      "onSubmit": "fetch_housing_listings"
    }
  ]
}'
WHERE task_id = 2;

-- Task 3: Gemeinde Registration (with AI)
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "question_yesno",
      "question": "Have you already registered yourself?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "show_ai_button" }
      }
    },
    {
      "type": "ai_generate",
      "buttonText": "Generate My Personalized Checklist",
      "aiType": "gemeinde_checklist",
      "description": "Get step-by-step instructions specific to your municipality"
    }
  ]
}'
WHERE task_id = 3;

-- Task 4: School Registration
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "question_yesno",
      "question": "Have you already registered your child(ren) for school?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "set_reminder", "days": 7 }
      }
    }
  ]
}'
WHERE task_id = 4;

-- Task 5: Receive Permit Card
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "question_yesno",
      "question": "Have you received your permit card yet?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "set_reminder", "days": 14 }
      }
    }
  ]
}'
WHERE task_id = 5;

-- Task 6: Bank Account (with comparison)
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "question_yesno",
      "question": "Do you have a Swiss bank account?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "show_comparison" }
      }
    },
    {
      "type": "comparison_table",
      "title": "Compare Swiss Banks",
      "headers": ["Bank", "Monthly Fee", "Account Opening", "Mobile App", "Best For"],
      "rows": [
        ["UBS", "Free if >25 or CHF 5", "In-person or online", "⭐⭐⭐⭐", "Premium service"],
        ["PostFinance", "Free", "Online only", "⭐⭐⭐⭐⭐", "Everyday banking"],
        ["Raiffeisen", "CHF 5/month", "In-person", "⭐⭐⭐⭐", "Local banking"],
        ["Neon", "Free", "Online only", "⭐⭐⭐⭐⭐", "Digital natives"]
      ]
    },
    {
      "type": "external_link",
      "text": "Compare on Comparis.ch",
      "url": "https://www.comparis.ch/banking/konto"
    }
  ]
}'
WHERE task_id = 6;

-- Task 7: Mobile & Internet
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "question_yesno",
      "question": "Do you have mobile and internet set up?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "show_comparison" }
      }
    },
    {
      "type": "comparison_table",
      "title": "Mobile Providers",
      "headers": ["Provider", "Price/month", "Data", "Coverage", "Contract"],
      "rows": [
        ["Swisscom", "CHF 60-80", "Unlimited", "⭐⭐⭐⭐⭐", "12-24 months"],
        ["Salt", "CHF 40-60", "50GB", "⭐⭐⭐⭐", "12 months"],
        ["Sunrise", "CHF 45-65", "40GB", "⭐⭐⭐⭐", "12 months"],
        ["Wingo", "CHF 20-30", "20GB", "⭐⭐⭐", "No contract"]
      ]
    }
  ]
}'
WHERE task_id = 7;

-- Task 8: Health Insurance (CRITICAL!)
UPDATE task_variants 
SET ui_config = '{
  "components": [
    {
      "type": "text",
      "content": "⚠️ **MANDATORY:** You MUST have health insurance within 3 months of arrival!",
      "style": "alert"
    },
    {
      "type": "question_yesno",
      "question": "Do you have Swiss health insurance?",
      "actions": {
        "yes": { "action": "mark_complete" },
        "no": { "action": "show_urgent_warning" }
      }
    },
    {
      "type": "ai_generate",
      "buttonText": "Get Personalized Recommendations",
      "aiType": "health_insurance_recommendations",
      "description": "Based on your profile, age, and location"
    },
    {
      "type": "external_link",
      "text": "Compare on Comparis.ch (Official)",
      "url": "https://www.comparis.ch/krankenkassen/grundversicherung"
    }
  ]
}'
WHERE task_id = 8;

COMMIT;
```

---

## ✅ STEP 5: Add Task 9 with ONLY SQL (2 min)

```sql
-- Copy entire SQL from "Task 9: Complete Implementation" artifact
-- Run in Supabase SQL Editor
-- Done! Task 9 appears immediately.
```

---

## ✅ STEP 6: Test Everything (5 min)

```bash
# Restart dev server
npm run dev

# Open dashboard
open http://localhost:3000/dashboard
```

### Checklist:
- [ ] All 9 tasks visible
- [ ] Task 1 has Yes/No buttons
- [ ] Task 2 shows housing form
- [ ] Task 3 has "Generate Checklist" AI button
- [ ] Task 6 shows bank comparison table
- [ ] Task 9 has multiple choice + conditional content

---

## ✅ STEP 7: Add Task 10 in 1 minute (Proof of Data-Driven)

```sql
-- Task 10: Find Family Doctor
INSERT INTO tasks (task_number, module_id, title, category, priority, deadline_days, is_urgent)
VALUES (10, 1, 'Find family doctor / pediatrician', 'health', 55, NULL, false);

INSERT INTO task_variants (task_id, target_audience, intro, info_box, ui_config)
VALUES (
  10,
  '["all"]',
  'Register with a local doctor',
  'Having a family doctor (Hausarzt) is recommended in Switzerland...',
  '{
    "components": [
      {
        "type": "ai_generate",
        "buttonText": "Find Doctors Near Me",
        "aiType": "doctor_search",
        "prompt": "Find 5 family doctors near {user.municipality} with phone numbers"
      },
      {
        "type": "external_link",
        "text": "Search on Doctena",
        "url": "https://www.doctena.ch/"
      },
      {
        "type": "question_yesno",
        "question": "Have you registered with a family doctor?",
        "actions": {
          "yes": { "action": "mark_complete" },
          "no": { "action": "set_reminder", "days": 14 }
        }
      }
    ]
  }'
);

-- Refresh dashboard → Task 10 appears!
```

⏱️ **Time taken:** 1 minute  
💻 **Code changes:** 0  
✅ **Result:** Working task with AI + external link + question

---

## 🎯 **WHAT YOU NOW HAVE**

### ✅ Can add via SQL only:
- New tasks
- Forms (any number of fields)
- File uploads
- Checklists
- AI features
- Comparison tables
- External links
- Conditional content
- Multiple choice questions

### ❌ Still need code for:
- Brand new component types (calendar, video, etc.)
- Complex business logic
- External API integrations (not UI)

---

## 📊 **BEFORE vs AFTER**

### BEFORE (70% Data-Driven):
```
Add Task 9:
1. Update Excel → 5 min
2. Run seed script → 1 min
3. (If has custom UI) Create TaskComponent → 20 min
4. (If has custom actions) Update Dashboard → 10 min
Total: 15-36 minutes + code changes
```

### AFTER (100% Data-Driven):
```
Add Task 9:
1. Write SQL INSERT → 2 min
2. Refresh page
Total: 2 minutes, 0 code changes
```

---

## 🚀 **NEXT LEVEL: PLUGIN SYSTEM**

Want to go even further? Add a plugin system:

```sql
-- Create plugins table
CREATE TABLE task_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'component', 'action', 'ai_feature'
  handler_url TEXT, -- API endpoint
  config JSONB,
  is_active BOOLEAN DEFAULT true
);

-- Register custom plugin
INSERT INTO task_plugins (name, type, handler_url, config)
VALUES (
  'contract_analyzer',
  'ai_feature',
  '/api/plugins/analyze-contract',
  '{"supported_formats": [".pdf", ".docx"], "max_size": 5000000}'
);

-- Use in task
INSERT INTO task_variants (ui_config) VALUES ('{
  "components": [{
    "type": "plugin",
    "plugin_name": "contract_analyzer",
    "label": "Upload & Analyze Contract"
  }]
}');
```

Now even custom features are data-driven! 🔥

---

## ✅ **VERIFICATION**

After upgrade, test by adding Task 11 with ONLY this SQL:

```sql
INSERT INTO tasks (task_number, module_id, title, category, priority)
VALUES (11, 1, 'Test Task - Data Driven', 'admin', 50);

INSERT INTO task_variants (task_id, target_audience, intro, info_box, ui_config)
VALUES (11, '["all"]', 'Testing data-driven system', 'This task was added with SQL only!', '{
  "components": [
    {"type": "text", "content": "🎉 If you see this, the system is 100% data-driven!"},
    {"type": "question_yesno", "question": "Does it work?", "actions": {"yes": {"action": "mark_complete"}}}
  ]
}');
```

✅ If Task 11 appears correctly → **SUCCESS! You're 100% data-driven!**

---

## 🎯 **BENEFITS**

1. ⚡ **Speed:** Add tasks in 2 minutes instead of 20-30 minutes
2. 🎨 **Flexibility:** Change UI without code deployment
3. 📈 **Scalability:** Can handle 100+ tasks easily
4. 🧪 **A/B Testing:** Try different UI configurations in database
5. 👥 **Non-technical editing:** Content team can add tasks via SQL or admin UI

**Result:** From good to GREAT! 🚀
