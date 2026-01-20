import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';
import { IEvent } from './event.interface';
import { Event } from './event.model';
import { EventRegistration } from './eventRegistration/eventRegistration.model';

const createToDB = async (payload: IEvent) => {
  return await Event.create(payload);
};

const getAllFromDB = async (query: Record<string, any>) => {
  // By default, override any external sort with eventDate ASC (nearest future first)
  const updatedQuery = {
    ...query,
    // sortBy: 'eventDate',
    // sortOrder: 'desc',
  };

  const qb = new QueryBuilder(Event.find(), updatedQuery)
    .paginate()
    .search(['name', 'title', 'location'])
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
  const event = await Event.findById(id).lean();

  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  }

  // Check if a registration exists for this event; if not, joinStatus is 'none'
  const existingRegistration = await EventRegistration.findOne({ event: id }).lean();

  // Calculate enableToJoin: true if eventDate is today or in the future
  let enableToJoin = false;
  if (event.eventDate) {
    const eventDate = new Date(event.eventDate);
    const now = new Date();
    // Remove time from both dates for "today" check
    const eventYMD = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const nowYMD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    enableToJoin = eventYMD >= nowYMD;
  }

  return {
    ...event,
    joinStatus: existingRegistration ? existingRegistration.status || 'none' : 'none',
    enableToJoin,
  };
};

const updateInDB = async (id: string, payload: Partial<IEvent>) => {
  const updated = await Event.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  }
  return updated;
};

const deleteFromDB = async (id: string) => {
  const event = await Event.findById(id).lean();
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  }
  const deleted = await Event.findByIdAndDelete(id).lean();
  return deleted;
};

export const EventService = {
  createToDB,
  getAllFromDB,
  getByIdFromDB,
  updateInDB,
  deleteFromDB,
};

