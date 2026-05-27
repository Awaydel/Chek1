import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { execSync } = await import("child_process");
    const result = execSync(
      `python3 -c "
import json
import openpyxl

# === Main file: 02-16_правильный.xlsx (regional summaries) ===
wb1 = openpyxl.load_workbook('/home/z/my-project/upload/02-16_правильный.xlsx', data_only=True)

# Sheet: 16_02_3ур — regional comparison
ws = wb1['16_02_3ур']
r02_checks = ws.cell(row=19, column=4).value or 0
r02_penetration = ws.cell(row=19, column=6).value or 0
r02_sales = ws.cell(row=19, column=8).value or 0
r02_rto = ws.cell(row=19, column=10).value or 0

r16_checks = ws.cell(row=19, column=5).value or 0
r16_penetration = ws.cell(row=19, column=7).value or 0
r16_sales = ws.cell(row=19, column=9).value or 0
r16_rto = ws.cell(row=19, column=11).value or 0

subcategories = []
for row_num in range(14, 19):
    name = ws.cell(row=row_num, column=3).value
    r02_c = ws.cell(row=row_num, column=4).value or 0
    r16_c = ws.cell(row=row_num, column=5).value or 0
    r02_p = ws.cell(row=row_num, column=6).value or 0
    r16_p = ws.cell(row=row_num, column=7).value or 0
    r02_s = ws.cell(row=row_num, column=8).value or 0
    r16_s = ws.cell(row=row_num, column=9).value or 0
    r02_r = ws.cell(row=row_num, column=10).value or 0
    r16_r = ws.cell(row=row_num, column=11).value or 0
    subcategories.append({
        'name': name,
        'r02_checks': r02_c, 'r16_checks': r16_c,
        'r02_penetration': r02_p, 'r16_penetration': r16_p,
        'r02_sales': r02_s, 'r16_sales': r16_s,
        'r02_rto': r02_r, 'r16_rto': r16_r,
    })

# Sheet: общий_3ур — network
ws = wb1['общий_3ур']
net_checks = ws.cell(row=18, column=4).value or 0
net_penetration = ws.cell(row=18, column=5).value or 0
net_sales = ws.cell(row=18, column=6).value or 0
net_rto = ws.cell(row=18, column=7).value or 0

net_subcategories = []
for row_num in range(13, 18):
    name = ws.cell(row=row_num, column=3).value
    c = ws.cell(row=row_num, column=4).value or 0
    p = ws.cell(row=row_num, column=5).value or 0
    s = ws.cell(row=row_num, column=6).value or 0
    r = ws.cell(row=row_num, column=7).value or 0
    net_subcategories.append({'name': name, 'checks': c, 'penetration': p, 'sales': s, 'rto': r})

# Sheet: Нбч_3ур — NBCH
ws = wb1['Нбч_3ур']
nbch_checks = ws.cell(row=19, column=4).value or 0
nbch_penetration = ws.cell(row=19, column=5).value or 0
nbch_sales = ws.cell(row=19, column=6).value or 0
nbch_rto = ws.cell(row=19, column=7).value or 0

nbch_subcategories = []
for row_num in range(14, 19):
    name = ws.cell(row=row_num, column=3).value
    c = ws.cell(row=row_num, column=4).value or 0
    p = ws.cell(row=row_num, column=5).value or 0
    s = ws.cell(row=row_num, column=6).value or 0
    r = ws.cell(row=row_num, column=7).value or 0
    nbch_subcategories.append({'name': name, 'checks': c, 'penetration': p, 'sales': s, 'rto': r})

# === Additional file: дополнительно.xlsx (store-level Ур1 + Ур3) ===
wb2 = openpyxl.load_workbook('upload/дополнительно.xlsx', data_only=True)

# --- Region 02 stores ---
ws02_3 = wb2['02_магазины']       # Уровень 3 (subcategories)
ws02_1 = wb2['02_магазины_верх']  # Уровень 1 (ФРЕШ total)

r02_subcat_names = ['ГРИБЫ', 'ЗЕЛЕНЬ', 'ОВОЩИ', 'ФРУКТЫ']
region02_stores = []

for row_num in range(14, ws02_3.max_row + 1):
    name = ws02_3.cell(row=row_num, column=1).value
    if name is None or 'Общий' in str(name):
        break
    # Уровень 3 data (subcategories)
    sub_checks = [ws02_3.cell(row=row_num, column=c).value or 0 for c in range(2, 6)]
    sub_pens = [ws02_3.cell(row=row_num, column=c).value or 0 for c in range(6, 10)]
    sub_sales = [ws02_3.cell(row=row_num, column=c).value or 0 for c in range(10, 14)]
    sub_rto = [ws02_3.cell(row=row_num, column=c).value or 0 for c in range(14, 18)]

    # Уровень 1 data (ФРЕШ total)
    u1_checks = ws02_1.cell(row=row_num, column=2).value or 0
    u1_pen = ws02_1.cell(row=row_num, column=3).value or 0
    u1_sales = ws02_1.cell(row=row_num, column=4).value or 0
    u1_rto = ws02_1.cell(row=row_num, column=5).value or 0

    # Total receipts from ОВОЩИ subcat
    total_receipts = sub_checks[2] / sub_pens[2] if sub_pens[2] and sub_pens[2] > 0 else 0

    region02_stores.append({
        'name': name,
        'subcat_names': r02_subcat_names,
        'subcat_checks': sub_checks,
        'subcat_penetrations': sub_pens,
        'subcat_sales': sub_sales,
        'subcat_rto': sub_rto,
        'frov_checks': u1_checks,
        'frov_penetration': u1_pen,
        'frov_sales': u1_sales,
        'frov_rto': u1_rto,
        'total_receipts': round(total_receipts),
    })

# --- Region 16 stores ---
ws16_3 = wb2['16_магазины']       # Уровень 3 (subcategories)
ws16_1 = wb2['16_магазины_верх']  # Уровень 1 (ФРЕШ total)

r16_subcat_names = ['БАХЧЕВЫЕ КУЛЬТУРЫ', 'ГРИБЫ', 'ЗЕЛЕНЬ', 'ОВОЩИ', 'ФРУКТЫ']
region16_stores = []

for row_num in range(14, ws16_3.max_row + 1):
    name = ws16_3.cell(row=row_num, column=1).value
    if name is None or 'Общий' in str(name):
        break
    # Уровень 3 data (subcategories)
    sub_checks = [ws16_3.cell(row=row_num, column=c).value or 0 for c in range(2, 7)]
    sub_pens = [ws16_3.cell(row=row_num, column=c).value or 0 for c in range(7, 12)]
    sub_sales = [ws16_3.cell(row=row_num, column=c).value or 0 for c in range(12, 17)]
    sub_rto = [ws16_3.cell(row=row_num, column=c).value or 0 for c in range(17, 22)]

    # Уровень 1 data (ФРЕШ total)
    u1_checks = ws16_1.cell(row=row_num, column=2).value or 0
    u1_pen = ws16_1.cell(row=row_num, column=3).value or 0
    u1_sales = ws16_1.cell(row=row_num, column=4).value or 0
    u1_rto = ws16_1.cell(row=row_num, column=5).value or 0

    # Total receipts from ОВОЩИ subcat (index 3 in 5-subcat array)
    ovsoshi_idx = 3
    total_receipts = sub_checks[ovsoshi_idx] / sub_pens[ovsoshi_idx] if sub_pens[ovsoshi_idx] and sub_pens[ovsoshi_idx] > 0 else 0

    region16_stores.append({
        'name': name,
        'subcat_names': r16_subcat_names,
        'subcat_checks': sub_checks,
        'subcat_penetrations': sub_pens,
        'subcat_sales': sub_sales,
        'subcat_rto': sub_rto,
        'frov_checks': u1_checks,
        'frov_penetration': u1_pen,
        'frov_sales': u1_sales,
        'frov_rto': u1_rto,
        'total_receipts': round(total_receipts),
    })

data = {
    'step1': {
        'region02': {'name': 'Регион 02 (Респ. Башкортостан)', 'checks': r02_checks, 'penetration': r02_penetration, 'sales': r02_sales, 'rto': r02_rto},
        'region16': {'name': 'Регион 16 (Респ. Татарстан)', 'checks': r16_checks, 'penetration': r16_penetration, 'sales': r16_sales, 'rto': r16_rto},
        'network': {'name': 'Сеть в целом', 'checks': net_checks, 'penetration': net_penetration, 'sales': net_sales, 'rto': net_rto},
        'nbch': {'name': 'НБЧ (лок. округ)', 'checks': nbch_checks, 'penetration': nbch_penetration, 'sales': nbch_sales, 'rto': nbch_rto},
        'subcategories': subcategories,
        'net_subcategories': net_subcategories,
        'nbch_subcategories': nbch_subcategories,
    },
    'step2': {
        'region02': sorted(region02_stores, key=lambda x: x['frov_penetration'], reverse=True),
        'region16': sorted(region16_stores, key=lambda x: x['frov_penetration'], reverse=True),
    }
}

print(json.dumps(data, ensure_ascii=False))
"`
    );

    const data = JSON.parse(result.toString());
    return NextResponse.json(data);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze file" }, { status: 500 });
  }
}
