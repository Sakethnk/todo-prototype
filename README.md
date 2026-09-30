# todo-prototype
A two - week fullstack , getting hands on and all 


## BACKEND
PostgreSQL database ✅
Shared TypeScript package ✅
DTO / enum / Zod schema ✅
Repository + parameterized SQL ✅
Service layer ✅
CQRS command/query layer ✅
Serverless Lambda handlers ✅
Serverless Offline ✅
GET /todos ✅
GET /todo/:id ✅
POST /todo ✅

## API LEVEL

`API commands` 

`Testing command` and also `get command` it will give all todos
`Invoke-RestMethod http://localhost:3000/dev/todos`

```
POST method 
Invoke-RestMethod `
   -Method Post `
   -Uri http://localhost:3000/dev/todo `
   -ContentType "application/json" `
   -Body '{"title":"Build React UI","description":"Create the Todo frontend","status":0}'
```
```
GET request 
Invoke-RestMethod http://localhost:3000/dev/todo/2
Invoke-RestMethod     → make an HTTP request
localhost:3000       → your local Serverless API
/dev                  → development stage
/todo/2              → get Todo whose id = 2
```
---
```
                 USER REQUEST
                      ↓
                 ┌─────────┐
                 │ HANDLER │
                 └────┬────┘
                      ↓
                 ┌─────────┐
                 │ SERVICE │
                 └────┬────┘
                      ↓
               ┌──────────────┐
               │  REPOSITORY  │
               └──────┬───────┘
                      ↓
                   ┌──────┐
                   │ POOL │
                   └──┬───┘
                      ↓
                ┌───────────┐
                │ PostgreSQL│
                └───────────┘

```
```
HANDLER
"What did the user request?"

        ↓

QUERY / COMMAND
"What operation are we performing?"

        ↓

SERVICE
"What should the application do?"

        ↓

REPOSITORY
"How do I access the data?"

        ↓

POOL
"How do I communicate with PostgreSQL?"

        ↓

DATABASE
"Here is the data."
```

## Understanding the complete Tracing of `GET /todos` request for Undersanding `backend architecture`
# Request ennters the Handler
`GET http://localhost:3000/dev/todos`
serverless sees 
```
Yaml-

getTodos:
  handler: dist/handlers/get-todos.handler
  events:
    - http:
        path: todos
        method: get
```
So Serverless says: “A GET request came to /todos. I need to run get-todos.handler.”
our handler contains 
```
export const handler: APIGatewayProxyHandler = async () => {
  const todos = await query.execute();

  return {
    statusCode: 200,
    body: JSON.stringify(todos)
  };
};
```
# 🔄 The Handler's Responsibility

At this layer, the **Handler** has one single job: **Receive the HTTP request and trigger the operation.**

*   It **does not** know how PostgreSQL works.
*   It **does not** write raw SQL.
*   It **does not** directly fetch the data from the database.

Instead, it delegates the work by acting like a manager:

```typescript
const todos = await query.execute();
```

> 🗣️ **In plain English:** 
> *"Hey Query object, I don't care how you do it behind the scenes, but please perform the operation that gets all Todos for me right now."*

### Now look at the three objects created above the handler

Yoyu have 

```javascript
const repository = new TodoRepository();
const service = new TodoService(repository);
const query = new GetTodosQuery(service);
```
Don't try to understand all three yet.

Just understand this:
```
handler
   ↓
query
```

Because the **handler** has direct access to the `query` object, it can trigger the application logic by executing it directly:

```javascript
query.execute();
```
### Request Flow Architecture

Inside `get-todos.ts`, the query is initialized and executed:

```typescript
const query = new GetTodosQuery(service);
```

and then:

```typescript
const todos = await query.execute();
```

Initially, the high-level flow looks like this:

```text
GET /todos
   ↓
get-todos.ts
   ↓
query.execute()
```

---

### Diving Deeper: What does `query.execute()` actually do?

If you open `apps/api/src/queries/get-todos.query.ts`, you will find the following code:

```typescript
export class GetTodosQuery {
  constructor(private readonly todoService: TodoService) {}

  async execute() {
    return this.todoService.getAll();
  }
}
```

The core line of execution is:
```typescript
return this.todoService.getAll();
```

