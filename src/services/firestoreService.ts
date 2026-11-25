import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  createSafeDocId,
  db,
  handleFirestoreError,
  OperationType,
  toDateSafe,
} from '../firebase';
import {
  DEFAULT_BLOG_POSTS,
  DEFAULT_STORE_SETTINGS,
  DEFAULT_VOUCHER_RATES,
} from '../data/defaultData';
import {
  BlogPost,
  ChannelPreference,
  CustomerInquiry,
  InquiryStatus,
  InquiryType,
  PostCategory,
  PostImageKey,
  RateStatus,
  SCHEMA_LIMITS,
  StoreSettings,
  VoucherCategory,
  VoucherRate,
  VoucherType,
} from '../types';

const clampStr = (val: string, max: number) => val.trim().slice(0, max);
const clampNum = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(val) ? val : min));

// Real-time listener for public voucher rates
export function subscribeRates(
  onData: (rates: VoucherRate[], fromFirestore: boolean) => void,
  onError?: (err: Error) => void
) {
  const path = 'rates';
  const q = query(
    collection(db, path),
    where('status', 'in', ['매입가능', '우대매입', '일시중단'])
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(DEFAULT_VOUCHER_RATES, false);
        return;
      }
      const items: VoucherRate[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          brand: String(data.brand ?? ''),
          name: String(data.name ?? ''),
          category: (data.category as VoucherCategory) ?? 'department',
          voucherType: (data.voucherType as VoucherType) ?? '지류',
          denominations: String(data.denominations ?? ''),
          buyRate: Number(data.buyRate ?? 90),
          sellRate: Number(data.sellRate ?? 93),
          changeDelta: Number(data.changeDelta ?? 0),
          status: (data.status as RateStatus) ?? '매입가능',
          note: String(data.note ?? ''),
          sortOrder: Number(data.sortOrder ?? 99),
          updatedAt: toDateSafe(data.updatedAt),
        };
      });
      items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ko'));
      onData(items, true);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// Real-time listener for public store settings
export function subscribeStoreSettings(
  onData: (settings: StoreSettings, fromFirestore: boolean) => void,
  onError?: (err: Error) => void
) {
  const path = 'settings/store';
  return onSnapshot(
    doc(db, 'settings', 'store'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_STORE_SETTINGS, false);
        return;
      }
      const data = snap.data();
      const rawBiz = String(data.businessRegistration ?? '');
      if (rawBiz.includes('201-86-49120')) {
        onData(DEFAULT_STORE_SETTINGS, false);
        return;
      }
      onData(
        {
          blogTitle: String(data.blogTitle ?? DEFAULT_STORE_SETTINGS.blogTitle),
          noticeBanner: String(data.noticeBanner ?? DEFAULT_STORE_SETTINGS.noticeBanner),
          kakaoChannelUrl: String(data.kakaoChannelUrl ?? DEFAULT_STORE_SETTINGS.kakaoChannelUrl),
          kakaoChannelId: String(data.kakaoChannelId ?? DEFAULT_STORE_SETTINGS.kakaoChannelId),
          naverTalkUrl: String(data.naverTalkUrl ?? DEFAULT_STORE_SETTINGS.naverTalkUrl),
          phoneNumber: String(data.phoneNumber ?? DEFAULT_STORE_SETTINGS.phoneNumber),
          operatingHours: String(data.operatingHours ?? DEFAULT_STORE_SETTINGS.operatingHours),
          businessRegistration: String(
            data.businessRegistration ?? DEFAULT_STORE_SETTINGS.businessRegistration
          ),
          updatedAt: toDateSafe(data.updatedAt),
        },
        true
      );
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// Real-time listener for public blog posts
export function subscribeBlogPosts(
  onData: (posts: BlogPost[], fromFirestore: boolean) => void,
  onError?: (err: Error) => void
) {
  const path = 'posts';
  const q = query(
    collection(db, path),
    where('category', 'in', ['시세 리포트', '매입 가이드', '안전거래 안내', '공지사항'])
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(DEFAULT_BLOG_POSTS, false);
        return;
      }
      const items: BlogPost[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? ''),
          category: (data.category as PostCategory) ?? '매입 가이드',
          summary: String(data.summary ?? ''),
          content: String(data.content ?? ''),
          imageKey: (data.imageKey as PostImageKey) ?? 'department',
          readMinutes: Number(data.readMinutes ?? 3),
          publishedDate: String(data.publishedDate ?? ''),
          isPinned: Boolean(data.isPinned),
          updatedAt: toDateSafe(data.updatedAt),
        };
      });
      items.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.publishedDate.localeCompare(a.publishedDate);
      });
      onData(items, true);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// Admin-only real-time listener for customer inquiries
