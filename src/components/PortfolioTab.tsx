import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface PortfolioTabProps {
  activeDeposits: number;
  dailyIncome: number;
  dailyRate: number;
  calcAmount: number[];
  onCalcAmountChange: (value: number[]) => void;
}

export default function PortfolioTab({ 
  activeDeposits, 
  dailyIncome, 
  dailyRate,
  calcAmount,
  onCalcAmountChange
}: PortfolioTabProps) {
  const calculatedDaily = (calcAmount[0] * dailyRate) / 100;
  const calculatedMonthly = calculatedDaily * 30;

  return (
    <div className="space-y-4">
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
              onValueChange={onCalcAmountChange}
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
    </div>
  );
}
