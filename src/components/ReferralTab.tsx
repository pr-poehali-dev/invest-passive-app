import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import * as api from '@/lib/api';

interface ReferralTabProps {
  user: api.User;
  referrals: api.Referral[];
  onCopyLink: () => void;
  onChatBonus: () => void;
}

export default function ReferralTab({ 
  user, 
  referrals, 
  onCopyLink,
  onChatBonus
}: ReferralTabProps) {
  return (
    <div className="space-y-4">
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
        <Button className="w-full bg-primary hover:bg-primary/90" onClick={onCopyLink}>
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
              onClick={onChatBonus}
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
    </div>
  );
}
