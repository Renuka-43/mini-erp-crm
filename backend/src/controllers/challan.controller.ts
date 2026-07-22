import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateChallanPDF } from '../services/pdf.service';

export const getChallans = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;

    const skip = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [challans, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true, email: true, mobile: true } },
          createdBy: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.salesChallan.count({ where: whereClause }),
    ]);

    return res.json({
      success: true,
      data: {
        challans,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching challans:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch sales challans' });
  }
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, currentStock: true } },
          },
        },
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Sales challan not found' });
    }

    return res.json({ success: true, data: challan });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sales challan' });
  }
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, status } = req.body; // status: DRAFT or CONFIRMED

    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sales challan must contain at least one item' });
    }

    const targetStatus = status === 'CONFIRMED' ? 'CONFIRMED' : 'DRAFT';

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Customer Snapshot
    const customerSnapshot = JSON.stringify({
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber,
      address: customer.address,
    });

    // Auto generate challan number
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await prisma.salesChallan.count({
      where: { challanNumber: { startsWith: `CH-${todayStr}` } },
    });
    const challanNumber = `CH-${todayStr}-${String(countToday + 1).padStart(4, '0')}`;

    // Execute within database transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalQuantity = 0;
      let totalAmount = 0;
      const challanItemsData: any[] = [];

      // Validate products & stock
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const qty = parseInt(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Invalid quantity ${item.quantity} for product ${product.name}`);
        }

        const unitPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : product.unitPrice;
        const subtotal = qty * unitPrice;

        totalQuantity += qty;
        totalAmount += subtotal;

        // Stock check if CONFIRMED
        if (targetStatus === 'CONFIRMED') {
          if (product.currentStock < qty) {
            throw new Error(`Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${qty}`);
          }
        }

        const productSnapshot = JSON.stringify({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
        });

        challanItemsData.push({
          productId: product.id,
          productSnapshot,
          unitPrice,
          quantity: qty,
          subtotal,
        });
      }

      // Create Sales Challan Record
      const newChallan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          customerSnapshot,
          totalQuantity,
          totalAmount,
          status: targetStatus,
          createdById: req.user!.id,
          items: {
            create: challanItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
          createdBy: { select: { name: true } },
        },
      });

      // If CONFIRMED, update stock and create OUT movement logs
      if (targetStatus === 'CONFIRMED') {
        for (const item of items) {
          const qty = parseInt(item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: qty } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: qty,
              movementType: 'OUT',
              reason: `Sales Challan #${challanNumber} Confirmed`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return newChallan;
    });

    return res.status(201).json({
      success: true,
      message: `Sales Challan created successfully (${targetStatus})`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating sales challan:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create sales challan' });
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'CONFIRMED' or 'CANCELLED'

    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Target status must be 'CONFIRMED' or 'CANCELLED'" });
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Sales challan not found' });
    }

    if (challan.status === status) {
      return res.status(400).json({ success: false, message: `Challan is already in '${status}' status` });
    }

    const updatedChallan = await prisma.$transaction(async (tx) => {
      // Transition from DRAFT -> CONFIRMED
      if (challan.status === 'DRAFT' && status === 'CONFIRMED') {
        for (const item of challan.items) {
          const freshProduct = await tx.product.findUnique({ where: { id: item.productId } });
          if (!freshProduct || freshProduct.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for '${item.product.name}'. Available: ${freshProduct?.currentStock || 0}, Requested: ${item.quantity}`);
          }
        }

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan #${challan.challanNumber} Confirmed`,
              createdById: req.user!.id,
            },
          });
        }
      }

      // Transition from CONFIRMED -> CANCELLED (Restoring Stock)
      if (challan.status === 'CONFIRMED' && status === 'CANCELLED') {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Restored stock from cancelled Sales Challan #${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return tx.salesChallan.update({
        where: { id },
        data: { status },
        include: { items: true, customer: true, createdBy: { select: { name: true } } },
      });
    });

    return res.json({
      success: true,
      message: `Challan status updated to ${status}`,
      data: updatedChallan,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Status update failed' });
  }
};

export const downloadChallanPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { name: true, email: true } },
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Sales challan not found' });
    }

    const pdfBuffer = await generateChallanPDF(challan);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Challan_${challan.challanNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF document' });
  }
};