Essentially, the **Query** layer tells the lower layer: *“Service, give me all the Todos.”*

---

### Execution Chain for now

```text
GET /todos
   ↓
get-todos.ts
   ↓
GetTodosQuery.execute()
   ↓
TodoService.getAll()
```
What is the main job of GetTodosQuery here? 

it is asking the Service to perform the “get all Todos” operation

### The Service Layer

If you mentally open `apps/api/src/services/todo.service.ts`, the relevant code looks like this:

```typescript
async getAll(): Promise<TodoDto[]> {
  return this.repository.getAll();
}
```

This layer keeps implementation details abstract and highly organized. 

1. The **Service** receives the request from the **Query**: `this.todoService.getAll()`
2. The **Service** then delegates the data fetching downward: *“Repository, get all the Todo data for me.”*

```typescript
return this.repository.getAll();
```

#### ⚠️ Crucial Architectural Note
The **Service does NOT write raw SQL**. You will not see database queries like `SELECT * FROM todo` here. It strictly delegates database access logic to the **Repository** layer.

---

### Layer Responsibilities Breakdown

The architecture divides concerns across three clear phases:

```text
Query
  ↓  "What operation do we want?"
Service
  ↓  "What should the application do? hey repository get me todos"
Repository
  ↓  "How do we get the data from the database? and give that to service layer"
```

For this specific `GET /todos` request, the concrete chain maps out as:

```text
GetTodosQuery
      ↓
TodoService
      ↓
TodoRepository
```

The exact line execution connecting the Service to the Repository is:
```typescript
return this.repository.getAll();
```

---
### The Repository Layer

We left off at the Service layer with this method:

```typescript
async getAll(): Promise<TodoDto[]> {
  return this.repository.getAll();
}
```

The pivotal part here is `this.repository.getAll()`. Let's break down exactly what this execution context represents:
* `this` refers to the **current instance of the Service object**.
* `this.repository` refers to the **Repository object injected into this Service** when it was instantiated.

Earlier during initialization, the handler executed the following setup:

```typescript
const repository = new TodoRepository();
const service = new TodoService(repository);
```

Conceptually, the dependency injections maps like this:

```text
repository object
      ↓
   given to
      ↓
 service object
```

Therefore, inside the Service layer, `this.repository` points directly to that exact `TodoRepository` instance. Calling `this.repository.getAll()` triggers the execution of the Repository's native `getAll()` method.

---

### The Extended Execution Chain

Our data flow lifecycle is now significantly longer as it reaches the data access boundary:

```text
GET /todos
   ↓
get-todos.ts
   ↓
GetTodosQuery.execute()
   ↓
TodoService.getAll()
   ↓
TodoRepository.getAll()
```

---

### Where the SQL Lives

We have finally reached the layer where raw database queries appear. Inside the **Repository**, you will find:

```typescript
const result = await pool.query(`
  SELECT
    id,
    title,
    description,
    status,
    created_date AS "createdDate",
    updated_date AS "updatedDate"
  FROM todo
  ORDER BY id
`);
```

Don't worry about dissecting the specific SQL syntax yet. The vital takeaway here is the invocation of `pool.query(...)`. 

The Repository is communicating directly with your database infrastructure: *“Pool, execute this raw SQL against the PostgreSQL database.”*
### Connecting the Repository to PostgreSQL

We have now reached the absolute core connection of our data architecture: **Repository → Pool → PostgreSQL**.

---
**Important key Relationship**
```text 
pool
= database communication tool

repository
= our Todo database-access class

repository.getAll()
= "TodoRepository, give me all Todos"

pool.query()
= "database connection, execute this SQL"
```
```
Service
   │
   │ "Give me all Todos"
   ↓
Repository
   │
   │ "I'll handle the database details"
   ↓
pool
   │
   │ SQL
   ↓
PostgreSQL

```
This is the Repository Pattern from our POC.

**important flow charts**

```
TodoRepository
     │
     │ class / blueprint
     ↓
new TodoRepository()
     │
     │ creates
     ↓
repository
     │
     │ object / instance
     ↓
repository.getAll()
```
```
service → calls repository
repository → calls pool
pool → talks to database

```
```
const repository = new TodoRepository();
const service = new TodoService(repository);

Create Repository
      ↓
Give Repository to Service
      ↓
Now Service can use Repository

```

