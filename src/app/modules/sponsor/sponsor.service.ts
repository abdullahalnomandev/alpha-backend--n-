import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';
import { ISponsor } from './sponsor.interface';
import { Sponsor } from './sponsor.model';

const createToDB = async (payload: ISponsor) => {
  return await Sponsor.create(payload);
};

const getAllFromDB = async (query: Record<string, any>) => {
  const qb = new QueryBuilder(
    Sponsor.find().select('logo title location'),
    query
  )
    .paginate()
    .search(['title', 'location'])
    .fields()
    .filter()
    .sort();
  
  const data = await qb.modelQuery.lean();
  const pagination = await qb.getPaginationInfo();
  
  return {
    pagination,
    data,
  };
};

const getByIdFromDB = async (id: string) => {
  const sponsor = await Sponsor.findById(id).lean();
  
  if (!sponsor) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sponsor not found');
  }
  return sponsor;
};

const updateInDB = async (id: string, payload: Partial<ISponsor>) => {
  const updated = await Sponsor.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sponsor not found');
  }
  return updated;
};

const deleteFromDB = async (id: string) => {
  const sponsor = await Sponsor.findById(id).lean();
  if (!sponsor) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Sponsor not found');
  }
  const deleted = await Sponsor.findByIdAndDelete(id).lean();
  return deleted;
};

export const SponsorService = {
  createToDB,
  getAllFromDB,
  getByIdFromDB,
  updateInDB,
  deleteFromDB,
};

