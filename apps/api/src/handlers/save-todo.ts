import type { APIGatewayProxyHandler } from "aws-lambda";
import { TodoStatus } from "@todo/shared";
import { TodoRepository } from "../repositories/todo.repository.js";
import { TodoService } from "../services/todo.service.js";
import {
  SaveTodoCommand,
  type SaveTodoCommandInput
} from "../commands/save-todo.command.js";

const repository = new TodoRepository();
const service = new TodoService(repository);
const command = new SaveTodoCommand(service);

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Request body is required"
      })
    };
  }

  const body = JSON.parse(event.body) as SaveTodoCommandInput;

  const todo = await command.execute({
    ...body,
    status: body.status ?? TodoStatus.Pending
  });

  return {
    statusCode: 200,
    body: JSON.stringify(todo)
  };
};