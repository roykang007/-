import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  DEFAULT_BLOG_POSTS,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_VOUCHER_RATES,
} from './src/data/defaultData.ts';
import {
  CHANNEL_PREFERENCES,
  INQUIRY_STATUSES,
  INQUIRY_TYPES,
  POST_CATEGORIES,
  RATE_STATUSES,
  SCHEMA_LIMITS,
  VOUCHER_TYPES,
  type BlogPost,
  type ChannelPreference,
  type CustomerInquiry,
  type InquiryStatus,
  type InquiryType,
  type PostCategory,
  type PostImageKey,
  type RateStatus,
  type StoreSettings,
  type VoucherCategory,
  type VoucherRate,
  type VoucherType,
} from './src/types.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Server-side admin configuration (no hardcoded passwords!)
const ADMIN_ID = (process.env.ADMIN_ID || 'admin').trim();
const ENV_ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 16
    ? process.env.ADMIN_SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const activeSessions = new Map<string, number>();

// Simple sliding-window brute-force guard for admin login
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const MAX_LOGIN_FAILS = 10;
const loginFailures = new Map<string, number[]>();

interface PersistedStore {
  adminPasswordHash: string | null; // Format: "scrypt:<saltHex>:<keyHex>" (never plaintext)
  rates: VoucherRate[];
  inquiries: CustomerInquiry[];
  settings: StoreSettings;
  posts: BlogPost[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

const VALID_CATEGORIES: VoucherCategory[] = ['department', 'mobile', 'culture', 'mart'];
const VALID_IMAGE_KEYS: PostImageKey[] = ['department', 'mobile', 'culture', 'hero'];

function clampStr(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function clampNum(value: unknown, min: number, max: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function sanitizeSafeId(value: unknown, prefix: string): string {
  const cleaned = typeof value === 'string' ? value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) : '';
  if (cleaned.length >= 1) return cleaned;
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

function sanitizeHttpUrl(value: unknown, max: number): string {
  const raw = clampStr(value, max);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString().slice(0, max);
    }
  } catch {
    return '';
  }
  return '';
}

function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, keyHex] = parts;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function verifyConstantTimeString(input: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function issueSessionToken(adminId: string): { token: string; expiresAt: number } {
  const jti = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ sub: adminId.toLowerCase(), jti, exp: expiresAt })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  activeSessions.set(jti, expiresAt);
  return { token: `${payload}.${sig}`, expiresAt };
}

function verifySessionToken(token: string): { sub: string; jti: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      jti?: string;
      exp?: number;
    };
    if (!decoded.jti || !decoded.sub || typeof decoded.exp !== 'number') return null;
    if (Date.now() > decoded.exp) {
      activeSessions.delete(decoded.jti);
      return null;
    }
    if (!activeSessions.has(decoded.jti)) return null;
    return { sub: decoded.sub, jti: decoded.jti };
  } catch {
    return null;
  }
}

function loadStore(): PersistedStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) as Partial<PersistedStore>;
      return {
        adminPasswordHash:
          typeof raw.adminPasswordHash === 'string' && raw.adminPasswordHash.startsWith('scrypt:')
            ? raw.adminPasswordHash
            : null,
        rates: Array.isArray(raw.rates) && raw.rates.length > 0 ? raw.rates : DEFAULT_VOUCHER_RATES,
        inquiries: Array.isArray(raw.inquiries) ? raw.inquiries : [],
        settings: raw.settings ? { ...DEFAULT_STORE_SETTINGS, ...raw.settings } : DEFAULT_STORE_SETTINGS,
        posts: Array.isArray(raw.posts) && raw.posts.length > 0 ? raw.posts : DEFAULT_BLOG_POSTS,
      };
    }
  } catch (err) {
    console.error('Failed to read server store, initializing defaults:', err);
  }
  return {
    adminPasswordHash: null,
    rates: DEFAULT_VOUCHER_RATES,
    inquiries: [],
    settings: DEFAULT_STORE_SETTINGS,
    posts: DEFAULT_BLOG_POSTS,
  };
}

let store: PersistedStore = loadStore();

function persistStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), { mode: 0o600 });
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = (loginFailures.get(ip) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS);
  loginFailures.set(ip, attempts);
  return attempts.length < MAX_LOGIN_FAILS;
}

function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const attempts = (loginFailures.get(ip) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS);
  attempts.push(now);
  loginFailures.set(ip, attempts);
}

