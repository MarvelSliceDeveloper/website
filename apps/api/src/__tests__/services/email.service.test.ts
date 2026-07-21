import { describe, it, expect } from "vitest";
import { emailService } from "../../services/email.service";

describe("emailService.getSubjectForType", () => {
  it("returns correct subject for SESSION_SCHEDULED", () => {
    const subject = emailService.getSubjectForType("SESSION_SCHEDULED", {
      courseName: "React Basics",
    });
    expect(subject).toBe("Live Session Scheduled — React Basics");
  });

  it("returns correct subject for SESSION_CANCELLED", () => {
    const subject = emailService.getSubjectForType("SESSION_CANCELLED", {
      courseName: "Node.js",
    });
    expect(subject).toBe("Session Cancelled — Node.js");
  });

  it("returns correct subject for RECORDING_AVAILABLE", () => {
    const subject = emailService.getSubjectForType("RECORDING_AVAILABLE", {
      courseName: "TypeScript",
    });
    expect(subject).toBe("Recording Available — TypeScript");
  });

  it("returns correct subject for ENROLLMENT_APPROVED", () => {
    const subject = emailService.getSubjectForType("ENROLLMENT_APPROVED", {
      courseName: "Python",
    });
    expect(subject).toBe("Enrollment Approved — Python");
  });

  it("returns correct subject for ENROLLMENT_REJECTED", () => {
    const subject = emailService.getSubjectForType("ENROLLMENT_REJECTED", {
      courseName: "Java",
    });
    expect(subject).toBe("Enrollment Update — Java");
  });

  it("returns correct subject for ASSIGNMENT_GRADED", () => {
    const subject = emailService.getSubjectForType("ASSIGNMENT_GRADED", {
      assignmentTitle: "HW 1",
    });
    expect(subject).toBe("Assignment Graded — HW 1");
  });

  it("returns correct subject for MENTORSHIP_CREATED", () => {
    const subject = emailService.getSubjectForType("MENTORSHIP_CREATED", {});
    expect(subject).toBe("Mentorship Request Submitted");
  });

  it("returns correct subject for SUPPORT_TICKET_CREATED", () => {
    const subject = emailService.getSubjectForType(
      "SUPPORT_TICKET_CREATED",
      {},
    );
    expect(subject).toBe("Support Ticket Submitted");
  });

  it("returns correct subject for CUSTOM_NOTIFICATION", () => {
    const subject = emailService.getSubjectForType("CUSTOM_NOTIFICATION", {
      title: "Custom Alert",
    });
    expect(subject).toBe("Custom Alert");
  });

  it("returns default subject for unknown type", () => {
    const subject = emailService.getSubjectForType("UNKNOWN_TYPE", {});
    expect(subject).toBe("Notification from LMS Portal");
  });

  it("returns default subject for CUSTOM_NOTIFICATION without title", () => {
    const subject = emailService.getSubjectForType("CUSTOM_NOTIFICATION", {});
    expect(subject).toBe("Notification from LMS Portal");
  });
});

describe("emailService.getTextForType", () => {
  it("returns correct text for SESSION_SCHEDULED", () => {
    const text = emailService.getTextForType("SESSION_SCHEDULED", {
      courseName: "React",
      batchName: "Batch A",
      sessionTitle: "Intro",
      scheduledAt: "2024-01-01",
      joinUrl: "https://meet.example.com",
    });
    expect(text).toContain("React");
    expect(text).toContain("Batch A");
    expect(text).toContain("Intro");
    expect(text).toContain("https://meet.example.com");
  });

  it("returns correct text for ENROLLMENT_REJECTED with reason", () => {
    const text = emailService.getTextForType("ENROLLMENT_REJECTED", {
      courseName: "Java",
      reason: "Prerequisites not met",
    });
    expect(text).toContain("Java");
    expect(text).toContain("Prerequisites not met");
  });

  it("returns correct text for ASSIGNMENT_GRADED", () => {
    const text = emailService.getTextForType("ASSIGNMENT_GRADED", {
      assignmentTitle: "Quiz 1",
      grade: "A+",
    });
    expect(text).toContain("Quiz 1");
    expect(text).toContain("A+");
  });

  it("returns correct text for CUSTOM_NOTIFICATION", () => {
    const text = emailService.getTextForType("CUSTOM_NOTIFICATION", {
      title: "Alert",
      message: "System maintenance",
    });
    expect(text).toContain("Alert");
    expect(text).toContain("System maintenance");
  });

  it("returns default text for unknown type", () => {
    const text = emailService.getTextForType("UNKNOWN_TYPE", {});
    expect(text).toBe("You have a new notification from LMS Portal.");
  });
});
