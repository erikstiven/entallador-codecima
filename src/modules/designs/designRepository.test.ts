import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '@/core/database/db';
import { 
  saveDesignToDb, 
  getDesignsFromDb, 
  deleteDesignFromDb, 
  seedDefaultMasterDesigns 
} from './designRepository';
import { MasterDesign } from './types';

describe('Design Repository & SQLite Persistence', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService();
    await db.initialize();
  });

  afterEach(() => {
    db.close();
  });

  it('debe sembrar los diseños maestros oficiales (Holanda, Brasil, Argentina) si la base está vacía', () => {
    seedDefaultMasterDesigns(db);
    const designs = getDesignsFromDb(db);

    expect(designs.length).toBeGreaterThanOrEqual(3);
    const holanda = designs.find((d) => d.id === 'des_holanda');
    expect(holanda).toBeDefined();
    expect(holanda?.name).toBe('Holanda Naranja Clásico');
    expect(holanda?.colors).toContain('#ea580c');
  });

  it('debe guardar y recuperar un nuevo diseño maestro personalizado en SQLite', () => {
    const customDesign: MasterDesign = {
      id: 'des_custom_01',
      name: 'Barcelona Alternativo 2026',
      sport: 'FUTBOL',
      colors: ['#991b1b', '#1e3a8a'],
      pieceArtworks: {
        DELANTERO: {
          pieceType: 'DELANTERO',
          svgArtContent: '<rect fill="#991b1b" />',
          placeholders: [],
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDesignToDb(db, customDesign);

    const designs = getDesignsFromDb(db);
    const found = designs.find((d) => d.id === 'des_custom_01');

    expect(found).toBeDefined();
    expect(found?.name).toBe('Barcelona Alternativo 2026');
    expect(found?.colors).toEqual(['#991b1b', '#1e3a8a']);
  });

  it('debe eliminar un diseño maestro de SQLite', () => {
    seedDefaultMasterDesigns(db);
    const beforeCount = getDesignsFromDb(db).length;

    deleteDesignFromDb(db, 'des_holanda');
    const afterCount = getDesignsFromDb(db).length;

    expect(afterCount).toBe(beforeCount - 1);
  });
});
