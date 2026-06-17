import { z } from 'zod';
import { SupportTicketStatus } from '@prisma/client';
import { prisma } from '../../utils/prisma';

export const CreateTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const AddMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export const UpdateStatusSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type AddMessageInput = z.infer<typeof AddMessageSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export const supportService = {
  async createTicket(userId: string, data: CreateTicketInput) {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        status: SupportTicketStatus.OPEN,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return ticket;
  },

  async listUserTickets(userId: string) {
    return prisma.supportTicket.findMany({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listAllTickets(status?: SupportTicketStatus) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    return prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getTicket(id: string) {
    return prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async addMessage(ticketId: string, senderId: string, data: AddMessageInput) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');

    const message = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderId,
        message: data.message,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return message;
  },

  async updateStatus(ticketId: string, data: UpdateStatusInput) {
    const now = data.status === SupportTicketStatus.RESOLVED || data.status === SupportTicketStatus.CLOSED
      ? new Date()
      : undefined;

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: data.status,
        resolvedAt: now ?? null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return ticket;
  },

  async getSupportStats() {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: SupportTicketStatus.OPEN } }),
      prisma.supportTicket.count({ where: { status: SupportTicketStatus.IN_PROGRESS } }),
      prisma.supportTicket.count({ where: { status: SupportTicketStatus.RESOLVED } }),
      prisma.supportTicket.count({ where: { status: SupportTicketStatus.CLOSED } }),
    ]);

    return { total, open, inProgress, resolved, closed };
  },
};
