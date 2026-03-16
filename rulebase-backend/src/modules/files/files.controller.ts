import { Request, Response, NextFunction } from 'express';
import * as filesService from './files.service';
import { AppError } from '../../shared/errors/AppError';
import path from 'path';
import fs from 'fs';
import { execFile, execFileSync } from 'child_process';

// Detect LibreOffice path once at module load
let _libreofficeCmd: string | null = null;
function getLibreOfficeCmd(): string | null {
  if (_libreofficeCmd !== undefined && _libreofficeCmd !== null) return _libreofficeCmd;
  const paths = ['soffice', 'libreoffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice'];
  for (const p of paths) {
    try { execFileSync(p, ['--version'], { timeout: 5000, stdio: 'ignore' }); _libreofficeCmd = p; return p; } catch {}
  }
  _libreofficeCmd = null;
  return null;
}

function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `${type}; filename="${encoded}"; filename*=UTF-8''${encoded}`;
}

export async function getFilesInFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const folderId = parseInt(req.query.folderId as string, 10);
    if (isNaN(folderId)) throw new AppError('folderId is required', 400);
    const files = await filesService.getFilesInFolder(folderId, req.user!.id, req.user!.role);
    res.json({ status: 'success', data: files });
  } catch (err) {
    next(err);
  }
}

export async function getAllFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const files = await filesService.getAllFiles(req.user!.id, req.user!.role);
    res.json({ status: 'success', data: files });
  } catch (err) {
    next(err);
  }
}

export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const folderId = parseInt(req.body.folderId, 10);
    if (isNaN(folderId)) throw new AppError('folderId is required', 400);

    // HWP files are sent as application/octet-stream by browsers; fix the MIME type
    let mimeType = req.file.mimetype;
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext === '.hwp' && !HWP_MIME_TYPES.includes(mimeType)) {
      mimeType = 'application/x-hwp';
    }

    const file = await filesService.uploadFile({
      folderId,
      originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8').normalize('NFC'),
      storedName: req.file.filename,
      mimeType,
      fileSize: req.file.size,
      uploadedBy: req.user!.id,
    });
    res.status(201).json({ status: 'success', data: file });
  } catch (err) {
    next(err);
  }
}

export async function downloadFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = await filesService.getFileById(fileId);
    const filePath = path.join(__dirname, '../../../storage/uploads', file.stored_name);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on disk', 404);
    }

    res.setHeader('Content-Disposition', contentDisposition('attachment', file.original_name));
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export async function viewFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = await filesService.getFileById(fileId);
    const filePath = path.join(__dirname, '../../../storage/uploads', file.stored_name);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on disk', 404);
    }

    res.setHeader('Content-Disposition', contentDisposition('inline', file.original_name));
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

const OFFICE_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const HWP_MIME_TYPES = [
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
];

export async function previewFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = await filesService.getFileById(fileId);
    const filePath = path.join(__dirname, '../../../storage/uploads', file.stored_name);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on disk', 404);
    }

    // PDF, images, text → serve directly (same as view)
    if (
      file.mime_type === 'application/pdf' ||
      file.mime_type.startsWith('image/') ||
      file.mime_type.startsWith('text/')
    ) {
      res.setHeader('Content-Disposition', contentDisposition('inline', file.original_name));
      res.setHeader('Content-Type', file.mime_type);
      return res.sendFile(filePath);
    }

    const fileExt = path.extname(file.original_name).toLowerCase();
    const previewDir = path.join(__dirname, '../../../storage/previews');
    const baseName = path.parse(file.stored_name).name;

    // HWP → convert to HTML via hwp5html
    if (HWP_MIME_TYPES.includes(file.mime_type) || fileExt === '.hwp') {
      const htmlDir = path.join(previewDir, baseName);
      const htmlPath = path.join(htmlDir, 'index.xhtml');

      if (!fs.existsSync(htmlPath)) {
        await new Promise<void>((resolve, reject) => {
          execFile(
            '/Users/bmlee/Library/Python/3.9/bin/hwp5html',
            ['--output', htmlDir, filePath],
            { timeout: 30000 },
            (error) => {
              if (error) reject(new AppError('HWP 변환에 실패했습니다.', 500));
              else resolve();
            },
          );
        });
      }

      if (!fs.existsSync(htmlPath)) {
        throw new AppError('변환된 HTML 파일을 찾을 수 없습니다.', 500);
      }

      // Rewrite relative resource paths to preview-assets endpoint
      let html = fs.readFileSync(htmlPath, 'utf8');
      const assetsBase = `/api/v1/files/${fileId}/preview-assets`;
      html = html.replace(/href="styles\.css"/g, `href="${assetsBase}/styles.css"`);
      html = html.replace(/src="bindata\//g, `src="${assetsBase}/bindata/`);
      html = html.replace(/url\(bindata\//g, `url(${assetsBase}/bindata/`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // Office → convert to PDF via LibreOffice
    const OFFICE_EXTENSIONS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    if (OFFICE_MIME_TYPES.includes(file.mime_type) || OFFICE_EXTENSIONS.includes(fileExt)) {
      const pdfPath = path.join(previewDir, `${baseName}.pdf`);

      if (!fs.existsSync(pdfPath)) {
        const libreofficeCmd = getLibreOfficeCmd();
        if (!libreofficeCmd) {
          throw new AppError('LibreOffice가 설치되어 있지 않습니다.', 500);
        }

        await new Promise<void>((resolve, reject) => {
          execFile(
            libreofficeCmd,
            ['--headless', '--convert-to', 'pdf', '--outdir', previewDir, filePath],
            { timeout: 30000 },
            (error) => {
              if (error) reject(new AppError('문서 변환에 실패했습니다.', 500));
              else resolve();
            },
          );
        });

        if (!fs.existsSync(pdfPath)) {
          throw new AppError('변환된 PDF 파일을 찾을 수 없습니다.', 500);
        }
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', contentDisposition('inline', path.parse(file.original_name).name + '.pdf'));
      return res.sendFile(pdfPath);
    }

    throw new AppError('이 파일 형식은 미리보기를 지원하지 않습니다.', 400);
  } catch (err) {
    next(err);
  }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.params.id, 10);
    await filesService.deleteFile(fileId);
    res.json({ status: 'success', message: 'File deleted' });
  } catch (err) {
    next(err);
  }
}
