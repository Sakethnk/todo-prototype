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

API LEVEL

API commands 

Testing command
Invoke-RestMethod http://localhost:3000/dev/todos


POST method 
Invoke-RestMethod `
   -Method Post `
   -Uri http://localhost:3000/dev/todo `
   -ContentType "application/json" `
   -Body '{"title":"Build React UI","description":"Create the Todo frontend","status":0}'

```
GET request 
Invoke-RestMethod http://localhost:3000/dev/todo/2
Invoke-RestMethod     → make an HTTP request
localhost:3000       → your local Serverless API
/dev                  → development stage
/todo/2              → get Todo whose id = 2
```






q- Invoke-RestMethod http://localhost:3000/dev/todos -- is this testing command !?
A- yes 
`Invoke-RestMethod http://localhost:3000/dev/todos` is a **PowerShell command we used to test your backend API**.

Let's break it down:

```powershell
Invoke-RestMethod http://localhost:3000/dev/todos
```

### 1. `Invoke-RestMethod`

This is a built-in **PowerShell command for making HTTP requests**.

Think of it roughly as:

> "Go to this API URL and give me the response."

It is similar to using `curl` or opening an API URL in a browser, but PowerShell also parses JSON responses into objects.

---

### 2. `http://localhost:3000`

This means:

* `http://` → use HTTP
* `localhost` → **your own computer**
* `3000` → the port where **Serverless Offline** is running

Remember when we started:

```powershell
pnpm exec serverless offline
```

It told us:

```text
Server ready: http://localhost:3000
```

So this is talking to the API running on your computer.

---

### 3. `/dev/todos`

This is the API route we defined in `serverless.yml`:

```yaml
getTodos:
  handler: dist/handlers/get-todos.handler
  events:
    - http:
        path: todos
        method: get
```

Serverless Offline adds the `/dev` stage prefix, so the actual local URL becomes:

```text
http://localhost:3000/dev/todos
```

And because the HTTP method is `GET`, we're asking:

> **"Give me all the Todos."**

---

### What actually happens

When you run:

```powershell
Invoke-RestMethod http://localhost:3000/dev/todos
```

the flow is:

```text
PowerShell
    │
    │ GET /dev/todos
    ▼
Serverless Offline
    │
    ▼
get-todos Lambda handler
    │
    ▼
GetTodosQuery
    │
    ▼
TodoService.getAll()
    │
    ▼
TodoRepository.getAll()
    │
    ▼
PostgreSQL
    │
    ▼
Todo records
    │
    ▼
PowerShell displays them
```

That's why we get:

```text
id          : 1
title       : Learn TypeScript
description : Build the Todo prototype
status      : 0
```

and later our newly created Todo with `id : 2`.

### Why did we use it?

**To prove that the backend actually works before building the React frontend.**

Eventually, React will make essentially the same HTTP request. Instead of:

```text
PowerShell → GET /dev/todos
```

we'll have:

```text
React → Axios → GET /dev/todos
```

So the PowerShell command was our **manual API test**. Once React is built, you won't normally need to type that command yourself.

**Important key Relationship**
```text 
### pool
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


5. Now our confusing line becomes easy

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

**Why don't we just use the class directly?**

This is an important question.

You cannot normally do:

TodoRepository.getAll();

because getAll() is an instance method.

It belongs to an object created from the class.

We first create:

const repository = new TodoRepository();

Then:

repository.getAll();
