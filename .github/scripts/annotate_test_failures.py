"""Publica o motivo das falhas de teste como avisos no resumo do GitHub Actions.

Os registros completos só aparecem para quem está logado no GitHub; os avisos
(annotations) aparecem para todos, inclusive pela API pública.
"""
import glob
import re

shown = 0
for path in sorted(glob.glob('target/surefire-reports/*.txt')):
    text = open(path, encoding='utf-8', errors='replace').read()
    if 'FAILURE' not in text and '<<< ERROR' not in text:
        continue
    name = path.split('/')[-1]
    # A última "Caused by" costuma ser a causa real; as asserções mostram o esperado x obtido
    lines = re.findall(r'^(?:Caused by: .*|.*(?:expected|Expected|AssertionError|Exception:).*)$', text, re.MULTILINE)
    for line in (lines[-5:] if lines else text.splitlines()[:5]):
        print(f"::error title={name}::{line.strip()[:400]}")
        shown += 1
    if shown >= 9:  # o GitHub mostra até 10 avisos por passo
        break
