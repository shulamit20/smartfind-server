import { Request, Response } from 'express';
import { getUser } from '../../middleware/authenticate';
import { idParams } from '../../lib/validation';
import * as lostReportsService from './lostReports.service';
import { lostReportBody, lostReportListQuery } from './lostReports.schemas';

export async function list(req: Request, res: Response) {
  const query = lostReportListQuery.parse(req.query);
  res.json(await lostReportsService.list(getUser(req), query));
}

export async function getById(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  res.json(await lostReportsService.getById(getUser(req), id));
}

export async function create(req: Request, res: Response) {
  const body = lostReportBody.parse(req.body);
  res.status(201).json(await lostReportsService.create(getUser(req), body));
}

export async function update(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  const body = lostReportBody.parse(req.body);
  res.json(await lostReportsService.update(getUser(req), id, body));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  await lostReportsService.remove(getUser(req), id);
  res.status(204).end();
}

export async function getMatches(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  res.json(await lostReportsService.getMatches(getUser(req), id));
}
