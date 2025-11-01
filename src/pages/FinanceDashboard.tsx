import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart2, ArrowDownCircle, ArrowUpCircle, Plus } from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
};

const initialTransactions: Transaction[] = [
  { id: 1, date: "2024-07-01", description: "Salary", amount: 3000, type: "income", category: "Job" },
  { id: 2, date: "2024-07-02", description: "Groceries", amount: -120, type: "expense", category: "Food" },
  { id: 3, date: "2024-07-03", description: "Coffee", amount: -5, type: "expense", category: "Food" },
  { id: 4, date: "2024-07-04", description: "Freelance", amount: 800, type: "income", category: "Side Hustle" },
  { id: 5, date: "2024-07-05", description: "Rent", amount: -1000, type: "expense", category: "Housing" },
  { id: 6, date: "2024-07-06", description: "Gym", amount: -50, type: "expense", category: "Health" },
];

const getSummary = (transactions: Transaction[]) => {
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = income - expenses;
  return { income, expenses, balance };
};

const getChartData = (transactions: Transaction[]) => {
  // Group by date, sum income and expenses
  const map: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    if (!map[t.date]) map[t.date] = { income: 0, expense: 0 };
    if (t.type === "income") map[t.date].income += t.amount;
    else map[t.date].expense += Math.abs(t.amount);
  });
  return Object.entries(map).map(([date, { income, expense }]) => ({
    date: date.slice(5), // MM-DD
    Income: income,
    Expense: expense,
  }));
};

const FinanceDashboard = () => {
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const summary = getSummary(transactions);
  const chartData = getChartData(transactions);

  return (
    <div className="max-w-4xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <BarChart2 className="w-7 h-7 text-primary" /> Personal Finance Dashboard
      </h1>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="text-green-600" /> Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-700">${summary.income.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="text-red-600" /> Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-700">${summary.expenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${summary.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
              ${summary.balance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Income vs Expenses (by Date)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 6).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.date}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={t.type === "income" ? "text-green-600" : "text-red-600"}>
                        {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={t.type === "income" ? "text-green-700" : "text-red-700"}>
                        {t.type === "income" ? "+" : "-"}${Math.abs(t.amount).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;