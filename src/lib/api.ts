const API_URL = 'https://functions.poehali.dev/deea9017-3c94-4c5e-aeae-f18b5c8099a3';

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  balance: string;
  total_earned: string;
  referrer_id?: number;
  referral_code: string;
  chat_bonus_claimed: boolean;
  referral_bonus_claimed: boolean;
  is_admin: boolean;
  created_at: string;
  last_updated: string;
  referral_count: number;
  active_deposits: string;
  referral_earnings?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: string;
  status: string;
  card_number?: string;
  currency?: string;
  description?: string;
  created_at: string;
  processed_at?: string;
}

export interface Referral {
  telegram_id: number;
  username?: string;
  first_name?: string;
  bonus_earned: string;
  created_at: string;
  total_deposits: string;
}

export const registerUser = async (telegramId: number, username: string, firstName: string, referrerCode?: string): Promise<User> => {
  const response = await fetch(`${API_URL}?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: telegramId,
      username,
      first_name: firstName,
      referral_code: `ref_${telegramId}`,
      referrer_code: referrerCode
    })
  });
  return response.json();
};

export const getUserData = async (telegramId: number): Promise<User> => {
  const response = await fetch(`${API_URL}?action=user&telegram_id=${telegramId}`);
  return response.json();
};

export const getTransactions = async (telegramId: number): Promise<Transaction[]> => {
  const response = await fetch(`${API_URL}?action=transactions&telegram_id=${telegramId}`);
  return response.json();
};

export const getReferrals = async (telegramId: number): Promise<Referral[]> => {
  const response = await fetch(`${API_URL}?action=referrals&telegram_id=${telegramId}`);
  return response.json();
};

export const createDepositRequest = async (telegramId: number, amount: number, currency: string = 'RUB'): Promise<Transaction> => {
  const response = await fetch(`${API_URL}?action=deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, amount, currency })
  });
  return response.json();
};

export const createWithdrawRequest = async (telegramId: number, amount: number, cardNumber: string): Promise<Transaction> => {
  const response = await fetch(`${API_URL}?action=withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, amount, card_number: cardNumber })
  });
  return response.json();
};

export const claimChatBonus = async (telegramId: number): Promise<{ success: boolean; amount: number }> => {
  const response = await fetch(`${API_URL}?action=claim_chat_bonus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId })
  });
  return response.json();
};

export const getAdminPending = async (telegramId: number): Promise<Transaction[]> => {
  const response = await fetch(`${API_URL}?action=admin_pending&telegram_id=${telegramId}`);
  return response.json();
};

export const adminApproveTransaction = async (adminId: number, transactionId: number): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}?action=admin_approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id: adminId, transaction_id: transactionId })
  });
  return response.json();
};

export const adminRejectTransaction = async (adminId: number, transactionId: number): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}?action=admin_reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id: adminId, transaction_id: transactionId })
  });
  return response.json();
};

export const accrueProfits = async (): Promise<{ accrued_count: number }> => {
  const response = await fetch(`${API_URL}?action=accrue`);
  return response.json();
};