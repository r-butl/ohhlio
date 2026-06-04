import { Request, Response, NextFunction, Router } from 'express';

const prisma = require('../models/db');
import { getSignedDownloadUrl } from '../services/s3Service';

const PLACEHOLDER = '<!-- META_TAGS -->';
const APP_URL = process.env.APP_URL || 'https://ohhlio.com';

const GENERIC_META = {
  title: 'Ohhlio',
  description: 'Build and share your portfolio with Ohhlio.',
};

export interface MetaTagOptions {
  title: string;
  description: string;
  url: string;
  ogImage?: string;
}

export function buildMetaTags(opts: MetaTagOptions): string {
  const { title, description, url, ogImage } = opts;
  const tags = [
    `  <title>${title}</title>`,
    `  <meta name="description" content="${description}" />`,
    `  <meta property="og:title" content="${title}" />`,
    `  <meta property="og:description" content="${description}" />`,
    `  <meta property="og:url" content="${url}" />`,
  ];
  if (ogImage) {
    tags.push(`  <meta property="og:image" content="${ogImage}" />`);
  }
  return tags.join('\n');
}

export function createMetaRouter(indexHtml: string): Router {
  const router = Router();

  router.get('/:username/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
    const { username, projectId } = req.params;
    try {
      const project = await prisma.project.findFirst({
        where: { id: projectId, isPublic: true, user: { username } },
        select: {
          title: true,
          description: true,
          headerPhoto: { select: { filePath: true } },
          user: { select: { username: true } },
        },
      });

      let metaTags: string;
      if (!project) {
        metaTags = buildMetaTags({
          title: GENERIC_META.title,
          description: GENERIC_META.description,
          url: `${APP_URL}/${username}/project/${projectId}`,
        });
      } else {
        let ogImage: string | undefined;
        if (project.headerPhoto) {
          try { ogImage = await getSignedDownloadUrl(project.headerPhoto.filePath); } catch { /* skip */ }
        }
        metaTags = buildMetaTags({
          title: `${project.title} | ${username} | Ohhlio`,
          description: project.description ?? `A project by ${username} on Ohhlio.`,
          url: `${APP_URL}/${username}/project/${projectId}`,
          ogImage,
        });
      }

      res.send(indexHtml.replace(PLACEHOLDER, metaTags));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          username: true,
          description: true,
          profileImage: { select: { filePath: true } },
        },
      });

      let metaTags: string;
      if (!user) {
        metaTags = buildMetaTags({
          title: GENERIC_META.title,
          description: GENERIC_META.description,
          url: `${APP_URL}/${username}`,
        });
      } else {
        let ogImage: string | undefined;
        if (user.profileImage) {
          try { ogImage = await getSignedDownloadUrl(user.profileImage.filePath); } catch { /* skip */ }
        }
        metaTags = buildMetaTags({
          title: `${username} | Ohhlio`,
          description: user.description ?? `View ${username}'s portfolio on Ohhlio.`,
          url: `${APP_URL}/${username}`,
          ogImage,
        });
      }

      res.send(indexHtml.replace(PLACEHOLDER, metaTags));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
