import { TodoService } from "../services/todo.service.js";

export class GetTodosQuery {
  constructor(private readonly todoService: TodoService) {}

  async execute() {
    return this.todoService.getAll();
  }
}