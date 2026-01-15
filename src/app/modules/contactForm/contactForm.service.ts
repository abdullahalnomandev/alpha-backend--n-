import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/QueryBuilder';
import { IContactForm } from './contactForm.interface';
import { ContactForm } from './contactFromModel';
import { MemberShipApplication } from '../membershipApplication/membershipApplication.model';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import { Notification } from '../notification/notification.mode';
import { NotificationCount } from '../notification/notificationCountModel';

const createToDB = async (payload: IContactForm) => {
  // Save Contact Form as usual
  await ContactForm.create(payload);

  if (payload.membershipType) {
    const expireDate = new Date();
    expireDate.setFullYear(expireDate.getFullYear() + 4);
    await MemberShipApplication.create({
      name: payload.name,
      phone: payload.contact,
      email: payload.email,
      membershipType: payload.membershipType,
      expireId: expireDate,
    });
  }

  const adminOrSuperAdminUsers = await User.find({
    role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] }
  });

  for (const admin of adminOrSuperAdminUsers) {
    if (admin.email) {
      const emailPayload = {
        userName: payload.name,
        userEmail: payload.email,
        userContact: payload.contact,
        userMessage: payload.message ?? "",
        adminEmail: admin.email,
      };
      const sendEmail = emailTemplate.applicationFormAdmin(emailPayload);
      emailHelper.sendEmail(sendEmail);
    }
    // Fire and forget - no await, immediate side effect
    Notification.create({
      receiver: admin._id,
      title: "New Membership Application Submitted",
      message: payload.message ?? "",
      sender: null,
      refId: admin._id,
      path: "/user/contact-from",
      seen: false
    }).then(() => {}).catch(() => {});

    // increment count if exists, otherwise create with count 1 using upsert
    NotificationCount.findOneAndUpdate(
      { user: admin._id },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    ).then(() => {}).catch(() => {});
  }

 
};



const getAllFromDB = async (query: Record<string, any>) => {
  const qb = new QueryBuilder(
    ContactForm.find().select('name contact email message createdAt'),
    query
  )
    .paginate()
    .search(['name', 'contact', 'email', 'message'])
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
  const contactForm = await ContactForm.findById(id).lean();
  
  if (!contactForm) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Contact form not found');
  }
  return contactForm;
};

const updateInDB = async (id: string, payload: Partial<IContactForm>) => {
  const updated = await ContactForm.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Contact form not found');
  }
  return updated;
};

const deleteFromDB = async (id: string) => {
  const contactForm = await ContactForm.findById(id).lean();
  if (!contactForm) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Contact form not found');
  }
  const deleted = await ContactForm.findByIdAndDelete(id).lean();
  return deleted;
};

export const ContactFormService = {
  createToDB,
  getAllFromDB,
  getByIdFromDB,
  updateInDB,
  deleteFromDB,
};
