import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import * as api from '@/lib/api';

interface DashboardTabProps {
  user: api.User;
  totalEarned: number;
  transactions: api.Transaction[];
  onDepositClick: () => void;
  onForumClick: () => void;
  onRefresh: () => void;
}

export default function DashboardTab({ 
  user, 
  totalEarned, 
  transactions, 
  onDepositClick, 
  onForumClick,
  onRefresh 
}: DashboardTabProps) {
  return (
    <div className="space-y-4">
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
        <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onDepositClick}>
          <Icon name="Plus" size={18} className="mr-2" />
          Пополнить
        </Button>
        <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={onForumClick}>
          <Icon name="MessageCircle" size={18} className="mr-2" />
          Форум
        </Button>
      </div>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">История операций</h3>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
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
    </div>
  );
}
