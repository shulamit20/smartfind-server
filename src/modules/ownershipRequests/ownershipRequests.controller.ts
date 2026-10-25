import { Request, Response } from 'express';
import { getUser } from '../../middleware/authenticate';
import { idParams } from '../../lib/validation';
import * as ownershipRequestsService from './ownershipRequests.service';
import { createOwnershipRequestBody, ownershipRequestListQuery, rejectBody } from './ownershipRequests.schemas';

export async function create(req: Request, res: Response) {
  const body = createOwnershipRequestBody.parse(req.body);
  res.status(201).json(await ownershipRequestsService.create(getUser(req), body));
}

export async function list(req: Request, res: Response) {
  const query = ownershipRequestListQuery.parse(req.query);
  res.json(await ownershipRequestsService.list(getUser(req), query));
}

export async function getById(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  res.json(await ownershipRequestsService.getById(getUser(req), id));
}

export async function approve(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  res.json(await ownershipRequestsService.approve(getUser(req), id));
}

export async function reject(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  const { rejectionReason } = rejectBody.parse(req.body);
  res.json(await ownershipRequestsService.reject(getUser(req), id, rejectionReason));
}
