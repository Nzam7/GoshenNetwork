import { Router, Request, Response } from 'express';
import { SqliteProviderAdapter } from '../data/sqliteProviderAdapter';

export function createAdminRouter(sqliteAdapter: SqliteProviderAdapter): Router {
  const router = Router();

  /**
   * GET /admin - Main Church Directory Admin Dashboard
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const allProviders = await sqliteAdapter.getAllProviders(true);
      const categories = await sqliteAdapter.getCategories();
      const activeCount = allProviders.filter((p) => p.active).length;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Goshen Network - Church Admin Dashboard</title>
  <style>
    :root {
      --primary: #25D366;
      --dark: #075E54;
      --bg: #F4F6F8;
      --card-bg: #FFFFFF;
      --text: #2D3748;
      --border: #E2E8F0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
    }
    .header {
      background-color: var(--dark);
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: var(--card-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .stat-card h3 { margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #718096; text-transform: uppercase; }
    .stat-card .value { font-size: 2rem; font-weight: bold; color: var(--dark); }
    
    .actions-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; }
    .btn { background-color: var(--primary); color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn:hover { opacity: 0.9; }
    .btn-secondary { background-color: #E2E8F0; color: #4A5568; }
    .btn-danger { background-color: #E53E3E; color: white; }

    table { width: 100%; border-collapse: collapse; background: var(--card-bg); border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border); }
    th { background-color: #EDF2F7; font-weight: 600; font-size: 0.875rem; color: #4A5568; }
    tr:hover { background-color: #F7FAFC; }
    
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge-active { background-color: #C6F6D5; color: #22543D; }
    .badge-inactive { background-color: #FED7D7; color: #742A2A; }
    .wa-link { color: #25D366; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🤝 Goshen Network - Church Directory Admin</h1>
    <a href="/admin/new" class="btn">+ Add Provider</a>
  </div>

  <div class="container">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Providers</h3>
        <div class="value">${allProviders.length}</div>
      </div>
      <div class="stat-card">
        <h3>Active Listings</h3>
        <div class="value">${activeCount}</div>
      </div>
      <div class="stat-card">
        <h3>Categories</h3>
        <div class="value">${categories.length}</div>
      </div>
    </div>

    <div class="actions-bar">
      <h2>Church Service Providers</h2>
    </div>

    <table>
      <thead>
        <tr>
          <th>Business & Owner</th>
          <th>Category</th>
          <th>WhatsApp Phone</th>
          <th>Description</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${allProviders.map((p) => `
          <tr>
            <td>
              <strong>${escapeHtml(p.businessName)}</strong><br>
              <span style="font-size:0.875rem; color:#718096;">Owner: ${escapeHtml(p.ownerName)}</span>
            </td>
            <td>${escapeHtml(p.category)}</td>
            <td><a class="wa-link" href="https://wa.me/${p.phoneNumber.replace(/\D/g, '')}" target="_blank">${escapeHtml(p.phoneNumber)}</a></td>
            <td style="max-width:250px; font-size:0.875rem;">${escapeHtml(p.description)}</td>
            <td>
              <span class="badge ${p.active ? 'badge-active' : 'badge-inactive'}">
                ${p.active ? 'Active' : 'Hidden'}
              </span>
            </td>
            <td style="display:flex; gap:0.5rem;">
              <form action="/admin/toggle/${p.id}" method="POST" style="margin:0;">
                <button type="submit" class="btn btn-secondary" style="padding:0.4rem 0.6rem; font-size:0.75rem;">
                  ${p.active ? 'Hide' : 'Activate'}
                </button>
              </form>
              <a href="/admin/edit/${p.id}" class="btn btn-secondary" style="padding:0.4rem 0.6rem; font-size:0.75rem;">Edit</a>
              <form action="/admin/delete/${p.id}" method="POST" style="margin:0;" onsubmit="return confirm('Delete this listing?');">
                <button type="submit" class="btn btn-danger" style="padding:0.4rem 0.6rem; font-size:0.75rem;">Delete</button>
              </form>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
      `;
      res.send(html);
    } catch (err: any) {
      res.status(500).send(`Admin Error: ${err.message}`);
    }
  });

  /**
   * GET /admin/new - Form to create provider
   */
  router.get('/new', (req: Request, res: Response) => {
    res.send(renderProviderForm('Add New Church Business', '/admin/new', {}));
  });

  /**
   * POST /admin/new - Submit new provider
   */
  router.post('/new', async (req: Request, res: Response) => {
    try {
      const { businessName, ownerName, category, subcategories, phoneNumber, description } = req.body;
      await sqliteAdapter.createProvider({
        businessName,
        ownerName,
        category,
        subcategories,
        phoneNumber,
        description,
        active: true,
      });
      res.redirect('/admin');
    } catch (err: any) {
      res.status(500).send(`Create Error: ${err.message}`);
    }
  });

  /**
   * GET /admin/edit/:id - Edit provider form
   */
  router.get('/edit/:id', async (req: Request, res: Response) => {
    try {
      const provider = await sqliteAdapter.getProviderById(req.params.id);
      if (!provider) return res.status(404).send('Provider not found');
      res.send(renderProviderForm('Edit Listing', `/admin/edit/${provider.id}`, provider));
    } catch (err: any) {
      res.status(500).send(`Edit Fetch Error: ${err.message}`);
    }
  });

  /**
   * POST /admin/edit/:id - Update provider listing
   */
  router.post('/edit/:id', async (req: Request, res: Response) => {
    try {
      const { businessName, ownerName, category, subcategories, phoneNumber, description } = req.body;
      await sqliteAdapter.updateProvider(req.params.id, {
        businessName,
        ownerName,
        category,
        subcategories,
        phoneNumber,
        description,
      });
      res.redirect('/admin');
    } catch (err: any) {
      res.status(500).send(`Update Error: ${err.message}`);
    }
  });

  /**
   * POST /admin/toggle/:id - Toggle active listing status
   */
  router.post('/toggle/:id', async (req: Request, res: Response) => {
    try {
      await sqliteAdapter.toggleProviderActive(req.params.id);
      res.redirect('/admin');
    } catch (err: any) {
      res.status(500).send(`Toggle Error: ${err.message}`);
    }
  });

  /**
   * POST /admin/delete/:id - Delete provider
   */
  router.post('/delete/:id', async (req: Request, res: Response) => {
    try {
      await sqliteAdapter.deleteProvider(req.params.id);
      res.redirect('/admin');
    } catch (err: any) {
      res.status(500).send(`Delete Error: ${err.message}`);
    }
  });

  return router;
}

