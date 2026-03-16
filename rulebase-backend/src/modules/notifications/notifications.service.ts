import { transporter } from '../../config/email';
import { env } from '../../config/env';
import fs from 'fs';
import path from 'path';

function loadTemplate(name: string): string {
  const filePath = path.join(__dirname, '../../templates/emails', name);
  return fs.readFileSync(filePath, 'utf-8');
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [key, value]) => t.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
}

export async function sendRegistrationPending(adminEmail: string, userData: { username: string; email: string; displayName: string }) {
  const template = loadTemplate('registrationPending.html');
  const html = fillTemplate(template, {
    username: userData.username,
    email: userData.email,
    displayName: userData.displayName,
    adminUrl: `${env.FRONTEND_URL}/admin/users`,
  });
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: adminEmail,
    subject: '[RuleBaseEx] 새로운 회원가입 승인 요청',
    html,
  });
}

export async function sendRegistrationApproved(userEmail: string, displayName: string) {
  const template = loadTemplate('registrationApproved.html');
  const html = fillTemplate(template, {
    displayName,
    loginUrl: `${env.FRONTEND_URL}/auth`,
  });
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: userEmail,
    subject: '[RuleBaseEx] 회원가입이 승인되었습니다',
    html,
  });
}

export async function sendRegistrationRejected(userEmail: string, displayName: string) {
  const template = loadTemplate('registrationRejected.html');
  const html = fillTemplate(template, {
    displayName,
    contactEmail: env.ADMIN_EMAIL,
  });
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: userEmail,
    subject: '[RuleBaseEx] 회원가입 신청이 반려되었습니다',
    html,
  });
}

export async function sendPasswordReset(userEmail: string, displayName: string, token: string) {
  const template = loadTemplate('passwordReset.html');
  const html = fillTemplate(template, {
    displayName,
    resetUrl: `${env.FRONTEND_URL}/reset-password/${token}`,
  });
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: userEmail,
    subject: '[RuleBaseEx] 비밀번호 재설정 링크',
    html,
  });
}

export async function sendMentionNotification(
  mentionedUserEmail: string,
  mentionedUserName: string,
  questionerName: string,
  questionBody: string,
  fileName: string,
  fileId: number
) {
  const template = loadTemplate('mentionNotification.html');
  const html = fillTemplate(template, {
    mentionedUserName,
    questionerName,
    questionBody,
    fileName,
    fileUrl: `${env.FRONTEND_URL}/documents?fileId=${fileId}`,
  });
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: mentionedUserEmail,
    subject: `[RuleBaseEx] ${questionerName}님이 질의에서 회원님을 멘션했습니다`,
    html,
  });
}

export async function sendReplyNotification(
  questionerEmail: string,
  questionerName: string,
  replierName: string,
  replyBody: string,
  fileName: string,
  fileId: number
) {
  const template = loadTemplate('replyNotification.html');
  const html = fillTemplate(template, {
    questionerName,
    replierName,
    replyBody,
    fileName,
    fileUrl: `${env.FRONTEND_URL}/documents?fileId=${fileId}`,
  });
  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: questionerEmail,
    subject: `[RuleBaseEx] ${replierName}님이 회원님의 질의에 답글을 남겼습니다`,
    html,
  });
}
