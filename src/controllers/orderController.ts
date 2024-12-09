// controllers/orderController.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Order, { OrderStatus } from '../models/OrderModel';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //   apiVersion: '2023-10-16',
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
}

export const checkOrderPaymentStatus = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<any> => {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // If order is already paid, return the order
    if (order.isPaid) {
      return res.json(order);
    }

    try {
      // Retrieve the Stripe session to check its status
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId!
      );

      // If payment is successful, update the order
      if (session.payment_status === 'paid') {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = OrderStatus.PROCESSING;
        order.paymentResult = {
          id: session.id,
          status: session.payment_status,
          update_time: new Date().toISOString(),
          email_address: session.customer_details?.email || '',
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
      } else {
        res.json(order); // Return original order if payment is not completed
      }
    } catch (error: any) {
      res.status(400);
      throw new Error('Error checking payment status: ' + error.message);
    }
  }
);

// Create new order and Stripe checkout session
export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      } = req.body;

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
      }

      // Create order in database
      const order: any = await Order.create({
        user: req.user?.id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        status: OrderStatus.PENDING,
      });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: req.user.email,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/order-success/${order._id}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout`,
        line_items: orderItems.map((item: any) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              images: [item.image],
            },
            unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
          },
          quantity: item.quantity,
        })),
        metadata: {
          orderId: order._id.toString(),
        },
      });

      // Update order with Stripe session ID
      order.stripeSessionId = session.id;
      await order.save();

      res.status(201).json({
        orderId: order._id,
        sessionId: session.id,
        sessionUrl: session.url,
      });
    } catch (error: any) {
      console.log('Create order error');
      console.log(error.message);
      res.status(400).json({
        message: 'Create order error',
        errorMessage: error.message,
        user: req.user,
      });
    }
  }
);

// Webhook to handle Stripe events
export const stripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        // Update order status
        const order = await Order.findById(session.metadata?.orderId);
        if (order) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.status = OrderStatus.PROCESSING;
          order.paymentResult = {
            id: session.id,
            status: session.payment_status,
            update_time: new Date().toISOString(),
            email_address: session.customer_details?.email || '',
          };
          await order.save();
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Get order by ID
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  }
);

// Update order status
export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { status, comment } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Validate status
    if (!Object.values(OrderStatus).includes(status)) {
      res.status(400);
      throw new Error('Invalid order status');
    }

    order.status = status;

    // Update delivered status if applicable
    if (status === OrderStatus.DELIVERED) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    // Add comment to status history if provided
    if (comment) {
      order.statusHistory.push({
        status,
        comment,
        timestamp: new Date(),
      });
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  }
);

// Update order to delivered (legacy support)
export const updateOrderToDelivered = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.status = OrderStatus.DELIVERED;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  }
);

// Get logged in user orders
export const getMyOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orders = await Order.find({ user: req.user?.id });
    res.json(orders);
  }
);

// Get all orders (admin only)
export const getAllOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orders = await Order.find({}).populate('user', 'id name email');
    res.json(orders);
  }
);