function renderProviderForm(title: string, actionUrl: string, data: any): string {
  const subcatStr = Array.isArray(data.subcategories) ? data.subcategories.join(', ') : data.subcategories || '';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - Goshen Network</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #F4F6F8; margin: 0; padding: 2rem; }
    .form-card { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h2 { margin-top: 0; color: #075E54; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4A5568; }
    input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #CBD5E0; border-radius: 4px; box-sizing: border-box; }
    .btn { background: #25D366; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; text-decoration: none; }
    .btn-secondary { background: #E2E8F0; color: #4A5568; margin-left: 0.5rem; }
  </style>
</head>
<body>
  <div class="form-card">
    <h2>${title}</h2>
    <form action="${actionUrl}" method="POST">
      <div class="form-group">
        <label>Business Name</label>
        <input type="text" name="businessName" value="${escapeHtml(data.businessName || '')}" required>
      </div>
      <div class="form-group">
        <label>Owner Name (Church Member)</label>
        <input type="text" name="ownerName" value="${escapeHtml(data.ownerName || '')}" required>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select name="category" required>
          <option value="Home Repairs & Maintenance" ${data.category === 'Home Repairs & Maintenance' ? 'selected' : ''}>Home Repairs & Maintenance</option>
          <option value="Professional & Legal Services" ${data.category === 'Professional & Legal Services' ? 'selected' : ''}>Professional & Legal Services</option>
          <option value="Health & Wellness" ${data.category === 'Health & Wellness' ? 'selected' : ''}>Health & Wellness</option>
          <option value="Education & Tutoring" ${data.category === 'Education & Tutoring' ? 'selected' : ''}>Education & Tutoring</option>
          <option value="Events & Catering" ${data.category === 'Events & Catering' ? 'selected' : ''}>Events & Catering</option>
        </select>
      </div>
      <div class="form-group">
        <label>Subcategories / Search Keywords (comma-separated)</label>
        <input type="text" name="subcategories" value="${escapeHtml(subcatStr)}" placeholder="e.g. plumber, heating, pipes">
      </div>
      <div class="form-group">
        <label>WhatsApp Phone Number (E.164 format)</label>
        <input type="text" name="phoneNumber" value="${escapeHtml(data.phoneNumber || '')}" placeholder="+15551234567" required>
      </div>
      <div class="form-group">
        <label>Short Description of Services</label>
        <textarea name="description" rows="3">${escapeHtml(data.description || '')}</textarea>
      </div>
      <button type="submit" class="btn">Save Provider</button>
      <a href="/admin" class="btn btn-secondary">Cancel</a>
    </form>
  </div>
</body>
</html>
  `;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