### What is `pool.query()` actually doing?

To understand how data leaves our application and enters the database, look at the execution block inside your Repository:

```typescript
const result = await pool.query(`
  SELECT
    id,
    title,
    description,
    status,
    created_date AS "createdDate",
    updated_date AS "updatedDate"
  FROM todo
  ORDER BY id
`);
```

Let's break this down into its two atomic components: **`pool`** and **`query()`**.

#### 1. The `pool`
The `pool` instance is imported directly from the Node-Postgres (`pg`) library package:

```typescript
const { Pool } = pg;

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "todo",
  user: "postgres",
  password: process.env.DB_PASSWORD
});
```

Think of the `pool` as your application's central **connection manager for PostgreSQL**. It securely encapsulates the connection configuration strings, network sockets, and credentials needed to authenticate with your running PostgreSQL instance.

#### 2. The `query()` Method
The execution of `pool.query(...)` instructs the connection pool to pick up an open connection and **execute the given SQL query directly inside PostgreSQL**.

Adding the `await` keyword explicitly handles the network lag: 
> *“Send this SQL query over the network interface to PostgreSQL, pause execution, and wait until PostgreSQL compiles, processes, and returns the result dataset.”*

---

### The End-to-End Lifecycle Chain

Our fully traced network and application architecture now looks like this:

```text
GET /todos
   ↓
Handler
   ↓
Query
   ↓
Service
   ↓
Repository
   ↓
pool.query()
   ↓
PostgreSQL
```

---

### 🔑 Key Definitions to Remember

Here is the complete breakdown of every layer in our architecture, ordered from the initial incoming request down to the actual database:

| Component | Responsibility | Role in the Ecosystem |
| :--- | :--- | :--- |
| **Handler** | The entry point for the web request (`GET /todos`) | Receives the HTTP request, invokes the query, and formats the final HTTP response (e.g., status 200). |
| **Query** | Defines *what* specific action or data operation we want | Acts as a clean command layer that passes the execution intent down to the application services. |
| **Service** | Defines *how* the application handles business logic | Orchestrates the operational rules of the app without knowing how data is stored or written in SQL. |
| **Repository** | Our application's custom database-access class | Formulates the business data requirements and houses the raw SQL statements. |
| **Pool** | PostgreSQL communication tool provided by `pg` | Manages network sockets, maintains persistent connections, and ships the SQL requests over the wire. |
| **PostgreSQL** | The external database storage server | Processes the raw SQL, reads the physical data tables, and returns the requested data records. |
---
### PostgreSQL Sends the Data Back

Once PostgreSQL processes the query, the data starts its journey back up through our application layers. It begins where we captured the execution reference:

```typescript
const result = await pool.query(`SELECT ...`);
```

After executing the SQL, `pool.query()` resolves and yields a **query result object**. 

#### The Promise Resolution Lifecycle
Recalling how asynchronous promises operate under the hood:

```text
pool.query(...)
      ↓
Promise<QueryResult>
      ↓  [await]
   result
```

---

### Extracting the Dataset: `result.rows`

Immediately after obtaining the query result object, the Repository performs a data extraction step:

```typescript
return result.rows;
```

#### What is `result.rows`?
It is a native JavaScript array containing the raw database records fetched by PostgreSQL. Conceptually, the internal dataset resembles this structure:

```json
[
  {
    "id": 1,
    "title": "Learn TypeScript",
    "description": "Build the Todo prototype",
    "status": 0,
    "createdDate": "2026-09-30T12:00:00.000Z",
    "updatedDate": "2026-09-30T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Build React UI",
    "description": "Create the Todo frontend",
    "status": 0,
    "createdDate": "2026-09-30T12:05:00.000Z",
    "updatedDate": "2026-09-30T12:05:00.000Z"
  }
]
```

Executing `return result.rows;` translates to: 
> *“Extract the structured array of records that PostgreSQL compiled, and hand them directly back to whichever layer invoked this Repository method.”*

---

### The Upward Data Travel Flow

The service layer originally invoked the repository, meaning the data begins climbing back up our structural chain:

