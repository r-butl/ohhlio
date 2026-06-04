import { Request, Response } from 'express';

const prisma = require('../models/db');

const APP_URL = process.env.APP_URL || 'https://ohhlio.com';

export function generateSitemapXml(
  baseUrl: string,
  users: Array<{ username: string; updatedAt: Date }>,
  projects: Array<{ id: string; updatedAt: Date; user: { username: string } }>
): string {
  const userEntries = users.map(u =>
    `  <url>\n    <loc>${baseUrl}/${u.username}</loc>\n    <lastmod>${u.updatedAt.toISOString().split('T')[0]}</lastmod>\n  </url>`
  ).join('\n');

  const projectEntries = projects.map(p =>
    `  <url>\n    <loc>${baseUrl}/${p.user.username}/project/${p.id}</loc>\n    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>\n  </url>`
  ).join('\n');

  const homepageEntry = `  <url>\n    <loc>${baseUrl}/</loc>\n  </url>`;

  const allEntries = [homepageEntry, userEntries, projectEntries]
    .filter(Boolean)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allEntries}\n</urlset>`;
}

export const sitemapHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [users, projects] = await Promise.all([
      prisma.user.findMany({
        select: { username: true, updatedAt: true },
      }),
      prisma.project.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          updatedAt: true,
          user: { select: { username: true } },
        },
      }),
    ]);

    const xml = generateSitemapXml(APP_URL, users, projects);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Failed to generate sitemap');
  }
};
