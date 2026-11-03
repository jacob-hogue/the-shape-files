import re, sys, statistics
text = open(sys.argv[1], encoding="utf-8").read()
body = re.sub(r"`{3}.*?`{3}", "", text, flags=re.S)        # ignore code blocks
body = re.sub(r"^---\n.*?\n---\n", "", body, flags=re.S)   # ignore front matter
prose = re.sub(r"^\s*(\||<|!\[|:::|#\|).*$", "", body, flags=re.M)  # ignore tables, html, images, divs, chunk options
BANNED = r"""\b(delve|delving|dive into|deep dive|landscape(?! architect)|realm|leverag\w*|utiliz\w*|harness\w*|robust|seamless\w*|cutting-edge|state-of-the-art|crucial|pivotal|vital|paramount|revolutioni[sz]\w*|game-chang\w*|transformative|groundbreaking|testament|underscor\w*|showcas\w*|foster\w*|bolster\w*|elevat(e|es|ed|ing)|empower\w*|streamlin\w*|myriad|plethora|intricate|multifaceted|tapestry|embark\w*|unlock\w*|unleash\w*|journey|navigat(e|es|ing)|moreover|furthermore|additionally|notably|interestingly|in conclusion|ultimately|in summary|all in all|ever-evolving|rapidly evolving|fast-paced|in today'?s|imagine a world|it'?s (important|worth) (to note|noting)|not just|more than just|here'?s the thing|the science of where|location intelligence|spatial is special|whether you'?re a)\b"""
BRIT = r"\b(colour\w*|centre\w*|grey\w*|analys(e|ed|ing)|organis\w*|catalogue|modell\w*|travell\w*|programme\w*|metre\w*|defence|licence|favour\w*|behaviour\w*|labour\w*|towards|amongst|whilst)\b"
hits = []
for n, line in enumerate(prose.splitlines(), 1):
    for m in re.finditer(BANNED, line, re.I): hits.append((n, "banned", m.group(0)))
    for m in re.finditer(BRIT, line, re.I): hits.append((n, "british", m.group(0)))
    if "!" in re.sub(r"!\[", "", line) and not line.lstrip().startswith(">"): hits.append((n, "exclamation", line.strip()[:60]))
    if re.search(r"(?<!^)\*\*[^*]+\*\*", line.strip()) and not line.lstrip().startswith(("-", "*", "|")): hits.append((n, "inline bold", line.strip()[:60]))
    h = re.match(r"^#{2,6}\s+(.*)", line)
    if h:
        words = [w for w in re.findall(r"[A-Za-z][\w'-]*", h.group(1)) if len(w) > 3]
        if len(words) >= 3 and sum(w[0].isupper() for w in words[1:]) >= len(words[1:]) - 1: hits.append((n, "title case heading", h.group(1)))
        if h.group(1).rstrip().endswith("?"): hits.append((n, "question heading", h.group(1)))
words = len(re.findall(r"\w+", prose)); dashes = prose.count("—")
if words and dashes / words * 300 > 1: hits.append((0, "em dashes", f"{dashes} in {words} words (limit 1 per 300)"))
paras = [p for p in re.split(r"\n\s*\n", prose) if len(p.split()) > 25 and not p.lstrip().startswith(("#", "-", "*", "1."))]
if len(paras) >= 6:
    lens = [len(re.findall(r"[.?]\s", p + " ")) for p in paras]
    if statistics.pstdev(lens) < 0.8: hits.append((0, "uniform paragraphs", f"sentence counts {lens}"))
for h in hits: print(f"{h[0]:>5}  {h[1]:<20} {h[2]}")
print(f"{len(hits)} issue(s)")