```text
PostgreSQL
   ↓
pool.query()
   ↓
result
   ↓
result.rows
   ↓
TodoRepository.getAll()
   ↓
TodoService.getAll()
```

Because our Service signature explicitly implements type safety rules:

```typescript
async getAll(): Promise<TodoDto[]> {
  return this.repository.getAll();
}
```

The data successfully escapes the database layer fully mapped as a typed array of Data Transfer Objects: **`TodoDto[]`**.


entire downward journey:
```
GET /todos
   ↓
Handler
   ↓
Query
   ↓
Service
   ↓
Repository
   ↓
pool.query()
   ↓
PostgreSQL
```

And PostgreSQL's data comes back upward:
```
PostgreSQL
   ↓
pool.query()
   ↓
result
   ↓
result.rows
   ↓
Repository
   ↓
Service
   ↓
Query
   ↓
Handler
```
You're right. Here is the **entire raw Markdown in one single block**, with no separation:


# Complete `GET /todos` Journey

Starting from the browser/client:

## 1. Handler receives the request

```http
GET /todos
```

 The Handler calls:

```
const todos = await query.execute();
```

 The Handler says:

 > “I need all Todos.”

 ↓

 ## 2\. Query

```
return this.todoService.getAll();
```

 The Query says:

 > “Service, perform the get-all operation.”

 ↓

 ## 3\. Service

```
return this.repository.getAll();
```

 The Service says:

 > “Repository, get the Todo data.”

 ↓

 ## 4\. Repository

```
const result = await pool.query(`
  SELECT ...
  FROM todo
  ORDER BY id
`);
```

 The Repository says:

 > “Pool, execute this SQL.”

 ↓

 ## 5\. Pool

```
pool.query(...)
```

 The Pool communicates with PostgreSQL.

 ↓

 ## 6\. PostgreSQL

 PostgreSQL executes:

```
SELECT ...
FROM todo
ORDER BY id;
```

 and returns the records.

 ↓

 ## 7\. Repository receives the result

```
const result = await pool.query(...);
```

 `await` converts:

```
Promise<QueryResult>
```

 into:

```
QueryResult
```

 Then:

```
return result.rows;
```

 gives us:

```
TodoDto[]
```

 ↓

 ## 8\. Data travels back

```
PostgreSQL
    ↓
pool.query()
    ↓
Repository
    ↓
Service
    ↓
Query
    ↓
Handler
```

 ↓

 ## 9\. Handler creates HTTP response

```
return {
  statusCode: 200,
  body: JSON.stringify(todos)
};
```

 So the client receives the Todo list.

---

 # 🔑 The One Diagram to Remember

 Don't memorize every filename yet.

 Remember this:

```
             REQUEST
                ↓
             HANDLER
                ↓
              QUERY
                ↓
             SERVICE
                ↓
           REPOSITORY
                ↓
               POOL
                ↓
           POSTGRESQL
                ↓
              DATA
                ↑
         result.rows
```

 ## In Simple Words

```
Client
  ↓
"Give me all Todos"
  ↓
Handler
  ↓
Query
  ↓
Service
  ↓
Repository
  ↓
Pool
  ↓
PostgreSQL
  ↓
Todo records
  ↓
Repository
  ↓
Service
  ↓
Query
  ↓
Handler
  ↓
HTTP 200 + JSON
  ↓
Client
```

 ## Key Idea

 > **The request goes down through the layers to get the data, and the data comes back up through the same layers to reach the client.**
---
One important distinction

For a GET:

Handler → Query → Service → Repository

For a POST/save:

Handler → Command → Service → Repository

Because:
```
Query → reading data
Command → changing/saving data
```

Everything underneath is essentially the same:

Service → Repository → Pool → PostgreSQL

So if you remember only this, you're in a very good position:

Handler receives → Query/Command decides operation → Service handles business operation → Repository handles data access → Pool talks to DB → result comes back.

---

# AWS Lambda to PostgreSQL Integration

## 1. Overview

This project uses a serverless backend architecture based on:

- Node.js
- TypeScript
- AWS Lambda
- Serverless Framework
- Serverless Offline
- PostgreSQL
- `pg` Node.js PostgreSQL driver

The backend follows a layered architecture:

