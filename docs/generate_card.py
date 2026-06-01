"""
Genesis Framework — Social Preview Card Generator
Gera um card 1280x640 para usar como social preview do repositório GitHub.
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

# ── Paleta ──────────────────────────────────────────────────────────────────
BG_DARK      = (13,  17,  23)    # #0d1117  GitHub dark
BG_CARD      = (22,  27,  34)    # #161b22
BG_TERMINAL  = (1,   4,   9)    # #010409
BLUE         = (74,  158, 255)   # #4a9eff
BLUE_DIM     = (32,  78,  138)   # dim blue for borders
BLUE_GLOW    = (74,  158, 255, 40)
GREEN        = (35,  134, 54)    # #238636
TEXT_WHITE   = (230, 230, 240)
TEXT_GRAY    = (139, 148, 158)   # #8b949e
TEXT_CYAN    = (121, 192, 255)   # #79c0ff
TEXT_GREEN   = (87,  212, 87)    # terminal green
TEXT_YELLOW  = (255, 212, 0)
BORDER       = (48,  54,  61)    # #30363d

W, H = 1280, 640

# ── Fontes ────────────────────────────────────────────────────────────────
def load_font(size, bold=False):
    """Tenta fontes melhores, cai para default se não tiver."""
    candidates = []
    if bold:
        candidates = [
            "C:/Windows/Fonts/consolab.ttf",   # Consolas Bold
            "C:/Windows/Fonts/cour.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/consola.ttf",    # Consolas
            "C:/Windows/Fonts/cour.ttf",       # Courier New
            "C:/Windows/Fonts/lucon.ttf",      # Lucida Console
            "C:/Windows/Fonts/arial.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

# ── Helpers ──────────────────────────────────────────────────────────────────
def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = xy
    r = radius
    if fill:
        draw.rectangle([x0+r, y0, x1-r, y1], fill=fill)
        draw.rectangle([x0, y0+r, x1, y1-r], fill=fill)
        draw.ellipse([x0, y0, x0+2*r, y0+2*r], fill=fill)
        draw.ellipse([x1-2*r, y0, x1, y0+2*r], fill=fill)
        draw.ellipse([x0, y1-2*r, x0+2*r, y1], fill=fill)
        draw.ellipse([x1-2*r, y1-2*r, x1, y1], fill=fill)
    if outline:
        draw.arc([x0, y0, x0+2*r, y0+2*r], 180, 270, fill=outline, width=width)
        draw.arc([x1-2*r, y0, x1, y0+2*r], 270, 360, fill=outline, width=width)
        draw.arc([x0, y1-2*r, x0+2*r, y1], 90, 180,  fill=outline, width=width)
        draw.arc([x1-2*r, y1-2*r, x1, y1], 0,  90,   fill=outline, width=width)
        draw.line([x0+r, y0, x1-r, y0], fill=outline, width=width)
        draw.line([x0+r, y1, x1-r, y1], fill=outline, width=width)
        draw.line([x0, y0+r, x0, y1-r], fill=outline, width=width)
        draw.line([x1, y0+r, x1, y1-r], fill=outline, width=width)

def glow_circle(img, center, radius, color, layers=6):
    """Adiciona círculo com efeito glow."""
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    r, g, b = color[:3]
    for i in range(layers, 0, -1):
        alpha = int(30 * (i / layers))
        rad   = radius + (layers - i) * 18
        d.ellipse([center[0]-rad, center[1]-rad, center[0]+rad, center[1]+rad],
                  fill=(r, g, b, alpha))
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

# ── Grid de pontos no fundo ──────────────────────────────────────────────────
def draw_dot_grid(draw, spacing=40, color=(255,255,255,18)):
    for x in range(0, W, spacing):
        for y in range(0, H, spacing):
            draw.ellipse([x-1, y-1, x+1, y+1], fill=color[:3])

# ── Linhas de código no terminal ─────────────────────────────────────────────
TERMINAL_LINES = [
    ("$", " /genesis", "cmd"),
    ("", "", "blank"),
    ("⬡", " Initializing Genesis Framework v1.0.0", "info"),
    ("", "", "blank"),
    ("→", " genesis-intake    ", "arrow"),
    (" ", "   Collecting requirements...", "dim"),
    ("✓", " manifest.md created", "ok"),
    ("", "", "blank"),
    ("→", " genesis-architect ", "arrow"),
    (" ", "   C4 diagrams · ADRs · tech stack", "dim"),
    ("✓", " architecture/ generated", "ok"),
    ("", "", "blank"),
    ("→", " genesis-sprint    ", "arrow"),
    (" ", "   Sprint 1/3 — 8 tasks", "dim"),
    ("✓", " 24 tests passing · 91% coverage", "ok"),
    ("", "", "blank"),
    ("⬡", " Done. Your software is ready.", "info"),
]

LINE_COLORS = {
    "cmd":   TEXT_WHITE,
    "info":  BLUE,
    "arrow": TEXT_YELLOW,
    "dim":   TEXT_GRAY,
    "ok":    TEXT_GREEN,
    "blank": BG_TERMINAL,
}

def main():
    img  = Image.new("RGB", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)

    # ── Background: grid de pontos ──
    for x in range(0, W, 44):
        for y in range(0, H, 44):
            draw.ellipse([x-1, y-1, x+1, y+1], fill=(255,255,255,12) if False else (30,37,46))

    # ── Glows de fundo ──
    img = glow_circle(img, (980, 120), 90, BLUE, layers=8)
    img = glow_circle(img, (180, 520), 60, (35,134,54), layers=6)
    img = glow_circle(img, (1200, 580), 50, BLUE, layers=5)
    draw = ImageDraw.Draw(img)

    # ── Linha decorativa topo ──
    for x in range(0, W, 3):
        alpha = int(180 * math.sin(math.pi * x / W))
        c = int(BLUE[0] * alpha / 255)
        draw.point((x, 0), fill=(0, c, alpha))
    draw.line([(0, 1), (W, 1)], fill=(*BLUE, 60), width=1)

    # ═══════════════════════════════════════════════════════════
    # ESQUERDA — Branding
    # ═══════════════════════════════════════════════════════════
    LEFT_X = 64
    CY     = 100

    # Badge "v1.0.0"
    badge_font = load_font(13)
    badge_text = "  v1.0.0  "
    bw = 70
    rounded_rect(draw, [LEFT_X, CY, LEFT_X+bw, CY+24], radius=5,
                 fill=BLUE_DIM, outline=BLUE, width=1)
    draw.text((LEFT_X+10, CY+4), "v1.0.0", font=badge_font, fill=BLUE)

    # Badge "Open Source"
    rounded_rect(draw, [LEFT_X+bw+10, CY, LEFT_X+bw+95, CY+24], radius=5,
                 fill=(35,134,54,40) if False else (22,42,30), outline=GREEN, width=1)
    draw.text((LEFT_X+bw+18, CY+4), "MIT License", font=badge_font, fill=(87,212,87))

    # Nome GENESIS
    font_big  = load_font(88, bold=True)
    font_med  = load_font(22)
    font_sm   = load_font(16)
    font_mono = load_font(14)

    draw.text((LEFT_X, CY+38), "GENESIS", font=font_big, fill=TEXT_WHITE)

    # Linha azul sob o nome
    name_w = 430
    draw.line([(LEFT_X, CY+138), (LEFT_X+name_w, CY+138)], fill=BLUE, width=2)

    # Tagline
    draw.text((LEFT_X, CY+150),
              "Build production-ready software",
              font=font_med, fill=TEXT_WHITE)
    draw.text((LEFT_X, CY+178),
              "from a description.",
              font=font_med, fill=BLUE)

    # Descrição
    desc_y = CY + 225
    draw.text((LEFT_X, desc_y),
              "A multi-agent engineering framework that generates",
              font=font_sm, fill=TEXT_GRAY)
    draw.text((LEFT_X, desc_y+22),
              "architecture, ADRs, code and tests for any stack.",
              font=font_sm, fill=TEXT_GRAY)

    # Tags / pills
    tags = ["ai-agents", "any language", "any stack", "adr-first", "test pyramid"]
    tx = LEFT_X
    ty = desc_y + 68
    tag_font = load_font(13)
    for tag in tags:
        tw = len(tag) * 7 + 18
        rounded_rect(draw, [tx, ty, tx+tw, ty+24], radius=12,
                     fill=(22,27,34), outline=BORDER, width=1)
        draw.text((tx+9, ty+5), tag, font=tag_font, fill=TEXT_GRAY)
        tx += tw + 10

    # GitHub URL
    url_y = H - 68
    draw.text((LEFT_X, url_y),
              "github.com/rafaeldourado9/genesis",
              font=font_sm, fill=TEXT_GRAY)

    # Ícone GitHub (círculo simples)
    gh_x = LEFT_X - 2
    draw.ellipse([gh_x - 20, url_y + 1, gh_x + 2, url_y + 23], outline=TEXT_GRAY, width=1)

    # Agentes count
    draw.text((LEFT_X, url_y + 28),
              "13 specialized agents  ·  MIT License  ·  works with any AI coding agent",
              font=load_font(12), fill=(60,70,80))

    # ═══════════════════════════════════════════════════════════
    # DIREITA — Terminal
    # ═══════════════════════════════════════════════════════════
    TERM_X = 680
    TERM_Y = 52
    TERM_W = 560
    TERM_H = 530

    # Sombra do terminal
    shadow = Image.new("RGBA", img.size, (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    for off in range(1, 10):
        alpha = max(0, 60 - off*6)
        rounded_rect(sd, [TERM_X+off, TERM_Y+off, TERM_X+TERM_W+off, TERM_Y+TERM_H+off],
                     radius=12, fill=(0,0,0,alpha))
    img = Image.alpha_composite(img.convert("RGBA"), shadow).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Terminal background
    rounded_rect(draw, [TERM_X, TERM_Y, TERM_X+TERM_W, TERM_Y+TERM_H],
                 radius=12, fill=BG_TERMINAL, outline=BORDER, width=1)

    # Barra de título do terminal
    bar_h = 36
    rounded_rect(draw, [TERM_X, TERM_Y, TERM_X+TERM_W, TERM_Y+bar_h],
                 radius=12, fill=(28,33,40))
    draw.rectangle([TERM_X, TERM_Y+bar_h//2, TERM_X+TERM_W, TERM_Y+bar_h],
                   fill=(28,33,40))

    # Linha separadora da barra
    draw.line([(TERM_X, TERM_Y+bar_h), (TERM_X+TERM_W, TERM_Y+bar_h)],
              fill=BORDER, width=1)

    # Botões do terminal (macOS style)
    dot_y = TERM_Y + bar_h // 2
    for dx, col in [(18, (255,95,86)), (38, (255,189,46)), (58, (39,201,63))]:
        draw.ellipse([TERM_X+dx-5, dot_y-5, TERM_X+dx+5, dot_y+5], fill=col)

    # Título da janela
    title_font = load_font(13)
    draw.text((TERM_X + TERM_W//2 - 40, dot_y - 7),
              "genesis — zsh", font=title_font, fill=TEXT_GRAY)

    # Conteúdo do terminal
    mono   = load_font(14)
    mono_b = load_font(14, bold=True)
    line_h = 26
    ty2    = TERM_Y + bar_h + 18

    for (prefix, text, style) in TERMINAL_LINES:
        if style == "blank":
            ty2 += line_h // 2
            continue

        color = LINE_COLORS.get(style, TEXT_WHITE)

        if prefix:
            pfx_color = {
                "cmd":   TEXT_GREEN,
                "info":  BLUE,
                "arrow": TEXT_YELLOW,
                "ok":    TEXT_GREEN,
                " ":     BG_TERMINAL,
            }.get(prefix, TEXT_GRAY)

            px = TERM_X + 20
            draw.text((px, ty2), prefix, font=mono_b, fill=pfx_color)

        if text:
            tx2 = TERM_X + 38
            if style == "cmd":
                draw.text((tx2, ty2), text, font=mono_b, fill=TEXT_WHITE)
            elif style == "dim":
                draw.text((tx2 + 12, ty2), text, font=mono, fill=TEXT_GRAY)
            else:
                draw.text((tx2, ty2), text, font=mono, fill=color)

        ty2 += line_h

    # Cursor piscando (estático)
    draw.rectangle([TERM_X+38, ty2, TERM_X+46, ty2+16], fill=BLUE)

    # ── Borda esquerda colorida ──
    draw.line([(0, 0), (0, H)], fill=BLUE, width=3)

    # ── Linha inferior decorativa ──
    draw.line([(0, H-1), (W, H-1)], fill=BORDER, width=1)

    # ── Salvar ──
    out = "D:/tools/genesis/docs/assets/genesis-social-card.png"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "PNG", optimize=True)
    print(f"Card salvo: {out}")
    print(f"Tamanho: {W}x{H}px")
    img_size = os.path.getsize(out) / 1024
    print(f"Arquivo: {img_size:.1f} KB")

if __name__ == "__main__":
    main()
