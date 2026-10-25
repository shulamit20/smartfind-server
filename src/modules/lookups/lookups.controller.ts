import { Request, Response } from 'express';
import * as lookupsService from './lookups.service';
import { createLookupBody, lookupItemParams, lookupTypeParams } from './lookups.schemas';

export async function getAll(_req: Request, res: Response) {
  res.json(await lookupsService.getAll());
}

export async function create(req: Request, res: Response) {
  const { type } = lookupTypeParams.parse(req.params);
  const { name } = createLookupBody.parse(req.body);
  res.status(201).json(await lookupsService.create(type, name));
}

export async function remove(req: Request, res: Response) {
  const { type, id } = lookupItemParams.parse(req.params);
  await lookupsService.remove(type, id);
  res.status(204).end();
}