function clearLoginFailures(ip: string): void {
  loginFailures.delete(ip);
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '관리자 인증이 필요합니다.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: '관리자 세션이 만료되었거나 유효하지 않습니다.' });
    return;
  }
  res.locals.adminSession = session;
  next();
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));

  // --- Admin Auth Status ---
  app.get('/api/admin/status', (_req, res) => {
    const mode = ENV_ADMIN_PASSWORD
      ? 'env'
      : store.adminPasswordHash
        ? 'claimed'
        : 'unconfigured';
    res.json({
      configured: mode !== 'unconfigured',
      mode,
      adminId: ADMIN_ID,
    });
  });

  // --- One-time First-Run Admin Password Setup (only when ADMIN_PASSWORD env is unset & unclaimed) ---
  app.post('/api/admin/setup', (req, res) => {
    if (ENV_ADMIN_PASSWORD || store.adminPasswordHash) {
      res.status(409).json({ error: '이미 관리자 비밀번호가 설정되어 있습니다.' });
      return;
    }

    const inputId = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (inputId.toLowerCase() !== ADMIN_ID.toLowerCase()) {
      res.status(400).json({ error: `관리자 ID는 "${ADMIN_ID}"(대소문자 무관)만 사용할 수 있습니다.` });
      return;
    }

    if (password.length < 4 || password.length > 128) {
      res.status(400).json({ error: '비밀번호는 4자 이상 128자 이하로 입력해 주세요.' });
      return;
    }

    store.adminPasswordHash = hashPasswordScrypt(password);
    persistStore();

    const session = issueSessionToken(ADMIN_ID);
    res.status(201).json({
      token: session.token,
      expiresAt: session.expiresAt,
      adminId: ADMIN_ID,
    });
  });

  // --- Admin Login (case-insensitive ID + constant-time password verification) ---
  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: '로그인 시도가 너무 많습니다. 5분 후 다시 시도해 주세요.' });
      return;
    }

    if (!ENV_ADMIN_PASSWORD && !store.adminPasswordHash) {
      res.status(409).json({
        error: '최초 관리자 비밀번호 설정이 필요합니다.',
        needsSetup: true,
      });
      return;
    }

    const inputId = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const idMatches = inputId.toLowerCase() === ADMIN_ID.toLowerCase();
    const passwordMatches = ENV_ADMIN_PASSWORD
      ? verifyConstantTimeString(password, ENV_ADMIN_PASSWORD)
      : store.adminPasswordHash
        ? verifyPasswordScrypt(password, store.adminPasswordHash)
        : false;

    if (!idMatches || !passwordMatches) {
      recordLoginFailure(ip);
      res.status(401).json({ error: '관리자 ID 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    clearLoginFailures(ip);
    const session = issueSessionToken(ADMIN_ID);
    res.json({
      token: session.token,
      expiresAt: session.expiresAt,
      adminId: ADMIN_ID,
    });
  });

  app.get('/api/admin/session', requireAdminAuth, (_req, res) => {
    res.json({ authenticated: true, adminId: ADMIN_ID });
  });

  app.post('/api/admin/logout', requireAdminAuth, (_req, res) => {
    const session = res.locals.adminSession as { jti?: string } | undefined;
    if (session?.jti) {
      activeSessions.delete(session.jti);
    }
    res.json({ ok: true });
  });

  // --- Public Market & Blog State (Never exposes inquiries or auth hashes) ---
  app.get('/api/public/state', (_req, res) => {
    const sortedRates = [...store.rates].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ko')
    );
    const sortedPosts = [...store.posts].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.publishedDate.localeCompare(a.publishedDate);
    });
    res.json({
      rates: sortedRates,
      settings: store.settings,
      posts: sortedPosts,
    });
  });

  // --- Public Customer Inquiry Drop-Box (Write-only) ---
  app.post('/api/inquiries', (req, res) => {
    const body = req.body ?? {};
    const customerName = clampStr(body.customerName, SCHEMA_LIMITS.inquiry.customerNameMax);
    const contact = clampStr(body.contact, SCHEMA_LIMITS.inquiry.contactMax);
    const voucherName = clampStr(body.voucherName, SCHEMA_LIMITS.inquiry.voucherNameMax);
    const inquiryType: InquiryType = INQUIRY_TYPES.includes(body.inquiryType)
      ? body.inquiryType
      : '매입 신청';
    const channelPreference: ChannelPreference = CHANNEL_PREFERENCES.includes(
      body.channelPreference
    )
      ? body.channelPreference
      : '카카오톡';

    if (customerName.length < 1 || contact.length < SCHEMA_LIMITS.inquiry.contactMin || !voucherName) {
      res.status(400).json({ error: '성함, 연락처, 상품권 품목을 정확히 입력해 주세요.' });
      return;
    }

    const now = new Date();
    const inquiry: CustomerInquiry = {
      id: sanitizeSafeId(body.id, 'inq'),
      customerName,
      contact,
      inquiryType,
      voucherName,
      faceValue: Math.round(
        clampNum(
          body.faceValue,
          SCHEMA_LIMITS.inquiry.minFaceValue,
          SCHEMA_LIMITS.inquiry.maxFaceValue
        )
      ),
      quantity: Math.round(
        clampNum(body.quantity, SCHEMA_LIMITS.inquiry.minQuantity, SCHEMA_LIMITS.inquiry.maxQuantity)
      ),
      estimatedPayout: Math.round(
        clampNum(body.estimatedPayout, 0, SCHEMA_LIMITS.inquiry.maxFaceValue)
      ),
      channelPreference,
      message: clampStr(body.message, SCHEMA_LIMITS.inquiry.messageMax),
      status: '접수대기',
      adminMemo: '',
      createdAt: now,
      updatedAt: now,
    };

    store.inquiries = [inquiry, ...store.inquiries].slice(0, 1000);
    persistStore();
    res.status(201).json({ id: inquiry.id });
  });

  // --- Protected Admin: Rates CRUD ---
  app.put('/api/admin/rates/:id', requireAdminAuth, (req, res) => {
    const rateId = sanitizeSafeId(req.params.id, 'rate');
    const body = req.body ?? {};
    const category: VoucherCategory = VALID_CATEGORIES.includes(body.category)
      ? body.category
      : 'department';
    const voucherType: VoucherType = VOUCHER_TYPES.includes(body.voucherType)
      ? body.voucherType
      : '지류';
    const status: RateStatus = RATE_STATUSES.includes(body.status) ? body.status : '매입가능';

    const updated: VoucherRate = {
      id: rateId,
      brand: clampStr(body.brand, SCHEMA_LIMITS.rate.brandMax) || '기타',
      name: clampStr(body.name, SCHEMA_LIMITS.rate.nameMax) || '상품권',
      category,
      voucherType,
      denominations:
        clampStr(body.denominations, SCHEMA_LIMITS.rate.denominationsMax) ||
        '1만원 / 5만원 / 10만원',
      buyRate: Number(
        clampNum(body.buyRate, SCHEMA_LIMITS.rate.minRate, SCHEMA_LIMITS.rate.maxRate).toFixed(2)
      ),
      sellRate: Number(
        clampNum(body.sellRate, SCHEMA_LIMITS.rate.minRate, SCHEMA_LIMITS.rate.maxRate).toFixed(2)
      ),
      changeDelta: Number(clampNum(body.changeDelta, -20, 20).toFixed(2)),
      status,
      note: clampStr(body.note, SCHEMA_LIMITS.rate.noteMax),
      sortOrder: Math.round(clampNum(body.sortOrder, 0, 999)),
      updatedAt: new Date(),
    };

    const idx = store.rates.findIndex((r) => r.id === rateId);
    if (idx >= 0) {
      store.rates[idx] = updated;
    } else {
      store.rates.push(updated);
    }
    persistStore();
    res.json(updated);
  });

  app.delete('/api/admin/rates/:id', requireAdminAuth, (req, res) => {
    const rateId = sanitizeSafeId(req.params.id, 'rate');
    store.rates = store.rates.filter((r) => r.id !== rateId);
    persistStore();
    res.json({ ok: true });
  });

  // --- Protected Admin: Inquiries CRM ---
  app.get('/api/admin/inquiries', requireAdminAuth, (_req, res) => {
    res.json({ inquiries: store.inquiries });
  });

  app.patch('/api/admin/inquiries/:id', requireAdminAuth, (req, res) => {
    const inquiryId = sanitizeSafeId(req.params.id, 'inq');
    const idx = store.inquiries.findIndex((i) => i.id === inquiryId);
    if (idx < 0) {
      res.status(404).json({ error: '해당 문의를 찾을 수 없습니다.' });
      return;
    }
    const status: InquiryStatus = INQUIRY_STATUSES.includes(req.body?.status)
      ? req.body.status
      : store.inquiries[idx].status;
    const adminMemo = clampStr(req.body?.adminMemo, SCHEMA_LIMITS.inquiry.adminMemoMax);

    store.inquiries[idx] = {
      ...store.inquiries[idx],
      status,
      adminMemo,
      updatedAt: new Date(),
    };
    persistStore();
    res.json(store.inquiries[idx]);
  });

  app.delete('/api/admin/inquiries/:id', requireAdminAuth, (req, res) => {
    const inquiryId = sanitizeSafeId(req.params.id, 'inq');
    store.inquiries = store.inquiries.filter((i) => i.id !== inquiryId);
    persistStore();
    res.json({ ok: true });
  });

  // --- Protected Admin: Store Settings ---
  app.put('/api/admin/settings', requireAdminAuth, (req, res) => {
    const body = req.body ?? {};
    store.settings = {
      blogTitle:
        clampStr(body.blogTitle, SCHEMA_LIMITS.settings.blogTitleMax) ||
        DEFAULT_STORE_SETTINGS.blogTitle,
      noticeBanner: clampStr(body.noticeBanner, SCHEMA_LIMITS.settings.noticeBannerMax),
      kakaoChannelUrl: sanitizeHttpUrl(body.kakaoChannelUrl, SCHEMA_LIMITS.settings.urlMax),
      kakaoChannelId:
        clampStr(body.kakaoChannelId, SCHEMA_LIMITS.settings.kakaoIdMax) ||
        DEFAULT_STORE_SETTINGS.kakaoChannelId,
      naverTalkUrl: sanitizeHttpUrl(body.naverTalkUrl, SCHEMA_LIMITS.settings.urlMax),
      phoneNumber:
        clampStr(body.phoneNumber, SCHEMA_LIMITS.settings.phoneMax) ||
        DEFAULT_STORE_SETTINGS.phoneNumber,
      operatingHours:
        clampStr(body.operatingHours, SCHEMA_LIMITS.settings.operatingHoursMax) ||
        DEFAULT_STORE_SETTINGS.operatingHours,
      businessRegistration:
        clampStr(body.businessRegistration, SCHEMA_LIMITS.settings.businessRegistrationMax) ||
        DEFAULT_STORE_SETTINGS.businessRegistration,
      updatedAt: new Date(),
    };
    persistStore();
    res.json(store.settings);
  });

  // --- Protected Admin: Blog Posts CRUD ---
  app.put('/api/admin/posts/:id', requireAdminAuth, (req, res) => {
    const postId = sanitizeSafeId(req.params.id, 'post');
    const body = req.body ?? {};
    const category: PostCategory = POST_CATEGORIES.includes(body.category)
      ? body.category
      : '매입 가이드';
    const imageKey: PostImageKey = VALID_IMAGE_KEYS.includes(body.imageKey)
      ? body.imageKey
      : 'department';

    const updated: BlogPost = {
      id: postId,
      title: clampStr(body.title, SCHEMA_LIMITS.post.titleMax) || '매입 안내',
      category,
      summary: clampStr(body.summary, SCHEMA_LIMITS.post.summaryMax) || '상품권 매입 안내입니다.',
      content: clampStr(body.content, SCHEMA_LIMITS.post.contentMax) || '내용을 입력해 주세요.',
      imageKey,
      readMinutes: Math.round(clampNum(body.readMinutes, 1, 30)),
      publishedDate:
        clampStr(body.publishedDate, SCHEMA_LIMITS.post.publishedDateMax) ||
        new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      isPinned: Boolean(body.isPinned),
      updatedAt: new Date(),
    };

    const idx = store.posts.findIndex((p) => p.id === postId);
    if (idx >= 0) {
      store.posts[idx] = updated;
    } else {
      store.posts.unshift(updated);
    }
    persistStore();
    res.json(updated);
  });

  app.delete('/api/admin/posts/:id', requireAdminAuth, (req, res) => {
    const postId = sanitizeSafeId(req.params.id, 'post');
    store.posts = store.posts.filter((p) => p.id !== postId);
    persistStore();
    res.json({ ok: true });
  });

  // --- Mount Vite middleware (dev) or static dist (prod) ---
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
