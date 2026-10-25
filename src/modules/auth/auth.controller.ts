import { Request, Response } from 'express';
import { getUser } from '../../middleware/authenticate';
import * as authService from './auth.service';
import { loginBody, registerBody } from './auth.schemas';

export async function register(req: Request, res: Response) {
  const body = registerBody.parse(req.body);
  res.status(201).json(await authService.register(body));
}

export async function login(req: Request, res: Response) {
  const body = loginBody.parse(req.body);
  res.json(await authService.login(body));
}

export async function me(req: Request, res: Response) {
  res.json(await authService.getMe(getUser(req).id));
}
