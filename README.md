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

*   ❌ It **does not** know how PostgreSQL works.
*   ❌ It **does not** write raw SQL.
*   ❌ It **does not** directly fetch the data from the database.

Instead, it delegates the work by acting like a manager:

```typescript
const todos = await query.execute();
```

> 🗣️ **In plain English:** 
> *"Hey Query object, I don't care how you do it behind the scenes, but please perform the operation that gets all Todos for me right now."*

### Architecture Overview

Three main components are initialized right above the handler:

```javascript
const repository = new TodoRepository();
const service = new TodoService(repository);
const query = new GetTodosQuery(service);
```

#### Core Data Flow
For now, you only need to focus on this single relationship:

\[\text{handler} \longrightarrow \text{query}\]

Because the **handler** has direct access to the `query` object, it can trigger the application logic by executing it directly:

```javascript
query.execute();
```

