export function subscribeInquiriesAdmin(
  onData: (inquiries: CustomerInquiry[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'inquiries';
  const q = query(
    collection(db, path),
    where('status', 'in', ['접수대기', '상담중', '입금완료', '취소'])
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: CustomerInquiry[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          customerName: String(data.customerName ?? ''),
          contact: String(data.contact ?? ''),
          inquiryType: (data.inquiryType as InquiryType) ?? '매입 신청',
          voucherName: String(data.voucherName ?? ''),
          faceValue: Number(data.faceValue ?? 0),
          quantity: Number(data.quantity ?? 1),
          estimatedPayout: Number(data.estimatedPayout ?? 0),
          channelPreference: (data.channelPreference as ChannelPreference) ?? '카카오톡',
          message: String(data.message ?? ''),
          status: (data.status as InquiryStatus) ?? '접수대기',
          adminMemo: String(data.adminMemo ?? ''),
          createdAt: toDateSafe(data.createdAt),
          updatedAt: toDateSafe(data.updatedAt),
        };
      });
      items.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

// Public customer quick inquiry submission (strictly sanitized to blueprint bounds)
export async function submitCustomerInquiry(input: {
  customerName: string;
  contact: string;
  inquiryType: InquiryType;
  voucherName: string;
  faceValue: number;
  quantity: number;
  estimatedPayout: number;
  channelPreference: ChannelPreference;
  message: string;
}): Promise<string> {
  const inquiryId = createSafeDocId('inq');
  const path = `inquiries/${inquiryId}`;

  const payload = {
    customerName: clampStr(input.customerName, SCHEMA_LIMITS.inquiry.customerNameMax),
    contact: clampStr(input.contact, SCHEMA_LIMITS.inquiry.contactMax),
    inquiryType: input.inquiryType,
    voucherName: clampStr(input.voucherName, SCHEMA_LIMITS.inquiry.voucherNameMax),
    faceValue: Math.round(
      clampNum(input.faceValue, SCHEMA_LIMITS.inquiry.minFaceValue, SCHEMA_LIMITS.inquiry.maxFaceValue)
    ),
    quantity: Math.round(
      clampNum(input.quantity, SCHEMA_LIMITS.inquiry.minQuantity, SCHEMA_LIMITS.inquiry.maxQuantity)
    ),
    estimatedPayout: Math.round(clampNum(input.estimatedPayout, 0, SCHEMA_LIMITS.inquiry.maxFaceValue)),
    channelPreference: input.channelPreference,
    message: clampStr(input.message, SCHEMA_LIMITS.inquiry.messageMax),
    status: '접수대기' as InquiryStatus,
    adminMemo: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'inquiries', inquiryId), payload);
    return inquiryId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Admin: Upsert voucher rate
export async function saveVoucherRate(rate: Omit<VoucherRate, 'updatedAt'>): Promise<void> {
  const safeId = rate.id.replace(/[^a-zA-Z0-9_-]/g, '') || createSafeDocId('rate');
  const path = `rates/${safeId}`;
  const payload = {
    brand: clampStr(rate.brand, SCHEMA_LIMITS.rate.brandMax) || '기타',
    name: clampStr(rate.name, SCHEMA_LIMITS.rate.nameMax) || '상품권',
    category: rate.category,
    voucherType: rate.voucherType,
    denominations: clampStr(rate.denominations, SCHEMA_LIMITS.rate.denominationsMax) || '1만원 / 5만원 / 10만원',
    buyRate: Number(clampNum(rate.buyRate, SCHEMA_LIMITS.rate.minRate, SCHEMA_LIMITS.rate.maxRate).toFixed(2)),
    sellRate: Number(clampNum(rate.sellRate, SCHEMA_LIMITS.rate.minRate, SCHEMA_LIMITS.rate.maxRate).toFixed(2)),
    changeDelta: Number(clampNum(rate.changeDelta, -20, 20).toFixed(2)),
    status: rate.status,
    note: clampStr(rate.note, SCHEMA_LIMITS.rate.noteMax),
    sortOrder: Math.round(clampNum(rate.sortOrder, 0, 999)),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'rates', safeId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteVoucherRate(rateId: string): Promise<void> {
  const path = `rates/${rateId}`;
  try {
    await deleteDoc(doc(db, 'rates', rateId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Admin: Update customer inquiry status & internal memo
export async function updateInquiryStatusAdmin(
  inquiryId: string,
  status: InquiryStatus,
  adminMemo: string
): Promise<void> {
  const path = `inquiries/${inquiryId}`;
  try {
    await updateDoc(doc(db, 'inquiries', inquiryId), {
      status,
      adminMemo: clampStr(adminMemo, SCHEMA_LIMITS.inquiry.adminMemoMax),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteInquiryAdmin(inquiryId: string): Promise<void> {
  const path = `inquiries/${inquiryId}`;
  try {
    await deleteDoc(doc(db, 'inquiries', inquiryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Admin: Save store channel & notice settings
export async function saveStoreSettingsAdmin(settings: Omit<StoreSettings, 'updatedAt'>): Promise<void> {
  const path = 'settings/store';
  const payload = {
    blogTitle: clampStr(settings.blogTitle, SCHEMA_LIMITS.settings.blogTitleMax) || DEFAULT_STORE_SETTINGS.blogTitle,
    noticeBanner: clampStr(settings.noticeBanner, SCHEMA_LIMITS.settings.noticeBannerMax),
    kakaoChannelUrl: clampStr(settings.kakaoChannelUrl, SCHEMA_LIMITS.settings.urlMax),
    kakaoChannelId:
      clampStr(settings.kakaoChannelId, SCHEMA_LIMITS.settings.kakaoIdMax) || DEFAULT_STORE_SETTINGS.kakaoChannelId,
    naverTalkUrl: clampStr(settings.naverTalkUrl, SCHEMA_LIMITS.settings.urlMax),
    phoneNumber:
      clampStr(settings.phoneNumber, SCHEMA_LIMITS.settings.phoneMax) || DEFAULT_STORE_SETTINGS.phoneNumber,
    operatingHours:
      clampStr(settings.operatingHours, SCHEMA_LIMITS.settings.operatingHoursMax) ||
      DEFAULT_STORE_SETTINGS.operatingHours,
    businessRegistration:
      clampStr(settings.businessRegistration, SCHEMA_LIMITS.settings.businessRegistrationMax) ||
      DEFAULT_STORE_SETTINGS.businessRegistration,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'settings', 'store'), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Admin: Save or delete blog post
export async function saveBlogPostAdmin(post: Omit<BlogPost, 'updatedAt'>): Promise<void> {
  const safeId = post.id.replace(/[^a-zA-Z0-9_-]/g, '') || createSafeDocId('post');
  const path = `posts/${safeId}`;
  const payload = {
    title: clampStr(post.title, SCHEMA_LIMITS.post.titleMax) || '매입 안내',
    category: post.category,
    summary: clampStr(post.summary, SCHEMA_LIMITS.post.summaryMax) || '상품권 매입 안내입니다.',
    content: clampStr(post.content, SCHEMA_LIMITS.post.contentMax) || '내용을 입력해 주세요.',
    imageKey: post.imageKey,
    readMinutes: Math.round(clampNum(post.readMinutes, 1, 30)),
    publishedDate: clampStr(post.publishedDate, SCHEMA_LIMITS.post.publishedDateMax) || '2026.11.24',
    isPinned: Boolean(post.isPinned),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'posts', safeId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteBlogPostAdmin(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Admin: Seed initial Korean voucher rates, settings, and blog posts into Firestore
export async function seedInitialDatabaseAdmin(): Promise<{
  seededRates: number;
  seededPosts: number;
  seededSettings: boolean;
}> {
  const batch = writeBatch(db);
  let seededRates = 0;
  let seededPosts = 0;
  let seededSettings = false;

  try {
    const existingRates = await getDocs(
      query(collection(db, 'rates'), where('status', 'in', ['매입가능', '우대매입', '일시중단']))
    );
    if (existingRates.empty) {
      for (const rate of DEFAULT_VOUCHER_RATES) {
        const { id, updatedAt: _u, ...rest } = rate;
        batch.set(doc(db, 'rates', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
        seededRates += 1;
      }
    }

    const existingPosts = await getDocs(
      query(
        collection(db, 'posts'),
        where('category', 'in', ['시세 리포트', '매입 가이드', '안전거래 안내', '공지사항'])
      )
    );
    if (existingPosts.empty) {
      for (const post of DEFAULT_BLOG_POSTS) {
        const { id, updatedAt: _u, ...rest } = post;
        batch.set(doc(db, 'posts', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
        seededPosts += 1;
      }
    }

    const existingSettings = await getDoc(doc(db, 'settings', 'store'));
    if (!existingSettings.exists()) {
      const { updatedAt: _u, ...rest } = DEFAULT_STORE_SETTINGS;
      batch.set(doc(db, 'settings', 'store'), {
        ...rest,
        updatedAt: serverTimestamp(),
      });
      seededSettings = true;
    }

    if (seededRates > 0 || seededPosts > 0 || seededSettings) {
      await batch.commit();
    }
    return { seededRates, seededPosts, seededSettings };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'batch-seed');
  }
}