```text
HTTP Request
     |
     v
API Gateway / Serverless Offline
     |
     v
AWS Lambda Handler
     |
     v
Command / Query
     |
     v
TodoService
     |
     v
TodoRepository
     |
     v
PostgreSQL Connection Pool
     |
     v
PostgreSQL Database
```

The important point is that **AWS Lambda does not directly execute SQL by itself**.

Lambda runs our TypeScript/JavaScript application code. Our application uses the `pg` package to communicate with PostgreSQL.

---

# 2. What is AWS Lambda?

AWS Lambda is a serverless compute service.

Instead of running a backend server continuously, we provide AWS with a function that AWS can execute when an event occurs.

For example:

```text
GET /todos
```

can trigger a Lambda function:

```text
getTodos
```

The Lambda function eventually executes our handler:

```ts
export const handler = async () => {
    ...
};
```

In this project, the handler is:

```text
apps/api/src/handlers/get-todos.ts
```

The basic idea is:

```text
HTTP Request
     |
     v
AWS Lambda
     |
     v
handler()
```

Lambda provides the execution environment.

Our application code provides the actual logic.

---

# 3. Where is Lambda defined in this project?

The Lambda functions are configured in:

```text
apps/api/serverless.yml
```

For example:

```yaml
functions:
  saveTodo:
    handler: dist/handlers/save-todo.handler
    events:
      - http:
          path: todo
          method: post

  getTodo:
    handler: dist/handlers/get-todo.handler
    events:
      - http:
          path: todo/{id}
          method: get

  getTodos:
    handler: dist/handlers/get-todos.handler
    events:
      - http:
          path: todos
          method: get
```

This configuration tells Serverless:

```text
Function name
      |
      v
saveTodo
      |
      v
Lambda handler
      |
      v
dist/handlers/save-todo.handler
```

Similarly:

```text
getTodo
    -> dist/handlers/get-todo.handler

getTodos
    -> dist/handlers/get-todos.handler
```

---

# 4. What does `serverless.yml` actually do?

`serverless.yml` is a configuration file for the Serverless Framework.

It describes things such as:

* Cloud provider
* Runtime
* Region
* Lambda functions
* HTTP routes
* Environment variables
* Plugins
* Deployment configuration

Our configuration contains:

```yaml
provider:
  name: aws
  runtime: nodejs20.x
  region: ap-south-1
```

This means that the intended deployment target is:

```text
Cloud Provider: AWS
Runtime: Node.js 20
Region: ap-south-1
```

The `functions` section defines the Lambda functions.

---

# 5. Did this project actually deploy Lambda to AWS?

Not yet.

During development, this project uses:

```text
Serverless Offline
```

We start it with:

```powershell
pnpm exec serverless offline
```

This starts a local environment that allows us to test the Lambda/API architecture without deploying the functions to AWS.

Therefore, our current development architecture is:

```text
PowerShell / Browser
        |
        v
localhost:3000
        |
        v
Serverless Offline
        |
        v
Lambda-style Handler
        |
        v
Application Layers
        |
        v
Local PostgreSQL
```

This is different from the final AWS deployment architecture.

---

# 6. Current Local Architecture

During development, the actual architecture is:

```text
Client
  |
  | HTTP Request
  v
localhost:3000
  |
  v
Serverless Offline
  |
  v
Lambda Handler
  |
  v
Query / Command
  |
  v
TodoService
  |
  v
TodoRepository
  |
  v
pg Pool
  |
  v
PostgreSQL
  |
  v
todo database
```

For example:

```text
GET http://localhost:3000/dev/todos
```

is handled locally.

Serverless Offline identifies the route:

```text
GET /todos
```

and invokes:

```text
getTodos
```

which executes:

```text
get-todos.handler
```

---

# 7. How does Lambda communicate with PostgreSQL?

This is the most important part.

AWS Lambda itself does not know how to communicate with PostgreSQL automatically.

Our application uses the PostgreSQL Node.js driver:

```text
pg
```

We installed it in the API package:

```powershell
pnpm add pg
```

The package provides the `Pool` class.

Our project has:

```text
apps/api/src/db/pool.ts
```

with:

```ts
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "todo",
  user: "postgres",
  password: process.env.DB_PASSWORD
});
```

The connection path is:

