import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

//GET handler for orders endpoint
export const GET: APIRoute = async ({ request }) => {
  try {
    //Parse query parameters
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const status = url.searchParams.get('status') || 'all';
    const customerName = url.searchParams.get('customerName') || '';
    const country = url.searchParams.get('country') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    
    if (!employeeId) {
      return new Response(JSON.stringify({ error: 'Employee ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    //Validate employee ID
    const employeeIdNum = parseInt(employeeId, 10);
    if (isNaN(employeeIdNum)) {
      return new Response(JSON.stringify({ error: 'Invalid Employee ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const database = db();
    
    //Build WHERE clause conditions
    let whereConditions = ['o.EmployeeID = ?'];
    const params: any[] = [employeeIdNum];

    if (status === 'shipped') {
      whereConditions.push('o.ShippedDate IS NOT NULL');
    } 
    else if (status === 'pending') {
      whereConditions.push('o.ShippedDate IS NULL AND (o.RequiredDate IS NULL OR o.RequiredDate > date(\'now\'))');
    } 
    else if (status === 'overdue') {
      whereConditions.push('o.ShippedDate IS NULL AND o.RequiredDate IS NOT NULL AND o.RequiredDate <= date(\'now\')');
    }

    if (customerName) {
      whereConditions.push('c.CompanyName LIKE ?');
      params.push(`%${customerName}%`);
    }

    if (country) {
      whereConditions.push('o.ShipCountry = ?');
      params.push(country);
    }

    if (dateFrom) {
      whereConditions.push('o.OrderDate >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('o.OrderDate <= ?');
      params.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    //Get total count for pagination
    const countResult = database.prepare(`
      SELECT COUNT(*) as total
      FROM Orders o
      LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
      ${whereClause}
    `).get(...params) as { total: number };

    const totalCount = countResult.total;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    //Fetch orders with pagination
    const orders = database.prepare(`
      SELECT 
        o.OrderID,
        o.OrderDate,
        o.RequiredDate,
        o.ShippedDate,
        o.Freight,
        o.ShipName,
        o.ShipCity,
        o.ShipCountry,
        c.CompanyName as CustomerName,
        c.ContactName as CustomerContact
      FROM Orders o
      LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
      ${whereClause}
      ORDER BY o.OrderDate DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    //Get available countries for filter
    const countries = database.prepare(`
      SELECT DISTINCT o.ShipCountry
      FROM Orders o
      WHERE o.EmployeeID = ? AND o.ShipCountry IS NOT NULL
      ORDER BY o.ShipCountry
    `).all(employeeIdNum).map((row: any) => row.ShipCountry);

    return new Response(JSON.stringify({ 
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      },
      filters: {
        countries
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('[api/orders] error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

//POST handler for creating orders (not implemented)
export const POST: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ message: 'Create order endpoint - not implemented yet' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
