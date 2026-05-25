'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  BarChart3, Store, AlertTriangle, Info, CheckCircle2
} from 'lucide-react'

/* ============ Types ============ */

interface Step1Data {
  region02: { name: string; checks: number; penetration: number; sales: number; rto: number }
  region16: { name: string; checks: number; penetration: number; sales: number; rto: number }
  network: { name: string; checks: number; penetration: number; sales: number; rto: number }
  nbch: { name: string; checks: number; penetration: number; sales: number; rto: number }
  subcategories: {
    name: string; r02_checks: number; r16_checks: number;
    r02_penetration: number; r16_penetration: number;
    r02_sales: number; r16_sales: number; r02_rto: number; r16_rto: number;
  }[]
  net_subcategories: { name: string; checks: number; penetration: number; sales: number; rto: number }[]
  nbch_subcategories: { name: string; checks: number; penetration: number; sales: number; rto: number }[]
}

interface Region16Store {
  name: string; checks: number; penetration: number; sales: number; rto: number; total_receipts: number
}

interface Region02Store {
  name: string;
  checks_gribi: number; checks_zelen: number; checks_ovoshi: number; checks_frukty: number;
  pen_gribi: number; pen_zelen: number; pen_ovoshi: number; pen_frukty: number;
  sales_gribi: number; sales_zelen: number; sales_ovoshi: number; sales_frukty: number;
  rto_gribi: number; rto_zelen: number; rto_ovoshi: number; rto_frukty: number;
  subcat_checks_sum: number;
  total_receipts: number;
  total_sales: number; total_rto: number;
  estimated_frov_checks: number;
  estimated_frov_penetration: number;
}

interface AnalysisData {
  step1: Step1Data
  step2: {
    region16: Region16Store[]
    region02: Region02Store[]
    r02_dedup_factor: number
    r02_regional_penetration: number
  }
}

/* ============ Helpers ============ */

function fmtNum(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—'
  return n.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return (n * 100).toFixed(2) + '%'
}

function fmtRub(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' млрд'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' млн'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' тыс'
  return fmtNum(n)
}

/* ============ Penetration Bar Component ============ */

function PenetrationBar({ value, maxVal = 0.55 }: { value: number; maxVal?: number }) {
  const pct = Math.min((value / maxVal) * 100, 100)
  let color: string
  if (value >= 0.45) color = 'bg-emerald-500'
  else if (value >= 0.40) color = 'bg-green-500'
  else if (value >= 0.35) color = 'bg-yellow-500'
  else color = 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums min-w-[52px]">{fmtPct(value)}</span>
    </div>
  )
}

/* ============ KPI Card ============ */

