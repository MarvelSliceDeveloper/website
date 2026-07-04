import { z } from "zod";
import { TicketStatus, SupportTicketStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma";

// Shared schemas
export const CreateTicketSchema = z.object({
  type: z.enum(["MENTORSHIP", "SUPPORT"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  // Mentorship-only fields
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  courseId: z.string().optional(),
});

export const AddMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const AssignMentorSchema = z.object({
  mentorId: z.string().min(1, "Mentor ID is required"),
});

export const ScheduleSessionSchema = z.object({
  scheduledAt: z.string().datetime(),
  teamsMeetingId: z.string().optional(),
  joinUrl: z.string().url().optional(),
});

export const CompleteTicketSchema = z.object({
  notes: z.string().optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type AddMessageInput = z.infer<typeof AddMessageSchema>;
export type AssignMentorInput = z.infer<typeof AssignMentorSchema>;
export type ScheduleSessionInput = z.infer<typeof ScheduleSessionSchema>;
export type CompleteTicketInput = z.infer<typeof CompleteTicketSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

const userSelect = { id: true, name: true, email: true } as const;
const userWithRoleSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export const ticketService = {
  // ─── CREATE ───

  // Creates a new support or mentorship ticket
  async createTicket(userId: string, data: CreateTicketInput) {
    if (data.type === "SUPPORT") {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          title: data.title,
          description: data.description,
          status: SupportTicketStatus.OPEN,
        },
        include: { user: { select: userSelect } },
      });
      return { ...ticket, type: "SUPPORT" as const };
    }

    const ticket = await prisma.mentorshipTicket.create({
      data: {
        studentId: userId,
        title: data.title,
        description: data.description,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        preferredTime: data.preferredTime || null,
        courseId: data.courseId || null,
        status: TicketStatus.OPEN,
      },
      include: {
        student: { select: userSelect },
        mentor: { select: userSelect },
        course: { select: { id: true, title: true } },
      },
    });
    return { ...ticket, type: "MENTORSHIP" as const };
  },

  // ─── LIST ───

  // Lists all tickets with optional filters
  async listTickets(params: {
    userId?: string;
    role?: string;
    type?: "MENTORSHIP" | "SUPPORT";
    status?: string;
    mentorId?: string;
  }) {
    if (
      params.type === "SUPPORT" ||
      (!params.type && params.role === "ADMIN" && !params.mentorId)
    ) {
      const where: Record<string, unknown> = {};
      if (params.userId) where.userId = params.userId;
      if (params.status) where.status = params.status;

      const tickets = await prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: userWithRoleSelect },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return tickets.map((t) => ({ ...t, type: "SUPPORT" as const }));
    }

    const where: Record<string, unknown> = {};
    if (params.userId) where.studentId = params.userId;
    if (params.mentorId) where.mentorId = params.mentorId;
    if (params.status) where.status = params.status;

    const tickets = await prisma.mentorshipTicket.findMany({
      where,
      include: {
        student: { select: userSelect },
        mentor: { select: userSelect },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return tickets.map((t) => ({ ...t, type: "MENTORSHIP" as const }));
  },

  // ─── GET ───

  // Gets a single ticket by ID and optional type
  async getTicket(id: string, type?: "MENTORSHIP" | "SUPPORT") {
    if (type === "SUPPORT") {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          user: { select: userWithRoleSelect },
          messages: {
            include: {
              sender: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      return ticket ? { ...ticket, type: "SUPPORT" as const } : null;
    }

    if (type === "MENTORSHIP") {
      const ticket = await prisma.mentorshipTicket.findUnique({
        where: { id },
        include: {
          student: { select: userSelect },
          mentor: { select: userSelect },
          course: { select: { id: true, title: true } },
        },
      });
      return ticket ? { ...ticket, type: "MENTORSHIP" as const } : null;
    }

    // Try both if type is not specified
    const [supportTicket, mentorshipTicket] = await Promise.all([
      prisma.supportTicket
        .findUnique({
          where: { id },
          include: {
            user: { select: userWithRoleSelect },
            messages: {
              include: {
                sender: { select: { id: true, name: true, role: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        })
        .catch(() => null),
      prisma.mentorshipTicket
        .findUnique({
          where: { id },
          include: {
            student: { select: userSelect },
            mentor: { select: userSelect },
            course: { select: { id: true, title: true } },
          },
        })
        .catch(() => null),
    ]);

    if (supportTicket) {
      return { ...supportTicket, type: "SUPPORT" as const };
    }
    if (mentorshipTicket) {
      return { ...mentorshipTicket, type: "MENTORSHIP" as const };
    }
    return null;
  },

  // ─── MENTORSHIP-SPECIFIC ───

  // Assigns a mentor to a mentorship ticket
  async assignMentor(
    ticketId: string,
    adminId: string,
    data: AssignMentorInput,
  ) {
    const mentor = await prisma.user.findUnique({
      where: { id: data.mentorId },
    });
    if (!mentor) throw new Error("Mentor not found");
    if (mentor.role === "STUDENT")
      throw new Error("Cannot assign a student as mentor");

    return prisma.mentorshipTicket.update({
      where: { id: ticketId },
      data: { mentorId: data.mentorId, status: TicketStatus.ASSIGNED },
      include: {
        student: { select: userSelect },
        mentor: { select: userSelect },
        course: { select: { id: true, title: true } },
      },
    });
  },

  async scheduleSession(
    ticketId: string,
    adminId: string,
    data: ScheduleSessionInput,
  ) {
    const ticket = await prisma.mentorshipTicket.findUnique({
      where: { id: ticketId },
      include: {
        student: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
      },
    });

    if (!ticket) throw new Error("Ticket not found");
    if (
      ticket.status !== TicketStatus.ASSIGNED &&
      ticket.status !== TicketStatus.OPEN
    ) {
      throw new Error("Ticket must be in ASSIGNED or OPEN status to schedule");
    }

    const scheduledAt = new Date(data.scheduledAt);
    const scheduledEndAt = new Date(scheduledAt.getTime() + 60 * 60 * 1000);
    const teamsMeetingId = data.teamsMeetingId || `mentorship-${ticketId}`;
    const joinUrl = data.joinUrl || "";
    const mentorId = ticket.mentorId || adminId;

    const [updatedTicket] = await prisma.$transaction(async (tx) => {
      const updated = await tx.mentorshipTicket.update({
        where: { id: ticketId },
        data: {
          scheduledAt,
          teamsMeetingId: data.teamsMeetingId || null,
          joinUrl: data.joinUrl || null,
          status: TicketStatus.SCHEDULED,
        },
        include: {
          student: { select: userSelect },
          mentor: { select: userSelect },
          course: { select: { id: true, title: true } },
        },
      });

      const session = await tx.liveSession.create({
        data: {
          batchId: null,
          title: `Mentorship: ${ticket.title} — ${ticket.student.name}`,
          teamsMeetingId,
          joinUrl,
          scheduledAt,
          scheduledEndAt,
          createdFrom: "MENTORSHIP",
          createdBy: adminId,
          instructorId: mentorId,
          mentorshipTicketId: ticketId,
        },
      });

      await tx.calendarEvent.create({
        data: {
          msEventId: `mentorship-${ticketId}`,
          title: `Mentorship: ${ticket.title} — ${ticket.student.name}`,
          startAt: scheduledAt,
          endAt: scheduledEndAt,
          joinUrl,
          sessionId: session.id,
        },
      });

      return [updated];
    });

    return updatedTicket;
  },

  // Marks a mentorship ticket as completed
  async completeTicket(ticketId: string, data?: CompleteTicketInput) {
    const [updatedTicket] = await prisma.$transaction(async (tx) => {
      const linkedSession = await tx.liveSession.findFirst({
        where: { mentorshipTicketId: ticketId },
        select: { id: true },
      });
      if (linkedSession) {
        await tx.liveSession.update({
          where: { id: linkedSession.id },
          data: { endedAt: new Date() },
        });
      }

      const ticket = await tx.mentorshipTicket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.COMPLETED,
          resolvedAt: new Date(),
          notes: data?.notes || null,
        },
        include: {
          student: { select: userSelect },
          mentor: { select: userSelect },
          course: { select: { id: true, title: true } },
        },
      });

      return [ticket];
    });

    return updatedTicket;
  },

  async cancelMentorshipTicket(ticketId: string) {
    const [updated] = await prisma.$transaction(async (tx) => {
      const linkedSession = await tx.liveSession.findFirst({
        where: { mentorshipTicketId: ticketId },
        select: { id: true },
      });

      if (linkedSession) {
        await tx.calendarEvent.deleteMany({
          where: { sessionId: linkedSession.id },
        });
        await tx.liveSession.delete({ where: { id: linkedSession.id } });
      }

      const ticket = await tx.mentorshipTicket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.CANCELLED, resolvedAt: new Date() },
        include: {
          student: { select: userSelect },
          mentor: { select: userSelect },
          course: { select: { id: true, title: true } },
        },
      });

      return [ticket];
    });

    return updated;
  },

  // Gets all users eligible to be mentors
  async getAvailableMentors() {
    return prisma.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  },

  // ─── SUPPORT-SPECIFIC ───

  // Adds a message to a support ticket
  async addMessage(ticketId: string, senderId: string, data: AddMessageInput) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new Error("Ticket not found");

    return prisma.supportMessage.create({
      data: { ticketId, senderId, message: data.message },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  },

  // Updates the status of a support ticket
  async updateStatus(ticketId: string, data: UpdateStatusInput) {
    const now =
      data.status === SupportTicketStatus.RESOLVED ||
      data.status === SupportTicketStatus.CLOSED
        ? new Date()
        : undefined;

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: data.status, resolvedAt: now ?? null },
      include: { user: { select: userWithRoleSelect } },
    });
  },

  // ─── STATS ───

  // Gets ticket statistics by type
  async getStats(type: "MENTORSHIP" | "SUPPORT") {
    if (type === "SUPPORT") {
      const [total, open, inProgress, resolved, closed] = await Promise.all([
        prisma.supportTicket.count(),
        prisma.supportTicket.count({
          where: { status: SupportTicketStatus.OPEN },
        }),
        prisma.supportTicket.count({
          where: { status: SupportTicketStatus.IN_PROGRESS },
        }),
        prisma.supportTicket.count({
          where: { status: SupportTicketStatus.RESOLVED },
        }),
        prisma.supportTicket.count({
          where: { status: SupportTicketStatus.CLOSED },
        }),
      ]);
      return { total, open, inProgress, resolved, closed };
    }

    const [total, open, assigned, scheduled, completed] = await Promise.all([
      prisma.mentorshipTicket.count(),
      prisma.mentorshipTicket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.mentorshipTicket.count({
        where: { status: TicketStatus.ASSIGNED },
      }),
      prisma.mentorshipTicket.count({
        where: { status: TicketStatus.SCHEDULED },
      }),
      prisma.mentorshipTicket.count({
        where: { status: TicketStatus.COMPLETED },
      }),
    ]);
    return { total, open, assigned, scheduled, completed };
  },
};
