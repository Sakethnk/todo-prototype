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

Testing command
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

Look at this:

pool

and:

repository

They are not the same thing.

pool

Comes from the pg library.

Its job: Talk to PostgreSQL.

repository
We created it ourselves.
Its job: Provide Todo-specific database operations.

So:

                PostgreSQL
                    ↑
                    │
                   pool
                    ↑
                    │
             TodoRepository
                    ↑
                    │
              TodoService


Now our confusing line becomes easy

We wrote:

async getAll(): Promise<TodoDto[]> {
  const result = await pool.query(`
    SELECT *
    FROM todo
  `);

  return result.rows;
}

This code is inside TodoRepository.

So:
```
TodoRepository
      │
      │ uses
      ↓
     pool
      │
      │ communicates with
      ↓
 PostgreSQL
 ```

The Repository says:

"I need all Todos. I'll ask pool to execute the SQL."

**Then why do we call repository.getAll()?**

Because another layer shouldn't need to know SQL.

Our Service doesn't want to do this:

pool.query("SELECT * FROM todo");

Instead, the Service says:

repository.getAll()

That's much cleaner.

So:
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

