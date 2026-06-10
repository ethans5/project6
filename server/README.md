# JSONPlaceholder Clone REST API

A simple Node.js, Express, and MySQL REST API for the supplied `users`,
`posts`, `comments`, `todos`, and `passwords` database schema.

The public API exposes `users`, `posts`, `comments`, and `todos`.
The `passwords` table is intentionally not exposed because password hashes
should never be returned or managed as a general REST resource.

## Recommended Structure

```text
project6/
├── database/
│   └── schema.sql
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── app.js
├── .env.example
├── package.json
└── server.js
```

File responsibilities:

- `server.js`: checks the database connection and starts the HTTP server.
- `src/app.js`: creates Express, loads middleware, and connects routes.
- `src/config/db.js`: creates and exports the MySQL connection pool.
- `src/routes`: defines resource URLs and HTTP methods.
- `src/controllers`: reads requests and sends consistent JSON responses.
- `src/services`: validates input and contains resource logic.
- `src/repositories`: contains all SQL database access.
- `src/middleware/errorHandler.js`: creates consistent error responses.
- `database/schema.sql`: creates the supplied database and tables.

The small `createCrud...` files hold shared CRUD behavior. Each public
resource still has its own route, controller, service, and repository file.

## Install and Run

Requirements: Node.js, MySQL, and curl.

```bash
npm install
mysql -u root -p < database/schema.sql
cp .env.example .env
```

Edit `.env` with the local MySQL username and password, then run:

```bash
npm start
```

The API starts at `http://localhost:3000`.

## Automated Tests

The automated suite starts the Express app on a temporary local port and uses
an in-memory database replacement. It tests the complete route, controller,
service, validation, and repository flow without changing the real MySQL data.

```bash
npm test
npm run test:coverage
```

## API Behavior

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Status codes:

- `200`: successful GET, PUT, or DELETE
- `201`: successful POST
- `400`: invalid input, duplicate unique value, or missing foreign key
- `404`: record or route not found
- `500`: unexpected server or database error

`PUT` accepts one or more editable fields. IDs and timestamp columns are
managed by MySQL and cannot be supplied in request bodies.

## curl Testing Guide

Run the user POST first because posts and todos require an existing `user_id`.
Run the post POST before creating a comment because comments require a
valid `post_id`. Replace IDs in later commands with IDs returned by POST.

Every successful GET, PUT, and DELETE returns status `200` and the success
response format. Every successful POST returns status `201`.

### Users

```bash
# GET all users
curl http://localhost:3000/users

# GET user 1
curl http://localhost:3000/users/1

# POST a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Leanne Graham","username":"Bret","email":"leanne@example.com"}'

# PUT user 1
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Leanne Updated"}'

# DELETE user 1
curl -X DELETE http://localhost:3000/users/1
```

### Posts

```bash
# GET all posts
curl http://localhost:3000/posts

# GET post 1
curl http://localhost:3000/posts/1

# POST a post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"title":"First post","body":"Hello from the API"}'

# PUT post 1
curl -X PUT http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated post","body":"Updated body"}'

# DELETE post 1
curl -X DELETE http://localhost:3000/posts/1
```

### Comments

```bash
# GET all comments
curl http://localhost:3000/comments

# GET comment 1
curl http://localhost:3000/comments/1

# POST a comment
curl -X POST http://localhost:3000/comments \
  -H "Content-Type: application/json" \
  -d '{"post_id":1,"name":"A response","email":"reader@example.com","body":"Nice post"}'

# PUT comment 1
curl -X PUT http://localhost:3000/comments/1 \
  -H "Content-Type: application/json" \
  -d '{"body":"Updated comment"}'

# DELETE comment 1
curl -X DELETE http://localhost:3000/comments/1
```

### Todos

```bash
# GET all todos
curl http://localhost:3000/todos

# GET todo 1
curl http://localhost:3000/todos/1

# POST a todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"title":"Finish Stage B","completed":false}'

# PUT todo 1
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# DELETE todo 1
curl -X DELETE http://localhost:3000/todos/1
```

## Adding Another Resource

To add another table such as `albums`:

1. Create `albumsRepository.js` and pass its trusted table name and selected
   columns to `createCrudRepository`.
2. Create `albumsService.js` with validation rules matching the real columns.
3. Create `albumsController.js` using `createCrudController`.
4. Create `albumsRoutes.js` using `createCrudRouter`.
5. Import and mount the route in `src/app.js`.

Only table names and columns defined by the developer are inserted into SQL.
All request values use parameterized queries.

## Assignment Checklist

- Node.js with CommonJS modules
- Express REST routes for GET, POST, PUT, and DELETE
- MySQL connection pool using `mysql2`
- Exact supplied table and column names
- Routes, controllers, services, and repositories separated
- Parameterized queries for user-supplied values
- Basic POST and PUT validation
- Consistent JSON responses and required status codes
- curl examples for every public route
- No TypeScript, ORM, authentication framework, or extra package
