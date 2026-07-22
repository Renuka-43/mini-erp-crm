import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = req.query.category as string;
    const lowStockOnly = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (lowStockOnly) {
      // Products where currentStock <= minStockAlert
      // Prisma SQLite raw logic or column comparison
      whereClause.currentStock = { lte: 10 }; // Fallback limit or handled dynamically
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    const formattedProducts = products.map((p) => ({
      ...p,
      isLowStock: p.currentStock <= p.minStockAlert,
    }));

    return res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true, email: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({
      success: true,
      data: {
        ...product,
        isLowStock: product.currentStock <= product.minStockAlert,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location, imageUrl } = req.body;

    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `Product with SKU '${sku}' already exists` });
    }

    const initialStock = currentStock ? parseInt(currentStock) : 0;

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          sku,
          category,
          unitPrice: parseFloat(unitPrice),
          currentStock: initialStock,
          minStockAlert: minStockAlert ? parseInt(minStockAlert) : 10,
          location,
          imageUrl,
        },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            quantityChanged: initialStock,
            movementType: 'IN',
            reason: 'Initial Stock On Creation',
            createdById: req.user!.id,
          },
        });
      }

      return newProduct;
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, unitPrice, minStockAlert, location, imageUrl } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : undefined,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : undefined,
        location,
        imageUrl,
      },
    });

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to update product' });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityChanged, movementType, reason } = req.body;

    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const qty = parseInt(quantityChanged);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    if (!['IN', 'OUT'].includes(movementType)) {
      return res.status(400).json({ success: false, message: "Movement type must be 'IN' or 'OUT'" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        throw new Error('Product not found');
      }

      let newStock = product.currentStock;
      if (movementType === 'OUT') {
        if (product.currentStock < qty) {
          throw new Error(`Insufficient stock for ${product.name}. Current: ${product.currentStock}, Requested: ${qty}`);
        }
        newStock -= qty;
      } else {
        newStock += qty;
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      const movementLog = await tx.stockMovement.create({
        data: {
          productId: id,
          quantityChanged: qty,
          movementType,
          reason: reason || (movementType === 'IN' ? 'Stock Adjustment IN' : 'Stock Adjustment OUT'),
          createdById: req.user!.id,
        },
      });

      return { product: updatedProduct, movementLog };
    });

    return res.json({
      success: true,
      message: `Stock successfully adjusted (${movementType} ${qty})`,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Stock adjustment failed' });
  }
};

export const getStockMovements = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { name: true, email: true } },
        },
      }),
      prisma.stockMovement.count(),
    ]);

    return res.json({
      success: true,
      data: {
        movements,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stock movement log' });
  }
};
