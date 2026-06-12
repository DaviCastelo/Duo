# DUO Estética Automotiva — Site

Site estático (HTML + CSS + JS puros, sem dependências). Basta hospedar a pasta em qualquer serviço de site estático (Vercel, Netlify, Cloudflare Pages, Hostinger…) ou abrir `index.html` direto no navegador.

## Estrutura

```
index.html              → página única com todas as seções
assets/css/style.css    → estilos (tokens de cor no topo, em :root)
assets/js/main.js       → interações (configurações no topo do arquivo)
assets/img/logo-duo.png → logo com fundo transparente (gerado do original)
logo-duo2-TGBnRiNw.jpg  → logo original (na verdade um PNG com alfa)
_analysis/              → arquivos de trabalho da análise do site antigo (pode apagar)
```

## Configurações rápidas

Em `assets/js/main.js` (primeiras linhas):

- `PROMO_END` — data/hora em que a contagem regressiva da promoção termina.
  Ex.: `"2026-06-27T23:59:59-03:00"`. Quando expira, o contador fica em zero.
- `WA_NUMBER` — número do WhatsApp usado pelo simulador de orçamento.

Os demais links de WhatsApp (botões com mensagens prontas) estão no `index.html` —
busque por `wa.me` para encontrá-los.

## Seções

Hero animado (partículas + parallax) · Estatísticas com contadores · Problemas ·
Marquee · Serviços (4 cards com spotlight) · Antes & Depois interativo (arraste) ·
**Monte seu orçamento** (gera mensagem pronta para o WhatsApp) · Processo (timeline
com progresso no scroll) · Depoimentos (carrossel com arraste) · Diferenciais ·
Promoção com contagem regressiva · FAQ · Localização com mapa · CTA final · Rodapé.

## Acessibilidade e performance

- Todos os efeitos respeitam `prefers-reduced-motion`.
- Comparador antes/depois funciona por toque, mouse e teclado (setas).
- Ícones em SVG, fontes via Google Fonts com `display=swap`, mapa com `loading="lazy"`.
# Duo
