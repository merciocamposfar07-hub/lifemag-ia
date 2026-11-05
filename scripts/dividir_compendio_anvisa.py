#!/usr/bin/env python3
"""Divide PDFs oficiais por páginas sem perder cobertura. Dependência: pip install pypdf.
Uso: python scripts/dividir_compendio_anvisa.py volume.pdf --catalog-id fb8-volume-ii-plantas
Os PDFs e textos não são enviados ao GitHub.
"""
import argparse
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from pypdf import PdfReader, PdfWriter

VALID_IDS = {
    'fb8-volume-i', 'fb8-volume-ii-dispositivos', 'fb8-volume-ii-gases',
    'fb8-volume-ii-hemocomponentes', 'fb8-volume-ii-insumos',
    'fb8-volume-ii-plantas', 'fb8-volume-ii-biologicos',
    'fb8-volume-ii-radiofarmacos', 'fn3-2026', 'fffb3-2026',
}

def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()

def serialize_pages(reader, start, end):
    writer = PdfWriter()
    for page in range(start, end):
        writer.add_page(reader.pages[page])
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()

def fit_span(reader, start, end, max_bytes):
    pdf = serialize_pages(reader, start, end)
    if len(pdf) <= max_bytes:
        return [(start, end, pdf)]
    if end - start == 1:
        raise ValueError(f'A página {start + 1} isolada ultrapassa o limite; use infraestrutura maior')
    middle = (start + end) // 2
    return fit_span(reader, start, middle, max_bytes) + fit_span(reader, middle, end, max_bytes)

def split_pdf(source, catalog_id, outdir, max_bytes=40 * 1024 * 1024):
    source, outdir = Path(source).resolve(), Path(outdir).resolve()
    if catalog_id not in VALID_IDS:
        raise ValueError('Identificador fora do catálogo oficial LifeMag IA')
    if not source.is_file() or source.suffix.lower() != '.pdf':
        raise ValueError('Selecione um PDF existente')
    with source.open('rb') as handle:
        if handle.read(5) != b'%PDF-':
            raise ValueError('Arquivo sem assinatura PDF')
    if outdir.exists() and any(outdir.iterdir()):
        raise FileExistsError('Pasta de destino deve estar vazia para não misturar versões')
    reader = PdfReader(str(source), strict=True)
    if reader.is_encrypted:
        raise ValueError('PDF com senha não é permitido')
    total = len(reader.pages)
    if total < 1:
        raise ValueError('PDF sem páginas')
    outdir.mkdir(parents=True, exist_ok=True)
    target_pages = max(1, int(total * max_bytes / max(source.stat().st_size, 1) * 0.75))
    spans = []
    for start in range(0, total, target_pages):
        spans.extend(fit_span(reader, start, min(total, start + target_pages), max_bytes))
    parts = []
    for number, (start, end, data) in enumerate(spans, 1):
        filename = f'{catalog_id}__parte-{number:03d}-de-{len(spans):03d}.pdf'
        (outdir / filename).write_bytes(data)
        parts.append({
            'filename': filename, 'partNumber': number, 'partCount': len(spans),
            'pageStart': start + 1, 'pageEnd': end, 'totalPages': total,
            'pdfSha256': hashlib.sha256(data).hexdigest(), 'pdfBytes': len(data),
        })
    if parts[0]['pageStart'] != 1 or parts[-1]['pageEnd'] != total or any(
        prev['pageEnd'] + 1 != nxt['pageStart'] for prev, nxt in zip(parts, parts[1:])
    ):
        raise AssertionError('Cobertura de páginas incompleta')
    manifest = {
        'schema': 'lifemag-anvisa-parts-v1', 'catalogId': catalog_id,
        'originalFilename': source.name, 'originalSha256': sha256_file(source),
        'totalPages': total, 'totalParts': len(parts),
        'generatedAt': datetime.now(timezone.utc).isoformat(), 'parts': parts,
    }
    (outdir / 'manifesto-anvisa.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return manifest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--catalog-id', required=True, choices=sorted(VALID_IDS))
    parser.add_argument('--saida', type=Path)
    parser.add_argument('--max-mib', type=int, default=40)
    args = parser.parse_args()
    if not 1 <= args.max_mib <= 40:
        parser.error('--max-mib deve estar entre 1 e 40')
    out = args.saida or Path.cwd() / 'saida-anvisa' / args.catalog_id
    result = split_pdf(args.pdf, args.catalog_id, out, args.max_mib * 1024 * 1024)
    print(f"{result['catalogId']}: {result['totalPages']} páginas, "
          f"{result['totalParts']} partes. Pasta local: {out}")
    print('Selecione o manifesto e TODAS as partes na Central Científica do LifeMag IA.')

if __name__ == '__main__':
    main()
