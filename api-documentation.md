# FINEKO API Documentation

This document outlines the API endpoints required for the FINEKO application to function.

**Base URL**: `https://api.tasks.fineko.space/`

## 1. Authentication

The authentication flow is based on Telegram and uses a two-token system: a short-lived temporary token for setup and a permanent token for the user session.

### `POST /auth/telegram/login`

This is the first step, called by the Next.js webhook. It receives user data from Telegram and issues a temporary JWT.

-   **Request Body**: The Telegram user object.
    ```json
    {
      "id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "language_code": "en"
    }
    ```
-   **Response (200 OK)**: A JSON object containing the temporary token.
    ```json
    {
      "tempToken": "your_temporary_jwt_token"
    }
    ```
-   **Backend Logic**:
    -   Find a user in the `users` table by `id` (Telegram User ID).
    -   If the user doesn't exist, create a new one.
    -   Generate a JWT with a very short expiration (e.g., 5 minutes) containing the internal `userId`.

---

### `GET /auth/telegram/companies`

Called by the frontend on the `/auth/telegram/callback` page to determine the user's next step.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Response (200 OK)**: An array of Company objects the user is a member of. Can be empty.
    ```json
    [
      { "id": "company-1", "name": "Fineko Development" },
      { "id": "company-2", "name": "My Startup Project" }
    ]
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid or expired.

---

### `POST /auth/telegram/select-company`

Called from the `/select-company` page. Exchanges the temporary token and a selected `companyId` for a permanent session token.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Request Body**:
    ```json
    {
      "companyId": "company-1"
    }
    ```
-   **Response (200 OK)**: The permanent token. The frontend will store this in a secure, session cookie.
    ```json
    {
      "token": "your_permanent_jwt_auth_token"
    }
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid.
-   **Response (403 Forbidden)**: If the user is not a member of the requested company.

---

### `POST /auth/telegram/create-company-and-login`

Called from the `/create-company` page for new users. Creates a company and issues a permanent session token.

-   **Headers**: `Authorization: Bearer <temporary_jwt_token>`
-   **Request Body**:
    ```json
    {
      "companyName": "My New Company"
    }
    ```
-   **Response (200 OK)**: The permanent token.
    ```json
    {
      "token": "your_permanent_jwt_auth_token"
    }
    ```
-   **Response (401 Unauthorized)**: If the temporary token is invalid.

---

### `GET /auth/me`

Retrieves the profile of the currently authenticated user using the permanent token. This should be called when the main app loads to get user context.

-   **Headers**: `Authorization: Bearer <your_permanent_jwt_auth_token>`
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

Logs out the current user by invalidating their session/token on the server side.

-   **Headers**: `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Response (204 No Content)**

---

## 2. Other Endpoints

All subsequent API endpoints for modules like Companies, Employees, Tasks, etc., must be protected and require the permanent session token.

-   **Required Header**: `Authorization: Bearer <your_permanent_jwt_auth_token>`

---

## 3. Companies

### `GET /companies`

Get a list of companies the authenticated user is a member of.

-   **Headers**: `Authorization: Bearer <your_permanent_jwt_auth_token>`
-   **Response (200 OK)**:
    ```json
    [
      { "id": "company-1", "name": "Fineko Development" },
      { "id": "company-2", "name": "My Startup Project" }
    ]
    ```

*(Other company endpoints require the permanent auth token)*

---

## 4. Employees
*(All endpoints require the permanent auth token)*

---

## 5. Tasks
*(All endpoints require the permanent auth token)*

---

## 6. Results
*(All endpoints require the permanent auth token)*
