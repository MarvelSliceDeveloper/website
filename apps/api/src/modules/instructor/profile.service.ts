import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";

interface ProfileUpdateData {
  bio?: string;
  designation?: string;
  qualification?: string;
  experienceYears?: number;
  skills?: string[];
  currentlyEmployed?: boolean;
  companyName?: string;
  availableTime?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  resumeUrl?: string;
  languages?: string[];
  socialLinks?: Record<string, string>;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  upiId?: string;
}

export const profileService = {
  // GET /profile — Returns user info + InstructorProfile (or null)
  async getProfile(userId: string) {
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          instructorOnboardingComplete: true,
        },
      }),
      prisma.instructorProfile.findUnique({
        where: { userId },
      }),
    ]);

    return { user, profile };
  },

  // PUT /profile — Create or update the instructor profile
  async upsertProfile(userId: string, data: ProfileUpdateData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    // Strip undefined fields so Prisma only sets provided values
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    const existingProfile = await prisma.instructorProfile.findUnique({
      where: { userId },
    });

    // No profile yet -> create with PENDING status
    if (!existingProfile) {
      const profile = await prisma.instructorProfile.create({
        data: {
          userId,
          ...updateData,
          status: "PENDING",
        } as any,
      });

      await prisma.user.update({
        where: { id: userId },
        data: { instructorOnboardingComplete: true },
      });

      return profile;
    }

    // Profile was rejected -> update fields and reset to PENDING
    if (existingProfile.status === "REJECTED") {
      return prisma.instructorProfile.update({
        where: { userId },
        data: {
          ...updateData,
          status: "PENDING",
          rejectionReason: null,
        } as any,
      });
    }

    // Profile is APPROVED/ACTIVE/PENDING -> just update allowed fields
    return prisma.instructorProfile.update({
      where: { userId },
      data: updateData as any,
    });
  },

  // GET /profile/status — Onboarding status summary
  async getOnboardingStatus(userId: string) {
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { instructorOnboardingComplete: true },
      }),
      prisma.instructorProfile.findUnique({
        where: { userId },
        select: { status: true, rejectionReason: true },
      }),
    ]);

    return {
      profileComplete: !!profile,
      status: profile?.status ?? null,
      rejectionReason: profile?.rejectionReason ?? null,
      onboardingComplete: user?.instructorOnboardingComplete ?? false,
    };
  },
};
