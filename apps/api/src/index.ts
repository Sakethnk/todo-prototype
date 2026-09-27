import type { TodoDto } from "@todo/shared";

export const testTodo: TodoDto = {
  id: 1,
  title: "Learn TypeScript",
  description: "Build the Todo prototype",
  status: 0,
  createdDate: new Date(),
  updatedDate: new Date()
};
