import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { execSync } = await import("child_process");
    const result = execSync(
      `/home/z/.venv/bin/python3 -c "
import json
import openpyxl

wb = openpyxl.load_workbook('/home/z/my-project/upload/02-16_правильный.xlsx', data_only=True)

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
    r02_c = ws1.cell(row=row_num, column=4).value or 0
    r16_c = ws1.cell(row=row_num, column=5).value or 0
    r02_p = ws1.cell(row=row_num, column=6).value or 0
    r16_p = ws1.cell(row=row_num, column=7).value or 0
    r02_s = ws1.cell(row=row_num, column=8).value or 0
    r16_s = ws1.cell(row=row_num, column=9).value or 0
    r02_r = ws1.cell(row=row_num, column=10).value or 0
    r16_r = ws1.cell(row=row_num, column=11).value or 0
    subcategories.append({
        'name': name,
        'r02_checks': r02_c, 'r16_checks': r16_c,
        'r02_penetration': r02_p, 'r16_penetration': r16_p,
        'r02_sales': r02_s, 'r16_sales': r16_s,
        'r02_rto': r02_r, 'r16_rto': r16_r,
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

# ======================================================
# BOTH store sheets now have Уровень 3 (subcategories)
# Both use SAME methodology: dedup on CHECK COUNTS
# ======================================================

# --- Region 02: 4 subcats (col 2-5=checks, 6-9=pen, 10-13=sales, 14-17=rto) ---
ws02 = wb['02_магазины']
region02_stores = []
r02_subcat_checks_sum = 0

for row_num in range(14, ws02.max_row + 1):
    name = ws02.cell(row=row_num, column=1).value
    if name is None or 'Общий' in str(name):
        break
    cg = ws02.cell(row=row_num, column=2).value or 0
    cz = ws02.cell(row=row_num, column=3).value or 0
    co = ws02.cell(row=row_num, column=4).value or 0
    cf = ws02.cell(row=row_num, column=5).value or 0
    pg = ws02.cell(row=row_num, column=6).value or 0
    pz = ws02.cell(row=row_num, column=7).value or 0
    po = ws02.cell(row=row_num, column=8).value or 0
    pf = ws02.cell(row=row_num, column=9).value or 0
    sg = ws02.cell(row=row_num, column=10).value or 0
    sz = ws02.cell(row=row_num, column=11).value or 0
    so = ws02.cell(row=row_num, column=12).value or 0
    sf = ws02.cell(row=row_num, column=13).value or 0
    rg = ws02.cell(row=row_num, column=14).value or 0
    rz = ws02.cell(row=row_num, column=15).value or 0
    ro = ws02.cell(row=row_num, column=16).value or 0
    rf = ws02.cell(row=row_num, column=17).value or 0

    checks = [cg, cz, co, cf]
    pens = [pg, pz, po, pf]
    sales = [sg, sz, so, sf]
    rtos = [rg, rz, ro, rf]

    subcat_sum = sum(checks)
    r02_subcat_checks_sum += subcat_sum
    total_receipts = co / po if po and po > 0 else 0

    region02_stores.append({
        'name': name,
        'subcat_names': ['ГРИБЫ', 'ЗЕЛЕНЬ', 'ОВОЩИ', 'ФРУКТЫ'],
        'subcat_checks': checks,
        'subcat_penetrations': pens,
        'subcat_sales': sales,
        'subcat_rto': rtos,
        'subcat_checks_sum': subcat_sum,
        'total_receipts': total_receipts,
        'total_sales': sum(sales),
        'total_rto': sum(rtos),
    })

r02_dedup = r02_checks / r02_subcat_checks_sum if r02_subcat_checks_sum > 0 else 1

for s in region02_stores:
    s['estimated_frov_checks'] = s['subcat_checks_sum'] * r02_dedup
    s['estimated_frov_penetration'] = s['estimated_frov_checks'] / s['total_receipts'] if s['total_receipts'] > 0 else 0

# --- Region 16: 5 subcats (col 2-6=checks, 7-11=pen, 12-16=sales, 17-21=rto) ---
ws16 = wb['16_магазины']
region16_stores = []
r16_subcat_checks_sum = 0

for row_num in range(14, ws16.max_row + 1):
    name = ws16.cell(row=row_num, column=1).value
    if name is None or 'Общий' in str(name):
        break
    cb = ws16.cell(row=row_num, column=2).value or 0
    cg = ws16.cell(row=row_num, column=3).value or 0
    cz = ws16.cell(row=row_num, column=4).value or 0
    co = ws16.cell(row=row_num, column=5).value or 0
    cf = ws16.cell(row=row_num, column=6).value or 0
    pb = ws16.cell(row=row_num, column=7).value or 0
    pg = ws16.cell(row=row_num, column=8).value or 0
    pz = ws16.cell(row=row_num, column=9).value or 0
    po = ws16.cell(row=row_num, column=10).value or 0
    pf = ws16.cell(row=row_num, column=11).value or 0
    sb = ws16.cell(row=row_num, column=12).value or 0
    sg = ws16.cell(row=row_num, column=13).value or 0
    sz = ws16.cell(row=row_num, column=14).value or 0
    so = ws16.cell(row=row_num, column=15).value or 0
    sf = ws16.cell(row=row_num, column=16).value or 0
    rb = ws16.cell(row=row_num, column=17).value or 0
    rg = ws16.cell(row=row_num, column=18).value or 0
    rz = ws16.cell(row=row_num, column=19).value or 0
    ro = ws16.cell(row=row_num, column=20).value or 0
    rf = ws16.cell(row=row_num, column=21).value or 0

    checks = [cb, cg, cz, co, cf]
    pens = [pb, pg, pz, po, pf]
    sales = [sb, sg, sz, so, sf]
    rtos = [rb, rg, rz, ro, rf]

    subcat_sum = sum(checks)
    r16_subcat_checks_sum += subcat_sum
    # ОВОЩИ is at index 3 in the 5-subcat array
    total_receipts = co / po if po and po > 0 else 0

    region16_stores.append({
        'name': name,
        'subcat_names': ['БАХЧЕВЫЕ КУЛЬТУРЫ', 'ГРИБЫ', 'ЗЕЛЕНЬ', 'ОВОЩИ', 'ФРУКТЫ'],
        'subcat_checks': checks,
        'subcat_penetrations': pens,
        'subcat_sales': sales,
        'subcat_rto': rtos,
        'subcat_checks_sum': subcat_sum,
        'total_receipts': total_receipts,
        'total_sales': sum(sales),
        'total_rto': sum(rtos),
    })

r16_dedup = r16_checks / r16_subcat_checks_sum if r16_subcat_checks_sum > 0 else 1

for s in region16_stores:
    s['estimated_frov_checks'] = s['subcat_checks_sum'] * r16_dedup
    s['estimated_frov_penetration'] = s['estimated_frov_checks'] / s['total_receipts'] if s['total_receipts'] > 0 else 0

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
        'region16': sorted(region16_stores, key=lambda x: x['estimated_frov_penetration'], reverse=True),
        'region02': sorted(region02_stores, key=lambda x: x['estimated_frov_penetration'], reverse=True),
        'r02_dedup_factor': r02_dedup,
        'r16_dedup_factor': r16_dedup,
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
