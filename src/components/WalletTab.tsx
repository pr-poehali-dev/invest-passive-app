import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface WalletTabProps {
  balance: number;
  activeDeposits: number;
  totalEarned: number;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
}

export default function WalletTab({ 
  balance, 
  activeDeposits, 
  totalEarned,
  onDepositClick,
  onWithdrawClick
}: WalletTabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card border-border">
        <p className="text-sm text-muted-foreground mb-1">Доступно для вывода</p>
        <h3 className="text-3xl font-bold mb-4">{balance.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽</h3>
        <div className="flex gap-3">
          <Button className="flex-1 bg-success hover:bg-success/90" onClick={onDepositClick}>
            <Icon name="Plus" size={18} className="mr-2" />
            Пополнить
          </Button>
          <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={onWithdrawClick}>
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
    </div>
  );
}
