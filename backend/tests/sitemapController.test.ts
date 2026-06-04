import { generateSitemapXml } from '../src/controllers/sitemapController';

describe('generateSitemapXml', () => {
  const baseUrl = 'https://ohhlio.com';

  it('returns valid XML with sitemap namespace', () => {
    const xml = generateSitemapXml(baseUrl, [], []);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });

  it('includes homepage entry', () => {
    const xml = generateSitemapXml(baseUrl, [], []);
    expect(xml).toContain('<loc>https://ohhlio.com/</loc>');
  });

  it('includes a profile entry for each user', () => {
    const users = [
      { username: 'alice', updatedAt: new Date('2026-01-15') },
      { username: 'bob', updatedAt: new Date('2026-02-20') },
    ];
    const xml = generateSitemapXml(baseUrl, users, []);
    expect(xml).toContain('<loc>https://ohhlio.com/alice</loc>');
    expect(xml).toContain('<lastmod>2026-01-15</lastmod>');
    expect(xml).toContain('<loc>https://ohhlio.com/bob</loc>');
    expect(xml).toContain('<lastmod>2026-02-20</lastmod>');
  });

  it('includes a project entry for each public project', () => {
    const projects = [
      { id: 'proj-1', updatedAt: new Date('2026-03-10'), user: { username: 'alice' } },
    ];
    const xml = generateSitemapXml(baseUrl, [], projects);
    expect(xml).toContain('<loc>https://ohhlio.com/alice/project/proj-1</loc>');
    expect(xml).toContain('<lastmod>2026-03-10</lastmod>');
  });
});
