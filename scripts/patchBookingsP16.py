from pathlib import Path

p = Path("frontend/src/pages/AdminBookingsPage.jsx")
text = p.read_text(encoding="utf-8")
start = text.index("      {/* Filters */}")
end = text.index("      {selected && <DetailModal")
new = Path("scripts/_bookings_snippet.jsx").read_text(encoding="utf-8")
p.write_text(text[:start] + new + text[end:], encoding="utf-8")
print("ok", end - start)
