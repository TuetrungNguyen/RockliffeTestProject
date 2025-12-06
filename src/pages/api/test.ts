import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

export const GET: APIRoute = () => {
  const row = db().prepare('SELECT EmployeeID, FirstName, LastName FROM Employees LIMIT 1;').get();
  return new Response(JSON.stringify({ ok: true, sample: row }), {
    headers: { 'content-type': 'application/json' }
  });
};

//You can ignore this file it was just for testing, I kept it just in case