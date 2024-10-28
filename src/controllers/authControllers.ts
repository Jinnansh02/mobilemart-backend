import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/userModel';
import { AuthRequest } from '../middleware/authMiddleware';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// Validation helper function
const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email) && email.length <= 254; // RFC 5321 length limit
};

const generateToken = (user: IUser): string => {
  return jwt.sign(
    { user: { id: user.id, email: user.email, role: user.role } },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Email validation
    if (!email || !validateEmail(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists with normalized email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Additional email validations
    const [localPart, domain] = normalizedEmail.split('@');
    if (localPart.length > 64) {
      // RFC 5321 local-part length limit
      res.status(400).json({ message: 'Email local part too long' });
      return;
    }

    if (domain.length > 255) {
      // RFC 5321 domain length limit
      res.status(400).json({ message: 'Email domain too long' });
      return;
    }

    const user = new User({
      name,
      email: normalizedEmail, // Store normalized email
      password,
    });

    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      message: 'Signup successful, you can login now',
      // token,
      // user: {
      //   id: user.id,
      //   name: user.name,
      //   email: user.email,
      //   role: user.role,
      // },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Email validation
    if (!email || !validateEmail(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Normalize email for lookup
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password'
    );
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};
