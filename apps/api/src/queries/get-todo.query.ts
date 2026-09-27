import { TodoService } from "../services/todo.service.js";

export class GetTodoQuery {
  constructor(private readonly todoService: TodoService) {}

  async execute(id: number) {
    return this.todoService.get(id);
  }
}