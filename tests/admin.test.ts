import request from 'supertest';
import { app } from '../src/index';

describe('Admin Dashboard Web Portal Integration Tests', () => {
  test('GET /admin renders Church Admin Dashboard HTML', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Goshen Network - Church Directory Admin');
    expect(res.text).toContain('Total Providers');
  });

  test('GET /admin/new renders Add New Church Business form', async () => {
    const res = await request(app).get('/admin/new');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Add New Church Business');
  });

  test('POST /admin/new creates new provider listing', async () => {
    const newProvider = {
      businessName: 'Test Kingdom Cleaning',
      ownerName: 'Sister Maria',
      category: 'Home Repairs & Maintenance',
      subcategories: 'cleaning, maid, house',
      phoneNumber: '+15559990000',
      description: 'Residential and church sanctuary deep cleaning.',
    };

    const res = await request(app)
      .post('/admin/new')
      .type('form')
      .send(newProvider);

    expect(res.status).toBe(302); // Redirect back to /admin
    expect(res.headers.location).toBe('/admin');

    const adminPage = await request(app).get('/admin');
    expect(adminPage.text).toContain('Test Kingdom Cleaning');
  });
});
