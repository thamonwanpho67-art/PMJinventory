export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'LOAN_REQUEST' | 'LOAN_APPROVED' | 'LOAN_REJECTED' | 'LOAN_RETURNED' | 'LOW_STOCK' | 'SYSTEM';
  targetRole: 'ADMIN' | 'USER';
  relatedId?: string;
  relatedType?: string;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const notification = await (prisma as any).notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        targetRole: data.targetRole,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        isRead: false
      }
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function createLoanRequestNotification(loanId: string, userName: string, assetName: string) {
  return createNotification({
    title: 'คำขอยืมใหม่',
    message: `${userName} ขอยืม ${assetName}`,
    type: 'LOAN_REQUEST',
    targetRole: 'ADMIN',
    relatedId: loanId,
    relatedType: 'loan'
  });
}

export async function createLoanApprovedNotification(loanId: string, userName: string, assetName: string) {
  return createNotification({
    title: 'คำขอยืมได้รับอนุมัติ',
    message: `คำขอยืม ${assetName} ของคุณได้รับอนุมัติแล้ว`,
    type: 'LOAN_APPROVED',
    targetRole: 'USER',
    relatedId: loanId,
    relatedType: 'loan'
  });
}

export async function createLoanRejectedNotification(loanId: string, userName: string, assetName: string) {
  return createNotification({
    title: 'คำขอยืมถูกปฏิเสธ',
    message: `คำขอยืม ${assetName} ของคุณถูกปฏิเสธ`,
    type: 'LOAN_REJECTED',
    targetRole: 'USER',
    relatedId: loanId,
    relatedType: 'loan'
  });
}

export async function createLoanReturnedNotification(loanId: string, userName: string, assetName: string) {
  return createNotification({
    title: 'ครุภัณฑ์ถูกส่งคืน',
    message: `${userName} ส่งคืน ${assetName} แล้ว`,
    type: 'LOAN_RETURNED',
    targetRole: 'ADMIN',
    relatedId: loanId,
    relatedType: 'loan'
  });
}