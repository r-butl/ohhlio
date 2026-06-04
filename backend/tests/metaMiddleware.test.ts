import express from 'express';
import request from 'supertest';
import { buildMetaTags, createMetaRouter } from '../src/middleware/metaMiddleware';

jest.mock('../src/models/db', () => ({
  user: { findUnique: jest.fn() },
  project: { findFirst: jest.fn() },
}));

jest.mock('../src/services/s3Service', () => ({
  getSignedDownloadUrl: jest.fn(),
}));

const prisma = require('../src/models/db');
const { getSignedDownloadUrl } = require('../src/services/s3Service');

const FAKE_HTML = '<html><head><!-- META_TAGS --></head><body></body></html>';

describe('buildMetaTags', () => {
  it('includes title, description, and og tags', () => {
    const result = buildMetaTags({
      title: 'alice | Ohhlio',
      description: 'Design portfolio',
      url: 'https://ohhlio.com/alice',
    });
    expect(result).toContain('<title>alice | Ohhlio</title>');
    expect(result).toContain('<meta name="description" content="Design portfolio"');
    expect(result).toContain('<meta property="og:title" content="alice | Ohhlio"');
    expect(result).toContain('<meta property="og:url" content="https://ohhlio.com/alice"');
  });

  it('includes og:image when provided', () => {
    const result = buildMetaTags({
      title: 'Test',
      description: 'Desc',
      url: 'https://ohhlio.com/test',
      ogImage: 'https://s3.example.com/img.jpg',
    });
    expect(result).toContain('<meta property="og:image" content="https://s3.example.com/img.jpg"');
  });

  it('omits og:image when not provided', () => {
    const result = buildMetaTags({ title: 'T', description: 'D', url: 'https://ohhlio.com/t' });
    expect(result).not.toContain('og:image');
  });
});

describe('createMetaRouter - /:username', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(createMetaRouter(FAKE_HTML));
  });

  it('injects user meta tags when user exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      username: 'alice',
      description: 'My design work',
      profileImage: null,
    });

    const res = await request(app).get('/alice');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>alice | Ohhlio</title>');
    expect(res.text).toContain('My design work');
    expect(res.text).not.toContain('<!-- META_TAGS -->');
  });

  it('uses fallback description when user has no description', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      username: 'alice',
      description: null,
      profileImage: null,
    });

    const res = await request(app).get('/alice');
    expect(res.text).toContain("View alice's portfolio on Ohhlio.");
  });

  it('uses generic meta when user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/nobody');
    expect(res.text).toContain('<title>Ohhlio</title>');
    expect(res.text).toContain('Build and share your portfolio with Ohhlio.');
  });

  it('includes og:image when user has profile image', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      username: 'alice',
      description: null,
      profileImage: { filePath: 'users/alice/photo.jpg' },
    });
    (getSignedDownloadUrl as jest.Mock).mockResolvedValue('https://s3.example.com/photo.jpg');

    const res = await request(app).get('/alice');
    expect(res.text).toContain('https://s3.example.com/photo.jpg');
  });
});

describe('createMetaRouter - /:username/project/:projectId', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(createMetaRouter(FAKE_HTML));
  });

  it('injects project meta tags when project is found', async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({
      title: 'Brand Identity',
      description: 'Branding for a startup',
      headerPhoto: null,
      user: { username: 'alice' },
    });

    const res = await request(app).get('/alice/project/proj-abc');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>Brand Identity | alice | Ohhlio</title>');
    expect(res.text).toContain('Branding for a startup');
    expect(res.text).not.toContain('<!-- META_TAGS -->');
  });

  it('uses fallback description when project has no description', async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({
      title: 'Brand Identity',
      description: null,
      headerPhoto: null,
      user: { username: 'alice' },
    });

    const res = await request(app).get('/alice/project/proj-abc');
    expect(res.text).toContain('A project by alice on Ohhlio.');
  });

  it('uses generic meta when project not found or private', async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/alice/project/bad-id');
    expect(res.text).toContain('<title>Ohhlio</title>');
    expect(res.text).toContain('Build and share your portfolio with Ohhlio.');
  });

  it('includes og:image when project has header photo', async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValue({
      title: 'Brand Identity',
      description: null,
      headerPhoto: { filePath: 'users/alice/header.jpg' },
      user: { username: 'alice' },
    });
    (getSignedDownloadUrl as jest.Mock).mockResolvedValue('https://s3.example.com/header.jpg');

    const res = await request(app).get('/alice/project/proj-abc');
    expect(res.text).toContain('https://s3.example.com/header.jpg');
  });
});
