import { StatusCodes } from 'http-status-codes';
import { IEventRegistration } from './eventRegistration.interface';
import { EventRegistration } from './eventRegistration.model';
import ApiError from '../../../../errors/ApiError';
import QueryBuilder from '../../../builder/QueryBuilder';
import { Event } from '../event.model';
import { EventRegistrationStatus } from './enventRegistration.constant';

const createToDB = async (payload: IEventRegistration) => {
  // Check if event exists
  const { event, user } = payload;
  const eventExists = await Event.findById(event).lean();
  if (!eventExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found for registration');
  }

  // Check for duplicate registration (same user for same event)
  const duplicate = await EventRegistration.findOne({ event, user }).lean();
  if (duplicate) {
    throw new ApiError(StatusCodes.CONFLICT, 'User has already registered for this event');
  }

  return await EventRegistration.create(payload);
};

const cancelEvent = async ({ event, user }: { event: string; user: string }) => {
  const registration = await EventRegistration.findOne({ event, user });

  if (!registration) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event registration not found');
  }

  if (registration.status && registration.status !== EventRegistrationStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not able to to cancel it');
  }

  await EventRegistration.deleteOne({ _id: registration._id });

  return registration;
};


const getAllFromDB = async (query: Record<string, any>) => {
  const updatedQuery = {
    ...query,
  };

  const searchableFields = []; // No direct searchable fields here; see below.

  const qb = new QueryBuilder(
    EventRegistration.find(),
    updatedQuery
  )
    .paginate()
    .fields()
    .filter()
    .sort();

  // Get registrations, then populate user (manually, since QueryBuilder doesn't support deep search)
  let data = await qb.modelQuery.populate('user').lean();
  const pagination = await qb.getPaginationInfo();

  // If searchTerm is present, filter the populated user fields manually in-memory
  if (updatedQuery.searchTerm) {
    const searchTerm = (updatedQuery.searchTerm as string).toLowerCase();
    data = data.filter((doc: any) => {
      const user = doc.user || {};
      return (
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.phone && user.phone.toLowerCase().includes(searchTerm))
      );
    });
  }

  return {
    pagination,
    data,
  };
};

const getByIdFromDB = async (id: string) => {
  const registration = await EventRegistration.findById(id).lean().populate('user');

  if (!registration) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event registration not found');
  }
  return registration;
};

const updateInDB = async (id: string, payload: Partial<IEventRegistration>) => {
  const updated = await EventRegistration.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event registration not found');
  }
  return updated;
};

const deleteFromDB = async (id: string) => {
  const registration = await EventRegistration.findById(id).lean();
  if (!registration) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event registration not found');
  }
  const deleted = await EventRegistration.findByIdAndDelete(id).lean();
  return deleted;
};

export const EventRegistrationService = {
  createToDB,
  getAllFromDB,
  getByIdFromDB,
  updateInDB,
  deleteFromDB,
  cancelEvent
};
