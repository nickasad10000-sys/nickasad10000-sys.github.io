"""
Render mascot output to PNG to inspect visual quality
"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8")
HTML = r"file:///C:/Users/Syahfalah/nickasad10000-sys.github.io/tests/mascot-output.html"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 500, "height": 700})
        page = await ctx.new_page()
        await page.goto(HTML, wait_until="load", timeout=10000)
        await page.wait_for_timeout(1000)
        out = Path(r"C:\Users\Syahfalah\nickasad10000-sys.github.io\tests\mascot-preview.png")
        await page.screenshot(path=str(out), omit_background=False, full_page=False)
        print(f"shot: {out}")

        # Also count svg elements
        info = await page.evaluate("""() => {
          const svg = document.querySelector('svg');
          if (!svg) return {error: 'no svg'};
          return {
            paths: svg.querySelectorAll('path').length,
            circles: svg.querySelectorAll('circle').length,
            ellipses: svg.querySelectorAll('ellipse').length,
            polygons: svg.querySelectorAll('polygon').length,
            rects: svg.querySelectorAll('rect').length,
            groups: svg.querySelectorAll('g').length,
            gradients: svg.querySelectorAll('linearGradient,radialGradient').length,
            filters: svg.querySelectorAll('filter').length,
          };
        }""")
        print("svg content:", info)
        await b.close()

asyncio.run(main())
