import { z } from 'zod';
import { prisma } from '../../utils/prisma';

// Validation schemas
export const CreateTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  preferredDate: z.string().datetime().optional(),
  preferredTime: z.string().optional(),
});

export const AssignMentorSchema = z.object({
  mentorId: z.string().min(1, 'Mentor ID is required'),
});

export const ScheduleSessionSchema = z.object({
  scheduledAt: z.string().datetime(),
  teamsMeetingId: z.string().optional(),
  joinUrl: z.string().url().optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type AssignMentorInput = z.infer<typeof AssignMentorSchema>;
export type ScheduleSessionInput = z.infer<typeof ScheduleSessionSchema>;

export const mentorshipService = {
  /**
   * Create a new mentorship ticket (student)
   */
  async createTicket(studentId: string, data: CreateTicketInput) {
    const ticket = await prisma.mentorshipTicket.create({
      data: {
        studentId,
        title: data.title,
        description: data.description,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        preferredTime: data.preferredTime || null,
        status: 'OPEN',
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ticket;
  },

  /**
   * List tickets for a student
   */
  async listStudentTickets(studentId: string) {
    const tickets = await prisma.mentorshipTicket.findMany({
      where: { studentId },
      include: {
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets;
  },

  /**
   * List all tickets (admin view)
   */
  async listAllTickets(status?: string) {
    const where = status ? { status } : {};
    
    const tickets = await prisma.mentorshipTicket.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets;
  },

  /**
   * Get a single ticket by ID
   */
  async getTicket(id: string) {
    const ticket = await prisma.mentorshipTicket.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ticket;
  },

  /**
   * Assign a mentor to a ticket (admin)
   */
  async assignMentor(ticketId: string, adminId: string, data: AssignMentorInput) {
    // Verify mentor exists and is an instructor or admin
    const mentor = await prisma.user.findUnique({
      where: { id: data.mentorId },
    });

    if (!mentor) {
      throw new Error('Mentor not found');
    }

    if (mentor.role === 'STUDENT') {
      throw new Error('Cannot assign a student as mentor');
    }

    const ticket = await prisma.mentorshipTicket.update({
      where: { id: ticketId },
      data: {
        mentorId: data.mentorId,
        status: 'ASSIGNED',
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ticket;
  },

  /**
   * Schedule a mentorship session (admin)
   */
  async scheduleSession(ticketId: string, adminId: string, data: ScheduleSessionInput) {
    const ticket = await prisma.mentorshipTicket.update({
      where: { id: ticketId },
      data: {
        scheduledAt: new Date(data.scheduledAt),
        teamsMeetingId: data.teamsMeetingId || null,
        joinUrl: data.joinUrl || null,
        status: 'SCHEDULED',
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ticket;
  },

  /**
   * Complete a mentorship session
   */
  async completeTicket(ticketId: string) {
    const ticket = await prisma.mentorshipTicket.update({
      where: { id: ticketId },
      data: {
        status: 'COMPLETED',
        resolvedAt: new Date(),
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ticket;
  },

  /**
   * Cancel a mentorship ticket
   */
  async cancelTicket(ticketId: string) {
    const ticket = await prisma.mentorshipTicket.update({
      where: { id: ticketId },
      data: {
        status: 'CANCELLED',
        resolvedAt: new Date(),
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        mentor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return ticket;
  },

  /**
   * Get available mentors (instructors and admins)
   */
  async getAvailableMentors() {
    const mentors = await prisma.user.findMany({
      where: {
        role: {
          in: ['INSTRUCTOR', 'ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return mentors;
  },

  /**
   * Get mentorship stats for dashboard
   */
  async getMentorshipStats() {
    const [total, open, assigned, scheduled, completed] = await Promise.all([
      prisma.mentorshipTicket.count(),
      prisma.mentorshipTicket.count({ where: { status: 'OPEN' } }),
      prisma.mentorshipTicket.count({ where: { status: 'ASSIGNED' } }),
      prisma.mentorshipTicket.count({ where: { status: 'SCHEDULED' } }),
      prisma.mentorshipTicket.count({ where: { status: 'COMPLETED' } }),
    ]);

    return { total, open, assigned, scheduled, completed };
  },
};
