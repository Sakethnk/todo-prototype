import type { TodoDto, TodoStatus } from "@todo/shared";
import { TodoRepository } from "../repositories/todo.repository.js";

export class TodoService {
  constructor(private readonly repository: TodoRepository) {}

  async getAll(): Promise<TodoDto[]> {
    return this.repository.getAll();
  }

  async get(id: number): Promise<TodoDto | null> {
    return this.repository.get(id);
  }

  async save(
    id: number | undefined,
    title: string,
    description: string,
    status: TodoStatus
  ): Promise<TodoDto> {
    if (id === undefined) {
      return this.repository.insert(title, description, status);
    }

    const existingTodo = await this.repository.get(id);

    if (existingTodo === null) {
      throw new Error(`Todo with id ${id} was not found`);
    }

    const updatedTodo = await this.repository.update(
      id,
      title,
      description,
      status
    );

    if (updatedTodo === null) {
      throw new Error(`Todo with id ${id} could not be updated`);
    }

    return updatedTodo;
  }
}
