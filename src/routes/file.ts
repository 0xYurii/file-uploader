import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { upload } from "../config/multer.js";

const router = Router();
const prisma = new PrismaClient();

// Auth middleware (check if user is logged in)
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// Upload file
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save file metadata to DB
    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        size: req.file.size.toString(),
        path: req.file.path,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      message: "File uploaded!",
      file: file,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's files
router.get("/files", requireAuth, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { userId: req.user!.id },
    });
    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder
router.post("/folders", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;

    const folder = await prisma.folder.create({
      data: {
        name: name,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      message: "Folder created!",
      folder: folder,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's folders
router.get("/folders", requireAuth, async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user!.id },
      include: {
        files: true, // Include files in each folder
      },
    });
    res.json({ folders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Move file to folder (update file's folderId)
router.patch("/files/:fileId/move", requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { folderId } = req.body;

    // Check file belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: parseInt(fileId),
        userId: req.user!.id,
      },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Update file's folder
    const updatedFile = await prisma.file.update({
      where: { id: parseInt(fileId) },
      data: { folderId: folderId ? parseInt(folderId) : null },
    });

    res.json({
      message: "File moved!",
      file: updatedFile,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
