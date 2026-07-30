"""批量导入职场英语PDF对话到后端数据库

用法: python import_pdfs.py /path/to/pdf/folder
     或 python import_pdfs.py  (默认读取 /Users/sherry/Downloads/NO.*职场英语*.pdf)

输出: 逐一导入，跳过已存在的对话ID，报告成功/失败数。
"""
import pdfplumber, re, requests, os, glob, sys

API_BASE = os.environ.get("API_BASE", "http://localhost:8920")

def extract_dialogue(path):
    """从PDF中提取对话数据"""
    fname = os.path.basename(path)
    m = re.match(r'NO\.(\d+)', fname)
    if not m: return None, "NO.nnn pattern not found"
    num = m.group(1)

    try:
        with pdfplumber.open(path) as pdf:
            all_lines = []
            for page in pdf.pages:
                t = page.extract_text() or ''
                t = t.replace('\x00', '')
                all_lines.extend(t.split('\n'))
    except Exception as e:
        return None, f"PDF read error: {e}"

    topic = summary = difficulty = stage_num = ""
    for l in all_lines:
        l = l.strip()
        if '主题分类' in l: topic = l.split('主题分类')[-1].strip('：: ')
        if '内容摘要' in l: summary = l.split('内容摘要')[-1].strip('：: ')
        if '本期难度' in l:
            m2 = re.search(r'⭐+', l); difficulty = m2.group() if m2 else ''
        if '学习期数' in l:
            m2 = re.search(r'(\d+)\s*/\s*\d+', l); stage_num = m2.group(1) if m2 else ''

    dlg_start = next((i for i,l in enumerate(all_lines) if '💬' in l and '情景对话' in l), -1)
    if dlg_start < 0:
        dlg_start = next((i for i,l in enumerate(all_lines) if l.strip() == '情景对话'), -1)
    if dlg_start < 0:
        return None, "no dialogue marker"

    dlg_end = next((i for i,l in enumerate(all_lines[dlg_start:], dlg_start) if '词汇积累' in l), len(all_lines))

    body = []
    cur_s, cur_t = None, []
    for i in range(dlg_start+1, dlg_end):
        l = all_lines[i].strip()
        if not l:
            if cur_s and cur_t: body.append({'s':cur_s,'t':' '.join(cur_t)}); cur_s=None; cur_t=[]
            continue
        if re.match(r'^[\u4e00-\u9fff]{2,}[：:]', l): continue
        if re.match(r'^\d+\.?\s*(MP3|MB|MB\))$', l, re.I): continue
        if re.match(r'^[\u4e00-\u9fff]{2,20}$', l): continue

        sp = re.match(r'^([A-Z][a-zA-Z\s]+?)\s*[：:]\s*(.+)', l)
        if sp:
            if cur_s and cur_t: body.append({'s':cur_s,'t':' '.join(cur_t)})
            cur_s, cur_t = sp.group(1).strip(), [sp.group(2).strip()]
        elif cur_s:
            cur_t.append(l)
    if cur_s and cur_t: body.append({'s':cur_s,'t':' '.join(cur_t)})

    if not body:
        return None, "no body extracted"

    for b in body:
        t = b['t']
        t = re.sub(r'\d+\.?\s*(MP3|MB)\s*\d*\.?\d*\s*MB', '', t, flags=re.I)
        t = re.sub(r'[\u4e00-\u9fff]{4,}$', '', t)
        t = re.sub(r'\s{2,}', ' ', t).strip().rstrip('。，,.; ')
        b['t'] = t

    kw_set = set()
    stop = {'that','this','with','your','have','from','been','were','will','they','their','there',
            'about','which','would','could','should','tell','little','over','more','once','what',
            'when','does','some','just','like','very','also','only','then','into','than','well',
            'need','here','know','think','want','make','take','look','come','back','work','good'}
    for b in body:
        for w in re.findall(r'\b[a-zA-Z]{4,}\b', b['t']):
            if w.lower() not in stop: kw_set.add(w.lower())

    cat_map = {'求职':'biz','面试':'biz','会议':'biz','邮件':'biz','出差':'travel','日常':'daily',
               '汇报':'biz','演讲':'biz','电话':'biz','客户':'biz','社交':'daily','谈判':'biz',
               '招聘':'biz','培训':'biz','请假':'daily','投诉':'biz','商务':'biz','销售':'biz',
               '营销':'biz','金融':'finance','物流':'biz','供应链':'biz'}
    cat = next((v for k,v in cat_map.items() if k in (topic or '')), 'biz')

    data = {
        'id': f'NO.{num.zfill(3)}',
        'scene': f'NO.{num} {topic or ""} - {summary[:30] if summary else ""}',
        'desc': summary,
        'body': body,
        'keywords': list(kw_set)[:10],
        'cat': cat,
        'level': 'B2' if len(difficulty)<=3 else 'C1',
        'stage': topic or '职场英语',
        'stage_order': int(stage_num or num)
    }
    return data, None

def main():
    pdf_dir = sys.argv[1] if len(sys.argv) > 1 else "/Users/sherry/Downloads"
    pattern = os.path.join(pdf_dir, "NO.*职场英语*.pdf")
    pdfs = sorted(glob.glob(pattern))
    if not pdfs:
        print(f"No PDFs found matching: {pattern}")
        return

    print(f"Found {len(pdfs)} PDFs. API base: {API_BASE}")
    imported = errors = 0
    for path in pdfs:
        fname = os.path.basename(path)
        data, err = extract_dialogue(path)
        if err:
            print(f"  SKIP {fname}: {err}")
            errors += 1
            continue
        resp = requests.post(f"{API_BASE}/api/dialogues", json=data)
        if resp.status_code in (200,201):
            imported += 1
        else:
            print(f"  FAIL {fname}: HTTP {resp.status_code} {resp.text[:100]}")
            errors += 1
    print(f"\nDone: {imported} imported, {errors} errors, {len(pdfs)} total")

if __name__ == "__main__":
    main()
