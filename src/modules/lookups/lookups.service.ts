import { prisma } from '../../lib/prisma';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { toLookupDto } from './lookups.mapper';
import { LookupType } from './lookups.schemas';

interface LookupRow {
  id: number;
  name: string;
}

// The three lookup tables have the same shape, so we describe them once:
// which Prisma table to use, and which foreign-key field points to it from reports/items.
interface LookupTable {
  findMany(args: object): Promise<LookupRow[]>;
  findUnique(args: object): Promise<LookupRow | null>;
  create(args: object): Promise<LookupRow>;
  delete(args: object): Promise<LookupRow>;
}

const TABLES: Record<LookupType, { table: () => LookupTable; foreignKey: 'categoryId' | 'colorId' | 'locationId' }> = {
  categories: { table: () => prisma.category as unknown as LookupTable, foreignKey: 'categoryId' },
  colors: { table: () => prisma.color as unknown as LookupTable, foreignKey: 'colorId' },
  locations: { table: () => prisma.location as unknown as LookupTable, foreignKey: 'locationId' },
};

export async function getAll() {
  const byName = { orderBy: { name: 'asc' } };
  const [categories, colors, locations] = await Promise.all([
    TABLES.categories.table().findMany(byName),
    TABLES.colors.table().findMany(byName),
    TABLES.locations.table().findMany(byName),
  ]);
  return {
    categories: categories.map(toLookupDto),
    colors: colors.map(toLookupDto),
    locations: locations.map(toLookupDto),
  };
}

export async function create(type: LookupType, name: string) {
  // A duplicate name fails on the unique index -> 409 (see errorHandler)
  const row = await TABLES[type].table().create({ data: { name } });
  return toLookupDto(row);
}

export async function remove(type: LookupType, id: number) {
  const { table, foreignKey } = TABLES[type];
  const row = await table().findUnique({ where: { id } });
  if (!row) throw notFound('Lookup value');

  const where = { [foreignKey]: id };
  const [reports, items] = await Promise.all([prisma.lostReport.count({ where }), prisma.foundItem.count({ where })]);
  if (reports + items > 0) throw conflict('This value is in use and cannot be deleted');

  await table().delete({ where: { id } });
}

// Used when creating/updating reports and items: makes sure the chosen ids exist
export async function assertLookupsExist(ids: { categoryId: number; colorId: number; locationId: number }) {
  const [category, color, location] = await Promise.all([
    prisma.category.findUnique({ where: { id: ids.categoryId } }),
    prisma.color.findUnique({ where: { id: ids.colorId } }),
    prisma.location.findUnique({ where: { id: ids.locationId } }),
  ]);
  const details = [];
  if (!category) details.push({ path: 'categoryId', message: 'Category does not exist' });
  if (!color) details.push({ path: 'colorId', message: 'Color does not exist' });
  if (!location) details.push({ path: 'locationId', message: 'Location does not exist' });
  if (details.length > 0) throw badRequest('Invalid request', details);
}