```text
Lambda/Application Code
        |
        v
       pg
        |
        v
      Pool
        |
        v
 PostgreSQL Protocol
        |
        v
 PostgreSQL Server
```

---

# 8. What is `pg`?

`pg` is a Node.js PostgreSQL client library.

It allows our Node.js application to communicate with PostgreSQL.

Without a PostgreSQL driver, our Lambda application would not know how to send PostgreSQL queries.

Conceptually:

```text
TypeScript / JavaScript
        |
        v
       pg
        |
        v
PostgreSQL connection
```

---

# 9. What is the PostgreSQL Pool?

We create a connection pool:

```ts
const { Pool } = pg;

export const pool = new Pool({
    ...
});
```

The pool manages database connections for our application.

Instead of manually opening and closing a new database connection for every query, the pool manages reusable connections.

Our Repository can then execute:

```ts
pool.query(...)
```

For example:

```ts
const result = await pool.query(`
    SELECT
        id,
        title,
        description,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate"
    FROM todo
    ORDER BY id
`);
```

The flow is:

```text
Repository
    |
    v
pool.query()
    |
    v
PostgreSQL
    |
    v
Query Result
```

---

# 10. How does the connection know which PostgreSQL database to use?

The Pool configuration contains:

```ts
export const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "todo",
  user: "postgres",
  password: process.env.DB_PASSWORD
});
```

Each property has a purpose:

| Property   | Meaning                    |
| ---------- | -------------------------- |
| `host`     | PostgreSQL server address  |
| `port`     | PostgreSQL network port    |
| `database` | Database to connect to     |
| `user`     | PostgreSQL user            |
| `password` | PostgreSQL user's password |

For local development:

```text
host = localhost
port = 5432
database = todo
```

This means:

> Connect to the PostgreSQL server running on my own computer, using the `todo` database.

---

# 11. Where does the PostgreSQL database come from?

PostgreSQL was installed separately on the development machine.

The PostgreSQL installation is not part of the TypeScript project itself.

The project communicates with the PostgreSQL installation.

The local setup is:

```text
Windows Computer
    |
    +-------------------------+
    |                         |
    v                         v
Todo Prototype            PostgreSQL
    |                         |
    |                         |
    +------ database ---------+
```

The PostgreSQL installation contains the database server.

Our Node.js API connects to that server using `pg`.

---

# 12. Creating the PostgreSQL Database

The database was created using PostgreSQL's command-line client:

```powershell
psql -U postgres
```

Then:

```sql
CREATE DATABASE todo;
```

After creating it:

```sql
\c todo
```

This connects to the `todo` database.

The Todo table was then created:

```sql
CREATE TABLE todo (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(250) NOT NULL,
    status INT NOT NULL DEFAULT 0,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

The database structure is therefore:

```text
PostgreSQL Server
      |
      v
    todo
   Database
      |
      v
    todo
    Table
      |
      +---- id
      +---- title
      +---- description
      +---- status
      +---- created_date
      +---- updated_date
```

---

# 13. Complete GET Request Flow

Let's trace the actual:

```http
GET /todos
```

request.

## Step 1 — Client

The client sends:

```http
GET /todos
```

During local development:

```text
http://localhost:3000/dev/todos
```

---

## Step 2 — Serverless Offline

Serverless Offline receives the HTTP request.

It checks `serverless.yml`:

```yaml
getTodos:
  handler: dist/handlers/get-todos.handler
  events:
    - http:
        path: todos
        method: get
```

It determines:

```text
GET /todos
     |
     v
getTodos Lambda
     |
     v
get-todos.handler
```

---

## Step 3 — Lambda Handler

The handler is:

```ts
export const handler: APIGatewayProxyHandler = async () => {
    const todos = await query.execute();

    return {
        statusCode: 200,
        body: JSON.stringify(todos)
    };
};
```

The handler delegates the operation to:

```ts
query.execute()
```

---

## Step 4 — Query

The query contains:

```ts
export class GetTodosQuery {
    constructor(private readonly todoService: TodoService) {}

    async execute() {
        return this.todoService.getAll();
    }
}
```

So:

```text
Query
  |
  v
TodoService.getAll()
```

---

## Step 5 — Service

The Service contains:

```ts
async getAll(): Promise<TodoDto[]> {
    return this.repository.getAll();
}
```

So:

```text
Service
   |
   v
