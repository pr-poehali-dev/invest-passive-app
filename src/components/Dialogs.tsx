import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import * as api from '@/lib/api';

interface DialogsProps {
  showDepositDialog: boolean;
  showWithdrawDialog: boolean;
  showAdminDialog: boolean;
  depositAmount: string;
  withdrawAmount: string;
  withdrawCard: string;
  currency: string;
  balance: number;
  adminPending: api.Transaction[];
  onDepositDialogChange: (open: boolean) => void;
  onWithdrawDialogChange: (open: boolean) => void;
  onAdminDialogChange: (open: boolean) => void;
  onDepositAmountChange: (value: string) => void;
  onWithdrawAmountChange: (value: string) => void;
  onWithdrawCardChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onApprove: (txId: number) => void;
  onReject: (txId: number) => void;
}

export default function Dialogs({
  showDepositDialog,
  showWithdrawDialog,
  showAdminDialog,
  depositAmount,
  withdrawAmount,
  withdrawCard,
  currency,
  balance,
  adminPending,
  onDepositDialogChange,
  onWithdrawDialogChange,
  onAdminDialogChange,
  onDepositAmountChange,
  onWithdrawAmountChange,
  onWithdrawCardChange,
  onCurrencyChange,
  onDeposit,
  onWithdraw,
  onApprove,
  onReject
}: DialogsProps) {
  return (
    <>
      <Dialog open={showDepositDialog} onOpenChange={onDepositDialogChange}>
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
                onChange={(e) => onDepositAmountChange(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Валюта</Label>
              <Select value={currency} onValueChange={onCurrencyChange}>
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
            <Button className="w-full bg-success hover:bg-success/90" onClick={onDeposit}>
              <Icon name="Check" size={18} className="mr-2" />
              Проверить оплату
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawDialog} onOpenChange={onWithdrawDialogChange}>
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
                onChange={(e) => onWithdrawAmountChange(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label>Номер карты для получения</Label>
              <Input 
                type="text" 
                placeholder="2200 0000 0000 0000" 
                value={withdrawCard}
                onChange={(e) => onWithdrawCardChange(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
            <Button className="w-full bg-secondary hover:bg-secondary/90" onClick={onWithdraw}>
              <Icon name="ArrowUpRight" size={18} className="mr-2" />
              Подать заявку на вывод
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminDialog} onOpenChange={onAdminDialogChange}>
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
                  <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => onApprove(tx.id)}>
                    <Icon name="Check" size={16} className="mr-1" />
                    Одобрить
                  </Button>
                  <Button className="flex-1 bg-destructive hover:bg-destructive/90" onClick={() => onReject(tx.id)}>
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
    </>
  );
}
