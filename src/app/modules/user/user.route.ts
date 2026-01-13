import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import validateRequest from '../../middlewares/validateRequest';
const router = express.Router();

router
  .route('/')
  .post(UserController.createNewUser)
  .get((req: Request, res: Response, next: NextFunction) => {
    return UserController.getAllUsers(req, res, next);
  })
  .patch(
    fileUploadHandler(),
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
    (req: Request, res: Response, next: NextFunction) => {
      return UserController.updateUser(req, res, next);
    }
  );

router
  .route('/my-profile')
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
    UserController.getProfile
  );

router
  .route('/statistics')
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
  UserController.getStatistics);

export const UserRoutes = router;
