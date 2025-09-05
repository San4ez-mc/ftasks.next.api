# FINEKO API Documentation

This document outlines the API endpoints required for the FINEKO application to function.

**Base URL**: `https://api.tasks.fineko.space/`

## Table of Contents
1.  [Authentication](#authentication)
2.  [Companies](#companies)
3.  [Employees](#employees)
4.  [Tasks](#tasks)
5.  [Results](#results)
6.  [Organizational Structure](#organizational-structure)
7.  [Processes](#processes)
8.  [Instructions](#instructions)
9.  [Telegram Groups](#telegram-groups)

---

## 1. Authentication

Handles user login and session management.

### `POST /auth/telegram/login`

Initiates the login process using Telegram user data.

-   **Request Body**:
    ```json
    {
      "tgUserId": "345126254",
      "username": "olexandrmatsuk",
      "firstName": "Oleksandr",
      "lastName": "Matsuk",
      "photoUrl": "https://t.me/i/userpic/320/olexandrmatsuk.jpg"
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
      "token": "your_jwt_auth_token",
      "user": {
        "id": "user-1",
        "firstName": "Oleksandr",
        "lastName": "Matsuk",
        "email": null
      }
    }
    ```

### `GET /auth/me`

Retrieves the profile of the currently authenticated user.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**:
    ```json
    {
      "id": "user-1",
      "firstName": "Oleksandr",
      "lastName": "Matsuk",
      "companies": [
        { "id": "company-1", "name": "Fineko Development" }
      ]
    }
    ```

### `POST /auth/logout`

Logs out the current user.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (204 No Content)**

---

## 2. Companies

Handles management of companies.

### `GET /companies`

Get a list of companies the authenticated user is a member of.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**:
    ```json
    [
      { "id": "company-1", "name": "Fineko Development" },
      { "id": "company-2", "name": "My Startup Project" }
    ]
    ```

### `POST /companies`

Creates a new company.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "name": "New Awesome Company"
    }
    ```
-   **Response (201 Created)**:
    ```json
    {
      "id": "company-3",
      "name": "New Awesome Company",
      "ownerId": "user-1"
    }
    ```

---

## 3. Employees

Handles employee management within a specific company. All endpoints are prefixed with `/companies/{companyId}`.

### `GET /companies/{companyId}/employees`

Get a list of all employees in a company.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**:
    ```json
    [
      {
        "id": "emp-1",
        "firstName": "Oleksandr",
        "lastName": "Matsuk",
        "avatar": "https://...",
        "status": "active",
        "positions": ["pos-1"],
        "groups": ["grp-1"]
      }
    ]
    ```

### `PATCH /companies/{companyId}/employees/{employeeId}`

Updates an employee's details.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "firstName": "Alexander",
      "status": "vacation",
      "positions": ["pos-1", "pos-7"]
    }
    ```
-   **Response (200 OK)**: The updated employee object.

---

## 4. Tasks

Endpoint for daily task management.

### `GET /tasks`

Fetches tasks based on query parameters.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Query Parameters**:
    -   `date` (string, required): Format `YYYY-MM-DD`.
    -   `assigneeId` (string, optional): Filter by responsible user ID.
    -   `reporterId` (string, optional): Filter by task creator ID.
    -   `view` (string, optional): Special filter for views like `mine`, `delegated`.
-   **Response (200 OK)**: Array of Task objects.

### `POST /tasks`

Creates a new task.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "title": "New task from API",
      "dueDate": "2024-09-06",
      "assigneeId": "user-2",
      "reporterId": "user-1",
      "type": "important-not-urgent"
    }
    ```
-   **Response (201 Created)**: The newly created Task object.

### `PATCH /tasks/{taskId}`

Updates an existing task.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "status": "done",
      "actualTime": 55,
      "actualResult": "The task was completed successfully."
    }
    ```
-   **Response (200 OK)**: The updated Task object.

### `DELETE /tasks/{taskId}`

Deletes a task.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (204 No Content)**

---

## 5. Results

Endpoints for managing key results.

### `GET /results`

Fetches results based on query parameters.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Query Parameters**:
    -   `assigneeId`, `reporterId`, `status`, `view`
-   **Response (200 OK)**: Array of Result objects.

### `POST /results`

Creates a new result.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "name": "Launch new marketing campaign",
      "deadline": "2024-10-01",
      "assigneeId": "user-3"
    }
    ```
-   **Response (201 Created)**: The new Result object.

### `PATCH /results/{resultId}`

Updates a result.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "status": "In Progress",
      "description": "Updated description with new details."
    }
    ```
-   **Response (200 OK)**: The updated Result object.

### `POST /results/{resultId}/subresults`

Adds a new sub-result.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "name": "Create landing page"
    }
    ```
-   **Response (201 Created)**: The updated parent Result object with the new sub-result included.

### `PATCH /results/{resultId}/subresults/{subResultId}`

Updates a sub-result.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "completed": true
    }
    ```
-   **Response (200 OK)**: The updated parent Result object.

---

## 6. Organizational Structure

Endpoints for managing divisions and departments.

### `GET /org-structure`

Fetches the complete organizational structure (divisions, departments, employees).

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**:
    ```json
    {
      "divisions": [ { "id": "div-1", "name": "..." } ],
      "departments": [ { "id": "dept-1", "name": "...", "divisionId": "div-1" } ],
      "employees": [ { "id": "emp-1", "name": "..." } ]
    }
    ```

### `POST /org-structure/departments`

Creates a new department.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "name": "New Department",
      "divisionId": "div-1"
    }
    ```
-   **Response (201 Created)**: The new Department object.

### `PATCH /org-structure/departments/{departmentId}`

Updates a department (e.g., move to another division, change manager).

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "divisionId": "div-2",
      "managerId": "emp-5"
    }
    ```
-   **Response (200 OK)**: The updated Department object.

---

## 7. Processes

Endpoints for business process management.

### `GET /processes`

Retrieves a list of all business processes.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**: Array of Process summary objects.

### `GET /processes/{processId}`

Retrieves the full details of a single process, including lanes and steps.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**: The full Process object.

### `PATCH /processes/{processId}`

Updates a process, its lanes, or its steps. This is a comprehensive endpoint for saving the entire process structure.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**: The full, updated Process object.
-   **Response (200 OK)**: The updated Process object.

---

## 8. Instructions

Endpoints for managing instructional documents.

### `GET /instructions`

Retrieves a list of all instructions the user has access to.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**: Array of Instruction objects.

### `POST /instructions`

Creates a new instruction.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "title": "How to file an expense report",
      "content": "<p>Start here...</p>",
      "department": "Div 3 - Казначейство / Фінанси"
    }
    ```
-   **Response (201 Created)**: The new Instruction object.

### `PATCH /instructions/{instructionId}`

Updates an instruction's content, title, or access list.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "content": "<p>Updated content...</p>",
      "accessList": [
        { "userId": "user-1", "access": "edit" }
      ]
    }
    ```
-   **Response (200 OK)**: The updated Instruction object.

---

## 9. Telegram Groups

Endpoints for linking and managing Telegram groups.

### `GET /telegram/groups`

Lists all Telegram groups linked to the company.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**: Array of Group objects.

### `POST /telegram/groups/link`

Links a new Telegram group using a code from the bot.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Request Body**:
    ```json
    {
      "linkCode": "123456"
    }
    ```
-   **Response (200 OK)**: The newly linked Group object.

### `GET /telegram/groups/{groupId}/members`

Fetches members of a specific Telegram group.

-   **Headers**: `Authorization: Bearer <your_jwt_auth_token>`
-   **Response (200 OK)**: Array of Telegram member objects, including their link status to company employees.
```

## Data Models

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
  "assigneeId": "string",
  "reporterId": "string",
  "resultId": "string"
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
  "assigneeId": "string",
  "reporterId": "string",
  "description": "string",
  "expectedResult": "string",
  "subResults": [ { "id": "string", "name": "string", "completed": "boolean" } ]
}
```
