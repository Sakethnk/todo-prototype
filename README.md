# todo-prototype
A two - week fullstack , getting hands on and all 


API commands 

GET
Invoke-RestMethod http://localhost:3000/dev/todos

POST method 
Invoke-RestMethod `
>>   -Method Post `
>>   -Uri http://localhost:3000/dev/todo `
>>   -ContentType "application/json" `
>>   -Body '{"title":"Build React UI","description":"Create the Todo frontend","status":0}'

Invoke-RestMethod http://localhost:3000/dev/todo/2
