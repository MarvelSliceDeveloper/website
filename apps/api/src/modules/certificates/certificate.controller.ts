import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { certificateService } from './certificate.service';

export const certificateController = {
    // Lists all certificates and claimable ones for the user
    async listMyCertificates(req: AuthRequest, res: Response) {
        try {
            const data = await certificateService.getMyCertificates(req.user!.userId);
            return res.json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Claims a certificate for a completed course
    async claim(req: AuthRequest, res: Response) {
        try {
            const { courseId } = req.body;
            if (!courseId) {
                return res.status(400).json({ error: 'courseId is required' });
            }

            const certificate = await certificateService.claimCertificate(req.user!.userId, courseId);
            return res.status(201).json({ certificate });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    },
};