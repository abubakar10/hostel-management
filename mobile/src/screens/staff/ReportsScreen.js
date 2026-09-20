import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import api from '../../config/api';
import { useHostel } from '../../context/HostelContext';
import { Card, ChipTabs, Loading, Screen, Subtitle, Title } from '../../components/ui';
import { colors } from '../../theme';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const money = (n) => `RS ${Number(n || 0).toLocaleString()}`;

export default function ReportsScreen() {
  const { isSuperAdmin, selectedHostelId } = useHostel();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [incomeExpenses, setIncomeExpenses] = useState(null);
  const [profitLoss, setProfitLoss] = useState([]);
  const [category, setCategory] = useState({ income: [], expenses: [] });
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  const load = useCallback(async () => {
    if (isSuperAdmin && !selectedHostelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [incomeExp, profit, cats, months] = await Promise.all([
        api.get(`/api/reports/income-expenses/${year}/${month}`),
        api.get(`/api/reports/profit-loss/${year}`),
        api.get(`/api/reports/category-breakdown/${year}/${month}`),
        api.get(`/api/reports/monthly-comparison/${year}`),
      ]);
      setIncomeExpenses(incomeExp.data);
      setProfitLoss(profit.data || []);
      setCategory(cats.data || { income: [], expenses: [] });
      setComparison(months.data || []);
    } catch (_) {
      setIncomeExpenses(null);
    } finally {
      setLoading(false);
    }
  }, [year, month, isSuperAdmin, selectedHostelId]);

  useEffect(() => {
    load();
  }, [load]);

  if (isSuperAdmin && !selectedHostelId) {
    return (
      <Screen>
        <Title>Choose a hostel first</Title>
        <Subtitle>Pick a hostel from the menu to see money in and out.</Subtitle>
      </Screen>
    );
  }

  if (loading && !incomeExpenses) return <Loading />;

  const income = Number(incomeExpenses?.net?.total_income ?? incomeExpenses?.income?.total_income ?? 0);
  const expenses = Number(incomeExpenses?.net?.total_expenses ?? 0);
  const profit = income - expenses;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Title>Money report</Title>
        <Subtitle>See money in, money out, and profit for this hostel.</Subtitle>
        <ChipTabs value={year} onChange={setYear} options={years} />
        <ChipTabs
          value={month}
          onChange={setMonth}
          options={monthNames.map((label, i) => ({ value: String(i + 1), label }))}
        />

        <Card>
          <Text style={{ color: colors.muted }}>Hostel fees</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.success }}>
            {money(incomeExpenses?.income?.hostel_income)}
          </Text>
        </Card>
        <Card>
          <Text style={{ color: colors.muted }}>Meal fees</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>
            {money(incomeExpenses?.income?.mess_income)}
          </Text>
        </Card>
        <Card>
          <Text style={{ color: colors.muted }}>Money in</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.success }}>{money(income)}</Text>
        </Card>
        <Card>
          <Text style={{ color: colors.muted }}>Money out</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.danger }}>{money(expenses)}</Text>
        </Card>
        <Card>
          <Text style={{ color: colors.muted }}>Profit</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: profit >= 0 ? colors.success : colors.danger }}>{money(profit)}</Text>
        </Card>

        {(category.income || []).length ? (
          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.ink }}>Income by type</Text>
            {category.income.map((row) => (
              <View key={row.category || row.fee_type} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: colors.muted }}>{row.category || row.fee_type}</Text>
                <Text style={{ fontWeight: '700' }}>{money(row.amount || row.total)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {(category.expenses || []).length ? (
          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.ink }}>Spending by type</Text>
            {category.expenses.map((row) => (
              <View key={row.category} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: colors.muted }}>{row.category}</Text>
                <Text style={{ fontWeight: '700' }}>{money(row.amount || row.total)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {comparison.length ? (
          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.ink }}>Months in {year}</Text>
            {comparison.map((row, i) => (
              <View key={row.month || i} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>{monthNames[(row.month || i + 1) - 1] || `Month ${row.month}`}</Text>
                <Text style={{ color: colors.muted }}>In {money(row.income)} · Out {money(row.expenses)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {profitLoss.length ? (
          <Card>
            <Text style={{ fontWeight: '700', marginBottom: 8, color: colors.ink }}>Profit by month</Text>
            {profitLoss.map((row, i) => (
              <View key={row.month || i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: colors.muted }}>{monthNames[(row.month || i + 1) - 1]}</Text>
                <Text style={{ fontWeight: '700' }}>{money(row.profit ?? row.net)}</Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
