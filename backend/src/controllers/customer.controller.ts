import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const customerType = req.query.customerType as string;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { businessName: { contains: search } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (customerType) {
      whereClause.customerType = customerType;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true, email: true } },
          _count: { select: { followUps: true, salesChallans: true } },
        },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    return res.json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve customers' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true, email: true } } },
        },
        salesChallans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            challanNumber: true,
            totalQuantity: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.json({ success: true, data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve customer' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        customerType: customerType || 'RETAIL',
        address,
        status: status || 'LEAD',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
        createdById: req.user.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        customerType,
        address,
        status,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
      },
    });

    return res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to update customer' });
  }
};

export const addFollowUpNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, followUpDate } = req.body;

    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: id,
        note,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        createdById: req.user.id,
      },
      include: { createdBy: { select: { name: true } } },
    });

    if (followUpDate) {
      await prisma.customer.update({
        where: { id },
        data: { followUpDate: new Date(followUpDate) },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Follow-up note added',
      data: followUp,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to add follow-up note' });
  }
};
