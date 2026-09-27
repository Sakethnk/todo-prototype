import { pool } from "../db/pool.js";
import type { TodoDto } from "@todo/shared";

export class TodoRepository {
  async getAll(): Promise<TodoDto[]> {
    const result = await pool.query(`
      SELECT
        id,
        title,
        description,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate"
      FROM todo
      ORDER BY id
    `);

    return result.rows;
  }

  async get(id: number): Promise<TodoDto | null> {
    const result = await pool.query(
      `
        SELECT
          id,
          title,
          description,
          status,
          created_date AS "createdDate",
          updated_date AS "updatedDate"
        FROM todo
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async insert(
    title: string,
    description: string,
    status: number
  ): Promise<TodoDto> {
    const result = await pool.query(
      `
        INSERT INTO todo (title, description, status)
        VALUES ($1, $2, $3)
        RETURNING
          id,
          title,
          description,
          status,
          created_date AS "createdDate",
          updated_date AS "updatedDate"
      `,
      [title, description, status]
    );

    return result.rows[0];
  }

  async update(
    id: number,
    title: string,
    description: string,
    status: number
  ): Promise<TodoDto | null> {
    const result = await pool.query(
      `
        UPDATE todo
        SET
          title = $1,
          description = $2,
          status = $3,
          updated_date = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING
          id,
          title,
          description,
          status,
          created_date AS "createdDate",
          updated_date AS "updatedDate"
      `,
      [title, description, status, id]
    );

    return result.rows[0] ?? null;
  }
}
