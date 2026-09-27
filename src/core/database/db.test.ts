import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './db';

describe('SQLite Database Service & Migrations', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService();
    await db.initialize(); // In-memory database
  });

  afterEach(() => {
    db.close();
  });

  it('debe inicializar las tablas y sembrar los perfiles de producción predeterminados', () => {
    const profiles = db.query('SELECT * FROM production_profiles ORDER BY total_roll_width_mm DESC');
    expect(profiles.length).toBe(3);

    const defaultProfile = db.queryOne('SELECT * FROM production_profiles WHERE is_default = 1');
    expect(defaultProfile).toBeDefined();
    expect(defaultProfile.id).toBe('profile_epson_122');
    expect(defaultProfile.total_roll_width_mm).toBe(1220.0);
    expect(defaultProfile.printable_width_mm).toBe(1120.0);
    expect(defaultProfile.piece_spacing_mm).toBe(7.0);
  });

  it('debe permitir crear y consultar un conjunto de moldes y tallas', () => {
    db.run(
      'INSERT INTO pattern_sets (id, name, garment_type, description) VALUES (?, ?, ?, ?)',
      ['pat_01', 'MOLDES FUTBOL 2026', 'FUTBOL', 'Colección de moldes oficiales']
    );

    db.run(
      'INSERT INTO pattern_sizes (id, pattern_set_id, size_name, sort_order) VALUES (?, ?, ?, ?)',
      ['size_28', 'pat_01', '28', 1]
    );

    const set = db.queryOne('SELECT * FROM pattern_sets WHERE id = ?', ['pat_01']);
    expect(set.name).toBe('MOLDES FUTBOL 2026');

    const sizes = db.query('SELECT * FROM pattern_sizes WHERE pattern_set_id = ?', ['pat_01']);
    expect(sizes.length).toBe(1);
    expect(sizes[0].size_name).toBe('28');
  });

  it('debe registrar y recuperar ítems de un pedido (jugadores del Excel)', () => {
    db.run(
      'INSERT INTO projects (id, name, client_name, team_name) VALUES (?, ?, ?, ?)',
      ['proj_01', 'UNIFORMES COLEGIO FRANCIA', 'Prof. Roberto', 'Colegio Francia Sub-15']
    );

    db.run(
      `INSERT INTO order_items (id, project_id, row_number, player_name, player_number, size_name, garment_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['item_01', 'proj_01', 1, 'MATEO', '10', '28', 'COMPLETO']
    );

    const items = db.query('SELECT * FROM order_items WHERE project_id = ?', ['proj_01']);
    expect(items.length).toBe(1);
    expect(items[0].player_name).toBe('MATEO');
    expect(items[0].player_number).toBe('10');
    expect(items[0].size_name).toBe('28');
  });
});
