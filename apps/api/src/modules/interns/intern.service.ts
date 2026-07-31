/**
 * Intern service — manages intern applications, the internship field list,
 * the flat internship program fee, and intern class sessions.
 *
 * Interns apply from the public catalogue form (name, phone, email,
 * designation) choosing exactly ONE field of study (Web Development, Backend,
 * Cybersecurity, UI/UX, ... — admin-managed). They pay the single internship
 * program fee via Razorpay. Interns have no portal login.
 */
import Razorpay from "razorpay";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { paginate, PaginationParams } from "../../utils/paginate";

function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export const internService = {
  /**
   * Return the active internship program (id, name, flat fee from package
   * price) used to group intern payments in the payments ledger.
   */
  async getInternshipProgram() {
    return prisma.coursePackage.findFirst({
      where: { isInternship: true, status: "ACTIVE" },
      select: { id: true, name: true, description: true, price: true },
    });
  },

  /**
   * Public — active internship fields (Web Development, Backend, ...) that
   * interns can pick on the application form.
   */
  async getInternFields() {
    return prisma.internField.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, description: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  },

  /**
   * Admin — all internship fields (including inactive) with intern counts.
   */
  async listInternFields() {
    return prisma.internField.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        order: true,
        _count: {
          select: { interns: { where: { role: "INTERN", deletedAt: null } } },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  },

  /**
   * Admin — create an internship field.
   */
  async createInternField(data: { name: string; description?: string; isActive?: boolean; order?: number }) {
    const name = data.name.trim();
    if (!name) throw new AppError(400, "Field name is required");

    const existing = await prisma.internField.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
    if (existing) throw new AppError(409, "A field with this name already exists");

    return prisma.internField.create({
      data: {
        name,
        description: data.description || null,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
      },
    });
  },

  /**
   * Admin — update an internship field.
   */
  async updateInternField(id: string, data: { name?: string; description?: string; isActive?: boolean; order?: number }) {
    const field = await prisma.internField.findUnique({ where: { id } });
    if (!field) throw new AppError(404, "Internship field not found");

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new AppError(400, "Field name is required");
      const existing = await prisma.internField.findFirst({
        where: { name: { equals: name, mode: "insensitive" }, id: { not: id }, deletedAt: null },
      });
      if (existing) throw new AppError(409, "A field with this name already exists");
      data.name = name;
    }

    return prisma.internField.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        order: data.order,
      },
    });
  },

  /**
   * Admin — soft-delete an internship field. Interns already assigned keep
   * their field reference.
   */
  async deleteInternField(id: string, deletedBy: string) {
    const field = await prisma.internField.findUnique({ where: { id } });
    if (!field) throw new AppError(404, "Internship field not found");

    return prisma.internField.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  },

  /**
   * Create a Razorpay order for the flat internship program fee. Creates or
   * updates the intern user (role INTERN) on first application so the Payment
   * record can reference the user; verification marks it PAID.
   */
  async createInternOrder(data: {
    name: string;
    phone?: string;
    email: string;
    designation: "WORKING" | "STUDYING";
    fieldId: string;
  }) {
    const { name, phone, email, designation, fieldId } = data;
    const normalizedEmail = email.trim().toLowerCase();

    const program = await this.getInternshipProgram();
    if (!program || !program.price || program.price <= 0) {
      throw new AppError(
        503,
        "Internship applications are not currently open. Please try again later.",
      );
    }

    const field = await prisma.internField.findFirst({
      where: { id: fieldId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!field) {
      throw new AppError(400, "The selected field is not available for internship.");
    }

    // Existing intern → reject duplicate in-flight/paid application
    // (one field only per person).
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user?.role === "INTERN") {
      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          packageId: program.id,
          status: { in: ["PENDING", "PAID"] },
        },
      });
      if (existingPayment) {
        throw new AppError(
          409,
          "An internship application for this email is already being processed.",
        );
      }
    }

    // Create intern user on first application (no password — no portal login).
    // One field per intern: persist the chosen field.
    const intern = user
      ? await prisma.user.update({
          where: { id: user.id },
          data: { name, phone: phone || null, designation, internFieldId: field.id },
        })
      : await prisma.user.create({
          data: {
            name,
            email: normalizedEmail,
            phone: phone || null,
            role: "INTERN",
            designation,
            internFieldId: field.id,
          },
        });

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: program.price,
      currency: "INR",
      receipt: `rcpt_intern_${Date.now().toString(36)}_${intern.id.slice(-8)}`,
    });

    const payment = await prisma.payment.create({
      data: {
        userId: intern.id,
        packageId: program.id,
        amount: program.price,
        currency: "INR",
        razorpayOrderId: order.id,
        status: "PENDING",
      },
    });

    return {
      orderId: order.id,
      amount: program.price,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
      field: { id: field.id, name: field.name },
      isNewUser: !user,
    };
  },

  /**
   * List interns (role INTERN) with their chosen field. Optionally filter by
   * field.
   */
  async listInterns(params?: PaginationParams & { fieldId?: string }) {
    const { page, limit, fieldId } = params || {};
    const { skip, take, page: p, limit: l } = paginate({ page, limit });

    const where: Record<string, unknown> = {
      role: "INTERN",
      deletedAt: null,
    };
    if (fieldId) where.internFieldId = fieldId;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          designation: true,
          internFieldId: true,
          internField: { select: { id: true, name: true } },
          payments: {
            where: { status: { in: ["PENDING", "PAID"] } },
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { items: users, total, page: p, limit: l };
  },

  /**
   * Create an intern online class session. targetFieldId = null → all
   * interns, otherwise only interns in that field.
   */
  async createInternSession(data: {
    title: string;
    description?: string;
    scheduledAt: string;
    scheduledEndAt?: string;
    joinUrl?: string;
    targetFieldId?: string;
    createdBy: string;
  }) {
    const {
      title,
      description,
      scheduledAt,
      scheduledEndAt,
      joinUrl,
      targetFieldId,
      createdBy,
    } = data;

    if (targetFieldId) {
      const field = await prisma.internField.findUnique({
        where: { id: targetFieldId },
      });
      if (!field) throw new AppError(400, "Target field not found");
    }

    const session = await prisma.internSession.create({
      data: {
        title,
        description: description || null,
        scheduledAt: new Date(scheduledAt),
        scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : null,
        joinUrl: joinUrl || null,
        targetFieldId: targetFieldId || null,
        createdBy,
      },
    });

    return session;
  },

  /**
   * List intern sessions, optionally filtered to upcoming/past.
   */
  async listInternSessions(params?: PaginationParams & { status?: string }) {
    const { page, limit, status } = params || {};
    const { skip, take, page: p, limit: l } = paginate({ page, limit });

    const now = new Date();
    const where: Record<string, unknown> = { deletedAt: null };
    if (status === "UPCOMING") where.scheduledAt = { gte: now };
    if (status === "PAST") where.scheduledAt = { lt: now };

    const [items, total] = await Promise.all([
      prisma.internSession.findMany({
        where,
        skip,
        take,
        include: {
          field: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.internSession.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  },

  /**
   * Soft-delete an intern session.
   */
  async deleteInternSession(id: string, deletedBy: string) {
    const session = await prisma.internSession.findUnique({ where: { id } });
    if (!session) throw new AppError(404, "Intern session not found");

    return prisma.internSession.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  },

  /**
   * Admin — update the flat internship program fee (CoursePackage price, paise).
   */
  async updateProgramFee(fee: number) {
    const program = await prisma.coursePackage.findFirst({
      where: { isInternship: true },
    });
    if (!program) throw new AppError(404, "Internship program not found");

    return prisma.coursePackage.update({
      where: { id: program.id },
      data: { price: fee },
      select: { id: true, name: true, price: true },
    });
  },
};
