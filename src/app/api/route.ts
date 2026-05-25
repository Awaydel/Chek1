import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { execSync } = await import("child_process");
    const result = execSync(
      `python3 -c "
import json
import openpyxl

wb = openpyxl.load_workbook('/home/z/my-project/upload/02-16.xlsx', data_only=True)

# === Sheet: 16_02_3ур ===
ws1 = wb['16_02_3ур']
r02_checks = ws1.cell(row=19, column=4).value or 0
r02_penetration = ws1.cell(row=19, column=6).value or 0
r02_sales = ws1.cell(row=19, column=8).value or 0
r02_rto = ws1.cell(row=19, column=10).value or 0

r16_checks = ws1.cell(row=19, column=5).value or 0
r16_penetration = ws1.cell(row=19, column=7).value or 0
r16_sales = ws1.cell(row=19, column=9).value or 0
r16_rto = ws1.cell(row=19, column=11).value or 0

subcategories = []
for row_num in range(14, 19):
    name = ws1.cell(row=row_num, column=3).value
    r02_c = ws1.cell(row=row_num, column=4).value
    r16_c = ws1.cell(row=row_num, column=5).value
    r02_p = ws1.cell(row=row_num, column=6).value or 0
    r16_p = ws1.cell(row=row_num, column=7).value or 0
    r02_s = ws1.cell(row=row_num, column=8).value or 0
    r16_s = ws1.cell(row=row_num, column=9).value or 0
    r02_r = ws1.cell(row=row_num, column=10).value or 0
    r16_r = ws1.cell(row=row_num, column=11).value or 0
    subcategories.append({
        'name': name,
        'r02_checks': r02_c,
        'r16_checks': r16_c,
        'r02_penetration': r02_p,
        'r16_penetration': r16_p,
        'r02_sales': r02_s,
        'r16_sales': r16_s,
        'r02_rto': r02_r,
        'r16_rto': r16_r,
    })

# === Sheet: общий_3ур ===
ws2 = wb['общий_3ур']
net_checks = ws2.cell(row=18, column=4).value or 0
net_penetration = ws2.cell(row=18, column=5).value or 0
net_sales = ws2.cell(row=18, column=6).value or 0
net_rto = ws2.cell(row=18, column=7).value or 0

net_subcategories = []
for row_num in range(13, 18):
    name = ws2.cell(row=row_num, column=3).value
    c = ws2.cell(row=row_num, column=4).value or 0
    p = ws2.cell(row=row_num, column=5).value or 0
    s = ws2.cell(row=row_num, column=6).value or 0
    r = ws2.cell(row=row_num, column=7).value or 0
    net_subcategories.append({'name': name, 'checks': c, 'penetration': p, 'sales': s, 'rto': r})

# === Sheet: Нбч_3ур ===
ws3 = wb['Нбч_3ур']
nbch_checks = ws3.cell(row=19, column=4).value or 0
nbch_penetration = ws3.cell(row=19, column=5).value or 0
nbch_sales = ws3.cell(row=19, column=6).value or 0
nbch_rto = ws3.cell(row=19, column=7).value or 0

nbch_subcategories = []
for row_num in range(14, 19):
    name = ws3.cell(row=row_num, column=3).value
    c = ws3.cell(row=row_num, column=4).value or 0
    p = ws3.cell(row=row_num, column=5).value or 0
    s = ws3.cell(row=row_num, column=6).value or 0
    r = ws3.cell(row=row_num, column=7).value or 0
    nbch_subcategories.append({'name': name, 'checks': c, 'penetration': p, 'sales': s, 'rto': r})

# === Sheet: 16_магазины ===
ws5 = wb['16_магазины']
region16_stores = []
for row_num in range(14, ws5.max_row):
    name = ws5.cell(row=row_num, column=1).value
    if name is None or 'Общий' in str(name):
        break
    checks = ws5.cell(row=row_num, column=2).value or 0
    pen = ws5.cell(row=row_num, column=3).value or 0
    sales = ws5.cell(row=row_num, column=4).value or 0
    rto = ws5.cell(row=row_num, column=5).value or 0
    region16_stores.append({'name': name, 'checks': checks, 'penetration': pen, 'sales': sales, 'rto': rto})

# === Sheet: 02_магазины ===
# IMPORTANT: This sheet has ONLY Level 3 (subcategory) breakdown.
# NO direct ФРОВ overall penetration is available per store.
# We store raw subcategory data and compute sum_of_penetrations for ranking.
# sum_of_penetrations is an UPPER BOUND (overestimates due to check overlap).
ws4 = wb['02_магазины']
region02_stores = []

for row_num in range(14, ws4.max_row):
    name = ws4.cell(row=row_num, column=1).value
    if name is None or 'Общий' in str(name):
        break
    cg = ws4.cell(row=row_num, column=2).value or 0
    cz = ws4.cell(row=row_num, column=3).value or 0
    co = ws4.cell(row=row_num, column=4).value or 0
    cf = ws4.cell(row=row_num, column=5).value or 0
    pg = ws4.cell(row=row_num, column=6).value or 0
    pz = ws4.cell(row=row_num, column=7).value or 0
    po = ws4.cell(row=row_num, column=8).value or 0
    pf = ws4.cell(row=row_num, column=9).value or 0
    sg = ws4.cell(row=row_num, column=10).value or 0
    sz = ws4.cell(row=row_num, column=11).value or 0
    so = ws4.cell(row=row_num, column=12).value or 0
    sf = ws4.cell(row=row_num, column=13).value or 0
    rg = ws4.cell(row=row_num, column=14).value or 0
    rz = ws4.cell(row=row_num, column=15).value or 0
    ro = ws4.cell(row=row_num, column=16).value or 0
    rf = ws4.cell(row=row_num, column=17).value or 0

    total_sales = sg + sz + so + sf
    total_rto = rg + rz + ro + rf
    sum_penetrations = pg + pz + po + pf

    region02_stores.append({
        'name': name,
        'checks_gribi': cg, 'checks_zelen': cz, 'checks_ovoshi': co, 'checks_frukty': cf,
        'pen_gribi': pg, 'pen_zelen': pz, 'pen_ovoshi': po, 'pen_frukty': pf,
        'sum_penetrations': sum_penetrations,
        'sales_gribi': sg, 'sales_zelen': sz, 'sales_ovoshi': so, 'sales_frukty': sf,
        'rto_gribi': rg, 'rto_zelen': rz, 'rto_ovoshi': ro, 'rto_frukty': rf,
        'total_sales': total_sales,
        'total_rto': total_rto,
    })

# Regional-level dedup info for reference only
r02_sum_subcategory_checks = sum(s['checks_gribi'] + s['checks_zelen'] + s['checks_ovoshi'] + s['checks_frukty'] for s in region02_stores)
dedup_factor = r02_checks / r02_sum_subcategory_checks if r02_sum_subcategory_checks > 0 else 1

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
        'region16': sorted(region16_stores, key=lambda x: x['penetration'], reverse=True),
        'region02': sorted(region02_stores, key=lambda x: x['sum_penetrations'], reverse=True),
        'r02_dedup_factor': dedup_factor,
        'r02_regional_penetration': r02_penetration,
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
