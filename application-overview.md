# FINEKO Application Overview & Technical Specification

## 1. High-Level Concept

FINEKO is a comprehensive business management tool designed to enhance productivity and organization within a company. It integrates daily task management, long-term goal setting (Results), organizational structure mapping, business process visualization, and knowledge sharing (Instructions) into a single, cohesive platform. The application is built around a clear hierarchy and emphasizes accountability and clarity in all operations.

The primary user interaction model is:
1.  User logs in via Telegram.
2.  User selects a Company (workspace).
3.  User is directed to the main dashboard, which defaults to the Daily Tasks page.

---

## 2. Core Modules & Entities

### 2.1. Authentication & Users

-   **Authentication**: The sole method of authentication is through Telegram. The backend receives user data from a Telegram login widget/bot and issues a JWT token for session management.
-   **User (`User`)**: Represents an individual who can log in. A user account is global and can be associated with multiple companies.
-   **Employee (`Employee`)**: Represents a user's profile *within* a specific company. It contains company-specific details like position, status, and notes.

### 2.2. Companies

-   A **Company** is the primary workspace or organization. All data such as tasks, employees, and results are scoped to a single company.
-   A user can be a member of or own multiple companies and must select one after logging in to proceed.

### 2.3. Tasks (`Task`)

-   **Concept**: Tasks are the day-to-day operational units of work. They are atomic, actionable items assigned to a specific user with a specific due date.
-   **Eisenhower Matrix**: Tasks are categorized using the Eisenhower Matrix (`type` field) to help with prioritization:
    -   `important-urgent`
    -   `important-not-urgent`
    -   `not-important-urgent`
    -   `not-important-not-urgent`
-   **Time Tracking**: Each task has an `expectedTime` and an `actualTime` to track efficiency.
-   **Relationship**: A Task is always assigned to one `assignee` and created by one `reporter`. It can optionally be linked to a `Result` to show how daily work contributes to larger goals.

### 2.4. Results (`Result`)

-   **Concept**: Results represent larger, strategic goals or Key Results (as in OKRs). They have a longer-term deadline and are used to track progress on significant company objectives.
-   **Hierarchy**: A Result can be broken down into smaller, measurable **Sub-Results** (`subResults`). Each sub-result is a simple checklist item (name, completed status).
-   **Relationship**: A Result is assigned to one `assignee` and created by one `reporter`. It serves as a parent container for multiple `Tasks` that contribute to its completion.

### 2.5. Organizational Structure

-   **Concept**: Defines the company's hierarchy and reporting lines. It's a visual tool to understand who does what.
-   **Divisions (`Division`)**: The highest-level organizational units (e.g., Finance, Marketing, Operations).
-   **Departments (`Department`)**: Sub-units within a Division (e.g., the "Sales" department is in the "Public Relations" division).
-   **ЦКП (Valuable Final Product)**: A key concept for each department is its "Цінний Кінцевий Продукт" – the valuable, final output that the department is responsible for producing. This defines its purpose.
-   **Relationship**: The structure is `Division` -> `Department` -> `Employee`. An employee is assigned to one or more departments and has a manager.

### 2.6. Business Processes (`Process`)

-   **Concept**: A visual tool for mapping and standardizing company workflows (similar to BPMN - Business Process Model and Notation).
-   **Lanes**: Each process is divided into horizontal "lanes," where each lane represents a specific role or department (e.g., "HR Manager," "Accountant").
-   **Steps**: Within each lane are individual steps that represent actions or decisions in the process. Steps are ordered and can be connected to create a flow.
-   **Data Save Points**: Certain steps can be marked as points where data is created or updated in an external system (e.g., "CRM," "Google Sheets"), providing clarity on data flow.

### 2.7. Instructions (`Instruction`)

-   **Concept**: A knowledge base or wiki for the company. It's a collection of documents that contain guidelines, procedures, and important information.
-   **Rich Content**: Content is stored as HTML to support formatting, images, and embedded videos.
-   **Access Control**: Each instruction has an `accessList` that specifies which users can view or edit it, allowing for private or department-specific documentation.

### 2.8. Templates (`Template`)

-   **Concept**: Used to automate the creation of recurring tasks or results.
-   **Example**: A "Weekly Report" template could automatically generate a new task every Monday for the responsible employee.
-   **Relationship**: A template is a blueprint that generates `Task` instances based on a defined schedule (`repeatability`).

### 2.9. Telegram Groups

-   **Concept**: Allows linking company work to communication in Telegram. System notifications, task updates, and reports can be sent to linked groups.
-   **Linking**: A Telegram group is linked to the company workspace using a unique code provided by a bot.
-   **Member Mapping**: Once linked, Telegram group members can be mapped to `Employee` profiles within FINEKO.

---

## 3. Data Models & Relationships

*(These are based on the API documentation and existing types)*

### User
```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "avatar": "string (URL)",
  "telegramUserId": "string",
  "telegramUsername": "string"
}
```

### Company
```json
{
  "id": "string",
  "name": "string",
  "ownerId": "string (references User.id)"
}
```

### Employee
```json
{
  "id": "string",
  "userId": "string (references User.id)",
  "companyId": "string (references Company.id)",
  "firstName": "string",
  "lastName": "string",
  "avatar": "string (URL)",
  "status": "'active' | 'vacation' | 'inactive'",
  "positions": ["string (references Position.id)"],
  "groups": ["string (references Group.id)"],
  "notes": "string"
}
```

### Task
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "dueDate": "string (YYYY-MM-DD)",
  "status": "'todo' | 'done'",
  "type": "'important-urgent' | 'important-not-urgent' | ...",
  "expectedTime": "number (minutes)",
  "actualTime": "number (minutes)",
  "expectedResult": "string",
  "actualResult": "string",
  "assigneeId": "string (references Employee.id)",
  "reporterId": "string (references Employee.id)",
  "resultId": "string (optional, references Result.id)"
}
```

### Result
```json
{
  "id": "string",
  "name": "string",
  "status": "string",
  "completed": "boolean",
  "deadline": "string (YYYY-MM-DD)",
  "assigneeId": "string (references Employee.id)",
  "reporterId": "string (references Employee.id)",
  "description": "string",
  "expectedResult": "string",
  "subResults": [
    {
      "id": "string",
      "name": "string",
      "completed": "boolean"
    }
  ]
}
```

### Division
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "order": "number"
}
```

### Department
```json
{
  "id": "string",
  "name": "string",
  "divisionId": "string (references Division.id)",
  "managerId": "string (optional, references Employee.id)",
  "ckp": "string (Valuable Final Product)"
}
```
*Note: A Department-Employee link would be a join table `(departmentId, employeeId)`.*

### Process
```json
{
    "id": "string",
    "name": "string",
    "description": "string",
    "lanes": [{
        "id": "string",
        "role": "string (e.g., 'HR Manager')",
        "steps": [{
            "id": "string",
            "name": "string",
            "responsibleId": "string (references Employee.id)",
            "order": "number",
            "connections": [{ "to": "string (references Step.id)" }],
            "status": "'new' | 'outdated' | 'problematic' | 'ok'",
            "notes": "string",
            "isDataSavePoint": "boolean",
            "dataSaveLocation": "string"
        }]
    }]
}
```

### Instruction
```json
{
  "id": "string",
  "title": "string",
  "department": "string",
  "content": "string (HTML)",
  "accessList": [
    {
      "userId": "string (references User.id)",
      "access": "'view' | 'edit'"
    }
  ]
}
```
