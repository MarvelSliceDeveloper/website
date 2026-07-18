import { Router, Request, Response } from "express";
import { fetchYouTubeVideoInfo } from "../../services/youtube.service";

const router = Router();

router.get("/video-info", async (req: Request, res: Response) => {
  const url = req.query.url as string | undefined;
  if (!url) {
    res.status(400).json({ error: "Missing 'url' query parameter" });
    return;
  }

  const info = await fetchYouTubeVideoInfo(url);
  if (!info) {
    res
      .status(404)
      .json({ error: "Could not fetch video info. Check the URL or API key." });
    return;
  }

  res.json(info);
});

export { router as youtubeRouter };
