"""
PROMPT 14 — Patch locales FR/EN/AR/ES for leftover English UI strings.
"""
from pathlib import Path
import json

ROOT = Path('frontend/public/locales')
PATCHES = {
    'fr': {
        ('analytics', 'title'): 'Tableau de bord analytique',
        ('analytics', 'export_csv'): 'Exporter CSV',
        ('inquiries', 'title'): 'Demandes',
        ('nav', 'analytics'): 'Statistiques',
        ('nav', 'dashboard'): 'Tableau de bord',
        ('nav', 'my_products'): 'Mes produits',
        ('nav', 'my_bookings'): 'Mes réservations',
        ('nav', 'search'): 'Recherche',
        ('operator', 'dashboard', 'pending_bookings'): '{{count}} réservation en attente',
        ('operator', 'dashboard', 'pending_bookings_plural'): '{{count}} réservations en attente',
        ('operator', 'dashboard', 'no_recent_bookings'): 'Aucune réservation récente',
        ('operator', 'dashboard', 'view_all_bookings'): 'Voir toutes les réservations →',
        ('admin', 'common', 'na'): '—',
    },
    'en': {
        ('nav', 'analytics'): 'Analytics',
        ('nav', 'dashboard'): 'Dashboard',
        ('nav', 'my_products'): 'My products',
        ('nav', 'my_bookings'): 'My bookings',
        ('nav', 'search'): 'Search',
        ('operator', 'dashboard', 'pending_bookings'): '{{count}} pending booking',
        ('operator', 'dashboard', 'pending_bookings_plural'): '{{count}} pending bookings',
        ('operator', 'dashboard', 'no_recent_bookings'): 'No recent bookings',
        ('operator', 'dashboard', 'view_all_bookings'): 'View all bookings →',
    },
    'es': {
        ('nav', 'analytics'): 'Estadísticas',
        ('nav', 'dashboard'): 'Panel',
        ('nav', 'my_products'): 'Mis productos',
        ('nav', 'my_bookings'): 'Mis reservas',
        ('nav', 'search'): 'Buscar',
        ('operator', 'dashboard', 'pending_bookings'): '{{count}} reserva pendiente',
        ('operator', 'dashboard', 'pending_bookings_plural'): '{{count}} reservas pendientes',
        ('operator', 'dashboard', 'no_recent_bookings'): 'No hay reservas recientes',
        ('operator', 'dashboard', 'view_all_bookings'): 'Ver todas las reservas →',
        ('analytics', 'title'): 'Panel de analítica',
        ('analytics', 'export_csv'): 'Exportar CSV',
        ('inquiries', 'title'): 'Consultas',
    },
    'ar': {
        ('nav', 'analytics'): 'الإحصائيات',
        ('nav', 'dashboard'): 'لوحة التحكم',
        ('nav', 'my_products'): 'منتجاتي',
        ('nav', 'my_bookings'): 'حجوزاتي',
        ('nav', 'search'): 'بحث',
        ('operator', 'dashboard', 'pending_bookings'): 'حجز واحد قيد الانتظار',
        ('operator', 'dashboard', 'pending_bookings_plural'): '{{count}} حجوزات قيد الانتظار',
        ('operator', 'dashboard', 'no_recent_bookings'): 'لا توجد حجوزات حديثة',
        ('operator', 'dashboard', 'view_all_bookings'): 'عرض كل الحجوزات ←',
        ('analytics', 'title'): 'لوحة التحليلات',
        ('analytics', 'export_csv'): 'تصدير CSV',
        ('inquiries', 'title'): 'الاستفسارات',
    },
}


def set_path(obj, path, value):
    cur = obj
    for key in path[:-1]:
        if key not in cur or not isinstance(cur[key], dict):
            cur[key] = {}
        cur = cur[key]
    cur[path[-1]] = value


def patch_nested_fr_inquiries_empty(data):
    inq = data.get('inquiries') or {}
    if isinstance(inq.get('empty_title'), str) and 'inquiry' in inq['empty_title'].lower():
        inq['empty_title'] = 'Aucune demande pour le moment'
    # analytics nested inquiries label
    charts = (data.get('analytics') or {}).get('charts') or {}
    if charts.get('funnel_inquiries') == 'Inquiries':
        charts['funnel_inquiries'] = 'Demandes'
    stats = (data.get('analytics') or {}).get('stats') or {}
    if stats.get('inquiries') == 'Inquiries':
        stats['inquiries'] = 'Demandes'


for lang, patches in PATCHES.items():
    path = ROOT / lang / 'translation.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    for keys, value in patches.items():
        set_path(data, keys, value)
    if lang == 'fr':
        patch_nested_fr_inquiries_empty(data)
        # also patch analytics.stats.inquiries if present
        stats = (data.get('analytics') or {}).get('stats')
        if isinstance(stats, dict) and stats.get('inquiries') == 'Inquiries':
            stats['inquiries'] = 'Demandes'
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('patched', lang)
