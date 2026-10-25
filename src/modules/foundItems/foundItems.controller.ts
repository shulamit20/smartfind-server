import { Request, Response } from 'express';
import { getUser } from '../../middleware/authenticate';
import { idParams } from '../../lib/validation';
import * as foundItemsService from './foundItems.service';
import { foundItemBody, foundItemListQuery } from './foundItems.schemas';

export async function list(req: Request, res: Response) {
  const query = foundItemListQuery.parse(req.query);
  res.json(await foundItemsService.list(getUser(req), query));
}

export async function getById(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  res.json(await foundItemsService.getById(getUser(req), id));
}

export async function create(req: Request, res: Response) {
  const body = foundItemBody.parse(req.body);
  res.status(201).json(await foundItemsService.create(body));
}

export async function update(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  const body = foundItemBody.parse(req.body);
  res.json(await foundItemsService.update(id, body));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  await foundItemsService.remove(id);
  res.status(204).end();
}
