import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile, { unlinkFiles } from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser } from './user.interface';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { userSearchableField } from './user.constant';
import { Event } from '../event/event.model';
import { ExclusiveOffer } from '../exclusiveOffer/exclusiveOffer.model';
import { Club } from '../club/club.model';



const createUserToDB = async (payload: Partial<IUser>): Promise<{ message: string }> => {
  console.log({ payload });

  // Check if user already exists by email
  if (!payload.email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email is required');
  }
  const isExistUser = await User.findOne({ email: payload.email });
  if (isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User already exists with this email');
  }

  // Check password and confirmPassword match
  if (payload.password !== payload.confirmPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Passwords do not match');
  }


  // Create user
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  // Send verification email
  const otp = generateOTP();
  const value = {
    otp,
    email: createUser.email,
    name: createUser.name
  };
  const verifyAccount = emailTemplate.verifyAccount(value);
    emailHelper.sendEmail(verifyAccount);

  // Save OTP and expiry to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findByIdAndUpdate(createUser._id, { $set: { authentication } });

  return { message: "User created successfully" };
};

const updateUserToDB = async (
  userId: string,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {

  // console.log({userId,payload})


  const isExistUser = await User.isExistUserById(userId) as IUser;
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload) {
    if (isExistUser.profileImage === payload.profileImage) {
      unlinkFile(isExistUser.profileImage as string);
    }
  }
  const updateDoc = await User.findOneAndUpdate({ _id: userId }, payload, {
    new: true,
  });

  return updateDoc;
};

const getAllUsers = async (query: Record<string, any>) => {
  const result = new QueryBuilder(User.find(), query)
    .paginate()
    .search(userSearchableField)
    .fields()
    .filter()
    .sort();

  const data = await result.modelQuery.lean().populate('application_form','membershipType');

  const pagination = await result.getPaginationInfo();

  return {
    pagination,
    data,
  };
};


const getProfile = async (userId: string) => {
  const user = await User.findOne({ _id: userId })
    .populate({ path: 'application_form' })
    .lean();
  if (!user) {
    throw new ApiError(500, "User not found");
  }
  return user;
};





const getStatistics = async (year?: string) => {
  // Get total counts
  const totalUser = await User.countDocuments();
  const totalEvent = await Event.countDocuments();
  const totalExclusiveOffer = await ExclusiveOffer.countDocuments();
  const totalClubs = await Club.countDocuments();

  // Determine the year to use
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1); // January 1st of the year
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999); // December 31st of the year

  // Get user statistics by month for the specified year
  const userStats = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Create a map of month number to count
  const monthMap = new Map<number, number>();
  userStats.forEach((stat) => {
    monthMap.set(stat._id, stat.count);
  });

  // Format as month names (jan, feb, mar, etc.)
  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  const userStatistics: Record<string, number> = {};
  monthNames.forEach((month, index) => {
    userStatistics[month] = monthMap.get(index + 1) || 0;
  });

  return {
    totalUser,
    totalEvent,
    totalExclusiveOffer,
    totalClubs,
    year: targetYear,
    userStatistics,
  };
};
export const UserService = {
  createUserToDB,
  getAllUsers,
  updateUserToDB,
  getProfile,
  getStatistics
};