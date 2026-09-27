import type { APIGatewayProxyHandler } from "aws-lambda";
import { TodoRepository } from "../repositories/todo.repository.js";
import { TodoService } from "../services/todo.service.js";
import { GetTodoQuery } from "../queries/get-todo.query.js";

const repository = new TodoRepository();
const service = new TodoService(repository);
const query = new GetTodoQuery(service);

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = Number(event.pathParameters?.id);

  if (!Number.isInteger(id)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid todo id"
      })
    };
  }

  const todo = await query.execute(id);

  if (todo === null) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Todo not found"
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(todo)
  };
};