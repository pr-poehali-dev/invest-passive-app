import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { getTelegramWebApp, getTelegramUser, getReferralCode, hapticFeedback, notificationFeedback, openTelegramLink } from '@/lib/telegram';
import DashboardTab from '@/components/DashboardTab';
import PortfolioTab from '@/components/PortfolioTab';
import WalletTab from '@/components/WalletTab';
import ReferralTab from '@/components/ReferralTab';
import Dialogs from '@/components/Dialogs';

export default function Index() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<api.User | null>(null);
  const [transactions, setTransactions] = useState<api.Transaction[]>([]);
  const [referrals, setReferrals] = useState<api.Referral[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [calcAmount, setCalcAmount] = useState([5000]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCard, setWithdrawCard] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [adminPending, setAdminPending] = useState<api.Transaction[]>([]);

  const dailyRate = 10.6;

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
    
    initUser();
    
    const interval = setInterval(() => {
      if (user) {
        refreshData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const initUser = async () => {
    try {
      const tgUser = getTelegramUser();
      const referrerCode = getReferralCode();
      
      const telegramId = tgUser?.id || 999999;
      const username = tgUser?.username || 'demo_user';
      const firstName = tgUser?.first_name || 'Demo User';
      
      const userData = await api.registerUser(telegramId, username, firstName, referrerCode || undefined);
      setUser(userData);
      
      const [txData, refData] = await Promise.all([
        api.getTransactions(telegramId),
        api.getReferrals(telegramId)
      ]);
      
      setTransactions(txData);
      setReferrals(refData);
      setLoading(false);
    } catch (error) {
      console.error('Init error:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить данные', variant: 'destructive' });
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!user) return;
    
    try {
      const [userData, txData, refData] = await Promise.all([
        api.getUserData(user.telegram_id),
        api.getTransactions(user.telegram_id),
        api.getReferrals(user.telegram_id)
      ]);
      
      setUser(userData);
      setTransactions(txData);
      setReferrals(refData);
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositAmount) return;
    
    try {
      hapticFeedback('medium');
      await api.createDepositRequest(user.telegram_id, parseFloat(depositAmount), currency);
      notificationFeedback('success');
      toast({ title: 'Заявка создана', description: 'Ожидайте подтверждения' });
      setShowDepositDialog(false);
      setDepositAmount('');
      refreshData();
    } catch (error) {
      notificationFeedback('error');
      toast({ title: 'Ошибка', description: 'Не удалось создать заявку', variant: 'destructive' });
    }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || !withdrawCard) return;
    
    try {
      hapticFeedback('medium');
      await api.createWithdrawRequest(user.telegram_id, parseFloat(withdrawAmount), withdrawCard);
      notificationFeedback('success');
      toast({ title: 'Заявка на вывод создана', description: 'Ожидайте обработки' });
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setWithdrawCard('');
      refreshData();
    } catch (error) {
      notificationFeedback('error');
      toast({ title: 'Ошибка', description: 'Не удалось создать заявку', variant: 'destructive' });
    }
  };

  const handleChatBonus = async () => {
    if (!user || user.chat_bonus_claimed) return;
    
    openTelegramLink('https://t.me/+tDcs_yy5mcU4MTgx');
    
    setTimeout(async () => {
      try {
        hapticFeedback('heavy');
        await api.claimChatBonus(user.telegram_id);
        notificationFeedback('success');
        toast({ title: 'Бонус получен!', description: '+100 ₽ зачислено на баланс' });
        refreshData();
      } catch (error) {
        notificationFeedback('error');
        toast({ title: 'Ошибка', description: 'Бонус уже получен или ошибка проверки', variant: 'destructive' });
      }
    }, 3000);
  };

  const copyReferralLink = () => {
    if (!user) return;
    
    const link = `https://t.me/your_bot?start=ref_${user.telegram_id}`;
    navigator.clipboard.writeText(link);
    hapticFeedback('light');
    toast({ title: 'Скопировано!', description: 'Ссылка скопирована в буфер обмена' });
  };

  const openAdminPanel = async () => {
    if (!user || !user.is_admin) return;
    
    try {
      const pending = await api.getAdminPending(user.telegram_id);
      setAdminPending(pending);
      setShowAdminDialog(true);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить заявки', variant: 'destructive' });
    }
  };

  const handleApprove = async (txId: number) => {
    if (!user) return;
    
    try {
      hapticFeedback('medium');
      await api.adminApproveTransaction(user.telegram_id, txId);
      notificationFeedback('success');
      toast({ title: 'Одобрено', description: 'Транзакция подтверждена' });
      openAdminPanel();
    } catch (error) {
      notificationFeedback('error');
      toast({ title: 'Ошибка', description: 'Не удалось одобрить', variant: 'destructive' });
    }
  };

  const handleReject = async (txId: number) => {
    if (!user) return;
    
    try {
      hapticFeedback('medium');
      await api.adminRejectTransaction(user.telegram_id, txId);
      notificationFeedback('warning');
      toast({ title: 'Отклонено', description: 'Транзакция отклонена' });
      openAdminPanel();
    } catch (error) {
      notificationFeedback('error');
      toast({ title: 'Ошибка', description: 'Не удалось отклонить', variant: 'destructive' });
    }
  };

  const openForum = () => {
    openTelegramLink('https://t.me/+tDcs_yy5mcU4MTgx');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ошибка загрузки</h2>
          <p className="text-muted-foreground mb-4">Не удалось загрузить данные пользователя</p>
          <Button onClick={initUser}>Повторить</Button>
        </Card>
      </div>
    );
  }

  const balance = parseFloat(user.balance);
  const totalEarned = parseFloat(user.total_earned);
  const activeDeposits = parseFloat(user.active_deposits || '0');
  const dailyIncome = (activeDeposits * dailyRate) / 100;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Invest Passive</h1>
            <div className="flex gap-2">
              {user.is_admin && (
                <Button variant="ghost" size="icon" className="text-white" onClick={openAdminPanel}>
                  <Icon name="Settings" size={24} />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-white">
                <Icon name="Bell" size={24} />
              </Button>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/80 text-sm mb-1">Общий баланс</p>
            <h2 className="text-3xl font-bold text-white">{balance.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</h2>
            <div className="flex items-center gap-2 mt-2">
              <Icon name="TrendingUp" size={16} className="text-success" />
              <span className="text-success text-sm font-semibold">+{dailyIncome.toFixed(2)} ₽ в день</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-card">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">
                <Icon name="LayoutDashboard" size={20} />
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary">
                <Icon name="PieChart" size={20} />
              </TabsTrigger>
              <TabsTrigger value="wallet" className="data-[state=active]:bg-primary">
                <Icon name="Wallet" size={20} />
              </TabsTrigger>
              <TabsTrigger value="referral" className="data-[state=active]:bg-primary">
                <Icon name="Users" size={20} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab 
                user={user}
                totalEarned={totalEarned}
                transactions={transactions}
                onDepositClick={() => setShowDepositDialog(true)}
                onForumClick={openForum}
                onRefresh={refreshData}
              />
            </TabsContent>

            <TabsContent value="portfolio">
              <PortfolioTab 
                activeDeposits={activeDeposits}
                dailyIncome={dailyIncome}
                dailyRate={dailyRate}
                calcAmount={calcAmount}
                onCalcAmountChange={setCalcAmount}
              />
            </TabsContent>

            <TabsContent value="wallet">
              <WalletTab 
                balance={balance}
                activeDeposits={activeDeposits}
                totalEarned={totalEarned}
                onDepositClick={() => setShowDepositDialog(true)}
                onWithdrawClick={() => setShowWithdrawDialog(true)}
              />
            </TabsContent>

            <TabsContent value="referral">
              <ReferralTab 
                user={user}
                referrals={referrals}
                onCopyLink={copyReferralLink}
                onChatBonus={handleChatBonus}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialogs 
        showDepositDialog={showDepositDialog}
        showWithdrawDialog={showWithdrawDialog}
        showAdminDialog={showAdminDialog}
        depositAmount={depositAmount}
        withdrawAmount={withdrawAmount}
        withdrawCard={withdrawCard}
        currency={currency}
        balance={balance}
        adminPending={adminPending}
        onDepositDialogChange={setShowDepositDialog}
        onWithdrawDialogChange={setShowWithdrawDialog}
        onAdminDialogChange={setShowAdminDialog}
        onDepositAmountChange={setDepositAmount}
        onWithdrawAmountChange={setWithdrawAmount}
        onWithdrawCardChange={setWithdrawCard}
        onCurrencyChange={setCurrency}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
