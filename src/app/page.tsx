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
  name: string; checks: number; penetration: number; sales: number; rto: number
}

interface Region02Store {
  name: string;
  checks_gribi: number; checks_zelen: number; checks_ovoshi: number; checks_frukty: number;
  pen_gribi: number; pen_zelen: number; pen_ovoshi: number; pen_frukty: number;
  sum_penetrations: number;
  sales_gribi: number; sales_zelen: number; sales_ovoshi: number; sales_frukty: number;
  rto_gribi: number; rto_zelen: number; rto_ovoshi: number; rto_frukty: number;
  total_sales: number; total_rto: number;
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
  return fmtNum(n)
}

function PenetrationBar({ value, maxVal = 0.5 }: { value: number; maxVal?: number }) {
  const pct = Math.min((value / maxVal) * 100, 100)
  const hue = value >= 0.45 ? 142 : value >= 0.39 ? 45 : 0
  const sat = value >= 0.45 ? '70%' : value >= 0.39 ? '85%' : '75%'
  const light = value >= 0.45 ? '38%' : value >= 0.39 ? '50%' : '45%'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: `hsl(${hue}, ${sat}, ${light})`
          }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums">{fmtPct(value)}</span>
    </div>
  )
}

function SumPenBar({ value, maxVal = 0.55 }: { value: number; maxVal?: number }) {
  const pct = Math.min((value / maxVal) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 bg-amber-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-amber-700 dark:text-amber-400">{fmtPct(value)}</span>
    </div>
  )
}

function DiffBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0
  return (
    <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs px-1.5 py-0">
      {label}: {isPositive ? '+' : ''}{(value * 100).toFixed(2)} п.п.
    </Badge>
  )
}

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Анализ пенетрации ФРОВ
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
            <h2 className="text-lg font-semibold">Верхнеуровневый анализ (Уровень 1)</h2>
          </div>

          {/* Main comparison table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Сравнительная таблица пенетрации ФРОВ</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Показатель</TableHead>
                    <TableHead className="text-right">Регион 02</TableHead>
                    <TableHead className="text-right">Регион 16</TableHead>
                    <TableHead className="text-right">Сеть</TableHead>
                    <TableHead className="text-right">НБЧ (лок. округ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-semibold bg-muted/30">
                    <TableCell>Пенетрация, %</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPct(r02pen)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPct(r16pen)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPct(netpen)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPct(nbchpen)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Количество чеков, шт</TableCell>
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Delta cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Регион 16 vs Регион 02</p>
                <DiffBadge value={r16pen - r02pen} label="Δ" />
                <p className="text-xs text-muted-foreground mt-2">
                  Регион 16 опережает Регион 02 на {((r16pen - r02pen) * 100).toFixed(2)} п.п.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Регион 02 vs Сеть</p>
                <DiffBadge value={r02pen - netpen} label="Δ" />
                <p className="text-xs text-muted-foreground mt-2">
                  Регион 02 {r02pen >= netpen ? 'выше' : 'ниже'} сети на {Math.abs((r02pen - netpen) * 100).toFixed(2)} п.п.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Регион 16 vs Сеть</p>
                <DiffBadge value={r16pen - netpen} label="Δ" />
                <p className="text-xs text-muted-foreground mt-2">
                  Регион 16 {r16pen >= netpen ? 'выше' : 'ниже'} сети на {Math.abs((r16pen - netpen) * 100).toFixed(2)} п.п.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Level 3 subcategory breakdown */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Детализация по подкатегориям (Уровень 3)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Подкатегория</TableHead>
                    <TableHead className="text-right">Рег.02 Пен.,%</TableHead>
                    <TableHead className="text-right">Рег.16 Пен.,%</TableHead>
                    <TableHead className="text-right">Сеть Пен.,%</TableHead>
                    <TableHead className="text-right">НБЧ Пен.,%</TableHead>
                    <TableHead className="text-right">Δ Рег.16-02</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {step1.subcategories.map((sub, i) => {
                    const netSub = step1.net_subcategories?.find(ns => ns.name === sub.name)
                    const nbchSub = step1.nbch_subcategories?.find(ns => ns.name === sub.name)
                    const delta = (sub.r16_penetration || 0) - (sub.r02_penetration || 0)
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(sub.r02_penetration)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(sub.r16_penetration)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(netSub?.penetration)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(nbchSub?.penetration)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className={delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : ''}>
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
        </section>

        <Separator />

        {/* ====== ШАГ 2: Помагазинный анализ ====== */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
            <h2 className="text-lg font-semibold">Помагазинный анализ (Уровень 2)</h2>
          </div>

          <Tabs defaultValue="region16" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="region16">Регион 16 (Татарстан) — {r16Sorted.length} маг.</TabsTrigger>
              <TabsTrigger value="region02">Регион 02 (Башкортостан) — {r02Sorted.length} маг.</TabsTrigger>
            </TabsList>

            {/* ===== Region 16 ===== */}
            <TabsContent value="region16" className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Структура данных Региона 16</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>В файле присутствует <strong>прямое значение пенетрации ФРОВ</strong> на уровне каждого магазина (Уровень 2). Рейтинг строится по этому показателю.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top 10 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                    Топ-10 магазинов Региона 16 — наивысшая пенетрация ФРОВ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Пенетрация ФРОВ</TableHead>
                          <TableHead className="text-right">Чеки ФРОВ</TableHead>
                          <TableHead className="text-right">Продажи, шт</TableHead>
                          <TableHead className="text-right">РТО</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r16Top.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><PenetrationBar value={s.penetration} /></TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.checks)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.sales, 0)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.rto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom 10 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                    Топ-10 магазинов Региона 16 — наименьшая пенетрация ФРОВ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Пенетрация ФРОВ</TableHead>
                          <TableHead className="text-right">Чеки ФРОВ</TableHead>
                          <TableHead className="text-right">Продажи, шт</TableHead>
                          <TableHead className="text-right">РТО</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r16Bottom.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><PenetrationBar value={s.penetration} /></TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.checks)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.sales, 0)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtRub(s.rto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

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
                          <TableHead className="w-[40px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Пенетрация ФРОВ</TableHead>
                          <TableHead className="text-right">Чеки ФРОВ</TableHead>
                          <TableHead className="text-right">Продажи, шт</TableHead>
                          <TableHead className="text-right">РТО</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r16Sorted.map((s, i) => (
                          <TableRow key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                            <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><PenetrationBar value={s.penetration} /></TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{fmtNum(s.checks)}</TableCell>
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
              {/* Data limitation notice */}
              <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    ⚠ Ограничение данных Региона 02
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-900 dark:text-amber-200 space-y-2">
                  <p>
                    В исходном файле для Региона 02 <strong>отсутствует прямое значение пенетрации ФРОВ</strong> на уровне магазина.
                    Данные представлены только в разрезе подкатегорий Уровня 3: <strong>ГРИБЫ, ЗЕЛЕНЬ, ОВОЩИ, ФРУКТЫ</strong>.
                  </p>
                  <p>
                    Рейтинг магазинов построен по показателю <strong>Σ Пен. подкатегорий</strong> — сумме пенетраций четырёх подкатегорий.
                    Это <strong>верхняя оценка</strong> пенетрации ФРОВ, так как один чек может содержать товары из нескольких подкатегорий.
                  </p>
                  <p className="text-xs opacity-80">
                    Для справки: на региональном уровне Σ Пен. подкатегорий = {fmtPct(0.012379706071899456 + 0.033051637455828994 + 0.2565110967022268 + 0.21215779173556326)},
                    а фактическая пенетрация ФРОВ = {fmtPct(r02pen)}.
                    Коэффициент пересечения: {dedupFactor.toFixed(4)} (факт / Σ).
                  </p>
                </CardContent>
              </Card>

              {/* Top stores */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                    Топ магазинов Региона 02 — наивысшая Σ пенетрации подкатегорий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Σ Пен. подкатегорий</TableHead>
                          <TableHead className="text-right">Пен. ГРИБЫ</TableHead>
                          <TableHead className="text-right">Пен. ЗЕЛЕНЬ</TableHead>
                          <TableHead className="text-right">Пен. ОВОЩИ</TableHead>
                          <TableHead className="text-right">Пен. ФРУКТЫ</TableHead>
                          <TableHead className="text-right">РТО ФРОВ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r02Top.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><SumPenBar value={s.sum_penetrations} /></TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_gribi)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_zelen)}</TableCell>
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

              {/* Bottom stores */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                    Топ магазинов Региона 02 — наименьшая Σ пенетрации подкатегорий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Σ Пен. подкатегорий</TableHead>
                          <TableHead className="text-right">Пен. ГРИБЫ</TableHead>
                          <TableHead className="text-right">Пен. ЗЕЛЕНЬ</TableHead>
                          <TableHead className="text-right">Пен. ОВОЩИ</TableHead>
                          <TableHead className="text-right">Пен. ФРУКТЫ</TableHead>
                          <TableHead className="text-right">РТО ФРОВ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r02Bottom.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><SumPenBar value={s.sum_penetrations} /></TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_gribi)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_zelen)}</TableCell>
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

              {/* Full list with all subcategory detail */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Полный рейтинг магазинов Региона 02 — данные из файла (Уровень 3)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">#</TableHead>
                          <TableHead>Магазин</TableHead>
                          <TableHead>Σ Пен.</TableHead>
                          <TableHead className="text-right">Пен. ГРИБЫ</TableHead>
                          <TableHead className="text-right">Пен. ЗЕЛЕНЬ</TableHead>
                          <TableHead className="text-right">Пен. ОВОЩИ</TableHead>
                          <TableHead className="text-right">Пен. ФРУКТЫ</TableHead>
                          <TableHead className="text-right">Чеки ОВОЩИ</TableHead>
                          <TableHead className="text-right">Прод., шт</TableHead>
                          <TableHead className="text-right">РТО ФРОВ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r02Sorted.map((s, i) => (
                          <TableRow key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                            <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell><SumPenBar value={s.sum_penetrations} /></TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_gribi)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_zelen)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_ovoshi)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtPct(s.pen_frukty)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtNum(s.checks_ovoshi)}</TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{fmtNum(s.total_sales, 0)}</TableCell>
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
            <h2 className="text-lg font-semibold">Дополнительные метрики (Уровень 3)</h2>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Взаимосвязь пенетрации и объёмов продаж (РТО)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                В файле присутствуют сопутствующие метрики: РТО (руб с НДС), Продажи (шт), Количество чеков.
                Ниже — сводная таблица с этими метриками в разрезе регионов и подкатегорий.
              </p>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Подкатегория</TableHead>
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
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.region02.rto / step1.region02.checks, 2)} руб.
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.region16.rto / step1.region16.checks, 2)} руб.
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.network.rto / step1.network.checks, 2)} руб.
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.nbch.rto / step1.nbch.checks, 2)} руб.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Средние продажи на чек (шт)</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.region02.sales / step1.region02.checks, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.region16.sales / step1.region16.checks, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.network.sales / step1.network.checks, 2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(step1.nbch.sales / step1.nbch.checks, 2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Доля ФРОВ в РТО (от сети)</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(step1.region02.rto / step1.network.rto * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(step1.region16.rto / step1.network.rto * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">100%</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(step1.nbch.rto / step1.network.rto * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 text-center text-xs text-muted-foreground">
          Анализ пенетрации ФРОВ · Данные: 02-16.xlsx · Все расчёты строго по исходной выгрузке, без оценочных значений
        </div>
      </footer>
    </div>
  )
}
