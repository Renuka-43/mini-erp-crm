import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Admin-only Role Switching endpoint
 * Allows an authenticated Admin to switch context to another seeded test account
 * without exposing passwords on the frontend.
 */
export const switchRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only authenticated Admin users can perform role switching',
      });
    }

    const { targetRole } = req.body;
    if (!['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'].includes(targetRole)) {
      return res.status(400).json({ success: false, message: 'Invalid target role requested' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { role: targetRole },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: `No target account found for role '${targetRole}'` });
    }

    const token = jwt.sign(
      { id: targetUser.id, email: targetUser.email, name: targetUser.name, role: targetUser.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return res.json({
      success: true,
      message: `Switched context to ${targetRole} role`,
      data: {
        token,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
      },
    });
  } catch (error) {
    console.error('Role switch error:', error);
    return res.status(500).json({ success: false, message: 'Server error during role switch' });
  }
};
