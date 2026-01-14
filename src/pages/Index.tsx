import { useState } from 'react';
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

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [balance] = useState(15000);
  const [profit24h] = useState(1590);
  const [totalEarned] = useState(8450);
  const [partners] = useState(12);
  const [activeDeposits] = useState(15000);
  const [dailyIncome] = useState(1590);
  const [calcAmount, setCalcAmount] = useState([5000]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCard, setWithdrawCard] = useState('');

  const dailyRate = 10.6;
  const calculatedDaily = (calcAmount[0] * dailyRate) / 100;
  const calculatedMonthly = calculatedDaily * 30;

  const referralLink = `t.me/PassiveCapitalBot/play?startapp=ref_${Math.random().toString(36).substr(2, 9)}`;

  const transactions = [
    { id: 1, type: 'deposit', amount: 5000, status: 'completed', date: '14.01.2026 15:30' },
    { id: 2, type: 'profit', amount: 530, status: 'completed', date: '14.01.2026 12:00' },
    { id: 3, type: 'withdraw', amount: 2000, status: 'pending', date: '13.01.2026 18:45' },
    { id: 4, type: 'referral', amount: 1250, status: 'completed', date: '13.01.2026 10:20' },
  ];

  const referrals = [
    { id: 1, name: 'Пользователь #7834', deposits: 5000, earned: 1250, date: '12.01.2026' },
    { id: 2, name: 'Пользователь #5621', deposits: 3000, earned: 750, date: '11.01.2026' },
    { id: 3, name: 'Пользователь #9012', deposits: 8000, earned: 2000, date: '10.01.2026' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Invest Passive</h1>
            <Button variant="ghost" size="icon" className="text-white">
              <Icon name="Bell" size={24} />
            </Button>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/80 text-sm mb-1">Общий баланс</p>
            <h2 className="text-3xl font-bold text-white">{balance.toLocaleString('ru-RU')} ₽</h2>
            <div className="flex items-center gap-2 mt-2">
              <Icon name="TrendingUp" size={16} className="text-success" />
              <span className="text-success text-sm font-semibold">+{profit24h.toLocaleString('ru-RU')} ₽ за 24ч</span>
            </div>
          </div>
        </div>

        {/* Content */}
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

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="TrendingUp" size={18} className="text-success" />
                    <p className="text-xs text-muted-foreground">Заработано</p>
                  </div>
                  <p className="text-xl font-bold">{totalEarned.toLocaleString('ru-RU')} ₽</p>
                </Card>
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Users" size={18} className="text-primary" />
                    <p className="text-xs text-muted-foreground">Партнёров</p>
                  </div>
                  <p className="text-xl font-bold">{partners}</p>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => setShowDepositDialog(true)}>
                  <Icon name="Plus" size={18} className="mr-2" />
                  Пополнить
                </Button>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90">
                  <Icon name="MessageCircle" size={18} className="mr-2" />
                  Форум
                </Button>
              </div>

              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">История операций</h3>
                  <Button variant="ghost" size="sm">
                    <Icon name="SlidersHorizontal" size={16} />
                  </Button>
                </div>
                <div className="space-y-3">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          tx.type === 'deposit' ? 'bg-primary/20' :
                          tx.type === 'profit' ? 'bg-success/20' :
                          tx.type === 'withdraw' ? 'bg-secondary/20' :
                          'bg-primary/20'
                        }`}>
                          <Icon 
                            name={
                              tx.type === 'deposit' ? 'ArrowDown' :
                              tx.type === 'profit' ? 'TrendingUp' :
                              tx.type === 'withdraw' ? 'ArrowUp' :
                              'Users'
                            } 
                            size={16} 
                            className={
                              tx.type === 'deposit' ? 'text-primary' :
                              tx.type === 'profit' ? 'text-success' :
                              tx.type === 'withdraw' ? 'text-secondary' :
                              'text-primary'
                            }
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {tx.type === 'deposit' ? 'Пополнение' :
                             tx.type === 'profit' ? 'Начисление' :
                             tx.type === 'withdraw' ? 'Вывод' :
                             'Реферал'}
                          </p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          tx.type === 'withdraw' ? 'text-secondary' : 'text-success'
                        }`}>
                          {tx.type === 'withdraw' ? '-' : '+'}{tx.amount.toLocaleString('ru-RU')} ₽
                        </p>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {tx.status === 'completed' ? 'Выполнено' : 'Ожидание'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary to-secondary text-white">
                <p className="text-sm opacity-90 mb-1">Активные вклады</p>
                <h3 className="text-3xl font-bold mb-3">{activeDeposits.toLocaleString('ru-RU')} ₽</h3>
                <div className="flex items-center justify-between text-sm">
                  <span>Суточный доход</span>
                  <span className="font-semibold">{dailyIncome.toLocaleString('ru-RU')} ₽</span>
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

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3">Активный депозит</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Сумма</span>
                    <span className="font-semibold">15,000 ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Начислено</span>
                    <span className="font-semibold text-success">8,450 ₽</span>
                  </div>
                  <Progress value={56} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">До следующего начисления: 5ч 32м</p>
                </div>
              </Card>
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet" className="space-y-4">
              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground mb-1">Доступно для вывода</p>
                <h3 className="text-3xl font-bold mb-4">{totalEarned.toLocaleString('ru-RU')} ₽</h3>
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
                    <span className="text-sm text-muted-foreground">Пополнено всего</span>
                    <span className="font-semibold text-success">15,000 ₽</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Выведено</span>
                    <span className="font-semibold">2,000 ₽</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">В ожидании</span>
                    <span className="font-semibold text-secondary">0 ₽</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Referral Tab */}
            <TabsContent value="referral" className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary to-secondary text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90">Ваш доход</p>
                    <h3 className="text-2xl font-bold">4,000 ₽</h3>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <Icon name="Users" size={24} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs opacity-80">Всего рефералов</p>
                    <p className="text-xl font-bold">{partners}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80">Активных</p>
                    <p className="text-xl font-bold">8</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3">Реферальная ссылка</h3>
                <div className="bg-muted p-3 rounded-lg mb-3">
                  <p className="text-xs text-muted-foreground break-all">{referralLink}</p>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90">
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
                    <Button size="sm" className="w-full bg-secondary hover:bg-secondary/90">
                      Проверить
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Пригласить 25 друзей</span>
                      <Badge className="bg-success">+2000 ₽</Badge>
                    </div>
                    <Progress value={(partners / 25) * 100} className="h-2 mb-2" />
                    <p className="text-xs text-center text-muted-foreground">{partners}/25</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3">Ваши партнёры</h3>
                <div className="space-y-2">
                  {referrals.map(ref => (
                    <div key={ref.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{ref.name}</span>
                        <span className="text-sm text-success font-semibold">+{ref.earned} ₽</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Депозит: {ref.deposits} ₽</span>
                        <span>{ref.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Deposit Dialog */}
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
              <Select defaultValue="rub">
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rub">RUB (Рубли)</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="ton">TON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="p-4 bg-muted border-border">
              <p className="text-sm text-muted-foreground mb-2">Номер карты для перевода:</p>
              <p className="font-mono font-semibold">2200 7007 1234 5678</p>
            </Card>
            <Button className="w-full bg-success hover:bg-success/90">
              <Icon name="Check" size={18} className="mr-2" />
              Проверить оплату
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Вывод средств</DialogTitle>
            <DialogDescription>Минимальная сумма: 100 ₽</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Доступно для вывода</Label>
              <p className="text-2xl font-bold text-success">{totalEarned.toLocaleString('ru-RU')} ₽</p>
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
            <Button className="w-full bg-secondary hover:bg-secondary/90">
              <Icon name="ArrowUpRight" size={18} className="mr-2" />
              Подать заявку на вывод
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
