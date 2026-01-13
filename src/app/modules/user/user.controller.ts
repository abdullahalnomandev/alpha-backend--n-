import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getMultipleFilesPath, getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';


//create user
const createNewUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const {email, name , password , confirmPassword } = req.body;
     await UserService.createUserToDB({email, name , password, confirmPassword});

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User Created successfully. Please check your email to activate your account'
    });
  }
);

//update profile
const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.user?.id;
    let profileImage = getSingleFilePath(req.files, 'profileImage');

    const { name, preferences, restaurant_crowd_status} = req.body;

    const data: any = {};

    if (profileImage) data.profileImage = profileImage;
    if (name != null) data.name = name;
    if (preferences != null) data.preferences = preferences;
    if (restaurant_crowd_status != null) data.restaurant_crowd_status = restaurant_crowd_status;

     console.log({data:req.body})
    const result = await UserService.updateUserToDB(userId, data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User updated successfully',
      data: result,
    });
  }
);

// GET all users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Users retrieved successfully',
    data: result,
  });
});

// GET profile users
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getProfile(req.user?.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Users profile retrive successfully',
    data: result,
  });
});

const getStatistics = catchAsync(async (req: Request, res: Response) => {
  const year = req.query.year as string | undefined;
  
  const result = await UserService.getStatistics(year);
  
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Statistics retrieved successfully',
    data: result,
  });
});


export const UserController = {
  updateUser,
  createNewUser,
  getAllUsers,
  getProfile,
  getStatistics
};
