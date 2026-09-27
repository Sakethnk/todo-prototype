import type { TodoStatus } from "@todo/shared";
import { TodoService } from "../services/todo.service.js";

export interface SaveTodoCommandInput {
  id?: number;
  title: string;
  description: string;
  status: TodoStatus;
}

export class SaveTodoCommand {
  constructor(private readonly todoService: TodoService) {}

  async execute(input: SaveTodoCommandInput) {
    return this.todoService.save(
      input.id,
      input.title,
      input.description,
      input.status
    );
  }
}