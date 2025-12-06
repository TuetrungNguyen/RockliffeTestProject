import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

//GET handler for order details endpoint
export const GET: APIRoute = async ({ request }) => {
  try {
    //Parse order ID from query parameters
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    //Validate order ID
    const orderIdNum = parseInt(orderId, 10);
    if (isNaN(orderIdNum)) {
      return new Response(JSON.stringify({ error: 'Invalid Order ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const database = db();
    
    //Fetch order information with customer, employee, and shipper data
    const order = database.prepare(`
      SELECT 
        o.OrderID,
        o.OrderDate,
        o.RequiredDate,
        o.ShippedDate,
        o.Freight,
        o.ShipName,
        o.ShipAddress,
        o.ShipCity,
        o.ShipRegion,
        o.ShipPostalCode,
        o.ShipCountry,
        c.CompanyName as CustomerName,
        c.ContactName as CustomerContact,
        c.Address as CustomerAddress,
        c.City as CustomerCity,
        c.Region as CustomerRegion,
        c.PostalCode as CustomerPostalCode,
        c.Country as CustomerCountry,
        c.Phone as CustomerPhone,
        e.FirstName || ' ' || e.LastName as EmployeeName,
        e.EmployeeID,
        s.CompanyName as ShipperName
      FROM Orders o
      LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
      LEFT JOIN Employees e ON o.EmployeeID = e.EmployeeID
      LEFT JOIN Shippers s ON o.ShipVia = s.ShipperID
      WHERE o.OrderID = ?
    `).get(orderIdNum) as any;

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    //Fetch order items with product details
    const orderItems = database.prepare(`
      SELECT 
        od.ProductID,
        od.UnitPrice,
        od.Quantity,
        od.Discount,
        p.ProductName,
        p.QuantityPerUnit
      FROM [Order Details] od
      LEFT JOIN Products p ON od.ProductID = p.ProductID
      WHERE od.OrderID = ?
      ORDER BY od.ProductID
    `).all(orderIdNum);

    //Calculate subtotal from order items
    const subtotal = orderItems.reduce((sum: number, item: any) => {
      const itemTotal = item.UnitPrice * item.Quantity * (1 - item.Discount);
      return sum + itemTotal;
    }, 0);

    //Calculate total including freight
    const total = subtotal + (order.Freight || 0);

    return new Response(JSON.stringify({
      order,
      items: orderItems,
      totals: {
        subtotal: subtotal.toFixed(2),
        freight: order.Freight || 0,
        total: total.toFixed(2)
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  //Catch and log any errors
  } catch (err) {
    console.error('[api/order-details] error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
