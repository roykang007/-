import {
  BlogPost,
  ChannelPreference,
  CustomerInquiry,
  InquiryStatus,
  InquiryType,
  StoreSettings,
  VoucherRate,
} from '../types';

export interface AdminAuthStatus {
  configured: boolean;
  mode: 'env' | 'claimed' | 'unconfigured';
  adminId: string;
}

export interface PublicStatePayload {
  rates: VoucherRate[];
  settings: StoreSettings;
  posts: BlogPost[];
}

function hydrateDates<T extends { updatedAt?: Date | string | null; createdAt?: Date | string | null }>(
  item: T
): T {
  return {
    ...item,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
    createdAt: item.createdAt ? new Date(item.createdAt) : null,
  };
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof (data as { error?: string }).error === 'string'
        ? (data as { error: string }).error
        : `요청 처리에 실패했습니다 (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function fetchPublicStateApi(): Promise<PublicStatePayload> {
  const res = await fetch('/api/public/state');
  const data = await parseJsonOrThrow<PublicStatePayload>(res);
  return {
    rates: data.rates.map(hydrateDates),
    settings: hydrateDates(data.settings),
    posts: data.posts.map(hydrateDates),
  };
}

export async function submitInquiryApi(input: {
  id?: string;
  customerName: string;
  contact: string;
  inquiryType: InquiryType;
  voucherName: string;
  faceValue: number;
  quantity: number;
  estimatedPayout: number;
  channelPreference: ChannelPreference;
  message: string;
}): Promise<{ id: string }> {
  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<{ id: string }>(res);
}

export async function fetchAdminStatusApi(): Promise<AdminAuthStatus> {
  const res = await fetch('/api/admin/status');
  return parseJsonOrThrow<AdminAuthStatus>(res);
}

export async function setupAdminPasswordApi(
  id: string,
  password: string
): Promise<{ token: string; expiresAt: number; adminId: string }> {
  const res = await fetch('/api/admin/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });
  return parseJsonOrThrow(res);
}

export async function loginAdminApi(
  id: string,
  password: string
): Promise<{ token: string; expiresAt: number; adminId: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password }),
  });
  return parseJsonOrThrow(res);
}

export async function logoutAdminApi(token: string): Promise<void> {
  await fetch('/api/admin/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

export async function fetchAdminInquiriesApi(token: string): Promise<CustomerInquiry[]> {
  const res = await fetch('/api/admin/inquiries', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonOrThrow<{ inquiries: CustomerInquiry[] }>(res);
  return data.inquiries.map(hydrateDates);
}

export async function updateInquiryApi(
  token: string,
  inquiryId: string,
  status: InquiryStatus,
  adminMemo: string
): Promise<CustomerInquiry> {
  const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, adminMemo }),
  });
  const data = await parseJsonOrThrow<CustomerInquiry>(res);
  return hydrateDates(data);
}

export async function deleteInquiryApi(token: string, inquiryId: string): Promise<void> {
  const res = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJsonOrThrow(res);
}

export async function saveRateApi(
  token: string,
  rate: Omit<VoucherRate, 'updatedAt'>
): Promise<VoucherRate> {
  const res = await fetch(`/api/admin/rates/${encodeURIComponent(rate.id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rate),
  });
  const data = await parseJsonOrThrow<VoucherRate>(res);
  return hydrateDates(data);
}

export async function deleteRateApi(token: string, rateId: string): Promise<void> {
  const res = await fetch(`/api/admin/rates/${encodeURIComponent(rateId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJsonOrThrow(res);
}

export async function saveSettingsApi(
  token: string,
  settings: Omit<StoreSettings, 'updatedAt'>
): Promise<StoreSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  const data = await parseJsonOrThrow<StoreSettings>(res);
  return hydrateDates(data);
}

export async function savePostApi(
  token: string,
  post: Omit<BlogPost, 'updatedAt'>
): Promise<BlogPost> {
  const res = await fetch(`/api/admin/posts/${encodeURIComponent(post.id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(post),
  });
  const data = await parseJsonOrThrow<BlogPost>(res);
  return hydrateDates(data);
}

export async function deletePostApi(token: string, postId: string): Promise<void> {
  const res = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJsonOrThrow(res);
}
