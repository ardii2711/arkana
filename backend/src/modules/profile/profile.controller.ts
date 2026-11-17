import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/api-response.js';
import { ApiError } from '../../utils/api-error.js';
import { receiveMultipart } from '../../lib/multipart.js';
import { currentUser } from '../../utils/current-user.js';
import { sendFileContent } from '../../utils/file-response.js';
import type {
  RequestEmailChangeInput,
  UpdateProfileInput,
  VerifyEmailChangeInput,
} from './profile.schema.js';
import {
  avatarFileError,
  avatarUploadConfig,
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
  const userId = currentUser(req).id;
  const received = await receiveMultipart(req, avatarUploadConfig(userId)).catch(
    (error: unknown): never => {
      throw avatarFileError(error);
    },
  );

  if (!received.file) {
    throw new ApiError(400, 'FILE_REQUIRED', 'File avatar wajib diunggah');
  }

  const result = await uploadAvatar(userId, received.file);
  sendSuccess(res, result, 201);
};

export const getAvatarHandler: RequestHandler = async (req, res) => {
  sendFileContent(res, await getAvatar(currentUser(req).id));
};

export const deleteAvatarHandler: RequestHandler = async (req, res) => {
  await deleteAvatar(currentUser(req).id);
  sendSuccess(res, { deleted: true });
};
