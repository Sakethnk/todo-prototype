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

Testing command and also get command it will give all todos
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












