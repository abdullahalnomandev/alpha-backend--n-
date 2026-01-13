import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { ExclusiveOfferValidation } from './exclusiveOffer.validation';
import { ExclusiveOfferController } from './exclusiveOffer.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';

const router = express.Router();

router
  .route('/')
  .post(
    fileUploadHandler(),
    validateRequest(ExclusiveOfferValidation.createZodSchema),
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ExclusiveOfferController.create
  )
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ExclusiveOfferController.getAll
  );

router
  .route('/:id')
  .get(
    // auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ExclusiveOfferController.getById
  )
  .patch(
    fileUploadHandler(),
    validateRequest(ExclusiveOfferValidation.updateZodSchema),
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ExclusiveOfferController.update
  )
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ExclusiveOfferController.remove
  );

router
  .route('/favourite/:id')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ExclusiveOfferController.createFavorite
  );

router
  .route('/all/favourite')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ExclusiveOfferController.getFavourites
  );

export const ExclusiveOfferRoutes = router;
