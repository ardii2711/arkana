import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { currentUser } from '../../utils/current-user.js';
import { sendFileContent } from '../../utils/file-response.js';
import type {
  RequestEmailChangeInput,
  UpdateProfileInput,
  VerifyEmailChangeInput,
} from './profile.schema.js';
import {
  deleteAvatar,
  getAvatar,
  requestEmailChange,
  updateProfile,
  uploadAvatar,
  verifyEmailChange,
} from './profile.service.js';

export const updateProfileHandler: RequestHandler = async (req, res) => {
  const input = res.locals.input.body as UpdateProfileInput;
  const user = await updateProfile(currentUser(req).id, input);
  sendSuccess(res, { user });
};

export const requestEmailChangeHandler: RequestHandler = async (req, res) => {
  const input = res.locals.input.body as RequestEmailChangeInput;
  await requestEmailChange(currentUser(req).id, input.email);
  sendSuccess(res, { sent: true });
};

export const verifyEmailChangeHandler: RequestHandler = async (req, res) => {
  const { token } = res.locals.input.body as VerifyEmailChangeInput;
  await verifyEmailChange(token);
  sendSuccess(res, { verified: true });
};

export const uploadAvatarHandler: RequestHandler = async (req, res) => {
  const result = await uploadAvatar(currentUser(req).id, req);
  sendSuccess(res, result, 201);
};

export const getAvatarHandler: RequestHandler = async (req, res) => {
  sendFileContent(res, await getAvatar(currentUser(req).id));
};

export const deleteAvatarHandler: RequestHandler = async (req, res) => {
  await deleteAvatar(currentUser(req).id);
  sendSuccess(res, { deleted: true });
};
