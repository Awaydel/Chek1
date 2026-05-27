'use client'

import { useEffect, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Info, TrendingUp, TrendingDown, Store, BarChart3, ChevronDown, ChevronUp, Medal } from 'lucide-react'

/* ============ Types ============ */

interface RegionData {
  name: string; checks: number; penetration: number; sales: number; rto: number
}

interface Subcategory {
  name: string; r02_checks: number; r16_checks: number;
  r02_penetration: number; r16_penetration: number;
  r02_sales: number; r16_sales: number; r02_rto: number; r16_rto: number;
}

interface NetSubcategory { name: string; checks: number; penetration: number; sales: number; rto: number }

interface Store {
  name: string
  subcat_names: string[]
  subcat_checks: number[]
  subcat_penetrations: number[]
  subcat_sales: number[]
  subcat_rto: number[]
  frov_checks: number
  frov_penetration: number
  frov_sales: number
  frov_rto: number
  total_receipts: number
}

interface AnalysisData {
  step1: {
    region02: RegionData; region16: RegionData; network: RegionData; nbch: RegionData
    subcategories: Subcategory[]
    net_subcategories: NetSubcategory[]
    nbch_subcategories: NetSubcategory[]
  }
  step2: {
    region16: Store[]; region02: Store[]
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

/* ============ Components ============ */

function PenetrationBar({ value, maxVal = 0.55 }: { value: number; maxVal?: number }) {
  const pct = Math.min((value / maxVal) * 100, 100)
  let color: string
  if (value >= 0.45) color = 'bg-emerald-500'
  else if (value >= 0.40) color = 'bg-green-500'
  else if (value >= 0.35) color = 'bg-yellow-500'
  else color = 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums min-w-[52px]">{fmtPct(value)}</span>
    </div>
  )
}

function KPICard({ title, value, subtitle, trend }: {
  title: string; value: string; subtitle: string; trend?: 'up' | 'down' | 'neutral'
}) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
        <p className={`text-xs mt-1 flex items-center gap-1 ${trendColor}`}>
          {TrendIcon && <TrendIcon className="w-3 h-3" />}
          {subtitle}
        </p>
      </CardContent>
    </Card>
  )
}

