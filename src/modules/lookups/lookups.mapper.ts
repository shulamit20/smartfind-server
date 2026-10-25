// A lookup value (category / color / location) as the client sees it
export function toLookupDto(row: { id: number; name: string }) {
  return { id: row.id, name: row.name };
}

// Prisma `include` used by lost reports and found items to load their lookup names
export const lookupInclude = { category: true, color: true, location: true } as const;