Repository.getAll()
```

---

## Step 6 — Repository

The Repository executes:

```ts
const result = await pool.query(`
    SELECT
        id,
        title,
        description,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate"
    FROM todo
    ORDER BY id
`);
```

Now the application has reached the database layer.

---

# 14. PostgreSQL Executes the SQL

PostgreSQL receives:

```sql
SELECT
    id,
    title,
    description,
    status,
    created_date AS "createdDate",
    updated_date AS "updatedDate"
FROM todo
ORDER BY id;
```

PostgreSQL searches the `todo` table.

It returns the matching records.

Conceptually:

```text
PostgreSQL
    |
    v
Rows
```

---

# 15. The Result Comes Back to Node.js

The `pg` library returns a query result.

We store it:

```ts
const result = await pool.query(...);
```

Then:

```ts
result.rows
```

contains the returned records.

For example:

```ts
[
  {
    id: 1,
    title: "Learn TypeScript",
    description: "Build the Todo prototype",
    status: 0
  },
  {
    id: 2,
    title: "Build React UI",
    description: "Create the Todo frontend",
    status: 0
  }
]
```

The Repository returns:

```ts
return result.rows;
```

---

# 16. Data Travels Back Up the Application

The return path is:

```text
PostgreSQL
    |
    v
pg Pool
    |
    v
Repository
    |
    v
Service
    |
    v
Query
    |
    v
Handler
```

The Handler receives:

```ts
const todos = await query.execute();
```

Then returns:

```ts
return {
    statusCode: 200,
    body: JSON.stringify(todos)
};
```

---

# 17. Complete Local Flow

The complete flow is:

```text
                 LOCAL DEVELOPMENT

Client
  |
  | GET /todos
  v
Serverless Offline
  |
  v
Lambda Handler
  |
  v
GetTodosQuery
  |
  v
TodoService
  |
  v
TodoRepository
  |
  v
pg Pool
  |
  v
PostgreSQL
  |
  | Query Result
  v
pg Pool
  |
  v
TodoRepository
  |
  v
TodoService
  |
  v
GetTodosQuery
  |
  v
Lambda Handler
  |
  v
HTTP Response
  |
  v
Client
```

---

# 18. What Changes When We Deploy to AWS?

The application layers remain mostly the same.

The major difference is the infrastructure surrounding them.

### Local development

```text
Client
  |
  v
localhost
  |
  v
Serverless Offline
  |
  v
Lambda-style execution
  |
  v
Node.js Application
  |
  v
Local PostgreSQL
```

### AWS deployment

```text
Client
  |
  v
API Gateway
  |
  v
AWS Lambda
  |
  v
Node.js Application
  |
  v
pg Pool
  |
  v
Remote PostgreSQL
```

The important point is:

> **Lambda does not replace PostgreSQL. Lambda runs the application code, while PostgreSQL remains the database.**

---

# 19. How Would AWS Lambda Connect to PostgreSQL?

For a real AWS deployment, PostgreSQL must be reachable from the Lambda environment.

A typical AWS architecture could be:

```text
                         AWS CLOUD
                              |
                              v
                       API Gateway
                              |
                              v
                        AWS Lambda
                              |
                              v
                         Node.js
                              |
                              v
                            pg
                              |
                              v
                       PostgreSQL
```

If PostgreSQL is hosted inside AWS, a common architecture is:

```text
                         AWS CLOUD

                        API Gateway
                              |
                              v
                         AWS Lambda
                              |
                              v
                         VPC Network
                              |
                              v
                      Amazon RDS PostgreSQL
```

The Lambda function needs network access to the PostgreSQL database.

The database connection configuration would use the database's network hostname rather than:

```text
localhost
```

For example:

```ts
const pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});
```

The exact networking configuration depends on where PostgreSQL is hosted.

---

# 20. Why `localhost` is Important

Our current code contains:

```ts
host: "localhost"
```

This works because PostgreSQL is running on the same development machine.

But if Lambda runs in AWS:

```text
Lambda
```

and PostgreSQL is on your personal computer:

```text
Your PC
```

then:

```text
localhost
```

inside Lambda means:

> **the Lambda execution environment itself**

It does NOT mean your personal computer.

Therefore this would not work in production:

```text
AWS Lambda
   |
   | localhost:5432
   X
