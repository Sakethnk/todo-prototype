import { z } from "zod";

export const todoSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(50),
  description: z.string().min(1).max(250),
  status: z.number(),
  createdDate: z.date(),
  updatedDate: z.date()
});

export type TodoSchema = z.infer<typeof todoSchema>;
