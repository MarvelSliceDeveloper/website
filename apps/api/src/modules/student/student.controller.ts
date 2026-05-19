import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { studentService } from "./student.service";

export const studentController = {
    async listOverdueAssignments(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ error: "Authentication required" });

            const items = await studentService.getOverdueAssignments(req.user.userId);
            return res.status(200).json({ items });
        } catch (error: any) {
            console.error("Error listing overdue assignments:", error.message);
            return res.status(500).json({ error: "Failed to list overdue assignments" });
        }
    },
};