Your PC PostgreSQL
```

For production, PostgreSQL needs to be hosted somewhere reachable by the Lambda environment.

---

# 21. Environment Variables

The database password should not be hardcoded into source code.

Our project uses:

```ts
password: process.env.DB_PASSWORD
```

and `serverless.yml` contains:

```yaml
provider:
  environment:
    DB_PASSWORD: ${env:DB_PASSWORD}
```

This means:

```text
Operating System Environment
          |
          v
      DB_PASSWORD
          |
          v
   Serverless Framework
          |
          v
     Lambda environment
          |
          v
      Node.js code
          |
          v
      process.env.DB_PASSWORD
```

This keeps the password outside the source code.

Sensitive credentials should never be committed to GitHub.

---

# 22. Why use a Connection Pool?

A Lambda function can receive many requests.

Creating a completely new database connection for every query can be inefficient.

A connection pool allows the application to manage database connections.

Conceptually:

```text
Lambda
  |
  v
Connection Pool
  |
  +---- Connection 1
  |
  +---- Connection 2
  |
  +---- Connection 3
  |
  v
PostgreSQL
```

The exact number of connections depends on the configuration and deployment environment.

In serverless architectures, database connection management requires additional care because Lambda can create multiple concurrent execution environments.

---

# 23. Important Security Considerations

A production implementation should consider:

### Credentials

Do not commit:

```text
DB_PASSWORD
```

to Git.

Use:

* AWS Secrets Manager
* AWS Systems Manager Parameter Store
* environment variables
* another secure secret-management mechanism

depending on the deployment architecture.

### Network access

The database should not simply be exposed publicly without appropriate security controls.

For AWS-hosted PostgreSQL, network security can involve:

```text
VPC
Security Groups
Private Subnets
RDS
Lambda networking
```

### SQL Injection

The Repository uses parameterized queries for values.

For example:

```ts
WHERE id = $1
```

and:

```ts
[id]
```

instead of directly constructing SQL with user input.

This is an important security practice.

---

# 24. The Most Important Mental Model

The easiest way to understand the complete system is:

```text
                APPLICATION

        Lambda runs our code
                 |
                 v
              Handler
                 |
                 v
          Query / Command
                 |
                 v
              Service
                 |
                 v
            Repository
                 |
                 v
              pg Pool
                 |
                 v
             PostgreSQL
```

So:

```text
Lambda
  =
"Where our backend code executes"

pg
  =
"How our Node.js code talks to PostgreSQL"

PostgreSQL
  =
"Where our actual Todo data is stored"
```

These are three different responsibilities.

---

# 25. Current Project vs Production Project

## Current project

```text
                    LOCAL PC

Client
  |
  v
Serverless Offline
  |
  v
Lambda-style Handler
  |
  v
Application
  |
  v
pg
  |
  v
Local PostgreSQL
```

This is what has currently been implemented and tested.

## Intended AWS deployment

```text
                    AWS

Client
  |
  v
API Gateway
  |
  v
AWS Lambda
  |
  v
Application
  |
  v
pg
  |
  v
Reachable PostgreSQL
(e.g. Amazon RDS PostgreSQL)
```

The application code and architecture are designed so that the execution environment can move from local Serverless Offline to AWS Lambda.

---

# 26. Summary

The complete concept can be summarized as:

```text
Serverless Framework
        |
        | defines
        v
AWS Lambda Functions
        |
        | execute
        v
TypeScript Handler
        |
        v
Query / Command
        |
        v
Service
        |
        v
Repository
        |
        | uses
        v
pg PostgreSQL Driver
        |
        v
Connection Pool
        |
        v
PostgreSQL
```

During development:

```text
Serverless Offline
```

simulates the Lambda/API environment locally.

Therefore, the current prototype proves the application flow locally:

```text
HTTP
  ↓
Lambda-style Handler
  ↓
Application Layers
  ↓
PostgreSQL
```

A future AWS deployment would replace the local infrastructure with:

```text
API Gateway
  ↓
AWS Lambda
  ↓
Application Layers
  ↓
Reachable PostgreSQL
```

while preserving the core application architecture.

```
---












