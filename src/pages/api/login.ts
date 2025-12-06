import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

//Interface defining employee row structure
interface EmployeeRow {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  Password: string | null;
}

//POST handler for login endpoint
export const POST: APIRoute = async ({ request }) => {
  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    console.error('[api/login] failed to parse JSON', e);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  //Extract and validate employee ID and password
  const employeeId = parseInt(String(body?.employeeId || body?.employeeID || body?.EmployeeID || body?.employee_id || '').trim(), 10);
  const password = String(body?.password || body?.Password || '').trim();

  if (!employeeId || isNaN(employeeId) || !password) {
    return new Response(JSON.stringify({ error: 'Missing Fields' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const database = db();
    
    //Query employee from database
    const row = database.prepare('SELECT EmployeeID, FirstName, LastName, Password FROM Employees WHERE EmployeeID = ?').get(employeeId) as EmployeeRow | undefined;
    
    if (!row) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
        status: 401, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    //Check if password matches
    if (!row.Password || row.Password !== password) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
        status: 401, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    //Return success response with employee data
    return new Response(JSON.stringify({ 
      ok: true, 
      id: row.EmployeeID, 
      firstName: row.FirstName,
      lastName: row.LastName,
      message: 'Logged in successfully' 
    }), { 
      headers: { 'content-type': 'application/json' } 
    });
  //Catch and log any errors
  } catch (err) {
    console.error('[api/login] error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
};
