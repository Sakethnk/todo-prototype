import type { APIGatewayProxyHandler } from "aws-lambda";
import { TodoRepository } from "../repositories/todo.repository.js";
import { TodoService } from "../services/todo.service.js";
import { GetTodosQuery } from "../queries/get-todos.query.js";

const repository = new TodoRepository();
const service = new TodoService(repository);
const query = new GetTodosQuery(service);

export const handler: APIGatewayProxyHandler = async () => {
  const todos = await query.execute();

  return {
    statusCode: 200,
    body: JSON.stringify(todos)
  };
};