function StoreDetailCard({ store, regionPen, subcatColors }: {
  store: Store; regionPen: number; subcatColors: Record<string, string>
}) {
  const [open, setOpen] = useState(false)
  const delta = store.frov_penetration - regionPen
  const deltaPct = (delta * 100).toFixed(2)

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{store.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <PenetrationBar value={store.frov_penetration} />
              <Badge variant={delta >= 0 ? 'default' : 'destructive'} className="text-xs shrink-0">
                {delta >= 0 ? '+' : ''}{deltaPct} п.п.
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4 shrink-0">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">РТО ФРОВ</p>
              <p className="text-sm font-semibold tabular-nums">{fmtRub(store.frov_rto)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Чеков</p>
              <p className="text-sm font-semibold tabular-nums">{fmtNum(store.frov_checks)}</p>
            </div>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/20">
          {/* Уровень 1 summary */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Уровень 1 — ФРЕШ (итого ФРОВ)</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-background rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Пенетрация</p>
                <p className="text-sm font-bold">{fmtPct(store.frov_penetration)}</p>
              </div>
              <div className="bg-background rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Чеков ФРОВ</p>
                <p className="text-sm font-bold tabular-nums">{fmtNum(store.frov_checks)}</p>
              </div>
              <div className="bg-background rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">Продажи, шт</p>
                <p className="text-sm font-bold tabular-nums">{fmtNum(store.frov_sales, 0)}</p>
              </div>
              <div className="bg-background rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">РТО</p>
                <p className="text-sm font-bold tabular-nums">{fmtRub(store.frov_rto)}</p>
              </div>
            </div>
          </div>

          {/* Уровень 3 detail */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Уровень 3 — подкатегории</p>
            <div className="space-y-1.5">
              {store.subcat_names.map((subName, i) => (
                <div key={i} className="bg-background rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${subcatColors[subName] || 'bg-gray-400'}`} />
                      <span className="text-xs font-medium">{subName}</span>
                    </div>
                    <span className="text-xs font-bold">{fmtPct(store.subcat_penetrations[i])}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                    <span>Чеки: {fmtNum(store.subcat_checks[i])}</span>
                    <span>Прод: {fmtNum(store.subcat_sales[i], 0)}</span>
                    <span>РТО: {fmtRub(store.subcat_rto[i])}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional metrics */}
          <div className="bg-background rounded-lg p-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Всего чеков магазина:</span>
              <span className="font-medium tabular-nums">{fmtNum(store.total_receipts)}</span>
              <span className="text-muted-foreground">Средний чек ФРОВ:</span>
              <span className="font-medium tabular-nums">{fmtNum(store.frov_rto / store.frov_checks, 2)} руб.</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

const SUBCAT_COLORS: Record<string, string> = {
  'БАХЧЕВЫЕ КУЛЬТУРЫ': 'bg-amber-500',
  'ГРИБЫ': 'bg-orange-500',
  'ЗЕЛЕНЬ': 'bg-green-500',
  'ОВОЩИ': 'bg-emerald-500',
  'ФРУКТЫ': 'bg-rose-500',
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

  if (!data || !data.step1) {
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

  const r16Sorted = step2.region16
  const r02Sorted = step2.region02

  // Chart data for subcategories
  const subcatChartData = step1.subcategories
    .filter(s => s.name !== 'БАХЧЕВЫЕ КУЛЬТУРЫ')
    .map(s => ({
      name: s.name,
      'Регион 02': +(s.r02_penetration * 100).toFixed(2),
      'Регион 16': +(s.r16_penetration * 100).toFixed(2),
    }))

  // Top 5 / Bottom 5 by subcategory penetration
  const getTopBySubcat = (stores: Store[], subcatIdx: number, count: number) => {
    return [...stores]
      .filter(s => s.subcat_penetrations[subcatIdx] > 0)
      .sort((a, b) => b.subcat_penetrations[subcatIdx] - a.subcat_penetrations[subcatIdx])
      .slice(0, count)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Анализ пенетрации ФРОВ НБЧ</h1>
          <p className="text-sm text-muted-foreground">Регионы 02 (Башкортостан) и 16 (Татарстан) · Данные из выгрузки</p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">

        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="tab1" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">1. Обзор</span>
              <span className="sm:hidden">1</span>
            </TabsTrigger>
            <TabsTrigger value="tab2" className="gap-1.5">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">2. Помагазинный анализ</span>
              <span className="sm:hidden">2</span>
            </TabsTrigger>
            <TabsTrigger value="tab3" className="gap-1.5">
              <Medal className="w-4 h-4" />
              <span className="hidden sm:inline">3. Доп. метрики</span>
              <span className="sm:hidden">3</span>
            </TabsTrigger>
          </TabsList>

          {/* ====== TAB 1: Обзор ====== */}
          <TabsContent value="tab1" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
              <h2 className="text-lg font-semibold">Верхнеуровневый анализ пенетрации ФРОВ</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard title="Регион 02" value={fmtPct(r02pen)}
                subtitle={`${r02pen < netpen ? 'ниже' : 'выше'} сети на ${Math.abs((r02pen - netpen) * 100).toFixed(2)} п.п.`}
                trend={r02pen >= netpen ? 'up' : 'down'} />
              <KPICard title="Регион 16" value={fmtPct(r16pen)}
                subtitle={`${r16pen < netpen ? 'ниже' : 'выше'} сети на ${Math.abs((r16pen - netpen) * 100).toFixed(2)} п.п.`}
                trend={r16pen >= netpen ? 'up' : 'down'} />
              <KPICard title="Сеть" value={fmtPct(netpen)} subtitle="Общий показатель" trend="neutral" />
              <KPICard title="НБЧ (лок. округ)" value={fmtPct(nbchpen)}
                subtitle={`${nbchpen < netpen ? 'ниже' : 'выше'} сети на ${Math.abs((nbchpen - netpen) * 100).toFixed(2)} п.п.`}
                trend={nbchpen >= netpen ? 'up' : 'down'} />
            </div>

            {/* Comparison table */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Сравнительная таблица</CardTitle></CardHeader>
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
                    <TableRow className="font-semibold bg-muted/30">
                      <TableCell>Пенетрация ФРОВ, %</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(r02pen)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(r16pen)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(netpen)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(nbchpen)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Чеков ФРОВ, шт</TableCell>
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
                      <TableCell>Средний чек ФРОВ</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region02.rto / step1.region02.checks, 2)} руб.</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.region16.rto / step1.region16.checks, 2)} руб.</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.network.rto / step1.network.checks, 2)} руб.</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(step1.nbch.rto / step1.nbch.checks, 2)} руб.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Delta cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><CardContent className="pt-4">
                <p className="text-sm font-medium">Регион 16 vs Регион 02</p>
                <Badge variant={r16pen > r02pen ? 'default' : 'destructive'} className="mt-1">
                  Δ = {r16pen > r02pen ? '+' : ''}{((r16pen - r02pen) * 100).toFixed(2)} п.п.
                </Badge>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-sm font-medium">Регион 02 vs Сеть</p>
                <Badge variant={r02pen >= netpen ? 'default' : 'destructive'} className="mt-1">
                  Δ = {r02pen >= netpen ? '+' : ''}{((r02pen - netpen) * 100).toFixed(2)} п.п.
                </Badge>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-sm font-medium">Регион 16 vs Сеть</p>
                <Badge variant={r16pen >= netpen ? 'default' : 'destructive'} className="mt-1">
                  Δ = {r16pen >= netpen ? '+' : ''}{((r16pen - netpen) * 100).toFixed(2)} п.п.
                </Badge>
              </CardContent></Card>
            </div>

            {/* Subcategory chart + table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Пенетрация по подкатегориям (Ур.3)</CardTitle></CardHeader>
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
                <CardHeader className="pb-3"><CardTitle className="text-base">Детализация по подкатегориям</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Подкатегория</TableHead>
                        <TableHead className="text-right">02 Пен.</TableHead>
                        <TableHead className="text-right">16 Пен.</TableHead>
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====== TAB 2: Помагазинный анализ ====== */}
          <TabsContent value="tab2" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
              <h2 className="text-lg font-semibold">Помагазинный анализ</h2>
            </div>

            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Источник данных
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1.5">
                <p>
                  Пенетрация ФРОВ (<strong>Уровень 1</strong>) берётся <strong>напрямую из выгрузки</strong> — листы «_верх».
                  Это точные значения, не оценка. Пенетрации подкатегорий <strong>не складываются</strong> (один чек → несколько подкатегорий).
                </p>
                <p className="text-xs text-muted-foreground">
                  Нажмите на магазин, чтобы увидеть подробную характеристику по Уровню 1 и Уровню 3.
                </p>
              </CardContent>
            </Card>

            <Tabs defaultValue="region16" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="region16">Регион 16 (Татарстан) — {r16Sorted.length} маг.</TabsTrigger>
                <TabsTrigger value="region02">Регион 02 (Башкортостан) — {r02Sorted.length} маг.</TabsTrigger>
              </TabsList>

              {['region16', 'region02'].map(regionKey => {
                const stores = regionKey === 'region16' ? r16Sorted : r02Sorted
                const regionPen = regionKey === 'region16' ? r16pen : r02pen
                const regionName = regionKey === 'region16' ? 'Регион 16' : 'Регион 02'
                const top5 = stores.slice(0, 5)
                const bottom5 = [...stores].reverse().slice(0, 5)

                return (
                  <TabsContent key={regionKey} value={regionKey} className="space-y-6">
                    {/* Top 5 */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                        <h3 className="font-semibold text-sm">Топ-5 — наивысшая пенетрация ФРОВ</h3>
                      </div>
                      <div className="space-y-2">
                        {top5.map((s, i) => (
                          <StoreDetailCard key={s.name} store={s} regionPen={regionPen} subcatColors={SUBCAT_COLORS} />
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Bottom 5 */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                        <h3 className="font-semibold text-sm">Топ-5 — наименьшая пенетрация ФРОВ</h3>
                      </div>
                      <div className="space-y-2">
                        {bottom5.map((s, i) => (
                          <StoreDetailCard key={s.name} store={s} regionPen={regionPen} subcatColors={SUBCAT_COLORS} />
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Top by subcategory */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Топ-5 по подкатегориям (Уровень 3)</h3>
                      </div>
                      <Tabs defaultValue={stores[0]?.subcat_names.find(n => n !== 'БАХЧЕВЫЕ КУЛЬТУРЫ') || stores[0]?.subcat_names[0]} className="w-full">
                        <TabsList className="mb-3 flex-wrap h-auto gap-1">
                          {stores[0]?.subcat_names.filter(n => n !== 'БАХЧЕВЫЕ КУЛЬТУРЫ').map(subName => {
                            const idx = stores[0].subcat_names.indexOf(subName)
                            return (
                              <TabsTrigger key={subName} value={subName} className="text-xs">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${SUBCAT_COLORS[subName] || 'bg-gray-400'}`} />
                                {subName}
                              </TabsTrigger>
                            )
                          })}
                        </TabsList>
                        {stores[0]?.subcat_names.filter(n => n !== 'БАХЧЕВЫЕ КУЛЬТУРЫ').map(subName => {
                          const idx = stores[0].subcat_names.indexOf(subName)
                          const topSub = getTopBySubcat(stores, idx, 5)
                          return (
                            <TabsContent key={subName} value={subName}>
                              <Card>
                                <CardContent className="pt-4">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[36px]">#</TableHead>
                                        <TableHead>Магазин</TableHead>
                                        <TableHead>Пен. {subName}</TableHead>
                                        <TableHead className="text-right">Чеков {subName}</TableHead>
                                        <TableHead className="text-right">Пен. ФРОВ</TableHead>
                                        <TableHead className="text-right">РТО ФРОВ</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {topSub.map((s, i) => (
                                        <TableRow key={s.name} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                                          <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                                          <TableCell className="font-medium text-sm">{s.name}</TableCell>
                                          <TableCell><PenetrationBar value={s.subcat_penetrations[idx]} maxVal={0.45} /></TableCell>
                                          <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.subcat_checks[idx])}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm">{fmtPct(s.frov_penetration)}</TableCell>
                                          <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.frov_rto)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          )
                        })}
                      </Tabs>
                    </div>

                    <Separator />

                    {/* Full ranking */}
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Полный рейтинг — {regionName}</h3>
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[36px]">#</TableHead>
                              <TableHead>Магазин</TableHead>
                              <TableHead>Пен. ФРОВ</TableHead>
                              {stores[0]?.subcat_names.filter(n => n !== 'БАХЧЕВЫЕ КУЛЬТУРЫ').map(n => (
                                <TableHead key={n} className="text-right text-xs">{n}</TableHead>
                              ))}
                              <TableHead className="text-right">РТО ФРОВ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stores.map((s, i) => (
                              <TableRow key={s.name} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                                <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                                <TableCell className="font-medium text-sm">{s.name}</TableCell>
                                <TableCell><PenetrationBar value={s.frov_penetration} /></TableCell>
                                {s.subcat_names.map((subName, j) => {
                                  if (subName === 'БАХЧЕВЫЕ КУЛЬТУРЫ') return null
                                  return (
                                    <TableCell key={j} className="text-right tabular-nums text-xs">
                                      {fmtPct(s.subcat_penetrations[j])}
                                    </TableCell>
                                  )
                                })}
                                <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.frov_rto)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </TabsContent>

          {/* ====== TAB 3: Дополнительные метрики ====== */}
          <TabsContent value="tab3" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
              <h2 className="text-lg font-semibold">Дополнительные метрики</h2>
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Метрики по подкатегориям и регионам</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Подкатегория</TableHead>
                        <TableHead className="text-center" colSpan={4}>Регион 02</TableHead>
                        <TableHead className="text-center" colSpan={4}>Регион 16</TableHead>
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

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Средний чек и сопоставление</CardTitle></CardHeader>
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
                      <TableCell className="font-medium">РТО на магазин (среднее)</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtRub(step1.region02.rto / r02Sorted.length)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtRub(step1.region16.rto / r16Sorted.length)}</TableCell>
                      <TableCell className="text-right tabular-nums">—</TableCell>
                      <TableCell className="text-right tabular-nums">—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Чеков ФРОВ на магазин</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(Math.round(step1.region02.checks / r02Sorted.length))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(Math.round(step1.region16.checks / r16Sorted.length))}</TableCell>
                      <TableCell className="text-right tabular-nums">—</TableCell>
                      <TableCell className="text-right tabular-nums">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 text-center text-xs text-muted-foreground">
          Анализ пенетрации ФРОВ НБЧ · Пенетрация Ур.1 — из выгрузки (точные значения) · Пенетрации подкатегорий не складываются
        </div>
      </footer>
    </div>
  )
}