function KPICard({
  title, value, subtitle, icon, trend
}: {
  title: string; value: string; subtitle: string;
  icon: React.ReactNode; trend?: 'up' | 'down' | 'neutral'
}) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <div className="flex items-center gap-1">
              {TrendIcon && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
              <p className={`text-xs ${trendColor}`}>{subtitle}</p>
            </div>
          </div>
          <div className="text-muted-foreground/50">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ============ Main Page ============ */

export default function Home() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Загрузка аналитики...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Ошибка загрузки данных</p>
      </div>
    )
  }

  const { step1, step2 } = data
  const r02pen = step1.region02.penetration
  const r16pen = step1.region16.penetration
  const netpen = step1.network.penetration
  const nbchpen = step1.nbch.penetration
  const dedupFactor = step2.r02_dedup_factor

  const r16Sorted = step2.region16
  const r02Sorted = step2.region02

  const r16Top = r16Sorted.slice(0, 10)
  const r16Bottom = r16Sorted.slice(-10).reverse()
  const r02Top = r02Sorted.slice(0, 10)
  const r02Bottom = r02Sorted.slice(-10).reverse()

  // Chart data for subcategory comparison
  const subcatChartData = step1.subcategories
    .filter(s => s.name !== 'БАХЧЕВЫЕ КУЛЬТУРЫ')
    .map(s => ({
      name: s.name,
      'Регион 02': +(s.r02_penetration * 100).toFixed(2),
      'Регион 16': +(s.r16_penetration * 100).toFixed(2),
    }))

  // Chart data for top stores comparison
  const topStoresChart = [
    ...r16Top.slice(0, 5).map(s => ({ name: s.name.replace('МП16 ', ''), penetration: +(s.penetration * 100).toFixed(2), region: '16' })),
    ...r02Top.slice(0, 5).map(s => ({ name: s.name.replace('МП02 ', ''), penetration: +(s.estimated_frov_penetration * 100).toFixed(2), region: '02' })),
  ].sort((a, b) => b.penetration - a.penetration)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Анализ пенетрации ФРОВ НБЧ
              </h1>
              <p className="text-sm text-muted-foreground">
                Регионы 02 (Башкортостан) и 16 (Татарстан) · Источник: 02-16.xlsx
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">Сопоставимость к 2025: Да</Badge>
              <Badge variant="outline" className="text-xs">Категория: ФРУКТЫ И ОВОЩИ</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-8">

        {/* ====== ШАГ 1: Верхнеуровневый анализ ====== */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
            <h2 className="text-lg font-semibold">Верхнеуровневый анализ</h2>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Регион 02"
              value={fmtPct(r02pen)}
              subtitle={`${r02pen < netpen ? 'ниже' : 'выше'} сети на ${Math.abs((r02pen - netpen) * 100).toFixed(2)} п.п.`}
              icon={<BarChart3 className="w-6 h-6" />}
              trend={r02pen >= netpen ? 'up' : 'down'}
            />
            <KPICard
              title="Регион 16"
              value={fmtPct(r16pen)}
              subtitle={`${r16pen < netpen ? 'ниже' : 'выше'} сети на ${Math.abs((r16pen - netpen) * 100).toFixed(2)} п.п.`}
              icon={<BarChart3 className="w-6 h-6" />}
              trend={r16pen >= netpen ? 'up' : 'down'}
            />
            <KPICard
              title="Сеть"
              value={fmtPct(netpen)}
              subtitle="Общий показатель по сети"
              icon={<BarChart3 className="w-6 h-6" />}
              trend="neutral"
            />
            <KPICard
              title="НБЧ (лок. округ)"
              value={fmtPct(nbchpen)}
              subtitle={`${nbchpen < netpen ? 'ниже' : 'выше'} сети на ${Math.abs((nbchpen - netpen) * 100).toFixed(2)} п.п.`}
              icon={<Store className="w-6 h-6" />}
              trend={nbchpen >= netpen ? 'up' : 'down'}
            />
          </div>

          {/* Main comparison table */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Сравнительная таблица пенетрации ФРОВ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Показатель</TableHead>
                      <TableHead className="text-right">Регион 02</TableHead>
                      <TableHead className="text-right">Регион 16</TableHead>
                      <TableHead className="text-right">Сеть</TableHead>
                      <TableHead className="text-right">НБЧ (лок. округ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="font-semibold bg-muted/30">
                      <TableCell>Пенетрация ФРОВ, %</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(r02pen)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(r16pen)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(netpen)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(nbchpen)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Количество чеков ФРОВ, шт</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region02.checks)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region16.checks)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.network.checks)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.nbch.checks)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Продажи, шт</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region02.sales, 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region16.sales, 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.network.sales, 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.nbch.sales, 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>РТО, руб с НДС</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtRub(step1.region02.rto)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtRub(step1.region16.rto)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtRub(step1.network.rto)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtRub(step1.nbch.rto)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Средний чек ФРОВ (РТО / чеки)</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region02.rto / step1.region02.checks, 2)} руб.</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region16.rto / step1.region16.checks, 2)} руб.</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.network.rto / step1.network.checks, 2)} руб.</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.nbch.rto / step1.nbch.checks, 2)} руб.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Delta cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {r16pen > r02pen ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  <p className="text-sm font-medium">Регион 16 vs Регион 02</p>
                </div>
                <Badge variant={r16pen > r02pen ? 'default' : 'destructive'} className="text-sm">
                  Δ = {r16pen > r02pen ? '+' : ''}{((r16pen - r02pen) * 100).toFixed(2)} п.п.
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Регион 16 опережает Регион 02 на {((r16pen - r02pen) * 100).toFixed(2)} п.п.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {r02pen >= netpen ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  <p className="text-sm font-medium">Регион 02 vs Сеть</p>
                </div>
                <Badge variant={r02pen >= netpen ? 'default' : 'destructive'} className="text-sm">
                  Δ = {r02pen >= netpen ? '+' : ''}{((r02pen - netpen) * 100).toFixed(2)} п.п.
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Регион 02 {r02pen >= netpen ? 'выше' : 'ниже'} сети
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {r16pen >= netpen ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  <p className="text-sm font-medium">Регион 16 vs Сеть</p>
                </div>
                <Badge variant={r16pen >= netpen ? 'default' : 'destructive'} className="text-sm">
                  Δ = {r16pen >= netpen ? '+' : ''}{((r16pen - netpen) * 100).toFixed(2)} п.п.
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Регион 16 {r16pen >= netpen ? 'выше' : 'ниже'} сети
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subcategory breakdown chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Пенетрация по подкатегориям (Ур.3)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={subcatChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v: number) => v.toFixed(2) + '%'} />
                    <Legend />
                    <Bar dataKey="Регион 02" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Регион 16" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Детализация по подкатегориям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Подкатегория</TableHead>
                        <TableHead className="text-right">Рег.02 Пен.</TableHead>
                        <TableHead className="text-right">Рег.16 Пен.</TableHead>
                        <TableHead className="text-right">Сеть Пен.</TableHead>
                        <TableHead className="text-right">НБЧ Пен.</TableHead>
                        <TableHead className="text-right">Δ 16-02</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {step1.subcategories.map((sub, i) => {
                        const netSub = step1.net_subcategories?.find(ns => ns.name === sub.name)
                        const nbchSub = step1.nbch_subcategories?.find(ns => ns.name === sub.name)
                        const delta = (sub.r16_penetration || 0) - (sub.r02_penetration || 0)
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">{sub.name}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtPct(sub.r02_penetration)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtPct(sub.r16_penetration)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtPct(netSub?.penetration)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtPct(nbchSub?.penetration)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              <span className={`font-medium ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : ''}`}>
                                {delta > 0 ? '+' : ''}{(delta * 100).toFixed(2)} п.п.
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ====== ШАГ 2: Помагазинный анализ ====== */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
            <h2 className="text-lg font-semibold">Помагазинный анализ</h2>
          </div>

          <Tabs defaultValue="region16" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="region16">Регион 16 (Татарстан) — {r16Sorted.length} маг.</TabsTrigger>
              <TabsTrigger value="region02">Регион 02 (Башкортостан) — {r02Sorted.length} маг.</TabsTrigger>
            </TabsList>

            {/* ===== Region 16 ===== */}
            <TabsContent value="region16" className="space-y-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>В файле присутствует <strong>прямое значение пенетрации ФРОВ</strong> на уровне каждого магазина (Уровень 2). Рейтинг строится по фактической пенетрации из выгрузки.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top 10 / Bottom 10 in one card */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                      Топ-10 — наивысшая пенетрация
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[36px]">#</TableHead>
                            <TableHead>Магазин</TableHead>
                            <TableHead>Пен. ФРОВ</TableHead>
                            <TableHead className="text-right">Чеки</TableHead>
                            <TableHead className="text-right">РТО</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {r16Top.map((s, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-muted-foreground text-sm">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">{s.name}</TableCell>
                              <TableCell><PenetrationBar value={s.penetration} /></TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.checks)}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.rto)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                      Топ-10 — наименьшая пенетрация
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[36px]">#</TableHead>
                            <TableHead>Магазин</TableHead>
                            <TableHead>Пен. ФРОВ</TableHead>
                            <TableHead className="text-right">Чеки</TableHead>
                            <TableHead className="text-right">РТО</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {r16Bottom.map((s, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-muted-foreground text-sm">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">{s.name}</TableCell>
                              <TableCell><PenetrationBar value={s.penetration} /></TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.checks)}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.rto)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full list */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Полный рейтинг магазинов Региона 16</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[36px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Пен. ФРОВ</TableHead>
                          <TableHead className="text-right">Чеки ФРОВ</TableHead>
                          <TableHead className="text-right">Всего чеков</TableHead>
                          <TableHead className="text-right">Продажи, шт</TableHead>
                          <TableHead className="text-right">РТО</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r16Sorted.map((s, i) => (
                          <TableRow key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                            <TableCell className="font-medium text-muted-foreground text-sm">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><PenetrationBar value={s.penetration} /></TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.checks)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(Math.round(s.total_receipts))}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.sales, 0)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.rto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== Region 02 ===== */}
            <TabsContent value="region02" className="space-y-6">
              {/* Methodology note */}
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    Методология расчёта пенетрации ФРОВ
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <p>
                    Лист «02_магазины» содержит данные <strong>Уровня 3</strong> — пенетрация по каждой подкатегории:
                    ГРИБЫ, ЗЕЛЕНЬ, ОВОЩИ, ФРУКТЫ. Прямого значения пенетрации ФРОВ (Ур.2) на уровне магазина в этом листе нет.
                  </p>
                  <p>
                    <strong>Пенетрации подкатегорий НЕ складываются</strong> — один чек может содержать товары из нескольких
                    подкатегорий, поэтому Σ Пен. &ne; Пен. ФРОВ.
                  </p>
                  <div className="bg-background/60 rounded-md p-3 space-y-1.5 text-xs font-mono">
                    <p><strong>Алгоритм расчёта:</strong></p>
                    <p>1. Всего чеков магазина = Чеки(ОВОЩИ) / Пен.(ОВОЩИ)</p>
                    <p>2. Σ чеков подкатегорий = Чеки(ГРИБЫ) + Чеки(ЗЕЛЕНЬ) + Чеки(ОВОЩИ) + Чеки(ФРУКТЫ)</p>
                    <p>3. Коэфф. дедупликации = ФРОВ_чеки(регион) / Σ_чеков_подкатегорий(регион) = <strong>{dedupFactor.toFixed(4)}</strong></p>
                    <p>4. ФРОВ чеки (оценка) = Σ чеков подкатегорий × коэфф. дедупликации</p>
                    <p>5. Пен. ФРОВ (оценка) = ФРОВ чеки (оценка) / Всего чеков магазина</p>
                  </div>
                  <p className="text-muted-foreground">
                    <strong>Проверка:</strong> Σ оценённых ФРОВ чеков по магазинам = Σ фактических ФРОВ чеков региона ({fmtNum(step1.region02.checks)}).
                    Пенетрация ФРОВ по региону = <strong>{fmtPct(step1.region02.penetration)}</strong> (из листа «16_02_3ур», Общий итог).
                  </p>
                </CardContent>
              </Card>

              {/* Top / Bottom stores */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                      Топ магазинов — наивысшая оценённая пенетрация ФРОВ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[36px]">#</TableHead>
                            <TableHead>Магазин</TableHead>
                            <TableHead>Пен. ФРОВ (оценка)</TableHead>
                            <TableHead className="text-right">Пен. ОВОЩИ</TableHead>
                            <TableHead className="text-right">Пен. ФРУКТЫ</TableHead>
                            <TableHead className="text-right">РТО ФРОВ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {r02Top.map((s, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-muted-foreground text-sm">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">{s.name}</TableCell>
                              <TableCell><PenetrationBar value={s.estimated_frov_penetration} /></TableCell>
                              <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_ovoshi)}</TableCell>
                              <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_frukty)}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.total_rto)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                      Топ магазинов — наименьшая оценённая пенетрация ФРОВ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[36px]">#</TableHead>
                            <TableHead>Магазин</TableHead>
                            <TableHead>Пен. ФРОВ (оценка)</TableHead>
                            <TableHead className="text-right">Пен. ОВОЩИ</TableHead>
                            <TableHead className="text-right">Пен. ФРУКТЫ</TableHead>
                            <TableHead className="text-right">РТО ФРОВ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {r02Bottom.map((s, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-muted-foreground text-sm">{i + 1}</TableCell>
                              <TableCell className="font-medium text-sm">{s.name}</TableCell>
                              <TableCell><PenetrationBar value={s.estimated_frov_penetration} /></TableCell>
                              <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_ovoshi)}</TableCell>
                              <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_frukty)}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.total_rto)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full list with subcategory detail */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Полный рейтинг магазинов Региона 02</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[36px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Пен. ФРОВ (оценка)</TableHead>
                          <TableHead className="text-right">Пен. ГРИБЫ</TableHead>
                          <TableHead className="text-right">Пен. ЗЕЛЕНЬ</TableHead>
                          <TableHead className="text-right">Пен. ОВОЩИ</TableHead>
                          <TableHead className="text-right">Пен. ФРУКТЫ</TableHead>
                          <TableHead className="text-right">Всего чеков</TableHead>
                          <TableHead className="text-right">РТО ФРОВ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r02Sorted.map((s, i) => (
                          <TableRow key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                            <TableCell className="font-medium text-muted-foreground text-sm">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><PenetrationBar value={s.estimated_frov_penetration} /></TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_gribi)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_zelen)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_ovoshi)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_frukty)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtNum(Math.round(s.total_receipts))}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.total_rto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* ====== ШАГ 3: Дополнительные метрики ====== */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
            <h2 className="text-lg font-semibold">Дополнительные метрики</h2>
          </div>

          {/* Detailed subcategory metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Метрики по подкатегориям и регионам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Подкатегория</TableHead>
                      <TableHead className="text-center" colSpan={4}>Регион 02 (Башкортостан)</TableHead>
                      <TableHead className="text-center" colSpan={4}>Регион 16 (Татарстан)</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead />
                      <TableHead className="text-right text-xs">Пен.,%</TableHead>
                      <TableHead className="text-right text-xs">Чеки</TableHead>
                      <TableHead className="text-right text-xs">Прод., шт</TableHead>
                      <TableHead className="text-right text-xs">РТО</TableHead>
                      <TableHead className="text-right text-xs">Пен.,%</TableHead>
                      <TableHead className="text-right text-xs">Чеки</TableHead>
                      <TableHead className="text-right text-xs">Прод., шт</TableHead>
                      <TableHead className="text-right text-xs">РТО</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {step1.subcategories.map((sub, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{sub.name}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtPct(sub.r02_penetration)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtNum(sub.r02_checks)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtNum(sub.r02_sales, 0)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtRub(sub.r02_rto)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtPct(sub.r16_penetration)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtNum(sub.r16_checks)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtNum(sub.r16_sales, 0)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtRub(sub.r16_rto)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/30">
                      <TableCell>ИТОГО ФРОВ</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtPct(step1.region02.penetration)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtNum(step1.region02.checks)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtNum(step1.region02.sales, 0)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtRub(step1.region02.rto)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtPct(step1.region16.penetration)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtNum(step1.region16.checks)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtNum(step1.region16.sales, 0)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{fmtRub(step1.region16.rto)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Average check analytics */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Средний чек ФРОВ и сопоставление пенетрации с РТО</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Показатель</TableHead>
                    <TableHead className="text-right">Регион 02</TableHead>
                    <TableHead className="text-right">Регион 16</TableHead>
                    <TableHead className="text-right">Сеть</TableHead>
                    <TableHead className="text-right">НБЧ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Средний чек ФРОВ (РТО / чеки)</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.region02.rto / step1.region02.checks, 2)} руб.</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.region16.rto / step1.region16.checks, 2)} руб.</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.network.rto / step1.network.checks, 2)} руб.</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.nbch.rto / step1.nbch.checks, 2)} руб.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Средние продажи на чек (шт)</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.region02.sales / step1.region02.checks, 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.region16.sales / step1.region16.checks, 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.network.sales / step1.network.checks, 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(step1.nbch.sales / step1.nbch.checks, 2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Доля ФРОВ в РТО (от сети)</TableCell>
                    <TableCell className="text-right tabular-nums">{(step1.region02.rto / step1.network.rto * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{(step1.region16.rto / step1.network.rto * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right tabular-nums">100%</TableCell>
                    <TableCell className="text-right tabular-nums">{(step1.nbch.rto / step1.network.rto * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">РТО на магазин (среднее)</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtRub(step1.region02.rto / r02Sorted.length)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtRub(step1.region16.rto / r16Sorted.length)}</TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Чеков ФРОВ на магазин (среднее)</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(Math.round(step1.region02.checks / r02Sorted.length))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtNum(Math.round(step1.region16.checks / r16Sorted.length))}</TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                    <TableCell className="text-right tabular-nums">—</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Dedup explanation card */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Почему пенетрации нельзя складывать
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                Пенетрация = Чеки с категорией / Общие чеки магазина. Если чек содержит товары из нескольких
                подкатегорий ФРОВ (например, ОВОЩИ и ФРУКТЫ), он учитывается в пенетрации <strong>каждой</strong> подкатегории отдельно.
              </p>
              <p>
                Поэтому Σ Пен.(подкатегорий) всегда &ge; Пен.(ФРОВ). Разница зависит от доли «пересекающихся» чеков.
              </p>
              <div className="bg-muted/50 rounded-md p-3 text-xs font-mono space-y-1">
                <p><strong>Пример (Регион 02, Общий итог):</strong></p>
                <p>Σ чеков подкатегорий = {fmtNum(12563 + 33541 + 260309 + 215299)} (с учётом пересечений)</p>
                <p>ФРОВ чеков (факт) = {fmtNum(step1.region02.checks)} (уникальных чеков с ФРОВ)</p>
                <p>Пересечения = {fmtNum(12563 + 33541 + 260309 + 215299 - step1.region02.checks)} чеков ({((1 - dedupFactor) * 100).toFixed(1)}% от Σ подкатегорий)</p>
                <p>Коэфф. дедупликации = {dedupFactor.toFixed(4)}</p>
              </div>
              <p>
                Для Региона 16 прямая пенетрация ФРОВ есть в выгрузке (Ур.2), поэтому дедупликация не требуется.
                Для Региона 02 применяется региональный коэффициент дедупликации к <strong>количеству чеков</strong> (не к пенетрациям!),
                после чего пенетрация рассчитывается как ФРОВ_чеки / Всего_чеков.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 text-center text-xs text-muted-foreground">
          Анализ пенетрации ФРОВ НБЧ · Данные: 02-16.xlsx · Пенетрации не складываются · Коэфф. дедупликации применяется к количеству чеков
        </div>
      </footer>
    </div>
  )
}
