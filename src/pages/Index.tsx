import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { getTelegramWebApp, getTelegramUser, getReferralCode, hapticFeedback, notificationFeedback, openTelegramLink } from '@/lib/telegram';

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
  const calculatedDaily = (calcAmount[0] * dailyRate) / 100;
  const calculatedMonthly = calculatedDaily * 30;

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

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="TrendingUp" size={18} className="text-success" />
                    <p className="text-xs text-muted-foreground">Заработано</p>
                  </div>
                  <p className="text-xl font-bold">{totalEarned.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</p>
                </Card>
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Users" size={18} className="text-primary" />
                    <p className="text-xs text-muted-foreground">Партнёров</p>
                  </div>
                  <p className="text-xl font-bold">{user.referral_count}</p>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => setShowDepositDialog(true)}>
                  <Icon name="Plus" size={18} className="mr-2" />
                  Пополнить
                </Button>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={openForum}>
                  <Icon name="MessageCircle" size={18} className="mr-2" />
                  Форум
                </Button>
              </div>

              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">История операций</h3>
                  <Button variant="ghost" size="sm" onClick={refreshData}>
                    <Icon name="RefreshCw" size={16} />
                  </Button>
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 10).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          tx.type === 'deposit' ? 'bg-primary/20' :
                          tx.type === 'profit' ? 'bg-success/20' :
                          tx.type === 'withdraw' ? 'bg-secondary/20' :
                          tx.type === 'bonus' ? 'bg-primary/20' :
                          'bg-primary/20'
                        }`}>
                          <Icon 
                            name={
                              tx.type === 'deposit' ? 'ArrowDown' :
                              tx.type === 'profit' ? 'TrendingUp' :
                              tx.type === 'withdraw' ? 'ArrowUp' :
                              tx.type === 'bonus' ? 'Gift' :
                              'Users'
                            } 
                            size={16} 
                            className={
                              tx.type === 'deposit' ? 'text-primary' :
                              tx.type === 'profit' ? 'text-success' :
                              tx.type === 'withdraw' ? 'text-secondary' :
                              tx.type === 'bonus' ? 'text-primary' :
                              'text-primary'
                            }
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description || tx.type}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.type === 'withdraw' ? 'text-secondary' : 'text-success'
                        }`}>
                          {tx.type === 'withdraw' ? '-' : '+'}{parseFloat(tx.amount).toLocaleString('ru-RU')} ₽
                        </p>
                        <Badge variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                          {tx.status === 'completed' ? 'Выполнено' : tx.status === 'pending' ? 'Ожидание' : 'Отклонено'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">Нет транзакций</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary to-secondary text-white">
                <p className="text-sm opacity-90 mb-1">Активные вклады</p>
                <h3 className="text-3xl font-bold mb-3">{activeDeposits.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</h3>
                <div className="flex items-center justify-between text-sm">
                  <span>Суточный доход</span>
                  <span className="font-semibold">{dailyIncome.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</span>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-4">Калькулятор доходности</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Сумма инвестиции</Label>
                    <Slider 
                      value={calcAmount}
                      onValueChange={setCalcAmount}
                      min={1000}
                      max={100000}
                      step={1000}
                      className="mb-2"
                    />
                    <p className="text-2xl font-bold text-center text-primary">{calcAmount[0].toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ежедневно ({dailyRate}%)</span>
                      <span className="font-semibold text-success">{calculatedDaily.toFixed(2)} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ежемесячно</span>
                      <span className="font-semibold text-success">{calculatedMonthly.toFixed(2)} ₽</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4">
              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground mb-1">Доступно для вывода</p>
                <h3 className="text-3xl font-bold mb-4">{balance.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</h3>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => setShowDepositDialog(true)}>
                    <Icon name="Plus" size={18} className="mr-2" />
                    Пополнить
                  </Button>
                  <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={() => setShowWithdrawDialog(true)}>
                    <Icon name="ArrowUpRight" size={18} className="mr-2" />
                    Вывести
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-4">Финансовая статистика</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Активные депозиты</span>
                    <span className="font-semibold text-success">{activeDeposits.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Всего заработано</span>
                    <span className="font-semibold text-success">{totalEarned.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Текущий баланс</span>
                    <span className="font-semibold">{balance.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="referral" className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary to-secondary text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90">Ваш доход</p>
                    <h3 className="text-2xl font-bold">{parseFloat(user.referral_earnings || '0').toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</h3>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Icon name="Users" size={24} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs opacity-80">Всего рефералов</p>
                    <p className="text-xl font-bold">{user.referral_count}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">Активных</p>
                    <p className="text-xl font-bold">{referrals.filter(r => parseFloat(r.total_deposits) > 0).length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3">Реферальная ссылка</h3>
                <div className="bg-muted p-3 rounded-lg mb-3">
                  <p className="text-xs text-muted-foreground break-all">t.me/your_bot?start=ref_{user.telegram_id}</p>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={copyReferralLink}>
                  <Icon name="Share2" size={18} className="mr-2" />
                  Пригласить друзей
                </Button>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3">Бонусы</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Вступить в чат</span>
                      <Badge className="bg-success">+100 ₽</Badge>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full bg-secondary hover:bg-secondary/90"
                      onClick={handleChatBonus}
                      disabled={user.chat_bonus_claimed}
                    >
                      {user.chat_bonus_claimed ? 'Получено' : 'Проверить'}
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Пригласить 25 друзей</span>
                      <Badge className="bg-success">+2000 ₽</Badge>
                    </div>
                    <Progress value={(user.referral_count / 25) * 100} className="h-2 mb-2" />
                    <p className="text-xs text-center text-muted-foreground">{user.referral_count}/25</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3">Ваши партнёры</h3>
                <div className="space-y-2">
                  {referrals.map(ref => (
                    <div key={ref.telegram_id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{ref.first_name || ref.username || `ID ${ref.telegram_id}`}</span>
                        <span className="text-sm text-success font-semibold">+{parseFloat(ref.bonus_earned).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Депозит: {parseFloat(ref.total_deposits).toLocaleString('ru-RU')} ₽</span>
                        <span>{new Date(ref.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  ))}
                  {referrals.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">Пока нет партнёров</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Пополнение баланса</DialogTitle>
            <DialogDescription>Минимальная сумма: 100 ₽</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Сумма пополнения</Label>
              <Input 
                type="number" 
                placeholder="1000" 
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RUB">RUB (Рубли)</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="TON">TON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="p-4 bg-muted border-border">
              <p className="text-sm text-muted-foreground mb-2">Номер карты для перевода:</p>
              <p className="font-mono font-semibold">2200 7007 1234 5678</p>
            </Card>
            <Button className="w-full bg-success hover:bg-success/90" onClick={handleDeposit}>
              <Icon name="Check" size={18} className="mr-2" />
              Проверить оплату
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Вывод средств</DialogTitle>
            <DialogDescription>Минимальная сумма: 100 ₽</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Доступно для вывода</Label>
              <p className="text-2xl font-bold text-success">{balance.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</p>
            </div>
            <div>
              <Label>Сумма вывода</Label>
              <Input 
                type="number" 
                placeholder="1000" 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Номер карты для получения</Label>
              <Input 
                type="text" 
                placeholder="2200 0000 0000 0000" 
                value={withdrawCard}
                onChange={(e) => setWithdrawCard(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            <Button className="w-full bg-secondary hover:bg-secondary/90" onClick={handleWithdraw}>
              <Icon name="ArrowUpRight" size={18} className="mr-2" />
              Подать заявку на вывод
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-card max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Админ-панель</DialogTitle>
            <DialogDescription>Управление заявками пользователей</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {adminPending.map(tx => (
              <Card key={tx.id} className="p-4 bg-muted">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{tx.type === 'deposit' ? 'Пополнение' : 'Вывод'}</p>
                    <p className="text-sm text-muted-foreground">ID транзакции: {tx.id}</p>
                  </div>
                  <Badge>{tx.status}</Badge>
                </div>
                <div className="space-y-1 text-sm mb-3">
                  <p>Сумма: <span className="font-semibold">{parseFloat(tx.amount).toLocaleString('ru-RU')} {tx.currency || 'RUB'}</span></p>
                  {tx.card_number && <p>Карта: {tx.card_number}</p>}
                  <p className="text-muted-foreground">{new Date(tx.created_at).toLocaleString('ru-RU')}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => handleApprove(tx.id)}>
                    <Icon name="Check" size={16} className="mr-1" />
                    Одобрить
                  </Button>
                  <Button className="flex-1 bg-destructive hover:bg-destructive/90" onClick={() => handleReject(tx.id)}>
                    <Icon name="X" size={16} className="mr-1" />
                    Отклонить
                  </Button>
                </div>
              </Card>
            ))}
            {adminPending.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Нет заявок на рассмотрении</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
